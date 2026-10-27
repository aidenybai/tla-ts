import type { Bound, Definition, Expression } from "./ast";
import { TlaEvaluationError } from "./errors";
import { EXIT_STATUS, setExitCode } from "./exit-codes";
import {
  bindArgument,
  bindDefinitions,
  bindOperatorArguments,
  bindValue,
  compileArgumentScope,
  evaluate,
  expectBoolean,
  forEachBinding,
  getBoundsDomain,
  getDefinition,
  lookupScope,
  resolveApplyOperator,
  resolveGlobalOperator,
  isLocallyResolved,
  type Context,
  type Environment,
  type Scope,
  type State,
} from "./evaluate";
import {
  createTuple,
  formatValue,
  isElementOf,
  isEnumerable,
  toFiniteSet,
  valuesEqual,
  type Value,
} from "./values";

export interface Successor {
  state: Value[];
  action: string | undefined;
}

interface Run {
  environment: Environment;
  isInit: boolean;
  current: Value[] | undefined;
}

type Continuation = (partial: State, action: string | undefined) => void;

type Runner = (
  run: Run,
  scope: Scope | undefined,
  partial: State,
  action: string | undefined,
  isFixed: boolean,
  onComplete: Continuation,
) => void;

type Conjunct = { expression: Expression } & (
  | { kind: "Guard" }
  | { kind: "Assign"; index: number; value: Expression }
  | { kind: "Unchanged"; indices: number[] }
  | { kind: "Branch"; runner: Runner }
);

const initRunners = new WeakMap<Expression, Runner>();
const nextRunners = new WeakMap<Expression, Runner>();

const describeLocation = (expression: Expression) =>
  `line ${expression.location.line}, column ${expression.location.column}`;

const getContext = (run: Run, scope: Scope | undefined, partial: State): Context =>
  run.isInit
    ? { environment: run.environment, scope, state: partial, next: undefined }
    : { environment: run.environment, scope, state: run.current, next: partial };

const assign = (partial: State, index: number, value: Value) => {
  const copy = partial.slice();
  copy[index] = value;
  return copy;
};

const holds = (expression: Expression, context: Context) => {
  const value = evaluate(expression, context);
  if (typeof value === "boolean") return value;
  try {
    return expectBoolean(value, `the action at ${describeLocation(expression)}`);
  } catch (error) {
    // TLC fails with an unexpected exception when the next-state relation isn't a boolean.
    throw context.next === undefined ? error : setExitCode(error, EXIT_STATUS.error);
  }
};

const isAssignmentOperator = (operator: string) =>
  operator === "=" || operator === "\\in" || operator === "\\subseteq";

const getRunner = (expression: Expression, environment: Environment, isInit: boolean): Runner => {
  const runners = isInit ? initRunners : nextRunners;
  const cached = runners.get(expression);
  if (cached) return cached;
  const runner = compileAction(expression, environment, isInit);
  runners.set(expression, runner);
  return runner;
};

const getZeroArityBody = (name: string, environment: Environment) => {
  if (environment.constants.has(name)) return undefined;
  const definition = getDefinition(name, environment);
  return definition?.kind === "Operator" && definition.params.length === 0 ? definition : undefined;
};

const getStaticVariableIndex = (
  expression: Expression,
  environment: Environment,
  isPrimed: boolean,
  visited = new Set<Definition>(),
): number | undefined => {
  if (expression.kind === "Prime" && isPrimed) {
    return getStaticVariableIndex(expression.expression, environment, false, visited);
  }
  if (expression.kind !== "Identifier" || isLocallyResolved(expression)) return undefined;
  const index = environment.variableIndex.get(expression.name);
  if (index !== undefined) return isPrimed ? undefined : index;
  const definition = getZeroArityBody(expression.name, environment);
  if (!definition || visited.has(definition)) return undefined;
  visited.add(definition);
  return getStaticVariableIndex(definition.body, environment, isPrimed, visited);
};

