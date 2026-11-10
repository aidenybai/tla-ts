import type { Expression } from "./ast";
import { parseConfig, type ModelConfig } from "./config";
import { createEnvironment } from "./environment";
import {
  createStackOverflowError,
  getErrorExitCode,
  isStackOverflow,
  TlaConfigError,
  TlaEvaluationError,
  TlaIllegalStateError,
  TlaIncompleteSuccessorError,
  TlaModuleError,
  TlaStackOverflowError,
  UNEXPECTED_EVAL_EXCEPTION,
  UNEXPECTED_EXCEPTION,
} from "./errors";
import {
  createTracingEnvironment,
  evaluate,
  formatRange,
  getDefinition,
  isImpure,
  type CallStack,
  type Environment,
  type FingerprintFailure,
} from "./evaluate";
import { EXIT_STATUS, getExitCode, setExitCode, withLivenessExitCode } from "./exit-codes";
import type { JavaOverride } from "./java-overrides";
import {
  createLivenessChecker,
  type Lasso,
  type LivenessChecker,
  type LiveSuccessor,
} from "./liveness-checker";
import {
  createIdentifier,
  createSearch,
  findAssumptionViolation,
  getConfigDefinition,
  getContext,
  reportInitialStatesProgress,
  reportStartup,
  withNextStateExitCode,
} from "./search";
import {
  getActionLabel,
  getActionSignature,
  getInitActions,
  getNextActions,
  getSpecificationValue,
  toActionValue,
  type SpecAction,
} from "./spec-description";
import {
  createStateWriter,
  type GraphState,
  type StateDump,
  type StateWriter,
} from "./state-graph";
import {
  forEachInitialState,
  forEachSuccessor,
  getInitialStates,
  getSuccessors,
  type Successor,
} from "./successors";
import {
  formatNestedMessage,
  getCodedMessage,
  getFailureMessage,
  getWrappedException,
  isEvalException,
  isHeadedError,
  MESSAGE_CODE,
  withUnexpectedException,
  type FailureMessage,
} from "./tlc/messages";
import { createHashIndex } from "./hash-index";
import { createStateStore } from "./state-store";
import { getStoredTlcFingerprints } from "./tlc/fingerprint";
import { createTlcOrder } from "./tlc/order";
import { replayInitialStates, replaySuccessors } from "./tlc/replay";
import { getFingerprintDistance, OUT_DEGREE_BUCKETS } from "./tlc/summary";
import { createActionRecord, createCounterExample } from "./tlc/tlcext-operators";
import type { TlcVersion } from "./tlc/version";
import {
  combineHash,
  createModelValue,
  formatState,
  getFingerprintError,
  getHeldValues,
  getValueHash,
  isFunctionValue,
  isSameValue,
  markFingerprinted,
  setStringOrder,
  setValueVersion,
  toFiniteFunction,
  type Value,
} from "./values";

export interface CheckOptions {
  source: string;
  config: string | ModelConfig;
  loadModule?: (name: string) => string | undefined;
  loadClass?: (name: string) => Uint8Array | undefined;
  onPrint?: (text: string) => void;
  onPause?: () => void;
  readFile?: (path: string) => string | undefined;
  writeFile?: (path: string, content: string) => void;
  seed?: bigint;
  workers?: number;
  // TLC's -lncheck: "final" checks liveness only on the complete state graph.
  livenessCheck?: "default" | "final";
  // TLC's -dump: writes the reachable states, or with `dot` the state graph, through writeFile.
  dump?: StateDump;
  // TLC's -tool, which changes the messages of TLC's errors.
  isTool?: boolean;
  // TLC's -continue: the search reports each violated invariant and action property through
  // onProgress and goes on.
  isContinued?: boolean;
  // Whether TLC records a binary trace for its trace exploration spec, for which it loads Integers.
  isTraceRecorded?: boolean;
  // Whether the caller printed SANY's report, its warnings included, before the check.
  isSanyReported?: boolean;
  // False for TLC's -nowarning, which changes how TLC computes the successors of some actions.
  isWarningEnabled?: boolean;
  // The TLC whose output tla-ts reproduces, which changes how TLC labels an action.
  version?: TlcVersion;
  // Reports the points of the search at which TLC prints a message.
  onProgress?: (progress: CheckProgress) => void;
}

export interface InitialStatesProgress {
  kind: "initial-states-progress";
  count: number;
}

// A check that TLC's DoInitFunctor reports as violated before it stops its replay of the initial
// states.
export interface InitialStateViolation {
  kind: "initial-state-violation";
  status: "invariant-violation" | "liveness-violation";
  name: string;
  state: Record<string, Value>;
}

// A line the spec prints, or what TLC reports as it replays the initial states.
export type OutputLine = string | InitialStatesProgress | InitialStateViolation;

// The points of the search at which TLC prints a message.
export type CheckProgress =
  | { kind: "parsed" }
  | { kind: "constant-level-invariant"; name: string }
  | { kind: "state-level-property"; name: string }
  | { kind: "liveness-initializing"; isSymmetric: boolean; isConstrained: boolean }
  | { kind: "liveness-prepared"; branches: number }
  | { kind: "initial-states-started" }
  | InitialStatesProgress
  | { kind: "initial-states-computed"; initialStates: InitialStates }
  | { kind: "progress"; statistics: SearchStatistics }
  | {
      kind: "liveness-started";
      branches: number;
      // Whether TLC checks the complete state graph, and how many states of it each branch has.
      isComplete: boolean;
      states: number;
      statistics: SearchStatistics;
    }
  | { kind: "liveness-finished" }
  | { kind: "sequential-fallback"; string: string }
  // A warning TLC prints as it evaluates the spec, with its message code.
  | { kind: "warning"; code: number; text: string }
  // A violation that the search goes on past with -continue.
  | { kind: "violation"; status: CheckStatus; violation: Violation }
  // A method of the class named after a module, which TLC reports as it loads the class.
  | ({ kind: "java-override" } & JavaOverride);

export interface SearchStatistics extends Pick<
  CheckResult,
  "generatedStates" | "distinctStates" | "queuedStates" | "depth"
> {}

export type CheckStatus =
  | "success"
  | "assumption-violation"
  | "invariant-violation"
  | "property-violation"
  | "liveness-violation"
  | "postcondition-violation"
  | "deadlock"
  | "error";

export interface TraceStep {
  action: string | undefined;
  // TLC's name, parameters and location for the action that took this step.
  label: string | undefined;
  state: Record<string, Value>;
  // What the spec prints, before TLC prints this step, as TLC evaluates it again to rebuild the
  // trace. The first step has what TLC prints before the trace.
  output?: OutputLine[];
}

export interface Violation {
  name: string;
  // Every temporal property that a liveness counterexample violates, in the configuration's order.
  properties?: string[];
  trace: TraceStep[];
  // What the spec prints after TLC prints the states of the trace, as TLC finds the step back into
  // the cycle of a lasso or rebuilds the trace once more.
  traceOutput?: OutputLine[];
  loopStart: number | undefined;
  loopLabel?: string;
  message?: string;
  counts?: string;
  unwitnessed?: Postcondition;
  // A POSTCONDITION that is false or fails after the counterexample, which TLC checks as it
  // prints one.
  postcondition?: Postcondition;
  // What TLC warns about after a counterexample, with its code.
  warning?: { code: number; text: string };
}

export interface Postcondition {
  name: string;
  // TLC's message code.
  code: number;
  message: string;
  counts?: string;
}

// An evaluation that failed during the search, with the behavior up to the state TLC was working on.
export interface EvaluationFailure {
  // TLC's code for the message, and its text with and without -tool.
  code: number;
  message: string;
  toolMessage: string;
  trace: TraceStep[];
  traceOutput?: OutputLine[];
  initialState: Record<string, Value> | undefined;
  exitCode: number;
  // The expressions TLC was evaluating when the failure occurred, outermost first, when TLC finds
  // them by replaying the failure.
  callStack: Expression[] | undefined;
  // Whether TLC prints the call stack before the error, as it does for a failed liveness check.
  isCallStackFirst?: boolean;
  // The FingerprintException the replay raises, which TLC reports in place of the call stack.
  fingerprint?: FingerprintFailure;
  // How TLC reports failing again as it prints the trace, since it can't fingerprint the state the
  // failure occurred in.
  traceFailure?: FailureMessage;
  // A POSTCONDITION that is false or fails after the trace, which TLC checks as it prints one.
  postcondition?: Postcondition;
  // Whether TLC stops before it prints the statistics, as it does for an illegal initial state.
  isWithoutStatistics?: boolean;
}

