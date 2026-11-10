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
  formatRange,
} from "./errors";
import {
  createTracingEnvironment,
  evaluate,
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
  /** TLC's -lncheck: "final" checks liveness only on the complete state graph. */
  livenessCheck?: "default" | "final";
  /** TLC's -dump: writes the reachable states, or with `dot` the state graph, through writeFile. */
  dump?: StateDump;
  /** TLC's -tool, which changes the messages of TLC's errors. */
  isTool?: boolean;
  /** TLC's -continue: the search reports each violation through onProgress and goes on. */
  isContinued?: boolean;
  /** Whether TLC records a binary trace for its trace exploration spec, for which it loads Integers. */
  isTraceRecorded?: boolean;
  /** Whether the caller printed SANY's report, its warnings included, before the check. */
  isSanyReported?: boolean;
  /** False for TLC's -nowarning, which changes how TLC computes the successors of some actions. */
  isWarningEnabled?: boolean;
  /** The TLC whose output tla-ts reproduces. */
  version?: TlcVersion;
  /** Reports the points of the search at which TLC prints a message. */
  onProgress?: (progress: CheckProgress) => void;
}

export interface InitialStatesProgress {
  kind: "initial-states-progress";
  count: number;
}

export interface InitialStateViolation {
  kind: "initial-state-violation";
  status: "invariant-violation" | "liveness-violation";
  name: string;
  state: Record<string, Value>;
}

export type OutputLine = string | InitialStatesProgress | InitialStateViolation;

/** The points of the search at which TLC prints a message. */
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
      /** Whether TLC checks the complete state graph. */
      isComplete: boolean;
      /** How many states of the graph each branch has. */
      states: number;
      statistics: SearchStatistics;
    }
  | { kind: "liveness-finished" }
  | { kind: "sequential-fallback"; string: string }
  | { kind: "warning"; code: number; text: string }
  | { kind: "violation"; status: CheckStatus; violation: Violation }
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
  /** TLC's name, parameters and location for the action that took this step. */
  label: string | undefined;
  state: Record<string, Value>;
  /** What the spec prints before TLC prints this step, as TLC rebuilds the trace. */
  output?: OutputLine[];
}

export interface Violation {
  name: string;
  /** Every temporal property that a liveness counterexample violates, in the configuration's order. */
  properties?: string[];
  trace: TraceStep[];
  /** What the spec prints after TLC prints the states of the trace. */
  traceOutput?: OutputLine[];
  loopStart: number | undefined;
  loopLabel?: string;
  message?: string;
  counts?: string;
  unwitnessed?: Postcondition;
  /** A POSTCONDITION that is false or fails after the counterexample. */
  postcondition?: Postcondition;
  /** What TLC warns about after a counterexample, with its message code. */
  warning?: { code: number; text: string };
}

export interface Postcondition {
  name: string;
  code: number;
  message: string;
  counts?: string;
}

/** An evaluation that failed during the search, with the behavior up to the state TLC was working on. */
export interface EvaluationFailure {
  /** TLC's code for the message. */
  code: number;
  message: string;
  /** The message as TLC words it with -tool. */
  toolMessage: string;
  trace: TraceStep[];
  traceOutput?: OutputLine[];
  initialState: Record<string, Value> | undefined;
  exitCode: number;
  /** The expressions TLC was evaluating when the failure occurred, outermost first. */
  callStack: Expression[] | undefined;
  /** Whether TLC prints the call stack before the error, as it does for a failed liveness check. */
  isCallStackFirst?: boolean;
  /** The FingerprintException the replay raises, which TLC reports in place of the call stack. */
  fingerprint?: FingerprintFailure;
  /** How TLC reports failing again as it prints the trace. */
  traceFailure?: FailureMessage;
  /** A POSTCONDITION that is false or fails after the trace. */
  postcondition?: Postcondition;
  /** Whether TLC stops before it prints the statistics, as it does for an illegal initial state. */
  isWithoutStatistics?: boolean;
}

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
  /** Set once TLC computed every initial state without a violation or an error. */
  initialStates: InitialStates | undefined;
  /** How many expanded states found each number of new states, when TLC prints the outdegree. */
  outDegrees: number[] | undefined;
  /** The smallest distance between the fingerprints of two distinct states. */
  fingerprintDistance: bigint | undefined;
  /** A temporal property TLC reports as violated after a deadlock. */
  additionalViolation?: Violation;
  /** Where TLC's worker fails to add the state to the behavior graph after it reports a violation. */
  liveCallStack?: Expression[];
  /** The outdegrees when TLC's workers stop on a violation without an error code. */
  violationOutDegrees?: number[];
}

