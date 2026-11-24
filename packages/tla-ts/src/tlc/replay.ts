import { isAssumeProve, type Expression, type SourceLocation } from "../ast";
import { getKindString } from "../builtins";
import { formatRange, TlaEvaluationError, TlaUnassignedError, TlaUncodedError } from "../errors";
import { EXIT_STATUS, setExitCode } from "../exit-codes";
import {
  chargeContexts,
  chargeRandomOrder,
  countArgumentTuple,
  countCoverage,
  createChargedEnumerator,
  enterFrames,
  exitFrames,
  getCoverageNode,
  getEnteredFrames,
  hideFrames,
  restoreFrames,
  runAtCoverageNode,
  runReportedInto,
  type ChargedBound,
  type Coverage,
} from "../coverage";
import {
  bindDefinitions,
  bindLazyArguments,
  bindOperatorArguments,
  describeNode,
  describeRange,
  evaluate,
  forEachBoundElement,
  freezeCallStack,
  getArgumentTuple,
  getBodyLiteral,
  getChargedBounds,
  getContextElements,
  getLazyFunction,
  getLookupValue,
  getMissingArgumentDescriber,
  getQuantifierElements,
  getSubstituteClosure,
  getUnchangedVariables,
  mapBoundSets,
  NULL_STATE,
  toKeepLazyContext,
  lookupScope,
  resolveApplyOperator,
  resolveGlobalOperator,
  type CallStack,
  type Context,
  type Environment,
  type Scope,
  type State,
  toUnspecifiedSubscriptError,
  type UnchangedVariable,
} from "../evaluate";
import {
  applyFunctionWith,
  createTuple,
  formatValue,
  getLazyFunctionNode,
  getStreamedElements,
  isElementOf,
  isEqualLikeTlc,
  isFunctionValue,
  isTlcEnumerable,
  setTrace,
  streamChargedSet,
  type Value,
} from "../values";
import {
  getActionPredicate,
  getSubstitutedName,
  getSubstitutedOccurrence,
  isSubstitutionDefinition,
  substitutedExpressions,
  substitutionFrames,
} from "../instances";
import { getKeyName, untracedExpressions } from "../resolve";
import { CORE_OPERATORS } from "../standard-modules";
import type { SuccessorGenerator } from "../successors";
import { MESSAGE_CODE } from "./messages";
import { getRandomSubset, nextPrime } from "./random";

interface ReplayAction {
  expression: Expression;
  scope: Scope | undefined;
}

interface ActionItem {
  kind: "Predicate" | "Unchanged" | "Changed";
  expression: Expression;
  scope: Scope | undefined;
  node: number;
  frameDepth: number;
  rest: ActionItem | undefined;
}

interface RunKind {
  isInit: boolean;
  isEnabled: boolean;
  initPredicates?: ReadonlyMap<Expression, Expression>;
}

interface Replay {
  environment: Environment;
  callStack: CallStack | undefined;
  coverage: Coverage | undefined;
  isInit: boolean;
  isEnabled: boolean;
  current: Value[] | undefined;
  onState: (state: Value[]) => void;
  onIncomplete: ((state: State) => boolean) | undefined;
  generator: SuccessorGenerator | undefined;
}

const withFrame = <Result>(replay: Replay, expression: Expression, run: () => Result): Result => {
  const callStack = replay.callStack;
  if (!callStack) return run();
  const isEntered = callStack.expressions.at(-1) === expression;
  const frames = (!isEntered && substitutionFrames.get(expression)) || [];
  const isTraced = !untracedExpressions.has(expression);
  callStack.expressions.push(...frames);
  if (isTraced) callStack.expressions.push(expression);
  const outerSets = setTrace.sets;
  const sets = outerSets ?? [];
  const depth = sets.length;
  setTrace.sets = sets;
  try {
    return run();
  } catch (error) {
    freezeCallStack(callStack, sets.slice(depth), error);
    throw error;
  } finally {
    if (!callStack.isFrozen) callStack.expressions.length -= frames.length + (isTraced ? 1 : 0);
    sets.length = depth;
    setTrace.sets = outerSets;
  }
};

const getNode = (replay: Replay, node: number, expression: Expression) =>
  replay.coverage && node >= 0 ? getCoverageNode(replay.coverage, node, expression) : -1;

const runAt = <Result>(replay: Replay, node: number, run: () => Result) =>
  replay.coverage ? runAtCoverageNode(replay.coverage, node, run) : run();

const evaluateAt = (replay: Replay, node: number, expression: Expression, context: Context) =>
  runAt(replay, node, () => evaluate(expression, context));

const evaluateOperatorAt = (
  replay: Replay,
  node: number,
  expression: Expression,
  context: Context,
) => {
  const value = evaluateAt(replay, node, expression, context);
  const coverage = replay.coverage;
  if (coverage?.covered.has(expression)) {
    for (let item = node; item !== -1; item = coverage.prefixes[item]) coverage.primary[item]--;
  }
  return value;
};

const getContext = (replay: Replay, scope: Scope | undefined, partial: State): Context =>
  replay.isInit
    ? { environment: replay.environment, scope, state: partial, next: undefined }
    : { environment: replay.environment, scope, state: replay.current, next: partial };

const isComplete = (partial: State): partial is Value[] => !partial.includes(undefined);

const getEmptyState = (environment: Environment) => environment.variables.map(() => undefined);

const assign = (partial: State, index: number, value: Value) => {
  const copy = [...partial];
  copy[index] = value;
  return copy;
};

const getPrefix = (expression: Expression & { kind: "And" | "Or" }, count: number): Expression => {
  const first = expression.operands[0].location;
  const range = expression.location.range;
  const end = expression.prefixEnds?.[count - 2];
  const location: SourceLocation =
    range && end ? { ...first, range: { ...range, end } } : expression.location;
  return { ...expression, operands: expression.operands.slice(0, count), location };
};

const getPrefixNode = (replay: Replay, node: number) =>
  replay.coverage ? replay.coverage.prefixes[node] : -1;

const getIdentifierName = (expression: Expression) =>
  expression.kind === "Identifier" ? expression.name : undefined;

// Spec#collectPrimedLocs ignores the substitutions of an instance it enters, so a declaration there names a state variable only by its own name.
const getNamedOccurrence = (expression: Expression, frames: Expression[]) => {
  const substitution = substitutedExpressions.get(expression);
  if (substitution && !frames.includes(substitution.frame)) return undefined;
  const name = getSubstitutedName(expression);
  return name === undefined
    ? undefined
    : { name, expression: getSubstitutedOccurrence(expression) ?? expression };
};

