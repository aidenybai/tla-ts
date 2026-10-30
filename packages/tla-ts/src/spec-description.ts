import {
  isLocallyResolved,
  type Definition,
  type Expression,
  type SourceLocation,
  type SourceRange,
} from "./ast";
import type { ModelConfig } from "./config";
import type { InstanceAction } from "./environment";
import { TlaError } from "./errors";
import {
  bindDefinitions,
  bindOperatorArguments,
  evaluate,
  forEachBinding,
  formatRange,
  getDefinition,
  isConstantLevel,
  lookupScope,
  resolveGlobalOperator,
  type Closure,
  type Environment,
  type Scope,
} from "./evaluate";
import { TEMPORAL_LEVEL } from "./levels";
import { getLevel } from "./liveness";
import { createRecord, createSet, createTuple, formatValue, type Value } from "./values";
import type { TlcVersion } from "./tlc-version";

export interface SpecAction {
  name: string;
  location: SourceLocation;
  parameters: [string, Value][];
  expression: Expression;
  scope: Scope | undefined;
}

interface SpecDescription {
  inits: SpecAction[];
  actions: SpecAction[];
  temporals: SpecAction[];
  invariants: SpecAction[];
  impliedInits: SpecAction[];
  impliedActions: SpecAction[];
  impliedTemporals: SpecAction[];
}

const UNNAMED_ACTION = "UnnamedAction";

const BUILTIN_RANGE: SourceRange = {
  module: "--TLA+ BUILTINS--",
  start: { line: 0, column: 0 },
  end: { line: 0, column: 0 },
};

const toLocationValue = (location: SourceLocation) => {
  const range = location.range ?? BUILTIN_RANGE;
  return createRecord([
    ["beginLine", range.start.line],
    ["beginColumn", range.start.column],
    ["endLine", range.end.line],
    ["endColumn", range.end.column],
    ["module", range.module],
  ]);
};

// TLC's RecordValue(Action): the action's name and location, with the values of its parameters.
export const toActionValue = (action: SpecAction) => {
  const fields: [string, Value][] = [
    ["name", action.name],
    ["location", toLocationValue(action.location)],
  ];
  if (action.parameters.length === 0) return createRecord(fields);
  return createRecord([
    ...fields,
    ["context", createRecord(action.parameters)],
    ["parameters", createTuple(action.parameters.map((parameter) => parameter[0]))],
  ]);
};

const createAction = (name: string, expression: Expression): SpecAction => ({
  name,
  location: expression.location,
  parameters: [],
  expression,
  scope: undefined,
});

const getConstantContext = (environment: Environment, scope: Scope | undefined) => ({
  environment,
  scope,
  state: undefined,
  next: undefined,
});

const getOperatorName = (expression: Expression) =>
  expression.kind === "Identifier"
    ? expression.name
    : expression.kind === "Apply"
      ? expression.operator
      : undefined;

const getArguments = (expression: Expression) =>
  expression.kind === "Apply" ? expression.args : [];

const resolveClosure = (
  expression: Expression,
  scope: Scope | undefined,
  environment: Environment,
) => {
  const name = getOperatorName(expression);
  if (name === undefined) return undefined;
  if (isLocallyResolved(expression)) {
    const binding = lookupScope(scope, name);
    return binding?.kind === "Operator" && binding.operator.kind === "Closure"
      ? binding.operator
      : undefined;
  }
  if (environment.constants.has(name) || environment.variableIndex.has(name)) return undefined;
  const operator = resolveGlobalOperator(name, environment);
  return operator?.kind === "Closure" ? operator : undefined;
};

const isEvaluable = (expression: Expression, environment: Environment) => {
  try {
    evaluate(expression, getConstantContext(environment, undefined));
    return true;
  } catch (error) {
    if (error instanceof TlaError) return false;
    throw error;
  }
};

const isConstantValue = (definition: Definition | undefined, environment: Environment) =>
  definition?.kind === "Operator" &&
  definition.params.length === 0 &&
  definition.body.kind !== "Number" &&
  definition.body.kind !== "String" &&
  isConstantLevel(definition, environment) &&
  isEvaluable(definition.body, environment);

const isConstantDefinition = (closure: Closure, environment: Environment) => {
  const definition = getDefinition(closure.name, environment);
  return definition?.body === closure.body && isConstantValue(definition, environment);
};

