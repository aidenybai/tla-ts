import type {
  Bound,
  BoundPattern,
  Definition,
  ExceptPathStep,
  Expression,
  FunctionDefinition,
  OperatorParam,
} from "./ast";
import { TlaEvaluationError, TlaUnsupportedError } from "./errors";
import {
  applyFunction,
  checkInteger,
  createFunction,
  createRecord,
  createSet,
  createTuple,
  formatValue,
  getSequenceElements,
  getValueKey,
  isEnumerable,
  toFiniteSet,
  updateFunction,
  valuesEqual,
  type LazyFunctionValue,
  type Value,
} from "./values";

export type State = (Value | undefined)[];

export interface OperatorValue {
  kind: "Operator";
  name: string;
  arity: number;
  call: (args: Value[]) => Value;
}

export type BuiltinArgument = Value | OperatorValue;

export interface Builtin {
  kind: "Builtin";
  name: string;
  arity: number;
  evaluate: (args: BuiltinArgument[]) => Value;
}

export interface Closure {
  kind: "Closure";
  name: string;
  params: OperatorParam[];
  body: Expression;
  scope: Scope | undefined;
}

export type Operator = Closure | Builtin | OperatorValue;

export interface Thunk {
  kind: "Thunk";
  expression: Expression;
  scope: Scope | undefined;
  state: State | undefined;
  next: State | undefined;
  cache: Value | undefined;
}

export type Binding =
  | { kind: "Value"; value: Value }
  | Thunk
  | { kind: "Operator"; operator: Operator };

export interface Scope {
  name: string;
  binding: Binding;
  parent: Scope | undefined;
}

export type GlobalName =
  | { kind: "Local" }
  | { kind: "Variable"; index: number }
  | { kind: "Value"; value: Value }
  | { kind: "Definition"; definition: Definition };

export type GlobalOperator = { kind: "Local" } | { kind: "Global"; operator: Operator };

export interface Environment {
  definitions: Map<string, Definition>;
  builtins: Map<string, Builtin>;
  constants: Map<string, Value>;
  substitutions: Map<string, string>;
  variables: string[];
  variableIndex: Map<string, number>;
  definitionValues: Map<Definition, Value>;
  constantLevels: Map<Definition, boolean>;
}

export interface Context {
  environment: Environment;
  scope: Scope | undefined;
  state: State | undefined;
  next: State | undefined;
}

const EXCEPT_AT = "@";

export const lookupScope = (scope: Scope | undefined, name: string): Binding | undefined => {
  for (let current = scope; current; current = current.parent) {
    if (current.name === name) return current.binding;
  }
  return undefined;
};

export const bindValue = (scope: Scope | undefined, name: string, value: Value): Scope => ({
  name,
  binding: { kind: "Value", value },
  parent: scope,
});

export const bindPattern = (
  scope: Scope | undefined,
  pattern: BoundPattern,
  value: Value,
): Scope => {
  if (pattern.kind === "Name") return bindValue(scope, pattern.name, value);
  const elements = getSequenceElements(value);
  if (!elements || elements.length !== pattern.names.length) {
    throw new TlaEvaluationError(
      `Cannot bind <<${pattern.names.join(", ")}>> to ${formatValue(value)}, which is not a tuple of that length`,
    );
  }
  return pattern.names.reduce<Scope | undefined>(
    (current, name, index) => bindValue(current, name, elements[index]),
    scope,
  ) as Scope;
};

const withScope = (context: Context, scope: Scope | undefined): Context => ({
  environment: context.environment,
  scope,
  state: context.state,
  next: context.next,
});

export const expectBoolean = (value: Value, description: string) => {
  if (typeof value !== "boolean") {
    throw new TlaEvaluationError(
      `Expected ${description} to be a boolean but found ${formatValue(value)}`,
    );
  }
  return value;
};

