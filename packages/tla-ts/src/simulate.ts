import type { CheckOptions, TraceStep, Violation } from "./check";
import type { CoverageOutput } from "./coverage";
import {
  isStackOverflow,
  TlaEvaluationError,
  TlaIncompleteSuccessorError,
  TlaModuleError,
  TlaStackOverflowError,
  TlaTooManyStatesError,
  TlaUnsupportedError,
  TlaSetBoundError,
  UNEXPECTED_EVAL_EXCEPTION,
  UNEXPECTED_EXCEPTION,
  WRONG_INVOCATION_EXCEPTION,
} from "./errors";
import type { State } from "./evaluate";
import { EXIT_STATUS, getMessageExitStatus, withLivenessChecksExitCode } from "./exit-codes";
import { getHashMapOrder } from "./java-hash";
import { createLivenessChecks } from "./liveness-checker";
import {
  addActionCoverage,
  createOutputCapture,
  getIncompleteSuccessorMessage,
  prepareSearch,
  reportAssumptionViolation,
  STOP_WALK,
  walkCoveredSuccessors,
  type CliSettings,
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
  withUnexpectedException,
  type FailureMessage,
} from "./tlc/messages";
import { createJavaRandom, nextPrime, type JavaRandom } from "./tlc/random";
import { replayInitialStates } from "./tlc/replay";
import {
  createActionRecord,
  createCounterExample,
  createTlcRecord,
  type CounterExampleLoop,
} from "./tlc/tlcext-operators";
import {
  computeLikeTlcOnFailure,
  createModelValue,
  createRecord,
  formatState,
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
  | { kind: "message"; code: number; isError: boolean; message: string; toolMessage: string }
  | { kind: "behavior"; trace: TraceStep[]; levels: number[]; isLastStateOnly: boolean }
  | CoverageOutput
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
}

const FATAL_CODES = new Set<number>([
  MESSAGE_CODE.invariantEvaluationFailed,
  MESSAGE_CODE.actionPropertyEvaluationFailed,
  MESSAGE_CODE.incompleteSuccessor,
]);

const INFINITE_DEPTH = 2147483647;

const RL_ALPHA = 0.3;
const RL_GAMMA = 0.7;
const RL_REWARD = -10;

const isUnequal = () => false;

