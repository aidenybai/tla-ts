import {
  getChildren,
  isLocallyResolved,
  type Definition,
  type Expression,
  type QuantifierExpression,
} from "./ast";
import { getKindString } from "./builtins";
import { getReadVariables } from "./dependencies";
import {
  TlaEvaluationError,
  TlaIllegalStateError,
  TlaIncompleteSuccessorError,
  TlaUncodedError,
} from "./errors";
import { EXIT_STATUS, setExitCode } from "./exit-codes";
import {
  describeLocation,
  describeNode,
  describeRange,
  bindLazyArguments,
  bindDefinitions,
  bindOperatorArguments,
  bindPattern,
  bindValue,
  compileArgumentScope,
  evaluate,
  forEachBinding,
  getLazyFunction,
  toKeepLazyContext,
  getDefinition,
  getContextElements,
  getEntryEvaluator,
  getReevaluatedDefinitions,
  getStartupValue,
  lookupScope,
  mapBoundSets,
  resolveApplyOperator,
  resolveGlobalOperator,
  toUnspecifiedSubscriptError,
  type Context,
  type Environment,
  type Evaluator,
  type Scope,
  type State,
} from "./evaluate";
import { mapChildren } from "./instances";
import { CORE_OPERATORS } from "./standard-modules";
import { getRandomSubset, nextPrime, type JavaRandom } from "./tlc/random";
import {
  getEnabledFailure,
  isAssignedShortcut,
  LITERAL_KINDS,
  replayEnabled,
  warnChangedUnchanged,
} from "./tlc/replay";
import {
  formatValue,
  getStreamedElements,
  isEqualLikeTlc,
  isFunctionValue,
  isTlcEnumerable,
  type Value,
} from "./values";

export interface Successor {
  state: Value[];
  action: string | undefined;
}