const bindLetDefinitions = (
  environment: Environment,
  expression: Expression & { kind: "Let" },
  scope: Scope | undefined,
) =>
  bindDefinitions(expression.definitions, {
    environment,
    scope,
    state: undefined,
    next: undefined,
  });

const getVariable = (
  environment: Environment,
  expression: Expression,
  scope: Scope | undefined,
  frames?: Expression[],
): number | undefined => {
  const occurrence = frames && getNamedOccurrence(expression, frames);
  if (occurrence) return environment.variableIndex.get(occurrence.name);
  if (expression.kind === "Label") return getVariable(environment, expression.body, scope, frames);
  if (expression.kind === "Let") {
    return getVariable(
      environment,
      expression.body,
      bindLetDefinitions(environment, expression, scope),
      frames,
    );
  }
  if (expression.kind === "Apply" && expression.resolution?.isSubstitute) {
    const closure = getSubstituteClosure(expression, scope);
    return closure
      ? getVariable(
          environment,
          closure.body,
          bindOperatorArguments(closure, expression.args, {
            environment,
            scope,
            state: undefined,
            next: undefined,
          }),
          frames,
        )
      : undefined;
  }
  const name = getIdentifierName(expression);
  if (name === undefined) {
    return expression.kind === "EnabledVariable"
      ? environment.variableIndex.get(expression.name)
      : undefined;
  }
  const binding = lookupScope(scope, name);
  if (binding?.kind === "Thunk") {
    return getVariable(environment, binding.expression, binding.scope, frames);
  }
  if (binding?.kind === "Value") return undefined;
  const index = binding ? undefined : environment.variableIndex.get(name);
  if (index !== undefined) return index;
  const operator = binding ? binding.operator : resolveGlobalOperator(name, environment);
  return operator?.kind === "Closure" && operator.params.length === 0
    ? getVariable(environment, operator.body, operator.scope, frames)
    : undefined;
};

const getPrimedVariable = (
  environment: Environment,
  expression: Expression,
  scope: Scope | undefined,
  frames?: Expression[],
): number | undefined => {
  if (expression.kind === "Prime") {
    return getVariable(environment, expression.expression, scope, frames);
  }
  if (expression.kind === "Label") {
    return getPrimedVariable(environment, expression.body, scope, frames);
  }
  if (expression.kind === "Let") {
    return getPrimedVariable(
      environment,
      expression.body,
      bindLetDefinitions(environment, expression, scope),
      frames,
    );
  }
  const name = getIdentifierName(expression);
  if (name === undefined) return undefined;
  const binding = lookupScope(scope, name);
  if (binding?.kind === "Thunk") {
    return getPrimedVariable(environment, binding.expression, binding.scope, frames);
  }
  if (binding?.kind === "Value") return undefined;
  const operator = binding ? binding.operator : resolveGlobalOperator(name, environment);
  return operator?.kind === "Closure" && operator.params.length === 0
    ? getPrimedVariable(environment, operator.body, operator.scope, frames)
    : undefined;
};

export const getComputation = (run: RunKind) =>
  run.isInit ? "initial states" : run.isEnabled ? "ENABLED" : "next states";

export const createRunError = (run: RunKind, message: string) => {
  const error = new TlaEvaluationError(message);
  return run.isInit ? error : setExitCode(error, EXIT_STATUS.error);
};

export const getRelationMessage = (run: RunKind, expression: Expression) => {
  const node = describeNode(expression);
  return run.isEnabled
    ? `Attempted to compute ENABLED on a non-boolean expression.\n${node}`
    : `The ${run.isInit ? "init" : "next"} state relation is not a boolean expression.\n${node}`;
};

export const getIfConditionMessage = (run: RunKind, value: Value, expression: Expression) => {
  const kind = getKindString(value);
  const range = describeRange(expression);
  if (run.isEnabled) {
    return `In computing ENABLED, a non-boolean expression(${kind}) was used as the guard condition of an IF.\n${range}`;
  }
  return `In computing ${getComputation(run)}, a non-boolean expression (${kind}) was used as the condition of an IF.${run.isInit ? "\n" : ""}${range}`;
};

export const getNonFunctionMessage = (run: RunKind, value: Value, expression: Expression) =>
  `In computing ${getComputation(run)}, a non-function (${getKindString(value)}) was applied as a function.\n${describeRange(expression)}`;

export const getFunctionResultMessage = (run: RunKind, expression: Expression) =>
  `In computing ${getComputation(run)}, TLC expected a boolean expression,\nbut didn't find one.\n${describeRange(expression)}`;

export const getCaseGuardMessage = (run: RunKind, value: Value, body: Expression) =>
  `In computing ${getComputation(run)}, a non-boolean expression${run.isEnabled ? "" : " "}(${getKindString(value)}) was used as a guard condition of a CASE.\n${describeNode(body)}`;

export const getCaseOtherMessage = (run: RunKind, expression: Expression) =>
  `In computing ${getComputation(run)}, TLC encountered a CASE with no conditions true.\n${describeRange(expression)}`;

export const getImpliesConditionMessage = (run: RunKind, value: Value, expression: Expression) => {
  const kind = getKindString(value);
  const range = describeRange(expression);
  if (run.isInit)
    return `In computing initial states of a predicate of form P => Q, P was ${kind}\n.${range}`;
  return run.isEnabled
    ? `While computing ENABLED of an expression of the form P => Q, P was ${kind}.\n${range}`
    : `In computing next states of a predicate of the form P => Q, P was\n${kind}.\n${range}`;
};

const CORE_OPERATOR_NAMES = new Set(CORE_OPERATORS.map((operator) => operator.name));

const isBuiltInOperation = (expression: Expression) =>
  expression.kind === "Apply"
    ? CORE_OPERATOR_NAMES.has(expression.operator)
    : expression.kind !== "Identifier" && !LITERAL_KINDS.has(expression.kind);

const getExpectedBooleanMessage = (run: RunKind, found: string, expression: Expression) =>
  `In computing ${getComputation(run)}, TLC expected a boolean expression,\nbut instead found ${found}.\n${describeNode(expression)}`;