const getChildren = (expression: Expression): Expression[] => {
  switch (expression.kind) {
    case "Number":
    case "String":
    case "Identifier":
    case "OperatorReference":
    case "ExceptAt":
      return [];
    case "Apply":
      return expression.args;
    case "Lambda":
      return [expression.body];
    case "And":
    case "Or":
      return expression.operands;
    case "Prime":
    case "Unchanged":
    case "Enabled":
    case "Always":
    case "Eventually":
      return [expression.expression];
    case "If":
      return [expression.condition, expression.consequent, expression.alternative];
    case "Case":
      return [
        ...expression.arms.flatMap((arm) => [arm.condition, arm.body]),
        ...(expression.other ? [expression.other] : []),
      ];
    case "Let":
      return [
        ...expression.definitions.flatMap((definition) =>
          definition.kind === "Function"
            ? [...definition.bounds.map((bound) => bound.set), definition.body]
            : [definition.body],
        ),
        expression.body,
      ];
    case "Forall":
    case "Exists":
      return [...expression.bounds.map((bound) => bound.set), expression.body];
    case "UnboundedQuantifier":
      return [expression.body];
    case "Choose":
      return [...(expression.set ? [expression.set] : []), expression.body];
    case "SetEnumeration":
    case "Tuple":
      return expression.elements;
    case "SetFilter":
      return [expression.bound.set, expression.predicate];
    case "SetMap":
      return [expression.expression, ...expression.bounds.map((bound) => bound.set)];
    case "FunctionConstruction":
      return [...expression.bounds.map((bound) => bound.set), expression.body];
    case "FunctionSet":
      return [expression.domain, expression.range];
    case "Record":
    case "RecordSet":
      return expression.fields.map((field) => field.value);
    case "Except":
      return [
        expression.function,
        ...expression.updates.flatMap((update) => [
          ...update.path.flatMap((step) => (step.kind === "Index" ? step.args : [])),
          update.value,
        ]),
      ];
    case "FunctionApplication":
      return [expression.function, ...expression.args];
    case "FieldAccess":
      return [expression.record];
    case "Product":
      return expression.factors;
    case "BoxAction":
    case "AngleAction":
      return [expression.action, expression.subscript];
    case "WeakFairness":
    case "StrongFairness":
      return [expression.subscript, expression.action];
  }
};

export const getDefinition = (name: string, environment: Environment) =>
  environment.definitions.get(environment.substitutions.get(name) ?? name);

const isStateDependent = (expression: Expression, environment: Environment): boolean => {
  if (
    expression.kind === "Prime" ||
    expression.kind === "Unchanged" ||
    expression.kind === "Enabled"
  ) {
    return true;
  }
  const name =
    expression.kind === "Identifier"
      ? expression.name
      : expression.kind === "Apply"
        ? expression.operator
        : undefined;
  if (name !== undefined) {
    if (environment.variableIndex.has(name)) return true;
    const definition = getDefinition(name, environment);
    if (definition && !environment.constants.has(name) && !isConstantLevel(definition, environment))
      return true;
  }
  return getChildren(expression).some((child) => isStateDependent(child, environment));
};

export const isConstantLevel = (definition: Definition, environment: Environment): boolean => {
  const cached = environment.constantLevels.get(definition);
  if (cached !== undefined) return cached;
  environment.constantLevels.set(definition, true);
  const isConstant =
    !isStateDependent(definition.body, environment) &&
    (definition.kind === "Operator" ||
      !definition.bounds.some((bound) => isStateDependent(bound.set, environment)));
  environment.constantLevels.set(definition, isConstant);
  return isConstant;
};

const getBoundSets = (bounds: Bound[], context: Context) =>
  bounds.map((bound) => {
    const set = evaluate(bound.set, context);
    if (!isEnumerable(set)) {
      throw new TlaEvaluationError(
        `TLC encountered a non-enumerable quantifier bound ${formatValue(set)} at line ${bound.set.location.line}, column ${bound.set.location.column}`,
      );
    }
    return toFiniteSet(set).elements;
  });

export const forEachBinding = (
  bounds: Bound[],
  context: Context,
  visit: (scope: Scope | undefined) => boolean,
): boolean => {
  const sets = getBoundSets(bounds, context);
  const visitBound = (index: number, scope: Scope | undefined): boolean => {
    if (index < 0) return visit(scope);
    return sets[index].some((element) =>
      visitBound(index - 1, bindPattern(scope, bounds[index].pattern, element)),
    );
  };
  return visitBound(bounds.length - 1, context.scope);
};

const getBoundsDomain = (bounds: Bound[], context: Context): Value => {
  const sets = bounds.map((bound) => evaluate(bound.set, context));
  return sets.length === 1 ? sets[0] : { kind: "ProductSet", factors: sets };
};

