import {
  existsSync,
  globSync,
  mkdirSync,
  readFileSync,
  readSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, delimiter, dirname, join, resolve } from "node:path";
import { availableParallelism } from "node:os";
import type { CheckResult, CheckStatus, TraceStep } from "./check";
import { defineCommand, type ParsedArgs } from "./cli-options";
import { parseConfig } from "./config";
import {
  createSanyError,
  getErrorExitCode,
  TlaConfigError,
  TlaError,
  TlaEvaluationError,
  TlaProofError,
  TlaSyntaxError,
  type SanyReport,
} from "./errors";
import { EXIT_STATUS } from "./exit-codes";
import type { LineRange } from "./obligation-generate";
import { getAtPrefix, getLocusText } from "./obligation-expression";
import { formatSummary, getObligations, WHOLE_MODULE, type ModuleObligations } from "./obligations";
import { check } from "./parallel";
import { parseModule } from "./parser";
import type { StateDump } from "./state-graph";
import {
  formatProbability,
  getActualProbability,
  getOptimisticProbability,
  getOutDegreeSummary,
} from "./tlc-summary";
import { formatState, type Value } from "./values";

const EXIT_CODES: Record<CheckStatus, number> = {
  success: EXIT_STATUS.success,
  "assumption-violation": EXIT_STATUS.assumptionViolation,
  deadlock: EXIT_STATUS.deadlock,
  "invariant-violation": EXIT_STATUS.safetyViolation,
  "property-violation": EXIT_STATUS.safetyViolation,
  "liveness-violation": EXIT_STATUS.livenessViolation,
  "postcondition-violation": EXIT_STATUS.assumptionViolation,
  error: EXIT_STATUS.error,
};

const CHECK_COMMAND = defineCommand("tla-ts <Spec.tla|Spec.cfg|glob>... {options}", [
  { flag: "-config <Spec.cfg>" },
  { flag: "-deadlock" },
  // Like TLC, -dump takes a format only when the next argument starts with dot and a file follows.
  {
    flag: "-dump [<format>] <file>",
    getArity: (rest) => (rest.length > 1 && rest[0].startsWith("dot") ? 2 : 1),
  },
  { flag: "-lncheck <final|default>" },
  { flag: "-seed <num>" },
  { flag: "-workers <count|auto>" },
]);

const PROVE_COMMAND = defineCommand("tla-ts prove {options} <Module.tla|glob>...", [
  { flag: "-N", isRequired: true },
  { flag: "--toolbox <start> <end>" },
  { flag: "--line <num>" },
  { flag: "--printallobs" },
  { flag: "--summary" },
  { flag: "--strict" },
  { flag: "-I <directory>", isRepeatable: true },
]);

const USAGE = [
  `Usage: ${CHECK_COMMAND.usage}`,
  `       ${PROVE_COMMAND.usage}`,
  "       tla-ts prove [<tlapm option>]... <Module.tla|glob>...",
].join("\n");