interface Behavior {
  trace: TraceStep[];
  traceOutput?: OutputLine[];
}

interface TraceStepSource {
  state: Record<string, Value>;
  action: SpecAction | undefined;
}

interface ReportedViolation extends Omit<Violation, "loopStart"> {
  loopStart?: number;
}

interface SearchPosition {
  index: number;
  isExpanding: boolean;
  candidate: Value[] | undefined;
  candidateLevel: number;
  livenessSource: number;
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
  isLiveCallStack?: boolean;
}

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

const STOP_REPLAY = new Error("The replay stopped");

const CONFIG_ERROR_CODES = new Set([
  ...Array.from({ length: 24 }, (_, index) => 2222 + index),
  2272,
  2273,
  2274,
  2280,
  2281,
]);

const getInitialExitCode = (error: TlaEvaluationError) => {
  const coded = getCodedMessage(error.message);
  return coded && !coded.isEvalException && CONFIG_ERROR_CODES.has(coded.code)
    ? EXIT_STATUS.configParseError
    : getErrorExitCode(error);
};

const getReplayExitCode = (error: TlaEvaluationError): number => {
  const inner = error.cause;
  if (inner instanceof TlaEvaluationError) return getReplayExitCode(inner);
  return error instanceof TlaModuleError ? error.exitCode : EXIT_STATUS.specEvaluationFailure;
};

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
  let capturedLines: OutputLine[] | undefined;
  const print = (text: string) => {
    if (capturedLines) capturedLines.push(text);
    else onPrint(text);
  };
  const captureOutput = <Result>(rebuild: () => Result) => {
    const outer = capturedLines;
    const lines: OutputLine[] = [];
    capturedLines = lines;
    try {
      return { result: rebuild(), lines };
    } finally {
      capturedLines = outer;
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
  let searchDepth = 0;
  let initialStates: InitialStates | undefined;
  const createResult = (
    status: CheckStatus,
    violation?: ReportedViolation,
    failure?: EvaluationFailure,
  ): CheckResult => ({
    status,
    violation: violation && { ...violation, loopStart: violation.loopStart },
    failure,
    generatedStates: runtime.generatedStates,
    distinctStates: runtime.distinctStates,
    queuedStates: runtime.queueSize,
    depth: runtime.generatedStates === 0 ? 0 : Math.max(searchDepth, 1),
    initialStates,
    outDegrees: undefined,
    fingerprintDistance: undefined,
  });
  const outDegrees = Array.from({ length: OUT_DEGREE_BUCKETS }, () => 0);
  let newStateCount = 0;
  const getOutDegreeBucket = () => Math.min(newStateCount, OUT_DEGREE_BUCKETS - 1);
  const getPartialOutDegrees = () =>
    outDegrees.map((count, degree) => (degree === getOutDegreeBucket() ? count + 1 : count));
  const getFailureOutDegrees = () => (is174 ? [...outDegrees] : getPartialOutDegrees());
  const getViolatedProperties = (checker: LivenessChecker, path: Value[][], cycleStart: number) =>
    is174 ? [] : checker.getViolatedProperties(path, cycleStart);
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
    () => order.getDeclarationOrder("variable"),
    options.onProgress,
  );
  const findViolatedAssumption = () =>
    findAssumptionViolation(specification.assumptions, environment);
  if (!search) {
    runtime.isStarted = true;
    const assumptionViolation = findViolatedAssumption();
    if (assumptionViolation) return createResult("assumption-violation", assumptionViolation);
    initialStates = { generated: 0, distinct: 0 };
    options.onProgress?.({ kind: "initial-states-started" });
    options.onProgress?.({ kind: "initial-states-computed", initialStates });
    return createSuccess();
  }
  const hasPostconditions = config.postconditions.length > 0 || config.possible.length > 0;
  const traceSteps = new WeakMap<TraceStep, TraceStepSource>();
  const getStepState = (step: TraceStep) => traceSteps.get(step)?.state ?? step.state;
  const getStepAction = (step: TraceStep) => {
    const action = traceSteps.get(step)?.action;
    return action ? toActionValue(action) : createActionRecord(step.action);
  };
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
    violation: ReportedViolation,
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
  const reportContinuedViolation = (status: CheckStatus, violation: Omit<Violation, "loopStart">) =>
    options.onProgress?.({
      kind: "violation",
      status,
      violation: { ...violation, loopStart: undefined },
    });
  const spec = search.spec;
  const getFingerprintState = search.getFingerprintState;
  let specNextActions: SpecAction[] | undefined;
  const getSpecNextActions = () =>
    (specNextActions ??= getNextActions(config, environment, specification.instanceActions));
  const getReplayFailure = (replay: (tracing: Environment) => void): ReplayFailure | undefined => {
    const tracing = createTracingEnvironment(environment);
    const callStack = tracing.callStack;
    try {
      replay(tracing);
      return undefined;
    } catch (error) {
      if (isStackOverflow(error)) return { callStack: [], fingerprint: undefined };
      if (!(error instanceof TlaEvaluationError) || !callStack) return undefined;
      return { callStack: callStack.expressions, fingerprint: callStack.fingerprint };
    }
  };
  const findFailedSources = (value: Value, sources: CallStack["sources"]): Expression[] => {
    if (typeof value !== "object") return [];
    const source = sources.get(value);
    const failed = getHeldValues(value).find((held) => getFingerprintError(held) !== undefined);
    return [
      ...(source ? [source] : []),
      ...(failed === undefined ? [] : findFailedSources(failed, sources)),
    ];
  };
  const fingerprintReplayed = (state: Value[], callStack: CallStack | undefined) => {
    for (const value of getFingerprintState(state)) {
      const error = getFingerprintError(value);
      if (!error) continue;
      const sources = callStack ? findFailedSources(value, callStack.sources) : [];
      if (callStack && sources.length > 0) {
        callStack.expressions.length = 0;
        callStack.isFrozen = true;
        callStack.fingerprint = { sources, reason: error.message };
      }
      throw error;
    }
    state.forEach(markFingerprinted);
  };
  const createReplayedStates = () => {
    const replayed = unstoredFingerprint ? [unstoredFingerprint] : [];
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
  const replayInit = () => {
    let replayedCount = 0;
    const deferred: TlaEvaluationError[] = [];
    const addReplayed = createReplayedStates();
    return getReplayFailure((tracing) => {
      replayInitialStates(
        getInitActions(config, environment, specification.instanceActions),
        tracing,
        (state) => {
          reportInitialStatesProgress(replayedCount, (progress) => capturedLines?.push(progress));
          replayedCount++;
          runtime.generatedStates = replayedCount;
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
              capturedLines?.push({
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
        getFingerprint: (successor) =>
          (tlcFingerprints[successor.index] ??= Number(
            BigInt.asIntN(32, runtime.getFingerprint(successor.state)),
          )),
        getSuccessors: (source, state) => {
          const successors: LiveSuccessor[] = [];
          if (spec.next === undefined) return successors;
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
  runtime.isStarted = true;
  const isCanonicalizedFirst = search.isSymmetric || liveness !== undefined;

  const states: Value[][] = [];
  const fingerprintStates: Value[][] = [];
  const parents: number[] = [];
  const actions: (string | undefined)[] = [];
  const depths: number[] = [];
  // A Map holds at most 2^24 entries, so an open-addressing table holds the seen states.
  const seenStates = { slots: new Int32Array(1 << 17), size: 0, shift: 16 };
  const canonicalizeState = createCanonicalizer();

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
  const findStepAction = (index: number, previous: Value[], state: Value[], isHeld: boolean) => {
    const actions = getSpecNextActions();
    const expanding = { ...current };
    Object.assign(current, { index, isExpanding: true, candidate: undefined });
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
  const toTrace = (
    steps: Successor[],
    path: number[],
    traceOptions: TraceOptions = {},
  ): Behavior => {
    const alias = config.alias;
    const known = traceOptions.known ?? 1;
    const initialOutput = steps.length > 1 ? captureOutput(getSpecInitialStates).lines : [];
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
      const successor = findSuccessorWithFingerprint(previous, path[position]);
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
  const getStateTrace = (index: number): Behavior =>
    parents[index] === -1
      ? {
          trace: [{ action: undefined, label: undefined, state: toRecord(states[index]) }],
          traceOutput: is174 ? [] : captureOutput(getSpecInitialStates).lines,
        }
      : getTrace(index);
  const getFailedTrace = (index: number, successor: Successor): Behavior => ({
    trace: getTrace(index, successor).trace,
  });
  const getFailureExitCode = (error: TlaEvaluationError, failureOptions: FailureOptions) => {
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
    if (failureOptions.isLiveCallStack) {
      return (
        getExitCode(error) ?? (error instanceof TlaModuleError ? error.exitCode : EXIT_STATUS.error)
      );
    }
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
  let unstoredFingerprint: Value[] | undefined;
  const countDistinctState = (depth: number) => {
    runtime.distinctStates = states.length + 1;
    searchDepth = Math.max(searchDepth, depth);
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

  const current: SearchPosition = {
    index: -1,
    isExpanding: false,
    candidate: undefined,
    candidateLevel: 0,
    livenessSource: -1,
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
    if (is174) {
      const explored = source !== -1 ? source : current.isExpanding ? current.index : -1;
      return explored === -1 ? 0 : depths[explored];
    }
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
    unstoredFingerprint = isInModel ? fingerprintState : undefined;
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
    if (isNew && liveness) liveSuccessors.push({ index: states.length, state: successor.state });
    unstoredFingerprint = isNew ? fingerprintState : undefined;
    if (isNew) {
      countDistinctState(depths[index] + 1);
      newStateCount++;
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

  let outcome: CheckResult | undefined;
  if (liveness) {
    options.onProgress?.({ kind: "liveness-prepared", branches: liveness.branches });
  }
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
            outcome = visitInitialState(state);
          } catch (error) {
            const replay = captureOutput(replayInit);
            outcome = createFailureResult(
              error,
              { trace: [], traceOutput: replay.lines },
              { initialState: state, ...replay.result, isInitial: true },
            );
          }
          return outcome !== undefined;
        },
        spec.scope,
      );
    } catch (error) {
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
      const replay = captureOutput(replayInit);
      return createFailureResult(
        error,
        { trace: [], traceOutput: replay.lines },
        { ...replay.result, isInitial: true },
      );
    }
  }
  if (outcome) return outcome;
  initialStates = { generated: runtime.initialStates, distinct: runtime.distinctStates };
  options.onProgress?.({ kind: "initial-states-computed", initialStates });

  const next = spec.next;
  if (next === undefined) {
    if (states.length > 0) {
      throw new TlaEvaluationError(
        "No next state actions defined to generate successor states from.",
      );
    }
    return createSuccess();
  }
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
    let isStopped = false;
    return getSpecNextActions().reduce((count, action) => {
      if (isStopped) return count;
      return (
        count +
        forEachSuccessor(
          action.expression,
          state,
          environment,
          (successor) => {
            isStopped = onSuccessor(successor, action);
            return isStopped;
          },
          action.scope,
        )
      );
    }, 0);
  };
  const getLiveCallStack = (index: number, liveSuccessors: LiveSuccessor[]) => {
    if (!liveness || is174) return undefined;
    const replay = getReplayFailure((tracing) =>
      liveness.addState(index, states[index], liveSuccessors, tracing),
    );
    return replay?.callStack.length && !replay.fingerprint ? replay.callStack : undefined;
  };
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
  const reportNextStateOverflow = (index: number) =>
    createFailureResult(createStackOverflowError(), getStateTrace(index));
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
        outcome = visitSuccessor(index, successor, liveSuccessors, source, action);
      } catch (error) {
        if (isStackOverflow(error)) {
          outcome = reportNextStateOverflow(index);
          return true;
        }
        const replay = is174
          ? captureOutput(() => replayNext(index))
          : replayFailedNext(index, liveSuccessors);
        if (is174 && error instanceof TlaEvaluationError && !isHeadedError(error)) {
          outcome = createFailureResult(
            new TlaEvaluationError(`${getWrappedException(error)}${error.message}`, error),
            appendTraceOutput({ trace: [] }, replay.lines),
            { isNextState: true, ...replay.result },
          );
          return true;
        }
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
        outcome = createFailureResult(
          error,
          appendTraceOutput(
            traceFailure ? getStateTrace(index) : getFailedTrace(index, successor),
            replay.lines,
          ),
          { isNextState: true, ...replay.result, traceFailure },
        );
      }
      return outcome !== undefined;
    });
    current.isExpanding = false;
    const result = outcome;
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
      outcome = expandState(index, liveSuccessors);
    } catch (error) {
      outcome =
        error instanceof TlaIncompleteSuccessorError
          ? reportIncompleteSuccessor(index, error)
          : reportNextStateFailure(error, index, liveSuccessors);
    }
    if (outcome) return outcome;
    outDegrees[getOutDegreeBucket()]++;
    newStateCount = 0;
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
