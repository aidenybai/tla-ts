import type { CheckOptions, OutputLine, TraceFailure, TraceStep } from "./check";
import { getTraceFailure } from "./check-failure";
import type { ModelConfig } from "./config";
import { TlaEvaluationError } from "./errors";
import { isImpure, type Environment, type State } from "./evaluate";
import { getStateHash, isSameState } from "./fingerprints";
import type { Search } from "./search";
import { getActionLabel, type SpecAction } from "./spec-description";
import { getSuccessors, type Successor } from "./successors";
import { isEvalException } from "./tlc/messages";
import {
  createModelValue,
  getFingerprintError,
  hasLazyPart,
  isEqualLikeTlc,
  isSameValue,
  type Value,
} from "./values";

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
  isCurrentKept?: boolean;
  isRebuildFailureKept?: boolean;
  isSuccessorWritten?: boolean;
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
  isTraceRebuilt: boolean;
  captureOutput: <Result>(rebuild: () => Result) => { result: Result; lines: OutputLine[] };
  forEachInitialState: (onState: (state: Value[]) => void) => void;
  findUncoveredInitialState: (isMatch: (state: Value[]) => boolean) => Value[] | undefined;
  findSuccessorAction: (
    state: Value[],
    isMatch: (successor: Successor) => boolean,
  ) => SpecAction | undefined;
}