const bindArgument = (bounds: Bound[], scope: Scope | undefined, argument: Value) => {
  if (bounds.length === 1) return bindPattern(scope, bounds[0].pattern, argument);
  const components = getSequenceElements(argument) ?? [];
  return bounds.reduce<Scope | undefined>(
    (current, bound, index) => bindPattern(current, bound.pattern, components[index]),
    scope,
  );
};

const createLazyFunction = (
  domain: Value,
  compute: (argument: Value, self: LazyFunctionValue) => Value,
): LazyFunctionValue => {
  const memo = new Map<string, Value>();
  const self: LazyFunctionValue = {
    kind: "LazyFunction",
    domain,
    apply: (argument) => {
      const key = getValueKey(argument);
      const cached = memo.get(key);
      if (cached !== undefined) return cached;
      const value = compute(argument, self);
      memo.set(key, value);
      return value;
    },
  };
  return self;
};

const createRecursiveFunction = (definition: FunctionDefinition, context: Context) =>
  createLazyFunction(getBoundsDomain(definition.bounds, context), (argument, self) =>
    evaluate(
      definition.body,
      withScope(
        context,
        bindArgument(definition.bounds, bindValue(undefined, definition.name, self), argument),
      ),
    ),
  );

const evaluateDefinitionValue = (definition: Definition, context: Context): Value => {
  const isConstant = isConstantLevel(definition, context.environment);
  const cached = isConstant ? context.environment.definitionValues.get(definition) : undefined;
  if (cached !== undefined) return cached;
  if (definition.kind === "Operator" && definition.params.length > 0) {
    throw new TlaEvaluationError(
      `Operator ${definition.name} requires ${definition.params.length} arguments`,
    );
  }
  const topLevel = withScope(context, undefined);
  const value =
    definition.kind === "Function"
      ? createRecursiveFunction(definition, topLevel)
      : evaluate(definition.body, topLevel);
  if (isConstant) context.environment.definitionValues.set(definition, value);
  return value;
};

const forceThunk = (thunk: Thunk, context: Context) => {
  const isSameState = thunk.state === context.state && thunk.next === context.next;
  if (isSameState && thunk.cache !== undefined) return thunk.cache;
  const value = evaluate(thunk.expression, withScope(context, thunk.scope));
  if (isSameState) thunk.cache = value;
  return value;
};

const definitionClosures = new WeakMap<Definition, Closure>();

const getDefinitionClosure = (definition: Definition & { kind: "Operator" }) => {
  const cached = definitionClosures.get(definition);
  if (cached) return cached;
  const closure: Closure = {
    kind: "Closure",
    name: definition.name,
    params: definition.params,
    body: definition.body,
    scope: undefined,
  };
  definitionClosures.set(definition, closure);
  return closure;
};

export const resolveOperator = (name: string, context: Context): Operator | undefined => {
  const binding = lookupScope(context.scope, name);
  if (binding?.kind === "Operator") return binding.operator;
  if (binding) return undefined;
  const target = context.environment.substitutions.get(name);
  if (target !== undefined) return resolveOperator(target, context);
  const definition = context.environment.definitions.get(name);
  if (definition?.kind === "Operator") return getDefinitionClosure(definition);
  return context.environment.builtins.get(name);
};

const LOCAL_OPERATOR: GlobalOperator = { kind: "Local" };

export const resolveApplyOperator = (
  expression: Expression & { kind: "Apply" },
  context: Context,
): Operator | undefined => {
  const cached = expression.resolution;
  if (cached?.kind === "Global") return cached.operator;
  if (cached?.kind === "Local") return resolveOperator(expression.operator, context);
  const global = resolveOperator(expression.operator, withScope(context, undefined));
  expression.resolution = global ? { kind: "Global", operator: global } : LOCAL_OPERATOR;
  return global ?? resolveOperator(expression.operator, context);
};

const getArity = (operator: Operator) =>
  operator.kind === "Closure" ? operator.params.length : operator.arity;

const evaluateOperatorArgument = (expression: Expression, context: Context): Operator => {
  if (expression.kind === "Lambda") {
    return {
      kind: "Closure",
      name: "LAMBDA",
      params: expression.params.map((name) => ({ name, arity: 0 })),
      body: expression.body,
      scope: context.scope,
    };
  }
  const name =
    expression.kind === "OperatorReference"
      ? expression.operator
      : expression.kind === "Identifier"
        ? expression.name
        : undefined;
  const operator = name === undefined ? undefined : resolveOperator(name, context);
  if (!operator) {
    throw new TlaEvaluationError(
      `Expected an operator argument at line ${expression.location.line}, column ${expression.location.column}`,
    );
  }
  return operator;
};

