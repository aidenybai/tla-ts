import type { Expression } from "./ast";
import type { CheckOptions } from "./check";
import {
  getErrorExitCode,
  getUnexpectedException,
  isStackOverflow,
  TlaEvaluationError,
  TlaIncompleteSuccessorError,
  TlaStackOverflowError,
  TlaTooManyStatesError,
  TlaUnsupportedError,
} from "./errors";
import { createTracingEnvironment } from "./evaluate";
import { EXIT_STATUS, getMessageExitStatus, withLivenessExitCode } from "./exit-codes";
import { createLivenessChecker } from "./liveness-checker";
import { getIncompleteSuccessorMessage, prepareSearch, reportAssumptionViolation } from "./search";
import { getNextActions, type SpecAction } from "./spec-description";
import { forEachInitialState, forEachSuccessor } from "./successors";
import {
  formatNestedMessage,
  formatTlcDate,
  getFailureMessage,
  isEvalException,
  isHeadedError,
  MESSAGE_CODE,
  withUnexpectedException,
} from "./tlc/messages";
import { getTlcFingerprint } from "./tlc/fingerprint";
import { replaySuccessors } from "./tlc/replay";
import { getOptimisticProbability, getActualProbability } from "./tlc/summary";
import { createModelValue, formatState, getSetBound, type Value } from "./values";

export interface DepthFirstOptions extends CheckOptions {
  maxDepth: number;
  onOutput: (output: DepthFirstOutput) => void;
}

export type DepthFirstOutput =
  | { kind: "message"; code: number; isError: boolean; message: string; toolMessage: string }
  | { kind: "behavior"; states: Record<string, Value>[]; isInvariant: boolean }
  | { kind: "nested-expressions"; callStack: Expression[] }
  | { kind: "success"; optimistic: number; actual: number };

interface StateEntry {
  state: Value[];
  fingerprint: bigint;
}

interface CheckerState {
  isDone: boolean;
  errorCode: number;
  continuedCode: number;
  isKeepingCallStack: boolean;
  errorEntry: StateEntry | undefined;
  stopCode: number;
  isMoreLevel: boolean;
}

const DONE = 1;
const LEVELED = 2;

const NO_ERROR = 0;

const LONG_MAX = (1n << 63n) - 1n;

const INITIAL_BUCKETS = 1n << 16n;
const MAX_LOAD = 20n;

const getFingerprintDistance = (fingerprints: bigint[], buckets: bigint) => {
  const values = fingerprints.map((fingerprint) => {
    const low = BigInt.asIntN(32, fingerprint);
    return low < 0n ? low : BigInt.asIntN(64, fingerprint);
  });
  const sorted = values.toSorted((left, right) => (left < right ? -1 : left > right ? 1 : 0));
  const gaps = sorted
    .slice(1)
    .map((value, index) => value - sorted[index])
    .filter((gap) => gap <= LONG_MAX);
  const ranges = new Map<bigint, { min: bigint; max: bigint }>();
  fingerprints.forEach((fingerprint, index) => {
    const bucket = fingerprint & (buckets - 1n);
    const range = ranges.get(bucket);
    const value = values[index];
    if (!range) {
      ranges.set(bucket, { min: value, max: value });
      return;
    }
    range.min = value < range.min ? value : range.min;
    range.max = value > range.max ? value : range.max;
  });
  const wraps = [...ranges.values()]
    .map((range) => range.max - range.min)
    .filter((difference) => difference > LONG_MAX)
    .map((difference) => (difference === LONG_MAX + 1n ? -difference : (1n << 64n) - difference));
  return [...gaps, ...wraps].reduce((min, gap) => (gap < min ? gap : min), LONG_MAX);
};

const getUnexpectedMessage = (cause: string, error: TlaEvaluationError) => {
  const exception = isEvalException(error)
    ? "tlc2.tool.EvalException"
    : "java.lang.RuntimeException";
  return cause === ""
    ? getUnexpectedException(exception)
    : `TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nThe error occurred when TLC was ${cause}.\nThe exception was a ${exception}\n: `;
};