export const holdsValue = (run: RunKind, expression: Expression, value: Value, isWalked = true) => {
  if (typeof value === "boolean") return value;
  const message =
    isWalked && LITERAL_KINDS.has(expression.kind)
      ? getRelationMessage(run, expression)
      : getExpectedBooleanMessage(
          run,
          formatValue(value),
          isWalked
            ? expression
            : (run.initPredicates?.get(expression) ??
                getSubstitutedOccurrence(expression) ??
                getActionPredicate(expression)),
        );
  throw run.isInit && isWalked && isBuiltInOperation(expression)
    ? new TlaUncodedError(message)
    : createRunError(run, message);
};

// Tool#lookup gives an unassigned variable as its declaration, which Tool#getInitStatesAppl prints as the value it found.
export const createUnassignedConjunctError = (
  run: Pick<Replay, "environment" | "isInit" | "isEnabled">,
  expression: Expression,
  index: number,
) => {
  const range = run.environment.variableLocations[index].range;
  const declaration = range ? formatRange(range) : "Unknown location";
  return createRunError(run, getExpectedBooleanMessage(run, declaration, expression));
};

// Deviation from TLC: Tool#getNextStates0 takes its all-assigned path when warnings are on, though its comment says off, so it evaluates UNCHANGED as a boolean and doesn't warn.
export const findChangedVariable = (
  variables: UnchangedVariable[],
  partial: State,
  current: Value[],
) =>
  variables.find((variable) => {
    const assigned = partial[variable.index];
    return assigned !== undefined && !isEqualLikeTlc(current[variable.index], assigned);
  });

export const isAssignedShortcut = (replay: Pick<Replay, "environment" | "isInit" | "isEnabled">) =>
  !replay.isEnabled && (replay.isInit || replay.environment.runtime.isWarningEnabled);

const proceed = (
  replay: Replay,
  items: ActionItem | undefined,
  partial: State,
  node: number,
): boolean => {
  const isProduced = proceedItems(replay, items, partial, node);
  if (isProduced && replay.coverage && !replay.isInit) countCoverage(replay.coverage, node);
  return isProduced;
};

const addState = (replay: Replay, state: Value[], node: number) => {
  const coverage = replay.coverage;
  if (coverage && replay.isInit) {
    countCoverage(coverage, node);
    countCoverage(coverage, coverage.roots[node]);
  }
  if (!coverage || coverage.frames.length === 0) {
    replay.onState(state);
    return true;
  }
  const hidden = hideFrames(coverage, 0);
  try {
    replay.onState(state);
  } finally {
    restoreFrames(coverage, hidden);
  }
  return true;
};

const proceedItems = (
  replay: Replay,
  items: ActionItem | undefined,
  partial: State,
  node: number,
): boolean => {
  if (items === undefined) {
    if (isComplete(partial)) return addState(replay, partial, node);
    return replay.onIncomplete?.(partial) ?? false;
  }
  const coverage = replay.coverage;
  if (coverage && coverage.frames.length > items.frameDepth) {
    const hidden = hideFrames(coverage, items.frameDepth);
    try {
      return proceedItems(replay, items, partial, node);
    } finally {
      restoreFrames(coverage, hidden);
    }
  }
  if (isComplete(partial) && isAssignedShortcut(replay)) {
    return proceedAssigned(replay, items, partial, node);
  }
  if (items.kind === "Predicate") {
    return visit(replay, items.expression, items.rest, items.scope, partial, items.node);
  }
  if (items.kind === "Unchanged") {
    return visitUnchanged(replay, items.expression, items.rest, items.scope, partial, items.node);
  }
  return isChanged(replay, items, partial) && proceed(replay, items.rest, partial, items.node);
};

const evaluateInPartial = (
  replay: Replay,
  node: number,
  expression: Expression,
  scope: Scope | undefined,
  partial: State,
  next: State | undefined,
) => {
  try {
    return evaluateAt(replay, node, expression, {
      environment: replay.environment,
      scope,
      state: partial,
      next,
    });
  } catch (error) {
    if (replay.isEnabled && error instanceof TlaUnassignedError) return error;
    throw error;
  }
};

const isChanged = (replay: Replay, item: ActionItem, partial: State) => {
  const before = evaluateAt(replay, item.node, item.expression, {
    environment: replay.environment,
    scope: item.scope,
    state: replay.current,
    next: undefined,
  });
  // Tool#getNextStates evaluates a CHANGED item in s1 with TLCState.Empty, and Tool#enabled with TLCState.Null.
  const after = evaluateInPartial(
    replay,
    item.node,
    item.expression,
    item.scope,
    partial,
    replay.isEnabled ? NULL_STATE : undefined,
  );
  if (after instanceof TlaUnassignedError) {
    throw toUnspecifiedSubscriptError(after, replay.environment.runtime.version);
  }
  try {
    return !isEqualLikeTlc(before, after);
  } catch (error) {
    if (replay.callStack) freezeCallStack(replay.callStack, [before], error);
    throw error;
  }
};

const proceedAssigned = (
  replay: Replay,
  items: ActionItem | undefined,
  partial: Value[],
  node: number,
): boolean => {
  const coverage = replay.coverage;
  for (let item = items; item !== undefined; item = item.rest) {
    if (coverage && coverage.frames.length > item.frameDepth) {
      const hidden = hideFrames(coverage, item.frameDepth);
      try {
        return proceedAssigned(replay, item, partial, node);
      } finally {
        restoreFrames(coverage, hidden);
      }
    }
    if (item.kind === "Unchanged") {
      return visitUnchanged(replay, item.expression, item.rest, item.scope, partial, item.node);
    }
    const isHeld =
      item.kind === "Changed"
        ? isChanged(replay, item, partial)
        : holdsValue(
            replay,
            item.expression,
            evaluateAt(replay, item.node, item.expression, getContext(replay, item.scope, partial)),
            false,
          );
    if (!isHeld) {
      if (coverage && replay.isInit) coverage.secondary[coverage.roots[node]]++;
      const current = replay.current;
      if (current && item.kind === "Predicate" && item.expression.kind === "Unchanged") {
        const variables = getUnchangedVariables(item.expression.expression, replay.environment);
        const changed = variables && findChangedVariable(variables, partial, current);
        if (changed) warnChangedUnchanged(replay.environment, changed.index, changed.expression);
      }
      return false;
    }
  }
  return addState(replay, partial, node);
};

const visit = (
  replay: Replay,
  expression: Expression,
  items: ActionItem | undefined,
  scope: Scope | undefined,
  partial: State,
  parent: number,
): boolean =>
  visitAt(replay, expression, items, scope, partial, getNode(replay, parent, expression));