export const callOperatorWithValues = (
  operator: Operator,
  args: Value[],
  context: Context,
): Value => {
  if (operator.kind === "Builtin") return operator.evaluate(args);
  if (operator.kind === "Operator") return operator.call(args);
  const scope = operator.params.reduce<Scope | undefined>(
    (current, param, index) => bindValue(current, param.name, args[index]),
    operator.scope,
  );
  return evaluate(operator.body, withScope(context, scope));
};

const toOperatorValue = (operator: Operator, context: Context): OperatorValue =>
  operator.kind === "Operator"
    ? operator
    : {
        kind: "Operator",
        name: operator.name,
        arity: getArity(operator),
        call: (args) => callOperatorWithValues(operator, args, context),
      };

const globalOperatorArguments = new WeakMap<Expression, boolean>();

const isOperatorArgument = (expression: Expression, context: Context) => {
  if (expression.kind === "Lambda" || expression.kind === "OperatorReference") return true;
  if (expression.kind !== "Identifier") return false;
  const binding = lookupScope(context.scope, expression.name);
  if (binding) return binding.kind === "Operator" && getArity(binding.operator) > 0;
  const cached = globalOperatorArguments.get(expression);
  if (cached !== undefined) return cached;
  const operator = resolveOperator(expression.name, context);
  const isOperator = operator !== undefined && getArity(operator) > 0;
  globalOperatorArguments.set(expression, isOperator);
  return isOperator;
};

export const bindOperatorArguments = (
  closure: Closure,
  args: Expression[],
  context: Context,
): Scope | undefined => {
  if (args.length !== closure.params.length) {
    throw new TlaEvaluationError(
      `Operator ${closure.name} expects ${closure.params.length} arguments but received ${args.length}`,
    );
  }
  return closure.params.reduce<Scope | undefined>((scope, param, index): Scope => {
    if (param.arity > 0) {
      return {
        name: param.name,
        binding: { kind: "Operator", operator: evaluateOperatorArgument(args[index], context) },
        parent: scope,
      };
    }
    return {
      name: param.name,
      binding: {
        kind: "Thunk",
        expression: args[index],
        scope: context.scope,
        state: context.state,
        next: context.next,
        cache: undefined,
      },
      parent: scope,
    };
  }, closure.scope);
};

const callOperator = (operator: Operator, args: Expression[], context: Context): Value => {
  if (operator.kind === "Closure") {
    return evaluate(
      operator.body,
      withScope(context, bindOperatorArguments(operator, args, context)),
    );
  }
  if (operator.kind === "Operator") return operator.call(args.map((arg) => evaluate(arg, context)));
  return operator.evaluate(
    args.map((arg) =>
      isOperatorArgument(arg, context)
        ? toOperatorValue(evaluateOperatorArgument(arg, context), context)
        : evaluate(arg, context),
    ),
  );
};

export const bindDefinitions = (definitions: Definition[], context: Context): Scope | undefined =>
  definitions.reduce<Scope | undefined>((scope, definition) => {
    const node: Scope = {
      name: definition.name,
      binding: { kind: "Value", value: false },
      parent: scope,
    };
    if (definition.kind === "Function") {
      node.binding = {
        kind: "Thunk",
        expression: {
          kind: "FunctionConstruction",
          bounds: definition.bounds,
          body: definition.body,
          location: definition.location,
          isRecursive: true,
        },
        scope: node,
        state: context.state,
        next: context.next,
        cache: undefined,
      };
      return node;
    }
    if (definition.params.length > 0) {
      node.binding = {
        kind: "Operator",
        operator: {
          kind: "Closure",
          name: definition.name,
          params: definition.params,
          body: definition.body,
          scope: node,
        },
      };
      return node;
    }
    node.binding = {
      kind: "Thunk",
      expression: definition.body,
      scope: node,
      state: context.state,
      next: context.next,
      cache: undefined,
    };
    return node;
  }, context.scope);

const LOCAL_NAME: GlobalName = { kind: "Local" };

