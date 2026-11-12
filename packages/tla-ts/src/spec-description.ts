import { isConstantLevel } from "./dependencies";
import {
  isLocallyResolved,
  type Definition,
  type Expression,
  type SourceLocation,
  type SourceRange,
} from "./ast";
import type { ModelConfig } from "./config";
import { getCoverageCounts, getDistinctCount, type CoverageKind } from "./coverage";
import { EXIT_STATUS, setExitCode } from "./exit-codes";
import { substitutionFrames, withSubstitutionFrames } from "./instances";
import type { InstanceAction } from "./environment";
import { formatRange, TlaError, TlaEvaluationError, UNEXPECTED_EXCEPTION } from "./errors";
import {
  bindDefinitions,
  bindOperatorArguments,
  describeNode,
  evaluate,
  forEachBinding,
  getDefinition,
  lookupScope,
  resolveGlobalOperator,
  type Closure,
  type Environment,
  type Scope,
} from "./evaluate";
import { ACTION_LEVEL, CONSTANT_LEVEL, TEMPORAL_LEVEL, VARIABLE_LEVEL } from "./levels";
import { getLevel } from "./liveness";
import { createRecord, createSet, createTuple, formatValue, type Value } from "./values";
import { LITERAL_KINDS } from "./tlc/replay";
import type { TlcVersion } from "./tlc/version";

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