const getAssignableIndex = (target: Expression, environment: Environment, isInit: boolean) =>
  getStaticVariableIndex(target, environment, !isInit);

const getRuntimeVariableIndex = (
  expression: Expression,
  scope: Scope | undefined,
  partial: State,
  run: Run,
  isPrimed: boolean,
): number | undefined => {
  if (expression.kind === "Prime" && isPrimed) {
    return getRuntimeVariableIndex(expression.expression, scope, partial, run, false);
  }
  if (expression.kind === "Let") {
    const letScope = bindDefinitions(expression.definitions, getContext(run, scope, partial));
    return getRuntimeVariableIndex(expression.body, letScope, partial, run, isPrimed);
  }
  if (expression.kind !== "Identifier") return undefined;
  const binding = lookupScope(scope, expression.name);
  if (binding?.kind === "Thunk") {
    return getRuntimeVariableIndex(binding.expression, binding.scope, partial, run, isPrimed);
  }
  if (binding) return undefined;
  const index = run.environment.variableIndex.get(expression.name);
  if (index !== undefined) return isPrimed ? undefined : index;
  const definition = getZeroArityBody(expression.name, run.environment);
  if (!definition) return undefined;
  return getRuntimeVariableIndex(definition.body, undefined, partial, run, isPrimed);
};

const isPossiblyAssignable = (target: Expression, isInit: boolean) =>
  target.kind === "Let" ||
  (target.kind === "Identifier" && (isInit || isLocallyResolved(target))) ||
  (!isInit && target.kind === "Prime");

const getUnchangedIndices = (
  expression: Expression,
  environment: Environment,
  visited = new Set<string>(),
): number[] | undefined => {
  if (expression.kind === "Tuple") {
    const indices = expression.elements.map((element) =>
      getUnchangedIndices(element, environment, visited),
    );
    return indices.every((item) => item !== undefined) ? indices.flat() : undefined;
  }
  if (expression.kind !== "Identifier" || visited.has(expression.name)) return undefined;
  const index = environment.variableIndex.get(expression.name);
  if (index !== undefined) return [index];
  const definition = getZeroArityBody(expression.name, environment);
  if (!definition) return undefined;
  visited.add(expression.name);
  return getUnchangedIndices(definition.body, environment, visited);
};

const ACTION_KINDS = new Set([
  "Label",
  "And",
  "Or",
  "Exists",
  "Forall",
  "If",
  "Case",
  "Let",
  "Unchanged",
  "BoxAction",
  "AngleAction",
  "FunctionApplication",
]);

const isGuard = (expression: Expression, environment: Environment, isInit: boolean): boolean => {
  if (ACTION_KINDS.has(expression.kind)) return false;
  if (expression.kind === "Identifier") {
    if (
      environment.variableIndex.has(expression.name) ||
      environment.constants.has(expression.name)
    ) {
      return true;
    }
    return false;
  }
  if (expression.kind !== "Apply") return true;
  if (expression.operator === "=>") return false;
  if (isAssignmentOperator(expression.operator)) {
    if (isPossiblyAssignable(expression.args[0], isInit)) return false;
    if (getAssignableIndex(expression.args[0], environment, isInit) !== undefined) return false;
  }
  if (isLocallyResolved(expression)) return false;
  const definition = environment.definitions.get(
    environment.substitutions.get(expression.operator) ?? expression.operator,
  );
  return definition === undefined && environment.builtins.has(expression.operator);
};

const toConjunct = (
  expression: Expression,
  environment: Environment,
  isInit: boolean,
): Conjunct => {
  if (expression.kind === "Apply" && expression.operator === "=") {
    const index = getAssignableIndex(expression.args[0], environment, isInit);
    if (index !== undefined) {
      return { kind: "Assign", expression, index, value: expression.args[1] };
    }
  }
  if (!isInit && expression.kind === "Unchanged") {
    const indices = getUnchangedIndices(expression.expression, environment);
    if (indices) return { kind: "Unchanged", expression, indices };
  }
  if (isGuard(expression, environment, isInit)) return { kind: "Guard", expression };
  return { kind: "Branch", expression, runner: getRunner(expression, environment, isInit) };
};