const visitAt = (
  replay: Replay,
  expression: Expression,
  items: ActionItem | undefined,
  scope: Scope | undefined,
  partial: State,
  node: number,
): boolean => {
  const coverage = replay.coverage;
  const frames = coverage && substitutionFrames.get(expression);
  const entered = coverage && frames ? enterFrames(coverage, frames, node, false) : 0;
  if (!coverage || entered === 0)
    return visitFramed(replay, expression, items, scope, partial, node);
  try {
    return visitFramed(replay, expression, items, scope, partial, node);
  } finally {
    exitFrames(coverage, entered);
  }
};

const visitFramed = (
  replay: Replay,
  expression: Expression,
  items: ActionItem | undefined,
  scope: Scope | undefined,
  partial: State,
  node: number,
): boolean =>
  withFrame(replay, expression, () => {
    switch (expression.kind) {
      case "Let": {
        const context = getContext(replay, scope, partial);
        const definitions = expression.definitions;
        const bound = replay.coverage
          ? runAtCoverageNode(replay.coverage, node, () =>
              bindDefinitions(definitions, context, {
                impure: new Set(
                  replay.isEnabled && !replay.environment.boundSubstitutions.lets.has(expression)
                    ? definitions.filter(isSubstitutionDefinition)
                    : definitions,
                ),
                streamed: new Set(),
              }),
            )
          : bindDefinitions(
              definitions,
              context,
              replay.isEnabled
                ? undefined
                : { impure: new Set(), streamed: new Set(), isFunctionRebuilt: true },
            );
        return visit(replay, expression.body, items, bound, partial, node);
      }
      case "Label":
        return visit(replay, expression.body, items, scope, partial, node);
      case "Selection":
        return visit(replay, expression.expression, items, scope, partial, node);
      default:
        if (LITERAL_KINDS.has(expression.kind) || isAssumeProve(expression)) {
          throw createRunError(replay, getRelationMessage(replay, expression));
        }
        return withFrame(replay, expression, () =>
          visitApplication(replay, expression, items, scope, partial, node),
        );
    }
  });

const visitValue = (
  replay: Replay,
  expression: Expression,
  value: Value,
  items: ActionItem | undefined,
  partial: State,
  node: number,
) => holdsValue(replay, expression, value) && proceed(replay, items, partial, node);

const BUILT_IN_OPERATORS = new Set([
  "=",
  "#",
  "~",
  "<=>",
  "/\\",
  "\\/",
  "=>",
  "\\in",
  "\\notin",
  "\\subseteq",
  "\\cup",
  "\\cap",
  "\\",
  "SUBSET",
  "UNION",
  "DOMAIN",
  "~>",
  "-+->",
  "\\cdot",
]);

const visitDefined = (
  replay: Replay,
  expression: Expression & { kind: "Identifier" | "Apply" },
  items: ActionItem | undefined,
  scope: Scope | undefined,
  partial: State,
  node: number,
): boolean => {
  const context = getContext(replay, scope, partial);
  if (expression.kind === "Identifier") {
    const binding = lookupScope(scope, expression.name);
    // Tool#enabledApplImpl visits a LazyValue's expression even when it holds a value, where Tool#getNextStatesAppl takes the value.
    if (
      binding?.kind === "Thunk" &&
      (replay.isEnabled ? !binding.isReleased : binding.cache === undefined)
    ) {
      const thunkNode = replay.coverage?.values.get(binding) ?? node;
      return visit(replay, binding.expression, items, binding.scope, partial, thunkNode);
    }
    if (
      binding?.kind === "Operator" &&
      binding.operator.kind === "Closure" &&
      binding.operator.params.length === 0
    ) {
      return visit(replay, binding.operator.body, items, binding.operator.scope, partial, node);
    }
    const definition = binding ? undefined : replay.environment.definitions.get(expression.name);
    const operator = binding
      ? undefined
      : resolveGlobalOperator(expression.name, replay.environment);
    if (
      operator?.kind === "Closure" &&
      operator.params.length === 0 &&
      !replay.environment.variableIndex.has(expression.name) &&
      !(definition && getLookupValue(definition, replay.environment) !== undefined)
    ) {
      return visit(replay, operator.body, items, operator.scope, partial, node);
    }
    const variableIndex = binding
      ? undefined
      : replay.environment.variableIndex.get(expression.name);
    if (replay.isInit && variableIndex !== undefined && partial[variableIndex] === undefined) {
      throw createUnassignedConjunctError(replay, expression, variableIndex);
    }
    return visitValue(
      replay,
      expression,
      evaluateOperatorAt(replay, node, expression, context),
      items,
      partial,
      node,
    );
  }
  const operator = resolveApplyOperator(expression, context);
  if (
    operator?.kind === "Closure" &&
    operator.params.length === expression.args.length &&
    getBodyLiteral(operator.body, replay.environment) === undefined
  ) {
    const bound = runAt(replay, node, () =>
      bindOperatorArguments(operator, expression.args, context),
    );
    return visit(replay, operator.body, items, bound, partial, node);
  }
  const value = BUILT_IN_OPERATORS.has(expression.operator)
    ? evaluateAt(replay, node, expression, context)
    : evaluateOperatorAt(replay, node, expression, context);
  return visitValue(replay, expression, value, items, partial, node);
};

const proceedWithValue = (
  replay: Replay,
  items: ActionItem | undefined,
  partial: State,
  index: number,
  value: Value,
  node: number,
) => {
  const assigned = partial[index];
  if (assigned === undefined) return proceed(replay, items, assign(partial, index, value), node);
  return isEqualLikeTlc(assigned, value) && proceed(replay, items, partial, node);
};

const createItem = (
  replay: Replay,
  kind: ActionItem["kind"],
  expression: Expression,
  scope: Scope | undefined,
  node: number,
  rest: ActionItem | undefined,
): ActionItem => ({
  kind,
  expression,
  scope,
  node,
  frameDepth: replay.coverage?.frames.length ?? 0,
  rest,
});