// TLC's SimulationWorker#getTrace drops a step its TLCState#equals finds stuttering, which sorts the records it compares.
const isRepeatedState = (state: Value[], predecessor: Value[], order: number[]) => {
  for (let position = 0; position < order.length; position++) {
    const index = order[position];
    // Deviation from TLC: TLCState#equals fails on values it can't compare, so TLC's simulation reports that failure in place of the violation, or hangs.
    if (!computeLikeTlcOnFailure(valuesEqual, isUnequal, state[index], predecessor[index])) {
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
  const workerRandom = createJavaRandom(random.nextLong());
  const statistics: SimulationStatistics = {
    generatedStates: 0,
    traces: 0,
    levelMean: 0,
    levelM2: 0,
    seed,
    aril: options.aril,
  };
  const reportMessage = (code: number, text: string, toolText = text, isError = true) =>
    output({ kind: "message", code, isError, message: text, toolMessage: toolText });
  const reportCoverage = () => {
    const report = prepared.getCoverage();
    if (report) output({ kind: "coverage", coverage: report });
  };
  const printSummary = () => {
    reportCoverage();
    output({ kind: "summary", statistics: { ...statistics } });
  };
  const nodes = new WeakMap<(Value | undefined)[], TraceNode>();
  const description = prepared.getDescription();
  const initActions = description.inits;
  const nextActions = description.actions;
  const coverage = prepared.coverage;
  const covered = coverage && addActionCoverage(coverage, environment, description);
  let traceCount = 0;
  let currentTrace = 0;
  // TLC's Simulator computes the initial states, prints the behaviors and checks the postcondition on its own thread, where TLCGet("diameter") is 0.
  let isOnWorker = false;
  let evaluatedAction: SpecAction | undefined;
  runtime.getSuccessorAction = () => evaluatedAction;
  runtime.getLevel = (state) => nodes.get(state)?.level ?? 0;
  runtime.getSimulationValue = (key, state) => {
    const node = state && nodes.get(state);
    switch (key) {
      case "diameter":
        return isOnWorker ? traceCount + 1 : 0;
      case "generated":
      case "distinct":
      case "queue":
        throw new TlaModuleError(`TLCGet(${key}) was undefined.`);
      case "action":
        return node && toActionValue(node.action);
      case "config":
        return createTlcRecord([
          ["mode", options.isGenerating ? "generate" : "simulate"],
          ["depth", traceDepth === INFINITE_DEPTH ? -1 : traceDepth],
          ["traces", Number(BigInt.asIntN(32, traceLimit))],
          ["deadlock", config.checkDeadlock],
          ["seed", String(seed)],
          ["aril", String(options.aril)],
          ["worker", 1],
          ["install", "unknown"],
          ["sched", options.scheduler],
        ]);
      case "stats": {
        const actions = new Map<string, number>();
        for (let step = node; step && step.level > 1; step = step.predecessor) {
          actions.set(step.action.name, (actions.get(step.action.name) ?? 0) + 1);
        }
        // TLC's SimulationWorker counts the actions of a behavior in a HashMap.
        const counts = getHashMapOrder([...actions.keys()]).map((name): [string, Value] => [
          name,
          actions.get(name) ?? 0,
        ]);
        return createTlcRecord([
          ["traces", statistics.traces],
          ["duration", Math.floor((Date.now() - runtime.startedAt) / 1000)],
          ["generated", statistics.generatedStates],
          [
            "behavior",
            createTlcRecord([
              ["actions", createTlcRecord(counts)],
              ["id", currentTrace],
            ]),
          ],
          ["worker", 0],
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
  if (!search) {
    throw new TlaUnsupportedError("tla-ts can't simulate a specification without variables");
  }
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
    const initial = `While working on the initial state:\n${formatState(toRecord(state))}`;
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
    false,
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
    false,
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
  const generator = options.isGenerating ? { random: workerRandom, kept: 0 } : undefined;
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
  const scheduler = createScheduler(
    options.scheduler,
    nextActions,
    workerRandom,
    runtime.getFingerprint,
    search.getReward,
  );
  const getTemporalViolation = (last: TraceNode): WorkerError | undefined => {
    if (!livenessChecks) return undefined;
    const trace = getTrace(last, search.getTlcOrder());
    // TLC's LiveCheck#checkTrace fingerprints each state, which sorts its records.
    for (let position = 0; position < trace.length; position++) {
      trace[position].state.forEach(markNormalized);
    }
    const found = livenessChecks.findTraceViolation(
      trace.map((node) => node.state),
      trace.map((node) => runtime.getFingerprint(node.state)),
    );
    if (!found) return undefined;
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
    };
  };
  const simulateTrace = (): WorkerError | "stopped" | undefined => {
    currentNode = initialStates[Math.floor(workerRandom.nextDouble() * initialStates.length)];
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
    }
    if (runtime.isStopped) return "stopped";
    const violation = getTemporalViolation(currentNode);
    if (violation) return violation;
    const length = Math.min(traceDepth, currentNode.level);
    const delta = length - statistics.levelMean;
    statistics.levelMean += Math.trunc(delta / Math.max(statistics.traces, 1));
    statistics.levelM2 += delta * (length - statistics.levelMean);
    if (options.scheduler === "rl") scheduler.learnTrace(currentNode);
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

  const getDiffTracePositions = (trace: TraceNode[]) => {
    const positions = [0];
    for (let position = 1; position < trace.length; position++) {
      const current = trace[position].state;
      const last = trace[position - 1].state;
      current.forEach(markNormalized);
      last.forEach(markNormalized);
      try {
        // Deviation from TLC: TLCStateMut#fingerPrint throws a NullPointerException on the incomplete state of a successor error.
        if (
          trace[position].incomplete ||
          runtime.getFingerprint(current) !== runtime.getFingerprint(last)
        ) {
          positions.push(position);
        }
      } catch (error) {
        return { positions, failure: toException(error, trace[position]) };
      }
    }
    return { positions, failure: undefined };
  };

  const getSimulatorRandom = runtime.getRandom;
  const enumerableRandom = createJavaRandom(seed);
  runtime.getRandom = () => enumerableRandom;
  const errors: WorkerError[] = [];
  const isContinued = options.isContinued ?? false;
  isOnWorker = true;
  while (true) {
    statistics.traces++;
    currentTrace = statistics.traces;
    const outcome = (() => {
      try {
        return simulateTrace();
      } catch (error) {
        return toException(error, currentNode);
      }
    })();
    if (outcome === "stopped") break;
    traceCount++;
    if (outcome) errors.push(outcome);
    if (outcome?.isException) break;
    if (BigInt(traceCount) >= traceLimit) break;
    // TLC's worker starts one more behavior before the Simulator stops it, unless traces are bounded.
    const isStopping = outcome !== undefined && (!isContinued || FATAL_CODES.has(outcome.code));
    if (isStopping && options.traceCount === undefined) {
      statistics.traces++;
      break;
    }
  }
  isOnWorker = false;
  runtime.getRandom = getSimulatorRandom;
  const printed = errors.findIndex(
    (error) => error.isException || !isContinued || FATAL_CODES.has(error.code),
  );
  const reported = printed === -1 ? errors : errors.slice(0, printed + 1);
  for (const error of reported) {
    if (error.violation) {
      error.failures?.forEach((failure) =>
        reportMessage(failure.code, failure.message, failure.toolMessage),
      );
      options.onProgress?.({
        kind: "violation",
        status: "liveness-violation",
        violation: error.violation,
      });
      printSummary();
      continue;
    }
    reportMessage(error.code, error.message, error.toolMessage);
    const trace = getTrace(error.node, search.getTlcOrder());
    const isLastStateOnly = traceDepth === INFINITE_DEPTH;
    // Deviation from TLC: StatePrinter fingerprints each state it prints, so a state whose VIEW or function fails to fingerprint crashes TLC without -difftrace too.
    const shown =
      options.isDiffTrace && !isLastStateOnly
        ? getDiffTracePositions(trace)
        : { positions: trace.map((_node, index) => index), failure: undefined };
    output({
      kind: "behavior",
      // TLC prints the error state of an unbounded behavior alone, as TLCState#toString does, without the alias.
      trace: shown.positions.map((position) => {
        const captured = capture.captureOutput(
          () => toTraceSteps(trace, [position], !isLastStateOnly)[0],
        );
        return captured.lines.length > 0
          ? { ...captured.result, aliasOutput: captured.lines }
          : captured.result;
      }),
      levels: shown.positions.map((position) => trace[position].level),
      isLastStateOnly,
    });
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
        false,
      );
    }
    if (error.isSummarized) printSummary();
  }
  const last = reported[reported.length - 1];
  const errorStatus = last ? getMessageExitStatus(last.code) : EXIT_STATUS.success;
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
      : UNEXPECTED_EXCEPTION;
