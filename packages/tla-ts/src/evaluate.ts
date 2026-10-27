import type {
  Bound,
  BoundPattern,
  Definition,
  Expression,
  FunctionDefinition,
  OperatorParam,
  RecordField,
} from "./ast";
import { TlaEvaluationError } from "./errors";
import { generateEvaluator } from "./codegen";
import type { CheckerRuntime } from "./runtime";
import { getReadVariables } from "./dependencies";
import { mapChildren, substitutedExpressions } from "./instances";
import { isEnabled } from "./successors";
import {
  applyFunction,
  checkInteger,
  compareValues,
  createFunction,
  createSet,
  createSortedFunction,
  createSortedSet,
  createTuple,
  formatValue,
  getSequenceElements,
  getValueHash,
  isEnumerable,
  isSameValue,
  isSetValue,
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
  expression?: Expression;
}

export type BuiltinArgument = Value | OperatorValue;

export interface Builtin {
  kind: "Builtin";
  name: string;
  arity: number;
  evaluate: (args: BuiltinArgument[], context?: Context) => Value;
  evaluateUnary: ((value: Value) => Value) | undefined;
  evaluateBinary: ((left: Value, right: Value) => Value) | undefined;
  isStateLevel?: boolean;
  isLazy?: boolean;
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

export interface Environment {
  runtime: CheckerRuntime;
  definitions: Map<string, Definition>;
  builtins: Map<string, Builtin>;
  constants: Map<string, Value>;
  substitutions: Map<string, string>;
  variables: string[];
  variableIndex: Map<string, number>;
  definitionValues: Map<Definition, Value>;
  constantLevels: Map<Definition, boolean>;
  evaluators: WeakMap<Expression, Evaluator>;
}

export interface Context {
  environment: Environment;
  scope: Scope | undefined;
  state: State | undefined;
  next: State | undefined;
}

export type Evaluator = (context: Context) => Value;

type ArgumentBinder = (context: Context) => Binding;

type GlobalName =
  | { kind: "Variable"; index: number }
  | { kind: "Value"; value: Value }
  | { kind: "Definition"; definition: Definition };

const EXCEPT_AT = "@";

const describeLocation = (expression: Expression) =>
  `line ${expression.location.line}, column ${expression.location.column}`;

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

export const getChildren = (expression: Expression): Expression[] => {
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
    case "Label":
      return [expression.body];
    case "Subexpression":
      return expression.selectors.flatMap((selector) => ("args" in selector ? selector.args : []));
  }
};

export const isLocallyResolved = (expression: Expression) =>
  (expression.kind === "Identifier" || expression.kind === "Apply") &&
  expression.resolution?.kind === "Local";

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
    if (environment.variableIndex.has(name) || environment.builtins.get(name)?.isStateLevel)
      return true;
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

export const getEnumeratedElements = (set: Value, expression: Expression) => {
  if (!isEnumerable(set)) {
    throw new TlaEvaluationError(
      `TLC encountered a non-enumerable quantifier bound ${formatValue(set)} at ${describeLocation(expression)}`,
    );
  }
  return toFiniteSet(set).elements;
};

export const forEachBinding = (
  bounds: Bound[],
  context: Context,
  visit: (scope: Scope | undefined) => boolean,
): boolean => {
  const sets = bounds.map((bound) =>
    getEnumeratedElements(evaluate(bound.set, context), bound.set),
  );
  const visitBound = (index: number, scope: Scope | undefined): boolean => {
    if (index < 0) return visit(scope);
    return sets[index].some((element) =>
      visitBound(index - 1, bindPattern(scope, bounds[index].pattern, element)),
    );
  };
  return visitBound(bounds.length - 1, context.scope);
};

export const getBoundsDomain = (bounds: Bound[], context: Context): Value => {
  const sets = bounds.map((bound) => evaluate(bound.set, context));
  return sets.length === 1 ? sets[0] : { kind: "ProductSet", factors: sets };
};

