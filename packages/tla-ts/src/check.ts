import type { Expression } from "./ast";
import { parseConfig, type ModelConfig } from "./config";
import {
  countCoverageVariables,
  createCoverage,
  createCoverageEnvironment,
  getCoverageReport,
  runUncounted,
  type CoverageReport,
} from "./coverage";
import {
  createStackOverflowError,
  isStackOverflow,
  TlaBoundValueError,
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
  createViewTracingEnvironment,
  describeRange,
  getDefinition,
  getRootKey,
  type Environment,
  type FingerprintFailure,
  type State,
} from "./evaluate";
import { EXIT_STATUS, setExitCode, withLivenessExitCode } from "./exit-codes";
import {
  fingerprintReplayed,
  getFailureExitCode,
  getReplayFailure,
  getTraceFailure,
  type FailureOptions,
} from "./check-failure";
import {
  createTraceBuilder,
  NEXT_RECOVERY_FAILURE,
  type Behavior,
  type SearchPosition,
  type TracedStep,
} from "./check-trace";
import {
  createStateTable,
  findStateIndex,
  getStateHash,
  isSameState,
  markSeenState,
  type StateTable,
} from "./fingerprints";
import { getInstanceFrame } from "./instances";
import type { JavaOverride } from "./java-overrides";
import {
  createLivenessChecker,
  type Lasso,
  type LivenessChecker,
  type LiveSuccessor,
} from "./liveness-checker";
import {
  addActionCoverage,
  createCheckEnvironment,
  createMissingOperatorError,
  createOutputCapture,
  createSearch,
  createTraceSpecWriter,
  getIncompleteSuccessorMessage,
  findAssumptionViolation,
  reportInitialStatesProgress,
  reportStartup,
  STOP_WALK,
  walkCoveredSuccessors,
  withNextStateExitCode,
  type CliSettings,
  type CoveredAction,
  type Search,
} from "./search";
import {
  getActionLabel,
  getActionSignature,
  getSpecDescription,
  getSpecificationValue,
  toActionValue,
  type SpecAction,
  type SpecDescription,
} from "./spec-description";
import {
  createLivenessDump,
  createStateWriter,
  type GraphState,
  type LivenessDump,
  type StateDump,
  type StateWriter,
} from "./state-graph";
import {
  createIncompleteSuccessorError,
  forEachInitialState,
  forEachSuccessor,
  getInitialStates,
  getSuccessors,
  hasIncompleteSuccessor,
  type Successor,
} from "./successors";
import {
  getFailureMessage,
  getWrappedException,
  isEvalException,
  isHeadedError,
  MESSAGE_CODE,
  withUnexpectedException,
  type FailureMessage,
} from "./tlc/messages";
import { createTautologyError } from "./liveness";
import { replayInitialStates, replaySuccessors, walkSuccessors } from "./tlc/replay";
import { getFingerprintDistance, OUT_DEGREE_BUCKETS } from "./tlc/summary";
import { formatTraceSpecState } from "./tlc/trace-spec";
import {
  createActionRecord,
  createCounterExample,
  type CounterExampleLoop,
} from "./tlc/tlcext-operators";
import type { TlcVersion } from "./tlc/version";
import { runTypedSearch, type TypedResult } from "./typed-tier";
import {
  createCanonicalizer,
  createModelValue,
  getFingerprintError,
  isSameValue,
  type Value,
} from "./values";

export interface CheckOptions {
  source: string;
  config: string | ModelConfig;
  loadModule?: (name: string) => string | undefined;
  loadClass?: (name: string) => Uint8Array | undefined;
  onPrint?: (text: string) => void;
  onPause?: () => void;
  readFile?: (path: string) => Uint8Array | undefined;
  writeFile?: (path: string, content: string | Uint8Array) => void;
  makeDirectory?: (path: string) => void;
  seed?: bigint;
  workers?: number;
  /** TLC's -lncheck: "final" checks liveness only on the complete graph, "off" never looks for a cycle. */
  livenessCheck?: "default" | "final" | "off";
  /** TLC's -fp: the index of the polynomial in TLC's FP64.Polys that fingerprints states. */
  fingerprintPolynomial?: number;
  /** False for TLC's -terse, which prints a lazy value, such as SUBSET S, without enumerating it. */
  isLazyValueExpanded?: boolean;
  /** TLC's -view: prints each state as the value of the configuration's VIEW. */
  isViewPrinted?: boolean;
  /** TLC's -maxSetSize: the most elements TLC enumerates into a set, or states into a list of them. */
  maxSetSize?: number;
  /** TLC's -dump: writes the reachable states, or with `dot` the state graph, through writeFile. */
  dump?: StateDump;
  /** TLC's -tool, which changes the messages of TLC's errors. */
  isTool?: boolean;
  /** TLC's -continue: reports each violation through onProgress and goes on. */
  isContinued?: boolean;
  /** Skips fingerprintDistance, which takes fingerprinting every state again after the search. */
  isFingerprintDistanceSkipped?: boolean;
  moduleOperators?: ModuleOperator[];
  /** TLC's trace exploration spec, and the binary trace TLC records for it unless -noTEBin. */
  traceSpec?: TraceSpecOptions;
  /** Whether the caller printed SANY's report, its warnings included, before the check. */
  isSanyReported?: boolean;
  /** False for TLC's -nowarning, which changes how TLC computes some successors. */
  isWarningEnabled?: boolean;
  /** TLC's -coverage, in minutes. */
  coverage?: number;
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

export interface InitialStateViolation {
  kind: "initial-state-violation";
  status: "invariant-violation" | "liveness-violation";
  name: string;
  state: Record<string, Value>;
}

export interface EvaluationWarning {
  kind: "warning";
  code: number;
  text: string;
}

export type OutputLine = string | InitialStatesProgress | InitialStateViolation | EvaluationWarning;

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
      /** How many states the graphs of all branches have together. */
      states: number;
      statistics: SearchStatistics;
    }
  | { kind: "liveness-finished" }
  | { kind: "sequential-fallback"; string: string }
  | EvaluationWarning
  | { kind: "violation"; status: CheckStatus; violation: Violation }
  | ({ kind: "java-override" } & JavaOverride);

export interface SearchStatistics extends Pick<
  CheckResult,
  "generatedStates" | "distinctStates" | "queuedStates" | "depth" | "coverage"
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
  /** What the spec prints before this step as TLC rebuilds the trace, and before it for the first. */
  output?: OutputLine[];
  /** What the ALIAS and VIEW print as TLC evaluates them right before it prints this step. */
  aliasOutput?: OutputLine[];
}

export interface Violation {
  name: string;
  /** Every temporal property that a liveness counterexample violates, in the configuration's order. */
  properties?: string[];
  trace: TraceStep[];
  /** What the spec prints after the trace, as TLC finds the lasso's step back or rebuilds the trace. */
  traceOutput?: OutputLine[];
  /** What the postconditions print, which TLC checks after the lasso's step back. */
  postconditionOutput?: OutputLine[];
  loopStart: number | undefined;
  loopLabel?: string;
  message?: string;
  counts?: string;
  unwitnessed?: Postcondition;
  /** A POSTCONDITION that is false or fails, which TLC checks as it prints the counterexample. */
  postcondition?: Postcondition;
  /** What TLC warns about after a counterexample, with its code. */
  warning?: { code: number; text: string };
  /** How TLC fails to rebuild the violating step after it prints the behavior to its predecessor. */
  traceFailure?: TraceFailure;
}

export interface Postcondition {
  name: string;
  code: number;
  message: string;
  counts?: string;
}

export interface TraceFailure extends FailureMessage {
  /** What the spec prints as TLC rebuilds the step it then fails to print. */
  output: OutputLine[];
}

/** An evaluation that failed during the search, with the behavior up to the state TLC was working on. */
export interface EvaluationFailure {
  code: number;
  message: string;
  toolMessage: string;
  trace: TraceStep[];
  traceOutput?: OutputLine[];
  initialState: Record<string, Value> | undefined;
  exitCode: number;
  /** The expressions TLC was evaluating, outermost first, when its replay finds them. */
  callStack: Expression[] | undefined;
  /** Whether TLC prints the call stack before the error, as it does for a failed liveness check. */
  isCallStackFirst?: boolean;
  /** The FingerprintException the replay raises, which TLC reports in place of the call stack. */
  fingerprint?: FingerprintFailure;
  /** How TLC reports failing again as it prints the trace, since it can't fingerprint the state. */
  traceFailure?: TraceFailure;
  /** A POSTCONDITION that is false or fails after the trace, which TLC checks as it prints one. */
  postcondition?: Postcondition;
  /** Whether TLC stops before it prints the statistics, as it does for an illegal initial state. */
  isWithoutStatistics?: boolean;
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
  /** Once TLC computed all the initial states without a violation or an error. */
  initialStates: InitialStates | undefined;
  /** How many expanded states found each number of new states, when TLC prints the outdegree. */
  outDegrees: number[] | undefined;
  /** The smallest distance between two fingerprints, when TLC estimates a collision from them. */
  fingerprintDistance: bigint | undefined;
  /** A temporal property TLC finds violated as it adds the state it stopped at to the behavior graph, reported after. */
  additionalViolation?: Violation;
  /** Where TLC's worker fails to add the state to the behavior graph after it reports a violation. */
  liveCallStack?: Expression[];
  /** The outdegrees when TLC's workers stop on a violation that TLC 1.7.4 reports as a success. */
  violationOutDegrees?: number[];
  traceSpec?: string;
  coverage?: CoverageReport;
}

