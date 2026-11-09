import type { Expression, SourceLocation } from "../ast";
import { TlaEvaluationError } from "../errors";
import { isConstantLevel } from "../dependencies";
import {
  bindDefinitions,
  bindLazyArguments,
  bindOperatorArguments,
  describeRange,
  evaluate,
  forEachBinding,
  freezeCallStack,
  getLazyFunction,
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
} from "../evaluate";
import {
  getStreamedElements,
  isEqualLikeTlc,
  isTlcEnumerable,
  setTrace,
  type Value,
} from "../values";
import { MESSAGE_CODE } from "./messages";

// Replays a failed computation as TLC's CallStackTool does, walking the predicates in the order
// and nesting of Tool.getInitStates and getNextStates, so it records the nodes TLC records.

interface ReplayAction {
  expression: Expression;
  scope: Scope | undefined;
}

// TLC's ActionItemList: the conjuncts left to process, the first at the head.
interface ActionItem {
  kind: "Predicate" | "Unchanged" | "Changed";
  expression: Expression;
  scope: Scope | undefined;
  rest: ActionItem | undefined;
}

interface Replay {
  environment: Environment;
  callStack: CallStack;
  isInit: boolean;
  isEnabled: boolean;
  current: Value[] | undefined;
  onState: (state: Value[]) => void;
}