export const bindArgument = (bounds: Bound[], scope: Scope | undefined, argument: Value) => {
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
  const memo = new Map<number, Value[]>();
  const self: LazyFunctionValue = {
    kind: "LazyFunction",
    domain,
    apply: (argument) => {
      const hash = getValueHash(argument);
      const bucket = memo.get(hash);
      if (bucket !== undefined) {
        for (let index = 0; index < bucket.length; index += 2) {
          if (isSameValue(bucket[index], argument)) return bucket[index + 1];
        }
      }
      const value = compute(argument, self);
      const current = memo.get(hash);
      if (current === undefined) memo.set(hash, [argument, value]);
      else current.push(argument, value);
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

const evaluateDefinitionBody = (definition: Definition, context: Context) =>
  definition.kind === "Function"
    ? createRecursiveFunction(definition, context)
    : evaluate(definition.body, context);

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
  if (!isConstant) return evaluateDefinitionBody(definition, topLevel);
  const value = context.environment.runtime.evaluateAtStartup(() =>
    evaluateDefinitionBody(definition, topLevel),
  );
  context.environment.definitionValues.set(definition, value);
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

export const resolveGlobalOperator = (
  name: string,
  environment: Environment,
): Operator | undefined => {
  const target = environment.substitutions.get(name);
  if (target !== undefined) return resolveGlobalOperator(target, environment);
  const definition = environment.definitions.get(name);
  if (definition?.kind === "Operator") return getDefinitionClosure(definition);
  return environment.builtins.get(name);
};

const globalApplyOperators = new WeakMap<Expression, Operator | null>();

export const resolveApplyOperator = (
  expression: Expression & { kind: "Apply" },
  context: Context,
): Operator | undefined => {
  if (isLocallyResolved(expression)) return resolveOperator(expression.operator, context);
  const cached = globalApplyOperators.get(expression);
  const global =
    cached === undefined
      ? (resolveGlobalOperator(expression.operator, context.environment) ?? null)
      : cached;
  if (cached === undefined) globalApplyOperators.set(expression, global);
  return global ?? resolveOperator(expression.operator, context);
};

export const resolveOperator = (name: string, context: Context): Operator | undefined => {
  const binding = lookupScope(context.scope, name);
  if (binding?.kind === "Operator") return binding.operator;
  if (binding) return undefined;
  return resolveGlobalOperator(name, context.environment);
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
      `Expected an operator argument at ${describeLocation(expression)}`,
    );
  }
  return operator;
};

export const callOperatorWithValues = (
  operator: Operator,
  args: Value[],
  context: Context,
): Value => {
  if (operator.kind === "Builtin") return operator.evaluate(args, context);
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

const isOperatorArgument = (expression: Expression, context: Context) => {
  if (expression.kind === "Lambda" || expression.kind === "OperatorReference") return true;
  if (expression.kind !== "Identifier") return false;
  const operator = resolveOperator(expression.name, context);
  return operator !== undefined && getArity(operator) > 0;
};

const createThunk = (expression: Expression, context: Context): Thunk => ({
  kind: "Thunk",
  expression,
  scope: context.scope,
  state: context.state,
  next: context.next,
  cache: undefined,
});

export const findGlobalName = (name: string, environment: Environment): GlobalName | undefined => {
  const variableIndex = environment.variableIndex.get(name);
  if (variableIndex !== undefined) return { kind: "Variable", index: variableIndex };
  const constant = environment.constants.get(name);
  if (constant !== undefined) return { kind: "Value", value: constant };
  const target = environment.substitutions.get(name);
  if (target !== undefined) return findGlobalName(target, environment);
  const definition = environment.definitions.get(name);
  if (definition) return { kind: "Definition", definition };
  const builtin = environment.builtins.get(name);
  if (builtin && builtin.arity === 0 && !builtin.isStateLevel) {
    return { kind: "Value", value: builtin.evaluate([]) };
  }
  return undefined;
};

const compileArgumentBinder = (argument: Expression, environment: Environment): ArgumentBinder => {
  const isLiteral =
    argument.kind === "String" || (argument.kind === "Number" && isTlcInteger(argument.value));
  if (isLiteral) {
    const binding: Binding = { kind: "Value", value: argument.value };
    return () => binding;
  }
  if (argument.kind === "Identifier") {
    const global = isLocallyResolved(argument)
      ? undefined
      : findGlobalName(argument.name, environment);
    if (global?.kind === "Value") {
      const binding: Binding = { kind: "Value", value: global.value };
      return () => binding;
    }
    if (global === undefined) {
      return (context) => {
        const binding = lookupScope(context.scope, argument.name);
        return binding?.kind === "Value" ? binding : createThunk(argument, context);
      };
    }
  }
  return (context) => createThunk(argument, context);
};

const argumentBinders = new WeakMap<Expression, ArgumentBinder>();

const getArgumentBinder = (argument: Expression, environment: Environment) => {
  const cached = argumentBinders.get(argument);
  if (cached) return cached;
  const binder = compileArgumentBinder(argument, environment);
  argumentBinders.set(argument, binder);
  return binder;
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
  let scope = closure.scope;
  for (let index = 0; index < args.length; index++) {
    const param = closure.params[index];
    const binding: Binding =
      param.arity > 0
        ? { kind: "Operator", operator: evaluateOperatorArgument(args[index], context) }
        : getArgumentBinder(args[index], context.environment)(context);
    scope = { name: param.name, binding, parent: scope };
  }
  return scope;
};

const callOperator = (operator: Operator, args: Expression[], context: Context): Value => {
  if (operator.kind === "Closure") {
    return evaluate(
      operator.body,
      withScope(context, bindOperatorArguments(operator, args, context)),
    );
  }
  if (operator.kind === "Operator") return operator.call(args.map((arg) => evaluate(arg, context)));
  if (operator.isLazy) return operator.evaluate(getLazyArguments(args, context), context);
  return operator.evaluate(
    args.map((arg) =>
      isOperatorArgument(arg, context)
        ? toOperatorValue(evaluateOperatorArgument(arg, context), context)
        : evaluate(arg, context),
    ),
    context,
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

const evaluateLocalIdentifier = (name: string, expression: Expression, context: Context): Value => {
  const binding = lookupScope(context.scope, name);
  if (binding?.kind === "Value") return binding.value;
  if (binding?.kind === "Thunk") return forceThunk(binding, context);
  if (binding?.kind === "Operator") {
    if (getArity(binding.operator) === 0) {
      return callOperatorWithValues(binding.operator, [], context);
    }
    throw new TlaEvaluationError(`Operator ${name} is used without arguments`);
  }
  const global = findGlobalName(name, context.environment);
  if (global?.kind === "Variable") {
    const value = context.state?.[global.index];
    if (value === undefined) {
      throw new TlaEvaluationError(
        `The variable ${name} is not assigned at ${describeLocation(expression)}`,
      );
    }
    return value;
  }
  if (global?.kind === "Value") return global.value;
  if (global?.kind === "Definition") return evaluateDefinitionValue(global.definition, context);
  const builtin = context.environment.builtins.get(name);
  if (builtin?.arity === 0) return builtin.evaluate([], context);
  throw new TlaEvaluationError(`Unknown identifier ${name} at ${describeLocation(expression)}`);
};

const isTlcInteger = (value: number) =>
  Number.isInteger(value) && value <= 2147483647 && value >= -2147483648;

export const IMPURE_BUILTINS = new Set([
  "Print",
  "PrintT",
  "Assert",
  "JavaTime",
  "RandomElement",
  "TLCGet",
  "TLCSet",
]);

export const isImpureBuiltin = (name: string, environment: Environment) =>
  IMPURE_BUILTINS.has(name) || environment.builtins.get(name)?.isStateLevel === true;

const closedConstants = new WeakMap<Expression, boolean>();

export const isClosedConstant = (expression: Expression, environment: Environment): boolean => {
  const cached = closedConstants.get(expression);
  if (cached !== undefined) return cached;
  const isClosed = computeIsClosedConstant(expression, environment, NO_BOUND_NAMES);
  closedConstants.set(expression, isClosed);
  return isClosed;
};

const CLOSED_KINDS = new Set([
  "Number",
  "String",
  "Identifier",
  "Apply",
  "And",
  "Or",
  "If",
  "Case",
  "SetEnumeration",
  "Tuple",
  "FunctionSet",
  "Record",
  "RecordSet",
  "FunctionApplication",
  "FieldAccess",
  "Product",
  "SetFilter",
  "SetMap",
  "Forall",
  "Exists",
  "Choose",
  "FunctionConstruction",
  "Let",
]);

const NO_BOUND_NAMES: ReadonlySet<string> = new Set();

const isClosedIn = (
  expression: Expression,
  environment: Environment,
  bound: ReadonlySet<string>,
): boolean =>
  bound.size === 0
    ? isClosedConstant(expression, environment)
    : computeIsClosedConstant(expression, environment, bound);

const computeIsClosedConstant = (
  expression: Expression,
  environment: Environment,
  bound: ReadonlySet<string>,
): boolean => {
  if (!CLOSED_KINDS.has(expression.kind)) return false;
  if (expression.kind === "Identifier" && isLocallyResolved(expression)) {
    return bound.has(expression.name);
  }
  if (isLocallyResolved(expression)) return false;
  if (expression.kind === "Identifier") {
    const global = findGlobalName(expression.name, environment);
    if (global?.kind === "Value") return true;
    return (
      global?.kind === "Definition" &&
      global.definition.kind === "Operator" &&
      global.definition.params.length === 0 &&
      isConstantLevel(global.definition, environment)
    );
  }
  if (expression.kind === "Apply") {
    if (isImpureBuiltin(expression.operator, environment) || expression.operator === "~>") {
      return false;
    }
    const operator = resolveGlobalOperator(expression.operator, environment);
    const isPure =
      operator?.kind === "Builtin" ||
      (operator?.kind === "Closure" &&
        (() => {
          const definition = environment.definitions.get(
            environment.substitutions.get(expression.operator) ?? expression.operator,
          );
          return definition !== undefined && isConstantLevel(definition, environment);
        })());
    if (!isPure || operator === undefined) return false;
    const params = operator.kind === "Closure" ? operator.params : [];
    const hasOperatorArgument = params.some((param) => param.arity > 0);
    if (hasOperatorArgument) return false;
    return expression.args.every(
      (arg) =>
        arg.kind !== "Lambda" &&
        arg.kind !== "OperatorReference" &&
        isClosedIn(arg, environment, bound),
    );
  }
  const isClosed = { value: true };
  mapChildren(expression, (child, names) => {
    isClosed.value &&= isClosedIn(
      child,
      environment,
      names.length === 0 ? bound : new Set([...bound, ...names]),
    );
    return child;
  });
  return isClosed.value;
};

export const isWorthCaching = (expression: Expression) =>
  expression.kind !== "Number" && expression.kind !== "String" && expression.kind !== "Identifier";

const cacheFirstValue = (evaluator: Evaluator): Evaluator => {
  const cache = { value: undefined as Value | undefined };
  return (context) => {
    if (cache.value !== undefined) return cache.value;
    const value = evaluator(context);
    cache.value = value;
    return value;
  };
};

const hasFreeLocals = (expression: Expression, bound: ReadonlySet<string>): boolean => {
  if (expression.kind === "Identifier" && isLocallyResolved(expression)) {
    return !bound.has(expression.name);
  }
  if (isLocallyResolved(expression)) return true;
  const isFree = { value: false };
  mapChildren(expression, (child, names) => {
    isFree.value ||= hasFreeLocals(
      child,
      names.length === 0 ? bound : new Set([...bound, ...names]),
    );
    return child;
  });
  return isFree.value;
};

const isStateCached = (expression: Expression, environment: Environment) =>
  substitutedExpressions.has(expression) &&
  isWorthCaching(expression) &&
  getReadVariables(expression, environment) !== undefined &&
  !hasFreeLocals(expression, NO_BOUND_NAMES);

export const getEvaluator = (expression: Expression, environment: Environment): Evaluator => {
  const cached = environment.evaluators.get(expression);
  if (cached) return cached;
  const compiled = compile(expression, environment);
  const evaluator =
    isWorthCaching(expression) && isClosedConstant(expression, environment)
      ? cacheFirstValue(compiled)
      : isStateCached(expression, environment)
        ? cacheStateValue(compiled)
        : compiled;
  environment.evaluators.set(expression, evaluator);
  return evaluator;
};

const entryEvaluators = new WeakMap<Expression, Evaluator>();

const getEntryEvaluator = (expression: Expression, environment: Environment): Evaluator => {
  const cached = entryEvaluators.get(expression);
  if (cached) return cached;
  const evaluator =
    (isWorthCaching(expression) && isClosedConstant(expression, environment)
      ? undefined
      : generateEvaluator(expression, environment)) ?? getEvaluator(expression, environment);
  entryEvaluators.set(expression, evaluator);
  return evaluator;
};

export const evaluate = (expression: Expression, context: Context): Value =>
  getEntryEvaluator(expression, context.environment)(context);

const compileIdentifier = (
  expression: Expression & { kind: "Identifier" },
  environment: Environment,
): Evaluator => {
  const name = expression.name;
  const global = isLocallyResolved(expression) ? undefined : findGlobalName(name, environment);
  if (global?.kind === "Variable") {
    const index = global.index;
    return (context) => {
      const value = context.state?.[index];
      if (value === undefined) {
        throw new TlaEvaluationError(
          `The variable ${name} is not assigned at ${describeLocation(expression)}`,
        );
      }
      return value;
    };
  }
  if (global?.kind === "Value") {
    const value = global.value;
    return () => value;
  }
  if (global?.kind === "Definition" && global.definition.kind === "Operator") {
    const definition = global.definition;
    if (definition.params.length === 0 && isConstantLevel(definition, environment)) {
      return (context) => evaluateDefinitionValue(definition, context);
    }
    if (definition.params.length === 0) {
      const compiled = { body: undefined as Evaluator | undefined };
      const evaluator: Evaluator = (context) => {
        compiled.body ??= getEntryEvaluator(definition.body, environment);
        return compiled.body(withScope(context, undefined));
      };
      return isStatePure(definition, environment) ? cacheStateValue(evaluator) : evaluator;
    }
    return (context) => evaluateDefinitionValue(definition, context);
  }
  if (global?.kind === "Definition") {
    const definition = global.definition;
    const evaluator: Evaluator = (context) => evaluateDefinitionValue(definition, context);
    return isConstantLevel(definition, environment) || !isStatePure(definition, environment)
      ? evaluator
      : cacheStateValue(evaluator);
  }
  return (context) => evaluateLocalIdentifier(name, expression, context);
};

const isStatePure = (definition: Definition, environment: Environment) =>
  getReadVariables(definition.body, environment) !== undefined &&
  (definition.kind === "Operator" ||
    definition.bounds.every((bound) => getReadVariables(bound.set, environment) !== undefined));

const cacheStateValue = (evaluator: Evaluator): Evaluator => {
  const cache = {
    recent: undefined as Context["state"],
    recentValue: undefined as Value | undefined,
    previous: undefined as Context["state"],
    previousValue: undefined as Value | undefined,
  };
  return (context) => {
    const state = context.state;
    if (state !== undefined && cache.recent === state && cache.recentValue !== undefined) {
      return cache.recentValue;
    }
    if (state !== undefined && cache.previous === state && cache.previousValue !== undefined) {
      return cache.previousValue;
    }
    const value = evaluator(context);
    cache.previous = cache.recent;
    cache.previousValue = cache.recentValue;
    cache.recent = state;
    cache.recentValue = value;
    return value;
  };
};

const isOperatorName = (name: string, environment: Environment) => {
  const operator = resolveGlobalOperator(name, environment);
  return operator !== undefined && getArity(operator) > 0;
};

export const isValueArgument = (argument: Expression, environment: Environment) =>
  argument.kind !== "Lambda" &&
  argument.kind !== "OperatorReference" &&
  !(
    argument.kind === "Identifier" &&
    !isLocallyResolved(argument) &&
    isOperatorName(argument.name, environment)
  );

const getLazyArguments = (args: Expression[], context: Context): OperatorValue[] =>
  args.map((arg) => ({
    kind: "Operator",
    name: "argument",
    arity: 0,
    call: () => evaluate(arg, context),
    expression: arg,
  }));

const compileBuiltinCall = (
  builtin: Builtin,
  args: Expression[],
  environment: Environment,
): Evaluator => {
  if (builtin.isLazy) {
    return (context) => builtin.evaluate(getLazyArguments(args, context), context);
  }
  const unary = builtin.evaluateUnary;
  if (unary && args.length === 1 && isValueArgument(args[0], environment)) {
    const operand = getEvaluator(args[0], environment);
    return (context) => unary(operand(context));
  }
  const binary = builtin.evaluateBinary;
  const isBinary =
    args.length === 2 &&
    isValueArgument(args[0], environment) &&
    isValueArgument(args[1], environment);
  if (binary && isBinary) {
    const left = getEvaluator(args[0], environment);
    const right = getEvaluator(args[1], environment);
    return (context) => binary(left(context), right(context));
  }
  return (context) =>
    builtin.evaluate(
      args.map((arg) =>
        isOperatorArgument(arg, context)
          ? toOperatorValue(evaluateOperatorArgument(arg, context), context)
          : evaluate(arg, context),
      ),
      context,
    );
};

export const compileArgumentScope = (
  closure: Closure,
  args: Expression[],
  environment: Environment,
): ((context: Context) => Scope | undefined) => {
  if (args.length !== closure.params.length) {
    return () => {
      throw new TlaEvaluationError(
        `Operator ${closure.name} expects ${closure.params.length} arguments but received ${args.length}`,
      );
    };
  }
  const params = closure.params;
  const binders = args.map((arg, index) =>
    params[index].arity > 0 ? undefined : getArgumentBinder(arg, environment),
  );
  return (context) => {
    let scope = closure.scope;
    for (let index = 0; index < args.length; index++) {
      const binder = binders[index];
      const binding: Binding = binder
        ? binder(context)
        : { kind: "Operator", operator: evaluateOperatorArgument(args[index], context) };
      scope = { name: params[index].name, binding, parent: scope };
    }
    return scope;
  };
};

const compileClosureCall = (
  closure: Closure,
  args: Expression[],
  environment: Environment,
): Evaluator => {
  const bindArguments = compileArgumentScope(closure, args, environment);
  const compiled = { body: undefined as Evaluator | undefined };
  return (context) => {
    const scope = bindArguments(context);
    compiled.body ??= getEntryEvaluator(closure.body, environment);
    return compiled.body({ environment, scope, state: context.state, next: context.next });
  };
};

const compileApply = (
  expression: Expression & { kind: "Apply" },
  environment: Environment,
): Evaluator => {
  const args = expression.args;
  if (expression.operator === "=>") {
    const left = getEvaluator(args[0], environment);
    const right = getEvaluator(args[1], environment);
    return (context) =>
      !expectBoolean(left(context), "the left side of =>") ||
      expectBoolean(right(context), "the right side of =>");
  }
  if (expression.operator === "~>") {
    return () => {
      throw new TlaEvaluationError("TLC cannot evaluate a temporal formula such as ~> in a state");
    };
  }
  const global = isLocallyResolved(expression)
    ? undefined
    : resolveGlobalOperator(expression.operator, environment);
  if (global?.kind === "Closure") return compileClosureCall(global, args, environment);
  if (global?.kind === "Builtin") return compileBuiltinCall(global, args, environment);
  return (context) => {
    const operator = resolveOperator(expression.operator, context);
    if (operator) return callOperator(operator, args, context);
    const definition = environment.definitions.get(expression.operator);
    if (definition?.kind === "Function") {
      throw new TlaEvaluationError(`${expression.operator} is a function; apply it with brackets`);
    }
    throw new TlaEvaluationError(
      `Unknown operator ${expression.operator} at ${describeLocation(expression)}`,
    );
  };
};

const compileQuantifier = (
  expression: Expression & { kind: "Forall" | "Exists" },
  environment: Environment,
): Evaluator => {
  const isForall = expression.kind === "Forall";
  const description = isForall ? "the body of \\A" : "the body of \\E";
  const body = getEvaluator(expression.body, environment);
  const bound = expression.bounds[0];
  if (expression.bounds.length === 1 && bound.pattern.kind === "Name") {
    const name = bound.pattern.name;
    const set = getEvaluator(bound.set, environment);
    return (context) => {
      const elements = getEnumeratedElements(set(context), bound.set);
      for (let index = 0; index < elements.length; index++) {
        const result = expectBoolean(
          body(withScope(context, bindValue(context.scope, name, elements[index]))),
          description,
        );
        if (result !== isForall) return result;
      }
      return isForall;
    };
  }
  const bounds = expression.bounds;
  if (bounds.every((item) => item.pattern.kind === "Name")) {
    const names = bounds.map((item) => (item.pattern.kind === "Name" ? item.pattern.name : ""));
    const sets = bounds.map((item) => getEvaluator(item.set, environment));
    return (context) => {
      const lists = sets.map((set, index) =>
        getEnumeratedElements(set(context), bounds[index].set),
      );
      const visit = (index: number, scope: Scope | undefined): boolean => {
        if (index < 0) {
          return expectBoolean(body(withScope(context, scope)), description) !== isForall;
        }
        const list = lists[index];
        for (let position = 0; position < list.length; position++) {
          if (visit(index - 1, bindValue(scope, names[index], list[position]))) return true;
        }
        return false;
      };
      return visit(bounds.length - 1, context.scope) ? !isForall : isForall;
    };
  }
  return (context) => {
    const isFound = forEachBinding(
      bounds,
      context,
      (scope) => expectBoolean(body(withScope(context, scope)), description) !== isForall,
    );
    return isFound ? !isForall : isForall;
  };
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

const compileFunctionConstruction = (
  expression: Expression & { kind: "FunctionConstruction" },
  environment: Environment,
): Evaluator => {
  const body = getEvaluator(expression.body, environment);
  const bounds = expression.bounds;
  const bound = bounds[0];
  const isSingleName = bounds.length === 1 && bound.pattern.kind === "Name";
  const set = getEvaluator(bound.set, environment);
  return (context) => {
    const domain = isSingleName ? set(context) : getBoundsDomain(bounds, context);
    if (expression.isRecursive || !isEnumerable(domain)) {
      return createLazyFunction(domain, (argument) =>
        body(withScope(context, bindArgument(bounds, context.scope, argument))),
      );
    }
    if (isSingleName && bound.pattern.kind === "Name") {
      const name = bound.pattern.name;
      const keys = toFiniteSet(domain).elements;
      return createSortedFunction(
        keys,
        keys.map((key) => body(withScope(context, bindValue(context.scope, name, key)))),
      );
    }
    const pairs: [Value, Value][] = [];
    forEachBinding(bounds, context, (scope) => {
      const key =
        bounds.length === 1
          ? (lookupKey(bound.pattern, scope) ?? false)
          : createTuple(bounds.map((item) => lookupKey(item.pattern, scope) ?? false));
      pairs.push([key, body(withScope(context, scope))]);
      return false;
    });
    return createFunction(pairs);
  };
};

const compileExcept = (
  expression: Expression & { kind: "Except" },
  environment: Environment,
): Evaluator => {
  const fn = getEvaluator(expression.function, environment);
  const updates = expression.updates.map((update) => ({
    path: update.path.map((step) =>
      step.kind === "Field"
        ? { kind: "Field" as const, name: step.name, args: [] as Evaluator[] }
        : {
            kind: "Index" as const,
            name: "",
            args: step.args.map((arg) => getEvaluator(arg, environment)),
          },
    ),
    value: getEvaluator(update.value, environment),
  }));
  type CompiledStep = (typeof updates)[number]["path"][number];
  const getKey = (step: CompiledStep, context: Context): Value => {
    if (step.kind === "Field") return step.name;
    if (step.args.length === 1) return step.args[0](context);
    return createTuple(step.args.map((arg) => arg(context)));
  };
  const update = (
    current: Value,
    path: CompiledStep[],
    depth: number,
    context: Context,
    value: Evaluator,
  ): Value => {
    if (depth === path.length) {
      return value(withScope(context, bindValue(context.scope, EXCEPT_AT, current)));
    }
    return updateFunction(current, getKey(path[depth], context), (previous) =>
      update(previous, path, depth + 1, context, value),
    );
  };
  return (context) => {
    let current = fn(context);
    for (const item of updates) current = update(current, item.path, 0, context, item.value);
    return current;
  };
};

const compileSetComprehension = (
  expression: Expression & { kind: "SetFilter" | "SetMap" | "Choose" },
  environment: Environment,
): Evaluator => {
  if (expression.kind === "SetFilter") {
    const predicate = getEvaluator(expression.predicate, environment);
    const set = getEvaluator(expression.bound.set, environment);
    const pattern = expression.bound.pattern;
    return (context) => {
      const base = set(context);
      const test = (element: Value) =>
        expectBoolean(
          predicate(withScope(context, bindPattern(context.scope, pattern, element))),
          "a set filter predicate",
        );
      const isReducible =
        typeof base === "object" && (base.kind === "Set" || base.kind === "Interval");
      if (!isReducible) {
        if (isSetValue(base)) return { kind: "FilteredSet", base, test };
        throw new TlaEvaluationError(
          `TLC encountered a non-enumerable quantifier bound ${formatValue(base)} at ${describeLocation(expression.bound.set)}`,
        );
      }
      return createSortedSet(toFiniteSet(base).elements.filter(test));
    };
  }
  if (expression.kind === "SetMap") {
    const mapped = getEvaluator(expression.expression, environment);
    return (context) => {
      const elements: Value[] = [];
      forEachBinding(expression.bounds, context, (scope) => {
        elements.push(mapped(withScope(context, scope)));
        return false;
      });
      return createSet(elements);
    };
  }
  const set = expression.set;
  if (!set) {
    return () => {
      throw new TlaEvaluationError(
        `TLC cannot evaluate an unbounded CHOOSE at ${describeLocation(expression)}`,
      );
    };
  }
  const body = getEvaluator(expression.body, environment);
  const bound = { pattern: expression.pattern, set };
  return (context) => {
    const chosen = { value: undefined as Value | undefined };
    forEachBinding([bound], context, (scope) => {
      if (!expectBoolean(body(withScope(context, scope)), "the body of CHOOSE")) return false;
      chosen.value = lookupKey(expression.pattern, scope);
      return true;
    });
    if (chosen.value === undefined) {
      throw new TlaEvaluationError(
        `Attempted to compute CHOOSE x \\in S : P, but no element of S satisfies P at ${describeLocation(expression)}`,
      );
    }
    return chosen.value;
  };
};

const compileRecord = (recordFields: RecordField[], environment: Environment): Evaluator => {
  const fields = [...recordFields].sort((left, right) => compareValues(left.name, right.name));
  const hasDuplicates = fields.some(
    (field, index) => index > 0 && fields[index - 1].name === field.name,
  );
  const values = fields.map((field) => getEvaluator(field.value, environment));
  if (hasDuplicates) {
    return (context) =>
      createFunction(
        fields.map((field, index): [Value, Value] => [field.name, values[index](context)]),
      );
  }
  const names: Value[] = fields.map((field) => field.name);
  return (context) =>
    createSortedFunction(
      names,
      values.map((value) => value(context)),
    );
};

const createUnchanged = (expression: Expression, location: Expression["location"]): Expression => ({
  kind: "Unchanged",
  expression,
  location,
});

const throwing =
  (createError: () => Error): Evaluator =>
  () => {
    throw createError();
  };

const compile = (expression: Expression, environment: Environment): Evaluator => {
  const child = (node: Expression) => getEvaluator(node, environment);
  switch (expression.kind) {
    case "Number": {
      const value = expression.value;
      return isTlcInteger(value) ? () => value : () => checkInteger(value);
    }
    case "String": {
      const value = expression.value;
      return () => value;
    }
    case "Identifier":
      return compileIdentifier(expression, environment);
    case "Apply":
      return compileApply(expression, environment);
    case "OperatorReference":
    case "Lambda":
      return throwing(
        () =>
          new TlaEvaluationError(
            `An operator cannot be used as a value at ${describeLocation(expression)}`,
          ),
      );
    case "And": {
      const operands = expression.operands.map(child);
      return (context) => {
        for (let index = 0; index < operands.length; index++) {
          if (!expectBoolean(operands[index](context), "a conjunct")) return false;
        }
        return true;
      };
    }
    case "Or": {
      const operands = expression.operands.map(child);
      return (context) => {
        for (let index = 0; index < operands.length; index++) {
          if (expectBoolean(operands[index](context), "a disjunct")) return true;
        }
        return false;
      };
    }
    case "Prime": {
      const inner = child(expression.expression);
      return (context) => {
        if (!context.next) {
          throw new TlaEvaluationError(
            `A primed expression appears outside an action at ${describeLocation(expression)}`,
          );
        }
        return inner({
          environment: context.environment,
          scope: context.scope,
          state: context.next,
          next: undefined,
        });
      };
    }
    case "Unchanged": {
      const primed = child({
        kind: "Prime",
        expression: expression.expression,
        location: expression.location,
      });
      const current = child(expression.expression);
      return (context) => valuesEqual(primed(context), current(context));
    }
    case "If": {
      const condition = child(expression.condition);
      const consequent = child(expression.consequent);
      const alternative = child(expression.alternative);
      return (context) =>
        expectBoolean(condition(context), "an IF condition")
          ? consequent(context)
          : alternative(context);
    }
    case "Case": {
      const arms = expression.arms.map((arm) => ({
        condition: child(arm.condition),
        body: child(arm.body),
      }));
      const other = expression.other ? child(expression.other) : undefined;
      return (context) => {
        for (const arm of arms) {
          if (expectBoolean(arm.condition(context), "a CASE guard")) return arm.body(context);
        }
        if (other) return other(context);
        throw new TlaEvaluationError(`No CASE guard is true at ${describeLocation(expression)}`);
      };
    }
    case "Let": {
      const body = child(expression.body);
      return (context) =>
        body(withScope(context, bindDefinitions(expression.definitions, context)));
    }
    case "Forall":
    case "Exists":
      return compileQuantifier(expression, environment);
    case "UnboundedQuantifier":
      return throwing(
        () =>
          new TlaEvaluationError(
            `TLC cannot evaluate an unbounded quantifier at ${describeLocation(expression)}`,
          ),
      );
    case "Choose":
    case "SetFilter":
    case "SetMap":
      return compileSetComprehension(expression, environment);
    case "SetEnumeration": {
      const elements = expression.elements.map(child);
      return (context) => createSet(elements.map((element) => element(context)));
    }
    case "Tuple": {
      const elements = expression.elements.map(child);
      return (context) => createTuple(elements.map((element) => element(context)));
    }
    case "FunctionConstruction":
      return compileFunctionConstruction(expression, environment);
    case "FunctionSet": {
      const domain = child(expression.domain);
      const range = child(expression.range);
      return (context) => ({ kind: "FunctionSet", domain: domain(context), range: range(context) });
    }
    case "Record":
      return compileRecord(expression.fields, environment);
    case "RecordSet": {
      const fields = [...expression.fields].sort((left, right) =>
        compareValues(left.name, right.name),
      );
      const names = fields.map((field) => field.name);
      const sets = fields.map((field) => child(field.value));
      return (context) => ({ kind: "RecordSet", names, sets: sets.map((set) => set(context)) });
    }
    case "Except":
      return compileExcept(expression, environment);
    case "ExceptAt":
      return (context) => {
        const binding = lookupScope(context.scope, EXCEPT_AT);
        if (binding?.kind !== "Value") {
          throw new TlaEvaluationError(
            `@ appears outside an EXCEPT at ${describeLocation(expression)}`,
          );
        }
        return binding.value;
      };
    case "FunctionApplication": {
      const fn = child(expression.function);
      const args = expression.args.map(child);
      if (args.length === 1) {
        const argument = args[0];
        return (context) => applyFunction(fn(context), argument(context));
      }
      return (context) => applyFunction(fn(context), createTuple(args.map((arg) => arg(context))));
    }
    case "FieldAccess": {
      const record = child(expression.record);
      const field = expression.field;
      return (context) => applyFunction(record(context), field);
    }
    case "Product": {
      const factors = expression.factors.map(child);
      return (context) => ({
        kind: "ProductSet",
        factors: factors.map((factor) => factor(context)),
      });
    }
    case "BoxAction":
    case "AngleAction": {
      const action = child(expression.action);
      const unchanged = child(createUnchanged(expression.subscript, expression.location));
      const isBox = expression.kind === "BoxAction";
      return (context) =>
        isBox
          ? expectBoolean(action(context), "an action") || unchanged(context)
          : expectBoolean(action(context), "an action") && !unchanged(context);
    }
    case "Enabled": {
      const action = expression.expression;
      return (context) => isEnabled(action, context);
    }
    case "Label":
      return child(expression.body);
    case "Subexpression":
      return throwing(
        () =>
          new TlaEvaluationError(
            `The subexpression reference at ${describeLocation(expression)} does not name a subexpression`,
          ),
      );
    case "Always":
    case "Eventually":
    case "WeakFairness":
    case "StrongFairness":
      return throwing(
        () =>
          new TlaEvaluationError(
            `TLC cannot evaluate a temporal formula in a state at ${describeLocation(expression)}`,
          ),
      );
  }
};