interface ReportedViolation extends Omit<Violation, "loopStart"> {
  loopStart?: number;
}

interface CounterExampleOptions {
  isConsole: boolean;
}

const appendTraceOutput = <Traced extends Behavior>(behavior: Traced, lines: OutputLine[]) => ({
  ...behavior,
  traceOutput: [...(behavior.traceOutput ?? []), ...lines],
});

const toUnexpectedError = (error: TlaEvaluationError) =>
  new TlaEvaluationError(
    `${isEvalException(error) ? UNEXPECTED_EVAL_EXCEPTION : UNEXPECTED_EXCEPTION}${error.message}`,
  );

const STOP_REPLAY = new Error("The replay stopped");

export type ParallelCheck = (
  search: Search,
  description: SpecDescription,
) => Promise<CheckResult> | undefined;

export const checkSequentially = (
  options: CheckOptions,
  checkInParallel?: ParallelCheck,
  isTypedTierSkipped = false,
): CheckResult | Promise<CheckResult> => {
  const stateWriter =
    options.dump && createStateWriter(options.dump, options.writeFile, options.version);
  const livenessDump = options.dump?.dot
    ? createLivenessDump(options.dump, options.writeFile, options.version)
    : undefined;
  try {
    return searchStates(options, stateWriter, livenessDump, checkInParallel, isTypedTierSkipped);
  } catch (error) {
    throw isStackOverflow(error) ? createStackOverflowError() : error;
  } finally {
    // Deviation from TLC: it returns without closing the writers after a failed assumption or initial state, which loses what they buffered.
    livenessDump?.close();
    stateWriter?.close();
  }
};

export const PERIODIC_START = 3000;
export const PROGRESS_INTERVAL = 60_000;
const LIVENESS_GROWTH = 0.1;
const LIVENESS_RATIO = 0.2;