const GLOB_CHARACTERS = /[*?[{]/;

interface InputPath {
  path: string;
  isGlobbed: boolean;
}

const getInputPaths = (paths: string[]): InputPath[] =>
  paths.flatMap((arg): InputPath[] =>
    GLOB_CHARACTERS.test(arg)
      ? globSync(arg)
          .sort()
          .map((path) => ({ path, isGlobbed: true }))
      : [{ path: arg, isGlobbed: false }],
  );

const isJavaLong = (text: string) =>
  /^[+-]?\d+$/.test(text) && BigInt.asIntN(64, BigInt(text)) === BigInt(text);

const getWorkerCount = (values: string[] | undefined) => {
  if (!values) return 1;
  return values[0] === "auto"
    ? availableParallelism()
    : Math.max(1, Number.parseInt(values[0], 10) || 1);
};

const printState = (state: Record<string, Value>) => console.log(formatState(state));

const UNSUPPORTED_DUMP_FORMATS = ["constrained", "stuttering", "strict"];

// TLC names the file of a -dump by its format unless the name already ends that way.
const getDumpPath = (path: string, extension: string) =>
  path.endsWith(extension) ? path : `${path}${extension}`;

const getDump = (values: string[]): StateDump => {
  if (values.length === 1) return { path: getDumpPath(values[0], ".dump") };
  const format = values[0].toLowerCase();
  return {
    path: getDumpPath(values[1], ".dot"),
    dot: true,
    colorize: format.includes("colorize"),
    actionLabels: format.includes("actionlabels"),
    snapshot: format.includes("snapshot"),
  };
};

const printTrace = (trace: TraceStep[], heading = "Error: The behavior up to this point is:") => {
  if (trace.length > 0) console.log(heading);
  trace.forEach((step, index) => {
    console.log(`State ${index + 1}: <${step.label ?? step.action ?? "Initial predicate"}>`);
    printState(step.state);
  });
};

const getTemporalHeadline = (names: string[]) =>
  names.length === 1
    ? `Error: Temporal property ${names[0]} was violated.\n`
    : `Error: Temporal properties ${names.slice(0, -1).join(", ")}${names.length > 2 ? "," : ""} and ${names[names.length - 1]} were violated.\n`;

const printResult = (result: CheckResult) => {
  if (result.failure) {
    console.log(`Error: ${result.failure.message}`);
    if (result.failure.initialState) {
      console.log("While working on the initial state:");
      printState(result.failure.initialState);
    }
    printTrace(result.failure.trace);
  } else if (result.violation) {
    const violation = result.violation;
    const name = violation.name;
    const loopStart = violation.loopStart;
    // TLC prints a violation by an initial state without the behavior or the statistics.
    const isInitial =
      loopStart === undefined &&
      violation.trace.length === 1 &&
      (result.status === "invariant-violation" || result.status === "liveness-violation");
    const headline = {
      success: "",
      error: "",
      "assumption-violation": violation.message
        ? `Error: Evaluating assumption ${name} failed.\n${violation.message}`
        : `Error: Assumption ${name} is false.`,
      deadlock: "Error: Deadlock reached.",
      "invariant-violation": isInitial
        ? `Error: Invariant ${name} is violated by the initial state:`
        : `Error: Invariant ${name} is violated.`,
      "property-violation": getTemporalHeadline(violation.properties ?? [name]),
      "liveness-violation":
        loopStart !== undefined
          ? getTemporalHeadline(violation.properties ?? [name])
          : isInitial
            ? `Error: Property ${name} is violated by the initial state:`
            : `Error: Action property ${name} is violated.`,
      "postcondition-violation": `Error: ${violation.message ?? `Postcondition ${name} is false.`}`,
    }[result.status];
    if (violation.counts) console.log(violation.counts);
    console.log(headline);
    if (isInitial) printState(violation.trace[0].state);
    else if (result.status === "property-violation")
      printTrace(violation.trace, "Error: The following behavior constitutes a counter-example:\n");
    else if (loopStart === undefined) printTrace(violation.trace);
    else {
      printTrace(violation.trace, "Error: The following behavior constitutes a counter-example:\n");
      const isStuttering = loopStart === violation.trace.length - 1;
      console.log(
        isStuttering
          ? `State ${loopStart + 2}: Stuttering`
          : `Back to state ${loopStart + 1}${violation.loopLabel ? `: <${violation.loopLabel}>\n` : ""}`,
      );
    }
    const unwitnessed = violation.unwitnessed;
    if (unwitnessed?.counts) console.log(unwitnessed.counts);
    if (unwitnessed) console.log(`Error: ${unwitnessed.message}`);
    // TLC checks assumptions before it starts the search, so it has no statistics to print.
    if (isInitial || result.status === "assumption-violation") return;
  } else {
    const optimistic = getOptimisticProbability(result.distinctStates, result.generatedStates);
    console.log("Model checking completed. No error has been found.");
    console.log("  Estimates of the probability that TLC did not check all reachable states");
    console.log("  because two distinct states had the same fingerprint:");
    console.log(`  calculated (optimistic):  val = ${formatProbability(optimistic)}`);
    if (result.fingerprintDistance !== undefined) {
      const actual = getActualProbability(result.fingerprintDistance);
      console.log(`  based on the actual fingerprints:  val = ${formatProbability(actual)}`);
    }
  }
  console.log(
    `${result.generatedStates} states generated, ${result.distinctStates} distinct states found, ${result.queuedStates} states left on queue.`,
  );
  console.log(`The depth of the complete state graph search is ${result.depth}.`);
  const outDegree = result.outDegrees && getOutDegreeSummary(result.outDegrees);
  if (outDegree) console.log(outDegree);
};

const checkSpec = async (specPath: string, args: ParsedArgs) => {
  if (!existsSync(specPath)) {
    console.error(`Cannot find the specification file ${specPath}`);
    return EXIT_STATUS.configParseError;
  }
  const source = readFileSync(specPath, "utf8");
  const fileName = basename(specPath, ".tla");
  const moduleName = parseModule(source).name;
  if (moduleName !== fileName) {
    throw createSanyError(
      [
        {
          location: "Unknown location",
          message: `File name '${fileName}' does not match the name '${moduleName}' of the top level module it contains.`,
        },
      ],
      true,
    );
  }
  const configPath =
    args.get("-config")?.[0] ??
    (args.has("-config") ? undefined : specPath.replace(/\.tla$/, ".cfg"));
  if (!configPath || !existsSync(configPath)) {
    console.error(`Cannot find the configuration file ${configPath ?? ""}`);
    return EXIT_STATUS.configParseError;
  }
  const config = parseConfig(readFileSync(configPath, "utf8"));
  if (args.has("-deadlock")) config.checkDeadlock = false;
  const seed = args.has("-seed") ? args.get("-seed")?.[0] : "0";
  if (seed === undefined) {
    console.error("Error: seed required.");
    return 1;
  }
  if (!isJavaLong(seed)) {
    console.error(`Error: An integer for seed required. But encountered ${seed}`);
    return 1;
  }
  const livenessCheck = args.has("-lncheck") ? args.get("-lncheck")?.[0]?.toLowerCase() : "default";
  if (livenessCheck === undefined) {
    console.error("Error: expect a strategy such as final for -lncheck option.");
    return 1;
  }
  const dumpValues = args.get("-dump");
  if (dumpValues?.length === 0) {
    console.error("Error: A file name for dumping states required.");
    return 1;
  }
  const unsupportedFormat =
    dumpValues?.length === 2 &&
    UNSUPPORTED_DUMP_FORMATS.find((format) => dumpValues[0].toLowerCase().includes(format));
  if (unsupportedFormat) {
    console.error(`Error: tla-ts does not support the -dump format ${unsupportedFormat}.`);
    return 1;
  }
  const directory = dirname(specPath);
  console.log(`Checking ${basename(specPath)} with ${basename(configPath)}`);
  const result = await check({
    workers: getWorkerCount(args.get("-workers")),
    livenessCheck: ["final", "seqfinal", "off"].includes(livenessCheck) ? "final" : "default",
    seed: BigInt(seed),
    dump: dumpValues && getDump(dumpValues),
    source,
    config,
    onPause: () => readSync(0, Buffer.alloc(1)),
    loadModule: (name) => {
      const modulePath = join(directory, `${name}.tla`);
      return existsSync(modulePath) ? readFileSync(modulePath, "utf8") : undefined;
    },
    loadClass: (name) => {
      const classPath = join(directory, `${name}.class`);
      return existsSync(classPath) ? readFileSync(classPath) : undefined;
    },
    readFile: (path) => (existsSync(path) ? readFileSync(path, "utf8") : undefined),
    writeFile: (path, content) => {
      mkdirSync(dirname(resolve(path)), { recursive: true });
      writeFileSync(path, content);
    },
  });
  printResult(result);
  return result.failure?.exitCode ?? EXIT_CODES[result.status];
};

const formatSanyErrors = (report: SanyReport) =>
  `*** Errors: ${report.errors.length}\n\n${report.errors.map((error) => `${error.location}\n\n${error.message}\n\n`).join("\n")}`;

// TLC prints the errors it raises itself, and SANY's report of a spec it rejects. tla-ts names the
// others, such as a module it cannot parse.
const printError = (error: TlaError, path?: string) => {
  if (error instanceof TlaConfigError || error instanceof TlaEvaluationError) {
    return console.log(`Error: ${error.message}`);
  }
  const report = error instanceof TlaSyntaxError ? error.sany : undefined;
  if (!report || path === undefined) return console.error(`${error.name}: ${error.message}`);
  console.log(
    report.isFatal
      ? `\nFatal errors while parsing TLA+ spec in file ${basename(path, ".tla")}\n\n${report.errors.map((item) => `${item.location}\n\n${item.message}\n`).join("")}${formatSanyErrors(report)}\n`
      : `Semantic errors:\n\n${formatSanyErrors(report)}`,
  );
  console.log("Error: Parsing or semantic analysis failed.");
};

// Prints a TlaError and returns its exit code.
const reportErrors = async (run: () => number | Promise<number>, path?: string) => {
  try {
    return await run();
  } catch (error) {
    if (!(error instanceof TlaError)) throw error;
    printError(error, path);
    return getErrorExitCode(error);
  }
};

// Runs each path in turn, so an error in one leaves the others to report. The exit code is the
// first that is not success.
const runEach = async (paths: string[], runPath: (path: string) => number | Promise<number>) => {
  const exitCodes: number[] = [];
  for (const [index, path] of paths.entries()) {
    if (index > 0) console.log("");
    exitCodes.push(await reportErrors(() => runPath(path), path));
  }
  return exitCodes.find((exitCode) => exitCode !== EXIT_STATUS.success) ?? EXIT_STATUS.success;
};

// tlapm installs its standard library, with modules such as TLAPS, at lib/tlapm/stdlib beside
// bin/tlapm.
const getTlapmPaths = () =>
  (process.env.PATH ?? "")
    .split(delimiter)
    .map((directory) => join(directory, "tlapm"))
    .filter((path) => existsSync(path));

const getTlapmLibrary = () =>
  getTlapmPaths()
    .map((path) => join(dirname(dirname(realpathSync(path))), "lib/tlapm/stdlib"))
    .find((path) => existsSync(path));

const expandGlobs = (paths: string[]) =>
  paths.flatMap((path) => (GLOB_CHARACTERS.test(path) ? globSync(path).sort() : [path]));

const proveWithTlapm = (args: string[]) => {
  const tlapm = getTlapmPaths()[0];
  if (tlapm === undefined) {
    console.error(
      "Error: tla-ts prove runs tlapm to prove obligations, but tlapm isn't on your PATH. Install tlapm, or pass -N to only generate the obligations.",
    );
    return 1;
  }
  return spawnSync(tlapm, expandGlobs(args), { stdio: "inherit" }).status ?? 1;
};

const readModule = (path: string) =>
  existsSync(path) ? { file: path, source: readFileSync(path, "utf8") } : undefined;

// A message of tlapm's toolbox protocol, which it writes to stderr.
const printToolboxMessage = (fields: string[]) =>
  console.error(`@!!BEGIN\n${fields.map((field) => `@!!${field}\n`).join("")}@!!END\n`);

const TLAPM_VERSION = "5f5037f";

const quoteArgument = (arg: string) =>
  /^[+,\-./0-9:=@A-Z_a-z]+$/.test(arg) ? arg : `'${arg.replaceAll("'", "'\\''")}'`;

const printToolboxHeader = (args: string[]) => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  console.log(
    `\n\\* TLAPM version ${TLAPM_VERSION}\n\\* launched at ${date} ${time} with command line:\n\\* ${["tla-ts", "prove", ...args].map(quoteArgument).join(" ")}\n`,
  );
};

const STRICT_EXIT_STATUS = { incomplete: 11, emptyTarget: 12 };

const checkStrictly = (result: ModuleObligations, isTargeted: boolean, isSummary: boolean) => {
  const summary = result.summary;
  if (!isSummary) {
    summary.absent.forEach((locus) => console.error(`Missing proof at ${getLocusText(locus)}`));
    summary.omitted.forEach((locus) => console.error(`Omitted proof at ${getLocusText(locus)}`));
  }
  const isIncomplete = summary.absent.length + summary.omitted.length > 0;
  if (isIncomplete) {
    console.error(
      `${getAtPrefix(result.location)}[ERROR]: Proof incomplete in module ${JSON.stringify(result.name)}: ${summary.absent.length} missing, ${summary.omitted.length} omitted proof step(s).`,
    );
  }
  const isEmpty = isTargeted && result.obligations.length === 0;
  if (isEmpty) {
    console.error(
      `${getAtPrefix(result.location)}[ERROR]: No proof obligation found for the selected target.`,
    );
  }
  return [
    ...(isIncomplete ? [STRICT_EXIT_STATUS.incomplete] : []),
    ...(isEmpty ? [STRICT_EXIT_STATUS.emptyTarget] : []),
  ];
};

const TLAPM_FAILURE_STATUS = 3;

const generateObligations = (generate: () => ModuleObligations[]) => {
  try {
    return generate();
  } catch (error) {
    if (!(error instanceof TlaProofError)) throw error;
    console.error(` tlapm ending abnormally with ${error.exception}\n`);
    return undefined;
  }
};

const prove = (args: string[]) => {
  if (!args.includes("-N") && !args.includes("--summary")) return proveWithTlapm(args);
  const parsed = PROVE_COMMAND.parse(args);
  const unsupported = parsed.unknown[0];
  if (unsupported !== undefined) {
    console.error(`Error: tla-ts prove does not support the tlapm option ${unsupported}.`);
    return 1;
  }
  if (parsed.incomplete) {
    console.error(`Error: option '${parsed.incomplete.name}' needs an argument.`);
    return 1;
  }
  const nonInteger = parsed.options.find(
    (option) => option.name !== "-I" && option.values.some((value) => !/^-?\d+$/.test(value)),
  );
  if (nonInteger) {
    console.error(`Error: option '${nonInteger.name}' expects an integer.`);
    return 1;
  }
  const files = expandGlobs(parsed.positionals);
  const modulePaths = files.map((path) => (path.endsWith(".tla") ? path : `${path}.tla`));
  if (modulePaths.length === 0) {
    console.error(USAGE);
    return 1;
  }
  const isToolbox = parsed.has("--toolbox") || parsed.has("--line");
  if (isToolbox) printToolboxHeader(args);
  // Like tlapm, the last of --toolbox and --line wins, and a 0 means the whole module.
  const lines = parsed.options.reduce<LineRange>((range, option) => {
    const [start, end] = option.values.map(Number);
    if (option.name === "--toolbox") return { start, end: end === 0 ? Infinity : end };
    if (option.name === "--line") return start === 0 ? WHOLE_MODULE : { start, end: start };
    return range;
  }, WHOLE_MODULE);
  // tlapm searches the current directory and each module's, then its library, then each -I
  // directory, the last given first.
  const tlapmLibrary = getTlapmLibrary();
  const includes = parsed.options.flatMap((option) => (option.name === "-I" ? option.values : []));
  const directories = modulePaths.reduce(
    (found, path) => (found.includes(dirname(path)) ? found : [dirname(path), ...found]),
    [".", ...(tlapmLibrary ? [tlapmLibrary] : []), ...includes.toReversed()],
  );
  // tlapm names each file it reads by joining a search directory and the name, as in ./Module.tla.
  const results = generateObligations(() => {
    const missingIndex = modulePaths.findIndex((path) => !existsSync(path));
    if (missingIndex !== -1) {
      const missing = files[missingIndex];
      console.error(`File "<unknown>":\nError: File ${JSON.stringify(missing)} not found`);
      throw new TlaProofError(`File ${missing} not found`, { failure: "Module.Parser.parse_file" });
    }
    return getObligations(
      modulePaths.map((path) => ({ file: `./${path}`, source: readFileSync(path, "utf8") })),
      (name) =>
        directories.map((directory) => readModule(`${directory}/${name}.tla`)).find(Boolean),
      {
        lines,
        onWarning: (warning) => {
          if (warning.channel === "stdout") return console.log(warning.text);
          const isToolboxMessage =
            warning.channel === "toolbox" || warning.channel === "toolboxOnly";
          if (isToolbox && isToolboxMessage)
            return printToolboxMessage(["type:warning", `msg:${warning.text}`]);
          if (warning.channel !== "toolboxOnly") console.error(warning.text);
        },
      },
    );
  });
  if (!results) return TLAPM_FAILURE_STATUS;
  const failures = results.flatMap((result) => {
    if (parsed.has("--summary")) console.log(formatSummary(result));
    if (isToolbox) {
      result.obligations.forEach((obligation) =>
        printToolboxMessage([
          "type:obligation",
          `id:${obligation.id}`,
          `loc:${obligation.location}`,
          "status:to be proved",
          ...(parsed.has("--printallobs") ? [`obl:${obligation.text}`] : []),
        ]),
      );
      printToolboxMessage(["type:obligationsnumber", `count:${result.obligations.length}`]);
    }
    if (!parsed.has("--strict")) return [];
    return checkStrictly(result, lines.start > 0 || lines.end < Infinity, parsed.has("--summary"));
  });
  return failures.includes(STRICT_EXIT_STATUS.incomplete)
    ? STRICT_EXIT_STATUS.incomplete
    : (failures[0] ?? EXIT_STATUS.success);
};

const run = async (args: string[]) => {
  if (args[0] === "prove") return reportErrors(() => prove(args.slice(1)));
  const parsed = CHECK_COMMAND.parse(args);
  const inputs = getInputPaths(parsed.positionals);
  const isConfigured = parsed.has("-config");
  // A glob also matches modules that only other specs import, which have no configuration.
  const specPaths = inputs
    .map((input) => ({ ...input, path: input.path.replace(/\.cfg$/, ".tla") }))
    .filter(
      (input) =>
        input.path.endsWith(".tla") &&
        (!input.isGlobbed || isConfigured || existsSync(input.path.replace(/\.tla$/, ".cfg"))),
    )
    .map((input) => input.path);
  if (specPaths.length === 0) {
    console.error(USAGE);
    return 1;
  }
  if (isConfigured && specPaths.length > 1) {
    console.error("Error: -config applies to one specification, but several were given.");
    return 1;
  }
  return runEach([...new Set(specPaths)], (path) => checkSpec(path, parsed));
};

export const runCli = async () => {
  process.exitCode = await run(process.argv.slice(2));
};
