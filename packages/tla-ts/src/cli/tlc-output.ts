import { join, resolve } from "node:path";
import { arch, availableParallelism, release, type } from "node:os";
import { pathToFileURL } from "node:url";
import { getHeapStatistics } from "node:v8";
import { version } from "../../package.json";
import type { Expression } from "../ast";
import type { CoverageReport } from "../coverage";
import { describeRange } from "../evaluate";
import type {
  CheckProgress,
  InitialStateViolation,
  OutputLine,
  Postcondition,
  CheckResult,
  CheckStatus,
  InitialStates,
  SearchStatistics,
  TraceStep,
  Violation,
} from "../check";
import type { DepthFirstOutput } from "../dfid";
import { TlaAliasFormatError, TlaEvaluationError, UNEXPECTED_EXCEPTION } from "../errors";
import { EXIT_STATUS, setExitCode } from "../exit-codes";
import type { SimulationOutput, SimulationStatistics } from "../simulate";
import {
  formatProbability,
  getActualProbability,
  getOptimisticProbability,
  getOutDegreeSummary,
} from "../tlc/summary";
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
import type { TlcArguments } from "./tlc-arguments";

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

export interface TlcPrinter extends MessagePrinter {
  isDiffTrace: boolean;
}

const BEHAVIOR = {
  code: MESSAGE_CODE.behaviorUpToThisPoint,
  text: "The behavior up to this point is:",
};

const printTrace = (
  printer: TlcPrinter,
  trace: TraceStep[],
  heading: { code: number; text: string } = BEHAVIOR,
  isRebuiltAfterHeading = false,
  isLastDiffed = heading !== BEHAVIOR,
) => {
  if (trace.length > 0) printer.print(heading.code, MESSAGE_LEVEL.error, heading.text);
  try {
    trace.forEach((step, index) => {
      if (index > 0 || isRebuiltAfterHeading) printTraceOutput(printer, step.output);
      const isDiffed =
        printer.isDiffTrace && index > 0 && (isLastDiffed || index < trace.length - 1);
      printer.print(
        MESSAGE_CODE.statePrint2,
        MESSAGE_LEVEL.state,
        `${index + 1}: <${step.label ?? step.action ?? "Initial predicate"}>\n${formatState(step.state, isDiffed ? trace[index - 1].state : undefined)}`,
      );
    });
  } catch (error) {
    if (!(error instanceof TlaAliasFormatError)) throw error;
    printer.print(MESSAGE_CODE.general, MESSAGE_LEVEL.error, error.message);
  }
};

const COUNTER_EXAMPLE = {
  code: MESSAGE_CODE.counterExample,
  text: "The following behavior constitutes a counter-example:\n",
};

const getTemporalHeadline = (names: string[], version: TlcVersion) =>
  version === "1.7.4" || names.length === 0
    ? "Temporal properties were violated.\n"
    : names.length === 1
      ? `Temporal property ${names[0]} was violated.\n`
      : `Temporal properties ${names.slice(0, -1).join(", ")}${names.length > 2 ? "," : ""} and ${names[names.length - 1]} were violated.\n`;

const formatFingerprintTrace = (sources: Expression[]) =>
  sources
    .filter((source, index) => source !== sources[index - 1])
    .map((source, index) => `${index}) ${describeRange(source)}\n`)
    .toReversed()
    .join("");

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

export interface Timing {
  startTime: number;
  isParsed: boolean;
  livenessStartTime: number | undefined;
}

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

export const getClassPath = (directory: string, module: string) =>
  join(directory, `${module}.class`);

export const printCheckProgress = (
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
      if (progress.isComplete) printProgress(printer, progress.statistics);
      const branches = progress.branches > 1 ? `${progress.branches} branches of ` : "";
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
        `Warning: the search ordered the string ${JSON.stringify(progress.string)} against another string it created, so tla-ts checks the model again with one worker. Workers don't agree on the order of strings the search creates.\n`,
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

const printPostcondition = (printer: MessagePrinter, postcondition: Postcondition | undefined) => {
  if (!postcondition) return;
  if (postcondition.counts) console.log(postcondition.counts);
  printer.print(
    postcondition.code,
    MESSAGE_LEVEL.error,
    formatInnerMessage(postcondition.code, postcondition.message, printer.isTool),
  );
};

const printViolation = (status: CheckStatus, violation: Violation, printer: TlcPrinter) => {
  const print = printer.print;
  const name = violation.name;
  const loopStart = violation.loopStart;
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
  const isProperty = status === "property-violation";
  const isLasso = loopStart !== undefined && !isProperty;
  const isCounterExample = isProperty || isLasso;
  const isRebuiltFirst = isCounterExample && printer.version !== "1.7.4";
  if (isRebuiltFirst) printTraceOutput(printer, violation.trace[0]?.output);
  if (violation.counts) console.log(violation.counts);
  if (headline) {
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
  if (violation.warning && printer.version !== "1.7.4")
    print(violation.warning.code, MESSAGE_LEVEL.warning, violation.warning.text);
  const postcondition =
    violation.unwitnessed ??
    (status === "postcondition-violation" ? undefined : violation.postcondition);
  printTraceOutput(printer, violation.postconditionOutput);
  printPostcondition(printer, postcondition);
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

export const printDepthFirst = (printer: TlcPrinter, output: DepthFirstOutput) => {
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

export const printResult = (result: CheckResult, printer: TlcPrinter, timing: Timing) => {
  const print = printer.print;
  if (result.failure) {
    const failure = result.failure;
    const message = printer.isTool ? failure.toolMessage : failure.message;
    const printCallStack = () => {
      const fingerprint = failure.fingerprint;
      if (fingerprint) {
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
    printPostcondition(printer, failure.postcondition);
    if (!failure.isCallStackFirst) printCallStack();
  } else if (result.violation) {
    if (!printViolation(result.status, result.violation, printer)) return;
    const additionalViolation = result.additionalViolation;
    if (additionalViolation) printViolation("property-violation", additionalViolation, printer);
    if (result.liveCallStack) printNestedExpressions(printer, result.liveCallStack);
  } else if (result.status === "success") {
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

export const printWelcome = (printer: MessagePrinter) =>
  printer.print(MESSAGE_CODE.version, MESSAGE_LEVEL.none, `TLC2 Version ${version} (rev: tla-ts)`);

export const printCommandLineError = (isTool: boolean, version: TlcVersion, message: string) => {
  const printer = createMessagePrinter(isTool, true, version);
  printWelcome(printer);
  printer.print(
    MESSAGE_CODE.commandLineError,
    MESSAGE_LEVEL.error,
    `${message}\nUsage: java tlc2.TLC [-help] [-option] inputfile`,
  );
  return 1;
};

// Deviation from TLC: tla-ts keeps its fingerprints and its queue of states in memory.
export const printStartupBanner = (printer: MessagePrinter, args: TlcArguments) => {
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

export const printSimulation = (printer: TlcPrinter, output: SimulationOutput) => {
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