const compileConjunction = (
  operands: Expression[],
  environment: Environment,
  isInit: boolean,
): Runner => {
  const conjuncts = operands.map((operand) => toConjunct(operand, environment, isInit));
  const runFrom = (
    start: number,
    run: Run,
    scope: Scope | undefined,
    partial: State,
    action: string | undefined,
    onComplete: Continuation,
  ): void => {
    let current = partial;
    let context: Context | undefined;
    for (let index = start; index < conjuncts.length; index++) {
      if (index > 0 && run.isInit && isComplete(current)) {
        context ??= getContext(run, scope, current);
        for (let rest = index; rest < conjuncts.length; rest++) {
          if (!holdsInInit(conjuncts[rest].expression, context)) return;
        }
        onComplete(current, action);
        return;
      }
      const conjunct = conjuncts[index];
      if (conjunct.kind === "Guard") {
        context ??= getContext(run, scope, current);
        if (!holds(conjunct.expression, context)) return;
        continue;
      }
      if (conjunct.kind === "Assign") {
        context ??= getContext(run, scope, current);
        const value = evaluate(conjunct.value, context);
        const assigned = current[conjunct.index];
        if (assigned === undefined) {
          current = assign(current, conjunct.index, value);
          context = undefined;
        } else if (!valuesEqual(assigned, value)) {
          return;
        }
        continue;
      }
      if (conjunct.kind === "Unchanged") {
        const state = run.current;
        if (!state) return;
        for (const variable of conjunct.indices) {
          const assigned = current[variable];
          if (assigned === undefined) {
            current = assign(current, variable, state[variable]);
            context = undefined;
          } else if (!valuesEqual(assigned, state[variable])) {
            return;
          }
        }
        continue;
      }
      const next = index + 1;
      conjunct.runner(run, scope, current, action, true, (nextPartial, nextAction) =>
        runFrom(next, run, scope, nextPartial, nextAction, onComplete),
      );
      return;
    }
    onComplete(current, action);
  };
  return (run, scope, partial, action, _isFixed, onComplete) =>
    runFrom(0, run, scope, partial, action, onComplete);
};

const holdsInInit = (expression: Expression, context: Context) =>
  expectBoolean(
    evaluate(expression, context),
    `the initial predicate at ${describeLocation(expression)}`,
  );

const compileGuard =
  (expression: Expression): Runner =>
  (run, scope, partial, action, _isFixed, onComplete) => {
    if (holds(expression, getContext(run, scope, partial))) onComplete(partial, action);
  };

const compileMembership = (
  expression: Expression & { kind: "Apply" },
  getIndex: (run: Run, scope: Scope | undefined, partial: State) => number,
): Runner => {
  const set = expression.args[1];
  return (run, scope, partial, action, _isFixed, onComplete) => {
    const index = getIndex(run, scope, partial);
    const context = getContext(run, scope, partial);
    if (partial[index] !== undefined) {
      if (holds(expression, context)) onComplete(partial, action);
      return;
    }
    const evaluated = evaluate(set, context);
    const value: Value =
      expression.operator === "\\subseteq" ? { kind: "Subset", base: evaluated } : evaluated;
    if (!isEnumerable(value)) {
      throw new TlaEvaluationError(
        `In computing next states, the right side of \\in is not enumerable: ${formatValue(value)} at ${describeLocation(expression)}`,
      );
    }
    const elements = toFiniteSet(value).elements;
    for (let position = 0; position < elements.length; position++) {
      onComplete(assign(partial, index, elements[position]), action);
    }
  };
};

