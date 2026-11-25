import type { CheckOptions, TraceStep, Violation } from "./check";
import type { CoverageOutput } from "./coverage";
import {
  FILE_NOT_FOUND_EXCEPTION,
  getTracePrintFailure,
  isStackOverflow,
  TlaEvaluationError,
  TlaFileError,
  TlaIncompleteSuccessorError,
  TlaModuleError,
  TlaStackOverflowError,
  TlaTooManyStatesError,
  TlaSetBoundError,
  UNEXPECTED_EVAL_EXCEPTION,
  UNEXPECTED_EXCEPTION,
  WRONG_INVOCATION_EXCEPTION,
} from "./errors";
import type { State } from "./evaluate";
import { EXIT_STATUS, getMessageExitStatus, withLivenessChecksExitCode } from "./exit-codes";
import { getHashMapOrder, getJavaHashCode } from "./java-hash";
import { createLivenessChecks } from "./liveness-checker";
import { getNamedRegisters } from "./runtime";
import {
  addActionCoverage,
  createOutputCapture,
  getIncompleteSuccessorMessage,
  prepareSearch,
  reportAssumptionViolation,
  STOP_WALK,
  walkCoveredSuccessors,
  type CliSettings,
  type TraceSpecOutput,
} from "./search";
import { getActionLabel, toActionValue, type SpecAction } from "./spec-description";
import { forEachInitialState, forEachSuccessor, type Successor } from "./successors";
import {
  formatInnerMessage,
  formatNestedMessage,
  formatTlcDate,
  getCodedMessage,
  getFailureMessage,
  isEvalException,
  isHeadedError,
  MESSAGE_CODE,
  MESSAGE_LEVEL,
  withUnexpectedException,
  type FailureMessage,
  type MessageLevel,
} from "./tlc/messages";
import { getActionFlowGraph, type ActionStatistics } from "./tlc/action-graph";
import { createJavaRandom, nextPrime, type JavaRandom } from "./tlc/random";
import { replayInitialStates } from "./tlc/replay";
import { getRegisterFunction } from "./tlc/tlc-operators";
import { formatTraceSpecState } from "./tlc/trace-spec";
import {
  createActionRecord,
  createCounterExample,
  createTlcRecord,
  type CounterExampleLoop,
} from "./tlc/tlcext-operators";
import {
  computeOnFailure,
  createModelValue,
  createRecord,
  formatErrorState,
  formatFingerprintedState,
  formatState,
  getDiffBase,
  getFingerprintError,
  getSetBound,
  markNormalized,
  valuesEqual,
  type Value,
} from "./values";

export interface SimulationOptions extends CheckOptions {
  traceDepth: number;
  traceCount: bigint | undefined;
  aril: bigint;
  isGenerating: boolean;
  scheduler: "random" | "rl" | "rlaction";
  /** TLC's -difftrace, which also drops the steps of a printed behavior that repeat a fingerprint. */
  isDiffTrace?: boolean;
  /** TLC's -simulate stats=basic|full, which writes the graph of the actions the behaviors take to <root>_actions.dot through writeFile. */
  actionStatistics?: ActionStatistics;
  /** TLC's -simulate file=, which writes each behavior that ends without an error to <file>_0_<n> through writeFile. */
  behaviorFile?: string;
  onSimulation: (output: SimulationOutput) => void;
}

export interface SimulationStatistics {
  generatedStates: number;
  traces: number;
  levelMean: number;
  levelM2: number;
  seed: bigint;
  aril: bigint;
}

export type SimulationOutput =
  | { kind: "message"; code: number; level: MessageLevel; message: string; toolMessage: string }
  | {
      kind: "behavior";
      trace: TraceStep[];
      levels: number[];
      printedStates: string[];
      printFailure: string | undefined;
    }
  | { kind: "error-state"; state: Record<string, Value> }
  | CoverageOutput
  | TraceSpecOutput
  | { kind: "progress"; statistics: SimulationStatistics }
  | { kind: "summary"; statistics: SimulationStatistics };

interface TraceNode {
  state: Value[];
  action: SpecAction;
  predecessor: TraceNode | undefined;
  level: number;
  deferred?: (next: Value[]) => void;
  incomplete?: State;
}

interface WorkerError {
  code: number;
  message: string;
  toolMessage: string;
  node: TraceNode;
  isException: boolean;
  isSummarized: boolean;
  violation?: Violation;
  failures?: FailureMessage[];
  counterExample?: Value;
  traceSpec?: string;
}

interface SimulationWorker {
  id: number;
  random: JavaRandom;
  getRandom: () => JavaRandom;
  scheduler: ReturnType<typeof createScheduler>;
  traceCount: number;
  traceId: number;
  isRunning: boolean;
}

const FATAL_CODES = new Set<number>([
  MESSAGE_CODE.invariantEvaluationFailed,
  MESSAGE_CODE.actionPropertyEvaluationFailed,
  MESSAGE_CODE.incompleteSuccessor,
]);

// TLC's worker keeps simulating after an error until its main thread stops it, about 150 states later.
const STOP_DELAY_STATES = 150;

const INFINITE_DEPTH = 2147483647;

