import type { Expression, SourceLocation } from "../ast";
import { TlaEvaluationError } from "../errors";
import { isConstantLevel } from "../dependencies";
import {
  countCoverage,
  costCoverage,
  getCoverageNode,
  runAtCoverageNode,
  type Coverage,
} from "../coverage";
import {
  bindDefinitions,
  bindLazyArguments,
  bindOperatorArguments,
  describeRange,
  evaluate,
  forEachBoundElement,
  freezeCallStack,
  getLazyFunction,
  getQuantifierElements,
  mapBoundSets,
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
import { substitutionFrames } from "../instances";
import { MESSAGE_CODE } from "./messages";

// Replays a failed computation as TLC's CallStackTool does, walking the predicates in the order
// and nesting of Tool.getInitStates and getNextStates, so it records the nodes TLC records, and
// counts the coverage TLC counts.

interface ReplayAction {
  expression: Expression;
  scope: Scope | undefined;
}

// TLC's ActionItemList: the conjuncts left to process, the first at the head.
interface ActionItem {
  kind: "Predicate" | "Unchanged" | "Changed";
  expression: Expression;
  scope: Scope | undefined;
  node: number;
  rest: ActionItem | undefined;
}

interface Replay {
  environment: Environment;
  callStack: CallStack | undefined;
  coverage: Coverage | undefined;
  isInit: boolean;
  isEnabled: boolean;
  current: Value[] | undefined;
  onState: (state: Value[]) => void;
  onIncomplete: ((state: State) => void) | undefined;
}

const withFrame = <Result>(replay: Replay, expression: Expression, run: () => Result): Result => {
  const callStack = replay.callStack;
  if (!callStack) return run();
  const isEntered = callStack.expressions.at(-1) === expression;
  const frames = (!isEntered && substitutionFrames.get(expression)) || [];
  callStack.expressions.push(...frames, expression);
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
    if (!callStack.isFrozen) callStack.expressions.length -= frames.length + 1;
    sets.length = depth;
    setTrace.sets = outerSets;
  }
};

const getNode = (replay: Replay, node: number, expression: Expression) =>
  replay.coverage ? getCoverageNode(replay.coverage, node, expression) : -1;

const runAt = <Result>(replay: Replay, node: number, run: () => Result) =>
  replay.coverage ? runAtCoverageNode(replay.coverage, node, run) : run();

const evaluateAt = (replay: Replay, node: number, expression: Expression, context: Context) =>
  runAt(replay, node, () => evaluate(expression, context));

// TLC evaluates a user-defined or overridden operator's arguments under its node, but doesn't
// count the node itself.
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

// SANY parses A /\ B /\ C as (A /\ B) /\ C, so the replay recreates the node of each prefix.
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

const getVariable = (
  environment: Environment,
  expression: Expression,
  scope: Scope | undefined,
): number | undefined => {
  if (expression.kind === "Label") return getVariable(environment, expression.body, scope);
  const name = getIdentifierName(expression);
  if (name === undefined) return undefined;
  const binding = lookupScope(scope, name);
  if (binding?.kind === "Thunk") return getVariable(environment, binding.expression, binding.scope);
  if (binding) return undefined;
  const index = environment.variableIndex.get(name);
  if (index !== undefined) return index;
  const operator = resolveGlobalOperator(name, environment);
  return operator?.kind === "Closure" && operator.params.length === 0
    ? getVariable(environment, operator.body, operator.scope)
    : undefined;
};