const unchangedWrappers = new WeakMap<Expression, Expression>();

const getUnchangedWrapper = (expression: Expression): Expression => {
  const cached = unchangedWrappers.get(expression);
  if (cached) return cached;
  const wrapper: Expression =
    expression.kind === "Tuple"
      ? {
          kind: "And",
          operands: expression.elements.map(getUnchangedWrapper),
          location: expression.location,
        }
      : { kind: "Unchanged", expression, location: expression.location };
  unchangedWrappers.set(expression, wrapper);
  return wrapper;
};

const compileDynamicAssignment = (
  expression: Expression & { kind: "Apply" },
  isInit: boolean,
): Runner => {
  const target = expression.args[0];
  const guard = compileGuard(expression);
  const getIndex = (run: Run, scope: Scope | undefined, partial: State) =>
    getRuntimeVariableIndex(target, scope, partial, run, !isInit) ?? -1;
  const membership = compileMembership(expression, getIndex);
  return (run, scope, partial, action, isFixed, onComplete) => {
    const index = getIndex(run, scope, partial);
    if (index === -1 || partial[index] !== undefined) {
      guard(run, scope, partial, action, isFixed, onComplete);
      return;
    }
    if (expression.operator !== "=") {
      membership(run, scope, partial, action, isFixed, onComplete);
      return;
    }
    const value = evaluate(expression.args[1], getContext(run, scope, partial));
    onComplete(assign(partial, index, value), action);
  };
};

interface FunctionAction {
  bounds: Bound[];
  body: Expression;
  scope: Scope | undefined;
}

const getFunctionAction = (
  expression: Expression,
  scope: Scope | undefined,
  partial: State,
  run: Run,
): FunctionAction | undefined => {
  if (expression.kind === "FunctionConstruction") {
    return { bounds: expression.bounds, body: expression.body, scope };
  }
  if (expression.kind !== "Identifier") return undefined;
  const binding = lookupScope(scope, expression.name);
  if (binding?.kind === "Thunk") {
    return getFunctionAction(binding.expression, binding.scope, partial, run);
  }
  const definition = binding ? undefined : getDefinition(expression.name, run.environment);
  if (definition?.kind !== "Function") return undefined;
  const self = evaluate(expression, getContext(run, undefined, partial));
  return {
    bounds: definition.bounds,
    body: definition.body,
    scope: bindValue(undefined, definition.name, self),
  };
};

const compileFunctionAction = (
  expression: Expression & { kind: "FunctionApplication" },
  environment: Environment,
  isInit: boolean,
): Runner => {
  const guard = compileGuard(expression);
  return (run, scope, partial, action, isFixed, onComplete) => {
    const lambda = getFunctionAction(expression.function, scope, partial, run);
    if (!lambda) {
      guard(run, scope, partial, action, isFixed, onComplete);
      return;
    }
    const context = getContext(run, scope, partial);
    const args = expression.args.map((arg) => evaluate(arg, context));
    const argument = args.length === 1 ? args[0] : createTuple(args);
    const domain = getBoundsDomain(lambda.bounds, getContext(run, lambda.scope, partial));
    if (!isElementOf(argument, domain)) {
      throw new TlaEvaluationError(
        `Attempted to apply a function to ${formatValue(argument)}, which is not in its domain at ${describeLocation(expression)}`,
      );
    }
    getRunner(lambda.body, environment, isInit)(
      run,
      bindArgument(lambda.bounds, lambda.scope, argument),
      partial,
      action,
      isFixed,
      onComplete,
    );
  };
};