const findGlobalName = (name: string, environment: Environment): GlobalName | undefined => {
  const variableIndex = environment.variableIndex.get(name);
  if (variableIndex !== undefined) return { kind: "Variable", index: variableIndex };
  const constant = environment.constants.get(name);
  if (constant !== undefined) return { kind: "Value", value: constant };
  const target = environment.substitutions.get(name);
  if (target !== undefined) return findGlobalName(target, environment);
  const definition = environment.definitions.get(name);
  if (definition) return { kind: "Definition", definition };
  const builtin = environment.builtins.get(name);
  if (builtin && builtin.arity === 0) return { kind: "Value", value: builtin.evaluate([]) };
  return undefined;
};

const evaluateName = (
  name: string,
  expression: Expression & { kind: "Identifier" },
  context: Context,
): Value => {
  const cached = expression.resolution;
  const resolution = cached ?? findGlobalName(name, context.environment) ?? LOCAL_NAME;
  if (cached === undefined) expression.resolution = resolution;
  if (resolution.kind === "Variable") {
    const value = context.state?.[resolution.index];
    if (value === undefined) {
      throw new TlaEvaluationError(
        `The variable ${name} is not assigned at line ${expression.location.line}, column ${expression.location.column}`,
      );
    }
    return value;
  }
  if (resolution.kind === "Value") return resolution.value;
  if (resolution.kind === "Definition" && resolution.definition.kind === "Operator") {
    return evaluateDefinitionValue(resolution.definition, context);
  }
  return evaluateIdentifier(name, expression, context);
};

const evaluateIdentifier = (name: string, expression: Expression, context: Context): Value => {
  const binding = lookupScope(context.scope, name);
  if (binding?.kind === "Value") return binding.value;
  if (binding?.kind === "Thunk") return forceThunk(binding, context);
  if (binding?.kind === "Operator") {
    if (getArity(binding.operator) === 0)
      return callOperatorWithValues(binding.operator, [], context);
    throw new TlaEvaluationError(`Operator ${name} is used without arguments`);
  }
  const environment = context.environment;
  const variableIndex = environment.variableIndex.get(name);
  if (variableIndex !== undefined) {
    const value = context.state?.[variableIndex];
    if (value === undefined) {
      throw new TlaEvaluationError(
        `The variable ${name} is not assigned at line ${expression.location.line}, column ${expression.location.column}`,
      );
    }
    return value;
  }
  const constant = environment.constants.get(name);
  if (constant !== undefined) return constant;
  const target = environment.substitutions.get(name);
  if (target !== undefined) return evaluateIdentifier(target, expression, context);
  const definition = environment.definitions.get(name);
  if (definition) return evaluateDefinitionValue(definition, context);
  const builtin = environment.builtins.get(name);
  if (builtin && builtin.arity === 0) return builtin.evaluate([]);
  throw new TlaEvaluationError(
    `Unknown identifier ${name} at line ${expression.location.line}, column ${expression.location.column}`,
  );
};

const evaluateApply = (expression: Expression & { kind: "Apply" }, context: Context): Value => {
  if (expression.operator === "=>") {
    return (
      !expectBoolean(evaluate(expression.args[0], context), "the left side of =>") ||
      expectBoolean(evaluate(expression.args[1], context), "the right side of =>")
    );
  }
  if (expression.operator === "~>") {
    throw new TlaUnsupportedError("Temporal formulas such as ~> cannot be evaluated in a state");
  }
  const operator = resolveApplyOperator(expression, context);
  if (operator) return callOperator(operator, expression.args, context);
  const definition = context.environment.definitions.get(expression.operator);
  if (definition?.kind === "Function") {
    throw new TlaEvaluationError(`${expression.operator} is a function; apply it with brackets`);
  }
  throw new TlaEvaluationError(
    `Unknown operator ${expression.operator} at line ${expression.location.line}, column ${expression.location.column}`,
  );
};

const getExceptKey = (step: ExceptPathStep, context: Context): Value => {
  if (step.kind === "Field") return step.name;
  const args = step.args.map((arg) => evaluate(arg, context));
  return args.length === 1 ? args[0] : createTuple(args);
};