const getPrimedVariable = (
  environment: Environment,
  expression: Expression,
  scope: Scope | undefined,
): number | undefined => {
  if (expression.kind === "Prime") return getVariable(environment, expression.expression, scope);
  if (expression.kind === "Label") return getPrimedVariable(environment, expression.body, scope);
  const name = getIdentifierName(expression);
  if (name === undefined) return undefined;
  const binding = lookupScope(scope, name);
  if (binding?.kind === "Thunk") {
    return getPrimedVariable(environment, binding.expression, binding.scope);
  }
  if (binding) return undefined;
  const operator = resolveGlobalOperator(name, environment);
  return operator?.kind === "Closure" && operator.params.length === 0
    ? getPrimedVariable(environment, operator.body, operator.scope)
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

// TLC counts the node that goes on to the conjuncts left for each next state they produce, but
// counts an initial state only as it adds it.
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
  replay.onState(state);
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
    replay.onIncomplete?.(partial);
    return false;
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

const isChanged = (replay: Replay, item: ActionItem, partial: State) => {
  const environment = replay.environment;
  const before = evaluateAt(replay, item.node, item.expression, {
    environment,
    scope: item.scope,
    state: replay.current,
    next: undefined,
  });
  const after = (() => {
    try {
      return evaluateAt(replay, item.node, item.expression, {
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
  try {
    return !isEqualLikeTlc(before, after);
  } catch (error) {
    // TLC's v0.equals(v1) raises a FingerprintException when v0 has a source.
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
  for (let item = items; item !== undefined; item = item.rest) {
    if (item.kind === "Unchanged") {
      return visitUnchanged(replay, item.expression, item.rest, item.scope, partial, item.node);
    }
    const isHeld =
      item.kind === "Changed"
        ? isChanged(replay, item, partial)
        : isTrue(
            evaluateAt(replay, item.node, item.expression, getContext(replay, item.scope, partial)),
          );
    if (!isHeld) {
      const coverage = replay.coverage;
      if (coverage && replay.isInit) coverage.secondary[coverage.roots[node]]++;
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
): boolean =>
  withFrame(replay, expression, () => {
    switch (expression.kind) {
      case "Let": {
        const context = getContext(replay, scope, partial);
        // TLC walks a LET definition's body again at each reference, under the reference.
        const definitions = expression.definitions;
        const bound = replay.coverage
          ? bindDefinitions(definitions, context, {
              impure: new Set(definitions),
              streamed: new Set(),
            })
          : bindDefinitions(definitions, context);
        return visit(replay, expression.body, items, bound, partial, node);
      }
      case "Label":
        return visit(replay, expression.body, items, scope, partial, node);
      default:
        if (LITERAL_KINDS.has(expression.kind))
          throw new TlaEvaluationError("The state relation is not a boolean expression.");
        return withFrame(replay, expression, () =>
          visitApplication(replay, expression, items, scope, partial, node),
        );
    }
  });

// The value of a user-defined operator TLC evaluates instead of walking its body.
const visitValue = (
  replay: Replay,
  value: Value,
  items: ActionItem | undefined,
  partial: State,
  node: number,
) => isTrue(value) && proceed(replay, items, partial, node);

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
    if (binding?.kind === "Thunk" && binding.cache === undefined) {
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
      !(definition && isConstantLevel(definition, replay.environment))
    ) {
      return visit(replay, operator.body, items, operator.scope, partial, node);
    }
    return visitValue(
      replay,
      evaluateOperatorAt(replay, node, expression, context),
      items,
      partial,
      node,
    );
  }
  const operator = resolveApplyOperator(expression, context);
  if (operator?.kind === "Closure" && operator.params.length === expression.args.length) {
    const bound = runAt(replay, node, () =>
      bindOperatorArguments(operator, expression.args, context),
    );
    return visit(replay, operator.body, items, bound, partial, node);
  }
  const value = BUILT_IN_OPERATORS.has(expression.operator)
    ? evaluateAt(replay, node, expression, context)
    : evaluateOperatorAt(replay, node, expression, context);
  return visitValue(replay, value, items, partial, node);
};

// A variable takes the value when it has none yet, and otherwise must already have it.
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
  kind: ActionItem["kind"],
  expression: Expression,
  scope: Scope | undefined,
  node: number,
  rest: ActionItem | undefined,
): ActionItem => ({ kind, expression, scope, node, rest });

// TLC costs a set it enumerates for each element, and for the end of the enumeration.
const getEnumerated = (replay: Replay, set: Value, elements: Value[]) => {
  if (replay.coverage) costCoverage(replay.coverage, set, elements.length + 1);
  return elements;
};

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
  const set: Value = expression.operator === "\\subseteq" ? { kind: "Subset", base: value } : value;
  // TLC gives the power set the source of its base, so a failure to enumerate it names both.
  if (typeof set === "object" && set !== value) replay.callStack?.sources.set(set, source);
  if (assigned !== undefined) {
    return (
      evaluateAt(replay, node, expression, context) === true &&
      proceed(replay, items, partial, node)
    );
  }
  if (!isTlcEnumerable(set))
    throw new TlaEvaluationError("The right side of \\IN is not enumerable.");
  return getEnumerated(replay, set, getStreamedElements(set)).reduce<boolean>(
    (isProduced, element) =>
      proceed(replay, items, assign(partial, index, element), node) || isProduced,
    false,
  );
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

const getBindings = (
  replay: Replay,
  expression: Expression & { kind: "Exists" | "Forall" },
  context: Context,
  node: number,
) => {
  const bindings: (Scope | undefined)[] = [];
  const version = replay.environment.runtime.version;
  const sets = runAt(replay, node, () =>
    mapBoundSets(expression.bounds, (set) => {
      const value = evaluate(set, context);
      const elements = getQuantifierElements(value, set, version);
      if (Array.isArray(elements)) getEnumerated(replay, value, elements);
      return elements;
    }),
  );
  forEachBoundElement(expression.bounds, sets, context.scope, (bound) => {
    bindings.push(bound);
    return false;
  });
  return bindings;
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
        if (isTrue(evaluateAt(replay, node, expression.args[0], context))) {
          return visit(replay, expression.args[1], items, scope, partial, node);
        }
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
            (tail, operand) => createItem("Predicate", operand, scope, node, tail),
            items,
          );
        return visit(replay, operands[0], rest, scope, partial, node);
      }
      const last = operands[operands.length - 1];
      return visitAt(
        replay,
        getPrefix(expression, operands.length - 1),
        createItem("Predicate", last, scope, node, items),
        scope,
        partial,
        getPrefixNode(replay, node),
      );
    }
    case "Or": {
      const operands = expression.operands;
      if (expression.isBulleted || operands.length === 2) {
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
    case "Exists":
      return getBindings(replay, expression, context, node).reduce(
        (isProduced, bound) =>
          visit(replay, expression.body, items, bound, partial, node) || isProduced,
        false,
      );
    case "Forall": {
      const bounds = getBindings(replay, expression, context, node);
      if (bounds.length === 0) return proceed(replay, items, partial, node);
      // TLC adds each binding after the first to the front of the conjuncts left.
      const rest = bounds
        .slice(1)
        .reduce<ActionItem | undefined>(
          (tail, bound) => createItem("Predicate", expression.body, bound, node, tail),
          items,
        );
      return visit(replay, expression.body, rest, bounds[0], partial, node);
    }
    case "If":
      return visit(
        replay,
        isTrue(evaluateAt(replay, node, expression.condition, context))
          ? expression.consequent
          : expression.alternative,
        items,
        scope,
        partial,
        node,
      );
    case "Case": {
      const arm = expression.arms.find((candidate) =>
        isTrue(evaluateAt(replay, node, candidate.condition, context)),
      );
      const body = arm?.body ?? expression.other;
      if (body === undefined) {
        throw new TlaEvaluationError("TLC encountered a CASE with no conditions true.");
      }
      return visit(replay, body, items, scope, partial, node);
    }
    case "FunctionApplication": {
      const lambda = getLazyFunction(
        evaluateAt(
          replay,
          node,
          expression.function,
          replay.isInit ? context : toKeepLazyContext(context),
        ),
      );
      if (lambda) {
        const bound = runAt(replay, node, () => bindLazyArguments(lambda, expression, context));
        return visit(replay, lambda.body, items, bound, partial, node);
      }
      break;
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
          createItem("Changed", expression.subscript, scope, node, items),
          scope,
          partial,
          node,
        );
      }
      break;
  }
  const failure = replay.isEnabled ? getEnabledFailure(expression) : undefined;
  if (failure !== undefined) throw new TlaEvaluationError(failure);
  return visitValue(replay, evaluateAt(replay, node, expression, context), items, partial, node);
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
  parent: number,
): boolean =>
  withFrame(replay, expression, () => {
    const node = getNode(replay, parent, expression);
    const index = getVariable(replay.environment, expression, scope);
    if (index !== undefined) {
      const value = replay.current?.[index];
      if (value === undefined) return false;
      const assigned = partial[index];
      if (assigned !== undefined && !isEqualLikeTlc(assigned, value)) {
        warnChangedUnchanged(replay.environment, index, expression);
        return false;
      }
      return proceedWithValue(replay, items, partial, index, value, node);
    }
    if (expression.kind === "Tuple") {
      const [first, ...others] = expression.elements;
      if (first === undefined) return proceed(replay, items, partial, node);
      const rest = others.reduceRight<ActionItem | undefined>(
        (tail, element) => createItem("Unchanged", element, scope, node, tail),
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
        ? undefined
        : resolveGlobalOperator(expression.name, replay.environment);
      if (operator?.kind === "Closure" && operator.params.length === 0) {
        return visitUnchanged(replay, operator.body, items, operator.scope, partial, node);
      }
    }
    // Tool#enabledUnchanged evaluates an operator application in the partial next state, which
    // fails on a variable it hasn't assigned, as its comment says. tla-ts walks the operator's
    // body as it walks a definition without parameters.
    if (replay.isEnabled && expression.kind === "Apply") {
      const context = getContext(replay, scope, partial);
      const operator = resolveApplyOperator(expression, context);
      if (operator?.kind === "Closure" && operator.params.length === expression.args.length) {
        return visitUnchanged(
          replay,
          operator.body,
          items,
          bindOperatorArguments(operator, expression.args, context),
          partial,
          node,
        );
      }
    }
    const environment = replay.environment;
    const before = evaluateAt(replay, node, expression, {
      environment,
      scope,
      state: replay.current,
      next: undefined,
    });
    const after = evaluateAt(replay, node, expression, {
      environment,
      scope,
      state: partial,
      next: undefined,
    });
    return isEqualLikeTlc(before, after) && proceed(replay, items, partial, node);
  });

const createReplay = (
  environment: Environment,
  isInit: boolean,
  current: Value[] | undefined,
  onState: (state: Value[]) => void,
  isEnabled = false,
  onIncomplete?: (state: State) => void,
): Replay => ({
  environment,
  callStack: environment.callStack,
  coverage: environment.coverage,
  isInit,
  isEnabled,
  current,
  onState,
  onIncomplete,
});

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
  const callStack = replay.callStack;
  const depth = callStack?.expressions.length ?? 0;
  try {
    // liveness.ts builds the <<A>>_v of WF_v(A) at the location of A.
    if (expression.kind === "AngleAction" && expression.location === expression.action.location) {
      const changed = createItem("Changed", expression.subscript, scope, -1, undefined);
      visit(replay, expression.action, changed, scope, getEmptyState(environment), -1);
    } else {
      visit(replay, expression, undefined, scope, getEmptyState(environment), -1);
    }
    return false;
  } catch (error) {
    if (error !== ENABLED_FOUND) throw error;
    // The frames the walk left are those of the successor, not of a failure.
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
  onIncomplete?: (state: State) => void,
) => {
  const [first, ...others] = inits;
  if (first === undefined) return;
  const replay = createReplay(environment, true, undefined, onState, false, onIncomplete);
  const rest = others.reduceRight<ActionItem | undefined>(
    (tail, init) => createItem("Predicate", init.expression, init.scope, init.node ?? -1, tail),
    undefined,
  );
  visit(replay, first.expression, rest, first.scope, getEmptyState(environment), first.node ?? -1);
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
    walkSuccessors(action, -1, state, environment, (next) => successors.push(next));
    successors.forEach((successor) => onState(successor, action));
  });
};

export const walkSuccessors = (
  action: ReplayAction,
  node: number,
  state: Value[],
  environment: Environment,
  onState: (state: Value[]) => void,
  onIncomplete?: (state: State) => void,
) => {
  const replay = createReplay(environment, false, state, onState, false, onIncomplete);
  visit(replay, action.expression, undefined, action.scope, getEmptyState(environment), node);
};

// TLC's Spec.getPrimedLocs, whose nodes TLC reports even when they never produce a state.
export const getPrimedRanges = (actions: ReplayAction[], environment: Environment) => {
  const ranges: Expression[] = [];
  const context = (scope: Scope | undefined): Context => ({
    environment,
    scope,
    state: undefined,
    next: undefined,
  });
  const collectUnchanged = (expression: Expression, scope: Scope | undefined): void => {
    if (
      getVariable(environment, expression, undefined) !== undefined &&
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
    if (operator?.kind === "Closure" && operator.params.length === 0) {
      collectUnchanged(operator.body, operator.scope);
    }
  };
  const collect = (
    expression: Expression,
    scope: Scope | undefined,
    visited: Set<Expression>,
  ): void => {
    switch (expression.kind) {
      case "Let":
        collect(expression.body, bindDefinitions(expression.definitions, context(scope)), visited);
        return;
      case "Label":
        collect(expression.body, scope, visited);
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
            if (getPrimedVariable(environment, expression.args[0], scope) !== undefined) {
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
            ? resolveApplyOperator(expression, context(scope))
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
        collect(operator.body, bindOperatorArguments(operator, args, context(scope)), visited);
        visited.delete(operator.body);
      }
    }
  };
  actions.forEach((action) => collect(action.expression, action.scope, new Set()));
  return ranges.flatMap((expression) => expression.location.range ?? []);
};