const compileUnchanged = (expression: Expression, environment: Environment): Runner => {
  const indices = getUnchangedIndices(expression, environment);
  if (indices) return compileConjunction([getUnchangedWrapper(expression)], environment, false);
  if (expression.kind === "Tuple")
    return getRunner(getUnchangedWrapper(expression), environment, false);
  const unchanged = getUnchangedWrapper(expression);
  return (run, scope, partial, action, isFixed, onComplete) => {
    const binding =
      expression.kind === "Identifier" ? lookupScope(scope, expression.name) : undefined;
    if (binding?.kind === "Thunk") {
      getRunner(getUnchangedWrapper(binding.expression), environment, false)(
        run,
        binding.scope,
        partial,
        action,
        isFixed,
        onComplete,
      );
      return;
    }
    if (holds(unchanged, getContext(run, scope, partial))) onComplete(partial, action);
  };
};

const compileCall = (
  expression: Expression & { kind: "Apply" },
  environment: Environment,
  isInit: boolean,
): Runner => {
  const name = expression.operator;
  const guard = compileGuard(expression);
  const global = isLocallyResolved(expression)
    ? undefined
    : resolveGlobalOperator(name, environment);
  if (global?.kind === "Builtin") return guard;
  if (global?.kind === "Closure") {
    const bindArguments = compileArgumentScope(global, expression.args, environment);
    const compiled = { body: undefined as Runner | undefined };
    return (run, scope, partial, action, isFixed, onComplete) => {
      compiled.body ??= getRunner(global.body, environment, isInit);
      compiled.body(
        run,
        bindArguments(getContext(run, scope, partial)),
        partial,
        isFixed ? action : name,
        isFixed,
        onComplete,
      );
    };
  }
  return (run, scope, partial, action, isFixed, onComplete) => {
    const context = getContext(run, scope, partial);
    const operator = resolveApplyOperator(expression, context);
    if (operator?.kind !== "Closure") {
      guard(run, scope, partial, action, isFixed, onComplete);
      return;
    }
    getRunner(operator.body, environment, isInit)(
      run,
      bindOperatorArguments(operator, expression.args, context),
      partial,
      isFixed ? action : name,
      isFixed,
      onComplete,
    );
  };
};

const compileIdentifier = (
  expression: Expression & { kind: "Identifier" },
  environment: Environment,
  isInit: boolean,
): Runner => {
  const guard = compileGuard(expression);
  const definition = isLocallyResolved(expression)
    ? undefined
    : getZeroArityBody(expression.name, environment);
  const compiled = { body: undefined as Runner | undefined };
  return (run, scope, partial, action, isFixed, onComplete) => {
    const binding = lookupScope(scope, expression.name);
    if (binding?.kind === "Thunk") {
      getRunner(binding.expression, environment, isInit)(
        run,
        binding.scope,
        partial,
        action,
        isFixed,
        onComplete,
      );
      return;
    }
    if (binding || !definition) {
      guard(run, scope, partial, action, isFixed, onComplete);
      return;
    }
    compiled.body ??= getRunner(definition.body, environment, isInit);
    compiled.body(run, undefined, partial, isFixed ? action : definition.name, isFixed, onComplete);
  };
};