const RL_ALPHA = 0.3;
const RL_GAMMA = 0.7;
const RL_REWARD = -10;

const isIdentical = (left: Value, right: Value) => left === right;

// TLC's SimulationWorker#getTrace drops a step its TLCState#equals finds stuttering, which sorts the records it compares.
const isRepeatedState = (state: Value[], predecessor: Value[], order: number[]) => {
  for (let position = 0; position < order.length; position++) {
    const index = order[position];
    // Deviation from TLC: TLCState#equals fails on values it can't compare, such as a filter of Nat, so TLC's simulation reports that failure in place of the violation, or hangs. Such a value equals only itself here.
    if (!computeOnFailure(valuesEqual, isIdentical, state[index], predecessor[index])) {
      return false;
    }
  }
  return true;
};

const getTrace = (last: TraceNode, order: number[]) => {
  const trace: TraceNode[] = [];
  for (let node: TraceNode | undefined = last; node; node = node.predecessor) {
    const predecessor = node.predecessor;
    if (predecessor && isRepeatedState(node.state, predecessor.state, order)) continue;
    trace.unshift(node);
  }
  trace.forEach((node, index) => {
    node.predecessor = trace[index - 1];
    node.level = index + 1;
  });
  return trace;
};

const createScheduler = (
  scheduler: SimulationOptions["scheduler"],
  nextActions: SpecAction[],
  random: JavaRandom,
  getFingerprint: (state: Value[]) => bigint,
  getReward: (state: Value[] | undefined, next: Value[], fallback: number) => number,
) => {
  const qualities = nextActions.map(() => new Map<bigint | SpecAction, number>());
  const getQualityKey = (node: TraceNode) =>
    scheduler === "rlaction" ? node.action : getFingerprint(node.state);
  const getRewardOf = (node: TraceNode) =>
    getReward(node.predecessor?.state, node.state, RL_REWARD);
  return {
    getNextActionIndex: (node: TraceNode) => {
      if (scheduler === "random") {
        return Math.floor(random.nextDouble() * nextActions.length);
      }
      const key = getQualityKey(node);
      qualities.forEach((quality) => {
        if (!quality.has(key)) quality.set(key, 0);
      });
      const weights = qualities.map((quality) => Math.exp(quality.get(key) ?? 0));
      const total = weights.reduce((sum, weight) => sum + weight, 0);
      const ranked = weights
        .map((weight, index) => ({ index, weight: weight / total }))
        .sort((left, right) => right.weight - left.weight);
      const threshold = random.nextDouble();
      let cumulativeWeight = 0;
      const chosen = ranked.find((item, position) => {
        cumulativeWeight = position === 0 ? item.weight : cumulativeWeight + item.weight;
        return cumulativeWeight >= threshold;
      });
      return (chosen ?? ranked[ranked.length - 1]).index;
    },
    markDisabled: (index: number, node: TraceNode) => {
      if (scheduler === "random") return;
      // TLC's rlaction scheduler stores the reward, then overwrites it as the rl scheduler does.
      if (scheduler === "rlaction") getRewardOf(node);
      qualities[index].set(getQualityKey(node), -Number.MAX_VALUE);
    },
    learnTrace: (last: TraceNode) => {
      for (let node = last; node.predecessor; node = node.predecessor) {
        const key = getQualityKey(node);
        const maxQuality = qualities.reduce(
          (max, quality) => Math.max(max, quality.get(key) ?? -Number.MAX_VALUE),
          -Number.MAX_VALUE,
        );
        const quality = qualities[nextActions.indexOf(node.action)];
        const predecessorKey = getQualityKey(node.predecessor);
        quality.set(
          predecessorKey,
          (1 - RL_ALPHA) * (quality.get(predecessorKey) ?? 0) +
            RL_ALPHA * (getRewardOf(node) + RL_GAMMA * maxQuality),
        );
      }
    },
  };
};

