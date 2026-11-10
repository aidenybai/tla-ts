import {
  appendFileSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { arch, availableParallelism, release, tmpdir, type } from "node:os";
import { pathToFileURL } from "node:url";
import { getHeapStatistics } from "node:v8";
import { version } from "../../package.json";
import type { Expression } from "../ast";
import type { CoverageReport } from "../coverage";
import { describeRange } from "../evaluate";
import type {
  CheckOptions,
  CheckProgress,
  InitialStateViolation,
  ModuleOperator,
  OutputLine,
  CheckResult,
  CheckStatus,
  InitialStates,
  SearchStatistics,
  TraceStep,
  Violation,
} from "../check";
import { parseConfig } from "../config";
import { checkDepthFirst, type DepthFirstOutput } from "../dfid";
import {
  TlaConfigError,
  TlaError,
  TlaEvaluationError,
  TlaSyntaxError,
  getUnexpectedException,
  UNEXPECTED_EXCEPTION,
  TlaSanyFatalError,
} from "../errors";
import { EXIT_STATUS, setExitCode } from "../exit-codes";
import { check } from "../parallel";
import { extractModule, parseModule } from "../parser";
import { simulate, type SimulationOutput, type SimulationStatistics } from "../simulate";
import type { StateDump } from "../state-graph";
import {
  formatProbability,
  getActualProbability,
  getOptimisticProbability,
  getOutDegreeSummary,
} from "../tlc/summary";
import {
  getSanyStandardModules,
  SANY_174_STANDARD_MODULES,
  SANY_STANDARD_MODULES,
} from "../sany/modules";
import { getSanyReport, type SanyModuleOrigin } from "../sany/report";
import { getTlcFingerprint } from "../tlc/fingerprint";
import type { TlcVersion } from "../tlc/version";
import {
  createMessagePrinter,
  formatTlcDate,
  formatInnerMessage,
  formatNestedMessage,
  formatTlcDuration,
  MESSAGE_CODE,
  MESSAGE_LEVEL,
  type MessagePrinter,
} from "../tlc/messages";
import { formatState } from "../values";
import { USAGE } from "./options";
import { addRuntimeInvariants } from "./runtime-invariants";
import { parseTlcArguments, type TlcArguments } from "./tlc-arguments";
import {
  createModuleLoader,
  findModuleFile,
  getInputPaths,
  getToolsJar,
  getStandardModulesUrl,
  getTopLevelExitCode,
  printError,
  printMissingFile,
  printMissingFile174,
  reportErrors,
  reportMissingModules174,
  toLibraryPath,
  type JavaProperties,
} from "./shared";

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

const checkNotDirectory = (path: string) => {
  if (statSync(path, { throwIfNoEntry: false })?.isDirectory()) {
    throw new TlaEvaluationError(`${path} (Is a directory)`);
  }
};

const getDumpPath = (path: string, extension: string) =>
  path.endsWith(extension) ? path : `${path}${extension}`;

const getStateDump = (values: string[]): StateDump => {
  if (values.length === 1) return { path: getDumpPath(values[0], ".dump") };
  const format = values[0].toLowerCase();
  return {
    path: getDumpPath(values[1], ".dot"),
    dot: true,
    colorize: format.includes("colorize"),
    actionLabels: format.includes("actionlabels"),
    snapshot: format.includes("snapshot"),
    constrained: format.includes("constrained"),
    stuttering: format.includes("stuttering"),
    strict: format.includes("strict"),
  };
};

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

interface TlcPrinter extends MessagePrinter {
  isDiffTrace: boolean;
}

const BEHAVIOR = {
  code: MESSAGE_CODE.behaviorUpToThisPoint,
  text: "The behavior up to this point is:",
};

// TLC's -difftrace prints in full the last state of a behavior it rebuilds from the state graph.
const printTrace = (
  printer: TlcPrinter,
  trace: TraceStep[],
  heading: { code: number; text: string } = BEHAVIOR,
  isRebuiltAfterHeading = false,
  isLastDiffed = heading !== BEHAVIOR,
) => {
  if (trace.length > 0) printer.print(heading.code, MESSAGE_LEVEL.error, heading.text);
  trace.forEach((step, index) => {
    if (index > 0 || isRebuiltAfterHeading) printTraceOutput(printer, step.output);
    const isDiffed = printer.isDiffTrace && index > 0 && (isLastDiffed || index < trace.length - 1);
    printer.print(
      MESSAGE_CODE.statePrint2,
      MESSAGE_LEVEL.state,
      `${index + 1}: <${step.label ?? step.action ?? "Initial predicate"}>\n${formatState(step.state, isDiffed ? trace[index - 1].state : undefined)}`,
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

// Innermost first, skipping a source the same as the one inside it.
const formatFingerprintTrace = (sources: Expression[]) =>
  sources
    .filter((source, index) => source !== sources[index - 1])
    .map((source, index) => `${index}) ${describeRange(source)}\n`)
    .toReversed()
    .join("");

// Skips an expression that TLC evaluates again right inside itself.
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
  startTime: number;
  isParsed: boolean;
  livenessStartTime: number | undefined;
}

// TLC reports a depth of at least 1, even before it finds a state, and rates a minute only once the
// search has started.
const printProgress = (
  printer: MessagePrinter,
  statistics: SearchStatistics,
  startTime?: number,
) => {
  const minutes = Math.max(Date.now() - (startTime ?? 0), 1) / 60_000;
  const formatCount = (count: number) => count.toLocaleString("en-US");
  const getRate = (count: number, unit: string) =>
    startTime === undefined ? "" : ` (${formatCount(Math.floor(count / minutes))} ${unit}/min)`;
  printer.print(
    MESSAGE_CODE.progress,
    MESSAGE_LEVEL.none,
    `Progress(${Math.max(statistics.depth, 1)}) at ${formatTlcDate(new Date())}: ${formatCount(statistics.generatedStates)} states generated${getRate(statistics.generatedStates, "s")}, ${formatCount(statistics.distinctStates)} distinct states found${getRate(statistics.distinctStates, "ds")}, ${formatCount(statistics.queuedStates)} states left on queue.`,
  );
};

const COVERAGE_CODES = {
  init: MESSAGE_CODE.coverageInit,
  next: MESSAGE_CODE.coverageNext,
  invariant: MESSAGE_CODE.coverageProperty,
  implied: MESSAGE_CODE.coverageProperty,
  constraint: MESSAGE_CODE.coverageConstraint,
};

// TLC asks to turn coverage off once a check that reports it has run for five minutes.
const COVERAGE_OVERHEAD = 5 * 60_000;

const printCoverage = (printer: MessagePrinter, coverage: CoverageReport, startTime: number) => {
  const print = (code: number, text: string) => printer.print(code, MESSAGE_LEVEL.none, text);
  print(
    MESSAGE_CODE.coverageStart,
    `The coverage statistics at ${formatTlcDate(new Date())} (see https://explain.tlapl.us/module-coverage-statistics for how to interpret the following statistics).`,
  );
  coverage.variables.forEach((variable) =>
    print(MESSAGE_CODE.coverageVariable, `<${variable.label}>: ${variable.distinct}`),
  );
  coverage.relations.forEach((relation) => {
    const code = COVERAGE_CODES[relation.kind];
    print(
      code,
      code === MESSAGE_CODE.coverageProperty
        ? `<${relation.label}>`
        : `<${relation.label}>: ${relation.distinct}:${relation.generated}`,
    );
    relation.expressions.forEach((expression) => {
      const location = `  ${"|".repeat(expression.depth)}${expression.location}`;
      if (expression.cost > 0) {
        print(
          MESSAGE_CODE.coverageValueCost,
          `${location}: ${expression.count}:${expression.cost}`,
        );
      } else print(MESSAGE_CODE.coverageValue, `${location}: ${expression.count}`);
    });
  });
  if (Date.now() - startTime > COVERAGE_OVERHEAD) {
    print(
      MESSAGE_CODE.coverageEndOverhead,
      "End of statistics (please note that for performance reasons large models\nare best checked with coverage and cost statistics disabled).",
    );
  } else print(MESSAGE_CODE.coverageEnd, "End of statistics.");
};

const getClassPath = (directory: string, module: string) => join(directory, `${module}.class`);

const printCheckProgress = (
  printer: TlcPrinter,
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
      printProgress(printer, progress.statistics, timing.startTime);
      if (progress.statistics.coverage) {
        printCoverage(printer, progress.statistics.coverage, timing.startTime);
      }
      return;
    case "liveness-started": {
      timing.livenessStartTime = Date.now();
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
    case "sequential-fallback":
      process.stderr.write(
        `Warning: the search created the string ${JSON.stringify(progress.string)}, so tla-ts checks the model again with one worker. Workers agree on the order of strings only when the strings exist before the search.\n`,
      );
      return;
    case "warning":
      print(progress.code, MESSAGE_LEVEL.warning, progress.text);
      return;
    case "violation":
      printViolation(progress.status, progress.violation, printer);
  }
};

const printLivenessEnd = (printer: MessagePrinter, timing: Timing) => {
  if (timing.livenessStartTime === undefined) return;
  printer.print(
    MESSAGE_CODE.checkingTemporalEnd,
    MESSAGE_LEVEL.none,
    `Finished checking temporal properties in ${formatTlcDuration(Date.now() - timing.livenessStartTime)} at ${formatTlcDate(new Date())}`,
  );
  timing.livenessStartTime = undefined;
};

// Returns whether TLC goes on to print the statistics of the search.
const printViolation = (status: CheckStatus, violation: Violation, printer: TlcPrinter) => {
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
      text: formatInnerMessage(
        violation.postcondition?.code ?? MESSAGE_CODE.general,
        violation.message ?? `Postcondition ${name} is false.`,
        printer.isTool,
      ),
    },
  }[status];
  // A safety property's counterexample ends where it breaks, and a liveness one loops back.
  const isProperty = status === "property-violation";
  const isLasso = loopStart !== undefined && !isProperty;
  const isCounterExample = isProperty || isLasso;
  // TLC rebuilds a liveness counterexample before it reports the violation, and 1.7.4 after it
  // prints the counterexample's heading.
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
  }
  printTraceOutput(printer, violation.traceOutput);
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
  printTraceOutput(printer, violation.postconditionOutput);
  if (postcondition?.counts) console.log(postcondition.counts);
  if (postcondition) {
    print(
      postcondition.code,
      MESSAGE_LEVEL.error,
      formatInnerMessage(postcondition.code, postcondition.message, printer.isTool),
    );
  }
  // TLC checks assumptions before it starts the search, so it has no statistics to print.
  return !isInitial && status !== "assumption-violation";
};

const printNestedExpressions = (printer: MessagePrinter, callStack: Expression[]) =>
  printer.print(
    MESSAGE_CODE.nestedExpression,
    MESSAGE_LEVEL.error,
    `The error occurred when TLC was evaluating the nested\nexpressions at the following positions:\n${formatCallStack(callStack)}`,
  );

const printSuccess = (printer: MessagePrinter, optimistic: number, actual: number | undefined) =>
  printer.print(
    MESSAGE_CODE.success,
    MESSAGE_LEVEL.none,
    [
      "Model checking completed. No error has been found.",
      "  Estimates of the probability that TLC did not check all reachable states",
      "  because two distinct states had the same fingerprint:",
      `  calculated (optimistic):  val = ${formatProbability(optimistic)}`,
      ...(actual === undefined
        ? []
        : [`  based on the actual fingerprints:  val = ${formatProbability(actual)}`]),
    ].join("\n"),
  );

const printDepthFirst = (printer: TlcPrinter, output: DepthFirstOutput) => {
  switch (output.kind) {
    case "message":
      printer.print(
        output.code,
        output.isError ? MESSAGE_LEVEL.error : MESSAGE_LEVEL.none,
        printer.isTool ? output.toolMessage : output.message,
      );
      return;
    case "behavior":
      output.states.forEach((state, index) =>
        output.isInvariant
          ? printer.print(
              MESSAGE_CODE.statePrint2,
              MESSAGE_LEVEL.state,
              `${index + 1}: \n${formatState(state, printer.isDiffTrace ? output.states[index - 1] : undefined)}`,
            )
          : printer.print(
              MESSAGE_CODE.statePrint1,
              MESSAGE_LEVEL.state,
              `${index + 1}:\n${formatState(state)}`,
            ),
      );
      return;
    case "nested-expressions":
      printNestedExpressions(printer, output.callStack);
      return;
    case "success":
      printSuccess(printer, output.optimistic, output.actual);
  }
};

const printResult = (result: CheckResult, printer: TlcPrinter, timing: Timing) => {
  const print = printer.print;
  if (result.failure) {
    const failure = result.failure;
    const message = printer.isTool ? failure.toolMessage : failure.message;
    const printCallStack = () => {
      const fingerprint = failure.fingerprint;
      if (fingerprint) {
        // TLC prints the call stack when the replay has one, and otherwise the sources of the values it
        // failed to fingerprint. TLC 1.7.4 always prints the sources.
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
    // checker, as an exception TLC did not expect.
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
    if (postcondition) {
      print(
        postcondition.code,
        MESSAGE_LEVEL.error,
        formatInnerMessage(postcondition.code, postcondition.message, printer.isTool),
      );
    }
    if (!failure.isCallStackFirst) printCallStack();
  } else if (result.violation) {
    if (!printViolation(result.status, result.violation, printer)) return;
    // TLC adds a deadlocked state to the behavior graph after it reports the deadlock, which can
    // violate a temporal property too.
    const additionalViolation = result.additionalViolation;
    if (additionalViolation) printViolation("property-violation", additionalViolation, printer);
    if (result.liveCallStack) printNestedExpressions(printer, result.liveCallStack);
  } else {
    printLivenessEnd(printer, timing);
    printSuccess(
      printer,
      getOptimisticProbability(result.distinctStates, result.generatedStates),
      result.fingerprintDistance === undefined
        ? undefined
        : getActualProbability(result.fingerprintDistance),
    );
  }
  if (result.failure?.isWithoutStatistics) return;
  if (result.status !== "success") printLivenessEnd(printer, timing);
  if (result.coverage) printCoverage(printer, result.coverage, timing.startTime);
  if (printer.isTool) printProgress(printer, result, timing.startTime);
  print(
    MESSAGE_CODE.stats,
    MESSAGE_LEVEL.none,
    `${result.generatedStates} states generated, ${result.distinctStates} distinct states found, ${result.queuedStates} states left on queue.`,
  );
  // TLC 1.7.4 prints the depth only after a search it reports as successful, and as at least 1.
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

// Java names the directory by a random unsigned long. tla-ts derives it from what the directory
// holds, so that each run of a spec prints the same files.
const getTemporaryName = (contents: string) => getTlcFingerprint([contents]).toString();

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
  const jar = getToolsJar(java);
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

// ModelConfig needs a final newline to end a trailing \* comment.
const getEmbeddedConfig = (contents: string, name: string) => {
  const lines = contents.split(/\r?\n/);
  const start = lines.findIndex(
    (line) => line.match(/^-----*\s*CONFIG\s+(\S+?)\s*-----*$/)?.[1] === name,
  );
  if (start === -1) return "\n";
  const end = lines.findIndex((line, index) => index > start && line.startsWith("===="));
  return `${lines
    .slice(start + 1, end === -1 ? undefined : end)
    .join("\n")
    .trim()}\n`;
};

const printCommandLineError = (printer: MessagePrinter, message: string) => {
  printWelcome(printer);
  printer.print(
    MESSAGE_CODE.commandLineError,
    MESSAGE_LEVEL.error,
    `${message}\nUsage: java tlc2.TLC [-help] [-option] inputfile`,
  );
  return 1;
};

// tla-ts keeps its fingerprints and its queue of states in memory.
const printStartupBanner = (printer: MessagePrinter, args: TlcArguments) => {
  const workers = `${args.workers} worker${args.workers === 1 ? "" : "s"} on ${availableParallelism()} cores with ${Math.floor(getHeapStatistics().heap_size_limit / 1024 / 1024)}MB heap and 0MB offheap memory [pid: ${process.pid}] (${type()} ${release()} ${arch()}, Node.js ${process.versions.node} ${process.arch.endsWith("64") ? 64 : 32}bit`;
  if (args.mode === "model-check" && args.dfidDepth !== undefined) {
    printer.print(
      MESSAGE_CODE.depthFirstModelChecking,
      MESSAGE_LEVEL.none,
      `Running depth-first search Model-Checking with fp ${args.fingerprintIndex} and seed ${args.seed} with ${workers}).`,
    );
    return;
  }
  if (args.mode === "model-check") {
    printer.print(
      MESSAGE_CODE.modelChecking,
      MESSAGE_LEVEL.none,
      `Running breadth-first search Model-Checking with fp ${args.fingerprintIndex} and seed ${args.seed} with ${workers}, MemFPSet, MemStateQueue).`,
    );
    return;
  }
  printer.print(
    MESSAGE_CODE.simulating,
    MESSAGE_LEVEL.none,
    `Running ${args.scheduler === "rl" ? "RL" : "Random"} Simulation with seed ${args.seed} with ${workers}).`,
  );
};

const printSimulation = (printer: TlcPrinter, output: SimulationOutput) => {
  const print = printer.print;
  switch (output.kind) {
    case "message":
      print(
        output.code,
        output.isError ? MESSAGE_LEVEL.error : MESSAGE_LEVEL.none,
        printer.isTool ? output.toolMessage : output.message,
      );
      return;
    case "behavior": {
      const last = output.trace[output.trace.length - 1];
      if (!output.isLastStateOnly) {
        printTrace(printer, output.trace, BEHAVIOR, false, true);
        return;
      }
      print(MESSAGE_CODE.errorState, MESSAGE_LEVEL.none, "The error state is:\n");
      print(MESSAGE_CODE.statePrint1, MESSAGE_LEVEL.state, `:\n${formatState(last.state)}`);
      return;
    }
    case "progress": {
      const statistics = output.statistics;
      if (printer.isTool) {
        printSimulationProgress(printer, statistics);
        return;
      }
      const variance = statistics.levelM2 / (statistics.traces + 1);
      print(
        MESSAGE_CODE.simulationProgress,
        MESSAGE_LEVEL.none,
        `Progress: ${statistics.generatedStates} states checked, ${statistics.traces} traces generated (trace length: mean=${statistics.levelMean}, var(x)=${Math.round(variance)}, sd=${Math.round(Math.sqrt(variance))})`,
      );
      return;
    }
    case "summary":
      if (printer.isTool) printSimulationProgress(printer, output.statistics);
      print(
        MESSAGE_CODE.simulationStats,
        MESSAGE_LEVEL.none,
        `The number of states generated: ${output.statistics.generatedStates}\nSimulation using seed ${output.statistics.seed} and aril ${output.statistics.aril}`,
      );
  }
};

const printSimulationProgress = (printer: MessagePrinter, statistics: SimulationStatistics) =>
  printer.print(
    MESSAGE_CODE.simulationProgress,
    MESSAGE_LEVEL.none,
    `Progress(${statistics.traces}) at ${formatTlcDate(new Date())}: ${statistics.generatedStates} states generated, -1 distinct states found, -1 states left on queue.`,
  );

// Java's Path drops repeated and trailing separators.
const getJavaPath = (path: string) => path.replace(/\/+/g, "/").replace(/(.)\/$/, "$1");

const getJavaParent = (path: string) => {
  const normalized = getJavaPath(path);
  const separator = normalized.lastIndexOf("/");
  return separator === -1 ? "." : normalized.slice(0, Math.max(separator, 1));
};

const resolveJavaPath = (directory: string, name: string) =>
  directory.endsWith("/") ? `${directory}${name}` : `${directory}/${name}`;

// -generateSpecTE turns the trace exploration spec on, and -tool, -continue, -noGenerateSpecTE,
// -noTE and a spec TLC named as a trace spec turn it off. TLC 1.7.4 writes no such spec.
const getTraceSpecLocation = (
  args: TlcArguments,
  version: TlcVersion,
  mainFile: string,
  startTime: number,
) => {
  const isGenerated =
    version !== "1.7.4" &&
    (args.isTraceSpecForced ||
      (!args.isTraceSpecDisabled &&
        !args.isTool &&
        !args.isContinued &&
        !basename(mainFile).includes("_TTrace")));
  if (!isGenerated) return undefined;
  const output = args.traceSpecPath;
  const module = `${basename(mainFile)}_TTrace_${Math.floor(startTime / 1000)}`;
  const location =
    output === undefined
      ? { directory: getJavaParent(mainFile), module }
      : output.toLowerCase().endsWith(".tla")
        ? { directory: getJavaParent(output), module: basename(output).replace(/\.tla$/, "") }
        : { directory: getJavaPath(output), module };
  return {
    ...location,
    traceFile: args.isTraceBinaryDisabled
      ? undefined
      : resolveJavaPath(location.directory, `${location.module}.bin`),
  };
};

const JAVA_FILE_ERRORS: Record<string, string> = {
  ENOENT: "No such file or directory",
  ENOTDIR: "Not a directory",
  EISDIR: "Is a directory",
  EACCES: "Permission denied",
};

// TLC writes files with a FileOutputStream, which names the path and the system's error.
const writeJavaFile = (path: string, content: string | Uint8Array) => {
  try {
    writeFileSync(path, content);
  } catch (error) {
    const reason =
      error instanceof Error && "code" in error ? JAVA_FILE_ERRORS[String(error.code)] : undefined;
    if (reason === undefined) throw error;
    throw new TlaEvaluationError(`${path} (${reason})`);
  }
};

// Java's File#mkdirs reports a failure only through its result, which TLC ignores.
const makeJavaDirectory = (path: string) => {
  try {
    mkdirSync(path, { recursive: true });
  } catch {}
};

const createMetadir = (args: TlcArguments) => {
  const now = new Date();
  const pad = (value: number, length = 2) => String(value).padStart(length, "0");
  const name = `${pad(now.getFullYear() % 100)}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}`;
  const directory = join(args.metadir ?? "states", name);
  mkdirSync(directory, { recursive: true });
  return directory;
};

const checkSpec = async (
  specPath: string,
  args: TlcArguments,
  dump: StateDump | undefined,
  java: JavaProperties,
  printer: TlcPrinter,
) => {
  const workers = args.workers;
  const livenessCheck = args.livenessCheck;
  const seed = args.seed;
  const version = printer.version;
  printWelcome(printer);
  printStartupBanner(printer, args);
  const configPath = args.configPath ?? specPath.replace(/\.tla$/, ".cfg");
  if (!existsSync(configPath)) {
    printer.print(
      MESSAGE_CODE.configFileError,
      MESSAGE_LEVEL.error,
      `TLC encountered the following error when trying to read the configuration file ${configPath}:\nFile not found.`,
    );
    return EXIT_STATUS.configParseError;
  }
  const fileName = basename(specPath, ".tla");
  const timing: Timing = { startTime: Date.now(), livenessStartTime: undefined, isParsed: false };
  const printFinished = () => {
    const runtime = Date.now() - timing.startTime;
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
    return getTopLevelExitCode(error);
  };
  // TLC reads the configuration file before it parses the spec, and prints how long it ran even
  // when it can't read it.
  const config = (() => {
    try {
      const contents = readFileSync(configPath, "utf8");
      return parseConfig(
        configPath.endsWith(".tla")
          ? getEmbeddedConfig(contents, configPath.replaceAll(".tla", ""))
          : contents,
        version,
      );
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
  if (!args.isDeadlockChecked) config.checkDeadlock = false;
  const directory = dirname(specPath);
  const directories = [directory, ...java.libraries];
  const loadModule = createModuleLoader(directories);
  const traceSpec = getTraceSpecLocation(
    args,
    version,
    specPath.replace(/\.tla$/, ""),
    timing.startTime,
  );
  const getOperatorModules = (kind: ModuleOperator["kind"]) =>
    args.moduleOperators
      .filter((operator) => operator.kind === kind)
      .map((operator) => operator.module);
  if (printer.isTool) {
    printer.print(MESSAGE_CODE.startingSany, MESSAGE_LEVEL.none, "Starting SANY...");
  }
  // TLC runs from the directory of a spec given by an absolute path, and names it by its file name.
  const isAbsoluteSpec = isAbsolute(specPath);
  const specName = isAbsoluteSpec ? fileName : specPath.replace(/\.tla$/, "");
  const jar = getToolsJar(java);
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
  const sany = getSanyReport(
    specPath,
    reportMissingFile ? reportMissingModules174(loadModule, reportMissingFile) : loadModule,
    {
      fileName: specName,
      describeFile: createFileDescriber(specPath, directories, java, args.metadir, version),
      version,
      // TLC's trace exploration spec records the trace with the post condition of _TLCTrace.
      rootExtendees: [
        ...getOperatorModules("postcondition"),
        ...(traceSpec?.traceFile === undefined ? [] : ["_TLCTrace"]),
        ...args.invariants.flatMap((invariant) => invariant.modules),
        ...getOperatorModules("constraint"),
        ...getOperatorModules("view").slice(0, 1),
      ],
      suppressedCodes: args.suppressedCodes,
      errorCodes: args.errorCodes,
      onPrint: (text) => process.stdout.write(text),
      onPrintError: (text) => process.stderr.write(text),
    },
  );
  const specification = sany.specification;
  if (sany.isFailed || specification === undefined) {
    printCheckProgress(printer, { kind: "parsed" }, timing, directory);
    printParsingFailed();
    printFinished();
    return EXIT_STATUS.specParseError;
  }
  try {
    const source = readFileSync(specPath, "utf8");
    const moduleName = parseModule(source).name;
    if (moduleName !== fileName) {
      throw new TlaSanyFatalError(
        `File name '${fileName}' does not match the name '${moduleName}' of the top level module it contains.`,
        undefined,
      );
    }
    const userFile = args.userFile;
    const standardModules = getSanyStandardModules(version);
    const invariants = addRuntimeInvariants(
      source,
      specification.root,
      args.invariants,
      (name) => loadModule(name) ?? standardModules.get(name) ?? extractModule(source, name),
      version,
    );
    config.invariants.push(...invariants.names);
    const options: CheckOptions = {
      workers,
      livenessCheck:
        livenessCheck === "off"
          ? "off"
          : ["final", "seqfinal"].includes(livenessCheck)
            ? "final"
            : "default",
      seed,
      fingerprintPolynomial: args.fingerprintIndex,
      maxSetSize: args.maxSetSize,
      isLazyValueExpanded: args.isLazyValueExpanded,
      isViewPrinted: args.isViewPrinted,
      dump,
      isTool: printer.isTool,
      isContinued: args.isContinued,
      moduleOperators: args.moduleOperators,
      traceSpec,
      coverage: args.coverage,
      isSanyReported: true,
      isWarningEnabled: args.isWarningEnabled,
      version,
      onProgress: (progress) => printCheckProgress(printer, progress, timing, directory),
      onPrint: userFile === undefined ? undefined : (text) => appendFileSync(userFile, `${text}\n`),
      source: invariants.source,
      config,
      onPause: () => readSync(0, Buffer.alloc(1)),
      loadModule,
      loadClass: (name) => {
        const classPath = getClassPath(directory, name);
        return existsSync(classPath) ? readFileSync(classPath) : undefined;
      },
      readFile: (path) => {
        checkNotDirectory(path);
        return existsSync(path) ? readFileSync(path, "utf8") : undefined;
      },
      writeFile: writeJavaFile,
      makeDirectory: makeJavaDirectory,
    };
    if (args.mode !== "model-check") {
      const status = simulate({
        ...options,
        traceDepth: args.traceDepth,
        traceCount: args.traceCount,
        aril: args.aril,
        isGenerating: args.mode === "generate",
        scheduler: args.scheduler,
        onSimulation: (output) => printSimulation(printer, output),
      });
      printFinished();
      return status;
    }
    if (args.dfidDepth !== undefined) {
      const status = checkDepthFirst({
        ...options,
        maxDepth: args.dfidDepth,
        onOutput: (output) => printDepthFirst(printer, output),
      });
      printFinished();
      return status;
    }
    const result = await check(options);
    printResult(result, printer, timing);
    printFinished();
    if (traceSpec && result.traceSpec !== undefined) {
      const path = resolveJavaPath(traceSpec.directory, `${traceSpec.module}.tla`);
      makeJavaDirectory(traceSpec.directory);
      const failure = (() => {
        try {
          writeJavaFile(path, result.traceSpec);
          return undefined;
        } catch (error) {
          if (!(error instanceof TlaEvaluationError)) throw error;
          return error;
        }
      })();
      printer.print(
        failure ? MESSAGE_CODE.traceSpecFailed : MESSAGE_CODE.traceSpecWritten,
        MESSAGE_LEVEL.none,
        failure
          ? `Failed to generate trace exploration spec; error message: ${failure.message}`
          : `Trace exploration spec path: ${path}`,
      );
    }
    return result.failure?.exitCode ?? EXIT_CODES[result.status];
  } catch (error) {
    if (!(error instanceof TlaError)) throw error;
    if (error instanceof TlaSyntaxError) console.log(formatSanyErrors(error, fileName));
    if (!timing.isParsed) printCheckProgress(printer, { kind: "parsed" }, timing, directory);
    return printFailure(error);
  }
};

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

export const checkSpecs = async (args: string[], java: JavaProperties) => {
  const version = java.tlcVersion ?? "master";
  const parsed = parseTlcArguments(args);
  if ("error" in parsed) {
    if (parsed.isUncaught) {
      console.error(`Exception in thread "main" ${parsed.error}`);
      return 1;
    }
    return printCommandLineError(createMessagePrinter(parsed.isTool, true, version), parsed.error);
  }
  if (parsed.isUsage) {
    console.log(USAGE);
    return 1;
  }
  if (parsed.isRecovering) {
    console.error("Error: tla-ts can't recover a model check from a checkpoint.");
    return 1;
  }
  // TLC opens the file of a -dump as it reads its arguments, in the meta directory it creates.
  const dump =
    parsed.dump &&
    getStateDump(
      parsed.dump.map((value) =>
        value.includes("${metadir}") ? value.replace("${metadir}", createMetadir(parsed)) : value,
      ),
    );
  const dumpPath = dump?.path;
  if (dumpPath !== undefined) {
    try {
      closeSync(openSync(dumpPath, "w"));
    } catch {
      console.log(`Error: Unable to write to file ${dumpPath}`);
      return printCommandLineError(
        createMessagePrinter(parsed.isTool, true, version),
        `Error: Given file name ${dumpPath} for dumping states invalid.`,
      );
    }
  }
  const inputs = getInputPaths(parsed.specs);
  const isConfigured = parsed.configPath !== undefined;
  // A spec named without an extension is the .tla file of that name. A glob also matches modules
  // that only other specs import, which have no configuration.
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
    return printCommandLineError(
      createMessagePrinter(parsed.isTool, true, version),
      "Error: Missing input TLA+ module.",
    );
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
  // Each spec is checked as TLC would in a process of its own, so an error in one leaves the others
  // to report. The exit code is the first that is not success.
  const exitCodes: number[] = [];
  for (const [index, path] of paths.entries()) {
    if (index > 0) console.log("");
    // TLC checks one spec, so tla-ts names each of several it checks.
    if (paths.length > 1)
      console.log(`Checking ${basename(path)} with ${basename(path, ".tla")}.cfg`);
    const printer = {
      ...createMessagePrinter(
        parsed.isTool,
        parsed.isWarningEnabled,
        version,
        parsed.suppressedCodes,
        parsed.errorCodes,
      ),
      isDiffTrace: parsed.isDiffTrace,
    };
    exitCodes.push(await reportErrors(() => checkSpec(path, parsed, dump, java, printer), printer));
  }
  return exitCodes.find((exitCode) => exitCode !== EXIT_STATUS.success) ?? EXIT_STATUS.success;
};

// TLC 1.7.4 looks in the directory of a spec given by an absolute path, then in the directory a
// relative path names, or else in the TLA-Library directories.
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