const compileAction = (
  expression: Expression,
  environment: Environment,
  isInit: boolean,
): Runner => {
  const child = (node: Expression) => getRunner(node, environment, isInit);
  switch (expression.kind) {
    case "And":
      return compileConjunction(expression.operands, environment, isInit);
    case "Or": {
      const operands = expression.operands.map(child);
      return (run, scope, partial, action, isFixed, onComplete) => {
        for (const operand of operands) operand(run, scope, partial, action, isFixed, onComplete);
      };
    }
    case "Exists": {
      const body = child(expression.body);
      const bound = expression.bounds[0];
      if (expression.bounds.length === 1 && bound.pattern.kind === "Name") {
        const name = bound.pattern.name;
        return (run, scope, partial, action, isFixed, onComplete) => {
          const set = evaluate(bound.set, getContext(run, scope, partial));
          if (!isEnumerable(set)) {
            throw new TlaEvaluationError(
              `TLC encountered a non-enumerable quantifier bound ${formatValue(set)} at ${describeLocation(bound.set)}`,
            );
          }
          const elements = toFiniteSet(set).elements;
          for (let index = 0; index < elements.length; index++) {
            body(
              run,
              bindValue(scope, name, elements[index]),
              partial,
              action,
              isFixed,
              onComplete,
            );
          }
        };
      }
      return (run, scope, partial, action, isFixed, onComplete) => {
        forEachBinding(expression.bounds, getContext(run, scope, partial), (boundScope) => {
          body(run, boundScope, partial, action, isFixed, onComplete);
          return false;
        });
      };
    }
    case "Forall": {
      const body = child(expression.body);
      return (run, scope, partial, action, _isFixed, onComplete) => {
        const boundScopes: (Scope | undefined)[] = [];
        forEachBinding(expression.bounds, getContext(run, scope, partial), (boundScope) => {
          boundScopes.push(boundScope);
          return false;
        });
        const scopes = [...boundScopes.slice(0, 1), ...boundScopes.slice(1).reverse()];
        const visit = (index: number, nextPartial: State, nextAction: string | undefined): void => {
          if (index === scopes.length) {
            onComplete(nextPartial, nextAction);
            return;
          }
          if (index > 0 && run.isInit && isComplete(nextPartial)) {
            const isSatisfied = scopes
              .slice(index)
              .every((boundScope) =>
                holdsInInit(expression.body, getContext(run, boundScope, nextPartial)),
              );
            if (isSatisfied) onComplete(nextPartial, nextAction);
            return;
          }
          body(run, scopes[index], nextPartial, nextAction, true, (afterPartial, afterAction) =>
            visit(index + 1, afterPartial, afterAction),
          );
        };
        visit(0, partial, action);
      };
    }
    case "If": {
      const consequent = child(expression.consequent);
      const alternative = child(expression.alternative);
      return (run, scope, partial, action, isFixed, onComplete) => {
        const condition = evaluate(expression.condition, getContext(run, scope, partial));
        const branch = expectBoolean(condition, "an IF condition") ? consequent : alternative;
        branch(run, scope, partial, action, isFixed, onComplete);
      };
    }
    case "Case": {
      const arms = expression.arms.map((arm) => ({
        condition: arm.condition,
        body: child(arm.body),
      }));
      const other = expression.other ? child(expression.other) : undefined;
      return (run, scope, partial, action, isFixed, onComplete) => {
        const context = getContext(run, scope, partial);
        const arm = arms.find((candidate) =>
          expectBoolean(evaluate(candidate.condition, context), "a CASE guard"),
        );
        const body = arm?.body ?? other;
        if (!body)
          throw new TlaEvaluationError(`No CASE guard is true at ${describeLocation(expression)}`);
        body(run, scope, partial, action, isFixed, onComplete);
      };
    }
    case "Let": {
      const body = child(expression.body);
      return (run, scope, partial, action, isFixed, onComplete) =>
        body(
          run,
          bindDefinitions(expression.definitions, getContext(run, scope, partial)),
          partial,
          action,
          isFixed,
          onComplete,
        );
    }
    case "Unchanged":
      if (isInit) {
        return () => {
          throw new TlaEvaluationError(
            `UNCHANGED appears in an initial predicate at ${describeLocation(expression)}`,
          );
        };
      }
      return compileUnchanged(expression.expression, environment);
    case "AngleAction": {
      const body = child(expression.action);
      const unchanged = getUnchangedWrapper(expression.subscript);
      return (run, scope, partial, action, isFixed, onComplete) =>
        body(run, scope, partial, action, isFixed, (nextPartial, nextAction) => {
          if (!holds(unchanged, getContext(run, scope, nextPartial)))
            onComplete(nextPartial, nextAction);
        });
    }
    case "BoxAction":
      return child({
        kind: "Or",
        operands: [expression.action, getUnchangedWrapper(expression.subscript)],
        location: expression.location,
      });
    case "Label":
      return child(expression.body);
    case "Identifier":
      return compileIdentifier(expression, environment, isInit);
    case "FunctionApplication":
      return compileFunctionAction(expression, environment, isInit);
    case "Apply": {
      const args = expression.args;
      if (isAssignmentOperator(expression.operator)) {
        const index = getAssignableIndex(args[0], environment, isInit);
        if (index !== undefined) {
          if (expression.operator !== "=") return compileMembership(expression, () => index);
          return compileConjunction([expression], environment, isInit);
        }
        if (isPossiblyAssignable(args[0], isInit)) {
          return compileDynamicAssignment(expression, isInit);
        }
      }
      if (expression.operator === "=>") {
        const right = child(args[1]);
        return (run, scope, partial, action, isFixed, onComplete) => {
          const condition = evaluate(args[0], getContext(run, scope, partial));
          const isTrue =
            typeof condition === "boolean"
              ? condition
              : expectBoolean(condition, `the left side of => at ${describeLocation(args[0])}`);
          if (!isTrue) {
            onComplete(partial, action);
            return;
          }
          right(run, scope, partial, action, isFixed, onComplete);
        };
      }
      return compileCall(expression, environment, isInit);
    }
    default:
      return compileGuard(expression);
  }
};

