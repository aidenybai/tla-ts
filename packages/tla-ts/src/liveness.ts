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
  getLetSites,
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

interface Expansion {
  name: string | undefined;
  path: string[];
  expanding: Set<Definition>;
  isSubstituted: boolean;
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

// The level that SANY gives an expression, with the levels of what its scope binds read in, as
// Specs.getLevel finds it, and the bound on that level that getLevelBound finds through the
// operators that the expression calls.
interface Levels {
  level: number;
  bound: number;
}

const toLevels = (level: number): Levels => ({ level, bound: level });

const getMaximumLevels = (all: Levels[]): Levels => ({
  level: Math.max(CONSTANT_LEVEL, ...all.map((levels) => levels.level)),
  bound: Math.max(CONSTANT_LEVEL, ...all.map((levels) => levels.bound)),
});

const getLevels = (
  expression: Expression,
  scope: Scope | undefined,
  environment: Environment,
  shadowed: Set<string>,
  visiting: Set<object>,
): Levels => {
  const getBodyLevels = (binding: object, body: Expression, bodyScope: Scope | undefined) => {
    if (visiting.has(binding)) return toLevels(CONSTANT_LEVEL);
    visiting.add(binding);
    const levels = getLevels(body, bodyScope, environment, new Set(), visiting);
    visiting.delete(binding);
    return levels;
  };
  const getBindingLevels = (name: string) => {
    const binding = lookupScope(scope, name);
    if (!binding) return undefined;
    if (binding.kind === "Value") return toLevels(CONSTANT_LEVEL);
    if (binding.kind === "Thunk") {
      return binding.isReleased
        ? toLevels(CONSTANT_LEVEL)
        : getBodyLevels(binding, binding.expression, binding.scope);
    }
    const operator = binding.operator;
    return operator.kind === "Closure"
      ? getBodyLevels(operator, operator.body, operator.scope)
      : toLevels(CONSTANT_LEVEL);
  };
  const getGlobalLevels = (name: string) => {
    if (environment.variableIndex.has(name)) return toLevels(VARIABLE_LEVEL);
    if (environment.constants.has(name)) return toLevels(CONSTANT_LEVEL);
    const definition = getDefinition(name, environment);
    if (definition) {
      const bound = getDefinitionLevel(definition, environment);
      return { level: environment.getOperatorLevels(name)?.level ?? bound, bound };
    }
    const builtin = environment.builtins.get(environment.substitutions.get(name) ?? name);
    if (!builtin) return undefined;
    if (builtin.isActionLevel) return toLevels(ACTION_LEVEL);
    return toLevels(
      builtin.isStateLevel && !builtin.isLevelConstant ? VARIABLE_LEVEL : CONSTANT_LEVEL,
    );
  };
  const getNameLevels = (name: string, node: Expression) => {
    if (shadowed.has(name)) return toLevels(CONSTANT_LEVEL);
    if (isLocallyResolved(node)) {
      return getBindingLevels(name) ?? getGlobalLevels(name) ?? toLevels(CONSTANT_LEVEL);
    }
    return getGlobalLevels(name) ?? getBindingLevels(name) ?? toLevels(CONSTANT_LEVEL);
  };
  const getChildrenLevels = (node: Expression) => {
    const all: Levels[] = [];
    mapChildren(node, (child, bound) => {
      all.push(
        getLevels(
          child,
          scope,
          environment,
          bound.length === 0 ? shadowed : new Set([...shadowed, ...bound]),
          visiting,
        ),
      );
      return child;
    });
    return getMaximumLevels(all);
  };
  switch (expression.kind) {
    case "Prime":
    case "Unchanged":
    case "BoxAction":
    case "AngleAction":
      return toLevels(ACTION_LEVEL);
    case "Enabled":
      return toLevels(VARIABLE_LEVEL);
    case "Always":
    case "Eventually":
    case "WeakFairness":
    case "StrongFairness":
      return toLevels(TEMPORAL_LEVEL);
    case "UnboundedQuantifier":
      return expression.isTemporal ? toLevels(TEMPORAL_LEVEL) : getChildrenLevels(expression);
    case "Identifier":
      return getNameLevels(expression.name, expression);
    case "OperatorReference":
      return getNameLevels(expression.operator, expression);
    case "Apply": {
      if (TEMPORAL_OPERATORS.has(expression.operator)) return toLevels(TEMPORAL_LEVEL);
      if (expression.operator === "\\cdot") return toLevels(ACTION_LEVEL);
      const operatorLevels = getNameLevels(expression.operator, expression);
      const argumentLevels = expression.args.map((argument) =>
        getLevels(argument, scope, environment, shadowed, visiting),
      );
      const levels = getMaximumLevels([operatorLevels, ...argumentLevels]);
      const operator = isLocallyResolved(expression)
        ? undefined
        : environment.getOperatorLevels(expression.operator);
      if (operator?.formals.length !== expression.args.length) return levels;
      // SANY levels a call by the operator's own level and the levels of the arguments to the
      // formals that its level reads.
      return {
        level: Math.max(
          operator.level,
          ...argumentLevels
            .filter((_, index) => operator.weights[index] === 1)
            .map((argument) => argument.level),
        ),
        bound: levels.bound,
      };
    }
    default:
      return getChildrenLevels(expression);
  }
};

// As TLC levels a formula: by SANY's level, or by the bound where SANY's level is constant.
export const getLevel = (
  expression: Expression,
  scope: Scope | undefined,
  environment: Environment,
): number => {
  const levels = getLevels(expression, scope, environment, new Set(), new Set());
  return levels.level === CONSTANT_LEVEL ? levels.bound : levels.level;
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
  expansion: Expansion = { name: undefined, path: [], expanding: new Set(), isSubstituted: false },
): ExpandedExpression[] => {
  const expand = (
    child: Expression,
    childScope: Scope | undefined,
    childName = expansion.name,
    childExpanding = expansion.expanding,
    definition?: Definition,
  ): ExpandedExpression[] =>
    expandTemporal(child, childScope, environment, isProperty, {
      name: childName,
      path:
        definition?.kind === "Operator" && definition.params.length === 0
          ? [...expansion.path, definition.name]
          : expansion.path,
      expanding: childExpanding,
      isSubstituted:
        expansion.isSubstituted ||
        (definition !== undefined && environment.substitutedDefinitions.has(definition)),
    });
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
        definitionThunks.has(binding) ? expression.name : expansion.name,
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
      if (expansion.expanding.has(definition)) {
        throw createStackOverflowError();
      }
      return expand(
        definition.body,
        undefined,
        (!expansion.isSubstituted && environment.instanceNames.get(expression.name)) ||
          definition.name,
        new Set([...expansion.expanding, definition]),
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
      (!expansion.isSubstituted || isOwnArgumentFree);
    if (isExpandable) {
      return expand(
        operator.body,
        bindOperatorArguments(operator, expression.args, context),
        expansion.isSubstituted && definition ? definition.name : expression.operator,
        expansion.expanding,
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
  return [{ expression, scope, name: expansion.name, path: expansion.path }];
};

const bindLetDefinitions = (
  expression: Expression & { kind: "Let" },
  scope: Scope | undefined,
  environment: Environment,
) => {
  const bound = bindDefinitions(
    expression.definitions,
    getConstantContext(environment, scope),
    undefined,
    getLetSites(expression.definitions),
  );
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

  // These forms are translated part by part at every level; any other form below the temporal level is an atom.
  const convert = (expression: Expression, scope: Scope | undefined): LiveExpression => {
    const level = getLevel(expression, scope, environment);
    switch (expression.kind) {
      case "Label":
        return convert(expression.body, scope);
      case "Let":
        return convert(expression.body, bindLetDefinitions(expression, scope, environment));
      case "Apply": {
        const args = expression.args;
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
        break;
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
    }
    if (level <= ACTION_LEVEL) return toAtom(expression, scope, level);
    switch (expression.kind) {
      case "Identifier":
        return convertCall(expression, scope);
      case "Apply":
        return expression.operator === "~>"
          ? createUnary(
              "Always",
              createPair(
                "Or",
                createUnary("Not", convert(expression.args[0], scope)),
                createUnary("Eventually", convert(expression.args[1], scope)),
              ),
            )
          : convertCall(expression, scope);
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

// Evaluates the atoms of a formula, which the interpreter and the typed tier evaluate differently.
export interface LiveAtoms<State> {
  holdsState: (atom: LiveState | LiveEnabled, state: State) => boolean;
  holdsAction: (atom: LiveAction, state: State, next: State) => boolean;
}

export const getInterpretedAtoms = (environment: Environment): LiveAtoms<Value[]> => ({
  holdsState: (atom, state) => {
    const context = { environment, scope: atom.scope, state, next: undefined };
    const value =
      atom.kind === "State" ? evaluate(atom.expression, context) : isEnabled(atom.step, context);
    if (typeof value !== "boolean") {
      throw new TlaEvaluationError("A state predicate was evaluated to a non-boolean value.");
    }
    return value;
  },
  holdsAction: (atom, state, next) => {
    const scope = atom.scope;
    const subscript = atom.subscript;
    if (
      subscript &&
      isEqualLikeTlc(
        evaluate(subscript, { environment, scope, state, next: undefined }),
        evaluate(subscript, { environment, scope, state: next, next: undefined }),
      )
    )
      return false;
    const value = evaluate(atom.expression, { environment, scope, state, next });
    if (typeof value !== "boolean") {
      throw new TlaEvaluationError("Encountered an action predicate that's not a boolean.");
    }
    return value;
  },
});

export const evaluateLive = <State>(
  expression: LiveExpression,
  state: State,
  next: State | undefined,
  atoms: LiveAtoms<State>,
  stateCache: Map<LiveExpression, boolean>,
): boolean => {
  const recurse = (operand: LiveExpression) =>
    evaluateLive(operand, state, next, atoms, stateCache);
  switch (expression.kind) {
    case "Boolean":
      return expression.value;
    case "State":
    case "Enabled": {
      const cached = stateCache.get(expression);
      if (cached !== undefined) return cached;
      const value = atoms.holdsState(expression, state);
      stateCache.set(expression, value);
      return value;
    }
    case "Action":
      if (expression.enabled && stateCache.get(expression.enabled) === false) return false;
      return next !== undefined && atoms.holdsAction(expression, state, next);
    case "Not":
      return !recurse(expression.body);
    case "And":
      return expression.operands.every(recurse);
    case "Or":
      return expression.operands.some(recurse);
    case "Next":
      return evaluateLive(expression.body, next ?? state, undefined, atoms, new Map());
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
        getInterpretedAtoms(environment),
        new Map(),
      );
  }
};