interface Run {
  environment: Environment;
  isInit: boolean;
  isEnabled: boolean;
  current: Value[] | undefined;
  isStopped: boolean;
  generator: JavaRandom | undefined;
  successors: number;
  onUnsatisfied?: (state: Value[], conjunct: Expression) => void;
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
  | { kind: "Unchanged"; variables: UnchangedVariable[] }
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

const getComputation = (run: Run) =>
  run.isInit ? "initial states" : run.isEnabled ? "ENABLED" : "next states";

const createRunError = (run: Run, message: string) => {
  const error = new TlaEvaluationError(message);
  return run.isInit ? error : setExitCode(error, EXIT_STATUS.error);
};

const getNonBooleanMessage = (
  run: Run,
  value: Value,
  expression: Expression,
  isWalked: boolean,
) => {
  const node = describeNode(expression);
  if (isWalked && LITERAL_KINDS.has(expression.kind)) {
    return run.isEnabled
      ? `Attempted to compute ENABLED on a non-boolean expression.\n${node}`
      : `The ${run.isInit ? "init" : "next"} state relation is not a boolean expression.\n${node}`;
  }
  return `In computing ${getComputation(run)}, TLC expected a boolean expression,\nbut instead found ${formatValue(value)}.\n${node}`;
};

const getIfConditionMessage = (run: Run, value: Value, expression: Expression) => {
  const kind = getKindString(value);
  const range = describeRange(expression);
  if (run.isEnabled) {
    return `In computing ENABLED, a non-boolean expression(${kind}) was used as the guard condition of an IF.\n${range}`;
  }
  return `In computing ${getComputation(run)}, a non-boolean expression (${kind}) was used as the condition of an IF.${run.isInit ? "\n" : ""}${range}`;
};

const holds = (run: Run, expression: Expression, context: Context) =>
  holdsValue(run, expression, evaluate(expression, context));

const CORE_OPERATOR_NAMES = new Set(CORE_OPERATORS.map((operator) => operator.name));

const isBuiltInOperation = (expression: Expression) =>
  expression.kind === "Apply"
    ? CORE_OPERATOR_NAMES.has(expression.operator)
    : expression.kind !== "Identifier" && !LITERAL_KINDS.has(expression.kind);

const holdsValue = (run: Run, expression: Expression, value: Value, isWalked = true) => {
  if (typeof value === "boolean") return value;
  const message = getNonBooleanMessage(run, value, expression, isWalked);
  throw run.isInit && isWalked && isBuiltInOperation(expression)
    ? new TlaUncodedError(message)
    : createRunError(run, message);
};

const evaluateCached = (
  evaluators: (Evaluator | undefined)[],
  index: number,
  expression: Expression,
  context: Context,
) =>
  context.environment.callStack
    ? evaluate(expression, context)
    : (evaluators[index] ??= getEntryEvaluator(expression, context.environment))(context);

const isAssignmentOperator = (operator: string) =>
  operator === "=" || operator === "\\in" || operator === "\\subseteq";

const getRunner = (expression: Expression, environment: Environment, isInit: boolean): Runner => {
  const runners = isInit ? initRunners : nextRunners;
  const cached = runners.get(expression);
  if (cached) return cached;
  const deterministic = compileAction(expression, environment, isInit);
  const random = isInit ? undefined : compileRandomAction(expression, environment);
  const runner: Runner = random
    ? (run, scope, partial, action, isFixed, onComplete) =>
        (run.generator ? random : deterministic)(run, scope, partial, action, isFixed, onComplete)
    : deterministic;
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
  if (binding?.kind === "Thunk" && !binding.isReleased) {
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

interface UnchangedVariable {
  index: number;
  expression: Expression;
}

const getUnchangedVariables = (
  expression: Expression,
  environment: Environment,
  visited = new Set<string>(),
): UnchangedVariable[] | undefined => {
  if (expression.kind === "Tuple") {
    const variables = expression.elements.map((element) =>
      getUnchangedVariables(element, environment, visited),
    );
    return variables.every((item) => item !== undefined) ? variables.flat() : undefined;
  }
  if (expression.kind !== "Identifier" || visited.has(expression.name)) return undefined;
  const index = environment.variableIndex.get(expression.name);
  if (index !== undefined) return [{ index, expression }];
  const definition = getZeroArityBody(expression.name, environment);
  if (!definition) return undefined;
  visited.add(expression.name);
  return getUnchangedVariables(definition.body, environment, visited);
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

const getReadLocals = (
  expression: Expression,
  bound: ReadonlySet<string>,
): string[] | undefined => {
  if (isLocallyResolved(expression)) {
    if (expression.kind !== "Identifier") return undefined;
    return bound.has(expression.name) ? [] : [expression.name];
  }
  const names: string[] = [];
  let isReadOnly = true;
  mapChildren(expression, (child, childNames) => {
    const childLocals = isReadOnly
      ? getReadLocals(child, childNames.length === 0 ? bound : new Set([...bound, ...childNames]))
      : [];
    if (childLocals) names.push(...childLocals);
    else isReadOnly = false;
    return child;
  });
  return isReadOnly ? names : undefined;
};

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
    const variables = getUnchangedVariables(expression.expression, environment);
    if (variables) return { kind: "Unchanged", expression, variables };
  }
  if (isGuard(expression, environment, isInit)) return { kind: "Guard", expression };
  return { kind: "Branch", expression, runner: getRunner(expression, environment, isInit) };
};

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
  const evaluators: (Evaluator | undefined)[] = [];
  const restEvaluators: (Evaluator | undefined)[] = [];
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
    const isShortcut = isAssignedShortcut(run);
    for (let index = start; index < conjuncts.length; index++) {
      if (index > 0 && isShortcut && isComplete(current)) {
        context ??= getContext(run, scope, current);
        for (let rest = index; rest < conjuncts.length; rest++) {
          const conjunct = conjuncts[rest];
          const state = run.current;
          const changed =
            state && conjunct.kind === "Unchanged"
              ? conjunct.variables.find((variable) => {
                  const assigned = current[variable.index];
                  return assigned !== undefined && !isEqualLikeTlc(assigned, state[variable.index]);
                })
              : undefined;
          if (changed) {
            warnChangedUnchanged(run.environment, changed.index, changed.expression);
            return;
          }
          const expression = conjunct.expression;
          const value = evaluateCached(restEvaluators, rest, expression, context);
          if (!holdsValue(run, expression, value, false)) {
            run.onUnsatisfied?.(current, expression);
            return;
          }
        }
        onComplete(current, action);
        return;
      }
      const conjunct = conjuncts[index];
      if (conjunct.kind === "Guard") {
        context ??= getContext(run, scope, current);
        const value = evaluateCached(evaluators, index, conjunct.expression, context);
        if (!holdsValue(run, conjunct.expression, value)) return;
        continue;
      }
      if (conjunct.kind === "Assign") {
        context ??= getContext(run, scope, current);
        const value = evaluateCached(evaluators, index, conjunct.value, context);
        const assigned = current[conjunct.index];
        if (assigned === undefined) {
          current = assign(current, conjunct.index, value);
          context = undefined;
        } else if (!isEqualLikeTlc(assigned, value)) {
          return;
        }
        continue;
      }
      if (conjunct.kind === "Unchanged") {
        const state = run.current;
        if (!state) return;
        let unchanged: State | undefined;
        for (const variable of conjunct.variables) {
          const assigned = (unchanged ?? current)[variable.index];
          if (assigned === undefined) {
            unchanged ??= current.slice();
            unchanged[variable.index] = state[variable.index];
          } else if (!isEqualLikeTlc(assigned, state[variable.index])) {
            warnChangedUnchanged(run.environment, variable.index, variable.expression);
            return;
          }
        }
        if (unchanged) {
          current = unchanged;
          context = undefined;
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

const compileGuard = (expression: Expression): Runner => {
  const enabledFailure = getEnabledFailure(expression);
  return (run, scope, partial, action, _isFixed, onComplete) => {
    if (run.isEnabled && enabledFailure !== undefined) throw createRunError(run, enabledFailure);
    if (holds(run, expression, getContext(run, scope, partial))) onComplete(partial, action);
  };
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
      if (holds(run, expression, context)) onComplete(partial, action);
      return;
    }
    const evaluated = evaluate(set, context);
    const value: Value =
      expression.operator === "\\subseteq" ? { kind: "Subset", base: evaluated } : evaluated;
    if (!isTlcEnumerable(value)) {
      const message = run.isEnabled
        ? "The right side of \\IN is not enumerable."
        : `In computing ${getComputation(run)}, the right side of \\IN is not enumerable.`;
      throw createRunError(run, `${message}\n${describeRange(expression)}`);
    }
    const elements = getStreamedElements(value);
    if (run.generator) {
      for (const element of getRandomSubset(
        elements.length,
        value,
        run.environment.runtime.getRandom(),
        run.environment.runtime.version,
      )) {
        onComplete(assign(partial, index, element), action);
        if (run.successors > 0 || run.isStopped) return;
      }
    }
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

const compileFunctionAction = (
  expression: Expression & { kind: "FunctionApplication" },
  environment: Environment,
  isInit: boolean,
): Runner => {
  const node = describeRange(expression);
  return (run, scope, partial, action, isFixed, onComplete) => {
    const context = getContext(run, scope, partial);
    const value = evaluate(expression.function, isInit ? context : toKeepLazyContext(context));
    const lambda = getLazyFunction(value);
    if (lambda !== undefined) {
      getRunner(lambda.body, environment, isInit)(
        run,
        bindLazyArguments(lambda, expression, context),
        partial,
        action,
        isFixed,
        onComplete,
      );
      return;
    }
    if (!isFunctionValue(value)) {
      throw createRunError(
        run,
        `In computing ${getComputation(run)}, a non-function (${getKindString(value)}) was applied as a function.\n${node}`,
      );
    }
    const result = evaluate(expression, context);
    if (typeof result !== "boolean") {
      throw createRunError(
        run,
        `In computing ${getComputation(run)}, TLC expected a boolean expression,\nbut didn't find one.\n${node}`,
      );
    }
    if (result) onComplete(partial, action);
  };
};

const compileUnchanged = (expression: Expression, environment: Environment): Runner => {
  const unchanged = getUnchangedWrapper(expression);
  if (getUnchangedVariables(expression, environment))
    return compileConjunction([unchanged], environment, false);
  if (expression.kind === "Tuple") return getRunner(unchanged, environment, false);
  return (run, scope, partial, action, isFixed, onComplete) => {
    const binding =
      expression.kind === "Identifier" ? lookupScope(scope, expression.name) : undefined;
    if (binding?.kind === "Thunk" && !binding.isReleased) {
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
    const context = getContext(run, scope, partial);
    if (run.isEnabled && expression.kind === "Apply") {
      const operator = resolveApplyOperator(expression, context);
      if (operator?.kind === "Closure" && operator.params.length === expression.args.length) {
        getRunner(getUnchangedWrapper(operator.body), environment, false)(
          run,
          bindOperatorArguments(operator, expression.args, context),
          partial,
          action,
          isFixed,
          onComplete,
        );
        return;
      }
    }
    if (holds(run, unchanged, context)) onComplete(partial, action);
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
    let bodyRunner: Runner | undefined;
    return (run, scope, partial, action, isFixed, onComplete) => {
      bodyRunner ??= getRunner(global.body, environment, isInit);
      bodyRunner(
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
  let bodyRunner: Runner | undefined;
  return (run, scope, partial, action, isFixed, onComplete) => {
    const binding = lookupScope(scope, expression.name);
    if (binding?.kind === "Thunk" && !binding.isReleased) {
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
    if (
      binding ||
      !definition ||
      (expression.location.range && getStartupValue(definition, environment) !== undefined)
    ) {
      guard(run, scope, partial, action, isFixed, onComplete);
      return;
    }
    bodyRunner ??= getRunner(definition.body, environment, isInit);
    bodyRunner(run, undefined, partial, isFixed ? action : definition.name, isFixed, onComplete);
  };
};

interface LabelGuard {
  variable: number;
  argument: string;
  labels: Set<string>;
  before: ((run: Run, scope: Scope | undefined, partial: State) => void) | undefined;
}

const toLabelGuard = (expression: Expression, environment: Environment) => {
  if (expression.kind !== "Apply" || expression.operator !== "=" || isLocallyResolved(expression)) {
    return undefined;
  }
  const target = expression.args[0];
  const label = expression.args[1];
  if (target.kind !== "FunctionApplication" || label.kind !== "String") return undefined;
  const argument = target.args.length === 1 ? target.args[0] : undefined;
  if (argument?.kind !== "Identifier" || !isLocallyResolved(argument)) return undefined;
  const variable = getStaticVariableIndex(target.function, environment, false);
  if (variable === undefined) return undefined;
  return { variable, argument: argument.name, labels: new Set([label.value]) };
};

const getConjuncts = (expression: Expression): Expression[] =>
  expression.kind === "And" ? expression.operands.flatMap(getConjuncts) : [expression];

const isLeadingGuard = (expression: Expression, environment: Environment) =>
  (expression.kind === "Identifier" ||
    (expression.kind === "Apply" &&
      (expression.operator === "=" || expression.operator === "#"))) &&
  isGuard(expression, environment, false);

const compileLeadingGuards = (guards: Expression[]) => {
  const evaluators: (Evaluator | undefined)[] = [];
  return (run: Run, scope: Scope | undefined, partial: State) => {
    const context = getContext(run, scope, partial);
    for (let index = 0; index < guards.length; index++) {
      const guard = guards[index];
      if (!holdsValue(run, guard, evaluateCached(evaluators, index, guard, context))) return;
    }
  };
};

const getLabelGuard = (
  expression: Expression,
  environment: Environment,
  visited: Set<Expression>,
): LabelGuard | undefined => {
  if (visited.has(expression)) return undefined;
  visited.add(expression);
  if (expression.kind === "And") {
    const conjuncts = getConjuncts(expression);
    const position = conjuncts.findIndex(
      (conjunct) => !isLeadingGuard(conjunct, environment) || toLabelGuard(conjunct, environment),
    );
    const guard = position === -1 ? undefined : toLabelGuard(conjuncts[position], environment);
    if (!guard) return undefined;
    return {
      ...guard,
      before: position === 0 ? undefined : compileLeadingGuards(conjuncts.slice(0, position)),
    };
  }
  if (expression.kind === "Or") {
    const guards = expression.operands.map((operand) =>
      getLabelGuard(operand, environment, visited),
    );
    const first = guards[0];
    const isShared = guards.every(
      (guard) =>
        guard !== undefined &&
        guard.before === undefined &&
        guard.variable === first?.variable &&
        guard.argument === first.argument,
    );
    if (!first || !isShared) return undefined;
    const labels = new Set(guards.flatMap((guard) => [...(guard?.labels ?? [])]));
    return { variable: first.variable, argument: first.argument, labels, before: undefined };
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
  const before = guard.before;
  const bindArguments = before && compileArgumentScope(closure, expression.args, environment);
  return {
    variable: guard.variable,
    argument: argument.name,
    labels: guard.labels,
    before:
      before &&
      bindArguments &&
      ((run, scope, partial) =>
        before(run, bindArguments(getContext(run, scope, partial)), partial)),
  };
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
  const dispatched = guards.map((guard) =>
    guard?.variable === dispatch?.variable && guard?.argument === dispatch?.argument
      ? guard
      : undefined,
  );
  return (run, scope, partial, action, isFixed, onComplete) => {
    const label = dispatch && getLabel(run, scope, dispatch);
    for (let index = 0; index < runners.length && !run.isStopped; index++) {
      const guard = dispatched[index];
      if (label !== undefined && guard?.labels.has(label) === false) {
        guard.before?.(run, scope, partial);
        continue;
      }
      runners[index](run, scope, partial, action, isFixed, onComplete);
    }
  };
};

const compileRandomChoice =
  (choices: Runner[]): Runner =>
  (run, scope, partial, action, isFixed, onComplete) => {
    const generator = run.generator;
    if (!generator) throw new Error("A random choice needs the run's generator");
    const start = Math.floor(generator.nextDouble() * choices.length);
    const prime = nextPrime(generator);
    for (let attempt = 0; attempt < choices.length; attempt++) {
      choices[(start + attempt * prime) % choices.length](
        run,
        scope,
        partial,
        action,
        isFixed,
        onComplete,
      );
      if (run.successors > 0 || run.isStopped) return;
    }
  };

const compileRandomExists = (
  expression: QuantifierExpression,
  environment: Environment,
): Runner => {
  const body = getRunner(expression.body, environment, false);
  return (run, scope, partial, action, isFixed, onComplete) => {
    const context = getContext(run, scope, partial);
    const version = environment.runtime.version;
    const orders = mapBoundSets(expression.bounds, (set) => evaluate(set, context)).map(
      (set, index) =>
        getRandomSubset(
          getContextElements(set, expression.bounds[index].set, version).length,
          set,
          environment.runtime.getRandom(),
          version,
        ),
    );
    const visit = (position: number, boundScope: Scope | undefined): boolean => {
      if (position < 0) {
        body(run, boundScope, partial, action, isFixed, onComplete);
        return run.successors > 0 || run.isStopped;
      }
      const pattern = expression.bounds[position].pattern;
      return orders[position].some((element) =>
        visit(position - 1, bindPattern(boundScope, pattern, element)),
      );
    };
    visit(orders.length - 1, scope);
  };
};

const compileRandomAction = (expression: Expression, environment: Environment) => {
  if (expression.kind === "Exists") return compileRandomExists(expression, environment);
  if (expression.kind !== "Or") return undefined;
  const runners = expression.operands.map((operand) => getRunner(operand, environment, false));
  return expression.isBulleted
    ? compileRandomChoice(runners)
    : runners.reduce((left, right) => compileRandomChoice([left, right]));
};

const compileAction = (
  expression: Expression,
  environment: Environment,
  isInit: boolean,
): Runner => {
  const getChildRunner = (node: Expression) => getRunner(node, environment, isInit);
  switch (expression.kind) {
    case "And":
      return compileConjunction(expression.operands, environment, isInit);
    case "Or":
      return compileDisjunction(expression.operands, environment, isInit);
    case "Exists": {
      const body = getChildRunner(expression.body);
      const bound = expression.bounds[0];
      if (expression.bounds.length === 1 && bound.pattern.kind === "Name") {
        const name = bound.pattern.name;
        return (run, scope, partial, action, isFixed, onComplete) => {
          const elements = getContextElements(
            evaluate(bound.set, getContext(run, scope, partial)),
            bound.set,
            environment.runtime.version,
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
          const sets = mapBoundSets(expression.bounds, (set) =>
            getContextElements(evaluate(set, context), set, environment.runtime.version),
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
                if (!hoisted.guards.every((guard) => holds(run, guard, guardContext))) continue;
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
      const body = getChildRunner(expression.body);
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
            holds(run, expression.body, getContext(run, boundScope, partial)),
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
                holds(run, expression.body, getContext(run, boundScope, nextPartial)),
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
      const consequent = getChildRunner(expression.consequent);
      const alternative = getChildRunner(expression.alternative);
      return (run, scope, partial, action, isFixed, onComplete) => {
        const condition = evaluate(expression.condition, getContext(run, scope, partial));
        if (typeof condition !== "boolean") {
          throw createRunError(run, getIfConditionMessage(run, condition, expression));
        }
        const branch = condition ? consequent : alternative;
        branch(run, scope, partial, action, isFixed, onComplete);
      };
    }
    case "Case": {
      const arms = expression.arms.map((arm) => ({
        condition: arm.condition,
        source: arm.body,
        body: getChildRunner(arm.body),
      }));
      const other = expression.other ? getChildRunner(expression.other) : undefined;
      return (run, scope, partial, action, isFixed, onComplete) => {
        const context = getContext(run, scope, partial);
        const arm = arms.find((candidate) => {
          const value = evaluate(candidate.condition, context);
          if (typeof value === "boolean") return value;
          throw createRunError(
            run,
            `In computing ${getComputation(run)}, a non-boolean expression${run.isEnabled ? "" : " "}(${getKindString(value)}) was used as a guard condition of a CASE.\n${describeNode(candidate.source)}`,
          );
        });
        const body = arm?.body ?? other;
        if (!body) {
          throw createRunError(
            run,
            `In computing ${getComputation(run)}, TLC encountered a CASE with no conditions true.\n${describeRange(expression)}`,
          );
        }
        body(run, scope, partial, action, isFixed, onComplete);
      };
    }
    case "Let": {
      const body = getChildRunner(expression.body);
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
      const body = getChildRunner(expression.action);
      const unchanged: Expression = {
        kind: "Unchanged",
        expression: expression.subscript,
        location: expression.subscript.location,
      };
      const isUnchanged = (run: Run, scope: Scope | undefined, nextPartial: State) => {
        try {
          return holds(run, unchanged, getContext(run, scope, nextPartial));
        } catch (error) {
          throw run.isEnabled
            ? toUnspecifiedSubscriptError(error, environment.runtime.version)
            : error;
        }
      };
      return (run, scope, partial, action, isFixed, onComplete) =>
        body(run, scope, partial, action, isFixed, (nextPartial, nextAction) => {
          if (!isUnchanged(run, scope, nextPartial)) onComplete(nextPartial, nextAction);
        });
    }
    case "BoxAction":
      return compileDisjunction(
        [expression.action, getUnchangedWrapper(expression.subscript)],
        environment,
        isInit,
      );
    case "Label":
      return getChildRunner(expression.body);
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
        const right = getChildRunner(args[1]);
        return (run, scope, partial, action, isFixed, onComplete) => {
          const condition = evaluate(args[0], getContext(run, scope, partial));
          if (typeof condition !== "boolean") {
            const kind = getKindString(condition);
            const range = describeRange(expression);
            throw createRunError(
              run,
              run.isInit
                ? `In computing initial states of a predicate of form P => Q, P was ${kind}\n.${range}`
                : run.isEnabled
                  ? `While computing ENABLED of an expression of the form P => Q, P was ${kind}.\n${range}`
                  : `In computing next states of a predicate of the form P => Q, P was\n${kind}.\n${range}`,
            );
          }
          if (!condition) {
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

const getEmptyState = (environment: Environment): State =>
  environment.variables.map((): Value | undefined => undefined);

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
  if (environment.callStack) return replayEnabled(expression, context.scope, state, environment);
  const run: Run = {
    environment,
    isInit: false,
    isEnabled: true,
    current: state,
    isStopped: false,
    generator: undefined,
    successors: 0,
  };
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
  onIncomplete?: (state: State) => boolean,
) => {
  const run: Run = {
    environment,
    isInit: true,
    isEnabled: false,
    current: undefined,
    isStopped: false,
    generator: undefined,
    successors: 0,
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
        if (onIncomplete) {
          run.isStopped = onIncomplete([...partial]);
          return;
        }
        throw setExitCode(new TlaIllegalStateError([...partial]), EXIT_STATUS.error);
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
  generator?: JavaRandom,
  onUnsatisfied?: Run["onUnsatisfied"],
) => {
  const run: Run = {
    environment,
    isInit: false,
    isEnabled: false,
    current: state,
    isStopped: false,
    generator,
    successors: 0,
    onUnsatisfied,
  };
  getRunner(expression, environment, false)(
    run,
    scope,
    getEmptyState(environment),
    undefined,
    false,
    (partial, action) => {
      if (run.isStopped) return;
      if (!isComplete(partial)) {
        const missing = environment.variables.filter(
          (_name, index) => partial[index] === undefined,
        );
        throw new TlaIncompleteSuccessorError(
          `Successor state is not completely specified by action ${action ?? "Next"}. The following variables are not assigned: ${missing.join(", ")}`,
          partial,
          action,
          missing,
        );
      }
      run.successors++;
      run.isStopped = onSuccessor({ state: partial, action });
    },
  );
  return run.successors;
};

export const hasIncompleteSuccessor = (
  expression: Expression,
  state: Value[],
  environment: Environment,
  scope?: Scope,
) => {
  const run: Run = {
    environment,
    isInit: false,
    isEnabled: false,
    current: state,
    isStopped: false,
    generator: undefined,
    successors: 0,
  };
  getRunner(expression, environment, false)(
    run,
    scope,
    getEmptyState(environment),
    undefined,
    false,
    (partial) => {
      if (!isComplete(partial)) run.isStopped = true;
    },
  );
  return run.isStopped;
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