interface NextItem {
  expression: Expression;
  scope: Scope | undefined;
  frames: Expression[];
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

export const toActionValue = (action: SpecAction, coverage?: Value) => {
  const fields: [string, Value][] = [
    ["name", action.name],
    ["location", toLocationValue(action.location)],
  ];
  if (action.parameters.length > 0) {
    fields.push(
      ["context", createRecord(action.parameters)],
      ["parameters", createTuple(action.parameters.map((parameter) => parameter[0]))],
    );
  }
  if (coverage !== undefined) fields.push(["coverage", coverage]);
  return createRecord(fields);
};

const createAction = (name: string, expression: Expression, scope?: Scope): SpecAction => ({
  name,
  location: expression.location,
  parameters: [],
  expression,
  scope,
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

const isStartupValue = (definition: Definition | undefined, environment: Environment) =>
  definition?.kind === "Operator" &&
  definition.params.length === 0 &&
  isConstantLevel(definition, environment) &&
  isEvaluable(definition.body, environment);

const isConstantValue = (definition: Definition | undefined, environment: Environment) =>
  definition?.kind === "Operator" &&
  definition.body.kind !== "Number" &&
  definition.body.kind !== "String" &&
  isStartupValue(definition, environment);

const isConstantDefinition = (closure: Closure, environment: Environment) => {
  const definition = getDefinition(closure.name, environment);
  return definition?.body === closure.body && isConstantValue(definition, environment);
};

const getThunk = (expression: Expression, scope: Scope | undefined) => {
  if (expression.kind !== "Identifier" || !isLocallyResolved(expression)) return undefined;
  const binding = lookupScope(scope, expression.name);
  return binding?.kind === "Thunk" ? binding : undefined;
};

const unwrapBinding = (
  expression: Expression,
  scope: Scope | undefined,
  environment: Environment,
) => {
  if (expression.kind === "Let") {
    return {
      expression: expression.body,
      scope: bindDefinitions(expression.definitions, getConstantContext(environment, scope)),
    };
  }
  const thunk = getThunk(expression, scope);
  return thunk && { expression: thunk.expression, scope: thunk.scope };
};

const getCallScope = (
  called: Closure,
  expression: Expression,
  scope: Scope | undefined,
  environment: Environment,
) =>
  expression.kind === "Apply"
    ? bindOperatorArguments(called, expression.args, getConstantContext(environment, scope))
    : called.scope;

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
  if (called && args.length === 0) {
    return [{ ...instanceAction, parameters: [], expression: called.body, scope: called.scope }];
  }
  if (!called) return [{ ...instanceAction, parameters: [], expression, scope }];
  if (args.some((arg) => getLevel(arg, scope, environment) !== CONSTANT_LEVEL)) {
    return callAction();
  }
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
  if (LITERAL_KINDS.has(expression.kind)) {
    throw setExitCode(
      new TlaEvaluationError(
        `${UNEXPECTED_EXCEPTION}The next state relation is not a boolean expression.\n${describeNode(expression)}`,
      ),
      EXIT_STATUS.error,
    );
  }
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
  const calledName = isLocallyResolved(expression)
    ? called.name
    : (environment.instanceNames.get(getOperatorName(expression) ?? "") ?? called.name);
  const callAction = (): SpecAction[] => [
    { name: calledName, location: expression.location, parameters: [], expression, scope },
  ];
  if (isConstantDefinition(called, environment)) return callAction();
  if (args.some((arg) => getLevel(arg, scope, environment) !== CONSTANT_LEVEL)) {
    return callAction();
  }
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
  next: NextItem[],
  frames: Expression[] = [],
): void => {
  const recurse = (inner: Expression, innerScope: Scope | undefined, innerFrames = frames) =>
    describeSpecification(inner, innerScope, environment, description, next, innerFrames);
  const createConjunct = (name: string, conjunct: Expression, conjunctScope: Scope | undefined) =>
    createAction(name, withSubstitutionFrames(conjunct, frames), conjunctScope);
  const unwrapped = unwrapBinding(expression, scope, environment);
  if (unwrapped) {
    recurse(unwrapped.expression, unwrapped.scope);
    return;
  }
  const called = resolveClosure(expression, scope, environment);
  if (called && isConstantDefinition(called, environment)) return;
  const calledFrames = called
    ? [...frames, ...(substitutionFrames.get(called.body) ?? [])]
    : frames;
  if (called && called.params.length === 0) {
    if (getLevel(called.body, called.scope, environment) === VARIABLE_LEVEL) {
      description.inits.push(createConjunct(called.name, called.body, called.scope));
      return;
    }
    recurse(called.body, called.scope, calledFrames);
    return;
  }
  if (called && expression.kind === "Apply" && called.params.length === expression.args.length) {
    recurse(
      called.body,
      bindOperatorArguments(called, expression.args, getConstantContext(environment, scope)),
      calledFrames,
    );
    return;
  }
  if (expression.kind === "And") {
    expression.operands.forEach((operand) => recurse(operand, scope));
    return;
  }
  if (expression.kind === "Always") {
    if (expression.expression.kind === "BoxAction") {
      next.push({ expression: expression.expression.action, scope, frames });
      return;
    }
    description.temporals.push(createConjunct(UNNAMED_ACTION, expression, scope));
    return;
  }
  const level = getLevel(expression, scope, environment);
  if (level <= VARIABLE_LEVEL) {
    description.inits.push(createConjunct(UNNAMED_ACTION, expression, scope));
  } else if (level === TEMPORAL_LEVEL) {
    description.temporals.push(createConjunct(UNNAMED_ACTION, expression, scope));
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
  const unwrapped = unwrapBinding(expression, scope, environment);
  if (unwrapped) {
    recurse(unwrapped.expression, unwrapped.scope);
    return;
  }
  const called = resolveClosure(expression, scope, environment);
  if (called && isConstantDefinition(called, environment)) return;
  if (called && called.params.length === getArguments(expression).length) {
    recurse(called.body, getCallScope(called, expression, scope, environment));
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
    } else if (getLevel(inner, scope, environment) < ACTION_LEVEL) {
      description.invariants.push(createAction(configName, inner));
    } else {
      description.impliedTemporals.push(createAction(configName, expression));
    }
    return;
  }
  const level = getLevel(expression, scope, environment);
  if (level <= VARIABLE_LEVEL) {
    description.impliedInits.push(createAction(configName, expression));
  } else if (level === TEMPORAL_LEVEL) {
    description.impliedTemporals.push(createAction(configName, expression));
  }
};

const getOperatorDefinition = (name: string, environment: Environment) => {
  const definition = getDefinition(name, environment);
  return definition?.kind === "Operator" && !isConstantValue(definition, environment)
    ? definition
    : undefined;
};

const getSpecDescription = (
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
  const next: NextItem[] = [];
  const specification =
    config.specification === undefined
      ? undefined
      : getOperatorDefinition(config.specification, environment);
  if (specification) {
    describeSpecification(specification.body, undefined, environment, description, next);
    next.forEach((item) =>
      description.actions.push(
        ...(item.frames.length > 0
          ? [
              {
                name: UNNAMED_ACTION,
                location: item.frames[0].location,
                parameters: [],
                expression: withSubstitutionFrames(item.expression, item.frames),
                scope: item.scope,
              },
            ]
          : getActions(item.expression, item.scope, undefined, environment, instanceActions)),
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
  return description;
};

export const getSubscriptVariables = (
  subscript: Expression,
  scope: Scope | undefined,
  environment: Environment,
) => {
  const variables: string[] = [];
  const collect = (expression: Expression, innerScope: Scope | undefined): boolean => {
    if (
      expression.kind === "Number" ||
      expression.kind === "Decimal" ||
      expression.kind === "String"
    ) {
      return false;
    }
    if (expression.kind === "Tuple") {
      return expression.elements.every((element) => collect(element, innerScope));
    }
    if (expression.kind === "Label") return collect(expression.body, innerScope);
    const unwrapped = unwrapBinding(expression, innerScope, environment);
    if (unwrapped) return collect(unwrapped.expression, unwrapped.scope);
    const argument =
      expression.kind === "Identifier" && isLocallyResolved(expression)
        ? lookupScope(innerScope, expression.name)
        : undefined;
    if (argument?.kind === "Value" && argument.argument) {
      return collect(argument.argument, innerScope);
    }
    if (
      expression.kind === "Identifier" &&
      !isLocallyResolved(expression) &&
      environment.variableIndex.has(expression.name)
    ) {
      variables.push(expression.name);
      return true;
    }
    const called = resolveClosure(expression, innerScope, environment);
    if (!called || called.params.length !== getArguments(expression).length) return true;
    const definition = getDefinition(called.name, environment);
    if (definition?.body === called.body && isStartupValue(definition, environment)) return true;
    return collect(called.body, getCallScope(called, expression, innerScope, environment));
  };
  return collect(subscript, scope) ? variables : undefined;
};

export const getInitActions = (
  config: ModelConfig,
  environment: Environment,
  instanceActions: Map<string, InstanceAction>,
) => getSpecDescription(config, environment, instanceActions).inits;

export const getNextActions = (
  config: ModelConfig,
  environment: Environment,
  instanceActions: Map<string, InstanceAction>,
) => getSpecDescription(config, environment, instanceActions).actions;

const formatParameters = (action: SpecAction) =>
  action.parameters.length === 0
    ? ""
    : `(${action.parameters.map((parameter) => formatValue(parameter[1])).join(",")})`;

export const getActionLabel = (action: SpecAction, version?: TlcVersion, isInitial = false) =>
  `${action.name === UNNAMED_ACTION ? (isInitial ? "Initial predicate" : "Action") : action.name}${version === "1.7.4" ? "" : formatParameters(action)} ${formatRange(action.location.range ?? BUILTIN_RANGE)}`;

export const getActionSignature = (action: SpecAction) =>
  `${action.name}${formatParameters(action)}`;

export const getSpecificationValue = (
  config: ModelConfig,
  environment: Environment,
  variableLocations: SourceLocation[],
  instanceActions: Map<string, InstanceAction>,
): Value => {
  const description = getSpecDescription(config, environment, instanceActions);
  config.invariants.forEach((name) => {
    const definition = getOperatorDefinition(name, environment);
    if (definition) description.invariants.push(createAction(name, definition.body));
  });
  config.properties.forEach((name) => {
    const definition = getOperatorDefinition(name, environment);
    if (definition) describeProperty(name, definition.body, undefined, environment, description);
  });
  const coverage = environment.coverage;
  const toSet = (actions: SpecAction[], kind?: CoverageKind) =>
    createSet(
      actions.map((action) => {
        const counts = coverage && kind && getCoverageCounts(coverage, kind, action.expression);
        return toActionValue(action, counts && createRecord(counts));
      }),
    );
  const toDefinitionSet = (names: string[]) =>
    createSet(
      names.flatMap((name) => {
        const definition = getOperatorDefinition(name, environment);
        return definition
          ? [
              createRecord([
                ["name", definition.name],
                ["location", toLocationValue(definition.location)],
              ]),
            ]
          : [];
      }),
    );
  return createRecord([
    ["inits", toSet(description.inits, "init")],
    ["actions", toSet(description.actions, "next")],
    ["temporals", toSet(description.temporals)],
    ["invariants", toSet(description.invariants, "invariant")],
    ["impliedinits", toSet(description.impliedInits, "implied")],
    ["impliedactions", toSet(description.impliedActions, "implied")],
    ["impliedtemporals", toSet(description.impliedTemporals)],
    [
      "variables",
      createSet(
        environment.variables.map((name, index) =>
          createRecord([
            ["name", name],
            ["location", toLocationValue(variableLocations[index])],
            ...(coverage
              ? [
                  [
                    "coverage",
                    createRecord([["distinct", getDistinctCount(coverage, index)]]),
                  ] satisfies [string, Value],
                ]
              : []),
          ]),
        ),
      ),
    ],
    ["actionconstraints", toDefinitionSet(config.actionConstraints)],
    ["constraints", toDefinitionSet(config.constraints)],
  ]);
};