// Where TLC's replay of a failure fails.
interface ReplayFailure {
  callStack: Expression[];
  fingerprint: FingerprintFailure | undefined;
}

export interface InitialStates {
  generated: number;
  distinct: number;
}

export interface CheckResult {
  status: CheckStatus;
  violation: Violation | undefined;
  failure: EvaluationFailure | undefined;
  generatedStates: number;
  distinctStates: number;
  queuedStates: number;
  depth: number;
  // How many initial states TLC generated and how many of them were distinct, once it computed
  // them all without a violation or an error.
  initialStates: InitialStates | undefined;
  // How many states that TLC counts as expanded found each number of new states, when TLC prints
  // the outdegree of the state graph.
  outDegrees: number[] | undefined;
  // The smallest distance between the fingerprints of two distinct states, when TLC estimates a
  // collision from the actual fingerprints.
  fingerprintDistance: bigint | undefined;
  // A temporal property TLC finds violated as it adds a deadlocked state to the behavior graph,
  // which it reports after the deadlock.
  additionalViolation?: Violation;
  // Where TLC's worker fails to add the state to the behavior graph after it reports a violation.
  liveCallStack?: Expression[];
  // How many states that TLC counts as expanded found each number of new states, when its workers
  // stop on a violation without an error code, which TLC 1.7.4 reports as a successful search.
  violationOutDegrees?: number[];
}

interface Behavior {
  trace: TraceStep[];
  traceOutput?: OutputLine[];
}

interface TraceOptions {
  loopStart?: number;
  known?: number;
}

interface FailureOptions {
  initialState?: Value[];
  isInitial?: boolean;
  outDegrees?: number[];
  callStack?: Expression[];
  fingerprint?: FingerprintFailure;
  isNextState?: boolean;
  isCallStackFirst?: boolean;
  traceFailure?: FailureMessage;
  // Whether the call stack is of adding the state to the behavior graph, which TLC prints instead
  // of replaying the error.
  isLiveCallStack?: boolean;
}

// TLC prints what the spec prints as it replays a failure after the trace.
const appendTraceOutput = <Traced extends Behavior>(behavior: Traced, lines: OutputLine[]) => ({
  ...behavior,
  traceOutput: [...(behavior.traceOutput ?? []), ...lines],
});

const INITIAL_RECOVERY_FAILURE = "Failed to recover the initial state from its fingerprint.";
const NEXT_RECOVERY_FAILURE = "Failed to recover the next state from its fingerprint.";

const toAliasRecord = (value: Value, fieldOrder: string[]) => {
  if (!isFunctionValue(value)) return undefined;
  const record = toFiniteFunction(value);
  if (!record.domain.every((key) => typeof key === "string")) return undefined;
  const entries = record.domain.map((key, index): [string, Value] => [
    String(key),
    record.range[index],
  ]);
  return Object.fromEntries(
    entries.sort((left, right) => fieldOrder.indexOf(left[0]) - fieldOrder.indexOf(right[0])),
  );
};

// Stops a replay where TLC stops it without a failure, as at a violated invariant.
const STOP_REPLAY = new Error("The replay stopped");

// The codes of the errors in the configuration and the spec that TLC's EC.ExitStatus maps to a
// configuration error.
const CONFIG_ERROR_CODES = new Set([
  ...Array.from({ length: 24 }, (_, index) => 2222 + index),
  2272,
  2273,
  2274,
  2280,
  2281,
]);

// When TLC's replay of the initial states doesn't fail again, it exits with the code of the
// TLCRuntimeException it reported.
const getInitialExitCode = (error: TlaEvaluationError) => {
  const coded = getCodedMessage(error.message);
  return coded && !coded.isEvalException && CONFIG_ERROR_CODES.has(coded.code)
    ? EXIT_STATUS.configParseError
    : getErrorExitCode(error);
};

// When TLC's replay of an error fails again, an EvalException from a standard module's Java code
// decides the exit status, and any other failure exits as a nested expression failure. An error
// that heads or wraps another exits as the other.
const getReplayExitCode = (error: TlaEvaluationError): number => {
  const inner = error.cause;
  if (inner instanceof TlaEvaluationError) return getReplayExitCode(inner);
  return error instanceof TlaModuleError ? error.exitCode : EXIT_STATUS.specEvaluationFailure;
};

// TLC finishes the -dump file whether or not the search finds a violation.
export const checkSequentially = (options: CheckOptions): CheckResult => {
  const stateWriter =
    options.dump && createStateWriter(options.dump, options.writeFile, options.version);
  try {
    return searchStates(options, stateWriter);
  } catch (error) {
    throw isStackOverflow(error) ? createStackOverflowError() : error;
  } finally {
    stateWriter?.close();
  }
};

// TLC checks liveness on the graph so far 3 seconds into the search and then every minute, once
// the graph has grown by a tenth and liveness checking has taken at most a fifth of the time.
const PERIODIC_START = 3000;
const PROGRESS_INTERVAL = 60_000;
const LIVENESS_GROWTH = 0.1;
const LIVENESS_RATIO = 0.2;

