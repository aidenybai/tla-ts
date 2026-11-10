import type { Expression } from "./ast";
import { parseConfig, type ModelConfig } from "./config";
import { createEnvironment } from "./environment";
import {
  createStackOverflowError,
  getErrorExitCode,
  isStackOverflow,
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
  formatRange,
  getDefinition,
  isImpure,
  type CallStack,
  type Environment,
  type FingerprintFailure,
} from "./evaluate";
import {
  EXIT_STATUS,
  getExitCode,
  getMessageExitStatus,
  setExitCode,
  withLivenessExitCode,
} from "./exit-codes";
import type { JavaOverride } from "./java-overrides";
import {
  createLivenessChecker,
  type Lasso,
  type LivenessChecker,
  type LiveSuccessor,
} from "./liveness-checker";
import {
  createMissingOperatorError,
  createSearch,
  getIncompleteSuccessorMessage,
  findAssumptionViolation,
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
  hasIncompleteSuccessor,
  type Successor,
} from "./successors";
import {
  getCodedMessage,
  getFailureMessage,
  getWrappedException,
  isEvalException,
  isHeadedError,
  MESSAGE_CODE,
  withUnexpectedException,
  type FailureMessage,
} from "./tlc/messages";
import { createTautologyError } from "./liveness";
import { KEY_SEPARATOR } from "./resolve";
import { writeTraceSpec } from "./tlc/trace-spec";
import { createTlcOrder } from "./tlc/order";
import { replayInitialStates, replaySuccessors } from "./tlc/replay";
import { getFingerprintDistance, OUT_DEGREE_BUCKETS } from "./tlc/summary";
import { createActionRecord, createCounterExample } from "./tlc/tlcext-operators";
import type { TlcVersion } from "./tlc/version";
import {
  combineHash,
  createCanonicalizer,
  createModelValue,
  formatState,
  getFingerprintError,
  getHeldValues,
  getModelValues,
  getValueHash,
  isSameValue,
  markFingerprinted,
  setStringOrder,
  setValueVersion,
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
  writeFile?: (path: string, content: string | Uint8Array) => void;
  makeDirectory?: (path: string) => void;
  seed?: bigint;
  workers?: number;
  // TLC's -lncheck: "final" checks liveness only on the complete state graph.
  livenessCheck?: "default" | "final";
  // TLC's -dump: writes the reachable states, or with `dot` the state graph, through writeFile.
  dump?: StateDump;
  // TLC's -tool, which changes the messages of TLC's errors.
  isTool?: boolean;
  // TLC's -continue: reports each violation through onProgress and goes on.
  isContinued?: boolean;
  moduleOperators?: ModuleOperator[];
  // TLC's trace exploration spec, and the binary trace TLC records for it unless -noTEBin.
  traceSpec?: TraceSpecOptions;
  // Whether the caller printed SANY's report, its warnings included, before the check.
  isSanyReported?: boolean;
  // False for TLC's -nowarning, which changes how TLC computes some successors.
  isWarningEnabled?: boolean;
  version?: TlcVersion;
  onProgress?: (progress: CheckProgress) => void;
}

export interface TraceSpecOptions {
  module: string;
  traceFile?: string;
}

export interface ModuleOperator {
  kind: "postcondition" | "constraint" | "view";
  module: string;
  operator: string;
  constants?: Record<string, string>;
}

export interface InitialStatesProgress {
  kind: "initial-states-progress";
  count: number;
}

// A check TLC reports as violated before it stops replaying the initial states.
export interface InitialStateViolation {
  kind: "initial-state-violation";
  status: "invariant-violation" | "liveness-violation";
  name: string;
  state: Record<string, Value>;
}

// A line the spec prints, or what TLC reports as it replays the initial states.
export type OutputLine = string | InitialStatesProgress | InitialStateViolation;

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
  // What the spec prints before this step as TLC rebuilds the trace, and before it for the first.
  output?: OutputLine[];
}

