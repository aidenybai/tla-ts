import { isLocallyResolved, type Definition, type Expression } from "./ast";
import { TlaEvaluationError, TlaStackOverflowError } from "./errors";
import {
  describeRange,
  bindDefinitions,
  bindOperatorArguments,
  evaluate,
  expectBoolean,
  forEachBinding,
  getDefinition,
  lookupScope,
  resolveApplyOperator,
  resolveGlobalOperator,
  resolveOperator,
  type Context,
  type Environment,
  type Scope,
  type Thunk,
} from "./evaluate";
import { mapChildren } from "./instances";
import { ACTION_LEVEL, TEMPORAL_LEVEL } from "./levels";
import { isEnabled } from "./successors";
import { EXIT_STATUS, setExitCode } from "./exit-codes";
import {
  createBoolean,
  createJunction,
  createPair,
  createUnary,
  getLiveLevel,
  type LiveEnabled,
  type LiveExpression,
} from "./tableau";
import type { Value } from "./values";

export interface ScopedExpression {
  expression: Expression;
  scope: Scope | undefined;
}

export interface TemporalProperty extends ScopedExpression {
  name: string;
}

const MAXIMUM_EXPANSION_DEPTH = 100;

// TLC expands a temporal formula that refers to itself until Java's stack overflows.
const createStackOverflowError = () => setExitCode(new TlaStackOverflowError(), EXIT_STATUS.error);

const TEMPORAL_OPERATORS = new Set(["~>", "-+->"]);

const definitionLevels = new WeakMap<Definition, number>();

const definitionThunks = new WeakSet<Thunk>();

const getConstantContext = (environment: Environment, scope: Scope | undefined): Context => ({
  environment,
  scope,
  state: undefined,
  next: undefined,
});

const createCannotHandleError = (expression: Expression) =>
  new TlaEvaluationError(`TLC cannot handle the temporal formula ${describeRange(expression)}`);

export const getLevel = (
  expression: Expression,
  scope: Scope | undefined,
  environment: Environment,
  shadowed = new Set<string>(),
): number => {
  const getBindingLevel = (name: string) => {
    const binding = lookupScope(scope, name);
    if (!binding) return undefined;
    if (binding.kind === "Value") return 0;
    if (binding.kind === "Thunk") return getLevel(binding.expression, binding.scope, environment);
    const operator = binding.operator;
    return operator.kind === "Closure" ? getLevel(operator.body, operator.scope, environment) : 0;
  };
  const getGlobalLevel = (name: string) => {
    if (environment.variableIndex.has(name)) return 1;
    if (environment.constants.has(name)) return 0;
    const definition = getDefinition(name, environment);
    if (definition) return getDefinitionLevel(definition, environment);
    const builtin = environment.builtins.get(environment.substitutions.get(name) ?? name);
    return builtin ? (builtin.isStateLevel && !builtin.isLevelConstant ? 1 : 0) : undefined;
  };
  const getNameLevel = (name: string, node: Expression) => {
    if (shadowed.has(name)) return 0;
    if (isLocallyResolved(node)) return getBindingLevel(name) ?? getGlobalLevel(name) ?? 0;
    return getGlobalLevel(name) ?? getBindingLevel(name) ?? 0;
  };
  const getChildrenLevel = (node: Expression) => {
    const level = { value: 0 };
    mapChildren(node, (child, bound) => {
      level.value = Math.max(
        level.value,
        getLevel(
          child,
          scope,
          environment,
          bound.length === 0 ? shadowed : new Set([...shadowed, ...bound]),
        ),
      );
      return child;
    });
    return level.value;
  };
  switch (expression.kind) {
    case "Prime":
    case "Unchanged":
    case "BoxAction":
    case "AngleAction":
      return ACTION_LEVEL;
    case "Enabled":
      return 1;
    case "Always":
    case "Eventually":
    case "WeakFairness":
    case "StrongFairness":
      return TEMPORAL_LEVEL;
    case "UnboundedQuantifier":
      return expression.isTemporal ? TEMPORAL_LEVEL : getChildrenLevel(expression);
    case "Identifier":
      return getNameLevel(expression.name, expression);
    case "OperatorReference":
      return getNameLevel(expression.operator, expression);
    case "Apply":
      if (TEMPORAL_OPERATORS.has(expression.operator)) return TEMPORAL_LEVEL;
      if (expression.operator === "\\cdot") return ACTION_LEVEL;
      return Math.max(getNameLevel(expression.operator, expression), getChildrenLevel(expression));
    default:
      return getChildrenLevel(expression);
  }
};

