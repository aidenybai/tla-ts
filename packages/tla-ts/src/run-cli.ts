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
import { basename, delimiter, dirname, isAbsolute, join, resolve } from "node:path";
import { availableParallelism } from "node:os";
import type { Expression } from "./ast";
import type { CheckProgress, CheckResult, CheckStatus, InitialStates, TraceStep } from "./check";
import { defineCommand, type ParsedArgs } from "./cli-options";
import { parseConfig } from "./config";
import {
  getErrorExitCode,
  TlaConfigError,
  TlaError,
  TlaEvaluationError,
  TlaProofError,
  TlaSyntaxError,
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
import { exportSanyXml } from "./sany-xml";
import {
  createMessagePrinter,
  formatTlcDate,
  formatTlcDuration,
  MESSAGE_CODE,
  MESSAGE_LEVEL,
  type MessagePrinter,
} from "./tlc-messages";
import { formatState } from "./values";

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
  { flag: "-fp <num>" },
  { flag: "-lncheck <final|default>" },
  { flag: "-metadir <directory>" },
  { flag: "-seed <num>" },
  { flag: "-tool" },
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

const XML_EXPORT_COMMAND = defineCommand(
  "tla-ts [<JVM option>]... tla2sany.xml.XMLExporter {options} <Module.tla>",
  [{ flag: "-I <directory>", isRepeatable: true }, { flag: "-o" }],
);

const USAGE = [
  `Usage: ${CHECK_COMMAND.usage}`,
  `       ${PROVE_COMMAND.usage}`,
  "       tla-ts prove [<tlapm option>]... <Module.tla|glob>...",
  "       tla-ts [<JVM option>]... tlc2.TLC <TLC option>... <Spec>",
  `       ${XML_EXPORT_COMMAND.usage}`,
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

// What the spec prints as TLC rebuilds a trace, before it prints the states or after.
const printTraceOutput = (lines: string[] | undefined) =>
  lines?.forEach((line) => console.log(line));

const printTrace = (
  printer: MessagePrinter,
  trace: TraceStep[],
  heading: { code: number; text: string } = {
    code: MESSAGE_CODE.behaviorUpToThisPoint,
    text: "The behavior up to this point is:",
  },
) => {
  if (trace.length > 0) printer.print(heading.code, MESSAGE_LEVEL.error, heading.text);
  trace.forEach((step, index) => {
    if (index > 0) printTraceOutput(step.output);
    printer.print(
      MESSAGE_CODE.statePrint2,
      MESSAGE_LEVEL.state,
      `${index + 1}: <${step.label ?? step.action ?? "Initial predicate"}>\n${formatState(step.state)}`,
    );
  });
};

const COUNTER_EXAMPLE = {
  code: MESSAGE_CODE.counterExample,
  text: "The following behavior constitutes a counter-example:\n",
};

const getTemporalHeadline = (names: string[]) =>
  names.length === 1
    ? `Temporal property ${names[0]} was violated.\n`
    : `Temporal properties ${names.slice(0, -1).join(", ")}${names.length > 2 ? "," : ""} and ${names[names.length - 1]} were violated.\n`;

// TLC's CallStack.toString: the range of each expression, skipping an expression that it evaluates
// again right inside itself.
const formatCallStack = (expressions: Expression[]) => {
  if (expressions.length === 0) return "    The error call stack is empty.\n";
  const lines: string[] = [];
  expressions.forEach((expression, index) => {
    const range = expression.location.range;
    if (expression === expressions[index - 1] || !range) return;
    lines.push(
      `${lines.length}. Line ${range.start.line}, column ${range.start.column} to line ${range.end.line}, column ${range.end.column} in ${range.module}\n`,
    );
  });
  return `${lines.join("")}\n`;
};

const printInitialStates = (printer: MessagePrinter, initialStates: InitialStates) => {
  const generated = initialStates.generated;
  const distinct = initialStates.distinct;
  const date = formatTlcDate(new Date());
  if (generated === distinct) {
    printer.print(
      MESSAGE_CODE.initGenerated1,
      MESSAGE_LEVEL.none,
      `Finished computing initial states: ${distinct} distinct state${distinct === 1 ? "" : "s"} generated at ${date}.`,
    );
    return;
  }
  printer.print(
    MESSAGE_CODE.initGenerated2,
    MESSAGE_LEVEL.none,
    `Finished computing initial states: ${generated} state${generated === 1 ? "" : "s"} generated, with ${distinct} of them distinct at ${date}.`,
  );
};

interface Timing {
  start: number;
  // When TLC started to check the temporal properties on the complete state graph.
  liveness: number | undefined;
}

type Statistics = Pick<
  CheckResult,
  "generatedStates" | "distinctStates" | "queuedStates" | "depth"
>;

// TLC reports how far the search got when it prints messages for a program to read. When the
// search ends, it adds how many states it generated and found a minute.
const printProgress = (printer: MessagePrinter, statistics: Statistics, startTime?: number) => {
  const minutes = Math.max(Date.now() - (startTime ?? 0), 1) / 60_000;
  const format = (count: number) => count.toLocaleString("en-US");
  const getRate = (count: number, unit: string) =>
    startTime === undefined ? "" : ` (${format(Math.floor(count / minutes))} ${unit}/min)`;
  printer.print(
    MESSAGE_CODE.progress,
    MESSAGE_LEVEL.none,
    `Progress(${statistics.depth}) at ${formatTlcDate(new Date())}: ${format(statistics.generatedStates)} states generated${getRate(statistics.generatedStates, "s")}, ${format(statistics.distinctStates)} distinct states found${getRate(statistics.distinctStates, "ds")}, ${format(statistics.queuedStates)} states left on queue.`,
  );
};

// The messages TLC prints for a program to read as the search goes.
const printToolProgress = (printer: MessagePrinter, progress: CheckProgress, timing: Timing) => {
  const print = printer.print;
  switch (progress.kind) {
    case "parsed":
      print(MESSAGE_CODE.sanyFinished, MESSAGE_LEVEL.none, "SANY finished.");
      print(
        MESSAGE_CODE.starting,
        MESSAGE_LEVEL.none,
        `Starting... (${formatTlcDate(new Date())})`,
      );
      return;
    case "state-level-property":
      print(
        MESSAGE_CODE.stateLevelProperty,
        MESSAGE_LEVEL.warning,
        `The formula ${progress.name} is a state-level formula, but it was used as a PROPERTY (or PROPERTIES), where a temporal formula is typically expected. State-level formulas used as PROPERTY or PROPERTIES are only checked in the initial state. To verify that the formula ${progress.name} holds in all states of every behavior, use INVARIANT ${progress.name} instead. Alternatively, applying the "always" temporal operator ([]) to the state-level formula ${progress.name} changes it into a temporal formula, asserting that ${progress.name} holds in all states of every behavior. See https://explain.tlapl.us/invariants-and-properties for additional details.`,
      );
      return;
    case "liveness-prepared":
      print(
        MESSAGE_CODE.temporalBranches,
        MESSAGE_LEVEL.none,
        `Implied-temporal checking--satisfiability problem has ${progress.branches} branches.`,
      );
      return;
    case "initial-states-started":
      print(MESSAGE_CODE.computingInit, MESSAGE_LEVEL.none, "Computing initial states...");
      return;
    case "initial-states-computed":
      printInitialStates(printer, progress.initialStates);
      return;
    case "liveness-started": {
      timing.liveness = Date.now();
      printProgress(printer, progress.statistics);
      const branches = progress.branches > 1 ? `${progress.branches} branches of ` : "";
      // TLC counts the states of the behavior graph of each branch, without its tableau nodes.
      const states = progress.branches * progress.statistics.distinctStates;
      print(
        MESSAGE_CODE.checkingTemporal,
        MESSAGE_LEVEL.none,
        `Checking ${branches}temporal properties for the complete state space with ${states.toLocaleString("en-US")} total distinct states at (${formatTlcDate(new Date())})`,
      );
    }
  }
};

const printLivenessEnd = (printer: MessagePrinter, timing: Timing) => {
  if (timing.liveness === undefined) return;
  printer.print(
    MESSAGE_CODE.checkingTemporalEnd,
    MESSAGE_LEVEL.none,
    `Finished checking temporal properties in ${formatTlcDuration(Date.now() - timing.liveness)} at ${formatTlcDate(new Date())}`,
  );
};

const printResult = (result: CheckResult, printer: MessagePrinter, timing: Timing) => {
  const print = printer.print;
  if (result.failure) {
    const failure = result.failure;
    const message = printer.isTool ? failure.toolMessage : failure.message;
    const initialState =
      failure.initialState &&
      `While working on the initial state:\n${formatState(failure.initialState)}`;
    // TLC prints an error on an initial state and the state as one message.
    if (initialState) {
      print(MESSAGE_CODE.initialState, MESSAGE_LEVEL.error, `${message}\n${initialState}`);
    } else {
      print(failure.code, MESSAGE_LEVEL.error, message);
    }
    printTraceOutput(failure.trace[0]?.output);
    printTrace(printer, failure.trace);
    printTraceOutput(failure.traceOutput);
    if (result.failure.callStack) {
      print(
        MESSAGE_CODE.nestedExpression,
        MESSAGE_LEVEL.error,
        `The error occurred when TLC was evaluating the nested\nexpressions at the following positions:\n${formatCallStack(result.failure.callStack)}`,
      );
    }
  } else if (result.violation) {
    const violation = result.violation;
    const name = violation.name;
    const loopStart = violation.loopStart;
    // TLC prints a violation by an initial state without the behavior or the statistics.
    const isInitial =
      loopStart === undefined &&
      violation.trace.length === 1 &&
      (result.status === "invariant-violation" || result.status === "liveness-violation");
    const temporal = {
      code: MESSAGE_CODE.temporalPropertyViolated,
      text: getTemporalHeadline(violation.properties ?? [name]),
    };
    const headline = {
      success: undefined,
      error: undefined,
      "assumption-violation": violation.message
        ? {
            code: MESSAGE_CODE.assumptionEvaluationError,
            text: `Evaluating assumption ${name} failed.\n${violation.message}`,
          }
        : { code: MESSAGE_CODE.assumptionFalse, text: `Assumption ${name} is false.` },
      deadlock: { code: MESSAGE_CODE.deadlockReached, text: "Deadlock reached." },
      "invariant-violation": isInitial
        ? {
            code: MESSAGE_CODE.invariantViolatedInitial,
            text: `Invariant ${name} is violated by the initial state:`,
          }
        : { code: MESSAGE_CODE.invariantViolatedBehavior, text: `Invariant ${name} is violated.` },
      "property-violation": temporal,
      "liveness-violation":
        loopStart !== undefined
          ? temporal
          : isInitial
            ? {
                code: MESSAGE_CODE.propertyViolatedInitial,
                text: `Property ${name} is violated by the initial state:`,
              }
            : {
                code: MESSAGE_CODE.actionPropertyViolatedBehavior,
                text: `Action property ${name} is violated.`,
              },
      "postcondition-violation": {
        code: MESSAGE_CODE.general,
        text: violation.message ?? `Postcondition ${name} is false.`,
      },
    }[result.status];
    // A safety property's counterexample ends where it breaks, and a liveness one loops back.
    const isProperty = result.status === "property-violation";
    const isLasso = loopStart !== undefined && !isProperty;
    // TLC rebuilds a liveness counterexample before it reports the violation.
    if (isProperty || isLasso) printTraceOutput(violation.trace[0]?.output);
    if (violation.counts) console.log(violation.counts);
    if (headline) {
      // TLC prints the initial state that violates a property in the same message.
      const text = isInitial
        ? `${headline.text}\n${formatState(violation.trace[0].state)}`
        : headline.text;
      print(headline.code, MESSAGE_LEVEL.error, text);
    }
    if (!isInitial) {
      if (!isProperty && !isLasso) printTraceOutput(violation.trace[0]?.output);
      printTrace(printer, violation.trace, isProperty || isLasso ? COUNTER_EXAMPLE : undefined);
      printTraceOutput(violation.traceOutput);
    }
    if (isLasso) {
      const label = violation.loopLabel;
      if (loopStart === violation.trace.length - 1)
        print(MESSAGE_CODE.statePrint3, MESSAGE_LEVEL.state, `${loopStart + 2}: Stuttering`);
      else if (printer.isTool)
        print(
          MESSAGE_CODE.backToState,
          MESSAGE_LEVEL.state,
          `${loopStart + 1}: Back to state${label ? `: <${label}>\n` : ""}`,
        );
      else console.log(`Back to state ${loopStart + 1}${label ? `: <${label}>\n` : ""}`);
    }
    const unwitnessed = violation.unwitnessed;
    if (unwitnessed?.counts) console.log(unwitnessed.counts);
    if (unwitnessed) print(MESSAGE_CODE.general, MESSAGE_LEVEL.error, unwitnessed.message);
    // TLC checks assumptions before it starts the search, so it has no statistics to print.
    if (isInitial || result.status === "assumption-violation") return;
  } else {
    printLivenessEnd(printer, timing);
    const optimistic = getOptimisticProbability(result.distinctStates, result.generatedStates);
    const actual =
      result.fingerprintDistance === undefined
        ? []
        : [
            `  based on the actual fingerprints:  val = ${formatProbability(getActualProbability(result.fingerprintDistance))}`,
          ];
    print(
      MESSAGE_CODE.success,
      MESSAGE_LEVEL.none,
      [
        "Model checking completed. No error has been found.",
        "  Estimates of the probability that TLC did not check all reachable states",
        "  because two distinct states had the same fingerprint:",
        `  calculated (optimistic):  val = ${formatProbability(optimistic)}`,
        ...actual,
      ].join("\n"),
    );
  }
  if (result.status !== "success") printLivenessEnd(printer, timing);
  if (printer.isTool) printProgress(printer, result, timing.start);
  print(
    MESSAGE_CODE.stats,
    MESSAGE_LEVEL.none,
    `${result.generatedStates} states generated, ${result.distinctStates} distinct states found, ${result.queuedStates} states left on queue.`,
  );
  print(
    MESSAGE_CODE.searchDepth,
    MESSAGE_LEVEL.none,
    `The depth of the complete state graph search is ${result.depth}.`,
  );
  const outDegree = result.outDegrees && getOutDegreeSummary(result.outDegrees);
  if (outDegree) print(MESSAGE_CODE.stateGraphOutdegree, MESSAGE_LEVEL.none, outDegree);
};

// Like TLC, tla-ts finds a module in the directory of the spec, then in each library directory.
const createModuleLoader = (directories: string[]) => (name: string) =>
  directories
    .map((directory) => join(directory, `${name}.tla`))
    .filter((path) => existsSync(path))
    .map((path) => readFileSync(path, "utf8"))[0];

const checkSpec = async (
  specPath: string,
  args: ParsedArgs,
  libraries: string[],
  printer: MessagePrinter,
) => {
  if (!existsSync(specPath)) {
    console.error(`Cannot find the specification file ${specPath}`);
    return EXIT_STATUS.configParseError;
  }
  const source = readFileSync(specPath, "utf8");
  const fileName = basename(specPath, ".tla");
  const moduleName = parseModule(source).name;
  if (moduleName !== fileName) {
    throw new TlaSyntaxError(
      `File name '${fileName}' does not match the name '${moduleName}' of the top level module it contains.`,
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
  // tla-ts fingerprints states as TLC does with -fp 0.
  const fingerprint = args.get("-fp")?.[0];
  if (fingerprint !== undefined && Number(fingerprint) !== 0) {
    console.error(
      `Error: tla-ts fingerprints states as TLC does with -fp 0, not -fp ${fingerprint}.`,
    );
    return 1;
  }
  const directory = dirname(specPath);
  const timing: Timing = { start: Date.now(), liveness: undefined };
  if (printer.isTool)
    printer.print(MESSAGE_CODE.startingSany, MESSAGE_LEVEL.none, "Starting SANY...");
  else console.log(`Checking ${basename(specPath)} with ${basename(configPath)}`);
  const result = await check({
    workers: getWorkerCount(args.get("-workers")),
    livenessCheck: ["final", "seqfinal", "off"].includes(livenessCheck) ? "final" : "default",
    seed: BigInt(seed),
    dump: dumpValues && getDump(dumpValues),
    // TLC loads its trace exploration spec unless it runs with -tool.
    isTraceSpecLoaded: !args.has("-tool"),
    onProgress: printer.isTool
      ? (progress) => printToolProgress(printer, progress, timing)
      : undefined,
    source,
    config,
    onPause: () => readSync(0, Buffer.alloc(1)),
    loadModule: createModuleLoader([directory, ...libraries]),
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
  printResult(result, printer, timing);
  if (printer.isTool) {
    printer.print(
      MESSAGE_CODE.finished,
      MESSAGE_LEVEL.none,
      `Finished in ${Date.now() - timing.start}ms at (${formatTlcDate(new Date())})`,
    );
  }
  return result.failure?.exitCode ?? EXIT_CODES[result.status];
};

// TLC prints the errors it raises itself. tla-ts names the others, such as a module SANY rejects.
const printError = (error: TlaError, printer: MessagePrinter) => {
  if (error instanceof TlaConfigError || error instanceof TlaEvaluationError) {
    return printer.print(MESSAGE_CODE.general, MESSAGE_LEVEL.error, error.message);
  }
  console.error(`${error.name}: ${error.message}`);
};

// Prints a TlaError and returns its exit code.
const reportErrors = async (
  run: () => number | Promise<number>,
  printer = createMessagePrinter(false),
) => {
  try {
    return await run();
  } catch (error) {
    if (!(error instanceof TlaError)) throw error;
    printError(error, printer);
    return getErrorExitCode(error);
  }
};

// Runs each path in turn, so an error in one leaves the others to report. The exit code is the
// first that is not success.
const runEach = async (
  paths: string[],
  runPath: (path: string) => number | Promise<number>,
  printer: MessagePrinter,
) => {
  const exitCodes: number[] = [];
  for (const [index, path] of paths.entries()) {
    if (index > 0) console.log("");
    exitCodes.push(await reportErrors(() => runPath(path), printer));
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

const checkSpecs = async (args: string[], libraries: string[]) => {
  const parsed = CHECK_COMMAND.parse(args);
  const inputs = getInputPaths(parsed.positionals);
  const isConfigured = parsed.has("-config");
  // Like TLC, a spec named without an extension is the .tla file of that name. A glob also matches
  // modules that only other specs import, which have no configuration.
  const specPaths = inputs
    .map((input) => ({
      ...input,
      path:
        input.isGlobbed || /\.(tla|cfg)$/.test(input.path)
          ? input.path.replace(/\.cfg$/, ".tla")
          : `${input.path}.tla`,
    }))
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
  const printer = createMessagePrinter(parsed.has("-tool"));
  // TLC also looks for the spec itself in the library directories.
  const findSpec = (path: string) =>
    existsSync(path) || isAbsolute(path)
      ? path
      : (libraries.map((directory) => join(directory, path)).find(existsSync) ?? path);
  return runEach(
    [...new Set(specPaths.map(findSpec))],
    (path) => checkSpec(path, parsed, libraries, printer),
    printer,
  );
};

const exportXml = (args: string[], libraries: string[]) => {
  const parsed = XML_EXPORT_COMMAND.parse(args);
  const unsupported = parsed.unknown[0];
  if (unsupported !== undefined) {
    console.error(`Error: tla-ts does not support the XMLExporter option ${unsupported}.`);
    return 1;
  }
  if (parsed.incomplete || parsed.positionals.length !== 1) {
    console.error(USAGE);
    return 1;
  }
  const name = parsed.positionals[0];
  const path = name.endsWith(".tla") ? name : `${name}.tla`;
  if (!existsSync(path)) {
    console.error(`Cannot find the specification file ${path}`);
    return 1;
  }
  const includes = parsed.options.flatMap((option) => (option.name === "-I" ? option.values : []));
  const loadModule = createModuleLoader([dirname(path), ...includes, ...libraries]);
  console.log(exportSanyXml(readFileSync(path, "utf8"), loadModule));
  return EXIT_STATUS.success;
};

// Tools that run TLC with Java, such as the statechart skill of pstack, can run tla-ts in place of
// java, as in `tla-ts -DTLA-Library=lib -cp tla2tools.jar tlc2.TLC Spec`. tla-ts searches the
// TLA-Library directories for modules as TLC does, and ignores the class path and other options.
const JAVA_MAIN_CLASSES = ["tlc2.TLC", "tla2sany.xml.XMLExporter"];

const TLA_LIBRARY_PROPERTY = "-DTLA-Library=";

interface JavaLaunch {
  mainClass: string;
  args: string[];
  libraries: string[];
}

const getJavaLaunch = (args: string[]): JavaLaunch | undefined => {
  const libraries: string[] = [];
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "-cp" || arg === "-classpath" || arg === "--class-path") index++;
    else if (arg === "-jar")
      return { mainClass: "tlc2.TLC", args: args.slice(index + 2), libraries };
    else if (arg.startsWith(TLA_LIBRARY_PROPERTY)) {
      libraries.push(...arg.slice(TLA_LIBRARY_PROPERTY.length).split(delimiter));
    } else if (!arg.startsWith("-D") && !arg.startsWith("-X")) {
      const isLaunch = index > 0 || JAVA_MAIN_CLASSES.includes(arg);
      return isLaunch ? { mainClass: arg, args: args.slice(index + 1), libraries } : undefined;
    }
  }
  return undefined;
};

const runJavaClass = (launch: JavaLaunch) => {
  if (launch.mainClass === "tlc2.TLC") return checkSpecs(launch.args, launch.libraries);
  if (launch.mainClass === "tla2sany.xml.XMLExporter") {
    return reportErrors(() => exportXml(launch.args, launch.libraries));
  }
  console.error(
    `Error: tla-ts runs the Java classes ${JAVA_MAIN_CLASSES.join(" and ")}, not ${launch.mainClass}.`,
  );
  return 1;
};

const run = async (args: string[]) => {
  if (args[0] === "prove") return reportErrors(() => prove(args.slice(1)));
  const launch = getJavaLaunch(args);
  return launch ? runJavaClass(launch) : checkSpecs(args, []);
};

export const runCli = async () => {
  process.exitCode = await run(process.argv.slice(2));
};