const visitAssignment = (
  replay: Replay,
  expression: Expression & { kind: "Apply" },
  items: ActionItem | undefined,
  scope: Scope | undefined,
  partial: State,
  node: number,
) => {
  const [target, source] = expression.args;
  const index = replay.isInit
    ? getVariable(replay.environment, target, scope)
    : getPrimedVariable(replay.environment, target, scope);
  const context = getContext(replay, scope, partial);
  if (index === undefined) {
    return (
      evaluateAt(replay, node, expression, context) === true &&
      proceed(replay, items, partial, node)
    );
  }
  const value = evaluateAt(replay, node, source, context);
  const assigned = partial[index];
  if (expression.operator === "=") {
    return proceedWithValue(replay, items, partial, index, value, node);
  }
  const set: Value =
    expression.operator !== "\\subseteq"
      ? value
      : replay.coverage
        ? { kind: "Subset", base: value, cost: { node, charges: replay.coverage } }
        : { kind: "Subset", base: value, cost: undefined };
  if (typeof set === "object" && set !== value) replay.callStack?.sources.set(set, source);
  if (assigned !== undefined) {
    return (
      evaluateAt(replay, node, expression, context) === true &&
      proceed(replay, items, partial, node)
    );
  }
  if (!isTlcEnumerable(set))
    throw new TlaEvaluationError("The right side of \\IN is not enumerable.");
  const generator = replay.generator;
  const streamed =
    replay.coverage && !generator ? streamChargedSet(replay.coverage, set) : undefined;
  const elements = streamed ?? getStreamedElements(set);
  if (generator) {
    const order = getRandomOrder(replay, set, elements);
    for (let position = 0; position < order.length; position++) {
      const isProduced = proceed(replay, items, assign(partial, index, order[position]), node);
      if (generator.kept > 0) return isProduced;
    }
  }
  const enumerator =
    replay.coverage && streamed === undefined
      ? createChargedEnumerator(replay.coverage, set, elements, false)
      : undefined;
  const isProduced = elements.reduce<boolean>((isProduced, element) => {
    enumerator?.next();
    return proceed(replay, items, assign(partial, index, element), node) || isProduced;
  }, false);
  enumerator?.next();
  return isProduced;
};

const ASSIGNMENT_OPERATORS = new Set(["=", "\\in", "\\subseteq"]);

export const LITERAL_KINDS = new Set<Expression["kind"]>(["Number", "Decimal", "String"]);

const ENABLED_TEMPORAL_FORMS: Partial<Record<Expression["kind"], string>> = {
  Always: "[]",
  Eventually: "<>",
  WeakFairness: "WF",
  StrongFairness: "SF",
};

export const getEnabledFailure = (expression: Expression) => {
  const form =
    expression.kind === "Apply" && (expression.operator === "~>" || expression.operator === "-+->")
      ? expression.operator === "~>"
        ? "a ~> b"
        : "a -+-> formula"
      : ENABLED_TEMPORAL_FORMS[expression.kind];
  if (form !== undefined) {
    return `In computing ENABLED, TLC encountered a temporal formula (${form}).\n${describeRange(expression)}`;
  }
  if (expression.kind === "UnboundedQuantifier") {
    return expression.isTemporal
      ? `In computing ENABLED, TLC encountered temporal quantifier.\n${describeRange(expression)}`
      : `In computing ENABLED, TLC encountered unbounded quantifier. Make sure that the expression is of form ${expression.quantifier === "Forall" ? "\\A" : "\\E"} x \\in S: P(x).\n${describeRange(expression)}`;
  }
  if (expression.kind === "Choose" && expression.set === undefined) {
    return `In computing ENABLED, TLC encountered unbounded CHOOSE. Make sure that the expression is of form CHOOSE x \\in S: P(x).\n${describeRange(expression)}`;
  }
  return undefined;
};

const getRandomOrder = (replay: Replay, set: Value, elements: Value[]) => {
  const runtime = replay.environment.runtime;
  const order = getRandomSubset(elements.length, set, runtime.getRandom(), runtime.version);
  if (replay.coverage) chargeRandomOrder(replay.coverage, set, elements.length);
  return order;
};

const getBindings = (
  replay: Replay,
  expression: Expression & { kind: "Exists" | "Forall" },
  context: Context,
  node: number,
) => {
  const bindings: (Scope | undefined)[] = [];
  const version = replay.environment.runtime.version;
  const coverage = replay.coverage;
  const bounded = runAt(replay, node, () =>
    coverage
      ? getChargedBounds(expression.bounds, context, coverage, version)
      : mapBoundSets(expression.bounds, (set): ChargedBound => {
          const value = evaluate(set, context);
          return { kind: "Listed", value, elements: getQuantifierElements(value, set, version) };
        }),
  );
  const sets = bounded.map((item) => item.elements);
  forEachBoundElement(expression.bounds, sets, context.scope, (bound) => {
    bindings.push(bound);
    return false;
  });
  const charge = coverage && chargeContexts(coverage, bounded);
  return { bindings, charge };
};

const evaluateArgument = (
  expression: Expression & { kind: "FunctionApplication" },
  context: Context,
) => {
  const args = expression.args.map((arg) => evaluate(arg, context));
  return args.length === 1 ? args[0] : createTuple(args);
};

