import type { Bound, Expression } from "./ast";
import { TlaEvaluationError } from "./errors";
import {
  bindArgument,
  bindDefinitions,
  bindOperatorArguments,
  bindValue,
  evaluate,
  expectBoolean,
  forEachBinding,
  getBoundsDomain,
  getDefinition,
  lookupScope,
  resolveApplyOperator,
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

interface Label {
  name: string | undefined;
  isFixed: boolean;
}

interface Exploration {
  environment: Environment;
  isInit: boolean;
  current: Value[] | undefined;
}

interface FunctionLambda {
  bounds: Bound[];
  body: Expression;
  scope: Scope | undefined;
}

type Continuation = (partial: State, label: Label) => void;

const getContext = (exploration: Exploration, scope: Scope | undefined, partial: State): Context =>
  exploration.isInit
    ? { environment: exploration.environment, scope, state: partial, next: undefined }
    : { environment: exploration.environment, scope, state: exploration.current, next: partial };

const nameAction = (label: Label, name: string): Label =>
  label.isFixed ? label : { name, isFixed: false };

const fixLabel = (label: Label): Label => (label.isFixed ? label : { ...label, isFixed: true });

const assign = (partial: State, index: number, value: Value) => {
  const copy = [...partial];
  copy[index] = value;
  return copy;
};

const getVariableIndex = (
  expression: Expression,
  scope: Scope | undefined,
  partial: State,
  exploration: Exploration,
  isPrimed: boolean,
): number | undefined => {
  if (expression.kind === "Prime" && isPrimed)
    return getVariableIndex(expression.expression, scope, partial, exploration, false);
  if (expression.kind === "Let") {
    const letScope = bindDefinitions(
      expression.definitions,
      getContext(exploration, scope, partial),
    );
    return getVariableIndex(expression.body, letScope, partial, exploration, isPrimed);
  }
  if (expression.kind !== "Identifier") return undefined;
  const binding = lookupScope(scope, expression.name);
  if (binding?.kind === "Thunk")
    return getVariableIndex(binding.expression, binding.scope, partial, exploration, isPrimed);
  if (binding) return undefined;
  const environment = exploration.environment;
  const index = environment.variableIndex.get(expression.name);
  if (index !== undefined) return isPrimed ? undefined : index;
  const definition = getDefinition(expression.name, environment);
  if (
    definition?.kind !== "Operator" ||
    definition.params.length > 0 ||
    environment.constants.has(expression.name)
  )
    return undefined;
  return getVariableIndex(definition.body, undefined, partial, exploration, isPrimed);
};

const getFunctionLambda = (
  expression: Expression,
  scope: Scope | undefined,
  partial: State,
  exploration: Exploration,
): FunctionLambda | undefined => {
  if (expression.kind === "FunctionConstruction")
    return { bounds: expression.bounds, body: expression.body, scope };
  if (expression.kind !== "Identifier") return undefined;
  const binding = lookupScope(scope, expression.name);
  if (binding?.kind === "Thunk")
    return getFunctionLambda(binding.expression, binding.scope, partial, exploration);
  const definition = binding ? undefined : getDefinition(expression.name, exploration.environment);
  if (definition?.kind !== "Function") return undefined;
  const self = evaluate(expression, getContext(exploration, undefined, partial));
  return {
    bounds: definition.bounds,
    body: definition.body,
    scope: bindValue(undefined, definition.name, self),
  };
};

const describeLocation = (expression: Expression) =>
  `line ${expression.location.line}, column ${expression.location.column}`;

const exploreGuard = (
  expression: Expression,
  scope: Scope | undefined,
  partial: State,
  label: Label,
  exploration: Exploration,
  onComplete: Continuation,
) => {
  const value = evaluate(expression, getContext(exploration, scope, partial));
  if (expectBoolean(value, `the action at ${describeLocation(expression)}`))
    onComplete(partial, label);
};

const getMissingVariables = (partial: State, environment: Environment) =>
  environment.variables.filter((_, index) => partial[index] === undefined);

const isComplete = (partial: State): partial is Value[] =>
  partial.every((value) => value !== undefined);

const isInitAssigned = (exploration: Exploration, partial: State) =>
  exploration.isInit && isComplete(partial);

const holdsInInit = (
  expressions: Expression[],
  scope: Scope | undefined,
  partial: State,
  exploration: Exploration,
) => {
  const context = getContext(exploration, scope, partial);
  return expressions.every((expression) =>
    expectBoolean(
      evaluate(expression, context),
      `the initial predicate at ${describeLocation(expression)}`,
    ),
  );
};

const exploreSequence = (
  operands: Expression[],
  index: number,
  scope: Scope | undefined,
  partial: State,
  label: Label,
  exploration: Exploration,
  onComplete: Continuation,
): void => {
  if (index === operands.length) {
    onComplete(partial, label);
    return;
  }
  if (index > 0 && isInitAssigned(exploration, partial)) {
    if (holdsInInit(operands.slice(index), scope, partial, exploration)) onComplete(partial, label);
    return;
  }
  explore(operands[index], scope, partial, label, exploration, (nextPartial, nextLabel) =>
    exploreSequence(operands, index + 1, scope, nextPartial, nextLabel, exploration, onComplete),
  );
};

const exploreUnchanged = (
  expression: Expression,
  scope: Scope | undefined,
  partial: State,
  label: Label,
  exploration: Exploration,
  onComplete: Continuation,
): void => {
  const current = exploration.current;
  if (!current)
    throw new TlaEvaluationError(
      `UNCHANGED appears in an initial predicate at ${describeLocation(expression)}`,
    );
  if (expression.kind === "Tuple") {
    const unchangedElements = expression.elements.map((element): Expression => ({
      kind: "Unchanged",
      expression: element,
      location: element.location,
    }));
    exploreSequence(unchangedElements, 0, scope, partial, label, exploration, onComplete);
    return;
  }
  if (expression.kind === "Identifier") {
    const binding = lookupScope(scope, expression.name);
    if (binding?.kind === "Thunk") {
      exploreUnchanged(binding.expression, binding.scope, partial, label, exploration, onComplete);
      return;
    }
    const index = binding ? undefined : exploration.environment.variableIndex.get(expression.name);
    if (index !== undefined) {
      const assigned = partial[index];
      if (assigned === undefined) onComplete(assign(partial, index, current[index]), label);
      else if (valuesEqual(assigned, current[index])) onComplete(partial, label);
      return;
    }
    const definition = binding
      ? undefined
      : getDefinition(expression.name, exploration.environment);
    if (definition?.kind === "Operator" && definition.params.length === 0) {
      exploreUnchanged(definition.body, undefined, partial, label, exploration, onComplete);
      return;
    }
  }
  exploreGuard(
    { kind: "Unchanged", expression, location: expression.location },
    scope,
    partial,
    label,
    exploration,
    onComplete,
  );
};

const exploreApply = (
  expression: Expression & { kind: "Apply" },
  scope: Scope | undefined,
  partial: State,
  label: Label,
  exploration: Exploration,
  onComplete: Continuation,
) => {
  const args = expression.args;
  if (expression.operator === "=" || expression.operator === "\\in") {
    const index = getVariableIndex(args[0], scope, partial, exploration, !exploration.isInit);
    if (index !== undefined && partial[index] === undefined) {
      const value = evaluate(args[1], getContext(exploration, scope, partial));
      if (expression.operator === "=") {
        onComplete(assign(partial, index, value), label);
        return;
      }
      if (!isEnumerable(value)) {
        throw new TlaEvaluationError(
          `In computing next states, the right side of \\in is not enumerable: ${formatValue(value)} at ${describeLocation(expression)}`,
        );
      }
      toFiniteSet(value).elements.forEach((element) =>
        onComplete(assign(partial, index, element), label),
      );
      return;
    }
  }
  if (expression.operator === "=>") {
    const condition = evaluate(args[0], getContext(exploration, scope, partial));
    if (!expectBoolean(condition, `the left side of => at ${describeLocation(expression)}`)) {
      onComplete(partial, label);
      return;
    }
    explore(args[1], scope, partial, label, exploration, onComplete);
    return;
  }
  const operator = resolveApplyOperator(expression, getContext(exploration, scope, partial));
  if (operator?.kind === "Closure") {
    const operatorScope = bindOperatorArguments(
      operator,
      args,
      getContext(exploration, scope, partial),
    );
    explore(
      operator.body,
      operatorScope,
      partial,
      nameAction(label, expression.operator),
      exploration,
      onComplete,
    );
    return;
  }
  exploreGuard(expression, scope, partial, label, exploration, onComplete);
};

const explore = (
  expression: Expression,
  scope: Scope | undefined,
  partial: State,
  label: Label,
  exploration: Exploration,
  onComplete: Continuation,
): void => {
  switch (expression.kind) {
    case "And":
      exploreSequence(
        expression.operands,
        0,
        scope,
        partial,
        fixLabel(label),
        exploration,
        onComplete,
      );
      return;
    case "Or":
      expression.operands.forEach((operand) =>
        explore(operand, scope, partial, label, exploration, onComplete),
      );
      return;
    case "Exists":
      forEachBinding(expression.bounds, getContext(exploration, scope, partial), (boundScope) => {
        explore(expression.body, boundScope, partial, label, exploration, onComplete);
        return false;
      });
      return;
    case "Forall": {
      const boundScopes: (Scope | undefined)[] = [];
      forEachBinding(expression.bounds, getContext(exploration, scope, partial), (boundScope) => {
        boundScopes.push(boundScope);
        return false;
      });
      // TLC explores the first binding and pushes the rest onto its action stack, which visits them last to first.
      const scopes = [...boundScopes.slice(0, 1), ...boundScopes.slice(1).reverse()];
      const visit = (index: number, nextPartial: State, nextLabel: Label): void => {
        if (index === scopes.length) {
          onComplete(nextPartial, nextLabel);
          return;
        }
        if (index > 0 && isInitAssigned(exploration, nextPartial)) {
          const isSatisfied = scopes
            .slice(index)
            .every((boundScope) =>
              holdsInInit([expression.body], boundScope, nextPartial, exploration),
            );
          if (isSatisfied) onComplete(nextPartial, nextLabel);
          return;
        }
        explore(
          expression.body,
          scopes[index],
          nextPartial,
          nextLabel,
          exploration,
          (afterPartial, afterLabel) => visit(index + 1, afterPartial, afterLabel),
        );
      };
      visit(0, partial, fixLabel(label));
      return;
    }
    case "If": {
      const condition = evaluate(expression.condition, getContext(exploration, scope, partial));
      const branch = expectBoolean(condition, "an IF condition")
        ? expression.consequent
        : expression.alternative;
      explore(branch, scope, partial, label, exploration, onComplete);
      return;
    }
    case "Case": {
      const context = getContext(exploration, scope, partial);
      const arm = expression.arms.find((candidate) =>
        expectBoolean(evaluate(candidate.condition, context), "a CASE guard"),
      );
      const body = arm?.body ?? expression.other;
      if (!body)
        throw new TlaEvaluationError(`No CASE guard is true at ${describeLocation(expression)}`);
      explore(body, scope, partial, label, exploration, onComplete);
      return;
    }
    case "Let": {
      const letScope = bindDefinitions(
        expression.definitions,
        getContext(exploration, scope, partial),
      );
      explore(expression.body, letScope, partial, label, exploration, onComplete);
      return;
    }
    case "Unchanged":
      exploreUnchanged(expression.expression, scope, partial, label, exploration, onComplete);
      return;
    case "BoxAction":
      explore(
        {
          kind: "Or",
          operands: [
            expression.action,
            { kind: "Unchanged", expression: expression.subscript, location: expression.location },
          ],
          location: expression.location,
        },
        scope,
        partial,
        label,
        exploration,
        onComplete,
      );
      return;
    case "AngleAction":
      explore(expression.action, scope, partial, label, exploration, (nextPartial, nextLabel) => {
        const isUnchanged = evaluate(
          { kind: "Unchanged", expression: expression.subscript, location: expression.location },
          getContext(exploration, scope, nextPartial),
        );
        if (!expectBoolean(isUnchanged, "a subscript")) onComplete(nextPartial, nextLabel);
      });
      return;
    case "FunctionApplication": {
      const lambda = getFunctionLambda(expression.function, scope, partial, exploration);
      if (!lambda) {
        exploreGuard(expression, scope, partial, label, exploration, onComplete);
        return;
      }
      const context = getContext(exploration, scope, partial);
      const args = expression.args.map((arg) => evaluate(arg, context));
      const argument = args.length === 1 ? args[0] : createTuple(args);
      const domain = getBoundsDomain(lambda.bounds, getContext(exploration, lambda.scope, partial));
      if (!isElementOf(argument, domain)) {
        throw new TlaEvaluationError(
          `Attempted to apply a function to ${formatValue(argument)}, which is not in its domain at ${describeLocation(expression)}`,
        );
      }
      explore(
        lambda.body,
        bindArgument(lambda.bounds, lambda.scope, argument),
        partial,
        label,
        exploration,
        onComplete,
      );
      return;
    }
    case "Identifier": {
      const binding = lookupScope(scope, expression.name);
      if (binding?.kind === "Thunk") {
        explore(binding.expression, binding.scope, partial, label, exploration, onComplete);
        return;
      }
      const name = binding
        ? undefined
        : (exploration.environment.substitutions.get(expression.name) ?? expression.name);
      const definition =
        name === undefined ? undefined : exploration.environment.definitions.get(name);
      if (
        definition?.kind === "Operator" &&
        definition.params.length === 0 &&
        !exploration.environment.constants.has(expression.name)
      ) {
        explore(
          definition.body,
          undefined,
          partial,
          nameAction(label, definition.name),
          exploration,
          onComplete,
        );
        return;
      }
      exploreGuard(expression, scope, partial, label, exploration, onComplete);
      return;
    }
    case "Apply":
      exploreApply(expression, scope, partial, label, exploration, onComplete);
      return;
    default:
      exploreGuard(expression, scope, partial, label, exploration, onComplete);
  }
};

export const getInitialStates = (expression: Expression, environment: Environment): Value[][] => {
  const states: Value[][] = [];
  const exploration: Exploration = { environment, isInit: true, current: undefined };
  explore(
    expression,
    undefined,
    Array.from<Value | undefined>({ length: environment.variables.length }),
    { name: undefined, isFixed: false },
    exploration,
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
  const exploration: Exploration = { environment, isInit: false, current: state };
  explore(
    expression,
    undefined,
    Array.from<Value | undefined>({ length: state.length }),
    { name: undefined, isFixed: false },
    exploration,
    (partial, label) => {
      if (!isComplete(partial)) {
        throw new TlaEvaluationError(
          `Successor state is not completely specified by action ${label.name ?? "Next"}. The following variables are not assigned: ${getMissingVariables(partial, environment).join(", ")}`,
        );
      }
      successors.push({ state: partial, action: label.name });
    },
  );
  return successors;
};
