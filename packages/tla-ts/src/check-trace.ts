import type { CheckOptions, OutputLine, TraceFailure, TraceStep } from "./check";
import { getTraceFailure } from "./check-failure";
import type { ModelConfig } from "./config";
import { TlaEvaluationError } from "./errors";
import { isImpure, type Environment, type State } from "./evaluate";
import { getStateHash, isSameState } from "./fingerprints";
import type { Search } from "./search";
import { getActionLabel, type SpecAction } from "./spec-description";
import { getSuccessors, type Successor } from "./successors";
import { createModelValue, getFingerprintError, isSameValue, type Value } from "./values";

export interface Behavior {
  trace: TraceStep[];
  traceOutput?: OutputLine[];
  traceFailure?: TraceFailure;
}

interface TraceOptions {
  loopStart?: number;
  known?: number;
  incomplete?: State;
  isPrintedOnly?: boolean;
  isRebuildFailureKept?: boolean;
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
  forEachInitialState: (onState: (state: Value[]) => void) => void;
  findUncoveredInitialState: (isMatch: (state: Value[]) => boolean) => Value[] | undefined;
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
      return captureOutput(() =>
        search.evaluateAlias(alias, state, successor, options.isTool ?? false),
      );
    } finally {
      runtime.getLevel = searchLevel;
      runtime.getBehavior = searchBehavior;
    }
  };
  // TLC's Tool#getState fingerprints each state it rebuilds, which sorts its records in place.
  const hasFingerprint = (state: Value[], index: number) => {
    const fingerprintState = getFingerprintState(state);
    const stored = context.fingerprintStates[index];
    return (
      getStateHash(fingerprintState) === getStateHash(stored) &&
      isSameState(fingerprintState, stored)
    );
  };
  const rebuildInitialState = (index: number) => {
    let isFound = false;
    context.forEachInitialState((state) => {
      isFound ||= hasFingerprint(state, index);
    });
  };
  const rebuildFrom = (state: Value[], level: number) => {
    current.rebuilt = { state, level };
    runtime.reseedRandom();
  };
  // TLC's TLCStateMut#equals compares the variables in turn, and a lazy value fails as it reaches it.
  const isEqualState = (state: Value[], successor: Value[]) =>
    state.every((value, position) => {
      const error = getFingerprintError(value);
      // Deviation from TLC: Tool#getState skips a successor whose comparison throws a TLCRuntimeException, so TLC misses the step and reports a TLC bug(5).
      if (error) throw error;
      return isSameValue(value, successor[position]);
    });
  const findStepAction = (
    index: number,
    previous: Value[],
    state: Value[],
    isHeld: boolean,
    isDrawnOn = false,
  ) => {
    const expanding = { ...current };
    Object.assign(current, { index, isExpanding: true, candidate: undefined });
    const key = isHeld ? state : getFingerprintState(state);
    const isMatch = (successor: Successor) =>
      isHeld
        ? isEqualState(key, successor.state)
        : isSameState(getFingerprintState(successor.state), key);
    try {
      current.rebuilt = { state: previous, level: depths[index] };
      const drawn = isDrawnOn ? context.findSuccessorAction(previous, isMatch) : undefined;
      if (drawn) return drawn;
      // Deviation from TLC: when TLCTrace#printTrace and Worker#doPostCondition draw on and miss the step, printTrace leaks a NullPointerException and doPostCondition skips the postcondition.
      rebuildFrom(previous, depths[index]);
      return context.findSuccessorAction(previous, isMatch);
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
    const loopStart = traceOptions.loopStart;
    const rebuilt = is174 && loopStart !== undefined ? loopStart + 1 : steps.length - known;
    const isRebuiltAgain = known > 0 && !is174 && !traceOptions.isPrintedOnly && steps.length > 1;
    const initialOutput =
      known === 0 || (steps.length > 1 && (rebuilt > 0 || is174))
        ? runtime.runWithNewRandom(() => captureOutput(() => rebuildInitialState(path[0])).lines)
        : [];
    const last = steps.length - 1;
    const findPositionAction = (position: number, isDrawnOn = false) =>
      position === 0 || steps[position].action === "Stuttering"
        ? { result: { action: undefined }, lines: [] }
        : captureOutput(() => {
            try {
              return {
                action: findStepAction(
                  path[position - 1],
                  steps[position - 1].state,
                  steps[position].state,
                  known === 2 && position === last,
                  isDrawnOn,
                ),
              };
            } catch (error) {
              const isKept = traceOptions.isRebuildFailureKept && known === 2 && position === last;
              if (!isKept || !(error instanceof TlaEvaluationError)) throw error;
              return { error };
            }
          });
    // TLC's TLCStateRandom reseeds only for another state, so TLC rebuilds the step to a known successor drawing on from where the search stopped, unless it rebuilt a step before it.
    const stepActions = steps.map((_step, position) =>
      findPositionAction(position, known === 2 && position === last && last === 1 && !is174),
    );
    const outputs = stepActions.map((step) => step.lines);
    const failed = stepActions[last].result.error;
    const traceFailure = failed && getTraceFailure(failed, outputs[last]);
    const printed = traceFailure ? steps.slice(0, last) : steps;
    const getAliases = () =>
      alias === undefined
        ? []
        : printed.map((step, position) =>
            getAliasState(
              alias,
              step.state,
              steps[position + 1]?.state ??
                traceOptions.incomplete ??
                steps[loopStart ?? position].state,
              position + 1,
              () => steps.slice(0, position + 1).map((inner) => inner.state),
            ),
          );
    const aliases = getAliases();
    const getAliasOutput = (position: number) => aliases[position]?.lines ?? [];
    const rebuiltOutput = isRebuiltAgain
      ? [
          ...runtime.runWithNewRandom(() => [
            captureOutput(() => rebuildInitialState(path[0])).lines,
            ...steps
              .slice(1, last)
              .map((_step, position) => findPositionAction(position + 1).lines),
          ]),
          findPositionAction(last, known === 2).lines,
        ].flat()
      : [];
    // TLC's Worker#doPostCondition evaluates the alias of each state again after it rebuilds the trace.
    const postconditionAliases = isRebuiltAgain && !traceFailure ? getAliases() : [];
    const loopPosition = loopStart ?? 0;
    const prefixOutput =
      known === 0 && !is174
        ? [
            initialOutput,
            ...outputs.slice(1, loopPosition + 1),
            ...aliases.slice(0, loopPosition).map((aliased) => aliased.lines),
            ...outputs
              .slice(loopPosition + 1)
              .flatMap((lines, offset) => [lines, getAliasOutput(loopPosition + offset)]),
            getAliasOutput(last),
          ].flat()
        : rebuilt > 0
          ? [initialOutput, ...outputs.slice(1, rebuilt)].flat()
          : [];
    return {
      trace: printed.map((step, position) => {
        const action = stepActions[position].result.action;
        const aliasOutput = known === 0 ? [] : getAliasOutput(position);
        const traceStep: TraceStep = {
          action: step.action,
          label: action && getActionLabel(action, options.version),
          state: alias === undefined ? toRecord(step.state) : aliases[position].result,
          output: position === 0 ? prefixOutput : position < rebuilt ? [] : outputs[position],
          ...(aliasOutput.length > 0 && { aliasOutput }),
        };
        if (alias !== undefined || action) {
          context.tracedSteps.set(traceStep, {
            state: toRecord(step.state),
            action,
            alias: postconditionAliases[position]?.result,
          });
        }
        return traceStep;
      }),
      traceOutput: [...rebuiltOutput, ...postconditionAliases.flatMap((aliased) => aliased.lines)],
      ...(traceFailure && { traceFailure }),
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
        ? context.findUncoveredInitialState((state) => hasFingerprint(state, path[0]))
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
    return toTrace([...steps, lastSuccessor], path, { ...traceOptions, known: 2 });
  };
  // TLCTrace#printTrace applies the alias to every state but an initial one it prints without a successor.
  const getStateTrace = (index: number, traceOptions: TraceOptions = {}): Behavior => {
    if (context.parents[index] !== -1) return getTrace(index, undefined, traceOptions);
    const traceOutput =
      is174 || traceOptions.isPrintedOnly
        ? []
        : captureOutput(() => rebuildInitialState(index)).lines;
    const state = states[index];
    if (traceOptions.incomplete !== undefined) {
      return {
        trace: toTrace([{ state, action: undefined }], [index], traceOptions).trace,
        traceOutput,
      };
    }
    const step = { action: undefined, label: undefined, state: toRecord(state) };
    const alias = config.alias;
    if (alias === undefined || traceOptions.isPrintedOnly) return { trace: [step], traceOutput };
    const aliased = getAliasState(alias, state, state, 1, () => [state]);
    context.tracedSteps.set(step, { state: step.state, action: undefined, alias: aliased.result });
    return { trace: [step], traceOutput: [...traceOutput, ...aliased.lines] };
  };
  const getIncompleteStep = (
    incomplete: State,
    level: number,
    step: Omit<TraceStep, "state">,
    action: SpecAction | undefined,
  ): TraceStep => {
    const state = toRecord(incomplete.map((value) => value ?? createModelValue("null")));
    const alias = config.alias;
    const aliased =
      alias === undefined
        ? undefined
        : getAliasState(alias, incomplete, incomplete, level, () => []);
    const traceStep = {
      ...step,
      state: aliased?.result ?? state,
      ...(aliased && aliased.lines.length > 0 && { aliasOutput: aliased.lines }),
    };
    context.tracedSteps.set(traceStep, { state, action });
    return traceStep;
  };
  const getPathSteps = (path: number[]) => getPathStates(path, NEXT_RECOVERY_FAILURE);
  return {
    toTrace,
    findStepAction,
    findSuccessorWithFingerprint,
    getTrace,
    getStateTrace,
    getIncompleteStep,
    getPathSteps,
  };
};