const visitApplication = (
  replay: Replay,
  expression: Expression,
  items: ActionItem | undefined,
  scope: Scope | undefined,
  partial: State,
  node: number,
): boolean => {
  const context = getContext(replay, scope, partial);
  switch (expression.kind) {
    case "Identifier":
      return visitDefined(replay, expression, items, scope, partial, node);
    case "Apply": {
      if (ASSIGNMENT_OPERATORS.has(expression.operator) && expression.args.length === 2) {
        return visitAssignment(replay, expression, items, scope, partial, node);
      }
      if (expression.operator === "=>" && expression.args.length === 2) {
        const condition = evaluateAt(replay, node, expression.args[0], context);
        if (typeof condition !== "boolean") {
          throw createRunError(replay, getImpliesConditionMessage(replay, condition, expression));
        }
        if (condition) return visit(replay, expression.args[1], items, scope, partial, node);
        return proceed(replay, items, partial, node);
      }
      return visitDefined(replay, expression, items, scope, partial, node);
    }
    case "And": {
      const operands = expression.operands;
      if (expression.isBulleted || operands.length === 2) {
        const rest = operands
          .slice(1)
          .reduceRight<ActionItem | undefined>(
            (tail, operand) => createItem(replay, "Predicate", operand, scope, node, tail),
            items,
          );
        return visit(replay, operands[0], rest, scope, partial, node);
      }
      const last = operands[operands.length - 1];
      return visitAt(
        replay,
        getPrefix(expression, operands.length - 1),
        createItem(replay, "Predicate", last, scope, node, items),
        scope,
        partial,
        getPrefixNode(replay, node),
      );
    }
    case "Or": {
      const operands = expression.operands;
      const isWhole = expression.isBulleted || operands.length === 2;
      const generator = replay.generator;
      if (generator) {
        const count = isWhole ? operands.length : 2;
        const start = Math.floor(generator.random.nextDouble() * count);
        const prime = nextPrime(generator.random);
        let isProduced = false;
        for (let attempt = 0; attempt < count; attempt++) {
          const choice = (start + attempt * prime) % count;
          const isChoiceProduced =
            isWhole || choice === 1
              ? visit(
                  replay,
                  operands[isWhole ? choice : operands.length - 1],
                  items,
                  scope,
                  partial,
                  node,
                )
              : visitAt(
                  replay,
                  getPrefix(expression, operands.length - 1),
                  items,
                  scope,
                  partial,
                  getPrefixNode(replay, node),
                );
          isProduced = isChoiceProduced || isProduced;
          if (generator.kept > 0) return isProduced;
        }
        return isProduced;
      }
      if (isWhole) {
        return operands.reduce(
          (isProduced, operand) =>
            visit(replay, operand, items, scope, partial, node) || isProduced,
          false,
        );
      }
      const isPrefixProduced = visitAt(
        replay,
        getPrefix(expression, operands.length - 1),
        items,
        scope,
        partial,
        getPrefixNode(replay, node),
      );
      const isLastProduced = visit(
        replay,
        operands[operands.length - 1],
        items,
        scope,
        partial,
        node,
      );
      return isPrefixProduced || isLastProduced;
    }
    case "Exists": {
      const generator = replay.generator;
      if (generator) {
        const version = replay.environment.runtime.version;
        const orders = runAt(replay, node, () =>
          mapBoundSets(expression.bounds, (set) => evaluate(set, context)),
        ).map((set, position) =>
          getRandomOrder(
            replay,
            set,
            getContextElements(set, expression.bounds[position].set, version),
          ),
        );
        let isProduced = false;
        forEachBoundElement(expression.bounds, orders, context.scope, (bound) => {
          isProduced = visit(replay, expression.body, items, bound, partial, node) || isProduced;
          return generator.kept > 0;
        });
        return isProduced;
      }
      const bound = getBindings(replay, expression, context, node);
      return bound.bindings.reduce((isProduced, scope) => {
        bound.charge?.();
        return visit(replay, expression.body, items, scope, partial, node) || isProduced;
      }, false);
    }
    case "Forall": {
      const bound = getBindings(replay, expression, context, node);
      const bounds = bound.bindings;
      bounds.forEach(() => bound.charge?.());
      if (bounds.length === 0) return proceed(replay, items, partial, node);
      const rest = bounds
        .slice(1)
        .reduce<ActionItem | undefined>(
          (tail, bound) => createItem(replay, "Predicate", expression.body, bound, node, tail),
          items,
        );
      return visit(replay, expression.body, rest, bounds[0], partial, node);
    }
    case "If": {
      const condition = evaluateAt(replay, node, expression.condition, context);
      if (typeof condition !== "boolean") {
        throw createRunError(replay, getIfConditionMessage(replay, condition, expression));
      }
      const branch = condition ? expression.consequent : expression.alternative;
      return visit(replay, branch, items, scope, partial, node);
    }
    case "Case": {
      const visitArm = () => {
        const arm = expression.arms.find((candidate) => {
          const value = evaluateAt(replay, node, candidate.condition, context);
          if (typeof value === "boolean") return value;
          throw createRunError(replay, getCaseGuardMessage(replay, value, candidate.body));
        });
        const body = arm?.body ?? expression.other;
        if (body === undefined) {
          throw createRunError(replay, getCaseOtherMessage(replay, expression));
        }
        return visit(replay, body, items, scope, partial, node);
      };
      // Tool#enabled evaluates a CASE's guards and arms in the CASE's CostModel, not their $Pair's, so OpApplNodeWrapper#get reports their costs into the CASE.
      return replay.isEnabled && replay.coverage && node >= 0
        ? runReportedInto(replay.coverage, node, visitArm)
        : visitArm();
    }
    case "FunctionApplication": {
      const value = evaluateAt(
        replay,
        node,
        expression.function,
        replay.isInit ? context : toKeepLazyContext(context),
      );
      const lambda = getLazyFunction(value);
      if (lambda === undefined && !isFunctionValue(value)) {
        throw createRunError(replay, getNonFunctionMessage(replay, value, expression));
      }
      const isTuple = expression.args.length > 1;
      if (replay.coverage && isTuple) countArgumentTuple(replay.coverage, node, expression);
      const argument = runAt(replay, node, () =>
        replay.callStack && isTuple
          ? withFrame(replay, getArgumentTuple(expression), () =>
              evaluateArgument(expression, context),
            )
          : evaluateArgument(expression, context),
      );
      const isMember = replay.coverage ? replay.coverage.isMember : isElementOf;
      if (lambda === undefined) {
        const sets = setTrace.sets;
        sets?.push(value);
        const result = runAt(replay, node, () =>
          applyFunctionWith(
            value,
            argument,
            getMissingArgumentDescriber(replay.environment.runtime.version),
            isMember,
          ),
        );
        sets?.pop();
        if (typeof result !== "boolean") {
          throw createRunError(replay, getFunctionResultMessage(replay, expression));
        }
        return result && proceed(replay, items, partial, node);
      }
      const bound = runAt(replay, node, () =>
        bindLazyArguments(lambda, expression, argument, isMember),
      );
      // Tool#getNextStates runs the body with the function's cost model, but getInitStates and enabled with the application's.
      return visit(
        replay,
        lambda.body,
        items,
        bound,
        partial,
        replay.isInit || replay.isEnabled ? node : getLazyFunctionNode(lambda.value),
      );
    }
    case "Unchanged":
      if (!replay.isInit) {
        return visitUnchanged(replay, expression.expression, items, scope, partial, node);
      }
      break;
    case "BoxAction":
      if (!replay.isInit) {
        const isProduced = visit(replay, expression.action, items, scope, partial, node);
        return (
          visitUnchanged(replay, expression.subscript, items, scope, partial, node) || isProduced
        );
      }
      break;
    case "AngleAction":
      if (!replay.isInit) {
        return visit(
          replay,
          expression.action,
          createItem(
            replay,
            "Changed",
            expression.subscript,
            scope,
            getNode(replay, node, expression.subscript),
            items,
          ),
          scope,
          partial,
          node,
        );
      }
      break;
  }
  const failure = replay.isEnabled ? getEnabledFailure(expression) : undefined;
  if (failure !== undefined) throw new TlaEvaluationError(failure);
  return visitValue(
    replay,
    expression,
    evaluateAt(replay, node, expression, context),
    items,
    partial,
    node,
  );
};