export interface Violation {
  name: string;
  // Every temporal property that a liveness counterexample violates, in the configuration's order.
  properties?: string[];
  trace: TraceStep[];
  // What the spec prints after the trace, as TLC finds the lasso's step back or rebuilds the trace.
  traceOutput?: OutputLine[];
  // What the postconditions print, which TLC checks after the lasso's step back.
  postconditionOutput?: OutputLine[];
  loopStart: number | undefined;
  loopLabel?: string;
  message?: string;
  counts?: string;
  unwitnessed?: Postcondition;
  // A POSTCONDITION that is false or fails, which TLC checks as it prints the counterexample.
  postcondition?: Postcondition;
  // What TLC warns about after a counterexample, with its code.
  warning?: { code: number; text: string };
}

export interface Postcondition {
  name: string;
  code: number;
  message: string;
  counts?: string;
}

// An evaluation that failed during the search, with the behavior up to the state TLC was working on.
export interface EvaluationFailure {
  code: number;
  message: string;
  toolMessage: string;
  trace: TraceStep[];
  traceOutput?: OutputLine[];
  initialState: Record<string, Value> | undefined;
  exitCode: number;
  // The expressions TLC was evaluating, outermost first, when its replay finds them.
  callStack: Expression[] | undefined;
  // Whether TLC prints the call stack before the error, as it does for a failed liveness check.
  isCallStackFirst?: boolean;
  // The FingerprintException the replay raises, which TLC reports in place of the call stack.
  fingerprint?: FingerprintFailure;
  // How TLC reports failing again as it prints the trace, since it can't fingerprint the state.
  traceFailure?: FailureMessage;
  // A POSTCONDITION that is false or fails after the trace, which TLC checks as it prints one.
  postcondition?: Postcondition;
  // Whether TLC stops before it prints the statistics, as it does for an illegal initial state.
  isWithoutStatistics?: boolean;
}

interface ReplayFailure {
  callStack: Expression[];
  fingerprint: FingerprintFailure | undefined;
  replayError?: TlaEvaluationError;
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
  // Once TLC computed all the initial states without a violation or an error.
  initialStates: InitialStates | undefined;
  // How many expanded states found each number of new states, when TLC prints the outdegree.
  outDegrees: number[] | undefined;
  // The smallest distance between two fingerprints, when TLC estimates a collision from them.
  fingerprintDistance: bigint | undefined;
  // A temporal property TLC finds violated as it adds a deadlocked state, reported after.
  additionalViolation?: Violation;
  // Where TLC's worker fails to add the state to the behavior graph after it reports a violation.
  liveCallStack?: Expression[];
  // The outdegrees when TLC's workers stop on a violation that TLC 1.7.4 reports as a success.
  violationOutDegrees?: number[];
  traceSpec?: string;
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
  replayError?: TlaEvaluationError;
  isNextState?: boolean;
  isCallStackFirst?: boolean;
  traceFailure?: FailureMessage;
  // Whether TLC prints the call stack of adding the state to the behavior graph, not a replay.
  isLiveCallStack?: boolean;
}

const appendTraceOutput = <Traced extends Behavior>(behavior: Traced, lines: OutputLine[]) => ({
  ...behavior,
  traceOutput: [...(behavior.traceOutput ?? []), ...lines],
});

const INITIAL_RECOVERY_FAILURE = "Failed to recover the initial state from its fingerprint.";
const NEXT_RECOVERY_FAILURE = "Failed to recover the next state from its fingerprint.";

// Stops a replay where TLC stops it without a failure, as at a violated invariant.
const STOP_REPLAY = new Error("The replay stopped");

// When TLC's replay of the initial states doesn't fail again, it exits with the error's code.
const getInitialExitCode = (error: TlaEvaluationError) => {
  const coded = getCodedMessage(error.message);
  return coded &&
    !coded.isEvalException &&
    getMessageExitStatus(coded.code) === EXIT_STATUS.configParseError
    ? EXIT_STATUS.configParseError
    : getErrorExitCode(error);
};

