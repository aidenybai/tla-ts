import {
  getAssumeProveBody,
  getChildren,
  getDefinitionExpressions,
  isLocallyResolved,
  type Definition,
  type Expression,
  type SourceLocation,
  type SourceRange,
} from "./ast";
import type { ModelConfig } from "./config";
import {
  getCoverageCounts,
  getDistinctCount,
  getLetDefinition,
  type CoverageKind,
} from "./coverage";
import { EXIT_STATUS, setExitCode } from "./exit-codes";
import {
  frameSubstitutions,
  getActionPredicate,
  getSubstitutedName,
  isSubstitutionDefinition,
  substitutionFrames,
  withSubstitutionFrames,
} from "./instances";
import type { InstanceAction } from "./environment";
import { formatRange, TlaError, TlaEvaluationError, UNEXPECTED_EXCEPTION } from "./errors";
import {
  bindOperatorArguments,
  bindUncachedArguments,
  describeNode,
  evaluate,
  forEachBinding,
  getBodyLiteral,
  getDefinition,
  getLookupValue,
  getRootKey,
  getStartupValue,
  lookupScope,
  resolveGlobalOperator,
  type Closure,
  type Environment,
  type Scope,
} from "./evaluate";
import { ACTION_LEVEL, CONSTANT_LEVEL, TEMPORAL_LEVEL, VARIABLE_LEVEL } from "./levels";
import { bindLetDefinitions, getLevelBound, getSanyLevel } from "./liveness";
import { EMPTY_STATE } from "./runtime";
import {
  createRecord,
  createSet,
  createTuple,
  formatValue,
  rankString,
  type Value,
} from "./values";
import { LITERAL_KINDS } from "./tlc/replay";
import { resolveSynonym, TLC_RUNTIME_STRINGS } from "./tlc/jar-data";
import { getSanyStandardModules } from "./sany/modules";
import { parseModule } from "./parser";
import { getStandardModule } from "./standard-definitions";
import type { TlcVersion } from "./tlc/version";

export interface SpecAction {
  name: string;
  location: SourceLocation;
  head?: SourceRange;
  body?: SourceRange;
  parameters: [string, Value][];
  context: [string, Value][];
  expression: Expression;
  scope: Scope | undefined;
}

export interface SpecDescription {
  inits: SpecAction[];
  actions: SpecAction[];
  temporals: SpecAction[];
}

interface PropertyDescription {
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
  context: [],
  expression,
  scope,
});

const getConstantContext = (environment: Environment, scope: Scope | undefined) => ({
  environment,
  scope,
  state: undefined,
  next: undefined,
});

const getSplitContext = (environment: Environment, scope: Scope | undefined) => ({
  environment,
  scope,
  state: EMPTY_STATE,
  next: undefined,
});

// Tool#getActionsAppl reads the level SANY gives each argument, which is constant for TLCGet.
const hasConstantArguments = (
  args: Expression[],
  scope: Scope | undefined,
  environment: Environment,
) => args.every((arg) => getSanyLevel(arg, scope, environment) === CONSTANT_LEVEL);

const getOperatorName = (expression: Expression) =>
  expression.kind === "Identifier"
    ? expression.name
    : expression.kind === "Apply"
      ? expression.operator
      : undefined;

// Tool#getActionsAppl names an action by the operator it applies, even one TLC implements, and declares it where the standard module defines the operator.
const getStandardHead = (name: string, environment: Environment) => {
  const module = getStandardModule(name);
  const source =
    module === undefined
      ? undefined
      : getSanyStandardModules(environment.runtime.version).get(module);
  const definition =
    source === undefined
      ? undefined
      : parseModule(source).definitions.find((item) => item.name === name);
  return definition?.kind === "Operator" ? definition.head : undefined;
};

const getArguments = (expression: Expression) =>
  expression.kind === "Apply" ? expression.args : [];

const getLocalDefinition = (expression: Expression, scope: Scope | undefined) =>
  isLocallyResolved(expression) ? getLetDefinition(getOperatorName(expression), scope) : undefined;

const getDefinitionRanges = (definition: Definition | undefined) =>
  definition?.kind === "Operator"
    ? { head: definition.head, body: definition.body.location.range }
    : undefined;

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

const isConstantValue = (definition: Definition | undefined, environment: Environment) =>
  definition?.kind === "Operator" &&
  definition.body.kind !== "Number" &&
  definition.body.kind !== "String" &&
  definition.params.length === 0 &&
  getStartupValue(definition, environment) !== undefined;

