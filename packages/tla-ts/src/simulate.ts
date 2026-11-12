import type { CheckOptions, TraceStep, Violation } from "./check";
import {
  isStackOverflow,
  TlaEvaluationError,
  TlaIncompleteSuccessorError,
  TlaModuleError,
  TlaStackOverflowError,
  TlaTooManyStatesError,
  TlaUnsupportedError,
  UNEXPECTED_EVAL_EXCEPTION,
  UNEXPECTED_EXCEPTION,
} from "./errors";
import { EXIT_STATUS, getMessageExitStatus, withLivenessExitCode } from "./exit-codes";
import { createLivenessChecker } from "./liveness-checker";
import { getIncompleteSuccessorMessage, prepareSearch, reportAssumptionViolation } from "./search";
import {
  getActionLabel,
  getInitActions,
  getNextActions,
  toActionValue,
  type SpecAction,
} from "./spec-description";
import { forEachInitialState, forEachSuccessor } from "./successors";
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
} from "./tlc/messages";
import { createJavaRandom, nextPrime } from "./tlc/random";
import { createCounterExample } from "./tlc/tlcext-operators";
import {
  createModelValue,
  createRecord,
  formatState,
  getSetBound,
  isSameValue,
  type Value,
} from "./values";

export interface SimulationOptions extends CheckOptions {
  traceDepth: number;
  traceCount: bigint | undefined;
  aril: bigint;
  isGenerating: boolean;
  scheduler: "random" | "rl" | "rlaction";
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
  | { kind: "behavior"; trace: TraceStep[]; isLastStateOnly: boolean }
  | { kind: "progress"; statistics: SimulationStatistics }
  | { kind: "summary"; statistics: SimulationStatistics };

interface TraceNode {
  state: Value[];
  action: SpecAction;
  predecessor: TraceNode | undefined;
  level: number;
  deferred?: (next: Value[]) => void;
}

interface WorkerError {
  code: number;
  message: string;
  toolMessage: string;
  node: TraceNode;
  isException: boolean;
  isSummarized: boolean;
  violation?: Violation;
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

const isSameState = (left: Value[], right: Value[]) =>
  left.every((value, index) => isSameValue(value, right[index]));

export const simulate = (options: SimulationOptions): number => {
  const output = options.onSimulation;
  const prepared = prepareSearch(options);
  const config = prepared.config;
  const specification = prepared.specification;
  const environment = prepared.environment;
  const runtime = environment.runtime;
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
  const printSummary = () => output({ kind: "summary", statistics: { ...statistics } });
  const nodes = new WeakMap<(Value | undefined)[], TraceNode>();
  const initActions = getInitActions(config, environment, specification.instanceActions);
  const nextActions = getNextActions(config, environment, specification.instanceActions);
  let traceCount = 0;
  let currentTrace = 0;
  runtime.getLevel = (state) => nodes.get(state)?.level ?? 0;
  runtime.getBehavior = (state) => {
    const node = nodes.get(state);
    return node ? getTrace(node).map((step) => step.state) : [state];
  };
  runtime.getSimulationValue = (key, state) => {
    const node = state && nodes.get(state);
    switch (key) {
      case "diameter":
        return currentTrace === 0 ? 0 : traceCount + 1;
      case "generated":
      case "distinct":
      case "queue":
        throw new TlaModuleError(`TLCGet(${key}) was undefined.`);
      case "action":
        return node && toActionValue(node.action);
      case "config":
        return createRecord([
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
        return createRecord([
          ["traces", statistics.traces],
          ["duration", Math.floor((Date.now() - runtime.startedAt) / 1000)],
          ["generated", statistics.generatedStates],
          [
            "behavior",
            createRecord([
              ["actions", createRecord([...actions])],
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
  const reportPostcondition = (isAfterViolation: boolean) => {
    const postcondition = search.findPostconditionViolation(isAfterViolation);
    if (!postcondition) return undefined;
    if (postcondition.counts !== undefined) (options.onPrint ?? console.log)(postcondition.counts);
    reportMessage(
      postcondition.code,
      postcondition.message,
      formatInnerMessage(postcondition.code, postcondition.message, true),
    );
    return postcondition;
  };
  const temporalProperties = search.properties.liveness;
  const createTemporalChecker = (successors: number[][], states: Value[][]) =>
    withLivenessExitCode(() =>
      withUnexpectedException(() =>
        createLivenessChecker(temporalProperties, search.spec.temporals, environment, {
          getFingerprint: (successor) =>
            Number(BigInt.asIntN(32, runtime.getFingerprint(successor.state))),
          getSuccessors: (index) =>
            successors[index].map((successor) => ({ index: successor, state: states[successor] })),
        }),
      ),
    );
  const branches = createTemporalChecker([], [])?.branches;
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
  const getTrace = (last: TraceNode) => {
    const trace: TraceNode[] = [];
    for (let node: TraceNode | undefined = last; node; node = node.predecessor) {
      const predecessor = node.predecessor;
      if (predecessor && isSameState(node.state, predecessor.state)) continue;
      trace.unshift(node);
    }
    trace.forEach((node, index) => {
      node.predecessor = trace[index - 1];
      node.level = index + 1;
    });
    return trace;
  };
  const toRecord = (state: (Value | undefined)[]) =>
    search.toRecord(state.map((value) => value ?? createModelValue("null")));
  const toTraceSteps = (trace: TraceNode[]): TraceStep[] =>
    trace.map((node, index) => ({
      action: node.action.name,
      label: getActionLabel(node.action, options.version, node.level === 1),
      state:
        config.alias === undefined || !node.state.every((value) => value !== undefined)
          ? toRecord(node.state)
          : search.evaluateAlias(
              config.alias,
              node.state,
              (trace[index + 1] ?? node).state,
              options.isTool ?? false,
            ),
    }));
  const getCounterExample = (trace: TraceNode[]) =>
    createCounterExample(
      trace.map((node) => search.toRecord(node.state)),
      trace.slice(1).map((node) => toActionValue(node.action)),
      undefined,
    );

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
    if (init) forEachInitialState(init, environment, addGenerated, search.spec.scope, addGenerated);
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
        runtime.counterExample = getCounterExample([node]);
        reportPostcondition(true);
        return EXIT_STATUS.safetyViolation;
      }
      // Deviation from TLC: its simulator checks no implied init, tla-ts checks them after invariants.
      const predicate = search.findFailedInitialPredicate(state);
      if (predicate) {
        const alias = toTraceSteps([node])[0].state;
        reportMessage(
          MESSAGE_CODE.propertyViolatedInitial,
          `Property ${predicate.name} is violated by the initial state:\n${formatState(alias)}`,
        );
        runtime.counterExample = getCounterExample([node]);
        reportPostcondition(true);
        return EXIT_STATUS.livenessViolation;
      }
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
  reportMessage(
    MESSAGE_CODE.initGenerated1,
    `Finished computing initial states: ${initialStates.length} distinct state generated at ${formatTlcDate(new Date())}.`,
    undefined,
    false,
  );

  const findTemporalViolation = (last: TraceNode): Violation | undefined => {
    if (temporalProperties.length === 0) return undefined;
    const trace = getTrace(last);
    const fingerprints = trace.map((node) => runtime.getFingerprint(node.state));
    const indices = new Map<bigint, number>();
    const states: Value[][] = [];
    const successors: number[][] = [];
    fingerprints.forEach((fingerprint, position) => {
      if (!indices.has(fingerprint)) {
        indices.set(fingerprint, states.length);
        states.push(trace[position].state);
        successors.push([]);
      }
      if (position === 0) return;
      const source = indices.get(fingerprints[position - 1]) ?? 0;
      const target = indices.get(fingerprint) ?? 0;
      if (source !== target && !successors[source].includes(target)) {
        successors[source].push(target);
      }
    });
    const checker = createTemporalChecker(successors, states);
    if (!checker) return undefined;
    checker.addInitialState(0, states[0]);
    states.forEach((state, index) =>
      checker.addState(
        index,
        state,
        successors[index].map((successor) => ({ index: successor, state: states[successor] })),
      ),
    );
    const lasso = checker.findViolation();
    if (!lasso) return undefined;
    const getLength = (path: number[]) =>
      path.filter((index, position) => position === 0 || index !== path[position - 1]).length;
    const path = [...lasso.prefix, ...lasso.cycle];
    const length = getLength(path);
    const cyclePosition = getLength(path.slice(0, lasso.prefix.length + 1));
    const printed = trace.slice(0, length);
    const isStuttering =
      fingerprints[length - 1] === runtime.getFingerprint(states[path[lasso.prefix.length]]);
    const loopStart = isStuttering ? length - 1 : cyclePosition - 1;
    const properties = checker.getViolatedProperties(
      printed.map((node) => node.state),
      cyclePosition - 1,
    );
    const back = trace[length];
    return {
      name: properties[0],
      properties,
      trace: toTraceSteps(printed),
      loopStart,
      loopLabel: back && getActionLabel(back.action, options.version, back.level === 1),
    };
  };
  const toWorkerError = (code: number, text: string, node: TraceNode): WorkerError => ({
    code,
    message: text,
    toolMessage: text,
    node,
    isException: false,
    isSummarized: true,
  });
  const getSuccessors = (current: TraceNode, action: SpecAction) => {
    const successors: TraceNode[] = [];
    let failure: WorkerError | undefined;
    runtime.deferred = undefined;
    try {
      forEachSuccessor(
        action.expression,
        current.state,
        environment,
        (successor) => {
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
          if (successors.length === getSetBound()) throw new TlaTooManyStatesError();
          successors.push(node);
          return false;
        },
        action.scope,
        options.isGenerating ? workerRandom : undefined,
      );
    } catch (error) {
      if (!(error instanceof TlaIncompleteSuccessorError)) throw error;
      const node = toNode(
        error.state.map((value) => value ?? createModelValue("null")),
        action,
        current,
      );
      const text = getIncompleteSuccessorMessage(
        error.variables,
        action.name,
        nextActions.length,
        options.version,
      );
      return { successors, error: toWorkerError(MESSAGE_CODE.incompleteSuccessor, text, node) };
    }
    return { successors, error: failure };
  };
  let currentNode = initialStates[0];
  const qualities = nextActions.map(() => new Map<bigint | SpecAction, number>());
  const getQualityKey = (node: TraceNode) =>
    options.scheduler === "rlaction" ? node.action : runtime.getFingerprint(node.state);
  const getRewardOf = (node: TraceNode) =>
    search.getReward(node.predecessor?.state, node.state, RL_REWARD);
  const getNextActionIndex = (node: TraceNode) => {
    if (options.scheduler === "random") {
      return Math.floor(workerRandom.nextDouble() * nextActions.length);
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
    const threshold = workerRandom.nextDouble();
    let cumulativeWeight = 0;
    const chosen = ranked.find((item, position) => {
      cumulativeWeight = position === 0 ? item.weight : cumulativeWeight + item.weight;
      return cumulativeWeight >= threshold;
    });
    return (chosen ?? ranked[ranked.length - 1]).index;
  };
  const markDisabled = (index: number, node: TraceNode) => {
    if (options.scheduler === "random") return;
    // TLC's rlaction scheduler stores the reward, then overwrites it as the rl scheduler does.
    if (options.scheduler === "rlaction") getRewardOf(node);
    qualities[index].set(getQualityKey(node), -Number.MAX_VALUE);
  };
  const learnTrace = (last: TraceNode) => {
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
  };
  const simulateTrace = (): WorkerError | "stopped" | undefined => {
    currentNode = initialStates[Math.floor(workerRandom.nextDouble() * initialStates.length)];
    for (let depth = 0; depth < traceDepth; depth++) {
      if (runtime.isStopped) return "stopped";
      let actionIndex = getNextActionIndex(currentNode);
      const prime = nextPrime(workerRandom);
      let successors: TraceNode[] = [];
      for (let attempt = 0; attempt < nextActions.length; attempt++) {
        const result = getSuccessors(currentNode, nextActions[actionIndex]);
        if (result.error) return result.error;
        successors = result.successors;
        if (successors.length > 0) break;
        markDisabled(actionIndex, currentNode);
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
    const violation = findTemporalViolation(currentNode);
    if (violation) {
      return {
        ...toWorkerError(MESSAGE_CODE.temporalPropertyViolated, "", currentNode),
        isException: true,
        violation,
      };
    }
    const length = Math.min(traceDepth, currentNode.level);
    const delta = length - statistics.levelMean;
    statistics.levelMean += Math.trunc(delta / Math.max(statistics.traces, 1));
    statistics.levelM2 += delta * (length - statistics.levelMean);
    if (options.scheduler === "rl") learnTrace(currentNode);
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

  const enumerableRandom = createJavaRandom(seed);
  runtime.getRandom = () => enumerableRandom;
  const errors: WorkerError[] = [];
  const isContinued = options.isContinued ?? false;
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
  const printed = errors.findIndex(
    (error) => error.isException || !isContinued || FATAL_CODES.has(error.code),
  );
  const reported = printed === -1 ? errors : errors.slice(0, printed + 1);
  reported.forEach((error) => {
    if (error.violation) {
      options.onProgress?.({
        kind: "violation",
        status: "liveness-violation",
        violation: error.violation,
      });
      printSummary();
      return;
    }
    reportMessage(error.code, error.message, error.toolMessage);
    output({
      kind: "behavior",
      trace: toTraceSteps(getTrace(error.node)),
      isLastStateOnly: traceDepth === INFINITE_DEPTH,
    });
    if (error.isSummarized) printSummary();
  });
  const last = reported[reported.length - 1];
  const errorStatus = last ? getMessageExitStatus(last.code) : EXIT_STATUS.success;
  if (last) runtime.counterExample = getCounterExample(getTrace(last.node));
  const postcondition = reportPostcondition(last !== undefined);
  const postconditionStatus = postcondition
    ? getMessageExitStatus(postcondition.code)
    : EXIT_STATUS.success;
  const status = Math.max(errorStatus, postconditionStatus);
  output({ kind: "progress", statistics: { ...statistics } });
  if (status === EXIT_STATUS.success) printSummary();
  return status;
};

const toEvaluationError = (error: unknown) => {
  if (isStackOverflow(error)) return new TlaStackOverflowError();
  if (!(error instanceof TlaEvaluationError)) throw error;
  return error;
};

const getUnexpectedPrefix = (error: TlaEvaluationError) =>
  isEvalException(error) ? UNEXPECTED_EVAL_EXCEPTION : UNEXPECTED_EXCEPTION;
