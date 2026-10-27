import {
  existsSync,
  globSync,
  mkdirSync,
  readFileSync,
  readSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { basename, delimiter, dirname, join, resolve } from "node:path";
import { availableParallelism } from "node:os";
import type { CheckResult, CheckStatus, TraceStep } from "./check";
import { parseConfig } from "./config";
import {
  getErrorExitCode,
  TlaConfigError,
  TlaError,
  TlaEvaluationError,
  TlaProofError,
} from "./errors";
import { EXIT_STATUS } from "./exit-codes";
import type { LineRange } from "./obligation-generate";
import { getAtPrefix, getLocusText } from "./obligation-expression";
import { formatSummary, getObligations, WHOLE_MODULE, type ModuleObligations } from "./obligations";
import { check } from "./parallel";
import { prettyPrint } from "./pretty-print";
import {
  formatProbability,
  getActualProbability,
  getOptimisticProbability,
  getOutDegreeSummary,
} from "./tlc-summary";
import { formatValue, type Value } from "./values";

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

const USAGE = [
  "Usage: tla-ts <Spec.tla|Spec.cfg|glob>... [-config <Spec.cfg>] [-deadlock] [-lncheck <final|default>] [-seed <num>] [-workers <count|auto>]",
  "       tla-ts prove -N [--toolbox <start> <end>] [--line <num>] [--printallobs] [-I <directory>]... <Module.tla|glob>...",
].join("\n");

const VALUE_FLAGS = new Set(["-config", "-lncheck", "-seed", "-workers"]);

// The tlapm options that prove supports, with the number of values each takes.
const PROVE_OPTIONS = new Map([
  ["-N", 0],
  ["--printallobs", 0],
  ["--summary", 0],
  ["--strict", 0],
  ["-I", 1],
  ["--line", 1],
  ["--toolbox", 2],
]);

const GLOB_CHARACTERS = /[*?[{]/;

interface InputPath {
  path: string;
  isGlobbed: boolean;
}

// The arguments that are not flags or flag values, each glob expanded to the files it matches.
const getInputPaths = (args: string[]): InputPath[] =>
  args
    .filter((arg, index) => !arg.startsWith("-") && !VALUE_FLAGS.has(args[index - 1]))
    .flatMap((arg): InputPath[] =>
      GLOB_CHARACTERS.test(arg)
        ? globSync(arg)
            .sort()
            .map((path) => ({ path, isGlobbed: true }))
        : [{ path: arg, isGlobbed: false }],
    );

const isJavaLong = (text: string) =>
  /^[+-]?\d+$/.test(text) && BigInt.asIntN(64, BigInt(text)) === BigInt(text);

const getWorkerCount = (args: string[]) => {
  const flag = args.indexOf("-workers");
  if (flag === -1) return 1;
  const value = args[flag + 1];
  return value === "auto" ? availableParallelism() : Math.max(1, Number.parseInt(value, 10) || 1);
};

const printState = (state: Record<string, Value>) => {
  const entries = Object.entries(state);
  entries.forEach(([name, value]) =>
    console.log(
      `${entries.length === 1 ? "" : "/\\ "}${name} = ${prettyPrint(formatValue(value))}`,
    ),
  );
  console.log("");
};

const printTrace = (trace: TraceStep[], heading = "Error: The behavior up to this point is:") => {
  if (trace.length > 0) console.log(heading);
  trace.forEach((step, index) => {
    console.log(`State ${index + 1}: <${step.label ?? step.action ?? "Initial predicate"}>`);
    printState(step.state);
  });
};

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
      "property-violation": `Error: Property ${name} is violated.`,
      "liveness-violation":
        loopStart !== undefined
          ? `Error: Temporal property ${name} was violated.\n`
          : isInitial
            ? `Error: Property ${name} is violated by the initial state:`
            : `Error: Action property ${name} is violated.`,
      "postcondition-violation": `Error: ${violation.message ?? `Postcondition ${name} is false.`}`,
    }[result.status];
    if (violation.counts) console.log(violation.counts);
    console.log(headline);
    if (isInitial) printState(violation.trace[0].state);
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

const checkSpec = async (specPath: string, args: string[]) => {
  if (!existsSync(specPath)) {
    console.error(`Cannot find the specification file ${specPath}`);
    return EXIT_STATUS.configParseError;
  }
  const configFlag = args.indexOf("-config");
  const configPath = configFlag === -1 ? specPath.replace(/\.tla$/, ".cfg") : args[configFlag + 1];
  if (!configPath || !existsSync(configPath)) {
    console.error(`Cannot find the configuration file ${configPath ?? ""}`);
    return EXIT_STATUS.configParseError;
  }
  const config = parseConfig(readFileSync(configPath, "utf8"));
  if (args.includes("-deadlock")) config.checkDeadlock = false;
  const seedFlag = args.indexOf("-seed");
  const seed = seedFlag === -1 ? "0" : args[seedFlag + 1];
  if (seed === undefined) {
    console.error("Error: seed required.");
    return 1;
  }
  if (!isJavaLong(seed)) {
    console.error(`Error: An integer for seed required. But encountered ${seed}`);
    return 1;
  }
  const livenessFlag = args.indexOf("-lncheck");
  const livenessCheck = livenessFlag === -1 ? "default" : args[livenessFlag + 1]?.toLowerCase();
  if (livenessCheck === undefined) {
    console.error("Error: expect a strategy such as final for -lncheck option.");
    return 1;
  }
  const directory = dirname(specPath);
  console.log(`Checking ${basename(specPath)} with ${basename(configPath)}`);
  const result = await check({
    workers: getWorkerCount(args),
    livenessCheck: ["final", "seqfinal", "off"].includes(livenessCheck) ? "final" : "default",
    seed: BigInt(seed),
    source: readFileSync(specPath, "utf8"),
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

// TLC prints the errors it raises itself. tla-ts names the others, such as a module SANY rejects.
const printError = (error: TlaError) => {
  if (error instanceof TlaConfigError || error instanceof TlaEvaluationError) {
    return console.log(`Error: ${error.message}`);
  }
  console.error(`${error.name}: ${error.message}`);
};

// Prints a TlaError and returns its exit code.
const reportErrors = async (run: () => number | Promise<number>) => {
  try {
    return await run();
  } catch (error) {
    if (!(error instanceof TlaError)) throw error;
    printError(error);
    return getErrorExitCode(error);
  }
};

// Runs each path in turn, so an error in one leaves the others to report. The exit code is the
// first that is not success.
const runEach = async (paths: string[], runPath: (path: string) => number | Promise<number>) => {
  const exitCodes: number[] = [];
  for (const [index, path] of paths.entries()) {
    if (index > 0) console.log("");
    exitCodes.push(await reportErrors(() => runPath(path)));
  }
  return exitCodes.find((exitCode) => exitCode !== EXIT_STATUS.success) ?? EXIT_STATUS.success;
};

// tlapm installs its standard library, with modules such as TLAPS, at lib/tlapm/stdlib beside
// bin/tlapm.
const getTlapmLibrary = () =>
  (process.env.PATH ?? "")
    .split(delimiter)
    .map((directory) => join(directory, "tlapm"))
    .filter((path) => existsSync(path))
    .map((path) => join(dirname(dirname(realpathSync(path))), "lib/tlapm/stdlib"))
    .find((path) => existsSync(path));

const readModule = (path: string) =>
  existsSync(path) ? { file: path, source: readFileSync(path, "utf8") } : undefined;

interface ProveOption {
  name: string;
  values: string[];
}

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

// Mirrors tlapm -N, which generates the obligations without sending them to a backend.
const prove = (args: string[]) => {
  const options: ProveOption[] = [];
  const paths: string[] = [];
  for (let index = 0; index < args.length; index++) {
    const arity = PROVE_OPTIONS.get(args[index]);
    if (arity === undefined) {
      paths.push(args[index]);
      continue;
    }
    options.push({ name: args[index], values: args.slice(index + 1, index + 1 + arity) });
    index += arity;
  }
  const unsupported = paths.find((path) => path.startsWith("-"));
  if (unsupported !== undefined) {
    console.error(`Error: tla-ts prove does not support the tlapm option ${unsupported}.`);
    return 1;
  }
  const incomplete = options.find(
    (option) => option.values.length < (PROVE_OPTIONS.get(option.name) ?? 0),
  );
  if (incomplete) {
    console.error(`Error: option '${incomplete.name}' needs an argument.`);
    return 1;
  }
  const nonInteger = options.find(
    (option) => option.name !== "-I" && option.values.some((value) => !/^-?\d+$/.test(value)),
  );
  if (nonInteger) {
    console.error(`Error: option '${nonInteger.name}' expects an integer.`);
    return 1;
  }
  const hasOption = (name: string) => options.some((option) => option.name === name);
  if (!hasOption("-N") && !hasOption("--summary")) {
    console.error("Error: tla-ts has no prover backend yet, so prove needs -N.");
    return 1;
  }
  const files = paths.flatMap((path) =>
    GLOB_CHARACTERS.test(path) ? globSync(path).sort() : [path],
  );
  const modulePaths = files.map((path) => (path.endsWith(".tla") ? path : `${path}.tla`));
  if (modulePaths.length === 0) {
    console.error(USAGE);
    return 1;
  }
  const isToolbox = hasOption("--toolbox") || hasOption("--line");
  if (isToolbox) printToolboxHeader(args);
  // Like tlapm, the last of --toolbox and --line wins, and a 0 means the whole module.
  const lines = options.reduce<LineRange>((range, option) => {
    const [start, end] = option.values.map(Number);
    if (option.name === "--toolbox") return { start, end: end === 0 ? Infinity : end };
    if (option.name === "--line") return start === 0 ? WHOLE_MODULE : { start, end: start };
    return range;
  }, WHOLE_MODULE);
  // tlapm searches the current directory and each module's, then its library, then each -I
  // directory, the last given first.
  const tlapmLibrary = getTlapmLibrary();
  const includes = options.flatMap((option) => (option.name === "-I" ? option.values : []));
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
    if (hasOption("--summary")) console.log(formatSummary(result));
    if (isToolbox) {
      result.obligations.forEach((obligation) =>
        printToolboxMessage([
          "type:obligation",
          `id:${obligation.id}`,
          `loc:${obligation.location}`,
          "status:to be proved",
          ...(hasOption("--printallobs") ? [`obl:${obligation.text}`] : []),
        ]),
      );
      printToolboxMessage(["type:obligationsnumber", `count:${result.obligations.length}`]);
    }
    if (!hasOption("--strict")) return [];
    return checkStrictly(result, lines.start > 0 || lines.end < Infinity, hasOption("--summary"));
  });
  return failures.includes(STRICT_EXIT_STATUS.incomplete)
    ? STRICT_EXIT_STATUS.incomplete
    : (failures[0] ?? EXIT_STATUS.success);
};

const run = async (args: string[]) => {
  if (args[0] === "prove") return reportErrors(() => prove(args.slice(1)));
  const inputs = getInputPaths(args);
  const isConfigured = args.includes("-config");
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
  return runEach([...new Set(specPaths)], (path) => checkSpec(path, args));
};

export const runCli = async () => {
  process.exitCode = await run(process.argv.slice(2));
};