export const simulate = (options: SimulationOptions & CliSettings): number => {
  const output = options.onSimulation;
  const capture = createOutputCapture(options.onPrint ?? console.log);
  const prepared = prepareSearch({ ...options, onPrint: capture.print });
  const config = prepared.config;
  const specification = prepared.specification;
  const environment = prepared.environment;
  const runtime = environment.runtime;
  capture.captureMessages(runtime, options.errorCodes);
  const search = prepared.search;
  const seed = options.seed ?? 0n;
  const traceDepth = options.traceDepth === -1 ? INFINITE_DEPTH : options.traceDepth;
  const traceLimit = options.traceCount ?? (1n << 63n) - 1n;
  const random = createJavaRandom(seed);
  for (let index = 0n; index < options.aril; index++) random.nextDouble();
  const statistics: SimulationStatistics = {
    generatedStates: 0,
    traces: 0,
    levelMean: 0,
    levelM2: 0,
    seed,
    aril: options.aril,
  };
  const reportMessage = (
    code: number,
    text: string,
    toolText = text,
    level: MessageLevel = MESSAGE_LEVEL.error,
  ) => output({ kind: "message", code, level, message: text, toolMessage: toolText });
  const reportCoverage = () => {
    const report = prepared.getCoverage();
    if (report) output({ kind: "coverage", coverage: report });
  };
  const nodes = new WeakMap<(Value | undefined)[], TraceNode>();
  const description = prepared.getDescription();
  const initActions = description.inits;
  const nextActions = description.actions;
  const workers = Array.from({ length: options.workers ?? 1 }, (_value, id): SimulationWorker => {
    const workerRandom = createJavaRandom(random.nextLong());
    const enumerableRandom = createJavaRandom(seed);
    return {
      id,
      random: workerRandom,
      getRandom: () => enumerableRandom,
      scheduler: createScheduler(
        options.scheduler,
        nextActions,
        workerRandom,
        runtime.getFingerprint,
        search.getReward,
      ),
      traceCount: 0,
      traceId: 0,
      isRunning: true,
    };
  });
  let worker = workers[0];
  const actionFlow = options.actionStatistics && {
    statistics: options.actionStatistics,
    actions: [...initActions, ...nextActions],
    initCount: initActions.length,
    actionStats: new Float64Array((initActions.length + nextActions.length) ** 2),
  };
  // TLC opens both files with FileUtil#newBFOS, which prints a failure before it rethrows it.
  const writeOutputFile = (path: string, content: string) => {
    try {
      options.writeFile?.(path, content);
    } catch (error) {
      if (error instanceof TlaFileError) {
        (options.onPrint ?? console.log)(`Error: Unable to write to file ${path}`);
      }
      throw error;
    }
  };
  const writeActionFlowGraph = () => {
    if (!actionFlow) return;
    try {
      writeOutputFile(`${specification.rootName}_actions.dot`, getActionFlowGraph(actionFlow));
    } catch (error) {
      if (!(error instanceof TlaFileError)) throw error;
      reportMessage(
        MESSAGE_CODE.reporterDied,
        "Progress report thread died.",
        undefined,
        MESSAGE_LEVEL.tlcBug,
      );
    }
  };
  const printSummary = () => {
    reportCoverage();
    writeActionFlowGraph();
    output({ kind: "summary", statistics: { ...statistics } });
  };
  const coverage = prepared.coverage;
  const covered = coverage && addActionCoverage(coverage, environment, description);
  // TLC's Simulator computes the initial states, prints the behaviors and checks the postcondition on its own thread, where TLCGet("diameter") is 0.
  let isOnWorker = false;
  // TLC's Simulator sets a register of every worker and reads the first worker's.
  const registers = workers.map(() => runtime.registers);
  const namedRegisters = workers.map(() => runtime.namedRegisters);
  const possibleCounts = workers.map(() => runtime.possibleCounts);
  let evaluatedAction: SpecAction | undefined;
  runtime.getSuccessorAction = () => evaluatedAction;
  runtime.getLevel = (state) => nodes.get(state)?.level ?? 0;
  runtime.getSimulationValue = (key, state) => {
    const node = state && nodes.get(state);
    switch (key) {
      case "diameter":
        return isOnWorker ? worker.traceCount + 1 : 0;
      case "generated":
      case "distinct":
      case "queue":
        throw new TlaModuleError(`TLCGet(${key}) was undefined.`);
      case "action":
        return node && toActionValue(node.action);
      case "all":
        return workers.length > 1 ? getRegisterFunction(registers) : undefined;
      case "all:named":
        return workers.length > 1
          ? getRegisterFunction(
              workers.map((other) =>
                getNamedRegisters({
                  namedRegisters: namedRegisters[other.id],
                  possibleCounts: possibleCounts[other.id],
                }),
              ),
            )
          : undefined;
      case "config":
        return createTlcRecord([
          ["mode", options.isGenerating ? "generate" : "simulate"],
          ["depth", traceDepth === INFINITE_DEPTH ? -1 : traceDepth],
          ["traces", Number(BigInt.asIntN(32, BigInt(workers.length) * traceLimit))],
          ["deadlock", config.checkDeadlock],
          ["seed", String(seed)],
          ["aril", String(options.aril)],
          ["worker", workers.length],
          ["install", "unknown"],
          ["sched", options.scheduler],
        ]);
      case "stats": {
        const actions = new Map<string, number>();
        for (let step = node; step && step.level > 1; step = step.predecessor) {
          actions.set(step.action.name, (actions.get(step.action.name) ?? 0) + 1);
        }
        // TLC's SimulationWorker counts the actions of a behavior in a HashMap.
        const counts = getHashMapOrder([...actions.keys()], getJavaHashCode).map(
          (name): [string, Value] => [name, actions.get(name) ?? 0],
        );
        return createTlcRecord([
          ["traces", statistics.traces],
          ["duration", Math.floor((Date.now() - runtime.startedAt) / 1000)],
          ["generated", statistics.generatedStates],
          [
            "behavior",
            createTlcRecord([
              ["actions", createTlcRecord(counts)],
              ["id", worker.traceId],
            ]),
          ],
          ["worker", isOnWorker ? worker.id : 0],
          ["distinct", -1],
          ["distinctvalues", -1],
          ["retries", -1],
          ["actions", createRecord([])],
          ["levelmean", statistics.levelMean],
          ["levelvariance", Math.round(statistics.levelM2 / (statistics.traces + 1))],
        ]);
      }
    }
    return undefined;
  };
  runtime.isStarted = true;
  runtime.getBehavior = (state) => {
    const node = nodes.get(state);
    return node ? getTrace(node, search.getTlcOrder()).map((step) => step.state) : [state];
  };
  const reportPostcondition = () => {
    const postcondition = search.findPostconditionViolation();
    if (!postcondition) return undefined;
    if (postcondition.counts !== undefined) (options.onPrint ?? console.log)(postcondition.counts);
    reportMessage(
      postcondition.code,
      postcondition.message,
      formatInnerMessage(postcondition.code, postcondition.message, true),
    );
    return postcondition;
  };
  const livenessChecks = withLivenessChecksExitCode(() =>
    withUnexpectedException(() =>
      createLivenessChecks(search.properties.liveness, search.spec.temporals, environment),
    ),
  );
  const branches = livenessChecks?.solutions.length;
  if (branches) options.onProgress?.({ kind: "liveness-prepared", branches });
  const assumptionStatus = reportAssumptionViolation(
    specification.assumptions,
    environment,
    reportMessage,
  );
  if (assumptionStatus !== undefined) return assumptionStatus;
  const initAction = initActions[initActions.length - 1];
  const toNode = (state: Value[], action: SpecAction, predecessor: TraceNode | undefined) => {
    const node: TraceNode = { state, action, predecessor, level: (predecessor?.level ?? 0) + 1 };
    nodes.set(state, node);
    return node;
  };
  const toRecord = (state: (Value | undefined)[]) =>
    search.toRecord(state.map((value) => value ?? createModelValue("null")));
  const toTraceSteps = (
    trace: TraceNode[],
    positions = trace.map((_node, index) => index),
    isAliased = true,
  ): TraceStep[] =>
    positions.map((position) => {
      const node = trace[position];
      const successor = trace[position + 1] ?? node;
      return {
        action: node.action.name,
        label: getActionLabel(node.action, options.version, node.level === 1),
        state:
          config.alias === undefined || !isAliased
            ? toRecord(node.state)
            : search.evaluateAlias(
                config.alias,
                node.incomplete ?? node.state,
                successor.incomplete ?? successor.state,
                options.isTool ?? false,
              ),
      };
    });
  const getCounterExample = (
    trace: TraceNode[],
    steps = toTraceSteps(trace),
    loop?: CounterExampleLoop,
  ) =>
    createCounterExample(
      steps.map((step) => step.state),
      trace.slice(1).map((node) => toActionValue(node.action)),
      loop,
    );
  // TLC's Simulator binds CounterExample to an initial state that violates an invariant, not to its alias.
  const getInitialCounterExample = (node: TraceNode) =>
    createCounterExample([toRecord(node.state)], [], undefined);

  const initialStates: TraceNode[] = [];
  const isComplete = (state: (Value | undefined)[]): state is Value[] =>
    state.every((value) => value !== undefined);
  const generated: (Value | undefined)[][] = [];
  const reportInitialException = (error: unknown, state: Value[] | undefined) => {
    const failure = toEvaluationError(error);
    if (!state) {
      reportMessage(
        MESSAGE_CODE.general,
        `${getUnexpectedPrefix(failure)}${failure.message}`,
        `${getUnexpectedPrefix(failure)}${formatNestedMessage(failure.message, true)}`,
      );
      printSummary();
      return EXIT_STATUS.error;
    }
    const text = getFailureMessage(failure, false);
    const initial = `While working on the initial state:\n${formatErrorState(toRecord(state))}`;
    reportMessage(
      MESSAGE_CODE.initialState,
      `${text.message}\n${initial}`,
      `${text.toolMessage}\n${initial}`,
    );
    printSummary();
    return getMessageExitStatus(MESSAGE_CODE.initialState);
  };
  const init = search.spec.init;
  const addGenerated = (state: (Value | undefined)[]) => {
    if (generated.length === getSetBound()) throw new TlaTooManyStatesError();
    generated.push(state);
    return false;
  };
  try {
    if (covered) {
      replayInitialStates(covered.inits, environment, addGenerated, (partial) =>
        addGenerated([...partial]),
      );
    } else if (init) {
      forEachInitialState(
        init,
        environment,
        addGenerated,
        search.spec.scope,
        search.spec.initPredicates,
        addGenerated,
      );
    }
  } catch (error) {
    return reportInitialException(error, undefined);
  }
  statistics.generatedStates = generated.length;
  reportMessage(
    MESSAGE_CODE.computingInitProgress,
    `Computed ${generated.length} initial states...`,
    undefined,
    MESSAGE_LEVEL.none,
  );
  const generatedNodes: TraceNode[] = [];
  for (const state of generated) {
    if (!isComplete(state)) {
      reportMessage(
        MESSAGE_CODE.initialStateIncomplete,
        `State is not completely specified by the initial predicate:\n${formatState(toRecord(state))}`,
      );
      return EXIT_STATUS.error;
    }
    try {
      const node = toNode(state, initAction, undefined);
      const violated = search.findViolatedInvariant(state);
      if (violated) {
        const alias = toTraceSteps([node])[0].state;
        reportMessage(
          MESSAGE_CODE.invariantViolatedInitial,
          `Invariant ${violated.name} is violated by the initial state:\n${formatState(alias)}`,
        );
        runtime.counterExample = getInitialCounterExample(node);
        reportPostcondition();
        return EXIT_STATUS.safetyViolation;
      }
      generatedNodes.push(node);
      if (search.satisfiesConstraints(state)) {
        search.trackStatePossible(state);
        initialStates.push(node);
      }
    } catch (error) {
      return reportInitialException(error, state);
    }
  }
  if (generated.length === 0) {
    reportMessage(
      MESSAGE_CODE.noInitialStates,
      "There is no state satisfying the initial state predicate.",
    );
    return EXIT_STATUS.error;
  }
  if (initialStates.length === 0) {
    reportMessage(
      MESSAGE_CODE.noInitialStatesInModel,
      "There is no state satisfying the initial state predicate and the state-constraint(s).",
    );
    return EXIT_STATUS.error;
  }
  // Deviation from TLC: its simulator checks no implied init, tla-ts checks them after TLC's own checks of the initial states.
  for (const node of generatedNodes) {
    try {
      const predicate = search.findFailedInitialPredicate(node.state);
      if (predicate) {
        const alias = toTraceSteps([node])[0].state;
        reportMessage(
          MESSAGE_CODE.propertyViolatedInitial,
          `Property ${predicate.name} is violated by the initial state:\n${formatState(alias)}`,
        );
        runtime.counterExample = getInitialCounterExample(node);
        reportPostcondition();
        return EXIT_STATUS.livenessViolation;
      }
    } catch (error) {
      return reportInitialException(error, node.state);
    }
  }
  reportMessage(
    MESSAGE_CODE.initGenerated1,
    `Finished computing initial states: ${initialStates.length} distinct state generated at ${formatTlcDate(new Date())}.`,
    undefined,
    MESSAGE_LEVEL.none,
  );
  // TLC's Simulator deep-normalizes the initial states, which sorts their records.
  initialStates.forEach((node) => node.state.forEach(markNormalized));

  const toWorkerError = (code: number, text: string, node: TraceNode): WorkerError => ({
    code,
    message: text,
    toolMessage: text,
    node,
    isException: false,
    isSummarized: true,
  });
  const generator = options.isGenerating ? { random: worker.random, kept: 0 } : undefined;
  const getSuccessors = (current: TraceNode, index: number) => {
    const action = nextActions[index];
    const coveredAction = covered?.actions[index];
    const keptSuccessors: TraceNode[] = [];
    if (generator) generator.kept = 0;
    let failure: WorkerError | undefined;
    runtime.deferred = undefined;
    evaluatedAction = action;
    const visit = (successor: Successor) => {
      const node = toNode(successor.state, action, current);
      node.deferred = runtime.deferred;
      runtime.deferred = undefined;
      statistics.generatedStates++;
      try {
        const violated = search.findViolatedInvariant(node.state, current.state);
        if (violated) {
          failure = toWorkerError(
            MESSAGE_CODE.invariantViolatedBehavior,
            `Invariant ${violated.name} is violated.`,
            node,
          );
          return true;
        }
        const property = search.findViolatedActionProperty(current.state, node.state);
        if (property) {
          failure = toWorkerError(
            MESSAGE_CODE.actionPropertyViolatedBehavior,
            `Action property ${property.name} is violated.`,
            node,
          );
          return true;
        }
      } catch (error) {
        if (!(error instanceof TlaEvaluationError) || !isHeadedError(error)) throw error;
        const text = getFailureMessage(error, true);
        failure = {
          ...toWorkerError(text.code, text.message, node),
          toolMessage: text.toolMessage,
        };
        return true;
      }
      if (!search.satisfiesConstraints(node.state, current.state)) return false;
      search.trackStatePossible(node.state);
      if (!search.satisfiesActionConstraints(current.state, node.state)) return false;
      search.trackActionPossible(current.state, node.state);
      if (keptSuccessors.length === getSetBound()) throw new TlaTooManyStatesError();
      if (coverage && coveredAction) coverage.secondary[coveredAction.node]++;
      keptSuccessors.push(node);
      if (generator) generator.kept++;
      return false;
    };
    try {
      if (coverage && coveredAction) {
        walkCoveredSuccessors(
          coverage,
          coveredAction,
          current.state,
          environment,
          (state) => {
            if (visit({ state, action: action.name })) throw STOP_WALK;
          },
          undefined,
          generator,
        );
      } else {
        forEachSuccessor(
          action.expression,
          current.state,
          environment,
          visit,
          action.scope,
          generator,
        );
      }
    } catch (error) {
      if (error === STOP_WALK) return { successors: keptSuccessors, error: failure };
      if (!(error instanceof TlaIncompleteSuccessorError)) throw error;
      const node = toNode(
        error.state.map((value) => value ?? createModelValue("null")),
        action,
        current,
      );
      node.incomplete = error.state;
      const text = getIncompleteSuccessorMessage(
        error.variables,
        action.name,
        nextActions.length,
        options.version,
      );
      return {
        successors: keptSuccessors,
        error: toWorkerError(MESSAGE_CODE.incompleteSuccessor, text, node),
      };
    }
    return { successors: keptSuccessors, error: failure };
  };
  let currentNode = initialStates[0];
  let hasLivenessViolation = false;
  const getTemporalViolation = (last: TraceNode): WorkerError | undefined => {
    if (!livenessChecks) return undefined;
    const trace = getTrace(last, search.getTlcOrder());
    const found = livenessChecks.findTraceViolation(
      trace.map((node) => node.state),
      trace.map((node) => runtime.getFingerprint(node.state)),
    );
    // TLC's workers share LiveCheck1's errorFound, so a worker that finds a violation after another's carries on.
    if (!found || hasLivenessViolation) return undefined;
    hasLivenessViolation = true;
    const back = found.backPosition === undefined ? undefined : trace[found.backPosition];
    const lasso = found.positions.map((position) => trace[position]);
    const loopStart = back ? found.cyclePosition - 1 : lasso.length - 1;
    // Deviation from TLC: LiveCheck1#printErrorTrace gives the ALIAS each state's predecessor as its successor, which throws a NullPointerException at the initial state.
    // Deviation from TLC: LiveCheck1#printErrorTrace rebuilds the cycle from aliased states, which throws a NullPointerException for an ALIAS that drops a variable.
    const steps = toTraceSteps(lasso);
    const loopAction = back ? toActionValue(back.action) : createActionRecord(undefined);
    return {
      ...toWorkerError(MESSAGE_CODE.temporalPropertyViolated, "", last),
      isException: true,
      violation: {
        name: found.properties[0],
        properties: found.properties,
        trace: steps,
        loopStart,
        loopLabel: back && getActionLabel(back.action, options.version, back.level === 1),
      },
      failures: found.failures.map((failure) => toException(failure, last)),
      counterExample: getCounterExample(lasso, steps, { start: loopStart, action: loopAction }),
      traceSpec: prepared.getTraceSpec?.(
        lasso.map((node) => formatTraceSpecState(toRecord(node.state))),
        loopStart,
      ),
    };
  };
  const simulateTrace = (): WorkerError | "stopped" | undefined => {
    const workerRandom = worker.random;
    const scheduler = worker.scheduler;
    currentNode = initialStates[Math.floor(workerRandom.nextDouble() * initialStates.length)];
    let currentActionId = initActions.length - 1;
    for (let depth = 0; depth < traceDepth; depth++) {
      if (runtime.isStopped) return "stopped";
      let actionIndex = scheduler.getNextActionIndex(currentNode);
      const prime = nextPrime(workerRandom);
      let successors: TraceNode[] = [];
      for (let attempt = 0; attempt < nextActions.length; attempt++) {
        const result = getSuccessors(currentNode, actionIndex);
        // Deviation from TLC: TLCSet("exit") interrupts TLC's SimulationWorker, whose BlockingQueue#put then drops a violation found in the same step.
        if (result.error) return result.error;
        successors = result.successors;
        if (successors.length > 0) break;
        scheduler.markDisabled(actionIndex, currentNode);
        actionIndex = (actionIndex + prime) % nextActions.length;
      }
      if (successors.length === 0) {
        if (config.checkDeadlock) {
          return toWorkerError(MESSAGE_CODE.deadlockReached, "Deadlock reached.", currentNode);
        }
        break;
      }
      currentNode = successors[Math.floor(workerRandom.nextDouble() * successors.length)];
      currentNode.deferred?.(currentNode.state);
      if (actionFlow) {
        const nextActionId = initActions.length + actionIndex;
        actionFlow.actionStats[currentActionId * actionFlow.actions.length + nextActionId]++;
        currentActionId = nextActionId;
      }
    }
    if (runtime.isStopped) return "stopped";
    const violation = getTemporalViolation(currentNode);
    if (violation) return violation;
    const length = Math.min(traceDepth, currentNode.level);
    const delta = length - statistics.levelMean;
    statistics.levelMean += Math.trunc(delta / Math.max(statistics.traces, 1));
    statistics.levelM2 += delta * (length - statistics.levelMean);
    // Deviation from TLC: it learns after file= drops the stuttering steps, and RLSimulationWorker#postTrace then walks past the initial state into a NullPointerException.
    if (options.scheduler === "rl") scheduler.learnTrace(currentNode);
    if (options.behaviorFile !== undefined) {
      const fileName = `${options.behaviorFile}_${worker.id}_${worker.traceCount}`;
      const states = getTrace(currentNode, search.getTlcOrder()).map(
        (node, index) =>
          `\\* <${getActionLabel(node.action, options.version)}>\nSTATE_${index + 1} == \n${formatState(toRecord(node.state))}\n\n`,
      );
      writeOutputFile(
        fileName,
        `---------------- MODULE ${fileName} -----------------\n${states.join("")}=================================================\n`,
      );
    }
    return undefined;
  };
  const toException = (error: unknown, node: TraceNode): WorkerError => {
    const failure = toEvaluationError(error);
    const coded = isEvalException(failure) ? undefined : getCodedMessage(failure.message);
    if (coded) {
      return {
        code: coded.code,
        message: failure.message,
        toolMessage: formatInnerMessage(coded.code, failure.message, true),
        node,
        isException: true,
        isSummarized: false,
      };
    }
    const prefix = getUnexpectedPrefix(failure);
    return {
      code: MESSAGE_CODE.general,
      message: `${prefix}${failure.message}`,
      toolMessage: `${prefix}${formatNestedMessage(failure.message, true)}`,
      node,
      isException: true,
      isSummarized: prefix !== UNEXPECTED_EXCEPTION,
    };
  };

  const isUnfingerprintable = (viewState: Value[]) =>
    viewState.some((value) => getFingerprintError(value) !== undefined);
  // Deviation from TLC: Simulator#printBehavior compares fingerprints, so a state or VIEW whose value such as Nat can't be fingerprinted crashes TLC under -difftrace.
  const isRepeatedFingerprint = (current: Value[], last: Value[]) => {
    const currentView = search.getViewState(current);
    const lastView = search.getViewState(last);
    if (!isUnfingerprintable(currentView) && !isUnfingerprintable(lastView)) {
      return search.getViewFingerprint(currentView) === search.getViewFingerprint(lastView);
    }
    return currentView.every((value, index) =>
      computeOnFailure(valuesEqual, isIdentical, value, lastView[index]),
    );
  };
  const getDiffTracePositions = (trace: TraceNode[]) => {
    const positions = [0];
    for (let position = 1; position < trace.length; position++) {
      const current = trace[position].state;
      const last = trace[position - 1].state;
      try {
        // Deviation from TLC: TLCStateMut#fingerPrint throws a NullPointerException on the incomplete state of a successor error.
        if (trace[position].incomplete || !isRepeatedFingerprint(current, last)) {
          positions.push(position);
        }
      } catch (error) {
        return { positions, failure: toException(error, trace[position]) };
      }
    }
    return { positions, failure: undefined };
  };
  const printBehavior = (trace: TraceNode[], positions: number[]) => {
    if (traceDepth === INFINITE_DEPTH) {
      // TLC prints the error state of an unbounded behavior alone, as TLCState#toString does, without the alias.
      output({ kind: "error-state", state: toRecord(trace[trace.length - 1].state) });
      return;
    }
    const steps: TraceStep[] = [];
    const printedStates: string[] = [];
    const traceSpecStates: Record<string, string>[] = [];
    let printFailure: string | undefined;
    for (const position of positions) {
      const node = trace[position];
      const captured = capture.captureOutput(() => toTraceSteps(trace, [position])[0]);
      const step =
        captured.lines.length > 0
          ? { ...captured.result, aliasOutput: captured.lines }
          : captured.result;
      steps.push(step);
      try {
        printedStates.push(
          formatFingerprintedState(
            step.state,
            options.isDiffTrace && steps.length > 1
              ? getDiffBase(step.state, steps[steps.length - 2].state)
              : undefined,
            // TLC fingerprints only a state with every variable assigned, and an alias through the variables it binds.
            node.incomplete === undefined &&
              environment.variables.every((name) => Object.hasOwn(step.state, name))
              ? environment.variables.map((name) => step.state[name])
              : [],
          ),
        );
      } catch (error) {
        printFailure = getTracePrintFailure(error);
        break;
      }
      if (prepared.getTraceSpec) traceSpecStates.push(formatTraceSpecState(toRecord(node.state)));
    }
    output({
      kind: "behavior",
      trace: steps,
      levels: positions.map((position) => trace[position].level),
      printedStates,
      printFailure,
    });
    const traceSpec = prepared.getTraceSpec?.(
      positions.map(
        (position, index) =>
          traceSpecStates[index] ?? formatTraceSpecState(toRecord(trace[position].state)),
      ),
      undefined,
    );
    if (traceSpec !== undefined) output({ kind: "trace-spec", text: traceSpec });
  };

  const getSimulatorRandom = runtime.getRandom;
  for (let index = 1; index < workers.length; index++) {
    registers[index] = new Map(registers[0]);
    namedRegisters[index] = new Map(namedRegisters[0]);
    possibleCounts[index] = new Map(possibleCounts[0]);
  }
  const initialCounts = new Map(possibleCounts[0]);
  runtime.sumPossibleCounts = () => {
    const totals = new Map(possibleCounts[0]);
    for (let index = 1; index < workers.length; index++) {
      for (const [name, count] of possibleCounts[index]) {
        // Deviation from TLC: _Possible#counts adds the Simulator's counts of the initial states once per worker, as each worker starts from a copy.
        totals.set(name, (totals.get(name) ?? 0) + count - (initialCounts.get(name) ?? 0));
      }
    }
    return totals;
  };
  const errors: WorkerError[] = [];
  const isContinued = options.isContinued ?? false;
  isOnWorker = true;
  let stoppedStates: number | undefined;
  let runningWorkers = workers.length;
  const startTrace = (started: SimulationWorker) => {
    statistics.traces++;
    started.traceId = statistics.traces;
  };
  // TLC's workers race, so tla-ts starts every worker's first behavior and then finishes one behavior per worker in turn, as workers of the same speed would.
  workers.forEach(startTrace);
  while (true) {
    runtime.getRandom = worker.getRandom;
    runtime.registers = registers[worker.id];
    runtime.namedRegisters = namedRegisters[worker.id];
    runtime.possibleCounts = possibleCounts[worker.id];
    if (generator) generator.random = worker.random;
    const outcome = (() => {
      try {
        return simulateTrace();
      } catch (error) {
        return toException(error, currentNode);
      }
    })();
    if (outcome === "stopped") break;
    worker.traceCount++;
    if (outcome) errors.push(outcome);
    worker.isRunning = !outcome?.isException && BigInt(worker.traceCount) < traceLimit;
    if (worker.isRunning) startTrace(worker);
    else runningWorkers--;
    if (runningWorkers === 0) break;
    const isStopping =
      outcome !== undefined &&
      (outcome.isException || !isContinued || FATAL_CODES.has(outcome.code));
    if (isStopping && stoppedStates === undefined) stoppedStates = statistics.generatedStates;
    if (
      stoppedStates !== undefined &&
      statistics.generatedStates - stoppedStates >= STOP_DELAY_STATES
    ) {
      break;
    }
    do worker = workers[(worker.id + 1) % workers.length];
    while (!worker.isRunning);
  }
  isOnWorker = false;
  runtime.getRandom = getSimulatorRandom;
  runtime.registers = registers[0];
  runtime.namedRegisters = namedRegisters[0];
  runtime.possibleCounts = possibleCounts[0];
  runtime.setEveryWorkerRegister = (key, value) => {
    for (let index = 0; index < workers.length; index++) {
      if (typeof key === "number") registers[index].set(key, value);
      else namedRegisters[index].set(key, value);
    }
  };
  const printed = errors.findIndex(
    (error) => error.isException || !isContinued || FATAL_CODES.has(error.code),
  );
  const reported = printed === -1 ? errors : errors.slice(0, printed + 1);
  const trailing = errors.slice(printed + 1).find((error) => error.violation);
  // TLC's LiveCheck1 prints the violation a worker finds after the error the Simulator reported, without the Simulator's summary.
  const printedErrors = trailing ? [...reported, { ...trailing, isSummarized: false }] : reported;
  for (const error of printedErrors) {
    if (error.violation) {
      error.failures?.forEach((failure) =>
        reportMessage(failure.code, failure.message, failure.toolMessage),
      );
      options.onProgress?.({
        kind: "violation",
        status: "liveness-violation",
        violation: error.violation,
      });
      if (error.isSummarized) printSummary();
      if (error.traceSpec !== undefined) output({ kind: "trace-spec", text: error.traceSpec });
      continue;
    }
    reportMessage(error.code, error.message, error.toolMessage);
    const trace = getTrace(error.node, search.getTlcOrder());
    // Deviation from TLC: StatePrinter fingerprints each state it prints, so a state whose VIEW, function or value such as Nat fails to fingerprint crashes TLC without -difftrace too.
    const shown =
      options.isDiffTrace && traceDepth !== INFINITE_DEPTH
        ? getDiffTracePositions(trace)
        : { positions: trace.map((_node, index) => index), failure: undefined };
    printBehavior(trace, shown.positions);
    const failure = shown.failure;
    if (failure) {
      reportMessage(failure.code, failure.message, failure.toolMessage);
      return getMessageExitStatus(failure.code);
    }
    const omitted = trace.length - shown.positions.length;
    if (omitted > 0) {
      reportMessage(
        MESSAGE_CODE.general,
        `difftrace requested: Shortened behavior by omitting finite stuttering (${omitted} states), which is an artifact of simulation mode.\n`,
        undefined,
        MESSAGE_LEVEL.none,
      );
    }
    if (error.isSummarized) printSummary();
  }
  // Deviation from TLC: under -continue, Simulator#simulate keeps the worker's last result, a success, so TLC exits 0 after a violation and prints the summary again; tla-ts exits with the first violation's status, as check() does.
  const last = reported[reported.length - 1];
  const decisive = printed === -1 ? reported[0] : last;
  const errorStatus = decisive ? getMessageExitStatus(decisive.code) : EXIT_STATUS.success;
  if (last) {
    runtime.counterExample =
      last.counterExample ?? getCounterExample(getTrace(last.node, search.getTlcOrder()));
  }
  const postcondition = reportPostcondition();
  const postconditionStatus = postcondition
    ? getMessageExitStatus(postcondition.code)
    : EXIT_STATUS.success;
  const status = Math.max(errorStatus, postconditionStatus);
  output({ kind: "progress", statistics: { ...statistics } });
  // TLC's ProgressReport prints the coverage again with its last progress unless -coverage spans more progress reports.
  if (options.coverage !== undefined && options.coverage <= 1) reportCoverage();
  writeActionFlowGraph();
  if (status === EXIT_STATUS.success) printSummary();
  return status;
};

const toEvaluationError = (error: unknown) => {
  if (isStackOverflow(error)) return new TlaStackOverflowError();
  if (!(error instanceof TlaEvaluationError)) throw error;
  return error;
};

const getUnexpectedPrefix = (error: TlaEvaluationError) =>
  isEvalException(error)
    ? UNEXPECTED_EVAL_EXCEPTION
    : error instanceof TlaSetBoundError
      ? WRONG_INVOCATION_EXCEPTION
      : error instanceof TlaFileError
        ? FILE_NOT_FOUND_EXCEPTION
        : UNEXPECTED_EXCEPTION;
