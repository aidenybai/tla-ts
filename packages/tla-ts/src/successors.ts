import {
  getChildren,
  isLocallyResolved,
  type Bound,
  type Definition,
  type Expression,
  type QuantifierExpression,
} from "./ast";
import { getReadVariables } from "./dependencies";
import { TlaEvaluationError, TlaIncompleteSuccessorError, UNEXPECTED_EXCEPTION } from "./errors";
import { EXIT_STATUS, setExitCode } from "./exit-codes";
import {
  describeLocation,
  describeRange,
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
  getEnumeratedElements,
  getReevaluatedDefinitions,
  lookupScope,
  resolveApplyOperator,
  resolveGlobalOperator,
  toUnspecifiedSubscriptError,
  type Context,
  type Environment,
  type Scope,
  type State,
} from "./evaluate";
import { mapChildren } from "./instances";
import { replayEnabled } from "./tlc-replay";
import {
  createTuple,
  formatValue,
  getStreamedElements,
  isElementOf,
  isEnumerable,
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
  // Whether the run computes ENABLED rather than the successors of the state.
  isEnabled: boolean;
  current: Value[] | undefined;
  isStopped: boolean;
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

const getContext = (run: Run, scope: Scope | undefined, partial: State) =>
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

const isGuard = (expression: Expression, environment: Environment, isInit: boolean) => {
  if (ACTION_KINDS.has(expression.kind)) return false;
  if (expression.kind === "Identifier") {
    return (
      environment.variableIndex.has(expression.name) || environment.constants.has(expression.name)
    );
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

const NO_NAMES: ReadonlySet<string> = new Set();

// The local names an expression reads from enclosing scopes, or undefined when it applies a local
// operator, whose body may assign variables.
const getReadLocals = (
  expression: Expression,
  bound: ReadonlySet<string>,
): string[] | undefined => {
  if (isLocallyResolved(expression)) {
    if (expression.kind !== "Identifier") return undefined;
    return bound.has(expression.name) ? [] : [expression.name];
  }
  const names: string[] = [];
  const result = { isReadOnly: true };
  mapChildren(expression, (child, childNames) => {
    const childLocals = result.isReadOnly
      ? getReadLocals(child, childNames.length === 0 ? bound : new Set([...bound, ...childNames]))
      : [];
    if (childLocals) names.push(...childLocals);
    else result.isReadOnly = false;
    return child;
  });
  return result.isReadOnly ? names : undefined;
};

// TLC generates a successor for every disjunct and witness that holds, so an expression only
// checks like a guard when it has neither.
const hasBranches = (
  expression: Expression,
  environment: Environment,
  visited: Set<Definition>,
): boolean => {
  if (expression.kind === "Or" || expression.kind === "Exists") return true;
  const name =
    expression.kind === "Identifier"
      ? expression.name
      : expression.kind === "Apply"
        ? expression.operator
        : undefined;
  const definition =
    name === undefined || isLocallyResolved(expression)
      ? undefined
      : getDefinition(name, environment);
  if (definition && !visited.has(definition)) {
    visited.add(definition);
    if (hasBranches(definition.body, environment, visited)) return true;
  }
  return getChildren(expression).some((child) => hasBranches(child, environment, visited));
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

// The leading guards of `\E x \in S, y \in T : P /\ Q` that read no inner bound hold for every inner
// binding alike, so they can run once for each element of the outermost bound.
const getHoistedGuards = (expression: QuantifierExpression, environment: Environment) => {
  if (expression.bounds.length < 2 || expression.body.kind !== "And") return undefined;
  const names = expression.bounds.flatMap((bound) =>
    bound.pattern.kind === "Name" ? [bound.pattern.name] : [],
  );
  if (names.length !== expression.bounds.length) return undefined;
  const innerNames = new Set(names.slice(0, -1));
  const operands = expression.body.operands;
  const index = operands.findIndex((operand) => {
    if (getReadVariables(operand, environment) === undefined) return true;
    if (hasBranches(operand, environment, new Set())) return true;
    const readLocals = getReadLocals(operand, NO_NAMES);
    return !readLocals || readLocals.some((name) => innerNames.has(name));
  });
  const count = index === -1 ? operands.length : index;
  if (count === 0) return undefined;
  return { names, guards: operands.slice(0, count), rest: operands.slice(count) };
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
    // Once every variable has a value, TLC's getInitStates and getNextStatesAllAssigned evaluate
    // the conjuncts left instead of walking them, so a disjunction among them takes one step. Its
    // enabled doesn't, and Tool#getNextStates0 takes this shortcut only with warnings on.
    const isShortcut = !run.isEnabled && (run.isInit || run.environment.runtime.isWarningEnabled);
    for (let index = start; index < conjuncts.length; index++) {
      if (index > 0 && isShortcut && isComplete(current)) {
        context ??= getContext(run, scope, current);
        const isTrue = run.isInit ? holdsInInit : holds;
        for (let rest = index; rest < conjuncts.length; rest++) {
          if (!isTrue(conjuncts[rest].expression, context)) return;
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
    const elements = getStreamedElements(value);
    for (let position = 0; position < elements.length && !run.isStopped; position++) {
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

// A PlusCal action starts with a guard such as pc[self] = "L1", and a process is a disjunction of
// its actions. The labels an expression requires of one variable at one bound name let a
// disjunction skip the operands whose guard is false without evaluating them.
interface LabelGuard {
  variable: number;
  argument: string;
  labels: Set<string>;
}

const getLabelGuard = (
  expression: Expression,
  environment: Environment,
  visited: Set<Expression>,
): LabelGuard | undefined => {
  if (visited.has(expression)) return undefined;
  visited.add(expression);
  if (expression.kind === "And") {
    const first = expression.operands[0];
    if (first.kind !== "Apply" || first.operator !== "=" || isLocallyResolved(first)) {
      return undefined;
    }
    const target = first.args[0];
    const label = first.args[1];
    if (target.kind !== "FunctionApplication" || label.kind !== "String") return undefined;
    const argument = target.args.length === 1 ? target.args[0] : undefined;
    if (argument?.kind !== "Identifier" || !isLocallyResolved(argument)) return undefined;
    const variable = getStaticVariableIndex(target.function, environment, false);
    if (variable === undefined) return undefined;
    return { variable, argument: argument.name, labels: new Set([label.value]) };
  }
  if (expression.kind === "Or") {
    const guards = expression.operands.map((operand) =>
      getLabelGuard(operand, environment, visited),
    );
    const first = guards[0];
    const isShared = guards.every(
      (guard) =>
        guard !== undefined &&
        guard.variable === first?.variable &&
        guard.argument === first.argument,
    );
    if (!first || !isShared) return undefined;
    const labels = new Set(guards.flatMap((guard) => [...(guard?.labels ?? [])]));
    return { variable: first.variable, argument: first.argument, labels };
  }
  if (expression.kind !== "Apply" || isLocallyResolved(expression)) return undefined;
  const closure = resolveGlobalOperator(expression.operator, environment);
  if (closure?.kind !== "Closure" || closure.scope !== undefined) return undefined;
  const guard = getLabelGuard(closure.body, environment, visited);
  const position = closure.params.findIndex(
    (param) => param.arity === 0 && param.name === guard?.argument,
  );
  const argument = expression.args[position];
  if (!guard || argument?.kind !== "Identifier" || !isLocallyResolved(argument)) {
    return undefined;
  }
  return { variable: guard.variable, argument: argument.name, labels: guard.labels };
};

const getLabel = (run: Run, scope: Scope | undefined, guard: LabelGuard) => {
  const binding = lookupScope(scope, guard.argument);
  const functionValue = run.current?.[guard.variable];
  if (
    binding?.kind !== "Value" ||
    typeof functionValue !== "object" ||
    functionValue.kind !== "Function"
  ) {
    return undefined;
  }
  const position = functionValue.domain.indexOf(binding.value);
  const label = position === -1 ? undefined : functionValue.range[position];
  return typeof label === "string" ? label : undefined;
};

const compileDisjunction = (
  operands: Expression[],
  environment: Environment,
  isInit: boolean,
): Runner => {
  const runners = operands.map((operand) => getRunner(operand, environment, isInit));
  const guards = isInit
    ? []
    : operands.map((operand) => getLabelGuard(operand, environment, new Set()));
  const dispatch = guards.find((guard) => guard !== undefined);
  const labels = guards.map((guard) =>
    guard?.variable === dispatch?.variable && guard?.argument === dispatch?.argument
      ? guard?.labels
      : undefined,
  );
  return (run, scope, partial, action, isFixed, onComplete) => {
    const label = dispatch && getLabel(run, scope, dispatch);
    for (let index = 0; index < runners.length && !run.isStopped; index++) {
      if (label !== undefined && labels[index]?.has(label) === false) continue;
      runners[index](run, scope, partial, action, isFixed, onComplete);
    }
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
    case "Or":
      return compileDisjunction(expression.operands, environment, isInit);
    case "Exists": {
      const body = child(expression.body);
      const bound = expression.bounds[0];
      if (expression.bounds.length === 1 && bound.pattern.kind === "Name") {
        const name = bound.pattern.name;
        return (run, scope, partial, action, isFixed, onComplete) => {
          const elements = getEnumeratedElements(
            evaluate(bound.set, getContext(run, scope, partial)),
            bound.set,
          );
          for (let index = 0; index < elements.length && !run.isStopped; index++) {
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
      const hoisted = isInit ? undefined : getHoistedGuards(expression, environment);
      if (hoisted) {
        const rest = compileConjunction(hoisted.rest, environment, isInit);
        return (run, scope, partial, action, isFixed, onComplete) => {
          const context = getContext(run, scope, partial);
          const sets = expression.bounds.map((innerBound) =>
            getEnumeratedElements(evaluate(innerBound.set, context), innerBound.set),
          );
          if (sets.some((elements) => elements.length === 0)) return;
          const visit = (index: number, boundScope: Scope | undefined): void => {
            if (index < 0) {
              rest(run, boundScope, partial, action, isFixed, onComplete);
              return;
            }
            for (const element of sets[index]) {
              if (run.isStopped) return;
              const elementScope = bindValue(boundScope, hoisted.names[index], element);
              if (index === sets.length - 1) {
                const guardContext = getContext(run, elementScope, partial);
                if (!hoisted.guards.every((guard) => holds(guard, guardContext))) continue;
              }
              visit(index - 1, elementScope);
            }
          };
          visit(sets.length - 1, scope);
        };
      }
      return (run, scope, partial, action, isFixed, onComplete) => {
        forEachBinding(expression.bounds, getContext(run, scope, partial), (boundScope) => {
          body(run, boundScope, partial, action, isFixed, onComplete);
          return run.isStopped;
        });
      };
    }
    case "Forall": {
      const body = child(expression.body);
      const readLocals =
        !isInit &&
        getReadVariables(expression, environment) !== undefined &&
        !hasBranches(expression.body, environment, new Set())
          ? getReadLocals(expression, NO_NAMES)
          : undefined;
      return (run, scope, partial, action, _isFixed, onComplete) => {
        const boundScopes: (Scope | undefined)[] = [];
        forEachBinding(expression.bounds, getContext(run, scope, partial), (boundScope) => {
          boundScopes.push(boundScope);
          return false;
        });
        const scopes = [...boundScopes.slice(0, 1), ...boundScopes.slice(1).reverse()];
        const isBoundToValues = readLocals?.every(
          (name) => lookupScope(scope, name)?.kind === "Value",
        );
        if (isBoundToValues) {
          const isSatisfied = scopes.every((boundScope) =>
            holds(expression.body, getContext(run, boundScope, partial)),
          );
          if (isSatisfied) onComplete(partial, action);
          return;
        }
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
          throw new TlaEvaluationError(
            `${UNEXPECTED_EXCEPTION}In computing next states, TLC encountered a CASE with no conditions true.\n${describeRange(expression)}`,
          );
        body(run, scope, partial, action, isFixed, onComplete);
      };
    }
    case "Let": {
      const body = child(expression.body);
      const reevaluated = getReevaluatedDefinitions(expression.definitions, environment);
      return (run, scope, partial, action, isFixed, onComplete) =>
        body(
          run,
          bindDefinitions(expression.definitions, getContext(run, scope, partial), reevaluated),
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
      const isUnchanged = (run: Run, scope: Scope | undefined, nextPartial: State) => {
        try {
          return holds(unchanged, getContext(run, scope, nextPartial));
        } catch (error) {
          throw run.isEnabled ? toUnspecifiedSubscriptError(error) : error;
        }
      };
      return (run, scope, partial, action, isFixed, onComplete) =>
        body(run, scope, partial, action, isFixed, (nextPartial, nextAction) => {
          if (!isUnchanged(run, scope, nextPartial)) onComplete(nextPartial, nextAction);
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
  // TLC computes ENABLED again with its call stack recorded as it computes successors.
  if (environment.callStack) return replayEnabled(expression, context.scope, state, environment);
  const run: Run = {
    environment,
    isInit: false,
    isEnabled: true,
    current: state,
    isStopped: false,
  };
  // TLC stops computing ENABLED at the first successor, so it skips the rest of the action.
  getRunner(expression, environment, false)(
    run,
    context.scope,
    getEmptyState(environment),
    undefined,
    false,
    () => {
      run.isStopped = true;
    },
  );
  return run.isStopped;
};

export const forEachInitialState = (
  expression: Expression,
  environment: Environment,
  onState: (state: Value[]) => boolean,
  scope?: Scope,
) => {
  const run: Run = {
    environment,
    isInit: true,
    isEnabled: false,
    current: undefined,
    isStopped: false,
  };
  getRunner(expression, environment, true)(
    run,
    scope,
    getEmptyState(environment),
    undefined,
    false,
    (partial) => {
      if (run.isStopped) return;
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
      run.isStopped = onState(partial);
    },
  );
};

export const getInitialStates = (
  expression: Expression,
  environment: Environment,
  scope?: Scope,
): Value[][] => {
  const states: Value[][] = [];
  forEachInitialState(
    expression,
    environment,
    (state) => {
      states.push(state);
      return false;
    },
    scope,
  );
  return states;
};

export const forEachSuccessor = (
  expression: Expression,
  state: Value[],
  environment: Environment,
  onSuccessor: (successor: Successor) => boolean,
  scope?: Scope,
) => {
  const run: Run = {
    environment,
    isInit: false,
    isEnabled: false,
    current: state,
    isStopped: false,
  };
  const counter = { successors: 0 };
  getRunner(expression, environment, false)(
    run,
    scope,
    getEmptyState(environment),
    undefined,
    false,
    (partial, action) => {
      if (run.isStopped) return;
      if (!isComplete(partial)) {
        const missing = getMissingVariables(partial, environment);
        throw new TlaIncompleteSuccessorError(
          `Successor state is not completely specified by action ${action ?? "Next"}. The following variables are not assigned: ${missing.join(", ")}`,
          partial,
          action,
          missing,
        );
      }
      counter.successors++;
      run.isStopped = onSuccessor({ state: partial, action });
    },
  );
  return counter.successors;
};

export const getSuccessors = (
  expression: Expression,
  state: Value[],
  environment: Environment,
  scope?: Scope,
): Successor[] => {
  const successors: Successor[] = [];
  forEachSuccessor(
    expression,
    state,
    environment,
    (successor) => {
      successors.push(successor);
      return false;
    },
    scope,
  );
  return successors;
};