const applyExceptUpdate = (
  value: Value,
  path: ExceptPathStep[],
  context: Context,
  computeValue: (previous: Value) => Value,
): Value => {
  if (path.length === 0) return computeValue(value);
  const key = getExceptKey(path[0], context);
  return updateFunction(value, key, (previous) =>
    applyExceptUpdate(previous, path.slice(1), context, computeValue),
  );
};

const evaluateFunctionConstruction = (
  expression: Expression & { kind: "FunctionConstruction" },
  context: Context,
) => {
  const domain = getBoundsDomain(expression.bounds, context);
  if (expression.isRecursive || !isEnumerable(domain)) {
    return createLazyFunction(domain, (argument) =>
      evaluate(
        expression.body,
        withScope(context, bindArgument(expression.bounds, context.scope, argument)),
      ),
    );
  }
  const pairs: [Value, Value][] = [];
  forEachBinding(expression.bounds, context, (scope) => {
    const key =
      expression.bounds.length === 1
        ? (lookupKey(expression.bounds[0].pattern, scope) ?? false)
        : createTuple(expression.bounds.map((bound) => lookupKey(bound.pattern, scope) ?? false));
    pairs.push([key, evaluate(expression.body, withScope(context, scope))]);
    return false;
  });
  return createFunction(pairs);
};

const lookupKey = (pattern: BoundPattern, scope: Scope | undefined): Value | undefined => {
  if (pattern.kind === "Tuple") {
    return createTuple(
      pattern.names.map((name) => {
        const binding = lookupScope(scope, name);
        return binding?.kind === "Value" ? binding.value : false;
      }),
    );
  }
  const binding = lookupScope(scope, pattern.name);
  return binding?.kind === "Value" ? binding.value : undefined;
};

