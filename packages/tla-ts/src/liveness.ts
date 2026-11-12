import { isLocallyResolved, type Bound, type Definition, type Expression } from "./ast";
import { getDefinitionLevel } from "./dependencies";
import {
  createStackOverflowError,
  TlaEvaluationError,
  TlaStackOverflowError,
  UNEXPECTED_EVAL_EXCEPTION,
} from "./errors";
import {
  describeNode,
  describeRange,
  bindDefinitions,
  bindOperatorArguments,
  evaluate,
  forEachBinding,
  forEachBoundElement,
  getBoundElements,
  getDefinition,
  getStartupValue,
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
import { ACTION_LEVEL, CONSTANT_LEVEL, TEMPORAL_LEVEL, VARIABLE_LEVEL } from "./levels";
import { isEnabled } from "./successors";
import { EXIT_STATUS, setExitCode } from "./exit-codes";
import { isEvalException } from "./tlc/messages";
import {
  createBoolean,
  createJunction,
  createPair,
  createUnary,
  getLiveLevel,
  type LiveAction,
  type LiveEnabled,
  type LiveExpression,
  type LiveState,
} from "./tableau";
import { isEqualLikeTlc, type Value } from "./values";

export interface ScopedExpression {
  expression: Expression;
  scope: Scope | undefined;
}

interface ExpandedExpression extends ScopedExpression {
  name: string | undefined;
  path: string[];
}

export interface TemporalProperty extends ScopedExpression {
  name: string;
}

const MAXIMUM_EXPANSION_DEPTH = 100;

export const createTautologyError = () =>
  setExitCode(
    new TlaEvaluationError("Temporal formula is a tautology (its negation is unsatisfiable)."),
    EXIT_STATUS.livenessEvaluationFailure,
  );

const TEMPORAL_OPERATORS = new Set(["~>", "-+->"]);

const definitionThunks = new WeakSet<Thunk>();

const JUNCTIONS = new Map<string, "And" | "Or">([
  ["/\\", "And"],
  ["\\/", "Or"],
]);

const getConstantContext = (environment: Environment, scope: Scope | undefined): Context => ({
  environment,
  scope,
  state: undefined,
  next: undefined,
});

const createCannotHandleError = (expression: Expression, inner?: string) =>
  new TlaEvaluationError(
    `TLC cannot handle the temporal formula ${describeRange(expression)}${inner === undefined ? "" : `:\n${inner}`}`,
  );

export const getLevel = (
  expression: Expression,
  scope: Scope | undefined,
  environment: Environment,
  shadowed = new Set<string>(),
  visiting = new Set<object>(),
): number => {
  const getBodyLevel = (binding: object, body: Expression, bodyScope: Scope | undefined) => {
    if (visiting.has(binding)) return CONSTANT_LEVEL;
    visiting.add(binding);
    const level = getLevel(body, bodyScope, environment, new Set(), visiting);
    visiting.delete(binding);
    return level;
  };
  const getBindingLevel = (name: string) => {
    const binding = lookupScope(scope, name);
    if (!binding) return undefined;
    if (binding.kind === "Value") return CONSTANT_LEVEL;
    if (binding.kind === "Thunk") {
      return binding.isReleased
        ? CONSTANT_LEVEL
        : getBodyLevel(binding, binding.expression, binding.scope);
    }
    const operator = binding.operator;
    return operator.kind === "Closure"
      ? getBodyLevel(operator, operator.body, operator.scope)
      : CONSTANT_LEVEL;
  };
  const getGlobalLevel = (name: string) => {
    if (environment.variableIndex.has(name)) return VARIABLE_LEVEL;
    if (environment.constants.has(name)) return CONSTANT_LEVEL;
    const definition = getDefinition(name, environment);
    if (definition) return getDefinitionLevel(definition, environment);
    const builtin = environment.builtins.get(environment.substitutions.get(name) ?? name);
    if (!builtin) return undefined;
    if (builtin.isActionLevel) return ACTION_LEVEL;
    return builtin.isStateLevel && !builtin.isLevelConstant ? VARIABLE_LEVEL : CONSTANT_LEVEL;
  };
  const getNameLevel = (name: string, node: Expression) => {
    if (shadowed.has(name)) return CONSTANT_LEVEL;
    if (isLocallyResolved(node)) {
      return getBindingLevel(name) ?? getGlobalLevel(name) ?? CONSTANT_LEVEL;
    }
    return getGlobalLevel(name) ?? getBindingLevel(name) ?? CONSTANT_LEVEL;
  };
  const getChildrenLevel = (node: Expression) => {
    let level = CONSTANT_LEVEL;
    mapChildren(node, (child, bound) => {
      level = Math.max(
        level,
        getLevel(
          child,
          scope,
          environment,
          bound.length === 0 ? shadowed : new Set([...shadowed, ...bound]),
          visiting,
        ),
      );
      return child;
    });
    return level;
  };
  switch (expression.kind) {
    case "Prime":
    case "Unchanged":
    case "BoxAction":
    case "AngleAction":
      return ACTION_LEVEL;
    case "Enabled":
      return VARIABLE_LEVEL;
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
    case "Apply": {
      if (TEMPORAL_OPERATORS.has(expression.operator)) return TEMPORAL_LEVEL;
      if (expression.operator === "\\cdot") return ACTION_LEVEL;
      const operatorLevel = getNameLevel(expression.operator, expression);
      const level = Math.max(operatorLevel, getChildrenLevel(expression));
      const operator = isLocallyResolved(expression)
        ? undefined
        : resolveGlobalOperator(expression.operator, environment);
      if (
        level === operatorLevel ||
        operator?.kind !== "Closure" ||
        operator.params.length !== expression.args.length
      ) {
        return level;
      }
      return getBodyLevel(
        operator,
        operator.body,
        bindOperatorArguments(operator, expression.args, getConstantContext(environment, scope)),
      );
    }
    default:
      return getChildrenLevel(expression);
  }
};

const getUnrolledElements = (bounds: Bound[], context: Context) => {
  try {
    return getBoundElements(bounds, context);
  } catch (error) {
    if (!(error instanceof TlaEvaluationError)) throw error;
    if (!isEvalException(error)) return undefined;
    throw setExitCode(
      new TlaEvaluationError(`${UNEXPECTED_EVAL_EXCEPTION}${error.message}`),
      EXIT_STATUS.error,
    );
  }
};

export const expandTemporal = (
  expression: Expression,
  scope: Scope | undefined,
  environment: Environment,
  isProperty: boolean,
  expanding = new Set<Definition>(),
  isSubstituted = false,
  name?: string,
  path: string[] = [],
): ExpandedExpression[] => {
  const expand = (
    child: Expression,
    childScope: Scope | undefined,
    childName = name,
    childExpanding = expanding,
    definition?: Definition,
  ): ExpandedExpression[] =>
    expandTemporal(
      child,
      childScope,
      environment,
      isProperty,
      childExpanding,
      isSubstituted ||
        (definition !== undefined && environment.substitutedDefinitions.has(definition)),
      childName,
      definition?.kind === "Operator" && definition.params.length === 0
        ? [...path, definition.name]
        : path,
    );
  if (expression.kind === "And") {
    return expression.operands.flatMap((operand) => expand(operand, scope, describeRange(operand)));
  }
  if (expression.kind === "Label") return expand(expression.body, scope);
  if (expression.kind === "Let") {
    return expand(expression.body, bindLetDefinitions(expression, scope, environment));
  }
  if (expression.kind === "Identifier") {
    const binding = isLocallyResolved(expression) ? lookupScope(scope, expression.name) : undefined;
    if (binding?.kind === "Thunk" && !binding.isReleased) {
      return expand(
        binding.expression,
        binding.scope,
        definitionThunks.has(binding) ? expression.name : name,
      );
    }
    const definition = environment.constants.has(expression.name)
      ? undefined
      : getDefinition(expression.name, environment);
    if (
      !binding &&
      definition?.kind === "Operator" &&
      definition.params.length === 0 &&
      (getDefinitionLevel(definition, environment) > CONSTANT_LEVEL ||
        getStartupValue(definition, environment) === undefined)
    ) {
      if (expanding.has(definition)) {
        throw createStackOverflowError();
      }
      return expand(
        definition.body,
        undefined,
        (!isSubstituted && environment.instanceNames.get(expression.name)) || definition.name,
        new Set([...expanding, definition]),
        definition,
      );
    }
  }
  const context = getConstantContext(environment, scope);
  if (
    expression.kind === "Apply" &&
    environment.runtime.version !== "1.7.4" &&
    (isProperty || getLevel(expression, scope, environment) === TEMPORAL_LEVEL)
  ) {
    const operator = resolveApplyOperator(expression, context);
    const definition = isLocallyResolved(expression)
      ? undefined
      : getDefinition(expression.operator, environment);
    const isOwnArgumentFree =
      operator?.kind === "Closure" &&
      operator.params.every((param) => environment.instanceParams.has(param));
    const isExpandable =
      operator?.kind === "Closure" &&
      operator.params.length === expression.args.length &&
      !definition?.isRecursive &&
      (!isSubstituted || isOwnArgumentFree);
    if (isExpandable) {
      return expand(
        operator.body,
        bindOperatorArguments(operator, expression.args, context),
        isSubstituted && definition ? definition.name : expression.operator,
        expanding,
        definition,
      );
    }
  }
  const isUnrolled =
    isProperty &&
    expression.kind === "Forall" &&
    expression.bounds.every((bound) => getLevel(bound.set, scope, environment) === CONSTANT_LEVEL);
  const sets = isUnrolled ? getUnrolledElements(expression.bounds, context) : undefined;
  if (isUnrolled && sets) {
    const expanded: ExpandedExpression[] = [];
    forEachBoundElement(expression.bounds, sets, scope, (boundScope) => {
      expanded.push(...expand(expression.body, boundScope, describeRange(expression.body)));
      return false;
    });
    if (expanded.length === 0) throw createTautologyError();
    return expanded;
  }
  return [{ expression, scope, name, path }];
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

export const toLiveExpression = (
  root: Expression,
  rootScope: Scope | undefined,
  environment: Environment,
): LiveExpression => {
  const is174 = environment.runtime.version === "1.7.4";
  const toAtom = (
    expression: Expression,
    scope: Scope | undefined,
    level: number,
  ): LiveExpression => {
    const atomLevel =
      level === CONSTANT_LEVEL && !is174 ? getLevel(expression, scope, environment) : level;
    if (atomLevel === CONSTANT_LEVEL) {
      const value = evaluate(expression, getConstantContext(environment, scope));
      if (typeof value !== "boolean") {
        throw new TlaEvaluationError(
          `TLC expected a boolean value, but did not find one. ${describeNode(expression)}`,
        );
      }
      return createBoolean(value);
    }
    if (atomLevel === VARIABLE_LEVEL) return { kind: "State", expression, scope };
    if (expression.kind === "AngleAction") {
      return {
        kind: "Action",
        expression: expression.action,
        subscript: expression.subscript,
        scope,
      };
    }
    return { kind: "Action", expression, subscript: undefined, scope };
  };

  let expansionDepth = 0;

  const expand = (
    body: Expression,
    bodyScope: Scope | undefined,
    expression: Expression,
    scope: Scope | undefined,
  ) => {
    if (expansionDepth >= MAXIMUM_EXPANSION_DEPTH) {
      throw createStackOverflowError();
    }
    expansionDepth++;
    const result = convert(body, bodyScope);
    expansionDepth--;
    const level = getLiveLevel(result);
    // Deviation from TLC: Liveness#astToLive takes a temporal call with a constant body for an action, which classifyExpr rejects.
    const isConstantTemporal =
      level === CONSTANT_LEVEL && getLevel(expression, scope, environment) > ACTION_LEVEL;
    return level > ACTION_LEVEL || isConstantTemporal ? result : toAtom(expression, scope, level);
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
    if (binding?.kind === "Thunk" && !binding.isReleased && definitionThunks.has(binding)) {
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
    const args = expression.kind === "Apply" ? expression.args : [];
    const junction =
      operator?.kind === "Builtin" && args.length === 2 ? JUNCTIONS.get(operator.name) : undefined;
    if (junction) {
      const operands = args.map((arg) => convert(arg, scope));
      return toWhole(expression, scope, createJunction(junction, operands));
    }
    if (operator?.kind !== "Closure") throw createCannotHandleError(expression);
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
    const level = getLevel(expression, scope, environment);
    const operands: LiveExpression[] = [];
    const isForall = expression.kind === "Forall";
    try {
      forEachBinding(expression.bounds, getConstantContext(environment, scope), (boundScope) => {
        operands.push(convert(expression.body, boundScope));
        return false;
      });
    } catch (error) {
      if (!(error instanceof TlaEvaluationError) || error instanceof TlaStackOverflowError) {
        throw error;
      }
      if (level <= ACTION_LEVEL) return toAtom(expression, scope, level);
      throw createCannotHandleError(
        expression,
        isForall && !isEvalException(error) ? error.message : undefined,
      );
    }
    if (operands.length === 0) return createBoolean(isForall);
    return toWhole(expression, scope, createJunction(isForall ? "And" : "Or", operands));
  };

  const toWhole = (expression: Expression, scope: Scope | undefined, parts: LiveExpression) => {
    const level = getLiveLevel(parts);
    return level > ACTION_LEVEL ? parts : toAtom(expression, scope, level);
  };

  const isTranslatedWhole = (expression: Expression) =>
    expression.kind === "Label" ||
    expression.kind === "Let" ||
    expression.kind === "And" ||
    expression.kind === "Or" ||
    expression.kind === "Forall" ||
    expression.kind === "Exists" ||
    expression.kind === "If" ||
    (expression.kind === "Apply" &&
      ((expression.operator === "~" && !isLocallyResolved(expression)) ||
        expression.operator === "=>"));

  const convert = (expression: Expression, scope: Scope | undefined): LiveExpression => {
    const level = getLevel(expression, scope, environment);
    if (level <= ACTION_LEVEL && !isTranslatedWhole(expression)) {
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
          return toWhole(expression, scope, createUnary("Not", convert(args[0], scope)));
        }
        if (expression.operator === "=>") {
          return toWhole(
            expression,
            scope,
            createPair("Or", createUnary("Not", convert(args[0], scope)), convert(args[1], scope)),
          );
        }
        return convertCall(expression, scope);
      }
      case "And":
      case "Or":
        return toWhole(
          expression,
          scope,
          createJunction(
            expression.kind,
            expression.operands.map((operand) => convert(operand, scope)),
          ),
        );
      case "Forall":
      case "Exists":
        return convertQuantifier(expression, scope);
      case "If": {
        if (!is174 && getLevel(expression.condition, scope, environment) === CONSTANT_LEVEL) {
          const condition = evaluate(expression.condition, getConstantContext(environment, scope));
          if (typeof condition === "boolean") {
            return convert(condition ? expression.consequent : expression.alternative, scope);
          }
        }
        const condition = convert(expression.condition, scope);
        return toWhole(
          expression,
          scope,
          createPair(
            "Or",
            createPair("And", condition, convert(expression.consequent, scope)),
            createPair(
              "And",
              createUnary("Not", condition),
              convert(expression.alternative, scope),
            ),
          ),
        );
      }
      case "Always":
      case "Eventually":
        return createUnary(expression.kind, convert(expression.expression, scope));
      case "WeakFairness":
      case "StrongFairness": {
        const step: Expression = {
          kind: "AngleAction",
          action: expression.action,
          subscript: expression.subscript,
          location: expression.action.location,
        };
        const enabled: LiveEnabled = { kind: "Enabled", step: expression.enabled ?? step, scope };
        const disabled = createUnary("Not", enabled);
        const taken: LiveExpression = {
          kind: "Action",
          expression: expression.action,
          subscript: expression.subscript,
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

export const evaluateStateAtom = (
  expression: LiveState | LiveEnabled,
  state: Value[],
  environment: Environment,
) => {
  const context = { environment, scope: expression.scope, state, next: undefined };
  const value =
    expression.kind === "State"
      ? evaluate(expression.expression, context)
      : isEnabled(expression.step, context);
  if (typeof value !== "boolean") {
    throw new TlaEvaluationError("A state predicate was evaluated to a non-boolean value.");
  }
  return value;
};

export const evaluateActionAtom = (
  expression: LiveAction,
  state: Value[],
  next: Value[] | undefined,
  environment: Environment,
) => {
  const scope = expression.scope;
  const subscript = expression.subscript;
  if (
    subscript &&
    isEqualLikeTlc(
      evaluate(subscript, { environment, scope, state, next: undefined }),
      evaluate(subscript, { environment, scope, state: next, next: undefined }),
    )
  )
    return false;
  const value = evaluate(expression.expression, { environment, scope, state, next });
  if (typeof value !== "boolean") {
    throw new TlaEvaluationError("Encountered an action predicate that's not a boolean.");
  }
  return value;
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
      const value = evaluateStateAtom(expression, state, environment);
      stateCache.set(expression, value);
      return value;
    }
    case "Action":
      if (expression.enabled && stateCache.get(expression.enabled) === false) return false;
      return evaluateActionAtom(expression, state, next, environment);
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
    path.map((_state, offset) => offset).filter((offset) => offset >= Math.min(index, cycleStart));
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
