import type { CheckOptions, OutputLine, TraceStep } from "./check";
import type { ModelConfig } from "./config";
import { TlaEvaluationError } from "./errors";
import { isImpure, type Environment } from "./evaluate";
import { isSameState } from "./fingerprints";
import type { Search } from "./search";
import { getActionLabel, type SpecAction } from "./spec-description";
import { getSuccessors, type Successor } from "./successors";
import type { Value } from "./values";

export interface Behavior {
  trace: TraceStep[];
  traceOutput?: OutputLine[];
}

interface TraceOptions {
  loopStart?: number;
  known?: number;
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
const NEXT_RECOVERY_FAILURE = "Failed to recover the next state from its fingerprint.";

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
    steps: Successor[],
    position: number,
    loopStart: number | undefined,
  ) => {
    const searchLevel = runtime.getLevel;
    const searchBehavior = runtime.getBehavior;
    runtime.getLevel = () => position + 1;
    runtime.getBehavior = () => steps.slice(0, position + 1).map((step) => step.state);
    try {
      return search.evaluateAlias(
        alias,
        steps[position].state,
        (steps[position + 1] ?? steps[loopStart ?? position]).state,
        options.isTool ?? false,
      );
    } finally {
      runtime.getLevel = searchLevel;
      runtime.getBehavior = searchBehavior;
    }
  };
  const findStepAction = (index: number, previous: Value[], state: Value[], isHeld: boolean) => {
    const expanding = { ...current };
    Object.assign(current, {
      index,
      isExpanding: true,
      candidate: undefined,
      rebuilt: { state: previous, level: depths[index] },
    });
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
      const isRebuiltAgain = known > 0 && !is174;
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
              : getAliasState(alias, steps, position, loopStart),
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
  const hasFingerprint = (state: Value[], index: number) =>
    isSameState(getFingerprintState(state), context.fingerprintStates[index]);
  const findSuccessorWithFingerprint = (state: Value[], index: number) =>
    findTraceSuccessor(state, (successor) => hasFingerprint(successor.state, index));
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
    if (!lastSuccessor) return toTrace(steps, path);
    const action = isReducing
      ? findTraceSuccessor(states[index], (successor) =>
          isSameState(successor.state, lastSuccessor.state),
        )?.action
      : lastSuccessor.action;
    return toTrace([...steps, { state: lastSuccessor.state, action }], path, { known: 2 });
  };
  // Deviation from TLC: TLCTrace#printTrace prints a lone initial state without the alias.
  const getStateTrace = (index: number): Behavior =>
    context.parents[index] === -1
      ? {
          trace: [
            {
              action: undefined,
              label: undefined,
              state:
                config.alias === undefined
                  ? toRecord(states[index])
                  : getAliasState(
                      config.alias,
                      [{ state: states[index], action: undefined }],
                      0,
                      undefined,
                    ),
            },
          ],
          traceOutput: is174 ? [] : captureOutput(context.getInitialStates).lines,
        }
      : getTrace(index);
  const getFailedTrace = (index: number, successor: Successor): Behavior => ({
    trace: getTrace(index, successor).trace,
  });
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
  return {
    toTrace,
    findStepAction,
    findSuccessorWithFingerprint,
    getTrace,
    getStateTrace,
    getFailedTrace,
    getPathSteps,
  };
};