const getDefinitionLevel = (definition: Definition, environment: Environment) => {
  const cached = definitionLevels.get(definition);
  if (cached !== undefined) return cached;
  definitionLevels.set(definition, 0);
  const bounds = definition.kind === "Function" ? definition.bounds : [];
  const level = Math.max(
    getLevel(definition.body, undefined, environment),
    ...bounds.map((bound) => getLevel(bound.set, undefined, environment)),
  );
  definitionLevels.set(definition, level);
  return level;
};

export const expandTemporal = (
  expression: Expression,
  scope: Scope | undefined,
  environment: Environment,
  isUnrollingForall: boolean,
  expanding = new Set<Definition>(),
  // Whether the expansion entered the body of an instance's definition. Like TLC, it then no
  // longer expands an operator applied to arguments.
  isSubstituted = false,
): ScopedExpression[] => {
  const expand = (
    child: Expression,
    childScope: Scope | undefined,
    childExpanding = expanding,
    definition?: Definition,
  ): ScopedExpression[] =>
    expandTemporal(
      child,
      childScope,
      environment,
      isUnrollingForall,
      childExpanding,
      isSubstituted ||
        (definition !== undefined && environment.substitutedDefinitions.has(definition)),
    );
  if (expression.kind === "And") {
    return expression.operands.flatMap((operand) => expand(operand, scope));
  }
  if (expression.kind === "Label") return expand(expression.body, scope);
  if (expression.kind === "Let") {
    return expand(expression.body, bindLetDefinitions(expression, scope, environment));
  }
  if (expression.kind === "Identifier") {
    const binding = isLocallyResolved(expression) ? lookupScope(scope, expression.name) : undefined;
    if (binding?.kind === "Thunk") {
      return expand(binding.expression, binding.scope);
    }
    const definition = environment.constants.has(expression.name)
      ? undefined
      : getDefinition(expression.name, environment);
    if (
      !binding &&
      definition?.kind === "Operator" &&
      definition.params.length === 0 &&
      getDefinitionLevel(definition, environment) > 0
    ) {
      if (expanding.has(definition)) {
        throw createStackOverflowError();
      }
      return expand(definition.body, undefined, new Set([...expanding, definition]), definition);
    }
  }
  const context = getConstantContext(environment, scope);
  // TLC 1.7.4 never expands an operator applied to arguments.
  if (
    expression.kind === "Apply" &&
    environment.runtime.version !== "1.7.4" &&
    getLevel(expression, scope, environment) === TEMPORAL_LEVEL
  ) {
    const operator = resolveApplyOperator(expression, context);
    const definition = isLocallyResolved(expression)
      ? undefined
      : getDefinition(expression.operator, environment);
    if (operator?.kind === "Closure" && !definition?.isRecursive && !isSubstituted) {
      return expand(
        operator.body,
        bindOperatorArguments(operator, expression.args, context),
        expanding,
        definition,
      );
    }
  }
  const isUnrolled =
    isUnrollingForall &&
    expression.kind === "Forall" &&
    getLevel(expression.body, scope, environment) === TEMPORAL_LEVEL &&
    expression.bounds.every((bound) => getLevel(bound.set, scope, environment) === 0);
  if (isUnrolled) {
    const expanded: ScopedExpression[] = [];
    forEachBinding(expression.bounds, context, (boundScope) => {
      expanded.push(...expand(expression.body, boundScope));
      return false;
    });
    return expanded;
  }
  return [{ expression, scope }];
};

const bindLetDefinitions = (
  expression: Expression & { kind: "Let" },
  scope: Scope | undefined,
  environment: Environment,
) => {
  const bound = bindDefinitions(expression.definitions, getConstantContext(environment, scope));
  for (let current = bound; current && current !== scope; current = current.parent) {
    if (current.binding.kind === "Thunk") definitionThunks.add(current.binding);
  }
  return bound;
};

const createAngleAction = (action: Expression, subscript: Expression): Expression => ({
  kind: "AngleAction",
  action,
  subscript,
  location: action.location,
});