const getThunk = (expression: Expression, scope: Scope | undefined) => {
  if (expression.kind !== "Identifier" || !isLocallyResolved(expression)) return undefined;
  const binding = lookupScope(scope, expression.name);
  return binding?.kind === "Thunk" ? binding : undefined;
};

const getParameters = (closure: Closure | undefined, scope: Scope | undefined) =>
  (closure?.params ?? []).flatMap((param): [string, Value][] => {
    const binding = lookupScope(scope, param.name);
    return binding?.kind === "Value" ? [[param.name, binding.value]] : [];
  });

const tryCollect = <Result>(collect: () => Result, fallback: () => Result) => {
  try {
    return collect();
  } catch (error) {
    if (error instanceof TlaError) return fallback();
    throw error;
  }
};

const getInstanceActions = (
  instanceAction: InstanceAction,
  expression: Expression,
  scope: Scope | undefined,
  called: Closure | undefined,
  environment: Environment,
): SpecAction[] => {
  const args = getArguments(expression);
  const callAction = (): SpecAction[] => [
    { name: instanceAction.name, location: expression.location, parameters: [], expression, scope },
  ];
  if (!called || args.length === 0) {
    return [{ ...instanceAction, parameters: [], expression, scope }];
  }
  if (args.some((arg) => getLevel(arg, scope, environment) !== 0)) return callAction();
  return tryCollect(
    () => [
      {
        ...instanceAction,
        parameters: args.map((arg, index): [string, Value] => [
          called.params[index].name.replace(/#\d+$/, ""),
          evaluate(arg, getConstantContext(environment, scope)),
        ]),
        expression,
        scope,
      },
    ],
    callAction,
  );
};

const getActions = (
  expression: Expression,
  scope: Scope | undefined,
  closure: Closure | undefined,
  environment: Environment,
  instanceActions: Map<string, InstanceAction>,
): SpecAction[] => {
  const createSplitAction = (): SpecAction => ({
    name: closure?.name ?? UNNAMED_ACTION,
    location: expression.location,
    parameters: getParameters(closure, scope),
    expression,
    scope,
  });
  switch (expression.kind) {
    case "Let":
      return getActions(
        expression.body,
        bindDefinitions(expression.definitions, getConstantContext(environment, scope)),
        closure,
        environment,
        instanceActions,
      );
    case "Label":
      return getActions(expression.body, scope, closure, environment, instanceActions);
    case "Or":
      return expression.operands.flatMap((operand) =>
        getActions(operand, scope, closure, environment, instanceActions),
      );
    case "Exists":
      return tryCollect(
        () => {
          const actions: SpecAction[] = [];
          forEachBinding(
            expression.bounds,
            getConstantContext(environment, scope),
            (boundScope) => {
              actions.push(
                ...getActions(expression.body, boundScope, closure, environment, instanceActions),
              );
              return false;
            },
          );
          return actions.length === 0 ? [createSplitAction()] : actions;
        },
        () => [createSplitAction()],
      );
  }
  const instanceAction = isLocallyResolved(expression)
    ? undefined
    : instanceActions.get(getOperatorName(expression) ?? "");
  const called = resolveClosure(expression, scope, environment);
  if (instanceAction)
    return getInstanceActions(instanceAction, expression, scope, called, environment);
  if (!called) return [createSplitAction()];
  const args = getArguments(expression);
  // TLC names an action after the operator it applies, as SANY names it in the spec.
  const calledName = isLocallyResolved(expression)
    ? called.name
    : (environment.instanceNames.get(getOperatorName(expression) ?? "") ?? called.name);
  const callAction = (): SpecAction[] => [
    { name: calledName, location: expression.location, parameters: [], expression, scope },
  ];
  if (isConstantDefinition(called, environment)) return callAction();
  if (args.some((arg) => getLevel(arg, scope, environment) !== 0)) return callAction();
  return tryCollect(() => {
    const boundScope = args.reduce<Scope | undefined>(
      (current, arg, index) => ({
        name: called.params[index].name,
        binding: {
          kind: "Value",
          value: evaluate(arg, getConstantContext(environment, scope)),
        },
        parent: current,
      }),
      called.scope,
    );
    return getActions(
      called.body,
      boundScope,
      { ...called, name: calledName },
      environment,
      instanceActions,
    );
  }, callAction);
};

const describeSpecification = (
  expression: Expression,
  scope: Scope | undefined,
  environment: Environment,
  description: SpecDescription,
  next: { expression: Expression; scope: Scope | undefined }[],
): void => {
  const recurse = (inner: Expression, innerScope: Scope | undefined) =>
    describeSpecification(inner, innerScope, environment, description, next);
  if (expression.kind === "Let") {
    recurse(
      expression.body,
      bindDefinitions(expression.definitions, getConstantContext(environment, scope)),
    );
    return;
  }
  const thunk = getThunk(expression, scope);
  if (thunk) {
    recurse(thunk.expression, thunk.scope);
    return;
  }
  const called = resolveClosure(expression, scope, environment);
  if (called && isConstantDefinition(called, environment)) return;
  if (called && called.params.length === 0) {
    if (getLevel(called.body, called.scope, environment) === 1) {
      description.inits.push(createAction(called.name, called.body));
      return;
    }
    recurse(called.body, called.scope);
    return;
  }
  if (called && expression.kind === "Apply" && called.params.length === expression.args.length) {
    recurse(
      called.body,
      bindOperatorArguments(called, expression.args, getConstantContext(environment, scope)),
    );
    return;
  }
  if (expression.kind === "And") {
    expression.operands.forEach((operand) => recurse(operand, scope));
    return;
  }
  if (expression.kind === "Always") {
    if (expression.expression.kind === "BoxAction") {
      next.push({ expression: expression.expression.action, scope });
      return;
    }
    description.temporals.push(createAction(UNNAMED_ACTION, expression));
    return;
  }
  const level = getLevel(expression, scope, environment);
  if (level <= 1) description.inits.push(createAction(UNNAMED_ACTION, expression));
  else if (level === TEMPORAL_LEVEL) {
    description.temporals.push(createAction(UNNAMED_ACTION, expression));
  }
};

const describeProperty = (
  configName: string,
  expression: Expression,
  scope: Scope | undefined,
  environment: Environment,
  description: SpecDescription,
): void => {
  const recurse = (inner: Expression, innerScope: Scope | undefined) =>
    describeProperty(configName, inner, innerScope, environment, description);
  if (expression.kind === "Let") {
    recurse(
      expression.body,
      bindDefinitions(expression.definitions, getConstantContext(environment, scope)),
    );
    return;
  }
  const thunk = getThunk(expression, scope);
  if (thunk) {
    recurse(thunk.expression, thunk.scope);
    return;
  }
  const called = resolveClosure(expression, scope, environment);
  if (called && isConstantDefinition(called, environment)) return;
  if (called && called.params.length === getArguments(expression).length) {
    recurse(
      called.body,
      expression.kind === "Apply"
        ? bindOperatorArguments(called, expression.args, getConstantContext(environment, scope))
        : called.scope,
    );
    return;
  }
  if (expression.kind === "Forall") {
    const isEnumerated = tryCollect(
      () => {
        forEachBinding(expression.bounds, getConstantContext(environment, scope), (boundScope) => {
          recurse(expression.body, boundScope);
          return false;
        });
        return true;
      },
      () => false,
    );
    if (isEnumerated) return;
  }
  if (expression.kind === "And") {
    expression.operands.forEach((operand) => recurse(operand, scope));
    return;
  }
  if (expression.kind === "Always") {
    const inner = expression.expression;
    if (inner.kind === "BoxAction") {
      description.impliedActions.push(createAction(configName, inner));
    } else if (getLevel(inner, scope, environment) < 2) {
      description.invariants.push(createAction(configName, inner));
    } else {
      description.impliedTemporals.push(createAction(configName, expression));
    }
    return;
  }
  const level = getLevel(expression, scope, environment);
  if (level <= 1) description.impliedInits.push(createAction(configName, expression));
  else if (level === TEMPORAL_LEVEL) {
    description.impliedTemporals.push(createAction(configName, expression));
  }
};

const getOperatorDefinition = (name: string, environment: Environment) => {
  const definition = getDefinition(name, environment);
  return definition?.kind === "Operator" && !isConstantValue(definition, environment)
    ? definition
    : undefined;
};

const describeDefinition = (definition: Definition) =>
  createRecord([
    ["name", definition.name],
    ["location", toLocationValue(definition.location)],
  ]);

const describe = (
  config: ModelConfig,
  environment: Environment,
  instanceActions: Map<string, InstanceAction>,
) => {
  const description: SpecDescription = {
    inits: [],
    actions: [],
    temporals: [],
    invariants: [],
    impliedInits: [],
    impliedActions: [],
    impliedTemporals: [],
  };
  const next: { expression: Expression; scope: Scope | undefined }[] = [];
  const specification =
    config.specification === undefined
      ? undefined
      : getOperatorDefinition(config.specification, environment);
  if (specification) {
    describeSpecification(specification.body, undefined, environment, description, next);
    next.forEach((item) =>
      description.actions.push(
        ...getActions(item.expression, item.scope, undefined, environment, instanceActions),
      ),
    );
  }
  const init =
    config.init === undefined ? undefined : resolveGlobalOperator(config.init, environment);
  if (init?.kind === "Closure") description.inits.push(createAction(config.init ?? "", init.body));
  const nextOperator =
    config.next === undefined ? undefined : resolveGlobalOperator(config.next, environment);
  if (nextOperator?.kind === "Closure") {
    description.actions.push(
      ...getActions(
        nextOperator.body,
        nextOperator.scope,
        nextOperator,
        environment,
        instanceActions,
      ),
    );
  }
  config.invariants.forEach((name) => {
    const definition = getOperatorDefinition(name, environment);
    if (definition) description.invariants.push(createAction(name, definition.body));
  });
  config.properties.forEach((name) => {
    const definition = getOperatorDefinition(name, environment);
    if (definition) describeProperty(name, definition.body, undefined, environment, description);
  });
  return description;
};

// TLC's initial predicates, which it conjoins to compute the initial states.
export const getInitActions = (
  config: ModelConfig,
  environment: Environment,
  instanceActions: Map<string, InstanceAction>,
) => describe(config, environment, instanceActions).inits;

// TLC's split of the next-state relation into the actions it names in a behavior.
export const getNextActions = (
  config: ModelConfig,
  environment: Environment,
  instanceActions: Map<string, InstanceAction>,
) => describe(config, environment, instanceActions).actions;

const formatParameters = (action: SpecAction) =>
  action.parameters.length === 0
    ? ""
    : `(${action.parameters.map((parameter) => formatValue(parameter[1])).join(",")})`;

// TLC's Action.getLocation, which TLC 1.7.4 names the action in without its parameters.
export const getActionLabel = (action: SpecAction, version?: TlcVersion) =>
  `${action.name === UNNAMED_ACTION ? "Action" : action.name}${version === "1.7.4" ? "" : formatParameters(action)} ${formatRange(action.location.range ?? BUILTIN_RANGE)}`;

// TLC's Action.getInvocationSignature, which names the action and the values of its parameters.
export const getActionSignature = (action: SpecAction) =>
  `${action.name}${formatParameters(action)}`;

export const getSpecificationValue = (
  config: ModelConfig,
  environment: Environment,
  variableLocations: SourceLocation[],
  instanceActions: Map<string, InstanceAction>,
): Value => {
  const description = describe(config, environment, instanceActions);
  const toSet = (actions: SpecAction[]) => createSet(actions.map(toActionValue));
  const toDefinitionSet = (names: string[]) =>
    createSet(
      names.flatMap((name) => {
        const definition = getOperatorDefinition(name, environment);
        return definition ? [describeDefinition(definition)] : [];
      }),
    );
  return createRecord([
    ["inits", toSet(description.inits)],
    ["actions", toSet(description.actions)],
    ["temporals", toSet(description.temporals)],
    ["invariants", toSet(description.invariants)],
    ["impliedinits", toSet(description.impliedInits)],
    ["impliedactions", toSet(description.impliedActions)],
    ["impliedtemporals", toSet(description.impliedTemporals)],
    [
      "variables",
      createSet(
        environment.variables.map((name, index) =>
          createRecord([
            ["name", name],
            ["location", toLocationValue(variableLocations[index])],
          ]),
        ),
      ),
    ],
    ["actionconstraints", toDefinitionSet(config.actionConstraints)],
    ["constraints", toDefinitionSet(config.constraints)],
  ]);
};