export const evaluate = (expression: Expression, context: Context): Value => {
  const kind = expression.kind;
  if (kind === "Identifier") return evaluateName(expression.name, expression, context);
  if (kind === "Apply") return evaluateApply(expression, context);
  if (kind === "String") return expression.value;
  if (kind === "FunctionApplication") {
    const fn = evaluate(expression.function, context);
    if (expression.args.length === 1)
      return applyFunction(fn, evaluate(expression.args[0], context));
    return applyFunction(fn, createTuple(expression.args.map((arg) => evaluate(arg, context))));
  }
  if (kind === "Record") {
    return createRecord(
      expression.fields.map((field): [string, Value] => [
        field.name,
        evaluate(field.value, context),
      ]),
    );
  }
  switch (kind) {
    case "Number":
      return checkInteger(expression.value);
    case "OperatorReference":
    case "Lambda":
      throw new TlaEvaluationError(
        `An operator cannot be used as a value at line ${expression.location.line}, column ${expression.location.column}`,
      );
    case "And":
      return expression.operands.every((operand) =>
        expectBoolean(evaluate(operand, context), "a conjunct"),
      );
    case "Or":
      return expression.operands.some((operand) =>
        expectBoolean(evaluate(operand, context), "a disjunct"),
      );
    case "Prime": {
      if (!context.next) {
        throw new TlaEvaluationError(
          `A primed expression appears outside an action at line ${expression.location.line}, column ${expression.location.column}`,
        );
      }
      return evaluate(expression.expression, {
        environment: context.environment,
        scope: context.scope,
        state: context.next,
        next: undefined,
      });
    }
    case "Unchanged":
      return valuesEqual(
        evaluate(
          { kind: "Prime", expression: expression.expression, location: expression.location },
          context,
        ),
        evaluate(expression.expression, context),
      );
    case "If":
      return expectBoolean(evaluate(expression.condition, context), "an IF condition")
        ? evaluate(expression.consequent, context)
        : evaluate(expression.alternative, context);
    case "Case": {
      const arm = expression.arms.find((candidate) =>
        expectBoolean(evaluate(candidate.condition, context), "a CASE guard"),
      );
      if (arm) return evaluate(arm.body, context);
      if (expression.other) return evaluate(expression.other, context);
      throw new TlaEvaluationError(
        `No CASE guard is true at line ${expression.location.line}, column ${expression.location.column}`,
      );
    }
    case "Let":
      return evaluate(
        expression.body,
        withScope(context, bindDefinitions(expression.definitions, context)),
      );
    case "Forall":
      return !forEachBinding(
        expression.bounds,
        context,
        (scope) =>
          !expectBoolean(evaluate(expression.body, withScope(context, scope)), "the body of \\A"),
      );
    case "Exists":
      return forEachBinding(expression.bounds, context, (scope) =>
        expectBoolean(evaluate(expression.body, withScope(context, scope)), "the body of \\E"),
      );
    case "UnboundedQuantifier":
      throw new TlaEvaluationError(
        `TLC cannot evaluate an unbounded quantifier at line ${expression.location.line}, column ${expression.location.column}`,
      );
    case "Choose": {
      if (!expression.set) {
        throw new TlaEvaluationError(
          `TLC cannot evaluate an unbounded CHOOSE at line ${expression.location.line}, column ${expression.location.column}`,
        );
      }
      const bound = { pattern: expression.pattern, set: expression.set };
      const chosen = { value: undefined as Value | undefined };
      forEachBinding([bound], context, (scope) => {
        if (
          !expectBoolean(evaluate(expression.body, withScope(context, scope)), "the body of CHOOSE")
        )
          return false;
        chosen.value = lookupKey(expression.pattern, scope);
        return true;
      });
      if (chosen.value === undefined) {
        throw new TlaEvaluationError(
          `Attempted to compute CHOOSE x \\in S : P, but no element of S satisfies P at line ${expression.location.line}, column ${expression.location.column}`,
        );
      }
      return chosen.value;
    }
    case "SetEnumeration":
      return createSet(expression.elements.map((element) => evaluate(element, context)));
    case "SetFilter": {
      const elements: Value[] = [];
      forEachBinding([expression.bound], context, (scope) => {
        if (
          expectBoolean(
            evaluate(expression.predicate, withScope(context, scope)),
            "a set filter predicate",
          )
        ) {
          elements.push(lookupKey(expression.bound.pattern, scope) ?? false);
        }
        return false;
      });
      return createSet(elements);
    }
    case "SetMap": {
      const elements: Value[] = [];
      forEachBinding(expression.bounds, context, (scope) => {
        elements.push(evaluate(expression.expression, withScope(context, scope)));
        return false;
      });
      return createSet(elements);
    }
    case "Tuple":
      return createTuple(expression.elements.map((element) => evaluate(element, context)));
    case "FunctionConstruction":
      return evaluateFunctionConstruction(expression, context);
    case "FunctionSet":
      return {
        kind: "FunctionSet",
        domain: evaluate(expression.domain, context),
        range: evaluate(expression.range, context),
      };
    case "RecordSet": {
      const fields = [...expression.fields].sort((left, right) =>
        left.name < right.name ? -1 : 1,
      );
      return {
        kind: "RecordSet",
        names: fields.map((field) => field.name),
        sets: fields.map((field) => evaluate(field.value, context)),
      };
    }
    case "Except":
      return expression.updates.reduce(
        (current, update) =>
          applyExceptUpdate(current, update.path, context, (previous) =>
            evaluate(
              update.value,
              withScope(context, bindValue(context.scope, EXCEPT_AT, previous)),
            ),
          ),
        evaluate(expression.function, context),
      );
    case "ExceptAt": {
      const binding = lookupScope(context.scope, EXCEPT_AT);
      if (binding?.kind !== "Value") {
        throw new TlaEvaluationError(
          `@ appears outside an EXCEPT at line ${expression.location.line}, column ${expression.location.column}`,
        );
      }
      return binding.value;
    }
    case "FieldAccess":
      return applyFunction(evaluate(expression.record, context), expression.field);
    case "Product":
      return {
        kind: "ProductSet",
        factors: expression.factors.map((factor) => evaluate(factor, context)),
      };
    case "BoxAction":
      return (
        expectBoolean(evaluate(expression.action, context), "an action") ||
        evaluate(
          { kind: "Unchanged", expression: expression.subscript, location: expression.location },
          context,
        )
      );
    case "AngleAction":
      return (
        expectBoolean(evaluate(expression.action, context), "an action") &&
        !evaluate(
          { kind: "Unchanged", expression: expression.subscript, location: expression.location },
          context,
        )
      );
    case "Enabled":
      throw new TlaUnsupportedError("ENABLED is not supported yet");
    case "Always":
    case "Eventually":
    case "WeakFairness":
    case "StrongFairness":
      throw new TlaUnsupportedError(
        `Temporal formulas cannot be evaluated in a state (line ${expression.location.line}, column ${expression.location.column})`,
      );
  }
};