const getCalledDefinition = (
  expression: Expression,
  scope: Scope | undefined,
  environment: Environment,
) =>
  isLocallyResolved(expression)
    ? getLocalDefinition(expression, scope)
    : getDefinition(getOperatorName(expression) ?? "", environment);

const isConstantDefinition = (
  closure: Closure,
  expression: Expression,
  scope: Scope | undefined,
  environment: Environment,
) => {
  const definition = getCalledDefinition(expression, scope, environment);
  return definition?.body === closure.body && getLookupValue(definition, environment) !== undefined;
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
      scope: bindLetDefinitions(expression, scope, environment),
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

const getBoundValues = (names: string[], scope: Scope | undefined) =>
  names.flatMap((name): [string, Value][] => {
    const binding = lookupScope(scope, name);
    return binding?.kind === "Value" ? [[name, binding.value]] : [];
  });

const getParameters = (closure: Closure | undefined, scope: Scope | undefined) =>
  getBoundValues(
    (closure?.params ?? []).map((param) => param.name),
    scope,
  );

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
  context: [string, Value][],
): SpecAction[] => {
  const args = getArguments(expression);
  const callAction = (): SpecAction[] => [
    {
      ...instanceAction,
      location: expression.location,
      parameters: [],
      context,
      expression,
      scope,
    },
  ];
  if (called && isConstantDefinition(called, expression, scope, environment)) return callAction();
  if (called && args.length === 0) {
    return [
      { ...instanceAction, parameters: [], context, expression: called.body, scope: called.scope },
    ];
  }
  if (!called) return [{ ...instanceAction, parameters: [], context, expression, scope }];
  if (!hasConstantArguments(args, scope, environment)) return callAction();
  return tryCollect(() => {
    const values = args.map((arg) => evaluate(arg, getSplitContext(environment, scope)));
    const parameters = values.map((value, index): [string, Value] => [
      called.params[index].name.replace(/#\d+$/, ""),
      value,
    ]);
    return [
      {
        ...instanceAction,
        parameters,
        context: [...context, ...parameters],
        expression: called.body,
        scope: values.reduce<Scope | undefined>(
          (current, value, index) => ({
            name: called.params[index].name,
            binding: { kind: "Value", value },
            parent: current,
          }),
          called.scope,
        ),
      },
    ];
  }, callAction);
};

const createRelationError = (expression: Expression) =>
  setExitCode(
    new TlaEvaluationError(
      `${UNEXPECTED_EXCEPTION}The next state relation is not a boolean expression.\n${describeNode(expression)}`,
    ),
    EXIT_STATUS.error,
  );

const getActions = (
  expression: Expression,
  scope: Scope | undefined,
  closure: Closure | undefined,
  environment: Environment,
  instanceActions: Map<string, InstanceAction>,
  context: [string, Value][],
  definition?: Definition,
): SpecAction[] => {
  const createSplitAction = (): SpecAction => ({
    name: closure?.name ?? UNNAMED_ACTION,
    location: expression.location,
    ...getDefinitionRanges(definition),
    parameters: getParameters(closure, scope),
    context,
    expression,
    scope,
  });
  if (LITERAL_KINDS.has(expression.kind)) throw createRelationError(expression);
  const predicate = getActionPredicate(expression);
  if (predicate !== expression) {
    return [
      { ...createSplitAction(), location: predicate.location, body: predicate.location.range },
    ];
  }
  switch (expression.kind) {
    case "Let":
      return getActions(
        expression.body,
        bindLetDefinitions(expression, scope, environment),
        closure,
        environment,
        instanceActions,
        context,
        definition,
      );
    case "Label":
      return getActions(
        expression.body,
        scope,
        closure,
        environment,
        instanceActions,
        context,
        definition,
      );
    case "Selection":
      // TLC's Tool#getActions takes SANY's $Nop as an action of its own.
      return expression.location.range === undefined
        ? getActions(
            expression.expression,
            scope,
            closure,
            environment,
            instanceActions,
            context,
            definition,
          )
        : [createSplitAction()];
    case "Or":
      return expression.operands.flatMap((operand) =>
        getActions(operand, scope, closure, environment, instanceActions, context, definition),
      );
    case "Exists":
      return tryCollect(
        () => {
          const actions: SpecAction[] = [];
          const names = expression.bounds.flatMap((bound) =>
            bound.pattern.kind === "Name" ? [bound.pattern.name] : bound.pattern.names,
          );
          forEachBinding(expression.bounds, getSplitContext(environment, scope), (boundScope) => {
            actions.push(
              ...getActions(
                expression.body,
                boundScope,
                closure,
                environment,
                instanceActions,
                [...context, ...getBoundValues(names, boundScope)],
                definition,
              ),
            );
            return false;
          });
          return actions.length === 0 ? [createSplitAction()] : actions;
        },
        () => [createSplitAction()],
      );
  }
  const instanceAction = isLocallyResolved(expression)
    ? undefined
    : instanceActions.get(getOperatorName(expression) ?? "");
  const called = resolveClosure(expression, scope, environment);
  const theorem = called && getAssumeProveBody(called.body);
  // Deviation from TLC: Tool#getActionsAppl casts a theorem to an OpDefNode, and the ClassCastException crashes TLC unless an enclosing \E or operator catches it.
  if (theorem) throw createRelationError(theorem);
  if (instanceAction)
    return getInstanceActions(instanceAction, expression, scope, called, environment, context);
  const letDefinition = getLocalDefinition(expression, scope);
  const thunk = letDefinition?.kind === "Operator" ? getThunk(expression, scope) : undefined;
  if (letDefinition && thunk) {
    return getActions(
      thunk.expression,
      thunk.scope,
      {
        kind: "Closure",
        name: letDefinition.name,
        params: [],
        body: thunk.expression,
        scope: thunk.scope,
      },
      environment,
      instanceActions,
      context,
      letDefinition,
    );
  }
  if (!called) {
    const builtin = isLocallyResolved(expression)
      ? undefined
      : environment.builtins.get(getOperatorName(expression) ?? "");
    const head = builtin && getStandardHead(builtin.name, environment);
    return [
      builtin && head
        ? { ...createSplitAction(), name: resolveSynonym(builtin.name), head }
        : createSplitAction(),
    ];
  }
  const args = getArguments(expression);
  const operatorName = getOperatorName(expression) ?? "";
  const calledName = isLocallyResolved(expression)
    ? called.name
    : (environment.instanceNames.get(operatorName) ?? called.name);
  const calledDefinition = getCalledDefinition(expression, scope, environment);
  // Tool#getActionsAppl names an action it doesn't enter by the definition the call names, not by the one a configuration override puts in its place.
  // Deviation from TLC: Tool#getActionsAppl throws a ClassCastException where an override replaces a constant operator, which this names by the substitute.
  const namedDefinition = isLocallyResolved(expression)
    ? undefined
    : environment.definitions.get(operatorName);
  const callAction = (): SpecAction[] => [
    {
      name:
        namedDefinition && namedDefinition !== calledDefinition ? namedDefinition.name : calledName,
      location: expression.location,
      ...getDefinitionRanges(namedDefinition ?? calledDefinition),
      parameters: [],
      context,
      expression,
      scope,
    },
  ];
  if (isConstantDefinition(called, expression, scope, environment)) return callAction();
  if (!hasConstantArguments(args, scope, environment)) return callAction();
  return tryCollect(() => {
    const boundScope = args.reduce<Scope | undefined>(
      (current, arg, index) => ({
        name: called.params[index].name,
        binding: {
          kind: "Value",
          value: evaluate(arg, getSplitContext(environment, scope)),
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
      [...context, ...getParameters(called, boundScope)],
      calledDefinition,
    );
  }, callAction);
};

// TLC bounds the level of a definition without the substitutions of its instances, so an instance's declaration counts as a variable only by the name of a root variable.
const isVariableBound = (
  expression: Expression,
  environment: Environment,
  visited: Set<Definition>,
): boolean => {
  const substituted = getSubstitutedName(expression);
  if (substituted !== undefined) return environment.variableIndex.has(substituted);
  if (expression.kind === "Enabled") return true;
  const name = isLocallyResolved(expression) ? undefined : getOperatorName(expression);
  if (name !== undefined && environment.variableIndex.has(name)) return true;
  const definition = name === undefined ? undefined : getDefinition(name, environment);
  if (definition?.kind === "Operator" && !visited.has(definition)) {
    visited.add(definition);
    if (isVariableBound(definition.body, environment, visited)) return true;
  }
  const children =
    expression.kind === "Let"
      ? [
          ...expression.definitions
            .filter((item) => !isSubstitutionDefinition(item))
            .flatMap(getDefinitionExpressions),
          expression.body,
        ]
      : getChildren(expression);
  return children.some((child) => isVariableBound(child, environment, visited));
};

const describeSpecification = (
  expression: Expression,
  scope: Scope | undefined,
  environment: Environment,
  instanceActions: Map<string, InstanceAction>,
  description: SpecDescription,
  next: NextItem[],
  frames: Expression[] = [],
): void => {
  const recurse = (inner: Expression, innerScope: Scope | undefined, innerFrames = frames) =>
    describeSpecification(
      inner,
      innerScope,
      environment,
      instanceActions,
      description,
      next,
      innerFrames,
    );
  const substitutionFrame = frames.find((frame) => frameSubstitutions.has(frame));
  const createConjunct = (
    name: string,
    conjunct: Expression,
    conjunctScope: Scope | undefined,
  ) => ({
    ...createAction(name, withSubstitutionFrames(conjunct, frames), conjunctScope),
    location: substitutionFrame?.location ?? conjunct.location,
  });
  const letDefinition = getLocalDefinition(expression, scope);
  const thunk = letDefinition?.kind === "Operator" ? getThunk(expression, scope) : undefined;
  const isTlc174 = environment.runtime.version === "1.7.4";
  const unwrapped =
    thunk || (isTlc174 && expression.kind === "Let")
      ? undefined
      : unwrapBinding(expression, scope, environment);
  if (unwrapped) {
    recurse(unwrapped.expression, unwrapped.scope);
    return;
  }
  const called: Closure | undefined =
    letDefinition && thunk
      ? {
          kind: "Closure",
          name: letDefinition.name,
          params: [],
          body: thunk.expression,
          scope: thunk.scope,
        }
      : resolveClosure(expression, scope, environment);
  if (
    called &&
    getArguments(expression).length === 0 &&
    isConstantDefinition(called, expression, scope, environment)
  ) {
    return;
  }
  const calledFrames = called
    ? [...frames, ...(substitutionFrames.get(called.body) ?? [])]
    : frames;
  const isArgumentFree =
    called !== undefined &&
    (called.params.length === 0 ||
      (substitutionFrame !== undefined &&
        called.params.every((param) => environment.instanceParams.has(param))));
  if (called && isArgumentFree) {
    const calledScope = getCallScope(called, expression, scope, environment);
    if (
      getLevelBound(called.body, calledScope, environment) === VARIABLE_LEVEL &&
      (!substitutionFrame || isVariableBound(called.body, environment, new Set()))
    ) {
      const name = isLocallyResolved(expression) ? undefined : getOperatorName(expression);
      const written =
        expression.kind === "Identifier" || expression.kind === "Apply"
          ? instanceActions.get(expression.writtenKey ?? "")
          : undefined;
      description.inits.push({
        ...createConjunct(called.name, called.body, calledScope),
        ...(name === undefined
          ? getDefinitionRanges(letDefinition)
          : substitutionFrame
            ? written
              ? { name: written.name, head: written.head, body: written.body }
              : getDefinitionRanges(getDefinition(name, environment))
            : instanceActions.get(name)),
      });
      return;
    }
    recurse(called.body, calledScope, calledFrames);
    return;
  }
  // SpecProcessor#processConfigSpec takes an application apart only outside an instance's substitutions.
  if (
    called &&
    !isTlc174 &&
    !substitutionFrame &&
    expression.kind === "Apply" &&
    called.params.length === expression.args.length &&
    getBodyLiteral(called.body, environment) === undefined
  ) {
    recurse(
      called.body,
      bindUncachedArguments(called, expression.args, getConstantContext(environment, scope)),
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
  const level = getLevelBound(expression, scope, environment);
  // SpecProcessor#processConfigSpec drops a name whose value is TRUE, though it keeps a formula such as 1 = 1.
  if (
    expression.kind === "Identifier" &&
    level === CONSTANT_LEVEL &&
    evaluate(expression, getConstantContext(environment, scope)) === true
  ) {
    return;
  }
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
  description: PropertyDescription,
): void => {
  const recurse = (inner: Expression, innerScope: Scope | undefined) =>
    describeProperty(configName, inner, innerScope, environment, description);
  const unwrapped = unwrapBinding(expression, scope, environment);
  if (unwrapped) {
    recurse(unwrapped.expression, unwrapped.scope);
    return;
  }
  const called = resolveClosure(expression, scope, environment);
  if (
    called &&
    getArguments(expression).length === 0 &&
    isConstantDefinition(called, expression, scope, environment)
  ) {
    return;
  }
  if (
    called &&
    called.params.length === getArguments(expression).length &&
    getBodyLiteral(called.body, environment) === undefined
  ) {
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
    } else if (getLevelBound(inner, scope, environment) < ACTION_LEVEL) {
      description.invariants.push(createAction(configName, inner));
    } else {
      description.impliedTemporals.push(createAction(configName, expression));
    }
    return;
  }
  const level = getLevelBound(expression, scope, environment);
  if (level <= VARIABLE_LEVEL) {
    description.impliedInits.push(createAction(configName, expression));
  } else if (level === TEMPORAL_LEVEL) {
    description.impliedTemporals.push(createAction(configName, expression));
  }
};

const getOperatorDefinition = (name: string, environment: Environment) => {
  const definition = getDefinition(getRootKey(name, environment), environment);
  return definition?.kind === "Operator" && !isConstantValue(definition, environment)
    ? definition
    : undefined;
};

// Tool's constructor describes the specification once, so a caller keeps the description and never walks it again.
export const getSpecDescription = (
  config: ModelConfig,
  environment: Environment,
  instanceActions: Map<string, InstanceAction>,
) => {
  const description: SpecDescription = { inits: [], actions: [], temporals: [] };
  const next: NextItem[] = [];
  const specification =
    config.specification === undefined
      ? undefined
      : getOperatorDefinition(config.specification, environment);
  if (specification) {
    describeSpecification(
      specification.body,
      undefined,
      environment,
      instanceActions,
      description,
      next,
    );
    next.forEach((item) =>
      description.actions.push(
        ...(item.frames.length > 0
          ? [
              {
                name: UNNAMED_ACTION,
                location: item.frames[0].location,
                parameters: [],
                context: [],
                expression: withSubstitutionFrames(item.expression, item.frames),
                scope: item.scope,
              },
            ]
          : getActions(item.expression, item.scope, undefined, environment, instanceActions, [])),
      ),
    );
  }
  const init =
    config.init === undefined
      ? undefined
      : resolveGlobalOperator(getRootKey(config.init, environment), environment);
  if (init?.kind === "Closure") description.inits.push(createAction(config.init ?? "", init.body));
  const nextOperator =
    config.next === undefined
      ? undefined
      : resolveGlobalOperator(getRootKey(config.next, environment), environment);
  if (nextOperator?.kind === "Closure") {
    description.actions.push(
      ...getActions(
        nextOperator.body,
        nextOperator.scope,
        nextOperator,
        environment,
        instanceActions,
        [],
      ),
    );
  }
  // TLC creates the checker, which interns these, once Tool's constructor has split the next-state relation.
  TLC_RUNTIME_STRINGS.forEach(rankString);
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
    if (expression.kind === "Selection") return collect(expression.expression, innerScope);
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
    const definition = getCalledDefinition(expression, innerScope, environment);
    if (definition?.body === called.body && getLookupValue(definition, environment) !== undefined) {
      return true;
    }
    return collect(called.body, getCallScope(called, expression, innerScope, environment));
  };
  return collect(subscript, scope) ? variables : undefined;
};

const formatParameters = (action: SpecAction) =>
  action.parameters.length === 0
    ? ""
    : `(${action.parameters.map((parameter) => formatValue(parameter[1])).join(",")})`;

export const getActionLabel = (action: SpecAction, version?: TlcVersion, isInitial = false) =>
  `${action.name === UNNAMED_ACTION ? (isInitial ? "Initial predicate" : "Action") : action.name}${version === "1.7.4" ? "" : formatParameters(action)} ${formatRange(action.location.range ?? BUILTIN_RANGE)}`;

export const isNamedAction = (action: SpecAction) => action.name !== UNNAMED_ACTION;

export const getActionSignature = (action: SpecAction) =>
  `${action.name}${formatParameters(action)}`;

export const getSpecificationValue = (
  description: SpecDescription,
  config: ModelConfig,
  environment: Environment,
): Value => {
  const properties: PropertyDescription = {
    invariants: [],
    impliedInits: [],
    impliedActions: [],
    impliedTemporals: [],
  };
  config.invariants.forEach((name) => {
    const definition = getOperatorDefinition(name, environment);
    if (definition) properties.invariants.push(createAction(name, definition.body));
  });
  config.properties.forEach((name) => {
    const definition = getOperatorDefinition(name, environment);
    if (definition) describeProperty(name, definition.body, undefined, environment, properties);
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
    ["invariants", toSet(properties.invariants, "invariant")],
    ["impliedinits", toSet(properties.impliedInits, "implied")],
    ["impliedactions", toSet(properties.impliedActions, "implied")],
    ["impliedtemporals", toSet(properties.impliedTemporals)],
    [
      "variables",
      createSet(
        environment.variables.map((name, index) =>
          createRecord([
            ["name", name],
            ["location", toLocationValue(environment.variableLocations[index])],
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