const searchStates = (options: CheckOptions, stateWriter: StateWriter | undefined): CheckResult => {
  const config =
    typeof options.config === "string"
      ? parseConfig(options.config, options.version)
      : options.config;
  const onPrint = options.onPrint ?? console.log;
  // TLC prints again while it rebuilds a trace, between the states it prints, so rebuilding a trace
  // keeps what it prints for the trace.
  const capturedOutput = { lines: undefined as OutputLine[] | undefined };
  const print = (text: string) => {
    if (capturedOutput.lines) capturedOutput.lines.push(text);
    else onPrint(text);
  };
  const captureOutput = <Result>(rebuild: () => Result) => {
    const outer = capturedOutput.lines;
    const lines: OutputLine[] = [];
    capturedOutput.lines = lines;
    try {
      return { result: rebuild(), lines };
    } finally {
      capturedOutput.lines = outer;
    }
  };
  const order = createTlcOrder(options.source, options.loadModule);
  setStringOrder(order.getStringOrder(config));
  setValueVersion(options.version);
  const specification = createEnvironment(config, {
    source: options.source,
    loadModule: options.loadModule,
    order,
    loadClass: options.loadClass,
    print,
    files: { readFile: options.readFile, writeFile: options.writeFile },
    seed: options.seed,
    isTool: options.isTool,
    isTraceRecorded: options.isTraceRecorded,
    isSanyReported: options.isSanyReported,
    isWarningEnabled: options.isWarningEnabled,
    version: options.version,
  });
  reportStartup(specification, config, options.onProgress);
  const environment = specification.environment;
  const runtime = environment.runtime;
  const is174 = runtime.version === "1.7.4";
  runtime.pause = options.onPause ?? (() => {});
  runtime.getSpecification = () =>
    getSpecificationValue(
      config,
      environment,
      specification.variableLocations,
      specification.instanceActions,
    );
  const statistics = { depth: 0, initialStates: undefined as InitialStates | undefined };
  const createResult = (
    status: CheckStatus,
    violation?: Omit<Violation, "loopStart"> & { loopStart?: number },
    failure?: EvaluationFailure,
  ): CheckResult => ({
    status,
    violation: violation && { ...violation, loopStart: violation.loopStart },
    failure,
    generatedStates: runtime.generatedStates,
    distinctStates: runtime.distinctStates,
    queuedStates: runtime.queueSize,
    depth: runtime.generatedStates === 0 ? 0 : Math.max(statistics.depth, 1),
    initialStates: statistics.initialStates,
    outDegrees: undefined,
    fingerprintDistance: undefined,
  });
  const outDegrees = Array.from({ length: OUT_DEGREE_BUCKETS }, () => 0);
  const expansion = { newStates: 0 };
  const getOutDegreeBucket = () => Math.min(expansion.newStates, OUT_DEGREE_BUCKETS - 1);
  // TLC counts the state it was expanding when an evaluation failed, except TLC 1.7.4, whose
  // worker stops before it counts the state.
  const getPartialOutDegrees = () =>
    outDegrees.map((count, degree) => (degree === getOutDegreeBucket() ? count + 1 : count));
  const getFailureOutDegrees = () => (is174 ? [...outDegrees] : getPartialOutDegrees());
  // TLC 1.7.4 doesn't name the properties a counterexample violates, so it evaluates none of them.
  const getViolatedProperties = (checker: LivenessChecker, path: Value[][], cycleStart: number) =>
    is174 ? [] : checker.getViolatedProperties(path, cycleStart);
  // A violation in a successor ends the expansion of a state before TLC counts it.
  const withOutDegrees = (result: CheckResult, degrees = [...outDegrees]): CheckResult => ({
    ...result,
    violationOutDegrees: degrees,
  });
  const createSuccess = (): CheckResult => ({
    ...createResult("success"),
    outDegrees: [...outDegrees],
    fingerprintDistance: getFingerprintDistance(
      runtime.distinctStates,
      runtime.generatedStates,
      () =>
        search
          ? search.getStoredFingerprints(store.getCount(), store.getState, (order) =>
              getStoredTlcFingerprints(store.getFingerprintCells(), order),
            )
          : BigInt64Array.from({ length: store.getCount() }, (_, index) =>
              runtime.getFingerprint(store.getState(index)),
            ),
    ),
  });

  const search = createSearch(
    config,
    environment,
    () => order.getDeclarationOrder("variable"),
    options.onProgress,
  );
  const findViolatedAssumption = () =>
    findAssumptionViolation(specification.assumptions, environment);
  if (!search) {
    runtime.isStarted = true;
    const assumptionViolation = findViolatedAssumption();
    if (assumptionViolation) return createResult("assumption-violation", assumptionViolation);
    // TLC computes the initial states of a spec without variables, of which there are none.
    statistics.initialStates = { generated: 0, distinct: 0 };
    options.onProgress?.({ kind: "initial-states-started" });
    options.onProgress?.({
      kind: "initial-states-computed",
      initialStates: statistics.initialStates,
    });
    return createSuccess();
  }
  const hasPostconditions = config.postconditions.length > 0 || config.possible.length > 0;
  // The state of each step of a trace without the alias, and the action TLC finds for the step,
  // which CounterExample records.
  const traceSteps = new WeakMap<
    TraceStep,
    { state: Record<string, Value>; action: SpecAction | undefined }
  >();
  const getStepState = (step: TraceStep) => traceSteps.get(step)?.state ?? step.state;
  const getStepAction = (step: TraceStep) => {
    const action = traceSteps.get(step)?.action;
    return action ? toActionValue(action) : createActionRecord(step.action);
  };
  // Worker#printTrace checks the postconditions on the CounterExample of each trace it prints, so
  // what they print follows the trace.
  const checkTracePostconditions = (
    trace: TraceStep[],
    loop: { start: number; action: Value } | undefined,
  ) => {
    if (hasPostconditions) {
      runtime.counterExample = createCounterExample(
        trace.map(getStepState),
        trace.slice(1).map(getStepAction),
        loop,
      );
    }
    const unwitnessed = search.findUnwitnessedPossible();
    const checked = unwitnessed
      ? { result: undefined, lines: [] }
      : captureOutput(() => search.findPostconditionViolation(true));
    return { unwitnessed, postcondition: checked.result, lines: checked.lines };
  };
  const reportViolation = (
    status: CheckStatus,
    violation: Omit<Violation, "loopStart"> & { loopStart?: number },
    getLoopAction?: () => Value,
  ) => {
    const start = violation.loopStart;
    const checked = checkTracePostconditions(
      violation.trace,
      start === undefined || !getLoopAction ? undefined : { start, action: getLoopAction() },
    );
    const traceOutput = [...(violation.traceOutput ?? []), ...checked.lines];
    return createResult(status, {
      ...violation,
      ...(traceOutput.length > 0 && { traceOutput }),
      ...(checked.unwitnessed && { unwitnessed: checked.unwitnessed }),
      ...(checked.postcondition && { postcondition: checked.postcondition }),
    });
  };
  // With -continue, TLC prints the trace of a violation without checking the postconditions.
  const reportContinuedViolation = (status: CheckStatus, violation: Omit<Violation, "loopStart">) =>
    options.onProgress?.({
      kind: "violation",
      status,
      violation: { ...violation, loopStart: undefined },
    });
  const spec = search.spec;
  const getFingerprintState = search.getFingerprintState;
  const specNextActions = { value: undefined as SpecAction[] | undefined };
  const getSpecNextActions = () =>
    (specNextActions.value ??= getNextActions(config, environment, specification.instanceActions));
  const getReplayFailure = (replay: (tracing: Environment) => void): ReplayFailure | undefined => {
    const tracing = createTracingEnvironment(environment);
    const callStack = tracing.callStack;
    try {
      replay(tracing);
      return undefined;
    } catch (error) {
      // A replay that overflows the stack again has an empty call stack.
      if (isStackOverflow(error)) return { callStack: [], fingerprint: undefined };
      if (!(error instanceof TlaEvaluationError) || !callStack) return undefined;
      return { callStack: callStack.expressions, fingerprint: callStack.fingerprint };
    }
  };
  // The sources of the values a fingerprint fails inside, outermost first: each value fails as it
  // fingerprints a value it holds.
  const findFailedSources = (value: Value, sources: CallStack["sources"]): Expression[] => {
    if (typeof value !== "object") return [];
    const source = sources.get(value);
    const failed = getHeldValues(value).find((held) => getFingerprintError(held) !== undefined);
    return [
      ...(source ? [source] : []),
      ...(failed === undefined ? [] : findFailedSources(failed, sources)),
    ];
  };
  // TLC's replay fingerprints the states it finds, and a value the replay built raises a
  // FingerprintException when it fails to.
  const fingerprintReplayed = (state: Value[], callStack: CallStack | undefined) => {
    for (const value of getFingerprintState(state)) {
      const error = getFingerprintError(value);
      if (!error) continue;
      const sources = callStack ? findFailedSources(value, callStack.sources) : [];
      // TLC fingerprints a state outside any evaluation, so its call stack is empty.
      if (callStack && sources.length > 0) {
        callStack.expressions.length = 0;
        callStack.isFrozen = true;
        callStack.fingerprint = { sources, reason: error.message };
      }
      throw error;
    }
    state.forEach(markFingerprinted);
  };
  // The replay adds the states it hasn't seen to TLC's set of states, which already holds the state
  // that failed after TLC added it.
  const createReplayedStates = () => {
    const replayed = unstoredState.fingerprint ? [unstoredState.fingerprint] : [];
    return (state: Value[], callStack: CallStack | undefined) => {
      fingerprintReplayed(state, callStack);
      const fingerprintState = getFingerprintState(state);
      const isSeen =
        findStateIndex(getStateHash(fingerprintState), fingerprintState) !== -1 ||
        replayed.some((seen) => isSameState(seen, fingerprintState));
      if (isSeen) return false;
      replayed.push(fingerprintState);
      runtime.distinctStates++;
      return true;
    };
  };
  // TLC's DoInitFunctor reports its progress again as it replays the initial states, and adds each
  // one it hasn't seen to the behavior graph. After a FingerprintException, it only counts the
  // states left, then throws the exception.
  const replayInit = () => {
    const replayed = { count: 0 };
    const deferred: TlaEvaluationError[] = [];
    const addReplayed = createReplayedStates();
    return getReplayFailure((tracing) => {
      replayInitialStates(
        getInitActions(config, environment, specification.instanceActions),
        tracing,
        (state) => {
          reportInitialStatesProgress(replayed.count, (progress) =>
            capturedOutput.lines?.push(progress),
          );
          replayed.count++;
          runtime.generatedStates = replayed.count;
          if (deferred.length > 0) return;
          try {
            const addFingerprint = () => {
              if (!addReplayed(state, tracing.callStack)) return;
              runtime.queueSize++;
              liveness?.addInitialState(store.getCount(), state, tracing);
            };
            const violation = search.checkReplayedInitialState(state, tracing, addFingerprint);
            if (violation) {
              const traced = toTrace([{ action: undefined, state }], []).trace[0].state;
              capturedOutput.lines?.push({
                kind: "initial-state-violation",
                ...violation,
                state: traced,
              });
              throw STOP_REPLAY;
            }
          } catch (error) {
            if (!(error instanceof TlaEvaluationError) || !tracing.callStack?.fingerprint) {
              throw error;
            }
            deferred.push(error);
          }
        },
      );
      if (deferred.length > 0) throw deferred[0];
    });
  };
  // TLC replays the expansion of a state with ModelChecker.doNext, which writes each successor in
  // the model to the -dump state graph again.
  const replayNext = (index: number) =>
    getReplayFailure((tracing) => {
      const state = getStoredState(index);
      const source = stateWriter && getGraphState(state, store.getDepth(index));
      const addReplayed = createReplayedStates();
      replaySuccessors(getSpecNextActions(), state, tracing, (next, action) => {
        const addFingerprint = () => {
          const isUnseen = addReplayed(next, tracing.callStack);
          if (source) {
            stateWriter?.writeSuccessor(
              source,
              getGraphState(next, store.getDepth(index) + 1),
              !isUnseen,
              isNamingEdges
                ? { name: action.name, signature: getActionSignature(action) }
                : undefined,
            );
          }
          return isUnseen;
        };
        if (!search.checkReplayedSuccessor(state, next, tracing, addFingerprint)) {
          throw STOP_REPLAY;
        }
      });
    });
  const isReducing = config.view !== undefined || config.symmetry !== undefined;
  const tlcFingerprints: number[] = [];
  // TLC warns about the liveness checker before it builds it.
  if (search.properties.liveness.length > 0) {
    options.onProgress?.({
      kind: "liveness-initializing",
      isSymmetric: search.isSymmetric,
      isConstrained: search.isConstrained,
    });
  }
  const liveness = withLivenessExitCode(() =>
    withUnexpectedException(() =>
      createLivenessChecker(search.properties.liveness, spec.temporals, environment, {
        getFingerprint: ({ index, state }) =>
          (tlcFingerprints[index] ??= Number(BigInt.asIntN(32, runtime.getFingerprint(state)))),
        getSuccessors: (source, state) => {
          const successors: LiveSuccessor[] = [];
          if (spec.next === undefined) return successors;
          // The constraints read the level of the state whose successors they check, as when TLC
          // explored it.
          const livenessSource = current.livenessSource;
          current.livenessSource = source;
          try {
            forEachSuccessor(
              spec.next,
              state,
              environment,
              (successor) => {
                canonicalizeState(successor.state);
                const isInModel =
                  search.satisfiesConstraints(successor.state, state) &&
                  search.satisfiesActionConstraints(state, successor.state);
                if (!isInModel) return false;
                const fingerprintState = getFingerprintState(successor.state);
                const index = findStateIndex(getStateHash(fingerprintState), fingerprintState);
                successors.push({ index, state: successor.state });
                return false;
              },
              spec.scope,
            );
          } finally {
            current.livenessSource = livenessSource;
          }
          return successors;
        },
      }),
    ),
  );
  // TLC 1.7.4 creates its model checker, which TLCGet reads, once it has built the liveness checker.
  runtime.isStarted = true;
  const isCanonicalizedFirst = search.isSymmetric || liveness !== undefined;

  const store = createStateStore(search.isSymmetric);
  const seenStates = createHashIndex();
  const canonicalizeState = store.canonicalizeState;

  const toRecord = (state: Value[]): Record<string, Value> =>
    Object.fromEntries(
      search.getTlcOrder().map((index) => [environment.variables[index], state[index]]),
    );
  const getAliasState = (
    alias: string,
    steps: Successor[],
    position: number,
    loopStart: number | undefined,
  ) => {
    // TLC evaluates TLCGet("level") and Trace in an alias at the state's position in the trace. The
    // search reads them again once the alias is evaluated, as it goes on with -continue.
    const searchLevel = runtime.getLevel;
    const searchBehavior = runtime.getBehavior;
    runtime.getLevel = () => position + 1;
    runtime.getBehavior = () => steps.slice(0, position + 1).map((step) => step.state);
    try {
      return evaluateAlias(
        alias,
        steps[position].state,
        (steps[position + 1] ?? steps[loopStart ?? position]).state,
      );
    } finally {
      runtime.getLevel = searchLevel;
      runtime.getBehavior = searchBehavior;
    }
  };
  const evaluateAlias = (alias: string, state: Value[], next: Value[] | undefined) => {
    try {
      const body = getConfigDefinition("alias", alias, environment).body;
      const value = evaluate(createIdentifier(alias), getContext(environment, state, next));
      const fieldOrder = body.kind === "Record" ? body.fields.map((field) => field.name) : [];
      return toAliasRecord(value, fieldOrder) ?? toRecord(state);
    } catch (error) {
      if (!(error instanceof TlaConfigError || error instanceof TlaEvaluationError)) throw error;
      return {
        ...toRecord(state),
        _ALIASEvalError: formatNestedMessage(error.message, options.isTool ?? false),
      };
    }
  };
  // TLC finds the action of a step as the first action that takes it, evaluated as when the search
  // expanded the previous state, by the values of a successor it holds and otherwise by fingerprint.
  const findStepAction = (index: number, previous: Value[], state: Value[], isHeld: boolean) => {
    const actions = getSpecNextActions();
    const expanding = { ...current };
    Object.assign(current, {
      index,
      state: getStoredIndex(previous) === index ? previous : undefined,
      isExpanding: true,
      candidate: undefined,
    });
    const getKey = isHeld ? (values: Value[]) => values : getFingerprintState;
    const key = getKey(state);
    try {
      return actions.find((item) =>
        getSuccessors(item.expression, previous, environment, item.scope).some((successor) =>
          isSameState(getKey(successor.state), key),
        ),
      );
    } finally {
      Object.assign(current, expanding);
    }
  };
  // Before TLC prints a trace, it rebuilds from the initial predicate the states it does not keep,
  // all but the last `known` ones. As it prints each later step, it finds the action that takes
  // the step. Then it rebuilds the trace once more, unless the trace is a liveness counterexample
  // or TLC is 1.7.4.
  const toTrace = (
    steps: Successor[],
    path: number[],
    traceOptions: TraceOptions = {},
  ): Behavior => {
    const alias = config.alias;
    const known = traceOptions.known ?? 1;
    // Rebuilding the trace from the initial predicate can reset what TLCSet stored.
    const initialOutput = steps.length > 1 ? captureOutput(getSpecInitialStates).lines : [];
    // TLC finds the action that takes each step before it evaluates the alias.
    const stepActions = steps.map((step, position) =>
      position === 0 || step.action === "Stuttering"
        ? { result: undefined, lines: [] }
        : captureOutput(() =>
            findStepAction(
              path[position - 1],
              steps[position - 1].state,
              step.state,
              known === 2 && position === steps.length - 1,
            ),
          ),
    );
    const outputs = stepActions.map((step) => step.lines);
    const loopStart = traceOptions.loopStart;
    // 1.7.4's LiveWorker#printTrace rebuilds a lasso up to the start of its cycle at once, and then
    // each state of the cycle as it prints it.
    const rebuilt = is174 && loopStart !== undefined ? loopStart + 1 : steps.length - known;
    const prefixOutput = rebuilt > 0 ? [initialOutput, ...outputs.slice(1, rebuilt)].flat() : [];
    return {
      trace: steps.map((step, position) => {
        const action = stepActions[position].result;
        const traceStep: TraceStep = {
          action: step.action,
          label: action && getActionLabel(action, options.version),
          state:
            alias === undefined
              ? toRecord(step.state)
              : getAliasState(alias, steps, position, loopStart),
          output: position === 0 ? prefixOutput : position < rebuilt ? [] : outputs[position],
        };
        if (alias !== undefined || action) {
          traceSteps.set(traceStep, { state: toRecord(step.state), action });
        }
        return traceStep;
      }),
      traceOutput: known > 0 && !is174 ? [initialOutput, ...outputs].flat() : [],
    };
  };
  const getSpecInitialStates = () =>
    spec.init === undefined ? [] : getInitialStates(spec.init, environment, spec.scope);
  // TLC's Tool#getState rebuilds a successor action by action, up to the first action that
  // generates it. A trace keeps what the spec prints as TLC rebuilds it, so finding its states
  // prints nothing.
  const findTraceSuccessor = (state: Value[], isMatch: (successor: Successor) => boolean) =>
    captureOutput(() => {
      for (const action of getSpecNextActions()) {
        const successor = getSuccessors(action.expression, state, environment, action.scope).find(
          isMatch,
        );
        if (successor) return { ...successor, action: successor.action ?? action.name };
      }
      return undefined;
    }).result;
  const hasFingerprint = (state: Value[], index: number) =>
    store.isSameFingerprint(index, getFingerprintState(state));
  const findSuccessorWithFingerprint = (state: Value[], index: number) =>
    findTraceSuccessor(state, (successor) => hasFingerprint(successor.state, index));
  const getPathStates = (path: number[], nextFailure: string) => {
    const initial = captureOutput(() =>
      isReducing || isImpure(environment)
        ? getSpecInitialStates().find((state) => hasFingerprint(state, path[0]))
        : getStoredState(path[0]),
    ).result;
    if (!initial) throw new TlaEvaluationError(INITIAL_RECOVERY_FAILURE);
    const steps: Successor[] = [{ state: initial, action: undefined }];
    for (let position = 1; position < path.length; position++) {
      const previous = steps[position - 1].state;
      if (path[position - 1] === path[position]) {
        steps.push({ state: previous, action: "Stuttering" });
        continue;
      }
      const successor = findSuccessorWithFingerprint(previous, path[position]);
      if (!successor) throw new TlaEvaluationError(nextFailure);
      steps.push(successor);
    }
    return steps;
  };
  const getTrace = (index: number, lastSuccessor?: Successor) => {
    const path: number[] = [];
    for (let position = index; position !== -1; position = store.getParent(position)) {
      path.unshift(position);
    }
    const steps =
      isReducing && path.length > 1
        ? getPathStates(path, INITIAL_RECOVERY_FAILURE)
        : path.map((position) => ({
            state: getStoredState(position),
            action: store.getAction(position),
          }));
    if (!lastSuccessor) return toTrace(steps, path);
    const action = isReducing
      ? findTraceSuccessor(getStoredState(index), (successor) =>
          isSameState(successor.state, lastSuccessor.state),
        )?.action
      : lastSuccessor.action;
    return toTrace([...steps, { state: lastSuccessor.state, action }], path, { known: 2 });
  };
  // TLC prints a lone initial state without the alias. TLCTrace#getTrace still recovers it from the
  // initial predicate, printing again, though TLC 1.7.4 doesn't.
  const getStateTrace = (index: number): Behavior =>
    store.getParent(index) === -1
      ? {
          trace: [{ action: undefined, label: undefined, state: toRecord(getStoredState(index)) }],
          traceOutput: is174 ? [] : captureOutput(getSpecInitialStates).lines,
        }
      : getTrace(index);
  // TLC rebuilds the trace again for the postcondition after it prints a violation, but not after
  // an evaluation fails.
  const getFailedTrace = (index: number, successor: Successor): Behavior => ({
    trace: getTrace(index, successor).trace,
  });
  // TLC names the initial state it was checking unless a standard module's Java code failed.
  const getFailureExitCode = (error: TlaEvaluationError, failureOptions: FailureOptions) => {
    // TLC 1.7.4 exits with the result of its replay of the initial states, which only fails again
    // when the error isn't in adding a state it has already seen to the behavior graph.
    if (
      failureOptions.isInitial &&
      !failureOptions.callStack &&
      !failureOptions.fingerprint &&
      is174
    ) {
      return EXIT_STATUS.success;
    }
    if (!failureOptions.callStack) {
      return failureOptions.isInitial ? getInitialExitCode(error) : getErrorExitCode(error);
    }
    if (failureOptions.isCallStackFirst) return getErrorExitCode(error);
    // Without a replay, TLC exits with the code of the error, as for any error it didn't expect.
    if (failureOptions.isLiveCallStack) {
      return (
        getExitCode(error) ?? (error instanceof TlaModuleError ? error.exitCode : EXIT_STATUS.error)
      );
    }
    // TLC exits with the code of a failed replay of the initial states regardless of the error, as
    // it does for a replay that fails to fingerprint.
    return failureOptions.isInitial || failureOptions.fingerprint
      ? EXIT_STATUS.specEvaluationFailure
      : getReplayExitCode(error);
  };
  const createFailureResult = (
    failed: unknown,
    behavior: Behavior,
    failureOptions: FailureOptions = {},
  ) => {
    const error = isStackOverflow(failed) ? new TlaStackOverflowError() : failed;
    if (!(error instanceof TlaEvaluationError)) throw error;
    const checked =
      behavior.trace.length > 0 && !failureOptions.traceFailure
        ? checkTracePostconditions(behavior.trace, undefined)
        : undefined;
    const postcondition = checked?.unwitnessed ?? checked?.postcondition;
    const traceOutput = [...(behavior.traceOutput ?? []), ...(checked?.lines ?? [])];
    return {
      ...createResult("error", undefined, {
        ...getFailureMessage(error, failureOptions.isNextState ?? false),
        ...behavior,
        ...(traceOutput.length > 0 && { traceOutput }),
        ...(postcondition && { postcondition }),
        initialState:
          failureOptions.initialState && !(error instanceof TlaModuleError)
            ? toRecord(failureOptions.initialState)
            : undefined,
        exitCode: getFailureExitCode(error, failureOptions),
        callStack: failureOptions.callStack,
        ...(failureOptions.isCallStackFirst && { isCallStackFirst: true }),
        ...(failureOptions.fingerprint && { fingerprint: failureOptions.fingerprint }),
        ...(failureOptions.traceFailure && { traceFailure: failureOptions.traceFailure }),
      }),
      outDegrees: failureOptions.outDegrees,
    };
  };
  // TLC reports a successor state that an action leaves incomplete with the trace to it, which ends
  // with the partial state. It names the action when the next-state relation has several.
  const reportIncompleteSuccessor = (index: number, error: TlaIncompleteSuccessorError) => {
    runtime.generatedStates++;
    const actions = getSpecNextActions();
    const action =
      actions.length === 1 ? actions[0] : actions.find((item) => item.name === error.action);
    const missing = error.variables;
    const subject =
      actions.length === 1
        ? "the next-state action"
        : `action ${error.action} of the next-state relation`;
    // TLC 1.7.4 says a variable is not assigned rather than not defined.
    const verb = is174 ? "assigned" : "defined";
    const message = `Successor state is not completely specified by ${subject}. The following variable${missing.length > 1 ? "s are" : " is"} not ${verb}: ${missing.join(", ")}.\n`;
    const undefinedValue = createModelValue("null");
    const partial = error.state.map((value) => value ?? undefinedValue);
    const failure = createFailureResult(error, getStateTrace(index));
    return withOutDegrees({
      ...failure,
      failure: failure.failure && {
        ...failure.failure,
        code: MESSAGE_CODE.incompleteSuccessor,
        message,
        toolMessage: message,
        exitCode: EXIT_STATUS.specEvaluationFailure,
        trace: [
          ...failure.failure.trace,
          {
            action: error.action,
            label: action && getActionLabel(action, options.version),
            state: toRecord(partial),
          },
        ],
      },
    });
  };
  const getPathSteps = (path: number[], loopStart?: number) => {
    const steps = getPathStates(path, NEXT_RECOVERY_FAILURE);
    const lastState = steps[steps.length - 1].state;
    const isClosed =
      !isReducing ||
      loopStart === undefined ||
      loopStart === path.length - 1 ||
      findSuccessorWithFingerprint(lastState, path[loopStart]) !== undefined;
    if (!isClosed) throw new TlaEvaluationError(NEXT_RECOVERY_FAILURE);
    return steps;
  };
  const getStateHash = (state: Value[]) => {
    let hash = 0x811c9dc5;
    for (let index = 0; index < state.length; index++)
      hash = combineHash(hash, getValueHash(state[index]));
    return hash & 0x3fffffff;
  };
  // TLC fingerprints a state once it finds the state in the model.
  const fingerprintModelState = (state: Value[]) => {
    for (const value of state) {
      const error = getFingerprintError(value);
      if (error) throw error;
    }
  };
  const isSameState = (stored: Value[], state: Value[]) => {
    for (let position = 0; position < state.length; position++) {
      if (!isSameValue(stored[position], state[position])) return false;
    }
    return true;
  };
  const findStateIndex = (hash: number, state: Value[]) =>
    seenStates.find(hash, store.isSameFingerprint, state);
  const markSeen = seenStates.add;
  // A new successor that TLC has added to its set of states before it checks the successor, which
  // the check stores after.
  const unstoredState = { fingerprint: undefined as Value[] | undefined };
  const countDistinctState = (depth: number) => {
    runtime.distinctStates = store.getCount() + 1;
    statistics.depth = Math.max(statistics.depth, depth);
    runtime.diameter = Math.max(runtime.diameter, depth);
  };
  const current = {
    index: -1,
    isExpanding: false,
    state: undefined as Value[] | undefined,
    candidate: undefined as Value[] | undefined,
    candidateLevel: 0,
    livenessSource: -1,
  };
  // A state read back from the store is a new array, so this tells a stored state from one that a
  // trace rebuilt, whose values can be the same.
  const storedIndexes = new WeakMap<object, number>();
  const getStoredIndex = (state: readonly (Value | undefined)[]) =>
    state === current.state ? current.index : (storedIndexes.get(state) ?? -1);
  const readStoredState = (index: number) => {
    const state = store.getState(index);
    storedIndexes.set(state, index);
    return state;
  };
  const getStoredState = (index: number) =>
    index === current.index && current.state !== undefined ? current.state : readStoredState(index);
  const addState = (
    state: Value[],
    fingerprintState: Value[],
    parent: number,
    action: string | undefined,
    isViolating: boolean,
  ) => {
    if (liveness) storedIndexes.set(state, store.getCount());
    store.add(state, fingerprintState, parent, action, isViolating);
  };
  const getPath = (index: number): Value[][] =>
    index === -1 ? [] : [...getPath(store.getParent(index)), getStoredState(index)];
  runtime.isSeen = (state) => {
    const fingerprintState = getFingerprintState(state);
    return findStateIndex(getStateHash(fingerprintState), fingerprintState) !== -1;
  };
  runtime.getBehavior = (state) => {
    const index = state === current.candidate ? -1 : getStoredIndex(state);
    return index === -1 ? [...getPath(current.index), state] : getPath(index);
  };
  runtime.getCurrentState = () =>
    current.index === -1 ? undefined : getStoredState(current.index);
  runtime.setLivenessSource = (index) => {
    current.livenessSource = index ?? -1;
  };
  runtime.getLevel = (state) => {
    const source = current.livenessSource;
    // TLC 1.7.4 reads the level of the state its worker explores, whichever state it evaluates.
    if (is174) {
      const explored = source !== -1 ? source : current.isExpanding ? current.index : -1;
      return explored === -1 ? 0 : store.getDepth(explored);
    }
    if (source !== -1) return store.getDepth(source) + (getStoredIndex(state) === source ? 0 : 1);
    if (state === current.candidate) return current.candidateLevel;
    if (current.index === -1) return 0;
    if (getStoredIndex(state) === current.index) return store.getDepth(current.index);
    return current.isExpanding ? store.getDepth(current.index) + 1 : 0;
  };

  const getGraphState = (state: Value[], level: number): GraphState => ({
    fingerprint: BigInt.asIntN(64, runtime.getFingerprint(state)),
    level,
    getLabel: () =>
      formatState(
        config.alias === undefined
          ? toRecord(state)
          : evaluateAlias(config.alias, state, undefined),
      ),
    getText: () => formatState(toRecord(state)),
  });

  const visitInitialState = (state: Value[]) => {
    canonicalizeState(state);
    runtime.generatedStates++;
    runtime.initialStates++;
    current.candidate = state;
    current.candidateLevel = 1;
    const fingerprintState = getFingerprintState(state);
    const hash = getStateHash(fingerprintState);
    const isInModel = search.satisfiesConstraints(state);
    if (isInModel) {
      search.trackStatePossible(state);
      fingerprintModelState(fingerprintState);
      state.forEach(markFingerprinted);
    }
    const isSeen = isInModel && findStateIndex(hash, fingerprintState) !== -1;
    if (isSeen) return undefined;
    unstoredState.fingerprint = isInModel ? fingerprintState : undefined;
    if (isInModel) {
      countDistinctState(1);
      runtime.queueSize++;
      liveness?.addInitialState(store.getCount(), state);
      stateWriter?.writeInitialState(getGraphState(state, 1));
    }
    const continuedInvariants = options.isContinued ? search.getViolatedInvariants(state) : [];
    continuedInvariants.forEach((invariant) =>
      reportContinuedViolation("invariant-violation", {
        name: invariant.name,
        ...toTrace([{ action: undefined, state }], []),
      }),
    );
    const violated = options.isContinued ? undefined : search.findViolatedInvariant(state);
    if (violated) {
      return reportViolation("invariant-violation", {
        name: violated.name,
        ...toTrace([{ action: undefined, state }], []),
      });
    }
    const failedPredicate = search.findFailedInitialPredicate(state);
    if (failedPredicate) {
      return reportViolation("liveness-violation", {
        name: failedPredicate.name,
        ...toTrace([{ action: undefined, state }], []),
      });
    }
    if (!isInModel) return undefined;
    markSeen(hash, store.getCount());
    addState(state, fingerprintState, -1, undefined, continuedInvariants.length > 0);
    return undefined;
  };
  const visitSuccessor = (
    index: number,
    successor: Successor,
    liveSuccessors: LiveSuccessor[],
    source: GraphState | undefined,
    action: SpecAction | undefined,
  ) => {
    const state = getStoredState(index);
    const depth = store.getDepth(index);
    runtime.generatedStates++;
    current.candidate = successor.state;
    current.candidateLevel = depth + 1;
    if (isCanonicalizedFirst) canonicalizeState(successor.state);
    const fingerprintState = getFingerprintState(successor.state);
    const hash = getStateHash(fingerprintState);
    const foundIndex = findStateIndex(hash, fingerprintState);
    const isStateInModel = search.satisfiesConstraints(successor.state, state);
    if (isStateInModel) search.trackStatePossible(successor.state);
    const isInModel = isStateInModel && search.satisfiesActionConstraints(state, successor.state);
    if (isInModel) {
      search.trackActionPossible(state, successor.state);
      fingerprintModelState(fingerprintState);
      successor.state.forEach(markFingerprinted);
    }
    const existing = isInModel ? foundIndex : -1;
    if (source && isInModel) {
      stateWriter?.writeSuccessor(
        source,
        getGraphState(successor.state, depth + 1),
        existing !== -1,
        action && { name: action.name, signature: getActionSignature(action) },
      );
    }
    if (existing !== -1 && liveness) {
      if (store.isStoredIdentically(existing, successor.state)) {
        storedIndexes.set(successor.state, existing);
      }
      liveSuccessors.push({ index: existing, state: successor.state });
    }
    const isNew = isInModel && existing === -1;
    // TLC adds a new state to the behavior graph's successors before it checks the invariants.
    if (isNew && liveness) liveSuccessors.push({ index: store.getCount(), state: successor.state });
    unstoredState.fingerprint = isNew ? fingerprintState : undefined;
    if (isNew) {
      countDistinctState(depth + 1);
      expansion.newStates++;
    }
    const checked = { isViolating: false };
    if (existing === -1) {
      try {
        const violated = search.findViolatedInvariant(
          successor.state,
          state,
          store.isViolating(index),
        );
        checked.isViolating = violated !== undefined;
        const violation = violated && { name: violated.name, ...getTrace(index, successor) };
        if (violation && !options.isContinued) {
          return withOutDegrees(reportViolation("invariant-violation", violation));
        }
        if (violation) reportContinuedViolation("invariant-violation", violation);
      } catch (error) {
        if (isStackOverflow(error)) throw error;
        // TLC replays the expansion and skips the invariants of a state it has seen, the failed one
        // included unless the constraints exclude it. When the replay fails, TLC reports where and
        // leaves out the outdegree.
        const replay = captureOutput(() => replayNext(index));
        return createFailureResult(
          error,
          appendTraceOutput(getFailedTrace(index, successor), replay.lines),
          replay.result ?? { outDegrees: getFailureOutDegrees() },
        );
      }
    }
    const violatedProperty = search.findViolatedActionProperty(state, successor.state);
    const propertyViolation = violatedProperty && {
      name: violatedProperty.name,
      ...getTrace(index, successor),
    };
    if (propertyViolation && !options.isContinued) {
      return withOutDegrees(reportViolation("liveness-violation", propertyViolation));
    }
    if (propertyViolation) reportContinuedViolation("liveness-violation", propertyViolation);
    if (!isNew) return undefined;
    if (!isCanonicalizedFirst) canonicalizeState(successor.state);
    markSeen(hash, store.getCount());
    addState(successor.state, fingerprintState, index, successor.action, checked.isViolating);
    runtime.queueSize++;
    return undefined;
  };

  const outcome: { result: CheckResult | undefined } = { result: undefined };
  if (liveness) {
    options.onProgress?.({ kind: "liveness-prepared", branches: liveness.branches });
  }
  // TLC checks the assumptions once it has built the liveness checker in ModelChecker's
  // constructor.
  const assumptionViolation = findViolatedAssumption();
  if (assumptionViolation) return createResult("assumption-violation", assumptionViolation);
  options.onProgress?.({ kind: "initial-states-started" });
  if (spec.init !== undefined) {
    try {
      forEachInitialState(
        spec.init,
        environment,
        (state) => {
          reportInitialStatesProgress(runtime.initialStates, options.onProgress);
          try {
            outcome.result = visitInitialState(state);
          } catch (error) {
            const replay = captureOutput(replayInit);
            outcome.result = createFailureResult(
              error,
              { trace: [], traceOutput: replay.lines },
              { initialState: state, ...replay.result, isInitial: true },
            );
          }
          return outcome.result !== undefined;
        },
        spec.scope,
      );
    } catch (error) {
      // TLC prints an illegal initial state with null for each variable it leaves undefined, and
      // stops before it prints the statistics.
      if (error instanceof TlaIllegalStateError) {
        const illegal = createFailureResult(
          error,
          { trace: [] },
          { initialState: error.state.map((value) => value ?? createModelValue("null")) },
        );
        return {
          ...illegal,
          failure: illegal.failure && { ...illegal.failure, isWithoutStatistics: true },
        };
      }
      // TLC prints the error before it replays the initial predicate with its call stack.
      const replay = captureOutput(replayInit);
      return createFailureResult(
        error,
        { trace: [], traceOutput: replay.lines },
        { ...replay.result, isInitial: true },
      );
    }
  }
  if (outcome.result) return outcome.result;
  statistics.initialStates = {
    generated: runtime.initialStates,
    distinct: runtime.distinctStates,
  };
  options.onProgress?.({
    kind: "initial-states-computed",
    initialStates: statistics.initialStates,
  });

  const next = spec.next;
  if (next === undefined) {
    if (store.getCount() > 0) {
      throw new TlaEvaluationError(
        "No next state actions defined to generate successor states from.",
      );
    }
    return createSuccess();
  }
  // TLC labels and colors an edge of the -dump state graph by the action that generated it. When
  // the graph names its edges, the search generates successors action by action, as TLC does.
  const isNamingEdges = Boolean(
    options.dump?.dot && (options.dump.actionLabels || options.dump.colorize),
  );
  const forEachActionSuccessor = (
    state: Value[],
    onSuccessor: (successor: Successor, action: SpecAction | undefined) => boolean,
  ) => {
    if (!isNamingEdges) {
      return forEachSuccessor(
        next,
        state,
        environment,
        (successor) => onSuccessor(successor, undefined),
        spec.scope,
      );
    }
    const progress = { isStopped: false };
    return getSpecNextActions().reduce((count, action) => {
      if (progress.isStopped) return count;
      return (
        count +
        forEachSuccessor(
          action.expression,
          state,
          environment,
          (successor) => {
            progress.isStopped = onSuccessor(successor, action);
            return progress.isStopped;
          },
          action.scope,
        )
      );
    }, 0);
  };
  // TLC's worker adds a state to the behavior graph even after its next states fail or violate a
  // property, and prints the call stack of an error in that, unless the error is a
  // FingerprintException, which the worker doesn't catch. TLC 1.7.4 prints none.
  const getLiveCallStack = (index: number, liveSuccessors: LiveSuccessor[]) => {
    if (!liveness || is174) return undefined;
    const replay = getReplayFailure((tracing) =>
      liveness.addState(index, getStoredState(index), liveSuccessors, tracing),
    );
    return replay?.callStack.length && !replay.fingerprint ? replay.callStack : undefined;
  };
  // TLC's worker adds the state to the behavior graph after it prints the trace. On an error in that,
  // it adds the state again to print the call stack instead of replaying the next-state relation,
  // which TLC 1.7.4 doesn't.
  const addFailedLiveState = (index: number, liveSuccessors: LiveSuccessor[]) => {
    try {
      liveness?.addState(index, getStoredState(index), liveSuccessors);
      return undefined;
    } catch (error) {
      if (!(error instanceof TlaEvaluationError)) throw error;
      return getLiveCallStack(index, liveSuccessors);
    }
  };
  const replayFailedNext = (index: number, liveSuccessors: LiveSuccessor[]) => {
    const live = captureOutput(() => addFailedLiveState(index, liveSuccessors));
    if (live.result) {
      const result = { callStack: live.result, fingerprint: undefined, isLiveCallStack: true };
      return { result, lines: live.lines };
    }
    const replay = captureOutput(() => replayNext(index));
    return { result: replay.result, lines: [...live.lines, ...replay.lines] };
  };
  // TLC reports a stack overflow while it computes next states without replaying it, with the
  // behavior up to the state it expands.
  const reportNextStateOverflow = (index: number) =>
    createFailureResult(createStackOverflowError(), getStateTrace(index));
  // After the trace, TLC replays the next-state relation with its call stack, printing again.
  const reportNextStateFailure = (
    error: unknown,
    index: number,
    liveSuccessors: LiveSuccessor[],
  ) => {
    if (isStackOverflow(error)) return reportNextStateOverflow(index);
    const replay = replayFailedNext(index, liveSuccessors);
    return createFailureResult(
      withNextStateExitCode(error),
      appendTraceOutput(getStateTrace(index), replay.lines),
      { isNextState: true, ...replay.result },
    );
  };
  const expandState = (index: number, liveSuccessors: LiveSuccessor[]) => {
    const state = getStoredState(index);
    const source = stateWriter && getGraphState(state, store.getDepth(index));
    const successorCount = forEachActionSuccessor(state, (successor, action) => {
      try {
        outcome.result = visitSuccessor(index, successor, liveSuccessors, source, action);
      } catch (error) {
        if (isStackOverflow(error)) {
          outcome.result = reportNextStateOverflow(index);
          return true;
        }
        // TLC 1.7.4 reports the wrapped error without the trace, except for a failed property,
        // which it reports with the trace before it rethrows. The error stops its worker before it
        // adds the state to the behavior graph.
        const replay = is174
          ? captureOutput(() => replayNext(index))
          : replayFailedNext(index, liveSuccessors);
        if (is174 && error instanceof TlaEvaluationError && !isHeadedError(error)) {
          outcome.result = createFailureResult(
            new TlaEvaluationError(`${getWrappedException(error)}${error.message}`, error),
            appendTraceOutput({ trace: [] }, replay.lines),
            { isNextState: true, ...replay.result },
          );
          return true;
        }
        // A successor TLC can't fingerprint fails again as TLC prints it in the trace, which TLC
        // reports as an exception it didn't expect.
        const isTraceFailed = getFingerprintState(successor.state).some(
          (value) => getFingerprintError(value) !== undefined,
        );
        const traceFailure =
          isTraceFailed && error instanceof TlaEvaluationError
            ? getFailureMessage(
                isEvalException(error)
                  ? new TlaEvaluationError(`${UNEXPECTED_EVAL_EXCEPTION}${error.message}`)
                  : error,
                true,
              )
            : undefined;
        outcome.result = createFailureResult(
          error,
          appendTraceOutput(
            traceFailure ? getStateTrace(index) : getFailedTrace(index, successor),
            replay.lines,
          ),
          { isNextState: true, ...replay.result, traceFailure },
        );
      }
      return outcome.result !== undefined;
    });
    current.isExpanding = false;
    const result = outcome.result;
    // TLC 1.7.4's worker stops at a violation.
    if (result?.violation && !is174) {
      const live = captureOutput(() => addFailedLiveState(index, liveSuccessors));
      return {
        ...result,
        violation: appendTraceOutput(result.violation, live.lines),
        ...(live.result && { liveCallStack: live.result }),
      };
    }
    if (result) return result;
    const addLiveState = () => {
      if (liveness && source && is174) stateWriter?.writeStuttering(source);
      const accepted = liveness?.addState(index, state, liveSuccessors);
      if (!liveness || !accepted) return undefined;
      const steps = getPathSteps(accepted);
      const properties = getViolatedProperties(
        liveness,
        steps.map((step) => step.state),
        steps.length - 1,
      );
      return reportViolation("property-violation", {
        name: properties[0],
        properties,
        ...toTrace(steps, accepted, { known: 0 }),
      });
    };
    if (successorCount === 0 && config.checkDeadlock) {
      const deadlock = reportViolation("deadlock", { name: "deadlock", ...getStateTrace(index) });
      // TLC's worker still adds the deadlocked state to the behavior graph after it reports the
      // deadlock, and reports a temporal property that this violates. Then it counts the state as
      // expanded.
      const live = captureOutput(() => {
        try {
          return { additional: addLiveState()?.violation };
        } catch (error) {
          if (!(error instanceof TlaEvaluationError)) throw error;
          return { isFailed: true, callStack: getLiveCallStack(index, liveSuccessors) };
        }
      });
      const reported = deadlock.violation
        ? { ...deadlock, violation: appendTraceOutput(deadlock.violation, live.lines) }
        : deadlock;
      // An error in adding the state stops TLC 1.7.4's worker before it counts the state.
      const counted = withOutDegrees(
        reported,
        live.result.isFailed ? getFailureOutDegrees() : getPartialOutDegrees(),
      );
      if (live.result.additional)
        return { ...counted, additionalViolation: live.result.additional };
      return live.result.callStack ? { ...counted, liveCallStack: live.result.callStack } : counted;
    }
    try {
      return addLiveState();
    } catch (error) {
      // TLC 1.7.4's worker reports an error in adding a state to the behavior graph as an exception
      // it didn't expect, without the trace or a call stack, and exits as for any general error.
      if (is174 && error instanceof TlaEvaluationError) {
        const unexpected = new TlaEvaluationError(
          `${isEvalException(error) ? UNEXPECTED_EVAL_EXCEPTION : UNEXPECTED_EXCEPTION}${error.message}`,
        );
        return createFailureResult(
          setExitCode(unexpected, EXIT_STATUS.error),
          { trace: [] },
          { outDegrees: getFailureOutDegrees() },
        );
      }
      // TLC's Worker#doNextCheckLiveness adds the state again to find the call stack, prints it
      // before the error, and reports the error as one in computing next states.
      const replay = getReplayFailure((tracing) =>
        liveness?.addState(index, state, liveSuccessors, tracing),
      );
      return createFailureResult(error, getStateTrace(index), {
        outDegrees: getFailureOutDegrees(),
        callStack: replay?.callStack.length ? replay.callStack : undefined,
        isNextState: true,
        isCallStackFirst: true,
      });
    }
  };
  // TLC's Liveness#printStutteringCounterExampleWarning.
  const getStutteringWarning = () => {
    const name = config.specification;
    const book =
      "(compare Chapter 8, page 87ff of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html).";
    if (name === undefined) {
      return {
        code: MESSAGE_CODE.noSpecificationButProperty,
        text: `The stuttering counterexample above may be caused by the absence of a behavior specification (SPECIFICATION). Only INIT and NEXT have been provided, so TLC permits infinite stuttering. To rule out such counterexamples, use SPECIFICATION Spec, with Spec asserting a suitable fairness constraint ${book}`,
      };
    }
    const range = getDefinition(name, environment)?.location.range;
    if (spec.temporals.length > 0 || !range) return undefined;
    return {
      code: MESSAGE_CODE.noFairnessButProperty,
      text: `The stuttering counterexample above may be caused by the absence of a fairness constraint in the behavior specification ${name} defined at ${formatRange(range)}. To rule out such counterexamples, conjoin a suitable fairness constraint to ${name} ${book}`,
    };
  };
  // TLC names the properties and the step back into the cycle from the states it prints.
  const reportLasso = (checker: LivenessChecker, lasso: Lasso) => {
    const path = [...lasso.prefix, ...lasso.cycle];
    const loopStart = lasso.prefix.length;
    const steps = getPathSteps(path, loopStart);
    const trace = toTrace(steps, path, { loopStart, known: 0 }).trace;
    const properties = getViolatedProperties(
      checker,
      steps.map((step) => step.state),
      loopStart,
    );
    const cycleStart = path[loopStart];
    const cycleEnd = path[path.length - 1];
    const lastState = steps[steps.length - 1].state;
    const loop =
      cycleStart === cycleEnd
        ? { result: undefined, lines: [] }
        : captureOutput(() =>
            findStepAction(cycleEnd, lastState, getStoredState(cycleStart), false),
          );
    const isStutteringWarned = cycleStart === cycleEnd && lasso.isCycleConstrained;
    return reportViolation(
      "liveness-violation",
      {
        name: properties[0],
        properties,
        trace,
        traceOutput: loop.lines,
        loopStart,
        loopLabel: loop.result && getActionLabel(loop.result, options.version),
        warning: isStutteringWarned ? getStutteringWarning() : undefined,
      },
      () =>
        cycleStart === cycleEnd
          ? getStepAction(trace[trace.length - 1])
          : loop.result
            ? toActionValue(loop.result)
            : createActionRecord(findSuccessorWithFingerprint(lastState, cycleStart)?.action),
    );
  };
  const isPeriodic = liveness !== undefined && options.livenessCheck !== "final";
  const startedAt = performance.now();
  const periodic = { at: startedAt + PERIODIC_START, size: 1, time: 0 };
  const findPeriodicViolation = (expanded: number) => {
    const now = performance.now();
    const isGrown = (expanded - periodic.size) / periodic.size > LIVENESS_GROWTH;
    if (!isGrown || periodic.time > (now - startedAt) * LIVENESS_RATIO) return undefined;
    periodic.size = expanded;
    if (!liveness) return undefined;
    options.onProgress?.({
      kind: "liveness-started",
      branches: liveness.branches,
      isComplete: false,
      states: expanded,
      statistics: createResult("success"),
    });
    const lasso = liveness.findViolation();
    if (!lasso) options.onProgress?.({ kind: "liveness-finished" });
    periodic.time += performance.now() - now;
    return lasso;
  };
  for (let index = 0; index < store.getCount() && !runtime.isStopped; index++) {
    current.index = index;
    current.state = liveness ? readStoredState(index) : store.getState(index);
    current.candidate = undefined;
    runtime.queueSize = store.getCount() - index - 1;
    current.isExpanding = true;
    const liveSuccessors: LiveSuccessor[] = [];
    try {
      outcome.result = expandState(index, liveSuccessors);
    } catch (error) {
      outcome.result =
        error instanceof TlaIncompleteSuccessorError
          ? reportIncompleteSuccessor(index, error)
          : reportNextStateFailure(error, index, liveSuccessors);
    }
    if (outcome.result) return outcome.result;
    outDegrees[getOutDegreeBucket()]++;
    expansion.newStates = 0;
    // TLC's AbstractChecker#runTLC checks the liveness properties on the state graph so far, then
    // reports how far the search got.
    if ((isPeriodic || options.onProgress) && performance.now() >= periodic.at) {
      periodic.at = performance.now() + PROGRESS_INTERVAL;
      const lasso = isPeriodic ? findPeriodicViolation(index + 1) : undefined;
      if (liveness && lasso) return reportLasso(liveness, lasso);
      options.onProgress?.({ kind: "progress", statistics: createResult("success") });
    }
  }

  current.index = -1;
  current.candidate = undefined;
  if (liveness) {
    options.onProgress?.({
      kind: "liveness-started",
      branches: liveness.branches,
      isComplete: true,
      states: runtime.distinctStates,
      statistics: createResult("success"),
    });
  }
  const lasso = liveness?.findViolation();
  if (liveness && lasso) return reportLasso(liveness, lasso);

  // TLC finishes the check of the temporal properties before it checks the postconditions.
  if (liveness) options.onProgress?.({ kind: "liveness-finished" });
  try {
    const postcondition = search.findPostconditionViolation();
    if (postcondition) {
      return createResult("postcondition-violation", {
        name: postcondition.name,
        message: postcondition.message,
        counts: postcondition.counts,
        trace: [],
        postcondition,
      });
    }
  } catch (error) {
    return createFailureResult(error, { trace: [] });
  }
  return createSuccess();
};