export const toLiveExpression = (
  root: Expression,
  rootScope: Scope | undefined,
  environment: Environment,
): LiveExpression => {
  const toAtom = (
    expression: Expression,
    scope: Scope | undefined,
    level: number,
  ): LiveExpression => {
    const atomLevel = level === 0 ? getLevel(expression, scope, environment) : level;
    if (atomLevel === 0) {
      const value = evaluate(expression, getConstantContext(environment, scope));
      if (typeof value !== "boolean") {
        throw new TlaEvaluationError(
          `TLC expected a boolean value, but did not find one. ${describeRange(expression)}`,
        );
      }
      return createBoolean(value);
    }
    if (atomLevel === 1) return { kind: "State", expression, scope };
    return { kind: "Action", expression, unchanged: undefined, scope };
  };

  const expansion = { depth: 0 };
  const is174 = environment.runtime.version === "1.7.4";

  const expand = (
    body: Expression,
    bodyScope: Scope | undefined,
    expression: Expression,
    scope: Scope | undefined,
  ) => {
    if (expansion.depth >= MAXIMUM_EXPANSION_DEPTH) {
      throw createStackOverflowError();
    }
    expansion.depth++;
    const result = convert(body, bodyScope);
    expansion.depth--;
    const level = getLiveLevel(result);
    return level > ACTION_LEVEL ? result : toAtom(expression, scope, level);
  };

  const convertCall = (
    expression: Expression & { kind: "Identifier" | "Apply" },
    scope: Scope | undefined,
  ) => {
    const name = expression.kind === "Identifier" ? expression.name : expression.operator;
    const context = getConstantContext(environment, scope);
    const binding =
      isLocallyResolved(expression) || getDefinition(name, environment) === undefined
        ? lookupScope(scope, name)
        : undefined;
    if (binding?.kind === "Thunk" && definitionThunks.has(binding)) {
      return expandCall(expression, () =>
        expand(binding.expression, binding.scope, expression, scope),
      );
    }
    const operator =
      binding?.kind === "Operator"
        ? binding.operator
        : binding
          ? undefined
          : isLocallyResolved(expression)
            ? resolveOperator(name, context)
            : resolveGlobalOperator(name, environment);
    if (operator?.kind !== "Closure") throw createCannotHandleError(expression);
    const args = expression.kind === "Apply" ? expression.args : [];
    const isRecursive =
      !isLocallyResolved(expression) && getDefinition(name, environment)?.isRecursive === true;
    return expandCall(
      expression,
      () => {
        // TLC 1.7.4 evaluates the arguments of an operator it expands.
        if (is174) {
          args
            .filter((arg) => arg.kind !== "Lambda" && arg.kind !== "OperatorReference")
            .forEach((arg) => evaluate(arg, context));
        }
        return expand(
          operator.body,
          bindOperatorArguments(operator, args, context),
          expression,
          scope,
        );
      },
      isRecursive,
    );
  };

  // TLC takes an application of an operator whose expansion fails for a formula it can't handle,
  // except that TLC after 1.7.4 fails as the expansion of a recursive operator does.
  const expandCall = (
    expression: Expression,
    expandBody: () => LiveExpression,
    isRecursive = false,
  ) => {
    try {
      return expandBody();
    } catch (error) {
      const isRethrown = error instanceof TlaStackOverflowError || (isRecursive && !is174);
      if (!(error instanceof TlaEvaluationError) || isRethrown) throw error;
      throw createCannotHandleError(expression);
    }
  };

  const convertQuantifier = (
    expression: Expression & { kind: "Forall" | "Exists" },
    scope: Scope | undefined,
  ) => {
    const isConstant = expression.bounds.every(
      (bound) => getLevel(bound.set, scope, environment) === 0,
    );
    if (!isConstant) throw createCannotHandleError(expression);
    const operands: LiveExpression[] = [];
    forEachBinding(expression.bounds, getConstantContext(environment, scope), (boundScope) => {
      operands.push(convert(expression.body, boundScope));
      return false;
    });
    const isForall = expression.kind === "Forall";
    if (operands.length === 0) return createBoolean(isForall);
    const result = createJunction(isForall ? "And" : "Or", operands);
    const level = getLiveLevel(result);
    return level > ACTION_LEVEL ? result : toAtom(expression, scope, level);
  };

  const convert = (expression: Expression, scope: Scope | undefined): LiveExpression => {
    const level = getLevel(expression, scope, environment);
    if (level <= ACTION_LEVEL) {
      // TLC converts each conjunct or disjunct before it takes the formula whole, so it evaluates
      // those of constant level.
      if (expression.kind === "And" || expression.kind === "Or") {
        expression.operands.forEach((operand) => convert(operand, scope));
      }
      return toAtom(expression, scope, level);
    }
    switch (expression.kind) {
      case "Label":
        return convert(expression.body, scope);
      case "Let":
        return convert(expression.body, bindLetDefinitions(expression, scope, environment));
      case "Identifier":
        return convertCall(expression, scope);
      case "Apply": {
        const args = expression.args;
        if (expression.operator === "~>") {
          return createUnary(
            "Always",
            createPair(
              "Or",
              createUnary("Not", convert(args[0], scope)),
              createUnary("Eventually", convert(args[1], scope)),
            ),
          );
        }
        if (expression.operator === "~" && !isLocallyResolved(expression)) {
          return createUnary("Not", convert(args[0], scope));
        }
        if (expression.operator === "=>") {
          return createPair(
            "Or",
            createUnary("Not", convert(args[0], scope)),
            convert(args[1], scope),
          );
        }
        return convertCall(expression, scope);
      }
      case "And":
      case "Or":
        return createJunction(
          expression.kind,
          expression.operands.map((operand) => convert(operand, scope)),
        );
      case "Forall":
      case "Exists":
        return convertQuantifier(expression, scope);
      case "If": {
        // TLC 1.7.4 translates both branches whatever the guard.
        if (!is174 && getLevel(expression.condition, scope, environment) === 0) {
          const condition = evaluate(expression.condition, getConstantContext(environment, scope));
          if (typeof condition === "boolean") {
            return convert(condition ? expression.consequent : expression.alternative, scope);
          }
        }
        const condition = convert(expression.condition, scope);
        return createPair(
          "Or",
          createPair("And", condition, convert(expression.consequent, scope)),
          createPair("And", createUnary("Not", condition), convert(expression.alternative, scope)),
        );
      }
      case "Always":
      case "Eventually":
        return createUnary(expression.kind, convert(expression.expression, scope));
      case "WeakFairness":
      case "StrongFairness": {
        const step = createAngleAction(expression.action, expression.subscript);
        const enabled: LiveEnabled = { kind: "Enabled", step: expression.enabled ?? step, scope };
        const disabled = createUnary("Not", enabled);
        const taken: LiveExpression = {
          kind: "Action",
          expression: expression.action,
          unchanged: {
            kind: "Unchanged",
            expression: expression.subscript,
            location: step.location,
          },
          scope,
          enabled,
        };
        if (expression.kind === "WeakFairness") {
          return createUnary(
            "Always",
            createUnary("Eventually", createPair("Or", disabled, taken)),
          );
        }
        return createPair(
          "Or",
          createUnary("Eventually", createUnary("Always", disabled)),
          createUnary("Always", createUnary("Eventually", taken)),
        );
      }
      default:
        throw createCannotHandleError(expression);
    }
  };

  return convert(root, rootScope);
};