const searchStates = (
  options: CheckOptions & CliSettings,
  stateWriter: StateWriter | undefined,
  livenessDump: LivenessDump | undefined,
  checkInParallel: ParallelCheck | undefined,
  isTypedTierSkipped: boolean,
): CheckResult | Promise<CheckResult> => {
  const config =
    typeof options.config === "string"
      ? parseConfig(options.config, options.version)
      : options.config;
  const output = createOutputCapture(options.onPrint ?? console.log);
  const captureOutput = output.captureOutput;
  const created = createCheckEnvironment(config, options, output.print);
  const specification = created.specification;
  specification.environment.runtime.pause = options.onPause ?? (() => {});
  reportStartup(specification, config, options.onProgress);
  output.captureMessages(specification.environment.runtime, options.errorCodes);
  const coverage =
    options.coverage === undefined
      ? undefined
      : createCoverage(specification.environment.variables.length);
  const environment = coverage
    ? createCoverageEnvironment(specification.environment, coverage)
    : specification.environment;
  const runtime = environment.runtime;
  const is174 = runtime.version === "1.7.4";
  let description: SpecDescription | undefined;
  const getDescription = () =>
    (description ??= getSpecDescription(config, environment, specification.instanceActions));
  runtime.getSpecification = () => getSpecificationValue(getDescription(), config, environment);
  let searchDepth = 0;
  let computedInitialStates: InitialStates | undefined;
  const getTraceSpec = createTraceSpecWriter(
    options.traceSpec,
    specification.rootName,
    config,
    environment,
  );
  const getCoverage = () =>
    coverage?.relations.some((relation) => relation.kind === "next")
      ? getCoverageReport(coverage, environment, search.getTlcOrder())
      : undefined;
  // Deviation from TLC: under -continue, its recorder appends every trace it prints to one trace spec, which is no behavior of the spec, so tla-ts writes the last trace's.
  let continuedTrace: TraceStep[] = [];
  const createResult = (
    status: CheckStatus,
    violation?: ReportedViolation,
    failure?: EvaluationFailure,
  ): CheckResult => {
    const trace = violation?.trace ?? failure?.trace ?? [];
    const traceSpec = getTraceSpec?.(
      (trace.length > 0 ? trace : continuedTrace).map((step) =>
        formatTraceSpecState(getStepState(step)),
      ),
      status === "property-violation" ? undefined : violation?.loopStart,
    );
    return {
      status,
      violation: violation && { ...violation, loopStart: violation.loopStart },
      failure,
      generatedStates: runtime.generatedStates,
      distinctStates: runtime.distinctStates,
      queuedStates: runtime.queueSize,
      depth: runtime.generatedStates === 0 ? 0 : Math.max(searchDepth, 1),
      initialStates: computedInitialStates,
      outDegrees: undefined,
      fingerprintDistance: undefined,
      coverage: getCoverage(),
      ...(traceSpec !== undefined && { traceSpec }),
    };
  };
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
    fingerprintDistance: options.isFingerprintDistanceSkipped
      ? undefined
      : getFingerprintDistance(runtime.distinctStates, runtime.generatedStates, (visit) =>
          visit(
            search.getStoredFingerprints(
              exploredStates.length === 0 ? states : states.concat(exploredStates),
              exploredStates.length === 0
                ? fingerprintStates
                : fingerprintStates.concat(exploredFingerprintStates),
            ),
          ),
        ),
  });

  const search = createSearch(
    config,
    environment,
    () => created.order.getDeclarationOrder("variable"),
    options.onProgress,
    specification.moduleOperators,
    specification.runtimeInvariants,
  );
  const findViolatedAssumption = () =>
    findAssumptionViolation(specification.assumptions, environment);
  const hasUserPostconditions =
    config.postconditions.length > 0 ||
    config.possible.length > 0 ||
    (options.moduleOperators ?? []).some((operator) => operator.kind === "postcondition");
  const hasPostconditions = hasUserPostconditions || options.traceSpec?.traceFile !== undefined;
  const tracedSteps = new WeakMap<TraceStep, TracedStep>();
  const getStepState = (step: TraceStep) => tracedSteps.get(step)?.state ?? step.state;
  // TLC's Worker#doPostCondition and LiveCheck bind CounterExample to the alias of each state, while its initial states and lassos keep the states.
  const getStepAlias = (step: TraceStep) => tracedSteps.get(step)?.alias ?? step.state;
  const getStepAction = (step: TraceStep) => {
    const action = tracedSteps.get(step)?.action;
    return action ? toActionValue(action) : createActionRecord(step.action);
  };
  const checkTracePostconditions = (
    trace: TraceStep[],
    loop: CounterExampleLoop | undefined,
    getState: (step: TraceStep) => Record<string, Value>,
    isConsole = true,
  ) => {
    if (hasPostconditions) {
      runtime.counterExample = createCounterExample(
        trace.map(getState),
        trace.slice(1).map(getStepAction),
        loop,
        isConsole,
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
    getState = getStepAlias,
    getLoopAction?: () => Value,
  ) => {
    const start = violation.loopStart;
    const checked = checkTracePostconditions(
      violation.trace,
      start === undefined || !getLoopAction ? undefined : { start, action: getLoopAction() },
      getState,
    );
    return createResult(status, {
      ...violation,
      ...(checked.lines.length > 0 && { postconditionOutput: checked.lines }),
      ...(checked.unwitnessed && { unwitnessed: checked.unwitnessed }),
      ...(checked.postcondition && { postcondition: checked.postcondition }),
    });
  };
  // Deviation from TLC: -continue ends with the status of the first violation, not a success.
  let continuedStatus: CheckStatus | undefined;
  const reportContinuedViolation = (
    status: CheckStatus,
    violation: Omit<Violation, "loopStart">,
  ) => {
    continuedStatus ??= status;
    continuedTrace = violation.trace;
    options.onProgress?.({
      kind: "violation",
      status,
      violation: { ...violation, loopStart: undefined },
    });
  };
  const spec = search.spec;
  const getFingerprintState = search.getFingerprintState;
  // Tool's constructor splits the next-state relation into actions before TLC checks anything.
  const nextActions = getDescription().actions;
  const covered = coverage && addActionCoverage(coverage, environment, getDescription());
  const coverageInits = covered?.inits ?? [];
  const coverageActions = covered?.actions ?? [];
  const hasCoveredIncompleteSuccessor = (action: CoveredAction, state: Value[]) => {
    let complete = 0;
    let incomplete = 0;
    walkSuccessors(
      action,
      action.node,
      state,
      environment,
      () => complete++,
      () => {
        incomplete++;
        return true;
      },
    );
    if (coverage) coverage.primary[action.node] += complete + incomplete;
    return incomplete > 0;
  };
  // TLC generates the successors of each action again, which its coverage counts.
  const findSuccessorAction = (state: Value[], isMatch: (successor: Successor) => boolean) =>
    coverage
      ? coverageActions.find((item) => {
          const successors: Successor[] = [];
          walkCoveredSuccessors(coverage, item, state, environment, (successor) =>
            successors.push({ state: successor, action: item.name }),
          );
          return successors.some(isMatch);
        })
      : nextActions.find((item) =>
          getSuccessors(item.expression, state, environment, item.scope).some(isMatch),
        );
  runtime.getSuccessorAction = (state, next) =>
    findSuccessorAction(state, (successor) =>
      successor.state.every((value, index) => isSameValue(value, next[index])),
    );
  const rejectIncompleteInitialState = (partial: (Value | undefined)[]) => {
    throw setExitCode(new TlaIllegalStateError([...partial]), EXIT_STATUS.error);
  };
  const createReplayedStates = (tracing: Environment) => {
    const replayed = unstoredFingerprint ? [unstoredFingerprint] : [];
    const callStack = tracing.callStack;
    const viewTracing = createViewTracingEnvironment(tracing);
    const getReplayedFingerprintState = (state: Value[]) => {
      try {
        return getFingerprintState(state, viewTracing);
      } catch (error) {
        const fingerprint = viewTracing.callStack?.fingerprint;
        if (callStack && fingerprint) {
          callStack.expressions.length = 0;
          callStack.isFrozen = true;
          callStack.fingerprint = fingerprint;
        }
        const isViewFailed = viewTracing.callStack?.isFrozen === true;
        if (!isViewFailed) fingerprintReplayed(state, callStack, coverage);
        throw error;
      }
    };
    return (state: Value[]) => {
      fingerprintReplayed(getReplayedFingerprintState(state), callStack, coverage);
      const fingerprintState = getFingerprintState(state);
      const hash = getStateHash(fingerprintState);
      const isSeen =
        findStateIndex(seenStates, hash, fingerprintState) !== -1 ||
        isExplored(hash, fingerprintState) ||
        replayed.some((seen) => isSameState(seen, fingerprintState));
      if (isSeen) return false;
      replayed.push(fingerprintState);
      runtime.distinctStates++;
      return true;
    };
  };
  const replayInit = () => {
    let replayedCount = 0;
    const deferred: unknown[] = [];
    return getReplayFailure(environment, (tracing) => {
      const addReplayed = createReplayedStates(tracing);
      replayInitialStates(coverage ? coverageInits : getDescription().inits, tracing, (state) => {
        reportInitialStatesProgress(replayedCount, (progress) =>
          output.getCapturedLines()?.push(progress),
        );
        replayedCount++;
        runtime.generatedStates = replayedCount;
        if (deferred.length > 0) return;
        try {
          const addFingerprint = () => {
            if (!addReplayed(state)) return;
            runtime.queueSize++;
            liveness?.addInitialState(states.length, state, tracing);
          };
          search.checkReplayedInitialState(state, tracing, addFingerprint, (violation) => {
            const traced = traces.toTrace([{ action: undefined, state }], []).trace[0];
            output.getCapturedLines()?.push(...(traced.aliasOutput ?? []), {
              kind: "initial-state-violation",
              ...violation,
              state: traced.state,
            });
            if (!options.isContinued || violation.status !== "invariant-violation") {
              throw STOP_REPLAY;
            }
          });
        } catch (error) {
          const isFingerprintFailure =
            error instanceof TlaEvaluationError && tracing.callStack?.fingerprint !== undefined;
          if (!isFingerprintFailure && !isStackOverflow(error)) throw error;
          deferred.push(error);
        }
      });
      if (deferred.length > 0) throw deferred[0];
    });
  };
  // Deviation from TLC: ModelChecker's main-thread replay throws a NullPointerException in TLCExt#getTrace, so TLC blames a constraint that reads Trace.
  const replayNext = (index: number) =>
    getReplayFailure(environment, (tracing) => {
      const state = states[index];
      const source = stateWriter && getGraphState(state, depths[index]);
      const addReplayed = createReplayedStates(tracing);
      replaySuccessors(coverage ? coverageActions : nextActions, state, tracing, (next, action) => {
        const addFingerprint = () => {
          const isUnseen = addReplayed(next);
          if (source) {
            stateWriter?.writeSuccessor(
              source,
              getGraphState(next, depths[index] + 1),
              !isUnseen,
              isNamingEdges ? getGraphAction(action) : undefined,
            );
          }
          return isUnseen;
        };
        const distinctStates = runtime.distinctStates;
        if (!search.checkReplayedSuccessor(state, next, tracing, addFingerprint)) {
          throw STOP_REPLAY;
        }
        runtime.queueSize += runtime.distinctStates - distinctStates;
      });
    });
  const tlcFingerprints: number[] = [];
  if (search.properties.liveness.length > 0) {
    options.onProgress?.({
      kind: "liveness-initializing",
      isSymmetric: config.symmetry !== undefined,
      isConstrained: search.isConstrained,
    });
  }
  let liveState: Value[] = [];
  const addIncomplete = (successor: State, action: string | undefined) => {
    if (
      search.satisfiesConstraints(successor, liveState) &&
      search.satisfiesActionConstraints(liveState, successor)
    ) {
      throw createIncompleteSuccessorError(successor, action, environment);
    }
  };
  const liveness = withLivenessExitCode(() =>
    withUnexpectedException(() =>
      createLivenessChecker(
        search.properties.liveness,
        spec.temporals,
        environment,
        {
          getFingerprint: (successor) =>
            (tlcFingerprints[successor.index] ??= Number(
              BigInt.asIntN(32, runtime.getFingerprint(successor.state)),
            )),
          forEachActionSuccessors: (source, state, onSuccessors, replay) => {
            liveState = state;
            let successors: LiveSuccessor[] = [];
            const addSuccessor = (successor: Value[]) => {
              canonicalizeState(successor);
              const isInModel =
                search.satisfiesConstraints(successor, state) &&
                search.satisfiesActionConstraints(state, successor);
              if (!isInModel) return;
              const fingerprintState = getFingerprintState(successor);
              const hash = getStateHash(fingerprintState);
              const index = findStateIndex(seenStates, hash, fingerprintState);
              successors.push({
                index: index === -1 ? getPendingIndex(hash, fingerprintState) : index,
                state: successor,
              });
            };
            const visitSuccessor = (successor: Successor) => {
              addSuccessor(successor.state);
              return false;
            };
            const actionCount = coverage ? coverageActions.length : nextActions.length;
            for (let position = 0; position < actionCount; position++) {
              successors = [];
              const livenessSource = current.livenessSource;
              current.livenessSource = source;
              try {
                if (coverage) {
                  // TLC's coverage counts the successors of each action the graph generates again.
                  walkCoveredSuccessors(
                    coverage,
                    coverageActions[position],
                    state,
                    replay ?? environment,
                    addSuccessor,
                    addIncomplete,
                  );
                } else if (replay) {
                  const action = nextActions[position];
                  walkSuccessors(action, -1, state, replay, addSuccessor, (partial) => {
                    addIncomplete(partial, action.name);
                    return true;
                  });
                } else {
                  const action = nextActions[position];
                  forEachSuccessor(
                    action.expression,
                    state,
                    environment,
                    visitSuccessor,
                    action.scope,
                    undefined,
                    undefined,
                    addIncomplete,
                  );
                }
              } finally {
                current.livenessSource = livenessSource;
              }
              onSuccessors(successors);
            }
          },
          getGraphState: (index, state) => getGraphState(state, depths[index] ?? 1),
        },
        livenessDump?.createWriter,
      ),
    ),
  );
  if (liveness?.branches === 0) throw createTautologyError();
  runtime.isStarted = true;
  const isCanonicalizedFirst = search.isSymmetric || liveness !== undefined;

  const states: Value[][] = [];
  const fingerprintStates: Value[][] = [];
  const parents: number[] = [];
  const actions: (string | undefined)[] = [];
  const depths: number[] = [];
  const seenStates = createStateTable(fingerprintStates);
  const exploredStates: Value[][] = [];
  const exploredFingerprintStates: Value[][] = [];
  let exploredTable: StateTable | undefined;
  const isExplored = (hash: number, fingerprintState: Value[]) =>
    exploredTable !== undefined && findStateIndex(exploredTable, hash, fingerprintState) !== -1;
  const pendingFingerprintStates: Value[][] = [];
  let pendingStates: StateTable | undefined;
  const getPendingIndex = (hash: number, fingerprintState: Value[]) => {
    pendingStates ??= createStateTable(pendingFingerprintStates);
    const found = findStateIndex(pendingStates, hash, fingerprintState);
    const position = found === -1 ? pendingFingerprintStates.length : found;
    if (found === -1) {
      markSeenState(pendingStates, hash, position);
      pendingFingerprintStates.push(fingerprintState);
    }
    return -2 - position;
  };
  // TLC's states keep their own values, and coverage charges the cost model each value carries.
  const canonicalizeState = coverage
    ? (state: Value[]) => state
    : createCanonicalizer(search.isViewed);

  const toRecord = search.toRecord;
  // TLC's TLCGet("level") is 0 in the initial predicate and 1 in an initial state, also as TLC rebuilds one for a trace while it explores another state.
  let rebuiltInitLevel = -1;
  const rebuildInit = <Result>(rebuild: () => Result) => {
    rebuiltInitLevel = 0;
    try {
      return rebuild();
    } finally {
      rebuiltInitLevel = -1;
    }
  };
  const findUncoveredInitialState = (isMatch: (state: Value[]) => boolean) => {
    const init = spec.init;
    return init === undefined
      ? undefined
      : rebuildInit(() => {
          const initialStates = getInitialStates(init, environment, spec.scope);
          rebuiltInitLevel = 1;
          return initialStates.find(isMatch);
        });
  };
  const forEachSpecInitialState = (onState: (state: Value[]) => void) => {
    const onRebuiltState = (state: Value[]) => {
      rebuiltInitLevel = 1;
      onState(state);
      rebuiltInitLevel = 0;
    };
    rebuildInit(() => {
      if (coverage) {
        replayInitialStates(
          coverageInits,
          environment,
          onRebuiltState,
          rejectIncompleteInitialState,
        );
        return;
      }
      if (spec.init === undefined) return;
      forEachInitialState(
        spec.init,
        environment,
        (state) => {
          onRebuiltState(state);
          return false;
        },
        spec.scope,
      );
    });
  };
  const isUnfingerprintable = (state: Value[]) =>
    runUncounted(coverage, () => {
      try {
        return getFingerprintState(state).some((value) => getFingerprintError(value) !== undefined);
      } catch (error) {
        if (!(error instanceof TlaEvaluationError)) throw error;
        return true;
      }
    });
  const checkFailedTrace = (behavior: Behavior, counterExample?: CounterExampleOptions) => {
    if (!counterExample) return { behavior, postcondition: undefined };
    const checked = checkTracePostconditions(
      behavior.trace,
      undefined,
      getStepAlias,
      counterExample.isConsole,
    );
    return {
      behavior: appendTraceOutput(behavior, checked.lines),
      postcondition: checked.unwitnessed ?? checked.postcondition,
    };
  };
  const createFailureResult = (
    failed: unknown,
    behavior: Behavior,
    failureOptions: FailureOptions = {},
    postcondition?: Postcondition,
  ) => {
    // TLC enters an argument's LazyValue where the argument was written, which only the replay mirrors.
    const error = isStackOverflow(failed)
      ? new TlaStackOverflowError()
      : failed instanceof TlaBoundValueError && failureOptions.replayError
        ? failureOptions.replayError
        : failed;
    if (!(error instanceof TlaEvaluationError)) throw error;
    return {
      ...createResult("error", undefined, {
        ...getFailureMessage(
          error,
          failureOptions.phase !== undefined && failureOptions.phase !== "initial",
        ),
        ...behavior,
        ...(postcondition && { postcondition }),
        initialState:
          failureOptions.initialState && !(error instanceof TlaModuleError)
            ? toRecord(failureOptions.initialState)
            : undefined,
        exitCode: getFailureExitCode(error, failureOptions, is174),
        callStack: failureOptions.callStack,
        ...(failureOptions.phase === "liveness" && { isCallStackFirst: true }),
        ...(failureOptions.fingerprint && { fingerprint: failureOptions.fingerprint }),
        ...(failureOptions.traceFailure && { traceFailure: failureOptions.traceFailure }),
      }),
      outDegrees: failureOptions.outDegrees,
    };
  };
  // Deviation from TLC: Worker#doPostCondition throws an ArrayIndexOutOfBoundsException at an incomplete successor, where tla-ts checks the postconditions with the successor in CounterExample.
  const reportIncompleteSuccessor = (
    index: number,
    error: TlaIncompleteSuccessorError,
    liveSuccessors: LiveSuccessor[],
  ) => {
    runtime.generatedStates++;
    const found = captureOutput(() => {
      try {
        return {
          action: coverage
            ? coverageActions.find((item) => hasCoveredIncompleteSuccessor(item, states[index]))
            : nextActions.find((item) =>
                hasIncompleteSuccessor(item.expression, states[index], environment, item.scope),
              ),
          failed: undefined,
        };
      } catch (failed) {
        if (!(failed instanceof TlaEvaluationError)) throw failed;
        return { action: undefined, failed };
      }
    });
    const action = found.result.action;
    const actionName = action?.name ?? error.action;
    const traceFailure = found.result.failed && getTraceFailure(found.result.failed, found.lines);
    const message = getIncompleteSuccessorMessage(
      error.variables,
      actionName,
      nextActions.length,
      options.version,
    );
    const live = captureOutput(() => addFailedLiveState(index, liveSuccessors));
    const trace = traces.getStateTrace(index, {
      incomplete: error.state,
      isPrintedOnly: true,
    }).trace;
    const checked = checkFailedTrace(
      appendTraceOutput(
        {
          trace: traceFailure
            ? trace
            : [
                ...trace,
                traces.getIncompleteStep(
                  error.state,
                  trace.length + 1,
                  {
                    action: actionName,
                    label: action && getActionLabel(action, options.version),
                    output: found.lines,
                  },
                  action,
                ),
              ],
        },
        live.lines,
      ),
      { isConsole: true },
    );
    const failure = createFailureResult(
      error,
      checked.behavior,
      { callStack: live.result, traceFailure },
      checked.postcondition,
    );
    return withOutDegrees({
      ...failure,
      failure: failure.failure && {
        ...failure.failure,
        code: MESSAGE_CODE.incompleteSuccessor,
        message,
        toolMessage: message,
        exitCode: EXIT_STATUS.specEvaluationFailure,
      },
    });
  };
  const fingerprintModelState = (state: Value[]) => {
    for (const value of state) {
      const error = getFingerprintError(value);
      if (error) throw error;
    }
  };
  let unstoredFingerprint: Value[] | undefined;
  const countDistinctState = (depth: number) => {
    runtime.distinctStates = states.length + exploredStates.length + 1;
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
    fingerprintStates.push(
      fingerprintState === state ? state : canonicalizeState(fingerprintState),
    );
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
    rebuilt: undefined,
  };
  const isTraceRebuilt = coverage !== undefined || search.isTraceRebuildShown;
  const traces = createTraceBuilder({
    config,
    options,
    environment,
    search,
    nextActions,
    current,
    states,
    fingerprintStates,
    parents,
    actions,
    depths,
    tracedSteps,
    isTraceRebuilt,
    captureOutput,
    forEachInitialState: forEachSpecInitialState,
    findUncoveredInitialState,
    findSuccessorAction,
  });
  const getPath = (index: number): Value[][] =>
    index === -1 ? [] : [...getPath(parents[index]), states[index]];
  // TLC adds a successor's fingerprint to its set before it checks the invariants of the successor.
  runtime.isSeen = (state) => {
    const fingerprintState = getFingerprintState(state);
    const hash = getStateHash(fingerprintState);
    return (
      findStateIndex(seenStates, hash, fingerprintState) !== -1 ||
      isExplored(hash, fingerprintState) ||
      (unstoredFingerprint !== undefined && isSameState(unstoredFingerprint, fingerprintState))
    );
  };
  runtime.markExplored = (state) => {
    const fingerprintState = getFingerprintState(state);
    exploredTable ??= createStateTable(exploredFingerprintStates);
    markSeenState(exploredTable, getStateHash(fingerprintState), exploredStates.length);
    exploredStates.push(state);
    exploredFingerprintStates.push(fingerprintState);
    runtime.distinctStates++;
  };
  // TLCExt#getTrace rebuilds through the expanded state only for a successor Worker has written, before its invariants.
  const getTracedParent = (state: Value[], index: number) => {
    if (index !== -1) return parents[index];
    if (state !== current.candidate || current.index === -1) return -1;
    const isWritten =
      unstoredFingerprint !== undefined &&
      findStateIndex(seenStates, getStateHash(unstoredFingerprint), unstoredFingerprint) === -1;
    return isWritten ? current.index : parents[current.index];
  };
  runtime.getBehavior = (state) => {
    const index =
      state === current.candidate
        ? -1
        : current.isExpanding && state === current.rebuilt?.state
          ? current.index
          : states.indexOf(state);
    if (isTraceRebuilt) traces.rebuildPath(getTracedParent(state, index));
    return index === -1 ? [...getPath(current.index), state] : getPath(index);
  };
  runtime.getCurrentState = () =>
    current.rebuilt?.state ?? (current.index === -1 ? undefined : states[current.index]);
  runtime.setLivenessSource = (index) => {
    current.livenessSource = index ?? -1;
  };
  runtime.getLevel = (state) => {
    const source = current.livenessSource;
    if (is174) {
      const explored = source !== -1 ? source : current.isExpanding ? current.index : -1;
      return explored === -1 ? 0 : depths[explored];
    }
    if (rebuiltInitLevel !== -1) return rebuiltInitLevel;
    const rebuilt = current.rebuilt;
    if (rebuilt) return state === rebuilt.state ? rebuilt.level : rebuilt.level + 1;
    if (source !== -1) return state === states[source] ? depths[source] : depths[source] + 1;
    if (state === current.candidate) return current.candidateLevel;
    if (current.index === -1) return 0;
    if (state === states[current.index]) return depths[current.index];
    return current.isExpanding ? depths[current.index] + 1 : 0;
  };

  const getGraphAction = (action: SpecAction) => ({
    name: action.name,
    signature: getActionSignature(action),
  });
  const getGraphState = (state: Value[], level: number) =>
    search.getGraphState(state, runtime.getFingerprint(state), level, options.isTool ?? false);

  const visitInitialState = (state: Value[]) => {
    runtime.generatedStates++;
    runtime.initialStates++;
    current.candidate = state;
    current.candidateLevel = 1;
    const isInModel = search.satisfiesConstraints(state);
    // TLC fingerprints only a state in the model, which sorts its records in place.
    if (isInModel) canonicalizeState(state);
    const fingerprintState = isInModel ? getFingerprintState(state) : state;
    const hash = isInModel ? getStateHash(fingerprintState) : 0;
    if (isInModel) {
      search.trackStatePossible(state);
      fingerprintModelState(fingerprintState);
    }
    const isSeen = isInModel && findStateIndex(seenStates, hash, fingerprintState) !== -1;
    if (isSeen) return undefined;
    unstoredFingerprint = isInModel ? fingerprintState : undefined;
    if (isInModel) {
      countDistinctState(1);
      runtime.queueSize++;
      liveness?.addInitialState(states.length, state);
      stateWriter?.writeInitialState(getGraphState(state, 1));
    }
    if (options.isContinued) {
      search.forEachViolatedInvariant(state, (invariant) =>
        reportContinuedViolation("invariant-violation", {
          name: invariant.name,
          ...traces.toTrace([{ action: undefined, state }], []),
        }),
      );
    }
    const violated = options.isContinued ? undefined : search.findViolatedInvariant(state);
    if (violated) {
      return reportViolation(
        "invariant-violation",
        { name: violated.name, ...traces.toTrace([{ action: undefined, state }], []) },
        getStepState,
      );
    }
    const failedPredicate = search.findFailedInitialPredicate(state);
    if (failedPredicate) {
      return reportViolation(
        "liveness-violation",
        { name: failedPredicate.name, ...traces.toTrace([{ action: undefined, state }], []) },
        getStepState,
      );
    }
    if (!isInModel) return undefined;
    markSeenState(seenStates, hash, states.length);
    addState(state, fingerprintState, -1, undefined);
    return undefined;
  };
  // Looks a successor up, where the constraints keep it in the model, as the search does before it
  // checks the successor.
  const lookUpSuccessor = (state: Value[], successor: Successor) => {
    const isStateInModel = search.satisfiesConstraints(successor.state, state);
    if (isStateInModel) search.trackStatePossible(successor.state);
    const isInModel = isStateInModel && search.satisfiesActionConstraints(state, successor.state);
    const fingerprintState = isInModel ? getFingerprintState(successor.state) : successor.state;
    const hash = isInModel ? getStateHash(fingerprintState) : 0;
    if (isInModel) {
      search.trackActionPossible(state, successor.state);
      fingerprintModelState(fingerprintState);
    }
    const existing = isInModel ? findStateIndex(seenStates, hash, fingerprintState) : -1;
    return {
      fingerprintState,
      hash,
      isInModel,
      existing,
      isSeen: existing !== -1 || (isInModel && isExplored(hash, fingerprintState)),
    };
  };
  // Deviation from TLC: under -continue, TLC reports failing to rebuild the violating step as a failure of the invariant.
  const getViolationTrace = (index: number, successor: Successor, isSuccessorWritten: boolean) =>
    options.isContinued
      ? traces.getTrace(index, successor, { isPrintedOnly: true, isCurrentKept: true })
      : traces.getTrace(index, successor, { isRebuildFailureKept: true, isSuccessorWritten });
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
    const found = lookUpSuccessor(state, successor);
    if (source && found.isInModel) {
      stateWriter?.writeSuccessor(
        source,
        getGraphState(successor.state, depths[index] + 1),
        found.isSeen,
        action && getGraphAction(action),
      );
    }
    if (source && !found.isInModel && options.dump?.constrained) {
      const excluded = getGraphState(successor.state, depths[index] + 1);
      search
        .getExcludingConstraints(state, successor.state)
        .forEach((constraint) =>
          stateWriter?.writeConstrained(
            source,
            excluded,
            action && getGraphAction(action),
            constraint,
          ),
        );
    }
    if (found.existing !== -1 && liveness) {
      const stored = states[found.existing];
      const isStored = stored.every((value, position) => value === successor.state[position]);
      liveSuccessors.push({ index: found.existing, state: isStored ? stored : successor.state });
    }
    if (found.isSeen && found.existing === -1 && liveness) {
      liveSuccessors.push({
        index: getPendingIndex(found.hash, found.fingerprintState),
        state: successor.state,
      });
    }
    const isNew = found.isInModel && !found.isSeen;
    if (isNew && liveness) liveSuccessors.push({ index: states.length, state: successor.state });
    unstoredFingerprint = isNew ? found.fingerprintState : undefined;
    if (isNew) {
      countDistinctState(depths[index] + 1);
      newStateCount++;
      if (coverage) coverage.secondary[coveredNode]++;
    }
    if (!found.isSeen) {
      try {
        const violated = search.findViolatedInvariant(successor.state, state);
        const violation = violated && {
          name: violated.name,
          ...getViolationTrace(index, successor, isNew),
        };
        if (violation && !options.isContinued) {
          return withOutDegrees(reportViolation("invariant-violation", violation));
        }
        if (violation) reportContinuedViolation("invariant-violation", violation);
      } catch (error) {
        if (isStackOverflow(error)) throw error;
        const behavior = traces.getTrace(index, successor, { isPrintedOnly: true });
        const replay = is174
          ? captureOutput(() => replayNext(index))
          : replayFailedNext(index, liveSuccessors);
        return createFailureResult(
          error,
          appendTraceOutput(behavior, replay.lines),
          replay.result ?? { outDegrees: getFailureOutDegrees() },
        );
      }
    }
    const violatedProperty = search.findViolatedActionProperty(state, successor.state);
    const propertyViolation = violatedProperty && {
      name: violatedProperty.name,
      ...getViolationTrace(index, successor, isNew),
    };
    if (propertyViolation && !options.isContinued) {
      return withOutDegrees(reportViolation("liveness-violation", propertyViolation));
    }
    if (propertyViolation) reportContinuedViolation("liveness-violation", propertyViolation);
    if (!isNew) return undefined;
    if (coverage) countCoverageVariables(coverage, successor.state);
    if (!isCanonicalizedFirst) canonicalizeState(successor.state);
    markSeenState(seenStates, found.hash, states.length);
    if (pendingStates) {
      const pending = findStateIndex(pendingStates, found.hash, found.fingerprintState);
      if (pending !== -1) liveness?.storeState(-2 - pending, states.length);
    }
    addState(successor.state, found.fingerprintState, index, successor.action);
    runtime.queueSize++;
    return undefined;
  };

  let outcome: CheckResult | undefined;
  let coveredNode = -1;
  if (liveness) {
    options.onProgress?.({ kind: "liveness-prepared", branches: liveness.branches });
  }
  const assumptionViolation = findViolatedAssumption();
  if (assumptionViolation) return createResult("assumption-violation", assumptionViolation);
  options.onProgress?.({ kind: "initial-states-started" });
  let isTypedInitialReported = false;
  let typedProgressAt = Infinity;
  const typedChecks =
    !isTypedTierSkipped &&
    !options.isContinued &&
    options.dump === undefined &&
    // A set of small integers on the tier is a 31-bit mask, which a lower bound could overflow.
    options.maxSetSize === undefined &&
    // The trace spec's _TLCTraceSilent holds without effect while CounterExample.state = {}, as it is after any run the tier decides.
    !hasUserPostconditions &&
    !getDescription().isNextOverlapping
      ? search.getTypedChecks(liveness?.solutions)
      : undefined;
  const typed =
    typedChecks &&
    runTypedSearch(environment, {
      ...typedChecks,
      isDeadlockChecked: config.checkDeadlock,
      isFingerprinted: !options.isFingerprintDistanceSkipped,
      livenessCheck: options.livenessCheck ?? "default",
      reportInitialStates: (initialStates) => {
        if (isTypedInitialReported) return;
        isTypedInitialReported = true;
        for (let count = 2; count < initialStates.generated; count *= 2) {
          reportInitialStatesProgress(count, options.onProgress);
        }
        options.onProgress?.({ kind: "initial-states-computed", initialStates });
        typedProgressAt = performance.now() + PERIODIC_START;
      },
      reportProgress:
        options.onProgress &&
        ((generatedStates, distinctStates, queuedStates, depth) => {
          const now = performance.now();
          if (now < typedProgressAt) return;
          typedProgressAt = now + PROGRESS_INTERVAL;
          options.onProgress?.({
            kind: "progress",
            statistics: {
              generatedStates,
              distinctStates,
              queuedStates,
              depth,
              coverage: undefined,
            },
          });
        }),
    });
  const parallel = typed === undefined ? checkInParallel?.(search, getDescription()) : undefined;
  if (parallel) return parallel;
  const onInitialProgress = isTypedInitialReported ? undefined : options.onProgress;
  if (typed && !typed.deadlock && !typed.violation && !typed.lasso) {
    const statistics = {
      ...createResult("success"),
      generatedStates: typed.generatedStates,
      distinctStates: typed.distinctStates,
      queuedStates: 0,
      depth: typed.generatedStates === 0 ? 0 : Math.max(typed.depth, 1),
      initialStates: typed.initialStates,
    };
    if (liveness && options.livenessCheck !== "off") {
      options.onProgress?.({
        kind: "liveness-started",
        branches: liveness.branches,
        isComplete: true,
        states: liveness.branches * typed.distinctStates,
        statistics,
      });
      options.onProgress?.({ kind: "liveness-finished" });
    }
    return {
      ...statistics,
      outDegrees: typed.outDegrees,
      fingerprintDistance: options.isFingerprintDistanceSkipped
        ? undefined
        : getFingerprintDistance(
            typed.distinctStates,
            typed.generatedStates,
            typed.forEachFingerprintRun,
          ),
    };
  }
  if (spec.init !== undefined) {
    let overflowState: Value[] | undefined;
    const reportInitialFailure = (error: unknown, state: Value[]) => {
      const replay = captureOutput(replayInit);
      return createFailureResult(
        error,
        { trace: [], traceOutput: replay.lines },
        { initialState: state, ...replay.result, phase: "initial" },
      );
    };
    try {
      const onInitialState = (state: Value[]) => {
        reportInitialStatesProgress(runtime.initialStates, onInitialProgress);
        if (overflowState) {
          runtime.generatedStates++;
          runtime.initialStates++;
          return false;
        }
        try {
          outcome = visitInitialState(state);
        } catch (error) {
          if (isStackOverflow(error)) overflowState = state;
          else outcome = reportInitialFailure(error, state);
        }
        return outcome !== undefined;
      };
      if (coverage) {
        try {
          replayInitialStates(
            coverageInits,
            environment,
            (state) => {
              if (onInitialState(state)) throw STOP_WALK;
            },
            rejectIncompleteInitialState,
          );
        } catch (error) {
          if (error !== STOP_WALK) throw error;
        }
      } else {
        forEachInitialState(
          spec.init,
          environment,
          onInitialState,
          spec.scope,
          spec.initPredicates,
        );
      }
      if (overflowState) {
        outcome = reportInitialFailure(createStackOverflowError(), overflowState);
      }
    } catch (error) {
      if (error instanceof TlaIllegalStateError) {
        reportInitialStatesProgress(runtime.initialStates, onInitialProgress);
        runtime.generatedStates++;
        runtime.initialStates++;
        const state = error.state.map((value) => value ?? createModelValue("null"));
        // Deviation from TLC: CounterExample holds a Java null for an unassigned variable and leaks a NullPointerException, where tla-ts binds the model value null.
        const checked = checkTracePostconditions(
          [{ action: undefined, label: undefined, state: toRecord(state) }],
          undefined,
          getStepState,
        );
        const postcondition = checked.unwitnessed ?? checked.postcondition;
        const illegal = createFailureResult(
          error,
          { trace: [], traceOutput: checked.lines },
          { initialState: state },
        );
        return {
          ...illegal,
          failure: illegal.failure && {
            ...illegal.failure,
            isWithoutStatistics: true,
            ...(postcondition && { postcondition }),
          },
        };
      }
      const replay = captureOutput(replayInit);
      return createFailureResult(
        error,
        { trace: [], traceOutput: replay.lines },
        { ...replay.result, phase: "initial" },
      );
    }
  }
  if (outcome) return outcome;
  computedInitialStates = {
    generated: runtime.initialStates,
    distinct: runtime.distinctStates,
  };
  onInitialProgress?.({
    kind: "initial-states-computed",
    initialStates: computedInitialStates,
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
  const isNamingEdges = Boolean(
    options.dump?.dot && (options.dump.actionLabels || options.dump.colorize),
  );
  // Tool's constructor evaluates the bounds and arguments it splits Next on once, which shows when they draw, print or read a register.
  const isNextSplit = isNamingEdges || search.isNextReplayed || getDescription().isNextOverlapping;
  const forEachActionSuccessor = (
    state: Value[],
    onUnsatisfied:
      | ((successor: Value[], conjunct: Expression, action?: SpecAction) => void)
      | undefined,
    onSuccessor: (successor: Successor, action: SpecAction | undefined) => boolean,
  ) => {
    if (coverage) {
      let successorCount = 0;
      try {
        coverageActions.forEach((action) => {
          coveredNode = action.node;
          walkCoveredSuccessors(coverage, action, state, environment, (successor) => {
            successorCount++;
            if (onSuccessor({ state: successor, action: action.name }, action)) throw STOP_WALK;
          });
        });
      } catch (error) {
        if (error !== STOP_WALK) throw error;
      }
      return successorCount;
    }
    if (!isNextSplit) {
      return forEachSuccessor(
        next,
        state,
        environment,
        (successor) => onSuccessor(successor, undefined),
        spec.scope,
        undefined,
        onUnsatisfied,
      );
    }
    let isStopped = false;
    return nextActions.reduce((count, action) => {
      if (isStopped) return count;
      return (
        count +
        forEachSuccessor(
          action.expression,
          state,
          environment,
          (successor) => {
            successor.action ??= action.name;
            isStopped = onSuccessor(successor, action);
            return isStopped;
          },
          action.scope,
          undefined,
          onUnsatisfied && ((successor, conjunct) => onUnsatisfied(successor, conjunct, action)),
        )
      );
    }, 0);
  };
  // Deviation from TLC: Worker#doNextCheckLiveness doesn't catch a FingerprintException from its rerun, so TLC prints the behavior without the failure.
  const getLiveCallStack = (index: number, liveSuccessors: LiveSuccessor[]) => {
    if (!liveness || is174) return undefined;
    const replay = getReplayFailure(environment, (tracing) =>
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
      // TLC fails to fingerprint an incomplete successor with an exception Worker#doNextCheckLiveness doesn't rerun for a call stack.
      if (error instanceof TlaIncompleteSuccessorError) return undefined;
      return getLiveCallStack(index, liveSuccessors);
    }
  };
  const replayFailedNext = (index: number, liveSuccessors: LiveSuccessor[]) => {
    const live = captureOutput(() => addFailedLiveState(index, liveSuccessors));
    if (live.result) {
      const result: FailureOptions = { phase: "behavior-graph", callStack: live.result };
      return { result, lines: live.lines };
    }
    const replay = captureOutput(() => replayNext(index));
    const result: FailureOptions =
      replay.result ?? (is174 ? {} : { outDegrees: getFailureOutDegrees() });
    return { result, lines: [...live.lines, ...replay.lines] };
  };
  const getNextFailureTrace = (index: number, counterExample?: CounterExampleOptions) =>
    checkFailedTrace(
      traces.getStateTrace(index, { isPrintedOnly: !counterExample }),
      counterExample,
    );
  const reportNextStateOverflow = (index: number, counterExample?: CounterExampleOptions) => {
    const checked = getNextFailureTrace(index, counterExample);
    return createFailureResult(
      createStackOverflowError(),
      checked.behavior,
      { phase: "next" },
      checked.postcondition,
    );
  };
  // TLC runs the split actions, which bind a literal argument to its value instead of a LazyValue.
  const getSplitFailure = (error: unknown, index: number) => {
    if (
      coverage ||
      isNextSplit ||
      !getDescription().hasLiteralArgument ||
      !(error instanceof TlaEvaluationError)
    ) {
      return error;
    }
    return captureOutput(() => {
      try {
        nextActions.forEach((action) =>
          forEachSuccessor(
            action.expression,
            states[index],
            environment,
            () => false,
            action.scope,
          ),
        );
        return error;
      } catch (split) {
        if (!(split instanceof TlaEvaluationError)) throw split;
        return split;
      }
    }).result;
  };
  // Deviation from TLC: under -continue, TLC's Worker reports a state whose next-state relation failed as deadlocked, or else reports the failure twice as its replay fails again.
  // Deviation from TLC: under -continue, ModelChecker#doNextEvalFailed rethrows a failed invariant to Worker#doNextFailed, which reports it again with the code of its error.
  const reportNextStateFailure = (
    error: unknown,
    index: number,
    liveSuccessors: LiveSuccessor[],
    generated: number,
  ) => {
    // TLC's Worker goes on to find a state without successors deadlocked after it fails, which checks the postconditions.
    const counterExample =
      config.checkDeadlock && runtime.generatedStates === generated
        ? { isConsole: false }
        : undefined;
    if (isStackOverflow(error)) return reportNextStateOverflow(index, counterExample);
    const checked = getNextFailureTrace(index, counterExample);
    const replay = replayFailedNext(index, liveSuccessors);
    return createFailureResult(
      withNextStateExitCode(error),
      appendTraceOutput(checked.behavior, replay.lines),
      { phase: "next", ...replay.result },
      checked.postcondition,
    );
  };
  const addLiveState = (
    index: number,
    liveSuccessors: LiveSuccessor[],
    source: GraphState | undefined,
  ) => {
    if (liveness && source) stateWriter?.writeStuttering(source);
    const accepted = liveness?.addState(index, states[index], liveSuccessors);
    if (!liveness || !accepted) return undefined;
    // Deviation from TLC: under -continue, TLC's LiveCheck throws an InvariantViolatedException after it reports the property, which its Worker reports as unexpected.
    const steps = traces.getPathSteps(accepted);
    const properties = getViolatedProperties(
      liveness,
      steps.map((step) => step.state),
      steps.length - 1,
    );
    return reportViolation("property-violation", {
      name: properties[0],
      properties,
      ...traces.toTrace(steps, accepted, { known: 0 }),
    });
  };
  const addReportedLiveState = (
    index: number,
    liveSuccessors: LiveSuccessor[],
    source: GraphState | undefined,
  ) =>
    captureOutput(() => {
      try {
        return {
          additional: addLiveState(index, liveSuccessors, source)?.violation,
          isFailed: false,
          callStack: undefined,
        };
      } catch (error) {
        if (!(error instanceof TlaEvaluationError)) throw error;
        return {
          additional: undefined,
          isFailed: true,
          callStack: getLiveCallStack(index, liveSuccessors),
        };
      }
    });
  const expandState = (index: number, liveSuccessors: LiveSuccessor[]) => {
    const state = states[index];
    const source = stateWriter && getGraphState(state, depths[index]);
    const writeUnsatisfied =
      source && options.dump?.constrained
        ? (successor: Value[], conjunct: Expression, action?: SpecAction) =>
            stateWriter?.writeConstrained(
              source,
              getGraphState(successor, depths[index] + 1),
              action && getGraphAction(action),
              describeRange(conjunct),
            )
        : undefined;
    const successorCount = forEachActionSuccessor(state, writeUnsatisfied, (successor, action) => {
      try {
        outcome = visitSuccessor(index, successor, liveSuccessors, source, action);
      } catch (error) {
        if (isStackOverflow(error)) {
          outcome = reportNextStateOverflow(index);
          return true;
        }
        if (is174 && error instanceof TlaEvaluationError && !isHeadedError(error)) {
          const replay = captureOutput(() => replayNext(index));
          outcome = createFailureResult(
            new TlaEvaluationError(`${getWrappedException(error)}${error.message}`, error),
            appendTraceOutput({ trace: [] }, replay.lines),
            { phase: "next", ...replay.result },
          );
          return true;
        }
        const traceError =
          error instanceof TlaEvaluationError && isUnfingerprintable(successor.state)
            ? error
            : undefined;
        const behavior = traceError
          ? traces.getStateTrace(index, { isPrintedOnly: true })
          : traces.getTrace(index, successor, { isPrintedOnly: true });
        const rebuilt =
          traceError &&
          captureOutput(() => {
            try {
              traces.findStepAction(index, state, successor.state, true);
              return traceError;
            } catch (failed) {
              if (!(failed instanceof TlaEvaluationError)) throw failed;
              return failed;
            }
          });
        const traceFailure = rebuilt && getTraceFailure(rebuilt.result, rebuilt.lines);
        const replay = is174
          ? captureOutput(() => replayNext(index))
          : replayFailedNext(index, liveSuccessors);
        outcome = createFailureResult(error, appendTraceOutput(behavior, replay.lines), {
          phase: "next",
          ...replay.result,
          traceFailure,
        });
      }
      return outcome !== undefined;
    });
    current.isExpanding = false;
    const result = outcome;
    if (result?.violation && !is174) {
      const live = addReportedLiveState(index, liveSuccessors, source);
      return {
        ...result,
        violation: appendTraceOutput(result.violation, live.lines),
        // TLC adds the state to the behavior graph before it reports the coverage.
        coverage: getCoverage(),
        ...(live.result.additional && { additionalViolation: live.result.additional }),
        ...(live.result.callStack && { liveCallStack: live.result.callStack }),
      };
    }
    if (result) return result;
    if (successorCount === 0 && config.checkDeadlock) {
      const deadlock = reportViolation("deadlock", {
        name: "deadlock",
        ...traces.getStateTrace(index),
      });
      const live = addReportedLiveState(index, liveSuccessors, source);
      const reported = {
        ...deadlock,
        violation: deadlock.violation && appendTraceOutput(deadlock.violation, live.lines),
        coverage: getCoverage(),
      };
      const counted = withOutDegrees(
        reported,
        live.result.isFailed ? getFailureOutDegrees() : getPartialOutDegrees(),
      );
      if (live.result.additional)
        return { ...counted, additionalViolation: live.result.additional };
      return live.result.callStack ? { ...counted, liveCallStack: live.result.callStack } : counted;
    }
    try {
      return addLiveState(index, liveSuccessors, source);
    } catch (error) {
      if (is174 && error instanceof TlaEvaluationError) {
        return createFailureResult(
          setExitCode(toUnexpectedError(error), EXIT_STATUS.error),
          { trace: [] },
          { outDegrees: getFailureOutDegrees() },
        );
      }
      // Deviation from TLC: ModelChecker#doNextFailed prints no message for the FingerprintException that TupleValue#equals throws when Worker#doNextCheckLiveness compares a subscript, where tla-ts reports the comparison's error.
      const replay = getReplayFailure(environment, (tracing) =>
        liveness?.addState(index, state, liveSuccessors, tracing),
      );
      const behavior = traces.getStateTrace(index, { isPrintedOnly: true });
      const replayed = captureOutput(() => replayNext(index));
      return createFailureResult(error, appendTraceOutput(behavior, replayed.lines), {
        outDegrees: getFailureOutDegrees(),
        callStack: replay?.callStack.length ? replay.callStack : undefined,
        phase: "liveness",
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
    const definition = getDefinition(getRootKey(name, environment), environment);
    // Liveness#printStutteringCounterExampleWarning locates the root's OpDefNode, which SANY builds on the INSTANCE that substitutes into the definition.
    const range = definition && (getInstanceFrame(definition.body) ?? definition).location.range;
    if (spec.temporals.length > 0 || !range) return undefined;
    return {
      code: MESSAGE_CODE.noFairnessButProperty,
      text: `The stuttering counterexample above may be caused by the absence of a fairness constraint in the behavior specification ${name} defined at ${formatRange(range)}. To rule out such counterexamples, conjoin a suitable fairness constraint to ${name} ${book}`,
    };
  };
  const toLivenessFailure = (error: TlaEvaluationError) =>
    setExitCode(toUnexpectedError(error), EXIT_STATUS.abort);
  const getLassoSteps = (path: number[]) => {
    try {
      return traces.getPathSteps(path);
    } catch (error) {
      if (!(error instanceof TlaEvaluationError)) throw error;
      throw toLivenessFailure(error);
    }
  };
  // Deviation from TLC: LiveWorker#printTrace rebuilds a lasso's states with no worker id, so Trace in the next-state relation fails past the initial state with an ArrayIndexOutOfBoundsException.
  const reportLasso = (checker: LivenessChecker, lasso: Lasso) => {
    const path = [...lasso.prefix, ...lasso.cycle];
    const loopStart = lasso.prefix.length;
    const steps = getLassoSteps(path);
    const trace = traces.toTrace(steps, path, { loopStart, known: 0 }).trace;
    const properties = getViolatedProperties(
      checker,
      steps.map((step) => step.state),
      loopStart,
    );
    const cycleStart = path[loopStart];
    const cycleEnd = path[path.length - 1];
    const lastState = steps[steps.length - 1].state;
    const isStuttering = cycleStart === cycleEnd;
    const loop = isStuttering
      ? { result: undefined, lines: [] }
      : captureOutput(() =>
          traces.findStepAction(cycleEnd, lastState, fingerprintStates[cycleStart], false),
        );
    const back =
      isStuttering || loop.result
        ? undefined
        : traces.findSuccessorWithFingerprint(lastState, cycleEnd, cycleStart);
    if (!isStuttering && !loop.result && !back) {
      options.onProgress?.({
        kind: "violation",
        status: "property-violation",
        violation: {
          name: properties[0],
          properties,
          trace,
          traceOutput: loop.lines,
          loopStart: undefined,
        },
      });
      throw toLivenessFailure(new TlaEvaluationError(NEXT_RECOVERY_FAILURE));
    }
    return reportViolation(
      "liveness-violation",
      {
        name: properties[0],
        properties,
        trace,
        traceOutput: loop.lines,
        loopStart,
        loopLabel: loop.result && getActionLabel(loop.result, options.version),
        warning: isStuttering && lasso.isCycleConstrained ? getStutteringWarning() : undefined,
      },
      getStepState,
      () =>
        isStuttering
          ? getStepAction(trace[trace.length - 1])
          : loop.result
            ? toActionValue(loop.result)
            : createActionRecord(back?.action),
    );
  };
  const isPeriodic = liveness !== undefined && (options.livenessCheck ?? "default") === "default";
  const startedAt = performance.now();
  const periodic = {
    at: startedAt + PERIODIC_START,
    checkedCounts: liveness?.getStateCounts().map(() => 1) ?? [],
    time: 0,
    coverageCount: Math.trunc(options.coverage ?? 0),
  };
  const getGraphStates = (checker: LivenessChecker) =>
    checker.getStateCounts().reduce((sum, count) => sum + count, 0);
  const findPeriodicViolation = (checker: LivenessChecker) => {
    const now = performance.now();
    const counts = checker.getStateCounts();
    const isGrown = counts.some(
      (count, branch) =>
        (count - periodic.checkedCounts[branch]) / periodic.checkedCounts[branch] > LIVENESS_GROWTH,
    );
    if (!isGrown || periodic.time > (now - startedAt) * LIVENESS_RATIO) return undefined;
    periodic.checkedCounts = counts;
    options.onProgress?.({
      kind: "liveness-started",
      branches: checker.branches,
      isComplete: false,
      states: getGraphStates(checker),
      statistics: createResult("success"),
    });
    const lasso = checker.findViolation();
    if (!lasso) options.onProgress?.({ kind: "liveness-finished" });
    periodic.time += performance.now() - now;
    return lasso;
  };
  const adoptTypedSearch = (searched: TypedResult) => {
    runtime.generatedStates = searched.generatedStates;
    runtime.distinctStates = searched.distinctStates;
    runtime.queueSize = searched.queuedStates;
    runtime.diameter = searched.depth;
    searchDepth = searched.depth;
    outDegrees.splice(0, outDegrees.length, ...searched.outDegrees);
    newStateCount = 0;
  };
  // The tier found a state without successors, or a successor that violates an invariant or an
  // action property. The interpreter rebuilds the tier's path to it and reports it, as it would after
  // its own search.
  const path = typed?.deadlock ?? typed?.violation;
  const initialIndex = path ? states.findIndex((state) => path.isPathState(0, state)) : -1;
  if (typed && path && initialIndex !== -1) {
    const steps: { successor: Successor; action: SpecAction | undefined }[] = [];
    const getLastState = () => steps.at(-1)?.successor.state ?? states[initialIndex];
    for (let position = 1; position === steps.length + 1 && position < path.length; position++) {
      // The interpreter expands only the states it stores, which it has canonicalized.
      canonicalizeState(getLastState());
      forEachActionSuccessor(getLastState(), undefined, (successor, action) => {
        if (!path.isPathState(position, successor.state)) return false;
        steps.push({ successor, action });
        return true;
      });
    }
    const isRebuilt = steps.length === path.length - 1;
    const violating = typed.violation && isRebuilt ? steps.pop() : undefined;
    if (violating && isCanonicalizedFirst) canonicalizeState(violating.successor.state);
    const violatedInvariant =
      violating && search.findViolatedInvariant(violating.successor.state, getLastState());
    const violatedProperty =
      violating &&
      !violatedInvariant &&
      search.findViolatedActionProperty(getLastState(), violating.successor.state);
    const violated = violatedInvariant ?? violatedProperty;
    const isDeadlocked =
      typed.deadlock !== undefined &&
      isRebuilt &&
      forEachActionSuccessor(getLastState(), undefined, () => true) === 0;
    if (isDeadlocked || violated) {
      const parent = { index: initialIndex };
      for (const step of steps) {
        visitSuccessor(parent.index, step.successor, [], undefined, step.action);
        parent.index = states.length - 1;
      }
      adoptTypedSearch(typed);
      Object.assign(current, { index: parent.index, candidate: undefined, isExpanding: true });
      if (violating && violated) {
        const found = lookUpSuccessor(states[parent.index], violating.successor);
        current.candidate = violating.successor.state;
        current.candidateLevel = depths[parent.index] + 1;
        return withOutDegrees(
          reportViolation(violatedInvariant ? "invariant-violation" : "liveness-violation", {
            name: violated.name,
            ...getViolationTrace(
              parent.index,
              violating.successor,
              found.isInModel && !found.isSeen,
            ),
          }),
        );
      }
      const result = expandState(parent.index, []);
      if (result) return result;
    }
  }
  // The tier found a behavior that violates a temporal property after its whole search. The
  // interpreter stores the paths to the lasso's states and reports it, as it would after its own.
  const lassoSteps = new Map<number, { successor: Successor; action: SpecAction | undefined }>();
  for (const entry of typed?.lasso?.states ?? []) {
    const initial = entry.parent === -1 ? states.find(entry.isState) : undefined;
    if (initial) {
      lassoSteps.set(entry.index, {
        successor: { state: initial, action: undefined },
        action: undefined,
      });
    }
    const parent = lassoSteps.get(entry.parent)?.successor.state;
    if (!parent) continue;
    // The interpreter expands only the states it stores, which it has canonicalized.
    canonicalizeState(parent);
    forEachActionSuccessor(parent, undefined, (successor, action) => {
      if (!entry.isState(successor.state)) return false;
      lassoSteps.set(entry.index, { successor, action });
      return true;
    });
  }
  const lassoIndexes = new Map<number, number>();
  const typedLasso =
    typed?.lasso && lassoSteps.size === typed.lasso.states.length ? typed.lasso : undefined;
  typedLasso?.states.forEach((entry) => {
    const step = lassoSteps.get(entry.index);
    const parent = lassoIndexes.get(entry.parent);
    if (step && parent !== undefined)
      visitSuccessor(parent, step.successor, [], undefined, step.action);
    lassoIndexes.set(
      entry.index,
      parent === undefined ? states.findIndex(entry.isState) : states.length - 1,
    );
  });
  if (typed && typedLasso) adoptTypedSearch(typed);
  for (
    let index = typedLasso ? states.length : 0;
    index < states.length && !runtime.isStopped;
    index++
  ) {
    current.index = index;
    current.candidate = undefined;
    runtime.queueSize = states.length - index - 1;
    current.isExpanding = true;
    const liveSuccessors: LiveSuccessor[] = [];
    const generated = runtime.generatedStates;
    try {
      outcome = expandState(index, liveSuccessors);
    } catch (error) {
      const failure = getSplitFailure(error, index);
      outcome =
        failure instanceof TlaIncompleteSuccessorError
          ? reportIncompleteSuccessor(index, failure, liveSuccessors)
          : reportNextStateFailure(failure, index, liveSuccessors, generated);
    }
    if (outcome) return outcome;
    outDegrees[getOutDegreeBucket()]++;
    newStateCount = 0;
    if ((isPeriodic || options.onProgress) && performance.now() >= periodic.at) {
      periodic.at = performance.now() + PROGRESS_INTERVAL;
      const lasso = isPeriodic && liveness ? findPeriodicViolation(liveness) : undefined;
      if (liveness && lasso) return reportLasso(liveness, lasso);
      const isCoverageDue = options.coverage !== undefined && periodic.coverageCount === 0;
      periodic.coverageCount = isCoverageDue
        ? Math.trunc(options.coverage ?? 0)
        : periodic.coverageCount - 1;
      const progress = createResult("success");
      options.onProgress?.({
        kind: "progress",
        statistics: {
          ...progress,
          // TLC reports progress while its worker expands the next state, which has left the queue.
          queuedStates: Math.max(progress.queuedStates - 1, 0),
          coverage: isCoverageDue ? progress.coverage : undefined,
        },
      });
    }
  }

  current.index = -1;
  current.candidate = undefined;
  const finalLiveness = options.livenessCheck === "off" ? undefined : liveness;
  if (finalLiveness) {
    options.onProgress?.({
      kind: "liveness-started",
      branches: finalLiveness.branches,
      isComplete: true,
      states: typedLasso
        ? finalLiveness.branches * runtime.distinctStates
        : getGraphStates(finalLiveness),
      statistics: createResult("success"),
    });
  }
  const getLassoIndexes = (indexes: number[]) =>
    indexes.map((index) => lassoIndexes.get(index) ?? -1);
  const lasso = typedLasso
    ? {
        prefix: getLassoIndexes(typedLasso.prefix),
        cycle: getLassoIndexes(typedLasso.cycle),
        isCycleConstrained: typedLasso.isCycleConstrained,
      }
    : finalLiveness?.findViolation();
  if (finalLiveness && lasso) return reportLasso(finalLiveness, lasso);

  if (finalLiveness) options.onProgress?.({ kind: "liveness-finished" });
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
  return continuedStatus ? createResult(continuedStatus) : createSuccess();
};