// Tool#getState skips a successor whose comparison throws a TLCRuntimeException but lets an EvalException through.
// Deviation from TLC: when it skips the step's own successor, TLC reports a TLC bug(5), or a NullPointerException after an initial state.
const isEqualOnRebuild = (value: Value, other: Value) => {
  try {
    return isEqualLikeTlc(value, other);
  } catch (error) {
    if (!(error instanceof TlaEvaluationError) || isEvalException(error)) throw error;
    return false;
  }
};

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
  const rebuildInitialState = (index: number, currentState: Value[] | undefined) =>
    runtime.runWithCurrentState(currentState, () => {
      let isFound = false;
      context.forEachInitialState((state) => {
        isFound ||= hasFingerprint(state, index);
      });
    });
  const rebuildFrom = (state: Value[], level: number) => {
    current.rebuilt = { state, level };
    runtime.reseedRandom();
  };
  // TLC fingerprints a state, which evaluates the VIEW, as StatePrinter prints it and as TLCTrace's random generator seeds itself for it.
  const getViewOutput = (state: Value[], level: number, isSeeding = false) => {
    if (config.view === undefined) return [];
    const rebuilt = current.rebuilt;
    current.rebuilt = { state, level };
    try {
      return captureOutput(() => (isSeeding ? runtime.getRandom() : getFingerprintState(state)))
        .lines;
    } finally {
      current.rebuilt = rebuilt;
    }
  };
  const isEqualState = (state: Value[], successor: Value[]) =>
    state.every((value, position) => {
      const error = getFingerprintError(value);
      if (!error) return isSameValue(value, successor[position]);
      // TLC converts a lazy value as it compares it, so a conversion that throws an EvalException fails the comparison with the fingerprint's error.
      if (isEvalException(error) && hasLazyPart(value)) throw error;
      return isEqualOnRebuild(value, successor[position]);
    });
  // Deviation from TLC: Tool#getState bounds a step's successors by -maxSetSize, so TLC can't print a trace past a state with more.
  const findStepAction = (
    index: number,
    previous: Value[],
    key: Value[],
    isHeld: boolean,
    isDrawnOn = false,
  ) => {
    const expanding = { ...current };
    Object.assign(current, { index, isExpanding: true, candidate: undefined });
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
        ? runtime.runWithNewRandom(
            () =>
              captureOutput(() =>
                rebuildInitialState(
                  path[0],
                  traceOptions.isCurrentKept ? runtime.getCurrentState() : undefined,
                ),
              ).lines,
          )
        : [];
    const last = steps.length - 1;
    const isPrintFingerprinted =
      known > 0 && !is174 && (last > 0 || traceOptions.incomplete !== undefined);
    const findPositionAction = (
      position: number,
      isDrawnOn = false,
      isHeld = known === 2 && position === last,
    ) =>
      position === 0 || steps[position].action === "Stuttering"
        ? { result: { action: undefined }, lines: [] }
        : captureOutput(() => {
            try {
              return {
                action: findStepAction(
                  path[position - 1],
                  steps[position - 1].state,
                  isHeld ? steps[position].state : context.fingerprintStates[path[position]],
                  isHeld,
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
    const findTraceAction = (position: number) =>
      findPositionAction(position, known === 2 && position === last && last === 1 && !is174);
    const getAlias = (name: string, position: number, isPathRebuilt = false) =>
      getAliasState(
        name,
        steps[position].state,
        steps[position + 1]?.state ?? traceOptions.incomplete ?? steps[loopStart ?? position].state,
        position + 1,
        // Deviation from TLC: TLCTrace#printTrace gives the ALIAS an empty Trace when the trace is an initial state and its successor.
        // Deviation from TLC: LiveWorker#printTrace leaves each state of a lasso's prefix out of the Trace its ALIAS reads.
        () => {
          if (isPathRebuilt) rebuildPath(path[position - 1]);
          return steps.slice(0, position + 1).map((inner) => inner.state);
        },
      );
    const loopPosition = loopStart ?? 0;
    const isLasso = known === 0 && !is174;
    const rebuiltFirst = isLasso ? loopPosition + 1 : rebuilt;
    const aliasLag = isLasso ? 1 : 0;
    const isAliasedInTurn = (known > 0 || isLasso) && alias !== undefined;
    const prefixActions = steps
      .slice(0, rebuiltFirst)
      .map((_step, position) => findTraceAction(position));
    const seedOutput =
      isPrintFingerprinted && rebuilt > 1
        ? getViewOutput(steps[rebuilt - 2].state, rebuilt - 1, true)
        : [];
    const prefixAliases = isAliasedInTurn
      ? prefixActions.slice(aliasLag).map((_step, position) => getAlias(alias, position))
      : [];
    const knownActions = steps.slice(rebuiltFirst).map((_step, offset) => {
      const position = rebuiltFirst + offset;
      const step = findTraceAction(position);
      return {
        ...step,
        aliased:
          isAliasedInTurn && !step.result.error ? getAlias(alias, position - aliasLag) : undefined,
      };
    });
    const lastAliases = isAliasedInTurn && isLasso ? [getAlias(alias, last)] : [];
    const stepActions = [...prefixActions, ...knownActions];
    const outputs = stepActions.map((step) => step.lines);
    const failed = stepActions[last].result.error;
    const traceFailure = failed && getTraceFailure(failed, outputs[last]);
    const printed = traceFailure ? steps.slice(0, last) : steps;
    // Deviation from TLC: Worker#doPostCondition rebuilds the states it doesn't read from the trace file with no worker id, so Trace in their alias fails with an ArrayIndexOutOfBoundsException.
    const writtenEnd = known === 2 && !traceOptions.isSuccessorWritten ? last - 1 : last;
    const getAliases = (isPostcondition = false) =>
      alias === undefined
        ? []
        : printed.map((_step, position) =>
            getAlias(
              alias,
              position,
              isPostcondition && context.isTraceRebuilt && position > 0 && position < writtenEnd,
            ),
          );
    const aliases = isAliasedInTurn
      ? [
          ...prefixAliases,
          ...knownActions.flatMap((step) => (step.aliased ? [step.aliased] : [])),
          ...lastAliases,
        ]
      : getAliases();
    const getAliasOutput = (position: number) => aliases[position]?.lines ?? [];
    const viewOutputs = printed.map((step, position) => ({
      rebuilt:
        isPrintFingerprinted && position === rebuilt && rebuilt > 0
          ? getViewOutput(step.state, position + 1)
          : [],
      printed:
        isPrintFingerprinted && (position > 0 || rebuilt === 0)
          ? getViewOutput(step.state, position + 1)
          : [],
    }));
    // TLCTrace#printTrace leaves current the last state it aliases, else the state it rebuilds the last one from.
    // Deviation from TLC: Worker#doPostCondition misses a random initial state drawn from this seed and skips the postcondition.
    const seedPosition = alias === undefined ? last - 1 : last;
    const rebuiltOutput = isRebuiltAgain
      ? [
          getViewOutput(steps[seedPosition].state, seedPosition + 1, true),
          ...runtime.runWithNewRandom(() => [
            captureOutput(() => rebuildInitialState(path[0], steps[seedPosition].state)).lines,
            ...steps
              .slice(1, last)
              .map((_step, position) => findPositionAction(position + 1).lines),
            getViewOutput(steps[Math.max(last - 2, 0)].state, Math.max(last - 1, 1), true),
          ]),
          findPositionAction(last, known === 2, true).lines,
        ].flat()
      : [];
    // TLC's Worker#doPostCondition evaluates the alias of each state again after it rebuilds the trace.
    const postconditionAliases = isRebuiltAgain && !traceFailure ? getAliases(true) : [];
    const prefixOutput = isLasso
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
        ? [initialOutput, ...outputs.slice(1, rebuilt), seedOutput].flat()
        : [];
    return {
      trace: printed.map((step, position) => {
        const action = stepActions[position].result.action;
        const aliasOutput =
          known === 0 ? [] : [...getAliasOutput(position), ...viewOutputs[position].printed];
        const traceStep: TraceStep = {
          action: step.action,
          // Deviation from TLC: when the next-state relation no longer yields a step, as it reads TLCGet("stats"), TLCTrace#printTrace fails with a TLC bug(2) or bug(4).
          label: action && getActionLabel(action, options.version),
          state: alias === undefined ? toRecord(step.state) : aliases[position].result,
          output:
            position === 0
              ? prefixOutput
              : position < rebuilt
                ? []
                : [...viewOutputs[position].rebuilt, ...outputs[position]],
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
    const registers = new Map(runtime.registers);
    const namedRegisters = new Map(runtime.namedRegisters);
    const properties = new Map(runtime.properties);
    const steps = runtime.runWithNewRandom(() => {
      const initial = captureOutput(() =>
        isReducing || isImpure(environment)
          ? runtime.runWithCurrentState(undefined, () =>
              context.findUncoveredInitialState((state) => hasFingerprint(state, path[0])),
            )
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
        const successor = findSuccessorWithFingerprint(
          previous,
          path[position - 1],
          path[position],
        );
        if (!successor) throw new TlaEvaluationError(nextFailure);
        steps.push(successor);
      }
      return steps;
    });
    runtime.registers = registers;
    runtime.namedRegisters = namedRegisters;
    runtime.properties = properties;
    return steps;
  };
  const getIndexPath = (index: number) => {
    const path: number[] = [];
    for (let position = index; position !== -1; position = context.parents[position]) {
      path.unshift(position);
    }
    return path;
  };
  // TLCExt#getTrace rebuilds the path from fingerprints, which evaluates Init and the actions again.
  // Deviation from TLC: TLCExt#getTrace leaves a rebuilt state current, so later draws and Trace in the same step start from it.
  // Deviation from TLC: TLCExt#getTrace draws for the initial state from the current state's seed, so it misses a random one and throws a NullPointerException.
  const rebuildPath = (index: number) => {
    const path = getIndexPath(index);
    if (path.length === 0) return;
    runtime.runWithNewRandom(() => {
      rebuildInitialState(path[0], runtime.getCurrentState());
      for (let position = 1; position < path.length; position++) {
        const source = path[position - 1];
        findStepAction(source, states[source], context.fingerprintStates[path[position]], false);
      }
    });
  };
  const getTrace = (index: number, lastSuccessor?: Successor, traceOptions: TraceOptions = {}) => {
    const path = getIndexPath(index);
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
    const state = states[index];
    if (traceOptions.incomplete !== undefined) {
      return {
        trace: toTrace([{ state, action: undefined }], [index], traceOptions).trace,
        traceOutput: [],
      };
    }
    const viewOutput = is174 ? [] : getViewOutput(state, 1);
    const traceOutput =
      is174 || traceOptions.isPrintedOnly
        ? []
        : [
            ...getViewOutput(state, 1),
            ...captureOutput(() => rebuildInitialState(index, undefined)).lines,
          ];
    const step = {
      action: undefined,
      label: undefined,
      state: toRecord(state),
      ...(viewOutput.length > 0 && { aliasOutput: viewOutput }),
    };
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
    rebuildPath,
  };
};