export const warnChangedUnchanged = (
  environment: Environment,
  index: number,
  expression: Expression,
) => {
  const name =
    environment.variables[index] ??
    getKeyName([...environment.variableIndex].find((entry) => entry[1] === index)?.[0] ?? "");
  environment.runtime.warn(
    MESSAGE_CODE.unchangedVariableChanged,
    `The variable ${name} was changed while it is specified as UNCHANGED at\n${describeRange(expression)}`,
  );
};

// Deviation from TLC: Tool#enabledUnchanged fails on a variable the step leaves unassigned in an application, whose body tla-ts keeps unchanged instead.
export const bindUnchangedApplication = (
  expression: Expression,
  context: Context,
  error: TlaUnassignedError,
) => {
  const operator =
    expression.kind === "Apply" ? resolveApplyOperator(expression, context) : undefined;
  if (
    expression.kind !== "Apply" ||
    operator?.kind !== "Closure" ||
    operator.params.length !== expression.args.length
  ) {
    throw toUnspecifiedSubscriptError(error, context.environment.runtime.version);
  }
  return { body: operator.body, scope: bindOperatorArguments(operator, expression.args, context) };
};

const visitUnchanged = (
  replay: Replay,
  expression: Expression,
  items: ActionItem | undefined,
  scope: Scope | undefined,
  partial: State,
  parent: number,
): boolean =>
  withFrame(replay, expression, () => {
    const node = getNode(replay, parent, expression);
    const index = getVariable(replay.environment, expression, scope);
    if (index !== undefined) {
      const value = replay.isEnabled
        ? evaluateAt(replay, node, expression, {
            environment: replay.environment,
            scope,
            state: replay.current,
            next: partial,
          })
        : replay.current?.[index];
      if (value === undefined) return false;
      const assigned = partial[index];
      if (
        assigned !== undefined &&
        !(replay.isEnabled ? isEqualLikeTlc(assigned, value) : isEqualLikeTlc(value, assigned))
      ) {
        warnChangedUnchanged(replay.environment, index, expression);
        return false;
      }
      return proceedWithValue(replay, items, partial, index, value, node);
    }
    if (expression.kind === "Tuple") {
      const [first, ...others] = expression.elements;
      if (first === undefined) return proceed(replay, items, partial, node);
      const rest = others.reduceRight<ActionItem | undefined>(
        (tail, element) => createItem(replay, "Unchanged", element, scope, node, tail),
        items,
      );
      return visitUnchanged(replay, first, rest, scope, partial, node);
    }
    if (expression.kind === "Identifier") {
      const binding = lookupScope(scope, expression.name);
      if (binding?.kind === "Thunk") {
        return visitUnchanged(replay, binding.expression, items, binding.scope, partial, node);
      }
      const operator = binding
        ? binding.kind === "Operator"
          ? binding.operator
          : undefined
        : resolveGlobalOperator(expression.name, replay.environment);
      // Deviation from TLC: Tool#processUnchanged takes the SubstInNode of an instance's definition for an expression and fails on an unassigned variable.
      if (operator?.kind === "Closure" && operator.params.length === 0) {
        return visitUnchanged(replay, operator.body, items, operator.scope, partial, node);
      }
    }
    if (expression.kind === "Apply" && expression.resolution?.isSubstitute) {
      const closure = getSubstituteClosure(expression, scope);
      if (closure) {
        const callScope = bindOperatorArguments(
          closure,
          expression.args,
          getContext(replay, scope, partial),
        );
        // Tool#processUnchangedImpl0Arity counts a substitute at its declaration's CostModel, as SANY has no application there.
        return visitUnchanged(replay, closure.body, items, callScope, partial, parent);
      }
    }
    const before = evaluateAt(replay, node, expression, {
      environment: replay.environment,
      scope,
      state: replay.current,
      next: undefined,
    });
    const callStack = replay.callStack;
    const depth = callStack?.expressions.length ?? 0;
    const fingerprint = callStack?.fingerprint;
    const after = replay.isEnabled
      ? replay.environment.runtime.runWithEvalControl("Primed", () =>
          evaluateInPartial(replay, node, expression, scope, partial, undefined),
        )
      : evaluateInPartial(replay, node, expression, scope, partial, NULL_STATE);
    if (!(after instanceof TlaUnassignedError)) {
      return isEqualLikeTlc(before, after) && proceed(replay, items, partial, node);
    }
    const application = bindUnchangedApplication(
      expression,
      getContext(replay, scope, partial),
      after,
    );
    if (callStack) {
      callStack.expressions.length = depth;
      callStack.isFrozen = false;
      callStack.fingerprint = fingerprint;
    }
    return visitUnchanged(replay, application.body, items, application.scope, partial, node);
  });

const createReplay = (
  environment: Environment,
  kind: "init" | "next" | "enabled",
  current: Value[] | undefined,
  onState: (state: Value[]) => void,
  onIncomplete?: (state: State) => boolean,
  generator?: SuccessorGenerator,
): Replay => ({
  environment,
  callStack: environment.callStack,
  coverage:
    kind === "enabled" && environment.coverage !== undefined && environment.coverage.current < 0
      ? undefined
      : environment.coverage,
  isInit: kind === "init",
  isEnabled: kind === "enabled",
  current,
  onState,
  onIncomplete,
  generator,
});

const ENABLED_FOUND = new Error("The replay found a successor");

export const replayEnabled = (
  expression: Expression,
  scope: Scope | undefined,
  state: Value[],
  environment: Environment,
) => {
  const found = () => {
    throw ENABLED_FOUND;
  };
  const node = environment.coverage?.current ?? -1;
  const replay = createReplay(environment, "enabled", state, found, found);
  const callStack = replay.callStack;
  const depth = callStack?.expressions.length ?? 0;
  try {
    if (expression.kind === "AngleAction" && expression.location === expression.action.location) {
      const changed = createItem(replay, "Changed", expression.subscript, scope, node, undefined);
      visit(replay, expression.action, changed, scope, getEmptyState(environment), node);
    } else {
      visit(replay, expression, undefined, scope, getEmptyState(environment), node);
    }
    return false;
  } catch (error) {
    if (error !== ENABLED_FOUND) throw error;
    if (callStack) {
      callStack.expressions.length = depth;
      callStack.isFrozen = false;
    }
    return true;
  }
};