const withFrame = <Result>(replay: Replay, expression: Expression, run: () => Result): Result => {
  const callStack = replay.callStack;
  callStack.expressions.push(expression);
  const outerSets = setTrace.sets;
  const sets = outerSets ?? [];
  const depth = sets.length;
  setTrace.sets = sets;
  try {
    return run();
  } catch (error) {
    // A quantifier enumerates its bounds outside any evaluation.
    freezeCallStack(callStack, sets.slice(depth), error);
    throw error;
  } finally {
    if (!callStack.isFrozen) callStack.expressions.pop();
    sets.length = depth;
    setTrace.sets = outerSets;
  }
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

// SANY parses A /\ B /\ C as (A /\ B) /\ C, so the replay recreates the node of each prefix.
const getPrefix = (expression: Expression & { kind: "And" | "Or" }, count: number): Expression => {
  const first = expression.operands[0].location;
  const range = expression.location.range;
  const end = expression.prefixEnds?.[count - 2];
  const location: SourceLocation =
    range && end ? { ...first, range: { ...range, end } } : expression.location;
  return { ...expression, operands: expression.operands.slice(0, count), location };
};

const getIdentifierName = (expression: Expression) =>
  expression.kind === "Identifier" ? expression.name : undefined;

const getVariable = (
  replay: Replay,
  expression: Expression,
  scope: Scope | undefined,
): number | undefined => {
  if (expression.kind === "Label") return getVariable(replay, expression.body, scope);
  const name = getIdentifierName(expression);
  if (name === undefined) return undefined;
  const binding = lookupScope(scope, name);
  if (binding?.kind === "Thunk") return getVariable(replay, binding.expression, binding.scope);
  if (binding) return undefined;
  const index = replay.environment.variableIndex.get(name);
  if (index !== undefined) return index;
  const operator = resolveGlobalOperator(name, replay.environment);
  return operator?.kind === "Closure" && operator.params.length === 0
    ? getVariable(replay, operator.body, operator.scope)
    : undefined;
};

const getPrimedVariable = (
  replay: Replay,
  expression: Expression,
  scope: Scope | undefined,
): number | undefined => {
  if (expression.kind === "Prime") return getVariable(replay, expression.expression, scope);
  if (expression.kind === "Label") return getPrimedVariable(replay, expression.body, scope);
  const name = getIdentifierName(expression);
  if (name === undefined) return undefined;
  const binding = lookupScope(scope, name);
  if (binding?.kind === "Thunk") {
    return getPrimedVariable(replay, binding.expression, binding.scope);
  }
  if (binding) return undefined;
  const operator = resolveGlobalOperator(name, replay.environment);
  return operator?.kind === "Closure" && operator.params.length === 0
    ? getPrimedVariable(replay, operator.body, operator.scope)
    : undefined;
};

const isTrue = (value: Value) => {
  if (typeof value !== "boolean")
    throw new TlaEvaluationError("TLC expected a boolean expression.");
  return value;
};

// Once every variable has a value, TLC evaluates the conjuncts left instead of walking them,
// though not under ENABLED, and the next states take this shortcut only with warnings on.
export const isAssignedShortcut = (replay: Pick<Replay, "environment" | "isInit" | "isEnabled">) =>
  !replay.isEnabled && (replay.isInit || replay.environment.runtime.isWarningEnabled);

const proceed = (replay: Replay, items: ActionItem | undefined, partial: State): void => {
  if (items === undefined) {
    if (isComplete(partial)) replay.onState(partial);
    return;
  }
  if (isComplete(partial) && isAssignedShortcut(replay)) {
    proceedAssigned(replay, items, partial);
    return;
  }
  if (items.kind === "Predicate") {
    visit(replay, items.expression, items.rest, items.scope, partial);
    return;
  }
  if (items.kind === "Unchanged") {
    visitUnchanged(replay, items.expression, items.rest, items.scope, partial);
    return;
  }
  if (isChanged(replay, items, partial)) proceed(replay, items.rest, partial);
};

const isChanged = (replay: Replay, item: ActionItem, partial: State) => {
  const environment = replay.environment;
  const before = evaluate(item.expression, {
    environment,
    scope: item.scope,
    state: replay.current,
    next: undefined,
  });
  const after = (() => {
    try {
      return evaluate(item.expression, {
        environment,
        scope: item.scope,
        state: partial,
        next: undefined,
      });
    } catch (error) {
      throw replay.isEnabled
        ? toUnspecifiedSubscriptError(error, environment.runtime.version)
        : error;
    }
  })();
  return !isEqualLikeTlc(before, after);
};

const proceedAssigned = (replay: Replay, items: ActionItem | undefined, partial: Value[]): void => {
  for (let item = items; item !== undefined; item = item.rest) {
    if (item.kind === "Unchanged") {
      visitUnchanged(replay, item.expression, item.rest, item.scope, partial);
      return;
    }
    if (
      item.kind === "Changed"
        ? !isChanged(replay, item, partial)
        : !isTrue(evaluate(item.expression, getContext(replay, item.scope, partial)))
    ) {
      return;
    }
  }
  replay.onState(partial);
};

const visit = (
  replay: Replay,
  expression: Expression,
  items: ActionItem | undefined,
  scope: Scope | undefined,
  partial: State,
): void =>
  withFrame(replay, expression, () => {
    switch (expression.kind) {
      case "Let":
        visit(
          replay,
          expression.body,
          items,
          bindDefinitions(expression.definitions, getContext(replay, scope, partial)),
          partial,
        );
        return;
      case "Label":
        visit(replay, expression.body, items, scope, partial);
        return;
      default:
        if (LITERAL_KINDS.has(expression.kind))
          throw new TlaEvaluationError("The state relation is not a boolean expression.");
        withFrame(replay, expression, () =>
          visitApplication(replay, expression, items, scope, partial),
        );
    }
  });

// The value of a user-defined operator TLC evaluates instead of walking its body.
const visitValue = (
  replay: Replay,
  value: Value,
  items: ActionItem | undefined,
  partial: State,
) => {
  if (isTrue(value)) proceed(replay, items, partial);
};

const visitDefined = (
  replay: Replay,
  expression: Expression & { kind: "Identifier" | "Apply" },
  items: ActionItem | undefined,
  scope: Scope | undefined,
  partial: State,
) => {
  const context = getContext(replay, scope, partial);
  if (expression.kind === "Identifier") {
    const binding = lookupScope(scope, expression.name);
    if (binding?.kind === "Thunk" && binding.cache === undefined) {
      visit(replay, binding.expression, items, binding.scope, partial);
      return;
    }
    if (
      binding?.kind === "Operator" &&
      binding.operator.kind === "Closure" &&
      binding.operator.params.length === 0
    ) {
      visit(replay, binding.operator.body, items, binding.operator.scope, partial);
      return;
    }
    const definition = binding ? undefined : replay.environment.definitions.get(expression.name);
    const operator = binding
      ? undefined
      : resolveGlobalOperator(expression.name, replay.environment);
    if (
      operator?.kind === "Closure" &&
      operator.params.length === 0 &&
      !replay.environment.variableIndex.has(expression.name) &&
      !(definition && isConstantLevel(definition, replay.environment))
    ) {
      visit(replay, operator.body, items, operator.scope, partial);
      return;
    }
    visitValue(replay, evaluate(expression, context), items, partial);
    return;
  }
  const operator = resolveApplyOperator(expression, context);
  if (operator?.kind === "Closure" && operator.params.length === expression.args.length) {
    visit(
      replay,
      operator.body,
      items,
      bindOperatorArguments(operator, expression.args, context),
      partial,
    );
    return;
  }
  visitValue(replay, evaluate(expression, context), items, partial);
};

// A variable takes the value when it has none yet, and otherwise must already have it.
const proceedWithValue = (
  replay: Replay,
  items: ActionItem | undefined,
  partial: State,
  index: number,
  value: Value,
) => {
  const assigned = partial[index];
  if (assigned === undefined) {
    proceed(replay, items, assign(partial, index, value));
    return;
  }
  if (isEqualLikeTlc(assigned, value)) proceed(replay, items, partial);
};

const createItem = (
  kind: ActionItem["kind"],
  expression: Expression,
  scope: Scope | undefined,
  rest: ActionItem | undefined,
): ActionItem => ({ kind, expression, scope, rest });

const visitAssignment = (
  replay: Replay,
  expression: Expression & { kind: "Apply" },
  items: ActionItem | undefined,
  scope: Scope | undefined,
  partial: State,
) => {
  const [target, source] = expression.args;
  const index = replay.isInit
    ? getVariable(replay, target, scope)
    : getPrimedVariable(replay, target, scope);
  const context = getContext(replay, scope, partial);
  if (index === undefined) {
    if (evaluate(expression, context) === true) proceed(replay, items, partial);
    return;
  }
  const value = evaluate(source, context);
  const assigned = partial[index];
  if (expression.operator === "=") {
    proceedWithValue(replay, items, partial, index, value);
    return;
  }
  const set: Value = expression.operator === "\\subseteq" ? { kind: "Subset", base: value } : value;
  if (assigned !== undefined) {
    if (evaluate(expression, context) === true) proceed(replay, items, partial);
    return;
  }
  if (!isTlcEnumerable(set))
    throw new TlaEvaluationError("The right side of \\IN is not enumerable.");
  for (const element of getStreamedElements(set)) {
    proceed(replay, items, assign(partial, index, element));
  }
};

const ASSIGNMENT_OPERATORS = new Set(["=", "\\in", "\\subseteq"]);

export const LITERAL_KINDS = new Set<Expression["kind"]>(["Number", "Decimal", "String"]);

const ENABLED_TEMPORAL_FORMS: Partial<Record<Expression["kind"], string>> = {
  Always: "[]",
  Eventually: "<>",
  WeakFairness: "WF",
  StrongFairness: "SF",
};

// TLC rejects a temporal formula, and a quantifier or CHOOSE without a bound, under ENABLED.
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

const visitApplication = (
  replay: Replay,
  expression: Expression,
  items: ActionItem | undefined,
  scope: Scope | undefined,
  partial: State,
): void => {
  const context = getContext(replay, scope, partial);
  switch (expression.kind) {
    case "Identifier":
      visitDefined(replay, expression, items, scope, partial);
      return;
    case "Apply": {
      if (ASSIGNMENT_OPERATORS.has(expression.operator) && expression.args.length === 2) {
        visitAssignment(replay, expression, items, scope, partial);
        return;
      }
      if (expression.operator === "=>" && expression.args.length === 2) {
        if (isTrue(evaluate(expression.args[0], context))) {
          visit(replay, expression.args[1], items, scope, partial);
          return;
        }
        proceed(replay, items, partial);
        return;
      }
      visitDefined(replay, expression, items, scope, partial);
      return;
    }
    case "And": {
      const operands = expression.operands;
      if (expression.isBulleted || operands.length === 2) {
        const rest = operands
          .slice(1)
          .reduceRight<ActionItem | undefined>(
            (tail, operand) => createItem("Predicate", operand, scope, tail),
            items,
          );
        visit(replay, operands[0], rest, scope, partial);
        return;
      }
      const last = operands[operands.length - 1];
      visit(
        replay,
        getPrefix(expression, operands.length - 1),
        createItem("Predicate", last, scope, items),
        scope,
        partial,
      );
      return;
    }
    case "Or": {
      const operands = expression.operands;
      if (expression.isBulleted || operands.length === 2) {
        operands.forEach((operand) => visit(replay, operand, items, scope, partial));
        return;
      }
      visit(replay, getPrefix(expression, operands.length - 1), items, scope, partial);
      visit(replay, operands[operands.length - 1], items, scope, partial);
      return;
    }
    case "Exists":
      forEachBinding(expression.bounds, context, (bound) => {
        visit(replay, expression.body, items, bound, partial);
        return false;
      });
      return;
    case "Forall": {
      const bounds: (Scope | undefined)[] = [];
      forEachBinding(expression.bounds, context, (bound) => {
        bounds.push(bound);
        return false;
      });
      if (bounds.length === 0) {
        proceed(replay, items, partial);
        return;
      }
      // TLC adds each binding after the first to the front of the conjuncts left.
      const rest = bounds
        .slice(1)
        .reduce<ActionItem | undefined>(
          (tail, bound) => createItem("Predicate", expression.body, bound, tail),
          items,
        );
      visit(replay, expression.body, rest, bounds[0], partial);
      return;
    }
    case "If":
      visit(
        replay,
        isTrue(evaluate(expression.condition, context))
          ? expression.consequent
          : expression.alternative,
        items,
        scope,
        partial,
      );
      return;
    case "Case": {
      const arm = expression.arms.find((candidate) =>
        isTrue(evaluate(candidate.condition, context)),
      );
      const body = arm?.body ?? expression.other;
      if (body === undefined) {
        throw new TlaEvaluationError("TLC encountered a CASE with no conditions true.");
      }
      visit(replay, body, items, scope, partial);
      return;
    }
    case "FunctionApplication": {
      const lambda = getLazyFunction(
        evaluate(expression.function, replay.isInit ? context : toKeepLazyContext(context)),
      );
      if (lambda) {
        visit(replay, lambda.body, items, bindLazyArguments(lambda, expression, context), partial);
        return;
      }
      break;
    }
    case "Unchanged":
      if (!replay.isInit) {
        visitUnchanged(replay, expression.expression, items, scope, partial);
        return;
      }
      break;
    case "BoxAction":
      if (!replay.isInit) {
        visit(replay, expression.action, items, scope, partial);
        visitUnchanged(replay, expression.subscript, items, scope, partial);
        return;
      }
      break;
    case "AngleAction":
      if (!replay.isInit) {
        visit(
          replay,
          expression.action,
          createItem("Changed", expression.subscript, scope, items),
          scope,
          partial,
        );
        return;
      }
      break;
  }
  const failure = replay.isEnabled ? getEnabledFailure(expression) : undefined;
  if (failure !== undefined) throw new TlaEvaluationError(failure);
  visitValue(replay, evaluate(expression, context), items, partial);
};

export const warnChangedUnchanged = (
  environment: Environment,
  index: number,
  expression: Expression,
) =>
  environment.runtime.warn(
    MESSAGE_CODE.unchangedVariableChanged,
    `The variable ${environment.variables[index]} was changed while it is specified as UNCHANGED at\n${describeRange(expression)}`,
  );

const visitUnchanged = (
  replay: Replay,
  expression: Expression,
  items: ActionItem | undefined,
  scope: Scope | undefined,
  partial: State,
): void =>
  withFrame(replay, expression, () => {
    const index = getVariable(replay, expression, scope);
    if (index !== undefined) {
      const value = replay.current?.[index];
      if (value === undefined) return;
      const assigned = partial[index];
      if (assigned !== undefined && !isEqualLikeTlc(assigned, value)) {
        warnChangedUnchanged(replay.environment, index, expression);
        return;
      }
      proceedWithValue(replay, items, partial, index, value);
      return;
    }
    if (expression.kind === "Tuple") {
      const [first, ...others] = expression.elements;
      if (first === undefined) {
        proceed(replay, items, partial);
        return;
      }
      const rest = others.reduceRight<ActionItem | undefined>(
        (tail, element) => createItem("Unchanged", element, scope, tail),
        items,
      );
      visitUnchanged(replay, first, rest, scope, partial);
      return;
    }
    if (expression.kind === "Identifier") {
      const binding = lookupScope(scope, expression.name);
      if (binding?.kind === "Thunk") {
        visitUnchanged(replay, binding.expression, items, binding.scope, partial);
        return;
      }
      const operator = binding
        ? undefined
        : resolveGlobalOperator(expression.name, replay.environment);
      if (operator?.kind === "Closure" && operator.params.length === 0) {
        visitUnchanged(replay, operator.body, items, operator.scope, partial);
        return;
      }
    }
    const environment = replay.environment;
    const before = evaluate(expression, {
      environment,
      scope,
      state: replay.current,
      next: undefined,
    });
    const after = evaluate(expression, { environment, scope, state: partial, next: undefined });
    if (isEqualLikeTlc(before, after)) proceed(replay, items, partial);
  });

const createReplay = (
  environment: Environment,
  isInit: boolean,
  current: Value[] | undefined,
  onState: (state: Value[]) => void,
  isEnabled = false,
): Replay => {
  const callStack = environment.callStack;
  if (!callStack) throw new Error("The replay needs an environment that records its call stack");
  return { environment, callStack, isInit, isEnabled, current, onState };
};

const ENABLED_FOUND = new Error("The replay found a successor");

export const replayEnabled = (
  expression: Expression,
  scope: Scope | undefined,
  state: Value[],
  environment: Environment,
) => {
  const replay = createReplay(
    environment,
    false,
    state,
    () => {
      throw ENABLED_FOUND;
    },
    true,
  );
  const depth = replay.callStack.expressions.length;
  try {
    // liveness.ts builds the <<A>>_v of WF_v(A) at the location of A.
    if (expression.kind === "AngleAction" && expression.location === expression.action.location) {
      const changed = createItem("Changed", expression.subscript, scope, undefined);
      visit(replay, expression.action, changed, scope, getEmptyState(environment));
    } else {
      visit(replay, expression, undefined, scope, getEmptyState(environment));
    }
    return false;
  } catch (error) {
    if (error !== ENABLED_FOUND) throw error;
    // The frames the walk left are those of the successor, not of a failure.
    replay.callStack.expressions.length = depth;
    replay.callStack.isFrozen = false;
    return true;
  }
};

export const replayInitialStates = (
  inits: ReplayAction[],
  environment: Environment,
  onState: (state: Value[]) => void,
) => {
  const [first, ...others] = inits;
  if (first === undefined) return;
  const replay = createReplay(environment, true, undefined, onState);
  const rest = others.reduceRight<ActionItem | undefined>(
    (tail, init) => createItem("Predicate", init.expression, init.scope, tail),
    undefined,
  );
  visit(replay, first.expression, rest, first.scope, getEmptyState(environment));
};

// TLC checks the successors of an action once it has computed them all.
export const replaySuccessors = <Action extends ReplayAction>(
  actions: Action[],
  state: Value[],
  environment: Environment,
  onState: (state: Value[], action: Action) => void,
) => {
  // TLC fails to split a next-state relation that isn't an operator application, so replays none.
  if (actions.some((action) => LITERAL_KINDS.has(action.expression.kind))) return;
  actions.forEach((action) => {
    const successors: Value[][] = [];
    const replay = createReplay(environment, false, state, (next) => successors.push(next));
    visit(replay, action.expression, undefined, action.scope, getEmptyState(environment));
    successors.forEach((successor) => onState(successor, action));
  });
};