// Deviation from TLC: DFIDWorker picks the next initial state and successor with an unseeded generator, so tla-ts picks the first one.
export const checkDepthFirst = (options: DepthFirstOptions): number => {
  const output = options.onOutput;
  const isTool = options.isTool ?? false;
  const isContinued = options.isContinued ?? false;
  const prepared = prepareSearch(options);
  const config = prepared.config;
  const environment = prepared.environment;
  const runtime = environment.runtime;
  const search = prepared.search;
  if (!search) {
    throw new TlaUnsupportedError("tla-ts can't search a specification without variables");
  }
  const message = (code: number, text: string, toolText = text, isError = true) =>
    output({ kind: "message", code, isError, message: text, toolMessage: toolText });
  const temporalProperties = search.properties.liveness;
  if (temporalProperties.length > 0) {
    options.onProgress?.({
      kind: "liveness-initializing",
      isSymmetric: search.isSymmetric,
      isConstrained: search.isConstrained,
    });
    const branches = withLivenessExitCode(() =>
      withUnexpectedException(() =>
        createLivenessChecker(temporalProperties, search.spec.temporals, environment, {
          getFingerprint: () => 0,
          getSuccessors: () => [],
        }),
      ),
    )?.branches;
    if (branches) options.onProgress?.({ kind: "liveness-prepared", branches });
  }
  if ((options.workers ?? 1) !== 1) {
    message(
      MESSAGE_CODE.general,
      "Depth-First Iterative Deepening mode does not support multiple workers (https://github.com/tlaplus/tlaplus/issues/548).  Please run TLC with a single worker.",
    );
    return EXIT_STATUS.error;
  }
  if (temporalProperties.length > 0) {
    message(
      MESSAGE_CODE.general,
      "Depth-First Iterative Deepening mode does not support checking liveness properties (https://github.com/tlaplus/tlaplus/issues/548).  Please check liveness properties in Breadth-First-Search mode.",
    );
    return EXIT_STATUS.error;
  }
  runtime.generatedStates = -1;
  runtime.distinctStates = -1;
  runtime.initialStates = -1;
  runtime.queueSize = -1;
  runtime.diameter = -1;
  runtime.isStarted = true;
  const assumptionStatus = reportAssumptionViolation(
    prepared.specification.assumptions,
    environment,
    message,
  );
  if (assumptionStatus !== undefined) return assumptionStatus;

  const nextActions = getNextActions(config, environment, prepared.specification.instanceActions);
  const statuses = new Map<bigint, number>();
  const fingerprintSet = { level: 1, leveled: 0, buckets: INITIAL_BUCKETS };
  const setStatus = (fingerprint: bigint, status: number) => {
    const old = statuses.get(fingerprint);
    if (old !== undefined) {
      statuses.set(fingerprint, old | status);
      return old;
    }
    if (BigInt(statuses.size) >= fingerprintSet.buckets * MAX_LOAD) fingerprintSet.buckets *= 2n;
    statuses.set(fingerprint, (fingerprintSet.level << 2) | fingerprintSet.leveled | status);
    return 0;
  };
  const getStatus = (fingerprint: bigint) => statuses.get(fingerprint) ?? 0;
  const isCompleted = (status: number) =>
    (status & LEVELED) === fingerprintSet.leveled || (status & DONE) === DONE;
  const isLeafStatus = (status: number) => status === 0 || status >>> 2 === fingerprintSet.level;

  let generatedCount = 0;
  const checker: CheckerState = {
    isDone: false,
    errorCode: NO_ERROR,
    continuedCode: NO_ERROR,
    isKeepingCallStack: false,
    errorEntry: undefined,
    stopCode: 0,
    isMoreLevel: false,
  };
  const setErrorState = (entry: StateEntry, isKeepingCallStack: boolean, code: number) => {
    if (!isContinued && checker.isDone) return false;
    checker.errorEntry = entry;
    checker.errorCode = code;
    checker.isDone = true;
    checker.isKeepingCallStack = isKeepingCallStack;
    checker.stopCode = 2;
    return true;
  };
  const toRecord = (state: (Value | undefined)[]) =>
    search.toRecord(state.map((value) => value ?? createModelValue("null")));
  const printSummary = () => {
    const counts = `${generatedCount} states generated, ${statuses.size} distinct states found`;
    if (isTool) {
      message(
        MESSAGE_CODE.depthFirstProgress,
        `Progress: ${counts}.`,
        `Progress(-1) at ${formatTlcDate(new Date())}: ${counts}, -1 states left on queue.`,
        false,
      );
    }
    message(MESSAGE_CODE.depthFirstStats, `${counts}.`, undefined, false);
  };
  const reportSuccess = () =>
    output({
      kind: "success",
      optimistic: getOptimisticProbability(statuses.size, generatedCount),
      actual:
        statuses.size === 0 && generatedCount === 0
          ? 0
          : getActualProbability(
              getFingerprintDistance([...statuses.keys()], fingerprintSet.buckets),
            ),
    });
  const levels = new WeakMap<(Value | undefined)[], number>();
  let currentState: Value[] | undefined;
  runtime.getLevel = (state) => levels.get(state) ?? 0;
  runtime.getCurrentState = () => currentState;

  const initialEntries: StateEntry[] = [];
  let errorState: Value[] | undefined;
  const computeInitialStates = (): number => {
    const generated: (Value | undefined)[][] = [];
    const addGenerated = (state: (Value | undefined)[]) => {
      generated.push(state);
      return false;
    };
    const init = search.spec.init;
    if (init) forEachInitialState(init, environment, addGenerated, search.spec.scope, addGenerated);
    generatedCount = generated.length;
    for (const state of generated) {
      if (!state.every((value) => value !== undefined)) {
        message(
          MESSAGE_CODE.initialStateIncomplete,
          `State is not completely specified by the initial predicate:\n${formatState(toRecord(state))}`,
        );
        return MESSAGE_CODE.initialStateIncomplete;
      }
      errorState = state;
      levels.set(state, 1);
      const isInModel = search.satisfiesConstraints(state);
      const fingerprint = isInModel ? runtime.getFingerprint(state) : 0n;
      const status = isInModel ? setStatus(fingerprint, 0) : 0;
      if (isInModel && status === 0) initialEntries.push({ state, fingerprint });
      if (status !== 0) continue;
      const alias = () =>
        config.alias === undefined
          ? search.toRecord(state)
          : search.evaluateAlias(config.alias, state, state, isTool);
      const violated = isContinued
        ? search.getViolatedInvariants(state)
        : [search.findViolatedInvariant(state)].filter((invariant) => invariant !== undefined);
      for (const invariant of violated) {
        message(
          MESSAGE_CODE.invariantViolatedInitial,
          `Invariant ${invariant.name} is violated by the initial state:\n${formatState(alias())}`,
        );
        if (!isContinued) return MESSAGE_CODE.invariantViolatedInitial;
        checker.continuedCode = MESSAGE_CODE.invariantViolatedInitial;
      }
      const predicate = search.findFailedInitialPredicate(state);
      if (predicate) {
        message(
          MESSAGE_CODE.propertyViolatedInitial,
          `Property ${predicate.name} is violated by the initial state:\n${formatState(alias())}`,
        );
        return MESSAGE_CODE.propertyViolatedInitial;
      }
    }
    return NO_ERROR;
  };

  const getActionSuccessors = (action: SpecAction, state: Value[]) => {
    const successors: Value[][] = [];
    try {
      forEachSuccessor(
        action.expression,
        state,
        environment,
        (successor) => {
          if (successors.length === getSetBound()) throw new TlaTooManyStatesError();
          successors.push(successor.state);
          return false;
        },
        action.scope,
      );
      return { successors, incomplete: undefined };
    } catch (error) {
      if (!(error instanceof TlaIncompleteSuccessorError)) throw error;
      return { successors, incomplete: error };
    }
  };

  const findCheckFailure = (state: Value[], successor: Value[], isNew: boolean) => {
    try {
      const invariant = isNew ? search.findViolatedInvariant(successor, state) : undefined;
      if (invariant) {
        return {
          code: MESSAGE_CODE.invariantViolatedBehavior,
          text: `Invariant ${invariant.name} is violated.`,
          isViolated: true,
        };
      }
      const property = search.findViolatedActionProperty(state, successor);
      return (
        property && {
          code: MESSAGE_CODE.actionPropertyViolatedBehavior,
          text: `Action property ${property.name} is violated.`,
          isViolated: true,
        }
      );
    } catch (error) {
      if (!(error instanceof TlaEvaluationError) || !isHeadedError(error)) throw error;
      return {
        code: getFailureMessage(error, true).code,
        text: error.message.slice(0, error.message.indexOf("\n")),
        isViolated: false,
      };
    }
  };
  const stack: StateEntry[] = [];
  const successorStack: StateEntry[][] = [];
  const printTrace = (
    code: number,
    text: string,
    toolText: string,
    depth: number,
    successor: (Value | undefined)[] | undefined,
  ) => {
    message(code, text, toolText);
    message(MESSAGE_CODE.behaviorUpToThisPoint, "The behavior up to this point is:");
    const states = [
      ...stack.slice(0, depth + 1).map((entry) => entry.state),
      ...(successor ? [successor] : []),
    ];
    output({
      kind: "behavior",
      states: states.map(toRecord),
      isInvariant: code === MESSAGE_CODE.invariantViolatedBehavior,
    });
  };
  const expandState = (depth: number, isLeaf: boolean, successors: StateEntry[]) => {
    const entry = stack[depth];
    const state = entry.state;
    let isDeadlocked = true;
    let isAllDone = true;
    let isNoLeaf = true;
    let processedSuccessor: (Value | undefined)[] | undefined;
    const report = (code: number, text: string, isKeepingCallStack: boolean) => {
      if (setErrorState(entry, isKeepingCallStack, code)) {
        printTrace(code, text, text, depth, processedSuccessor);
      }
      return isNoLeaf;
    };
    currentState = state;
    try {
      for (const action of nextActions) {
        const next = getActionSuccessors(action, state);
        const incomplete = next.incomplete;
        const count = next.successors.length + (incomplete ? 1 : 0);
        generatedCount += count;
        isDeadlocked &&= count === 0;
        for (const successor of next.successors) {
          processedSuccessor = successor;
          levels.set(successor, depth + 2);
          const isInModel =
            search.satisfiesConstraints(successor, state) &&
            search.satisfiesActionConstraints(state, successor);
          const fingerprint = isInModel ? runtime.getFingerprint(successor) : 0n;
          const status = isInModel ? setStatus(fingerprint, 0) : 0;
          if (isInModel) {
            isAllDone &&= (status & DONE) === DONE;
            isNoLeaf &&= !isLeafStatus(status);
            if (!isCompleted(status)) {
              if (successors.length === getSetBound()) throw new TlaTooManyStatesError();
              successors.push({ state: successor, fingerprint });
            }
          }
          const failure = findCheckFailure(state, successor, status === 0);
          if (failure?.isViolated && isContinued) {
            printTrace(failure.code, failure.text, failure.text, depth, successor);
            checker.continuedCode = failure.code;
            continue;
          }
          if (failure) return report(failure.code, failure.text, !failure.isViolated);
        }
        if (incomplete) {
          processedSuccessor = incomplete.state;
          return report(
            MESSAGE_CODE.incompleteSuccessor,
            getIncompleteSuccessorMessage(
              incomplete.variables,
              action.name,
              nextActions.length,
              options.version,
            ),
            false,
          );
        }
        processedSuccessor = undefined;
      }
      if (isDeadlocked && config.checkDeadlock) {
        return report(MESSAGE_CODE.deadlockReached, "Deadlock reached.", false);
      }
      if (isAllDone || (isLeaf && isNoLeaf)) setStatus(entry.fingerprint, DONE);
      return isNoLeaf;
    } catch (error) {
      const failure = isStackOverflow(error) ? new TlaStackOverflowError() : error;
      if (!(failure instanceof TlaEvaluationError)) throw error;
      const isOverflow = failure instanceof TlaStackOverflowError;
      if (
        setErrorState(
          entry,
          !isOverflow,
          isOverflow ? MESSAGE_CODE.stackOverflow : MESSAGE_CODE.general,
        )
      ) {
        const unexpected = getUnexpectedMessage("computing the set of next states", failure);
        printTrace(
          isOverflow ? MESSAGE_CODE.stackOverflow : MESSAGE_CODE.general,
          isOverflow ? failure.message : `${unexpected}${failure.message}`,
          isOverflow
            ? failure.message
            : `${unexpected}${formatNestedMessage(failure.message, true)}`,
          depth,
          processedSuccessor,
        );
      }
      throw failure;
    }
  };
  const getNextIndex = (successors: StateEntry[], level: number) => {
    while (successors.length > 0) {
      const status = getStatus(successors[0].fingerprint);
      if (!isCompleted(status) && level < status >>> 2) return 0;
      successors[0] = successors[successors.length - 1];
      successors.pop();
    }
    return -1;
  };
  const searchLevel = (toLevel: number) => {
    const initials = [...initialEntries];
    checker.stopCode = 0;
    checker.isMoreLevel = false;
    let stackLevel = 0;
    try {
      while (checker.stopCode === 0) {
        while (initials.length > 0 && isCompleted(getStatus(initials[0].fingerprint))) {
          initials[0] = initials[initials.length - 1];
          initials.pop();
        }
        if (initials.length === 0) {
          checker.stopCode = 1;
          return;
        }
        stack[0] = initials[0];
        successorStack[0] = [];
        stackLevel = 0;
        const isInitialLeaf = toLevel < 2;
        const isInitialNoLeaf = expandState(0, isInitialLeaf, successorStack[0]);
        checker.isMoreLevel ||= !isInitialNoLeaf;
        stackLevel = 1;
        while (!isInitialLeaf) {
          const index = getNextIndex(successorStack[stackLevel - 1], stackLevel);
          if (index === -1) {
            const entry = stack[stackLevel - 1];
            statuses.set(
              entry.fingerprint,
              (getStatus(entry.fingerprint) & ~LEVELED) | fingerprintSet.leveled,
            );
            if (stackLevel === 1) break;
            stackLevel--;
            continue;
          }
          stack[stackLevel] = successorStack[stackLevel - 1][index];
          successorStack[stackLevel] = [];
          const isLeaf = stackLevel >= toLevel - 1;
          const isNoLeaf = expandState(stackLevel, isLeaf, successorStack[stackLevel]);
          checker.isMoreLevel ||= !isNoLeaf;
          stackLevel++;
          if (isLeaf) break;
        }
      }
    } catch (error) {
      if (!(error instanceof TlaEvaluationError)) throw error;
      checker.stopCode = 2;
      if (setErrorState(stack[stackLevel], true, MESSAGE_CODE.general)) {
        const unexpected = getUnexpectedMessage("", error);
        message(
          MESSAGE_CODE.general,
          `${unexpected}${error.message}`,
          `${unexpected}${formatNestedMessage(error.message, true)}`,
        );
      }
    }
  };
  const replayExpansion = (entry: StateEntry) => {
    const tracing = createTracingEnvironment(environment);
    try {
      const isPassed = nextActions.every((action) => {
        const successors: Value[][] = [];
        replaySuccessors([action], entry.state, tracing, (successor) => successors.push(successor));
        generatedCount += successors.length;
        return successors.every(
          (successor) =>
            successor.every((value) => value !== undefined) &&
            search.checkReplayedSuccessor(
              entry.state,
              successor,
              tracing,
              () => setStatus(runtime.getFingerprint(successor), 0) === 0,
            ),
        );
      });
      if (isPassed) return;
    } catch (error) {
      if (!(error instanceof TlaEvaluationError) && !isStackOverflow(error)) throw error;
    }
    output({ kind: "nested-expressions", callStack: tracing.callStack?.expressions ?? [] });
  };

  const finish = (code: number) => {
    printSummary();
    const status = [code, checker.errorCode, checker.continuedCode].find(
      (candidate) => candidate !== NO_ERROR,
    );
    return status === undefined ? EXIT_STATUS.success : getMessageExitStatus(status);
  };
  const tryInitialStates = () => {
    try {
      return { code: computeInitialStates(), error: undefined };
    } catch (error) {
      const failure = isStackOverflow(error) ? new TlaStackOverflowError() : error;
      if (!(failure instanceof TlaEvaluationError)) throw error;
      return { code: NO_ERROR, error: failure };
    }
  };
  const initialFailure = tryInitialStates();
  if (initialFailure.error) {
    const failure = initialFailure.error;
    const inner =
      isHeadedError(failure) && failure.cause instanceof TlaEvaluationError
        ? failure.cause
        : failure;
    const initialState = errorState;
    const prefix = initialState ? "" : getUnexpectedMessage("computing initial states", inner);
    const suffix = initialState
      ? `\nWhile working on the initial state:\n${formatState(toRecord(initialState))}`
      : "";
    message(
      initialState ? MESSAGE_CODE.initialState : MESSAGE_CODE.general,
      `${prefix}${inner.message}${suffix}`,
      `${prefix}${formatNestedMessage(inner.message, true)}${suffix}`,
    );
    generatedCount = 0;
    initialEntries.length = 0;
    const isReplayFailed = tryInitialStates().error !== undefined;
    if (isReplayFailed) {
      message(
        MESSAGE_CODE.nestedExpression,
        `The error occurred when TLC was evaluating the nested\nexpressions at the following positions:\ntlc2.tool.impl.FastTool@${(Number(BigInt.asUintN(28, getTlcFingerprint([options.source]))) | 0x1000_0000).toString(16)}`,
      );
    }
    printSummary();
    return isReplayFailed ? EXIT_STATUS.specEvaluationFailure : getErrorExitCode(inner);
  }
  if (initialFailure.code !== NO_ERROR) return getMessageExitStatus(initialFailure.code);
  message(
    MESSAGE_CODE.depthFirstInitGenerated,
    `Finished computing initial states: ${generatedCount} states generated, with ${initialEntries.length} of them distinct.`,
    undefined,
    false,
  );
  if (nextActions.length === 0) {
    reportSuccess();
    return finish(NO_ERROR);
  }
  let isTerminated = false;
  let levelCode: number = MESSAGE_CODE.general;
  for (let level = 2; level <= options.maxDepth; level++) {
    if (isTerminated) {
      const errorEntry = checker.errorEntry;
      if (!errorEntry && checker.continuedCode === NO_ERROR) {
        levelCode = NO_ERROR;
        reportSuccess();
      }
      if (errorEntry && checker.isKeepingCallStack) replayExpansion(errorEntry);
      break;
    }
    message(
      MESSAGE_CODE.depthFirstLevel,
      `Starting level ${level}: ${generatedCount} states generated, ${statuses.size} distinct states found.`,
      undefined,
      false,
    );
    fingerprintSet.level++;
    fingerprintSet.leveled = LEVELED - fingerprintSet.leveled;
    searchLevel(level);
    checker.isDone = false;
    levelCode = checker.isKeepingCallStack ? NO_ERROR : checker.errorCode;
    if (levelCode !== NO_ERROR) return finish(levelCode);
    isTerminated = checker.stopCode === 2 || !checker.isMoreLevel;
  }
  return finish(levelCode);
};
