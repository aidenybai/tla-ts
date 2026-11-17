import type { CheckOptions, OutputLine, TraceStep } from "./check";
import type { ModelConfig } from "./config";
import { TlaEvaluationError } from "./errors";
import { isImpure, type Environment, type State } from "./evaluate";
import { getStateHash, isSameState } from "./fingerprints";
import type { Search } from "./search";
import { getActionLabel, type SpecAction } from "./spec-description";
import { getSuccessors, type Successor } from "./successors";
import { createModelValue, type Value } from "./values";

export interface Behavior {
  trace: TraceStep[];
  traceOutput?: OutputLine[];
}

interface TraceOptions {
  loopStart?: number;
  known?: number;
  incomplete?: State;
  isFailed?: boolean;
}

interface RebuiltState {
  state: Value[];
  level: number;
}

export interface SearchPosition {
  index: number;
  isExpanding: boolean;
  candidate: Value[] | undefined;
  candidateLevel: number;
  livenessSource: number;
  rebuilt: RebuiltState | undefined;
}

export interface TracedStep {
  state: Record<string, Value>;
  action: SpecAction | undefined;
  alias?: Record<string, Value>;
}

interface TraceContext {
  config: ModelConfig;
  options: CheckOptions;
  environment: Environment;
  search: Search;
  nextActions: SpecAction[];
  current: SearchPosition;
  states: Value[][];
  fingerprintStates: Value[][];
  parents: number[];
  actions: (string | undefined)[];
  depths: number[];
  tracedSteps: WeakMap<TraceStep, TracedStep>;
  captureOutput: <Result>(rebuild: () => Result) => { result: Result; lines: OutputLine[] };
  getInitialStates: () => Value[][];
  findSuccessorAction: (
    state: Value[],
    isMatch: (successor: Successor) => boolean,
  ) => SpecAction | undefined;
}

const INITIAL_RECOVERY_FAILURE = "Failed to recover the initial state from its fingerprint.";
export const NEXT_RECOVERY_FAILURE = "Failed to recover the next state from its fingerprint.";

