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
import { arch, availableParallelism, release, tmpdir, type } from "node:os";
import { pathToFileURL } from "node:url";
import { getHeapStatistics } from "node:v8";
import { version } from "../package.json";
import type { Expression } from "./ast";
import { describeRange } from "./evaluate";
import type {
  CheckProgress,
  InitialStateViolation,
  OutputLine,
  CheckResult,
  CheckStatus,
  InitialStates,
  SearchStatistics,
  TraceStep,
  Violation,
} from "./check";
import { defineCommand, type ParsedArgs } from "./cli-options";
import { parseConfig } from "./config";
import {
  getErrorExitCode,
  TlaConfigError,
  TlaError,
  TlaEvaluationError,
  TlaProofError,
  TlaSyntaxError,
  getUnexpectedException,
  TlaJavaException,
  UNEXPECTED_EXCEPTION,
  TlaSanyFatalError,
  TlaUnsupportedError,
} from "./errors";
import { EXIT_STATUS, setExitCode } from "./exit-codes";
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
import type { SanySpecification } from "./sany-generator";
import { SANY_174_STANDARD_MODULES, SANY_STANDARD_MODULES } from "./sany-modules";
import { getSanyModuleName, getSanyReport, type SanyModuleOrigin } from "./sany-report";
import { exportSanyXml, XML_EXPORT_EXIT_CODE, type XmlExportOptions } from "./sany-xml";
import { getTlcFingerprint } from "./tlc-random";
import { getTlcVersion, type TlcVersion } from "./tlc-version";
import {
  createMessagePrinter,
  formatTlcDate,
  formatInnerMessage,
  formatNestedMessage,
  formatTlcDuration,
  getCodedMessage,
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
  { flag: "-nowarning" },
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

const XML_EXPORT_FLAGS = new Set(["-o", "-t", "-r", "-u"]);

const XML_EXPORT_174_FLAGS = new Set(["-o"]);

// The usage that XMLExporter.printUsage prints with UsageGenerator.
const XML_EXPORT_USAGE = (() => {
  const bold = (text: string) => `\x1b[1m${text}\x1b[0m`;
  const options = [
    ["-I", "Include; use given directory path to resolve module dependencies."],
    ["-help", "Print this usage information."],
    ["-o", "Offline mode; skip XML schema validation step."],
    [
      "-r",
      "Restrict mode; include only declarations and definitions of the specified module, excluding extended or instantiated modules.",
    ],
    ["-t", "Terse; format XML output without tabs or newlines."],
    [
      "-u",
      "Uncomment; process boxed comments and single-line comments (\\*) in pre-comments to extract their content.",
    ],
  ];
  const tips = [
    "Only one root TLA+ file can be parsed per run.",
    "Multiple directory search paths can be given by providing multiple -I arguments.",
    "XML schema validation does not require network access.",
  ];
  return [
    "",
    bold("NAME"),
    "",
    "\ttla2sany.xml.XMLExporter - Emit SANY's parse tree as XML - Version 2.2 created 08 July 2020",
    "",
    "",
    bold("SYNOPSIS"),
    "",
    `\t${bold("tla2sany.xml.XMLExporter")} [${bold("-Iortu")}] [${bold("-help")}] FILE`,
    "",
    bold("DESCRIPTION"),
    "",
    "\tGiven a TLA+ file, parse that file with SANY then translate the module's semantic parse tree to XML, including all the modules depended on. The XML is printed to stdout and its output format is given by an XML Schema file (.xsd) found at https://proofs.tlapl.us/doc/web/sany.xsd.",
    "",
    bold("OPTIONS"),
    "",
    ...options.map(([flag, description]) => `\t${bold(flag)}\n\t\t${description}`),
    "",
    bold("TIPS"),
    "",
    ...tips.flatMap((tip) => [`\t${tip}`, ""]),
    "",
  ].join("\n");
})();

const USAGE = [
  `Usage: ${CHECK_COMMAND.usage}`,
  `       ${PROVE_COMMAND.usage}`,
  "       tla-ts prove [<tlapm option>]... <Module.tla|glob>...",
  "       tla-ts [<JVM option>]... tlc2.TLC <TLC option>... <Spec>",
  "       (-cp tla2tools.jar or -Dtla-ts.tlc=1.7.4 picks the TLC to reproduce)",
  "       tla-ts [<JVM option>]... tla2sany.xml.XMLExporter [-I <directory>]... [-o] [-t] [-r] [-u] <Module.tla>",
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
const printInitialStatesProgress = (printer: MessagePrinter, count: number) =>
  printer.print(
    MESSAGE_CODE.computingInitProgress,
    MESSAGE_LEVEL.none,
    `Computed ${count} initial states...`,
  );

const getInitialViolationHeadline = (
  status: InitialStateViolation["status"],
  name: string | undefined,
) =>
  status === "invariant-violation"
    ? {
        code: MESSAGE_CODE.invariantViolatedInitial,
        text: `Invariant ${name} is violated by the initial state:`,
      }
    : {
        code: MESSAGE_CODE.propertyViolatedInitial,
        text: `Property ${name} is violated by the initial state:`,
      };

const printTraceOutput = (printer: MessagePrinter, lines: OutputLine[] | undefined) =>
  lines?.forEach((line) => {
    if (typeof line === "string") return console.log(line);
    if (line.kind === "initial-states-progress") {
      return printInitialStatesProgress(printer, line.count);
    }
    const headline = getInitialViolationHeadline(line.status, line.name);
    printer.print(
      headline.code,
      MESSAGE_LEVEL.error,
      `${headline.text}\n${formatState(line.state)}`,
    );
  });

const printTrace = (
  printer: MessagePrinter,
  trace: TraceStep[],
  heading: { code: number; text: string } = {
    code: MESSAGE_CODE.behaviorUpToThisPoint,
    text: "The behavior up to this point is:",
  },
  isRebuiltAfterHeading = false,
) => {
  if (trace.length > 0) printer.print(heading.code, MESSAGE_LEVEL.error, heading.text);
  trace.forEach((step, index) => {
    if (index > 0 || isRebuiltAfterHeading) printTraceOutput(printer, step.output);
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

// TLC 1.7.4 doesn't name the properties, and later versions name none when they can't tell which.
const getTemporalHeadline = (names: string[], version: TlcVersion) =>
  version === "1.7.4" || names.length === 0
    ? "Temporal properties were violated.\n"
    : names.length === 1
      ? `Temporal property ${names[0]} was violated.\n`
      : `Temporal properties ${names.slice(0, -1).join(", ")}${names.length > 2 ? "," : ""} and ${names[names.length - 1]} were violated.\n`;

// TLC's FingerprintException#getTrace: the range of each source, innermost first, skipping a
// source the same as the one inside it.
const formatFingerprintTrace = (sources: Expression[]) =>
  sources
    .filter((source, index) => source !== sources[index - 1])
    .map((source, index) => `${index}) ${describeRange(source)}\n`)
    .toReversed()
    .join("");

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
  // Whether TLC has printed that SANY finished.
  isParsed: boolean;
  // When TLC started to check the temporal properties on the complete state graph.
  liveness: number | undefined;
}

// TLC reports how far the search got when it prints messages for a program to read, at level 1 or
// deeper even before it finds a state. As the search goes and when it ends, it adds how many
// states it generated and found a minute.
const printProgress = (
  printer: MessagePrinter,
  statistics: SearchStatistics,
  startTime?: number,
) => {
  const minutes = Math.max(Date.now() - (startTime ?? 0), 1) / 60_000;
  const format = (count: number) => count.toLocaleString("en-US");
  const getRate = (count: number, unit: string) =>
    startTime === undefined ? "" : ` (${format(Math.floor(count / minutes))} ${unit}/min)`;
  printer.print(
    MESSAGE_CODE.progress,
    MESSAGE_LEVEL.none,
    `Progress(${Math.max(statistics.depth, 1)}) at ${formatTlcDate(new Date())}: ${format(statistics.generatedStates)} states generated${getRate(statistics.generatedStates, "s")}, ${format(statistics.distinctStates)} distinct states found${getRate(statistics.distinctStates, "ds")}, ${format(statistics.queuedStates)} states left on queue.`,
  );
};

const getClassPath = (directory: string, module: string) => join(directory, `${module}.class`);

// The messages TLC prints as the search goes.
const printCheckProgress = (
  printer: MessagePrinter,
  progress: CheckProgress,
  timing: Timing,
  directory: string,
) => {
  const print = printer.print;
  switch (progress.kind) {
    case "parsed":
      timing.isParsed = true;
      if (printer.isTool) print(MESSAGE_CODE.sanyFinished, MESSAGE_LEVEL.none, "SANY finished.");
      print(
        MESSAGE_CODE.starting,
        MESSAGE_LEVEL.none,
        `Starting... (${formatTlcDate(new Date())})`,
      );
      return;
    // TLC 1.7.4 warns about neither a constant-level invariant nor a state-level property.
    case "constant-level-invariant":
      if (printer.version === "1.7.4") return;
      print(
        MESSAGE_CODE.constantLevelInvariant,
        MESSAGE_LEVEL.warning,
        `The invariant ${progress.name} is a constant-level formula (i.e., it contains no variables, primes, or temporal operators) and evaluates to TRUE. To assert constant-level formulas in your spec, use ASSUME ConstInv. If you optionally want to give the assumption a name, write ASSUME YourAssumption == ConstInv instead. See https://explain.tlapl.us/assumptions-and-invariants for additional details.`,
      );
      return;
    case "state-level-property":
      if (printer.version === "1.7.4") return;
      print(
        MESSAGE_CODE.stateLevelProperty,
        MESSAGE_LEVEL.warning,
        `The formula ${progress.name} is a state-level formula, but it was used as a PROPERTY (or PROPERTIES), where a temporal formula is typically expected. State-level formulas used as PROPERTY or PROPERTIES are only checked in the initial state. To verify that the formula ${progress.name} holds in all states of every behavior, use INVARIANT ${progress.name} instead. Alternatively, applying the "always" temporal operator ([]) to the state-level formula ${progress.name} changes it into a temporal formula, asserting that ${progress.name} holds in all states of every behavior. See https://explain.tlapl.us/invariants-and-properties for additional details.`,
      );
      return;
    case "liveness-initializing":
      if (progress.isSymmetric) {
        print(
          MESSAGE_CODE.livenessSymmetry,
          MESSAGE_LEVEL.warning,
          "Declaring symmetry during liveness checking is dangerous. It might cause TLC to miss violations of the stated liveness properties. Please check liveness without symmetry defined.",
        );
      }
      // Only TLC 1.7.4 warns about constraints.
      if (progress.isConstrained && printer.version === "1.7.4") {
        print(
          MESSAGE_CODE.livenessConstraints,
          MESSAGE_LEVEL.warning,
          "Declaring state or action constraints during liveness checking is dangerous: Please read section 14.3.5 on page 247 of Specifying Systems (https://lamport.azurewebsites.net/tla/book.html) and optionally the discussion at https://discuss.tlapl.us/msg00994.html for more details.",
        );
      }
      return;
    case "liveness-prepared":
      print(
        MESSAGE_CODE.temporalBranches,
        MESSAGE_LEVEL.none,
        `Implied-temporal checking--satisfiability problem has ${progress.branches} branches.`,
      );
      return;
    case "java-override": {
      // Class#getResource, which names the class file TLC loads the override from.
      const location = pathToFileURL(resolve(getClassPath(directory, progress.module))).href;
      print(
        progress.isMatched ? MESSAGE_CODE.javaOverrideLoaded : MESSAGE_CODE.javaOverrideMismatch,
        progress.isMatched ? MESSAGE_LEVEL.none : MESSAGE_LEVEL.warning,
        `${progress.isMatched ? "Loading" : "Failed to match"} ${progress.operator} operator override from ${location.replace("file:///", "file:/")} with signature: <Java Method: ${progress.signature}>.`,
      );
      return;
    }
    case "initial-states-started":
      print(MESSAGE_CODE.computingInit, MESSAGE_LEVEL.none, "Computing initial states...");
      return;
    case "initial-states-progress":
      printInitialStatesProgress(printer, progress.count);
      return;
    case "initial-states-computed":
      printInitialStates(printer, progress.initialStates);
      return;
    case "progress":
      printProgress(printer, progress.statistics, timing.start);
      return;
    case "liveness-started": {
      timing.liveness = Date.now();
      // TLC reports how far the search got before it checks the complete state graph.
      if (progress.isComplete) printProgress(printer, progress.statistics);
      const branches = progress.branches > 1 ? `${progress.branches} branches of ` : "";
      // TLC counts the states of the behavior graph of each branch, without its tableau nodes.
      const states = progress.branches * progress.states;
      print(
        MESSAGE_CODE.checkingTemporal,
        MESSAGE_LEVEL.none,
        `Checking ${branches}temporal properties for the ${progress.isComplete ? "complete" : "current"} state space with ${states} total distinct states at (${formatTlcDate(new Date())})`,
      );
      return;
    }
    case "liveness-finished":
      printLivenessEnd(printer, timing);
      return;
    case "warning":
      print(progress.code, MESSAGE_LEVEL.warning, progress.text);
  }
};

const printLivenessEnd = (printer: MessagePrinter, timing: Timing) => {
  if (timing.liveness === undefined) return;
  printer.print(
    MESSAGE_CODE.checkingTemporalEnd,
    MESSAGE_LEVEL.none,
    `Finished checking temporal properties in ${formatTlcDuration(Date.now() - timing.liveness)} at ${formatTlcDate(new Date())}`,
  );
  timing.liveness = undefined;
};

// Prints a violation, and returns whether TLC goes on to print the statistics of the search.
const printViolation = (status: CheckStatus, violation: Violation, printer: MessagePrinter) => {
  const print = printer.print;
  const name = violation.name;
  const loopStart = violation.loopStart;
  // TLC prints a violation by an initial state without the behavior or the statistics.
  const isInitial =
    loopStart === undefined &&
    violation.trace.length === 1 &&
    (status === "invariant-violation" || status === "liveness-violation");
  const temporal = {
    code: MESSAGE_CODE.temporalPropertyViolated,
    text: getTemporalHeadline(violation.properties ?? [name], printer.version),
  };
  const headline = {
    success: undefined,
    error: undefined,
    "assumption-violation": violation.message
      ? {
          code: MESSAGE_CODE.assumptionEvaluationError,
          text: formatInnerMessage(
            MESSAGE_CODE.assumptionEvaluationError,
            `Evaluating assumption ${name} failed.\n${violation.message}`,
            printer.isTool,
          ),
        }
      : { code: MESSAGE_CODE.assumptionFalse, text: `Assumption ${name} is false.` },
    deadlock: { code: MESSAGE_CODE.deadlockReached, text: "Deadlock reached." },
    "invariant-violation": isInitial
      ? getInitialViolationHeadline("invariant-violation", name)
      : { code: MESSAGE_CODE.invariantViolatedBehavior, text: `Invariant ${name} is violated.` },
    "property-violation": temporal,
    "liveness-violation":
      loopStart !== undefined
        ? temporal
        : isInitial
          ? getInitialViolationHeadline("liveness-violation", name)
          : {
              code: MESSAGE_CODE.actionPropertyViolatedBehavior,
              text: `Action property ${name} is violated.`,
            },
    "postcondition-violation": {
      code: violation.postcondition?.code ?? MESSAGE_CODE.general,
      text: violation.message ?? `Postcondition ${name} is false.`,
    },
  }[status];
  // A safety property's counterexample ends where it breaks, and a liveness one loops back.
  const isProperty = status === "property-violation";
  const isLasso = loopStart !== undefined && !isProperty;
  const isCounterExample = isProperty || isLasso;
  // TLC rebuilds a liveness counterexample before it reports the violation, and 1.7.4's
  // LiveWorker#printTrace after it prints the heading of the counterexample.
  const isRebuiltFirst = isCounterExample && printer.version !== "1.7.4";
  if (isRebuiltFirst) printTraceOutput(printer, violation.trace[0]?.output);
  if (violation.counts) console.log(violation.counts);
  if (headline) {
    // TLC prints the initial state that violates a property in the same message.
    const text = isInitial
      ? `${headline.text}\n${formatState(violation.trace[0].state)}`
      : headline.text;
    print(headline.code, MESSAGE_LEVEL.error, text);
  }
  if (!isInitial) {
    if (!isCounterExample) printTraceOutput(printer, violation.trace[0]?.output);
    printTrace(
      printer,
      violation.trace,
      isCounterExample ? COUNTER_EXAMPLE : undefined,
      isCounterExample && !isRebuiltFirst,
    );
    printTraceOutput(printer, violation.traceOutput);
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
  // TLC 1.7.4 doesn't explain a stuttering counterexample.
  if (violation.warning && printer.version !== "1.7.4")
    print(violation.warning.code, MESSAGE_LEVEL.warning, violation.warning.text);
  // TLC checks the postconditions after it prints a counterexample.
  const postcondition =
    violation.unwitnessed ??
    (status === "postcondition-violation" ? undefined : violation.postcondition);
  if (postcondition?.counts) console.log(postcondition.counts);
  if (postcondition) print(postcondition.code, MESSAGE_LEVEL.error, postcondition.message);
  // TLC checks assumptions before it starts the search, so it has no statistics to print.
  return !isInitial && status !== "assumption-violation";
};

const printNestedExpressions = (printer: MessagePrinter, callStack: Expression[]) =>
  printer.print(
    MESSAGE_CODE.nestedExpression,
    MESSAGE_LEVEL.error,
    `The error occurred when TLC was evaluating the nested\nexpressions at the following positions:\n${formatCallStack(callStack)}`,
  );

const printResult = (result: CheckResult, printer: MessagePrinter, timing: Timing) => {
  const print = printer.print;
  if (result.failure) {
    const failure = result.failure;
    const message = printer.isTool ? failure.toolMessage : failure.message;
    const printCallStack = () => {
      const fingerprint = failure.fingerprint;
      if (fingerprint) {
        // TLC prints the call stack when the replay has one, and otherwise the sources of the
        // values it failed to fingerprint, innermost first. TLC 1.7.4 always prints the sources.
        const trace =
          failure.callStack?.length && printer.version !== "1.7.4"
            ? formatCallStack(failure.callStack)
            : formatFingerprintTrace(fingerprint.sources);
        print(
          MESSAGE_CODE.fingerprintFailed,
          MESSAGE_LEVEL.error,
          `TLC was unable to fingerprint.\n\nFingerprint Stack Trace:\n${trace}\nReason:\n${formatNestedMessage(fingerprint.reason, printer.isTool)}`,
        );
        return;
      }
      if (failure.callStack) printNestedExpressions(printer, failure.callStack);
    };
    if (failure.isCallStackFirst) printCallStack();
    // TLC prints the state as it reports the error, so a state it can't print fails outside the
    // checker, which TLC reports as an exception it did not expect.
    const initialState =
      failure.initialState &&
      (() => {
        try {
          return `While working on the initial state:\n${formatState(failure.initialState)}`;
        } catch (error) {
          if (!(error instanceof TlaEvaluationError)) throw error;
          throw setExitCode(
            new TlaEvaluationError(`${UNEXPECTED_EXCEPTION}${error.message}`),
            EXIT_STATUS.error,
          );
        }
      })();
    // TLC prints an error on an initial state and the state as one message.
    print(
      initialState ? MESSAGE_CODE.initialState : failure.code,
      MESSAGE_LEVEL.error,
      initialState ? `${message}\n${initialState}` : message,
    );
    printTraceOutput(printer, failure.trace[0]?.output);
    printTrace(printer, failure.trace);
    const traceFailure = failure.traceFailure;
    if (traceFailure) {
      print(
        traceFailure.code,
        MESSAGE_LEVEL.error,
        printer.isTool ? traceFailure.toolMessage : traceFailure.message,
      );
    }
    printTraceOutput(printer, failure.traceOutput);
    const postcondition = failure.postcondition;
    if (postcondition?.counts) console.log(postcondition.counts);
    if (postcondition) print(postcondition.code, MESSAGE_LEVEL.error, postcondition.message);
    if (!failure.isCallStackFirst) printCallStack();
  } else if (result.violation) {
    if (!printViolation(result.status, result.violation, printer)) return;
    // TLC adds a deadlocked state to the behavior graph after it reports the deadlock, which can
    // violate a temporal property too.
    const additional = result.additionalViolation;
    if (additional) printViolation("property-violation", additional, printer);
    if (result.liveCallStack) printNestedExpressions(printer, result.liveCallStack);
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
  if (result.failure?.isWithoutStatistics) return;
  if (result.status !== "success") printLivenessEnd(printer, timing);
  if (printer.isTool) printProgress(printer, result, timing.start);
  print(
    MESSAGE_CODE.stats,
    MESSAGE_LEVEL.none,
    `${result.generatedStates} states generated, ${result.distinctStates} distinct states found, ${result.queuedStates} states left on queue.`,
  );
  // ModelChecker#printSummary prints the depth, which TLC 1.7.4 prints only after a search it
  // reports as successful, and as at least 1, and then the outdegree of a successful search.
  const is174 = printer.version === "1.7.4";
  const outDegrees = is174 ? (result.outDegrees ?? result.violationOutDegrees) : result.outDegrees;
  if (!is174 || outDegrees) {
    print(
      MESSAGE_CODE.searchDepth,
      MESSAGE_LEVEL.none,
      `The depth of the complete state graph search is ${is174 ? Math.max(result.depth, 1) : result.depth}.`,
    );
  }
  const outDegree = outDegrees && getOutDegreeSummary(outDegrees);
  if (outDegree) print(MESSAGE_CODE.stateGraphOutdegree, MESSAGE_LEVEL.none, outDegree);
};

// Like TLC, tla-ts finds a module in the directory of the spec, then in each library directory.
const findModuleFile = (directories: string[], name: string) =>
  directories.map((directory) => join(directory, `${name}.tla`)).find(existsSync);

const createModuleLoader = (directories: string[]) => (name: string) => {
  const path = findModuleFile(directories, name);
  return path === undefined ? undefined : readFileSync(path, "utf8");
};

// SimpleFilenameToStream: SANY names the file of a module it can't find, and where it looked.
const printMissingFile = (userDirectory: string, fileName: string, directories: string[]) =>
  console.error(
    `File does not exist: ${userDirectory}/${fileName} while looking in these directories: ${userDirectory}, ${directories.join(", ")}, classpath:/tla2sany/StandardModules, classpath:/`,
  );

// The URL of the directory of SANY's standard modules in a tla2tools.jar.
const getStandardModulesUrl = (jar: string) =>
  `jar:file:${pathToFileURL(resolve(jar)).pathname}!/tla2sany/StandardModules/`;

// Java's Files.createTempDirectory names a directory by a random unsigned long. tla-ts derives it
// from TLC's fingerprint of what the directory holds, so that each run of a spec prints the same
// files.
const getTemporaryName = (contents: string) => getTlcFingerprint([contents]).toString();

// The file TLC's SANY says it parses each module from: the real path of a module's own file, or a
// copy in a temporary directory of a module from the root module's file or from the jar on the
// class path, followed by where TLC copied it from.
const createFileDescriber = (
  specPath: string,
  directories: string[],
  java: JavaProperties,
  metadir: string | undefined,
  version: TlcVersion,
) => {
  const temporary = java.temporaryDirectory ?? tmpdir();
  const temporaryDirectory = existsSync(temporary) ? realpathSync(temporary) : resolve(temporary);
  const libraryDirectory = join(temporaryDirectory, `tlc-${getTemporaryName(resolve(specPath))}`);
  const jar = getJar(java);
  return (name: string, origin: SanyModuleOrigin) => {
    const fileName = `${name}.tla`;
    if (origin === "file") return realpathSync(findModuleFile(directories, name) ?? specPath);
    // TLC 1.7.4 copies a standard module into the temporary directory itself.
    if (version === "1.7.4") return join(temporaryDirectory, fileName);
    // FileUtil.createTempFile copies a module from the root module's file into the -metadir.
    if (origin === "root file") {
      const directory = metadir === undefined ? temporaryDirectory : resolve(metadir);
      const root = realpathSync(specPath);
      return `${join(directory, getTemporaryName(`${root} ${name}`), fileName)} (${root})`;
    }
    const copy = join(libraryDirectory, fileName);
    return jar === undefined ? copy : `${copy} (${getStandardModulesUrl(jar)}${fileName})`;
  };
};

const printWelcome = (printer: MessagePrinter) =>
  printer.print(MESSAGE_CODE.version, MESSAGE_LEVEL.none, `TLC2 Version ${version} (rev: tla-ts)`);

// TLC.printErrorMsg: TLC says which version it is, then why it can't read its options.
const printCommandLineError = (printer: MessagePrinter, message: string) => {
  printWelcome(printer);
  printer.print(
    MESSAGE_CODE.commandLineError,
    MESSAGE_LEVEL.error,
    `${message}\nUsage: java tlc2.TLC [-help] [-option] inputfile`,
  );
  return 1;
};

// TLC.printStartupBanner, with what runs tla-ts in place of the JVM. tla-ts keeps its fingerprints
// and its queue of states in memory.
const printStartupBanner = (printer: MessagePrinter, seed: string, workers: number) =>
  printer.print(
    MESSAGE_CODE.modelChecking,
    MESSAGE_LEVEL.none,
    `Running breadth-first search Model-Checking with fp 0 and seed ${BigInt(seed)} with ${workers} worker${workers === 1 ? "" : "s"} on ${availableParallelism()} cores with ${Math.floor(getHeapStatistics().heap_size_limit / 1024 / 1024)}MB heap and 0MB offheap memory [pid: ${process.pid}] (${type()} ${release()} ${arch()}, Node.js ${process.versions.node} ${process.arch.endsWith("64") ? 64 : 32}bit, MemFPSet, MemStateQueue).`,
  );

// TLC loads Integers for the binary trace that its trace exploration spec records. -generateSpecTE
// turns the spec on, and -tool, -continue, -noGenerateSpecTE and -noTE turn it off, as
// -noGenerateSpecTEBin and -noTEBin turn off the binary trace. TLC 1.7.4 records no such trace.
const isTraceRecorded = (args: ParsedArgs, version: TlcVersion) => {
  const flags = [...args.unknown, ...args.options.map((option) => option.name)];
  const has = (name: string, alias = name) =>
    flags.some((flag) => flag === name || flag.toLowerCase() === alias.toLowerCase());
  const isSpecGenerated =
    has("-generateSpecTE") ||
    (!has("-noGenerateSpecTE", "-noTE") && !has("-tool") && !has("-continue"));
  return version !== "1.7.4" && isSpecGenerated && !has("-noGenerateSpecTEBin", "-noTEBin");
};

const checkSpec = async (
  specPath: string,
  args: ParsedArgs,
  java: JavaProperties,
  printer: MessagePrinter,
) => {
  // TLC.handleParameters: TLC reads its options before it says which version it is.
  const seed = args.has("-seed") ? args.get("-seed")?.[0] : "0";
  if (seed === undefined) return printCommandLineError(printer, "Error: seed required.");
  if (!isJavaLong(seed)) {
    return printCommandLineError(
      printer,
      `Error: An integer for seed required. But encountered ${seed}`,
    );
  }
  const livenessCheck = args.has("-lncheck") ? args.get("-lncheck")?.[0]?.toLowerCase() : "default";
  if (livenessCheck === undefined) {
    return printCommandLineError(
      printer,
      "Error: expect a strategy such as final for -lncheck option.",
    );
  }
  const dumpValues = args.get("-dump");
  if (dumpValues?.length === 0) {
    return printCommandLineError(printer, "Error: A file name for dumping states required.");
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
  const workers = getWorkerCount(args.get("-workers"));
  const version = printer.version;
  printWelcome(printer);
  printStartupBanner(printer, seed, workers);
  const configPath =
    args.get("-config")?.[0] ??
    (args.has("-config") ? undefined : specPath.replace(/\.tla$/, ".cfg"));
  if (!configPath || !existsSync(configPath)) {
    printer.print(
      MESSAGE_CODE.configFileError,
      MESSAGE_LEVEL.error,
      `TLC encountered the following error when trying to read the configuration file ${configPath ?? ""}:\nFile not found.`,
    );
    return EXIT_STATUS.configParseError;
  }
  const fileName = basename(specPath, ".tla");
  const timing: Timing = { start: Date.now(), liveness: undefined, isParsed: false };
  // Without -tool, TLC prints how long it ran for a person to read.
  const printFinished = () => {
    const runtime = Date.now() - timing.start;
    printer.print(
      MESSAGE_CODE.finished,
      MESSAGE_LEVEL.none,
      `Finished in ${printer.isTool ? `${runtime}ms` : formatTlcDuration(runtime)} at (${formatTlcDate(new Date())})`,
    );
  };
  const printParsingFailed = () =>
    printer.print(
      MESSAGE_CODE.parsingFailed,
      MESSAGE_LEVEL.error,
      "Parsing or semantic analysis failed.",
    );
  // TLC prints how long it ran even when it stops at an error.
  const printFailure = (error: TlaError) => {
    if (error instanceof TlaSyntaxError) {
      printParsingFailed();
    } else {
      printError(error, printer);
    }
    printFinished();
    return getErrorExitCode(error);
  };
  // TLC reads the configuration file before it parses the spec, and prints how long it ran even
  // when it can't read it.
  const config = (() => {
    try {
      return parseConfig(readFileSync(configPath, "utf8"), version);
    } catch (error) {
      if (!(error instanceof TlaConfigError)) throw error;
      return error;
    }
  })();
  // TLC 1.7.4 reports a configuration file it can't parse as an exception it didn't expect.
  if (config instanceof TlaConfigError && version === "1.7.4") {
    printer.print(
      MESSAGE_CODE.general,
      MESSAGE_LEVEL.error,
      `${getUnexpectedException("tlc2.tool.ConfigFileException")}${formatNestedMessage(config.message, printer.isTool)}`,
    );
    printFinished();
    return EXIT_STATUS.error;
  }
  if (config instanceof TlaConfigError) return printFailure(config);
  if (args.has("-deadlock")) config.checkDeadlock = false;
  const directory = dirname(specPath);
  const directories = [directory, ...java.libraries];
  const loadModule = createModuleLoader(directories);
  const isRecorded = isTraceRecorded(args, version);
  const run = async () => {
    const source = readFileSync(specPath, "utf8");
    const moduleName = parseModule(source).name;
    if (moduleName !== fileName) {
      throw new TlaSanyFatalError(
        `File name '${fileName}' does not match the name '${moduleName}' of the top level module it contains.`,
        undefined,
      );
    }
    const result = await check({
      workers,
      livenessCheck: ["final", "seqfinal", "off"].includes(livenessCheck) ? "final" : "default",
      seed: BigInt(seed),
      dump: dumpValues && getDump(dumpValues),
      isTool: printer.isTool,
      isTraceRecorded: isRecorded,
      isSanyReported: true,
      isWarningEnabled: !args.has("-nowarning"),
      version,
      onProgress: (progress) => printCheckProgress(printer, progress, timing, directory),
      source,
      config,
      onPause: () => readSync(0, Buffer.alloc(1)),
      loadModule,
      loadClass: (name) => {
        const classPath = getClassPath(directory, name);
        return existsSync(classPath) ? readFileSync(classPath) : undefined;
      },
      readFile: (path) => (existsSync(path) ? readFileSync(path, "utf8") : undefined),
      writeFile: (path, content) => {
        mkdirSync(dirname(resolve(path)), { recursive: true });
        writeFileSync(path, content);
      },
    });
    printResult(result, printer, timing);
    printFinished();
    return result.failure?.exitCode ?? EXIT_CODES[result.status];
  };
  if (printer.isTool) {
    printer.print(MESSAGE_CODE.startingSany, MESSAGE_LEVEL.none, "Starting SANY...");
  }
  // TLC.handleParameters: SANY names the spec as TLC's arguments do, except that TLC runs from the
  // directory of a spec given by an absolute path, and names it by its file name. SANY looks for
  // the spec's modules in the spec's directory and the TLA-Library directories.
  const isAbsoluteSpec = isAbsolute(specPath);
  const specName = isAbsoluteSpec ? fileName : specPath.replace(/\.tla$/, "");
  const jar = getJar(java);
  const reportMissingFile =
    version === "1.7.4" ? createMissingFilePrinter174(specPath, java, jar) : undefined;
  if (reportMissingFile) {
    if (!existsSync(specPath) && !SANY_174_STANDARD_MODULES.has(fileName)) {
      reportMissingFile(`${fileName}.tla`);
    }
  } else if (!existsSync(specPath) && !SANY_STANDARD_MODULES.has(fileName)) {
    printMissingFile(
      isAbsoluteSpec ? directory : process.cwd(),
      isAbsoluteSpec ? `${fileName}.tla` : `./${specName}.tla`,
      [...(isAbsoluteSpec || directory === "." ? [] : [directory]), ...java.libraries],
    );
  }
  // TLC prints what SANY prints as it parses the spec, and the errors it rejects the spec for.
  const sany = getSanyReport(
    specPath,
    reportMissingFile ? reportMissingModules174(loadModule, reportMissingFile) : loadModule,
    {
      fileName: specName,
      describeFile: createFileDescriber(
        specPath,
        directories,
        java,
        args.get("-metadir")?.[0],
        version,
      ),
      version,
      // TLC's trace exploration spec records the trace with the post condition of _TLCTrace.
      rootExtendees: isRecorded ? ["_TLCTrace"] : undefined,
      onPrint: (text) => process.stdout.write(text),
      onPrintError: (text) => process.stderr.write(text),
    },
  );
  if (sany.isFailed) {
    printCheckProgress(printer, { kind: "parsed" }, timing, directory);
    printParsingFailed();
    printFinished();
    return EXIT_STATUS.specParseError;
  }
  try {
    return await run();
  } catch (error) {
    if (!(error instanceof TlaError)) throw error;
    if (error instanceof TlaSyntaxError) console.log(formatSanyErrors(error, fileName));
    if (!timing.isParsed) printCheckProgress(printer, { kind: "parsed" }, timing, directory);
    return printFailure(error);
  }
};

// What SANY prints about a spec it rejects: a module it can't find or parse is a fatal error, and
// it reports the other errors as semantic errors.
const formatSanyErrors = (error: TlaSyntaxError, specName: string) => {
  const isFatal = error instanceof TlaSanyFatalError;
  if (!isFatal && !error.failure)
    return `Semantic errors:\n\n*** Errors: 1\n\n${error.message}\n\n`;
  const report = !isFatal
    ? `In module ${specName}\n\nCould not parse module ${specName} from file ${specName}.tla`
    : error.location === undefined
      ? `Unknown location\n\n${error.message}`
      : `In module ${error.location}\n\n${error.message}`;
  const parseError = error.failure ? `***Parse Error***\n${error.message}\n\n` : "";
  return `${parseError}\nFatal errors while parsing TLA+ spec in file ${specName}\n\n${report}\n*** Errors: 1\n\n${report}\n\n\n`;
};

// TLC prints the errors it raises itself. tla-ts names the others, such as a module SANY rejects.
const printError = (error: TlaError, printer: MessagePrinter) => {
  if (error instanceof TlaConfigError || error instanceof TlaEvaluationError) {
    // TLC prints an error it raises with a message code, such as a configuration error, with
    // that code.
    const coded = getCodedMessage(error.message);
    const code = coded && !coded.isEvalException ? coded.code : MESSAGE_CODE.general;
    return printer.print(
      code,
      MESSAGE_LEVEL.error,
      formatInnerMessage(code, error.message, printer.isTool),
    );
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

// Runs each path in turn, as TLC runs in a process of its own, so an error in one leaves the others
// to report. The exit code is the first that is not success.
const runEach = async (
  paths: string[],
  runPath: (path: string, printer: MessagePrinter) => number | Promise<number>,
  createPrinter: () => MessagePrinter,
) => {
  const exitCodes: number[] = [];
  for (const [index, path] of paths.entries()) {
    if (index > 0) console.log("");
    const printer = createPrinter();
    exitCodes.push(await reportErrors(() => runPath(path, printer), printer));
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

const printToolboxHeader = (args: string[]) =>
  console.log(
    `\n\\* TLAPM version ${TLAPM_VERSION}\n\\* launched at ${formatTlcDate(new Date())} with command line:\n\\* ${["tla-ts", "prove", ...args].map(quoteArgument).join(" ")}\n`,
  );

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

const checkSpecs = async (args: string[], java: JavaProperties) => {
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
  // TLC also looks for the spec itself in the library directories.
  const findSpec = (path: string) =>
    existsSync(path) || isAbsolute(path)
      ? path
      : (java.libraries.map((directory) => join(directory, path)).find(existsSync) ?? path);
  const paths = [...new Set(specPaths.map(findSpec))];
  const tlcVersion = java.tlcVersion ?? "master";
  return runEach(
    paths,
    (path, printer) => {
      // TLC checks one spec, so tla-ts names each of several it checks.
      if (paths.length > 1)
        console.log(`Checking ${basename(path)} with ${basename(path, ".tla")}.cfg`);
      return checkSpec(path, parsed, java, printer);
    },
    () => createMessagePrinter(parsed.has("-tool"), !parsed.has("-nowarning"), tlcVersion),
  );
};

// XMLExporter.run prints why it cannot parse its arguments, and its usage.
const printXmlExportUsageError = (message: string) => {
  process.stderr.write(`ERROR: ${message}\n${XML_EXPORT_USAGE}`);
  return XML_EXPORT_EXIT_CODE.argsParsingFailure;
};

// XMLExporter.run writes the XML of a specification, and why it can't when it can't.
const writeXml = (specification: SanySpecification, options: XmlExportOptions) => {
  try {
    process.stdout.write(exportSanyXml(specification, options));
    return EXIT_STATUS.success;
  } catch (error) {
    if (!(error instanceof TlaUnsupportedError)) throw error;
    const exitCode = getErrorExitCode(error);
    const unwound = error instanceof TlaJavaException ? error.unwound : "";
    console.error(
      exitCode === XML_EXPORT_EXIT_CODE.uncaughtException
        ? `${unwound}Exception in thread "main" ${error.message}`
        : `ERROR: ${error.message}`,
    );
    return exitCode;
  }
};

interface XmlExportArgs {
  flags: Set<string>;
  includes: string[];
  error: "missing-include" | "several-files" | undefined;
}

// XMLExporter reads the flags before the last argument, which names the module, and skips an
// argument it does not know, which then counts as another module.
const parseXmlExportArgs = (args: string[], flagNames: Set<string>): XmlExportArgs => {
  const parsed: XmlExportArgs = { flags: new Set(), includes: [], error: undefined };
  const last = { flag: -1 };
  for (let index = 0; index < args.length - 1; index++) {
    if (flagNames.has(args[index])) {
      parsed.flags.add(args[index]);
      last.flag = index;
      continue;
    }
    if (args[index] !== "-I") continue;
    index++;
    if (index > args.length - 2) return { ...parsed, error: "missing-include" };
    parsed.includes.push(args[index]);
    last.flag = index;
  }
  return last.flag === args.length - 2 ? parsed : { ...parsed, error: "several-files" };
};

const exportXml = (args: string[]) => {
  if (args.length === 0) return printXmlExportUsageError("at least one .tla file must be given");
  const parsed = parseXmlExportArgs(args, XML_EXPORT_FLAGS);
  if (parsed.error === "missing-include") {
    return printXmlExportUsageError(
      "the -I flag must be followed by a directory and at least one .tla file",
    );
  }
  if (parsed.error === "several-files") {
    return printXmlExportUsageError("Only one TLA file to check allowed!");
  }
  const name = args[args.length - 1];
  if (name === "-help") {
    process.stdout.write(XML_EXPORT_USAGE);
    return EXIT_STATUS.success;
  }
  const fileName = name.endsWith(".tla") ? name : `${name}.tla`;
  // SANY looks for each module in the working directory, then in the -I directories, which
  // XMLExporter passes in place of TLA-Library, then among its standard modules.
  const directories = [".", ...parsed.includes];
  const path = directories.map((directory) => resolve(directory, fileName)).find(existsSync);
  if (path === undefined && !SANY_STANDARD_MODULES.has(fileName.slice(0, -".tla".length))) {
    printMissingFile(process.cwd(), `./${fileName}`, parsed.includes);
  }
  // XMLExporter.parseSpec prints SANY's errors, and XMLExporter.run why it fails.
  const sany = getSanyReport(path ?? fileName, createModuleLoader(directories), {
    fileName: name,
    isXmlExport: true,
  });
  process.stderr.write(sany.text);
  if (sany.isFailed || sany.specification === undefined) {
    console.error("ERROR: Failed to parse module.");
    return XML_EXPORT_EXIT_CODE.specParsingFailure;
  }
  return writeXml(sany.specification, {
    version: "master",
    isRestricted: parsed.flags.has("-r"),
    isUncommented: parsed.flags.has("-u"),
    isTerse: parsed.flags.has("-t"),
  });
};

// TLC 1.7.4's FileUtil.createNamedInputStream names the last file that SimpleFilenameToStream
// looked for a module in, and the directories it looks in, the standard modules in the jar last,
// which tla-ts leaves out without a jar.
const printMissingFile174 = (path: string, libraries: string[], jar: string | undefined) =>
  console.error(
    `File does not exist: ${isAbsolute(path) ? path : `${process.cwd()}/${path}`} while looking in these directories: ${[...libraries, ...(jar === undefined ? [] : [getStandardModulesUrl(jar)])].join(", ")}`,
  );

// SimpleFilenameToStream ends a library directory with a separator.
const toLibraryPath = (directory: string) =>
  directory.endsWith("/") ? directory : `${directory}/`;

// TLC 1.7.4's SimpleFilenameToStream looks for a module in the directory of a spec that TLC is
// given by an absolute path, then in the directory that a relative path names, or else in the
// TLA-Library directories.
const createMissingFilePrinter174 = (
  specPath: string,
  java: JavaProperties,
  jar: string | undefined,
) => {
  const specDirectory = specPath.slice(0, specPath.lastIndexOf("/") + 1);
  const isRelativeToDirectory = !isAbsolute(specPath) && specDirectory !== "";
  const libraries = (isRelativeToDirectory ? [specDirectory] : java.libraries).map(toLibraryPath);
  const lastDirectory =
    libraries.length > 0
      ? libraries[libraries.length - 1]
      : isAbsolute(specPath)
        ? specDirectory
        : "";
  return (fileName: string) => printMissingFile174(`${lastDirectory}${fileName}`, libraries, jar);
};

// TLC 1.7.4's SANY reports each module it can't find as it looks for it.
const reportMissingModules174 =
  (loadModule: (name: string) => string | undefined, onMissing: (fileName: string) => void) =>
  (name: string) => {
    const text = loadModule(name);
    if (text === undefined && !SANY_174_STANDARD_MODULES.has(name)) onMissing(`${name}.tla`);
    return text;
  };

// TLC 1.7.4's XMLExporter.main throws an exception for an argument it can't take or a
// specification without a root module.
const printXmlExporterException = (exception: string, line: number) => {
  console.error(
    `Exception in thread "main" ${exception}\n\tat tla2sany.xml.XMLExporter.main(XMLExporter.java:${line})`,
  );
  return XML_EXPORT_EXIT_CODE.uncaughtException;
};

// TLC 1.7.4's XMLExporter.main, which takes only -o, as it can't validate the XML without
// fetching its schema, and -I, and exports a specification that SANY finds errors in.
const exportXml174 = (args: string[], jar: string | undefined) => {
  if (args.length === 0) {
    return printXmlExporterException(
      "java.lang.IllegalArgumentException: at least one .tla file must be given",
      59,
    );
  }
  const parsed = parseXmlExportArgs(args, XML_EXPORT_174_FLAGS);
  if (parsed.error === "missing-include") {
    return printXmlExporterException(
      "java.lang.IllegalArgumentException: the -I flag must be followed by a directory and at least one .tla file",
      71,
    );
  }
  if (parsed.error === "several-files") {
    return printXmlExporterException(
      "java.lang.IllegalArgumentException: Only one TLA file to check allowed!",
      83,
    );
  }
  const name = args[args.length - 1];
  const fileName = `${name.replace(/\.tla$/i, "")}.tla`;
  // SimpleFilenameToStream looks for a module in the working directory, then in the -I
  // directories, or the root directory when there are none, then among the standard modules.
  const libraries = (parsed.includes.length === 0 ? ["/"] : parsed.includes).map(toLibraryPath);
  const directories = [".", ...libraries];
  const printMissingFile = (moduleFileName: string) =>
    printMissingFile174(`${libraries[libraries.length - 1]}${moduleFileName}`, libraries, jar);
  const path = directories.map((directory) => resolve(directory, fileName)).find(existsSync);
  if (path === undefined && !SANY_174_STANDARD_MODULES.has(basename(fileName, ".tla"))) {
    printMissingFile(fileName);
    return EXIT_STATUS.success;
  }
  const sany = getSanyReport(
    path ?? fileName,
    reportMissingModules174(createModuleLoader(directories), printMissingFile),
    {
      fileName: name,
      isXmlExport: true,
      version: "1.7.4",
    },
  );
  process.stderr.write(sany.text);
  if (sany.specification === undefined) {
    return printXmlExporterException(
      `tla2sany.xml.XMLExportingException: spec ${(path && getSanyModuleName(readFileSync(path, "utf8"), "1.7.4")) ?? "null"} is malformed - does not have a root module`,
      110,
    );
  }
  return writeXml(sany.specification, {
    version: "1.7.4",
    isRestricted: false,
    isUncommented: false,
    isTerse: true,
  });
};

// Tools that run TLC with Java, such as the statechart skill of pstack, can run tla-ts in place of
// java, as in `tla-ts -DTLA-Library=lib -cp tla2tools.jar tlc2.TLC Spec`. tla-ts searches the
// TLA-Library directories for modules as TLC does, though not as XMLExporter, which ignores them,
// names the files in java.io.tmpdir and the jar on the class path that TLC would copy and read
// modules from, and ignores the other options. It reproduces the TLC of that jar, or the one that
// -Dtla-ts.tlc names without a jar, as in `tla-ts -Dtla-ts.tlc=1.7.4 tlc2.TLC Spec`.
const JAVA_MAIN_CLASSES = ["tlc2.TLC", "tla2sany.xml.XMLExporter"];

const TLA_LIBRARY_PROPERTY = "-DTLA-Library=";

const TEMPORARY_DIRECTORY_PROPERTY = "-Djava.io.tmpdir=";

const TLC_VERSION_PROPERTY = "-Dtla-ts.tlc=";

// What the java command sets for TLC: the TLA-Library directories it searches for modules, the
// class path it finds its standard modules on, and java.io.tmpdir, where it copies them.
interface JavaProperties {
  libraries: string[];
  classPath?: string;
  temporaryDirectory?: string;
  tlcVersion?: TlcVersion;
}

// The tla2tools.jar on the class path.
const getJar = (java: JavaProperties) =>
  java.classPath?.split(delimiter).find((entry) => entry.endsWith(".jar"));

interface JavaLaunch {
  mainClass: string;
  args: string[];
  java: JavaProperties;
}

const getJavaLaunch = (args: string[]): JavaLaunch | undefined => {
  const java: JavaProperties = { libraries: [] };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "-cp" || arg === "-classpath" || arg === "--class-path") {
      index++;
      java.classPath = args[index];
    } else if (arg === "-jar") {
      java.classPath = args[index + 1];
      return { mainClass: "tlc2.TLC", args: args.slice(index + 2), java };
    } else if (arg.startsWith(TLA_LIBRARY_PROPERTY)) {
      java.libraries.push(...arg.slice(TLA_LIBRARY_PROPERTY.length).split(delimiter));
    } else if (arg.startsWith(TEMPORARY_DIRECTORY_PROPERTY)) {
      java.temporaryDirectory = arg.slice(TEMPORARY_DIRECTORY_PROPERTY.length);
    } else if (arg.startsWith(TLC_VERSION_PROPERTY)) {
      java.tlcVersion = arg.slice(TLC_VERSION_PROPERTY.length) === "1.7.4" ? "1.7.4" : "master";
    } else if (!arg.startsWith("-D") && !arg.startsWith("-X")) {
      const isLaunch = index > 0 || JAVA_MAIN_CLASSES.includes(arg);
      return isLaunch ? { mainClass: arg, args: args.slice(index + 1), java } : undefined;
    }
  }
  return undefined;
};

const runJavaClass = (launch: JavaLaunch) => {
  if (launch.mainClass === "tlc2.TLC") return checkSpecs(launch.args, launch.java);
  if (launch.mainClass === "tla2sany.xml.XMLExporter") {
    return reportErrors(() =>
      launch.java.tlcVersion === "1.7.4"
        ? exportXml174(launch.args, getJar(launch.java))
        : exportXml(launch.args),
    );
  }
  console.error(
    `Error: tla-ts runs the Java classes ${JAVA_MAIN_CLASSES.join(" and ")}, not ${launch.mainClass}.`,
  );
  return 1;
};

const run = async (args: string[]) => {
  if (args[0] === "prove") return reportErrors(() => prove(args.slice(1)));
  const launch = getJavaLaunch(args);
  if (launch === undefined) return checkSpecs(args, { libraries: [] });
  // The TLC that -Dtla-ts.tlc names, or else the one of the jar on the class path.
  launch.java.tlcVersion ??= await getTlcVersion(getJar(launch.java));
  return runJavaClass(launch);
};

export const runCli = async () => {
  process.exitCode = await run(process.argv.slice(2));
};