const emptyStates = new WeakMap<Environment, State>();

const getEmptyState = (environment: Environment) => {
  const cached = emptyStates.get(environment);
  if (cached) return cached;
  const state = environment.variables.map((): Value | undefined => undefined);
  emptyStates.set(environment, state);
  return state;
};

const getMissingVariables = (partial: State, environment: Environment) =>
  environment.variables.filter((_, index) => partial[index] === undefined);

const isComplete = (partial: State): partial is Value[] => {
  for (let index = 0; index < partial.length; index++) {
    if (partial[index] === undefined) return false;
  }
  return true;
};

export const isEnabled = (expression: Expression, context: Context): boolean => {
  const state = context.state;
  if (!state || !isComplete(state)) {
    throw new TlaEvaluationError(
      `ENABLED needs a complete state at ${describeLocation(expression)}`,
    );
  }
  const environment = context.environment;
  const found = { value: false };
  getRunner(expression, environment, false)(
    { environment, isInit: false, current: state },
    context.scope,
    getEmptyState(environment),
    undefined,
    false,
    () => {
      found.value = true;
    },
  );
  return found.value;
};

export const getInitialStates = (
  expression: Expression,
  environment: Environment,
  scope?: Scope,
): Value[][] => {
  const states: Value[][] = [];
  const run: Run = { environment, isInit: true, current: undefined };
  getRunner(expression, environment, true)(
    run,
    scope,
    getEmptyState(environment),
    undefined,
    false,
    (partial) => {
      if (!isComplete(partial)) {
        // TLC reports an initial state that isn't completely specified as an illegal state, not as
        // an evaluation failure.
        throw setExitCode(
          new TlaEvaluationError(
            `The initial predicate does not assign ${getMissingVariables(partial, environment).join(", ")}`,
          ),
          EXIT_STATUS.error,
        );
      }
      states.push(partial);
    },
  );
  return states;
};

export const getSuccessors = (
  expression: Expression,
  state: Value[],
  environment: Environment,
  scope?: Scope,
): Successor[] => {
  const successors: Successor[] = [];
  const run: Run = { environment, isInit: false, current: state };
  getRunner(expression, environment, false)(
    run,
    scope,
    getEmptyState(environment),
    undefined,
    false,
    (partial, action) => {
      if (!isComplete(partial)) {
        throw new TlaEvaluationError(
          `Successor state is not completely specified by action ${action ?? "Next"}. The following variables are not assigned: ${getMissingVariables(partial, environment).join(", ")}`,
        );
      }
      successors.push({ state: partial, action });
    },
  );
  return successors;
};
