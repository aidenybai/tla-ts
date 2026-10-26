import type { Expression } from "./ast";
import { TlaEvaluationError } from "./errors";
import {
  bindDefinitions,
  bindOperatorArguments,
  bindValue,
  compileArgumentScope,
  evaluate,
  expectBoolean,
  forEachBinding,
  lookupScope,
  resolveApplyOperator,
  resolveGlobalOperator,
  type Context,
  type Environment,
  type Scope,
  type State,
} from "./evaluate";
import { formatValue, isEnumerable, toFiniteSet, valuesEqual, type Value } from "./values";

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

type Conjunct =
  | { kind: "Guard"; expression: Expression }
  | { kind: "Assign"; index: number; value: Expression }
  | { kind: "Unchanged"; indices: number[] }
  | { kind: "Branch"; runner: Runner };

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
  return expectBoolean(value, `the action at ${describeLocation(expression)}`);
};

const getRunner = (expression: Expression, environment: Environment, isInit: boolean): Runner => {
  const runners = isInit ? initRunners : nextRunners;
  const cached = runners.get(expression);
  if (cached) return cached;
  const runner = compileAction(expression, environment, isInit);
  runners.set(expression, runner);
  return runner;
};

const getVariableIndex = (expression: Expression, environment: Environment) =>
  expression.kind === "Identifier" ? environment.variableIndex.get(expression.name) : undefined;

const getAssignableIndex = (target: Expression, environment: Environment, isInit: boolean) => {
  if (isInit) return getVariableIndex(target, environment);
  return target.kind === "Prime" ? getVariableIndex(target.expression, environment) : undefined;
};

const getZeroArityBody = (name: string, environment: Environment) => {
  if (environment.constants.has(name)) return undefined;
  const definition = environment.definitions.get(environment.substitutions.get(name) ?? name);
  return definition?.kind === "Operator" && definition.params.length === 0 ? definition : undefined;
};

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
  "And",
  "Or",
  "Exists",
  "Forall",
  "If",
  "Case",
  "Let",
  "Unchanged",
  "BoxAction",
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
  if (expression.operator === "=" || expression.operator === "\\in") {
    if (getAssignableIndex(expression.args[0], environment, isInit) !== undefined) return false;
  }
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
    if (index !== undefined) return { kind: "Assign", index, value: expression.args[1] };
  }
  if (!isInit && expression.kind === "Unchanged") {
    const indices = getUnchangedIndices(expression.expression, environment);
    if (indices) return { kind: "Unchanged", indices };
  }
  if (isGuard(expression, environment, isInit)) return { kind: "Guard", expression };
  return { kind: "Branch", runner: getRunner(expression, environment, isInit) };
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

const compileGuard =
  (expression: Expression): Runner =>
  (run, scope, partial, action, _isFixed, onComplete) => {
    if (holds(expression, getContext(run, scope, partial))) onComplete(partial, action);
  };

const compileMembership = (expression: Expression & { kind: "Apply" }, index: number): Runner => {
  const set = expression.args[1];
  return (run, scope, partial, action, _isFixed, onComplete) => {
    const context = getContext(run, scope, partial);
    if (partial[index] !== undefined) {
      if (holds(expression, context)) onComplete(partial, action);
      return;
    }
    const value = evaluate(set, context);
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
  const global = resolveGlobalOperator(name, environment);
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
  const definition = getZeroArityBody(expression.name, environment);
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
        const scopes: (Scope | undefined)[] = [];
        forEachBinding(expression.bounds, getContext(run, scope, partial), (boundScope) => {
          scopes.push(boundScope);
          return false;
        });
        const visit = (index: number, nextPartial: State, nextAction: string | undefined): void => {
          if (index === scopes.length) {
            onComplete(nextPartial, nextAction);
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
    case "Identifier":
      return compileIdentifier(expression, environment, isInit);
    case "Apply": {
      const args = expression.args;
      if (expression.operator === "=" || expression.operator === "\\in") {
        const index = getAssignableIndex(args[0], environment, isInit);
        if (index !== undefined) {
          if (expression.operator === "\\in") return compileMembership(expression, index);
          return compileConjunction([expression], environment, isInit);
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

export const getInitialStates = (expression: Expression, environment: Environment): Value[][] => {
  const states: Value[][] = [];
  const run: Run = { environment, isInit: true, current: undefined };
  getRunner(expression, environment, true)(
    run,
    undefined,
    getEmptyState(environment),
    undefined,
    false,
    (partial) => {
      if (!isComplete(partial)) {
        throw new TlaEvaluationError(
          `The initial predicate does not assign ${getMissingVariables(partial, environment).join(", ")}`,
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
): Successor[] => {
  const successors: Successor[] = [];
  const run: Run = { environment, isInit: false, current: state };
  getRunner(expression, environment, false)(
    run,
    undefined,
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