export const replayInitialStates = (
  inits: (ReplayAction & { node?: number })[],
  environment: Environment,
  onState: (state: Value[]) => void,
  onIncomplete?: (state: State) => boolean,
) => {
  const [first, ...others] = inits;
  if (first === undefined) return;
  const replay = createReplay(environment, "init", undefined, onState, onIncomplete);
  const rest = others.reduceRight<ActionItem | undefined>(
    (tail, init) =>
      createItem(replay, "Predicate", init.expression, init.scope, init.node ?? -1, tail),
    undefined,
  );
  visit(replay, first.expression, rest, first.scope, getEmptyState(environment), first.node ?? -1);
};

export const replaySuccessors = <Action extends ReplayAction & { node?: number }>(
  actions: Action[],
  state: Value[],
  environment: Environment,
  onState: (state: Value[], action: Action) => void,
) => {
  if (actions.some((action) => LITERAL_KINDS.has(action.expression.kind))) return;
  const coverage = environment.coverage;
  actions.forEach((action) => {
    const successors: Value[][] = [];
    const node = action.node ?? -1;
    walkSuccessors(action, node, state, environment, (next) => {
      if (coverage && node !== -1) coverage.primary[node]++;
      successors.push(next);
    });
    successors.forEach((successor) => onState(successor, action));
  });
};

export const walkSuccessors = (
  action: ReplayAction,
  node: number,
  state: Value[],
  environment: Environment,
  onState: (state: Value[]) => void,
  onIncomplete?: (state: State) => boolean,
  generator?: SuccessorGenerator,
) => {
  const replay = createReplay(environment, "next", state, onState, onIncomplete, generator);
  visit(replay, action.expression, undefined, action.scope, getEmptyState(environment), node);
};

export const getPrimedRanges = (actions: ReplayAction[], environment: Environment) => {
  const ranges: Expression[] = [];
  const createContext = (scope: Scope | undefined): Context => ({
    environment,
    scope,
    state: undefined,
    next: undefined,
  });
  const frames: Expression[] = [];
  const collectUnchanged = (expression: Expression, scope: Scope | undefined): void => {
    const occurrence = getNamedOccurrence(expression, frames);
    if (occurrence) {
      if (environment.variableIndex.has(occurrence.name)) ranges.push(occurrence.expression);
      return;
    }
    if (
      getVariable(environment, expression, undefined, frames) !== undefined &&
      expression.kind === "Identifier"
    ) {
      ranges.push(expression);
      return;
    }
    if (expression.kind === "Tuple") {
      expression.elements.forEach((element) => collectUnchanged(element, scope));
      return;
    }
    if (expression.kind !== "Identifier") return;
    const binding = lookupScope(scope, expression.name);
    const operator = binding ? undefined : resolveGlobalOperator(expression.name, environment);
    // Spec#collectUnchangedLocs stops at the SubstInNode of a definition an instance copies.
    if (
      operator?.kind === "Closure" &&
      operator.params.length === 0 &&
      getEnteredFrames(operator.body, frames).length === 0
    ) {
      collectUnchanged(operator.body, operator.scope);
    }
  };
  const collect = (
    expression: Expression,
    scope: Scope | undefined,
    visited: Set<Expression>,
  ): void => {
    const entered = getEnteredFrames(expression, frames);
    frames.push(...entered);
    collectExpression(expression, scope, visited);
    frames.length -= entered.length;
  };
  const collectExpression = (
    expression: Expression,
    scope: Scope | undefined,
    visited: Set<Expression>,
  ): void => {
    switch (expression.kind) {
      case "Let":
        collect(
          expression.body,
          bindDefinitions(expression.definitions, createContext(scope)),
          visited,
        );
        return;
      case "Label":
        collect(expression.body, scope, visited);
        return;
      case "Selection":
        collect(expression.expression, scope, visited);
        return;
      case "FunctionApplication":
        collect(expression.function, scope, visited);
        return;
      case "If":
        collect(expression.consequent, scope, visited);
        collect(expression.alternative, scope, visited);
        return;
      case "Case":
        expression.arms.forEach((arm) => collect(arm.body, scope, visited));
        if (expression.other) collect(expression.other, scope, visited);
        return;
      case "And":
      case "Or":
        expression.operands.forEach((operand) => collect(operand, scope, visited));
        return;
      case "Exists":
      case "Forall":
        collect(expression.body, scope, visited);
        return;
      case "Unchanged":
        collectUnchanged(expression.expression, scope);
        return;
      case "AngleAction":
        collect(expression.action, scope, visited);
        return;
      case "BoxAction":
        collect(expression.action, scope, visited);
        ranges.push(expression.subscript);
        return;
      case "Identifier":
      case "Apply": {
        if (expression.kind === "Apply") {
          if (expression.operator === "=>") {
            expression.args.forEach((arg) => collect(arg, scope, visited));
            return;
          }
          if (expression.operator === "=" || expression.operator === "\\in") {
            if (getPrimedVariable(environment, expression.args[0], scope, frames) !== undefined) {
              ranges.push(expression);
            }
            return;
          }
        }
        const name = expression.kind === "Identifier" ? expression.name : expression.operator;
        const binding = lookupScope(scope, name);
        if (binding?.kind === "Thunk") {
          collect(binding.expression, binding.scope, visited);
          return;
        }
        const operator =
          expression.kind === "Apply"
            ? resolveApplyOperator(expression, createContext(scope))
            : binding?.kind === "Operator"
              ? binding.operator
              : binding
                ? undefined
                : resolveGlobalOperator(name, environment);
        if (operator?.kind !== "Closure" || visited.has(operator.body)) return;
        const definition = environment.definitions.get(name);
        if (definition?.isRecursive) return;
        const args = expression.kind === "Apply" ? expression.args : [];
        if (operator.params.length !== args.length) return;
        visited.add(operator.body);
        collect(
          operator.body,
          bindOperatorArguments(operator, args, createContext(scope)),
          visited,
        );
        visited.delete(operator.body);
      }
    }
  };
  actions.forEach((action) => collect(action.expression, action.scope, new Set()));
  return ranges.flatMap((expression) => expression.location.range ?? []);
};