export const createTraceBuilder = (context: TraceContext) => {
  const config = context.config;
  const options = context.options;
  const environment = context.environment;
  const runtime = environment.runtime;
  const search = context.search;
  const current = context.current;
  const states = context.states;
  const depths = context.depths;
  const captureOutput = context.captureOutput;
  const is174 = runtime.version === "1.7.4";
  const isReducing = config.view !== undefined || config.symmetry !== undefined;
  const getFingerprintState = search.getFingerprintState;
  const toRecord = search.toRecord;

  const getAliasState = (
    alias: string,
    state: State,
    successor: State,
    level: number,
    getBehavior: () => Value[][],
  ) => {
    const searchLevel = runtime.getLevel;
    const searchBehavior = runtime.getBehavior;
    runtime.getLevel = () => level;
    runtime.getBehavior = getBehavior;
    try {
      return search.evaluateAlias(alias, state, successor, options.isTool ?? false);
    } finally {
      runtime.getLevel = searchLevel;
      runtime.getBehavior = searchBehavior;
    }
  };
  // Deviation from TLC: TLCTrace#printTrace rebuilds a step with the generator that already drew for its state, so it misses the step and leaks a NullPointerException.
  const rebuildFrom = (state: Value[], level: number) => {
    current.rebuilt = { state, level };
    runtime.reseedRandom();
  };
  const findStepAction = (index: number, previous: Value[], state: Value[], isHeld: boolean) => {
    const expanding = { ...current };
    Object.assign(current, { index, isExpanding: true, candidate: undefined });
    rebuildFrom(previous, depths[index]);
    const getKey = isHeld ? (values: Value[]) => values : getFingerprintState;
    const key = getKey(state);
    try {
      return context.findSuccessorAction(previous, (successor) =>
        isSameState(getKey(successor.state), key),
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
    const initialOutput = steps.length > 1 ? captureOutput(context.getInitialStates).lines : [];
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
    if (environment.coverage && steps.length > 1) {
      const isRebuiltAgain = known > 0 && !is174 && !traceOptions.isFailed;
      if (rebuilt > 0 && isRebuiltAgain) captureOutput(context.getInitialStates);
      if (isRebuiltAgain) {
        steps.slice(1).forEach((step, position) => {
          if (step.action === "Stuttering") return;
          captureOutput(() =>
            findStepAction(
              path[position],
              steps[position].state,
              step.state,
              known === 2 && position === steps.length - 2,
            ),
          );
        });
      }
    }
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
              : getAliasState(
                  alias,
                  step.state,
                  steps[position + 1]?.state ??
                    traceOptions.incomplete ??
                    steps[loopStart ?? position].state,
                  position + 1,
                  () => steps.slice(0, position + 1).map((inner) => inner.state),
                ),
          output: position === 0 ? prefixOutput : position < rebuilt ? [] : outputs[position],
        };
        if (alias !== undefined || action) {
          context.tracedSteps.set(traceStep, { state: toRecord(step.state), action });
        }
        return traceStep;
      }),
      traceOutput: known > 0 && !is174 ? [initialOutput, ...outputs].flat() : [],
    };
  };
  const findTraceSuccessor = (state: Value[], isMatch: (successor: Successor) => boolean) =>
    captureOutput(() => {
      for (const action of context.nextActions) {
        const successor = getSuccessors(action.expression, state, environment, action.scope).find(
          isMatch,
        );
        if (successor) return { ...successor, action: successor.action ?? action.name };
      }
      return undefined;
    }).result;
  // TLC's Tool#getState fingerprints each state it rebuilds, which sorts its records in place.
  const hasFingerprint = (state: Value[], index: number) => {
    const fingerprintState = getFingerprintState(state);
    const stored = context.fingerprintStates[index];
    return (
      getStateHash(fingerprintState) === getStateHash(stored) &&
      isSameState(fingerprintState, stored)
    );
  };
  const findSuccessorWithFingerprint = (state: Value[], source: number, target: number) => {
    const rebuilt = current.rebuilt;
    rebuildFrom(state, depths[source]);
    const successor = findTraceSuccessor(state, (candidate) =>
      hasFingerprint(candidate.state, target),
    );
    current.rebuilt = rebuilt;
    return successor;
  };
  const getPathStates = (path: number[], nextFailure: string) => {
    const initial = captureOutput(() =>
      isReducing || isImpure(environment)
        ? context.getInitialStates().find((state) => hasFingerprint(state, path[0]))
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
      const successor = findSuccessorWithFingerprint(previous, path[position - 1], path[position]);
      if (!successor) throw new TlaEvaluationError(nextFailure);
      steps.push(successor);
    }
    return steps;
  };
  const getTrace = (index: number, lastSuccessor?: Successor, traceOptions: TraceOptions = {}) => {
    const path: number[] = [];
    for (let position = index; position !== -1; position = context.parents[position]) {
      path.unshift(position);
    }
    const steps =
      isReducing && path.length > 1
        ? getPathStates(path, INITIAL_RECOVERY_FAILURE)
        : path.map((position) => ({
            state: states[position],
            action: context.actions[position],
          }));
    if (!lastSuccessor) return toTrace(steps, path, traceOptions);
    const action = isReducing
      ? findTraceSuccessor(states[index], (successor) =>
          isSameState(successor.state, lastSuccessor.state),
        )?.action
      : lastSuccessor.action;
    return toTrace([...steps, { state: lastSuccessor.state, action }], path, {
      ...traceOptions,
      known: 2,
    });
  };
  // TLCTrace#printTrace applies the alias to every state but an initial one it prints without a successor.
  const getStateTrace = (index: number, incomplete?: State): Behavior => {
    if (context.parents[index] !== -1) return getTrace(index, undefined, { incomplete });
    const traceOutput = is174 ? [] : captureOutput(context.getInitialStates).lines;
    const state = states[index];
    if (incomplete !== undefined) {
      return {
        trace: toTrace([{ state, action: undefined }], [index], { incomplete }).trace,
        traceOutput,
      };
    }
    const step = { action: undefined, label: undefined, state: toRecord(state) };
    const alias = config.alias;
    if (alias !== undefined) {
      context.tracedSteps.set(step, {
        state: step.state,
        action: undefined,
        alias: getAliasState(alias, state, state, 1, () => [state]),
      });
    }
    return { trace: [step], traceOutput };
  };
  const getIncompleteStep = (
    incomplete: State,
    level: number,
    step: Omit<TraceStep, "state">,
    action: SpecAction | undefined,
  ): TraceStep => {
    const state = toRecord(incomplete.map((value) => value ?? createModelValue("null")));
    const alias = config.alias;
    const traceStep = {
      ...step,
      state:
        alias === undefined ? state : getAliasState(alias, incomplete, incomplete, level, () => []),
    };
    context.tracedSteps.set(traceStep, { state, action });
    return traceStep;
  };
  // TLC's Worker rebuilds the trace for its postconditions after a violation, not a failure.
  const getFailedTrace = (index: number, successor: Successor): Behavior => ({
    trace: getTrace(index, successor, { isFailed: true }).trace,
  });
  const getPathSteps = (path: number[]) => getPathStates(path, NEXT_RECOVERY_FAILURE);
  return {
    toTrace,
    findStepAction,
    findSuccessorWithFingerprint,
    getTrace,
    getStateTrace,
    getIncompleteStep,
    getFailedTrace,
    getPathSteps,
  };
};