// When the replay fails again, a standard module's EvalException decides the exit status, and
// any other failure exits as a nested expression failure. A heading or wrapping error defers.
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

// TLC checks liveness on the graph so far after 3 seconds and then every minute, once the graph
// has grown by a tenth and liveness checking has taken at most a fifth of the time.
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
  // TLC prints again while it rebuilds a trace, so rebuilding keeps what it prints for the trace.
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
    files: {
      readFile: options.readFile,
      writeFile: options.writeFile,
      makeDirectory: options.makeDirectory,
    },
    seed: options.seed,
    isTool: options.isTool,
    traceFile: options.traceSpec?.traceFile,
    isSanyReported: options.isSanyReported,
    isWarningEnabled: options.isWarningEnabled,
    version: options.version,
    moduleOperators: options.moduleOperators,
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
  const getTraceSpec = (trace: TraceStep[], loopStart: number | undefined) =>
    options.traceSpec &&
    writeTraceSpec({
      module: options.traceSpec.module,
      specName: specification.rootName,
      rawConstants: config.rawConstants,
      states: trace.map((step) => getStepState(step)),
      loopStart,
      modelValues: getModelValues().map((value) => value.name),
      isDefined: (name) =>
        environment.definitions.has(name) ||
        environment.constants.has(name) ||
        [...environment.definitions.keys()].some((key) =>
          key.startsWith(`${name}${KEY_SEPARATOR}`),
        ),
    });
  const createResult = (
    status: CheckStatus,
    violation?: Omit<Violation, "loopStart"> & { loopStart?: number },
    failure?: EvaluationFailure,
  ): CheckResult => {
    // TLC writes the trace it printed, and a safety property's counterexample doesn't loop back.
    const traceSpec = getTraceSpec(
      violation?.trace ?? failure?.trace ?? [],
      status === "property-violation" ? undefined : violation?.loopStart,
    );
    return {
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
      ...(traceSpec !== undefined && { traceSpec }),
    };
  };
  const outDegrees = Array.from({ length: OUT_DEGREE_BUCKETS }, () => 0);
  const expansion = { newStates: 0 };
  const getOutDegreeBucket = () => Math.min(expansion.newStates, OUT_DEGREE_BUCKETS - 1);
  // TLC counts the state it was expanding when an evaluation failed, except TLC 1.7.4.
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
          ? search.getStoredFingerprints(states, fingerprintStates)
          : BigInt64Array.from(states, runtime.getFingerprint),
    ),
  });

  const search = createSearch(
    config,
    environment,
    specification.variableLocations,
    () => order.getDeclarationOrder("variable"),
    options.onProgress,
    specification.moduleOperators,
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
  const hasPostconditions =
    config.postconditions.length > 0 ||
    config.possible.length > 0 ||
    specification.moduleOperators.some((operator) => operator.kind === "postcondition");
  // The state of each step without the alias, and its action, which CounterExample records.
  const traceSteps = new WeakMap<
    TraceStep,
    { state: Record<string, Value>; action: SpecAction | undefined }
  >();
  const getStepState = (step: TraceStep) => traceSteps.get(step)?.state ?? step.state;
  const getStepAction = (step: TraceStep) => {
    const action = traceSteps.get(step)?.action;
    return action ? toActionValue(action) : createActionRecord(step.action);
  };
  // TLC checks the postconditions on each trace it prints, so what they print follows the trace.
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
    return createResult(status, {
      ...violation,
      ...(checked.lines.length > 0 && { postconditionOutput: checked.lines }),
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
      return {
        callStack: callStack.expressions,
        fingerprint: callStack.fingerprint,
        replayError: error,
      };
    }
  };
  // Outermost first: each value fails as it fingerprints a value it holds.
  const findFailedSources = (value: Value, sources: CallStack["sources"]): Expression[] => {
    if (typeof value !== "object") return [];
    const source = sources.get(value);
    const failed = getHeldValues(value).find((held) => getFingerprintError(held) !== undefined);
    return [
      ...(source ? [source] : []),
      ...(failed === undefined ? [] : findFailedSources(failed, sources)),
    ];
  };
  // A value the replay built raises a FingerprintException when TLC fails to fingerprint it.
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
  // TLC's set of states already holds the state that failed.
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
  // TLC reports its progress again as it replays the initial states. After a FingerprintException
  // or a StackOverflowError, it only counts the states left, then throws the error.
  const replayInit = () => {
    const replayed = { count: 0 };
    const deferred: unknown[] = [];
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
              liveness?.addInitialState(states.length, state, tracing);
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
            const isFingerprintFailure =
              error instanceof TlaEvaluationError && tracing.callStack?.fingerprint !== undefined;
            if (!isFingerprintFailure && !isStackOverflow(error)) throw error;
            deferred.push(error);
          }
        },
      );
      if (deferred.length > 0) throw deferred[0];
    });
  };
  // TLC's replay writes each successor in the model to the -dump state graph again.
  const replayNext = (index: number) =>
    getReplayFailure((tracing) => {
      const state = states[index];
      const source = stateWriter && getGraphState(state, depths[index]);
      const addReplayed = createReplayedStates();
      replaySuccessors(getSpecNextActions(), state, tracing, (next, action) => {
        const addFingerprint = () => {
          const isUnseen = addReplayed(next, tracing.callStack);
          if (source) {
            stateWriter?.writeSuccessor(
              source,
              getGraphState(next, depths[index] + 1),
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
          // The constraints read the level of the state whose successors they check.
          const livenessSource = current.livenessSource;
          current.livenessSource = source;
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
          current.livenessSource = livenessSource;
          return successors;
        },
      }),
    ),
  );
  // ModelChecker rejects a temporal property whose negation has no solution.
  if (liveness?.branches === 0) throw createTautologyError();
  // TLC 1.7.4 creates its model checker, which TLCGet reads, once it has built the liveness checker.
  runtime.isStarted = true;
  const isCanonicalizedFirst = search.isSymmetric || liveness !== undefined;

  const states: Value[][] = [];
  const fingerprintStates: Value[][] = [];
  const parents: number[] = [];
  const actions: (string | undefined)[] = [];
  const depths: number[] = [];
  // A Map holds at most 2^24 entries, so an open-addressing table keeps each hash and index + 1.
  const seenStates = { slots: new Int32Array(1 << 17), size: 0, shift: 16 };
  const canonicalizeState = createCanonicalizer();

  const toRecord = search.toRecord;
  const getAliasState = (
    alias: string,
    steps: Successor[],
    position: number,
    loopStart: number | undefined,
  ) => {
    // TLC evaluates TLCGet("level") and Trace in an alias at the state's position in the trace.
    runtime.getLevel = () => position + 1;
    runtime.getBehavior = () => steps.slice(0, position + 1).map((step) => step.state);
    return evaluateAlias(
      alias,
      steps[position].state,
      (steps[position + 1] ?? steps[loopStart ?? position]).state,
    );
  };
  const evaluateAlias = (alias: string, state: Value[], next: Value[] | undefined) =>
    search.evaluateAlias(alias, state, next, options.isTool ?? false);
  // TLC finds the action of a step as the first that takes it, evaluated as when the search
  // expanded the previous state, by a held successor's values and otherwise by fingerprint.
  const findStepAction = (index: number, previous: Value[], state: Value[], isHeld: boolean) => {
    const actions = getSpecNextActions();
    const expanding = { ...current };
    Object.assign(current, {
      index,
      isExpanding: true,
      candidate: undefined,
      rebuilt: { state: previous, level: depths[index] },
    });
    const getKey = isHeld ? (values: Value[]) => values : getFingerprintState;
    const key = getKey(state);
    const action = actions.find((item) =>
      getSuccessors(item.expression, previous, environment, item.scope).some((successor) =>
        isSameState(getKey(successor.state), key),
      ),
    );
    Object.assign(current, expanding);
    return action;
  };
  // TLC rebuilds the states it doesn't keep, all but the last `known`, from the initial predicate,
  // finds the action of each later step, and then rebuilds the trace once more, unless it is a
  // liveness counterexample or TLC is 1.7.4.
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
    // TLC 1.7.4 rebuilds a lasso up to its cycle at once, then each cycle state as it prints it.
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
  // TLC rebuilds a successor action by action, up to the first that generates it. A trace keeps
  // what the spec prints as TLC rebuilds it, so finding its states prints nothing.
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
    isSameState(getFingerprintState(state), fingerprintStates[index]);
  const findSuccessorWithFingerprint = (state: Value[], index: number) =>
    findTraceSuccessor(state, (successor) => hasFingerprint(successor.state, index));
  const getPathStates = (path: number[], nextFailure: string) => {
    const initial = captureOutput(() =>
      isReducing || isImpure(environment)
        ? getSpecInitialStates().find((state) => hasFingerprint(state, path[0]))
        : states[path[0]],
    ).result;
    if (!initial) throw new TlaEvaluationError(INITIAL_RECOVERY_FAILURE);
    const steps: Successor[] = [{ state: initial, action: undefined }];
    for (let position = 1; position < path.length; position++) {
      const previous = steps[position - 1].state;
      if (path[position - 1] === path[position]) {
        steps.push({ state: previous, action: "Stuttering" });
        continue;
      }
      // TLC rebuilds each state at its level, which TLCGet reads.
      const rebuilt = current.rebuilt;
      current.rebuilt = { state: previous, level: depths[path[position - 1]] };
      const successor = findSuccessorWithFingerprint(previous, path[position]);
      current.rebuilt = rebuilt;
      if (!successor) throw new TlaEvaluationError(nextFailure);
      steps.push(successor);
    }
    return steps;
  };
  const getTrace = (index: number, lastSuccessor?: Successor) => {
    const path: number[] = [];
    for (let position = index; position !== -1; position = parents[position]) {
      path.unshift(position);
    }
    const steps =
      isReducing && path.length > 1
        ? getPathStates(path, INITIAL_RECOVERY_FAILURE)
        : path.map((position) => ({ state: states[position], action: actions[position] }));
    if (!lastSuccessor) return toTrace(steps, path);
    const action = isReducing
      ? findTraceSuccessor(states[index], (successor) =>
          isSameState(successor.state, lastSuccessor.state),
        )?.action
      : lastSuccessor.action;
    return toTrace([...steps, { state: lastSuccessor.state, action }], path, { known: 2 });
  };
  // TLC prints a lone initial state without the alias, but still rebuilds it, unlike TLC 1.7.4.
  const getStateTrace = (index: number): Behavior =>
    parents[index] === -1
      ? {
          trace: [{ action: undefined, label: undefined, state: toRecord(states[index]) }],
          traceOutput: is174 ? [] : captureOutput(getSpecInitialStates).lines,
        }
      : getTrace(index);
  // TLC rebuilds the trace for the postcondition after a violation, but not after a failure.
  const getFailedTrace = (index: number, successor: Successor): Behavior => ({
    trace: getTrace(index, successor).trace,
  });
  // TLC names the initial state it was checking unless a standard module's Java code failed.
  const getFailureExitCode = (error: TlaEvaluationError, failureOptions: FailureOptions) => {
    // TLC 1.7.4 exits with the result of replaying the initial states, which fails again only here.
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
    // TLC exits with the code of a failed initial replay whatever the error, as for a fingerprint.
    return failureOptions.isInitial || failureOptions.fingerprint
      ? EXIT_STATUS.specEvaluationFailure
      : getReplayExitCode(failureOptions.replayError ?? error);
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
  // TLC reports a partial successor with the trace to it, naming the action if there are several.
  const reportIncompleteSuccessor = (index: number, error: TlaIncompleteSuccessorError) => {
    runtime.generatedStates++;
    const actions = getSpecNextActions();
    const named =
      actions.length === 1 ? actions : actions.filter((item) => item.name === error.action);
    // Inline disjuncts of the next-state relation share its name, so TLC's is the one that failed.
    const action =
      named.length === 1
        ? named[0]
        : captureOutput(() =>
            named.find((item) =>
              hasIncompleteSuccessor(item.expression, states[index], environment, item.scope),
            ),
          ).result;
    const message = getIncompleteSuccessorMessage(
      error.variables,
      error.action,
      actions.length,
      options.version,
    );
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
  const getSlot = (hash: number) => (Math.imul(hash, 0x9e3779b1) >>> seenStates.shift) << 1;
  const findStateIndex = (hash: number, state: Value[]) => {
    const mask = seenStates.slots.length - 1;
    for (let slot = getSlot(hash); ; slot = (slot + 2) & mask) {
      const entry = seenStates.slots[slot + 1];
      if (entry === 0) return -1;
      if (seenStates.slots[slot] === hash && isSameState(fingerprintStates[entry - 1], state)) {
        return entry - 1;
      }
    }
  };
  const insertSeen = (hash: number, entry: number) => {
    const mask = seenStates.slots.length - 1;
    let slot = getSlot(hash);
    while (seenStates.slots[slot + 1] !== 0) slot = (slot + 2) & mask;
    seenStates.slots[slot] = hash;
    seenStates.slots[slot + 1] = entry;
  };
  const markSeen = (hash: number, index: number) => {
    seenStates.size++;
    if (seenStates.size * 4 > seenStates.slots.length) {
      const slots = seenStates.slots;
      seenStates.slots = new Int32Array(slots.length * 2);
      seenStates.shift--;
      for (let slot = 0; slot < slots.length; slot += 2) {
        if (slots[slot + 1] !== 0) insertSeen(slots[slot], slots[slot + 1]);
      }
    }
    insertSeen(hash, index + 1);
  };
  // TLC adds a new successor to its states before it checks it, which the check stores after.
  const unstoredState = { fingerprint: undefined as Value[] | undefined };
  const countDistinctState = (depth: number) => {
    runtime.distinctStates = states.length + 1;
    statistics.depth = Math.max(statistics.depth, depth);
    runtime.diameter = Math.max(runtime.diameter, depth);
  };
  const addState = (
    state: Value[],
    fingerprintState: Value[],
    parent: number,
    action: string | undefined,
  ) => {
    const depth = parent === -1 ? 1 : depths[parent] + 1;
    states.push(state);
    fingerprintStates.push(fingerprintState);
    parents.push(parent);
    actions.push(action);
    depths.push(depth);
  };

  const current = {
    index: -1,
    isExpanding: false,
    candidate: undefined as Value[] | undefined,
    candidateLevel: 0,
    livenessSource: -1,
    rebuilt: undefined as { state: Value[]; level: number } | undefined,
  };
  const getPath = (index: number): Value[][] =>
    index === -1 ? [] : [...getPath(parents[index]), states[index]];
  runtime.isSeen = (state) => {
    const fingerprintState = getFingerprintState(state);
    return findStateIndex(getStateHash(fingerprintState), fingerprintState) !== -1;
  };
  runtime.getBehavior = (state) => {
    const index = state === current.candidate ? -1 : states.indexOf(state);
    return index === -1 ? [...getPath(current.index), state] : getPath(index);
  };
  runtime.getCurrentState = () => (current.index === -1 ? undefined : states[current.index]);
  runtime.setLivenessSource = (index) => {
    current.livenessSource = index ?? -1;
  };
  runtime.getLevel = (state) => {
    const source = current.livenessSource;
    // TLC 1.7.4 reads the level of the state its worker explores, whichever state it evaluates.
    if (is174) {
      const explored = source !== -1 ? source : current.isExpanding ? current.index : -1;
      return explored === -1 ? 0 : depths[explored];
    }
    const rebuilt = current.rebuilt;
    if (rebuilt) return state === rebuilt.state ? rebuilt.level : rebuilt.level + 1;
    if (source !== -1) return state === states[source] ? depths[source] : depths[source] + 1;
    if (state === current.candidate) return current.candidateLevel;
    if (current.index === -1) return 0;
    if (state === states[current.index]) return depths[current.index];
    return current.isExpanding ? depths[current.index] + 1 : 0;
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
      liveness?.addInitialState(states.length, state);
      stateWriter?.writeInitialState(getGraphState(state, 1));
    }
    if (options.isContinued) {
      search.getViolatedInvariants(state).forEach((invariant) =>
        reportContinuedViolation("invariant-violation", {
          name: invariant.name,
          ...toTrace([{ action: undefined, state }], []),
        }),
      );
    }
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
    markSeen(hash, states.length);
    addState(state, fingerprintState, -1, undefined);
    return undefined;
  };
  const visitSuccessor = (
    index: number,
    successor: Successor,
    liveSuccessors: LiveSuccessor[],
    source: GraphState | undefined,
    action: SpecAction | undefined,
  ) => {
    const state = states[index];
    runtime.generatedStates++;
    current.candidate = successor.state;
    current.candidateLevel = depths[index] + 1;
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
        getGraphState(successor.state, depths[index] + 1),
        existing !== -1,
        action && { name: action.name, signature: getActionSignature(action) },
      );
    }
    if (existing !== -1 && liveness) {
      const stored = states[existing];
      const isStored = stored.every((value, position) => value === successor.state[position]);
      liveSuccessors.push({ index: existing, state: isStored ? stored : successor.state });
    }
    const isNew = isInModel && existing === -1;
    // TLC adds a new state to the behavior graph's successors before it checks the invariants.
    if (isNew && liveness) liveSuccessors.push({ index: states.length, state: successor.state });
    unstoredState.fingerprint = isNew ? fingerprintState : undefined;
    if (isNew) {
      countDistinctState(depths[index] + 1);
      expansion.newStates++;
    }
    if (existing === -1) {
      try {
        const violated = search.findViolatedInvariant(successor.state, state);
        const violation = violated && { name: violated.name, ...getTrace(index, successor) };
        if (violation && !options.isContinued) {
          return withOutDegrees(reportViolation("invariant-violation", violation));
        }
        if (violation) reportContinuedViolation("invariant-violation", violation);
      } catch (error) {
        if (isStackOverflow(error)) throw error;
        // TLC replays the expansion and skips the invariants of a seen state, the failed one
        // included unless the constraints exclude it. A failed replay leaves out the outdegree.
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
    markSeen(hash, states.length);
    addState(successor.state, fingerprintState, index, successor.action);
    runtime.queueSize++;
    return undefined;
  };

  const outcome: { result: CheckResult | undefined } = { result: undefined };
  if (liveness) {
    options.onProgress?.({ kind: "liveness-prepared", branches: liveness.branches });
  }
  // TLC checks the assumptions once it has built the liveness checker.
  const assumptionViolation = findViolatedAssumption();
  if (assumptionViolation) return createResult("assumption-violation", assumptionViolation);
  options.onProgress?.({ kind: "initial-states-started" });
  if (spec.init !== undefined) {
    // TLC keeps an initial state's StackOverflowError, counts the states after it, then reports it.
    const overflow: { state: Value[] | undefined } = { state: undefined };
    const reportInitialFailure = (error: unknown, state: Value[]) => {
      const replay = captureOutput(replayInit);
      return createFailureResult(
        error,
        { trace: [], traceOutput: replay.lines },
        { initialState: state, ...replay.result, isInitial: true },
      );
    };
    try {
      forEachInitialState(
        spec.init,
        environment,
        (state) => {
          reportInitialStatesProgress(runtime.initialStates, options.onProgress);
          if (overflow.state) {
            runtime.generatedStates++;
            runtime.initialStates++;
            return false;
          }
          try {
            outcome.result = visitInitialState(state);
          } catch (error) {
            if (isStackOverflow(error)) overflow.state = state;
            else outcome.result = reportInitialFailure(error, state);
          }
          return outcome.result !== undefined;
        },
        spec.scope,
      );
      if (overflow.state) {
        outcome.result = reportInitialFailure(createStackOverflowError(), overflow.state);
      }
    } catch (error) {
      // TLC prints null for each undefined variable and stops before the statistics.
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
    if (states.length > 0) {
      throw new TlaEvaluationError(
        "No next state actions defined to generate successor states from.",
      );
    }
    return createSuccess();
  }
  // TLC labels and colors a -dump edge by its action, so a graph that names its edges generates
  // successors action by action.
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
  // TLC's worker adds a state to the behavior graph even after its next states fail, and prints
  // the call stack of an error in that, unless it is a FingerprintException. TLC 1.7.4 prints none.
  const getLiveCallStack = (index: number, liveSuccessors: LiveSuccessor[]) => {
    if (!liveness || is174) return undefined;
    const replay = getReplayFailure((tracing) =>
      liveness.addState(index, states[index], liveSuccessors, tracing),
    );
    return replay?.callStack.length && !replay.fingerprint ? replay.callStack : undefined;
  };
  // On an error in adding the state after the trace, TLC adds it again to print the call stack
  // instead of replaying the next-state relation, which TLC 1.7.4 doesn't.
  const addFailedLiveState = (index: number, liveSuccessors: LiveSuccessor[]) => {
    try {
      liveness?.addState(index, states[index], liveSuccessors);
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
  // TLC reports a stack overflow in the next states without a replay, up to the state it expands.
  const reportNextStateOverflow = (index: number) =>
    createFailureResult(createStackOverflowError(), getStateTrace(index), { isNextState: true });
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
    const state = states[index];
    const source = stateWriter && getGraphState(state, depths[index]);
    const successorCount = forEachActionSuccessor(state, (successor, action) => {
      try {
        outcome.result = visitSuccessor(index, successor, liveSuccessors, source, action);
      } catch (error) {
        if (isStackOverflow(error)) {
          outcome.result = reportNextStateOverflow(index);
          return true;
        }
        // TLC 1.7.4 reports the wrapped error without the trace, except for a failed property, and
        // stops its worker before it adds the state to the behavior graph.
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
        // TLC fails again to fingerprint the successor in the trace, as an unexpected exception.
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
      // TLC's worker still adds the deadlocked state to the behavior graph, reports a temporal
      // property that violates, and then counts the state as expanded.
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
      // TLC 1.7.4 reports this as an unexpected exception, without the trace or a call stack.
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
      // TLC adds the state again for the call stack, prints it first, and blames the next states.
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
        : captureOutput(() => findStepAction(cycleEnd, lastState, states[cycleStart], false));
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
  for (let index = 0; index < states.length && !runtime.isStopped; index++) {
    current.index = index;
    current.candidate = undefined;
    runtime.queueSize = states.length - index - 1;
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
    // TLC checks liveness on the graph so far, then reports how far the search got.
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
  const missingPostcondition = specification.moduleOperators.find(
    (operator) => operator.kind === "postcondition" && operator.key === undefined,
  );
  if (missingPostcondition) {
    return createFailureResult(createMissingOperatorError(missingPostcondition), { trace: [] });
  }
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
  return createSuccess();
};