export const evaluateLive = (
  expression: LiveExpression,
  state: Value[],
  next: Value[] | undefined,
  environment: Environment,
  stateCache: Map<LiveExpression, boolean>,
): boolean => {
  const recurse = (operand: LiveExpression) =>
    evaluateLive(operand, state, next, environment, stateCache);
  switch (expression.kind) {
    case "Boolean":
      return expression.value;
    case "State":
    case "Enabled": {
      const cached = stateCache.get(expression);
      if (cached !== undefined) return cached;
      const context = { environment, scope: expression.scope, state, next: undefined };
      const result =
        expression.kind === "State"
          ? expectBoolean(evaluate(expression.expression, context), "a temporal property predicate")
          : isEnabled(expression.step, context);
      stateCache.set(expression, result);
      return result;
    }
    case "Action": {
      if (expression.enabled && stateCache.get(expression.enabled) === false) return false;
      const context = { environment, scope: expression.scope, state, next };
      if (
        expression.unchanged &&
        expectBoolean(evaluate(expression.unchanged, context), "a subscript")
      )
        return false;
      return expectBoolean(evaluate(expression.expression, context), "an action predicate");
    }
    case "Not":
      return !recurse(expression.body);
    case "And":
      return expression.operands.every(recurse);
    case "Or":
      return expression.operands.some(recurse);
    case "Next":
      return evaluateLive(expression.body, next ?? state, undefined, environment, new Map());
    case "Always":
    case "Eventually":
      throw new TlaEvaluationError("TLC cannot evaluate a temporal formula in a single step");
  }
};

export const evaluateOnLasso = (
  expression: LiveExpression,
  path: Value[][],
  cycleStart: number,
  position: number,
  environment: Environment,
): boolean => {
  const getNext = (index: number) => (index + 1 < path.length ? index + 1 : cycleStart);
  const getFuture = (index: number) =>
    path.map((_, offset) => offset).filter((offset) => offset >= Math.min(index, cycleStart));
  const recurse = (operand: LiveExpression, index = position) =>
    evaluateOnLasso(operand, path, cycleStart, index, environment);
  switch (expression.kind) {
    case "Not":
      return !recurse(expression.body);
    case "And":
      return expression.operands.every((operand) => recurse(operand));
    case "Or":
      return expression.operands.some((operand) => recurse(operand));
    case "Next":
      return recurse(expression.body, getNext(position));
    case "Always":
      return getFuture(position).every((index) => recurse(expression.body, index));
    case "Eventually":
      return getFuture(position).some((index) => recurse(expression.body, index));
    default:
      return evaluateLive(
        expression,
        path[position],
        path[getNext(position)],
        environment,
        new Map(),
      );
  }
};
