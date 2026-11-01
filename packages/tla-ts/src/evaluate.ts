import {
  getChildren,
  isLocallyResolved,
  type Bound,
  type BoundPattern,
  type DecimalExpression,
  type Definition,
  type Expression,
  type FunctionDefinition,
  type NumberExpression,
  type OperatorParam,
  type RecordField,
} from "./ast";
import { getKindString } from "./builtins";
import { formatRange, TlaEvaluationError, TlaUnassignedError } from "./errors";
import { EXIT_STATUS, setExitCode, setOwnExitCode } from "./exit-codes";
import { generateEvaluator } from "./codegen";
import type { CheckerRuntime } from "./runtime";
import { getReadVariables } from "./dependencies";
import { contextualApplications, mapChildren, substitutedExpressions } from "./instances";
import { getReadLocals, isEnabled } from "./successors";
import { getFingerprintTrace, valueSources, withSource } from "./value-sources";
import {
  applyFunction,
  combineHash,
  compareValues,
  createFunction,
  createEnumeratedSet,
  createSortedFunction,
  createSortedSet,
  createWrittenRecord,
  createTuple,
  describeMissingField,
  formatValue,
  getDomain,
  getFunctionDomain,
  getIntervalElements,
  getLazySubsets,
  getSequenceElements,
  getValueHash,
  isFunctionValue,
  isOverriddenSet,
  isRecordValue,
  isSameValue,
  markLambdaFunction,
  isReducible,
  isSetValue,
  MAXIMUM_INTEGER,
  MINIMUM_INTEGER,
  toFiniteSet,
  updateFunction,
  valuesEqual,
  type FilteredSetValue,
  type FunctionValue,
  type LazyFunctionSource,
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
  literalBody?: Value;
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

type Operator = Closure | Builtin | OperatorValue;

export interface Thunk {
  kind: "Thunk";
  expression: Expression;
  scope: Scope | undefined;
  state: State | undefined;
  next: State | undefined;
  cache: Value | undefined;
}

type Binding = { kind: "Value"; value: Value } | Thunk | { kind: "Operator"; operator: Operator };

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
  trace?: Expression[];
}

export interface Context {
  environment: Environment;
  scope: Scope | undefined;
  state: State | undefined;
  next: State | undefined;
}

export type Evaluator = (context: Context) => Value;

type ArgumentBinder = (context: Context) => Binding;

interface CompiledStep {
  kind: "Field" | "Index";
  name: string;
  args: Evaluator[];
}

type GlobalName =
  | { kind: "Variable"; index: number }
  | { kind: "Value"; value: Value }
  | { kind: "Definition"; definition: Definition };

const EXCEPT_AT = "@";

export const describeLocation = (expression: Expression) =>
  `line ${expression.location.line}, column ${expression.location.column}`;

export const describeRange = (expression: Expression) => {
  const range = expression.location.range;
  return range ? formatRange(range) : describeLocation(expression);
};

export const getConditionError = (expression: Expression, value: Value) =>
  new TlaEvaluationError(
    `A non-boolean expression (${getKindString(value)}) was used as the condition of an IF.\n${describeRange(expression)}`,
  );

// TLC parses an infix chain of /\ as nested binary conjunctions and a bulleted list as one
// conjunction list, and it words the error differently for each.
export const getConjunctError = (
  expression: Expression & { kind: "And" | "Or" },
  index: number,
  value: Value,
) => {
  const range = expression.location.range;
  const isBulleted =
    range?.start.line === expression.location.line &&
    range.start.column === expression.location.column;
  if (isBulleted || !range) {
    const operand = expression.operands[index];
    // SANY prints a numeral as its value instead of its location.
    const description = operand.kind === "Number" ? String(operand.value) : describeRange(operand);
    return new TlaEvaluationError(
      `A non-boolean expression (${getKindString(value)}) was used as a formula in a conjunction.\n${description}`,
    );
  }
  const end = expression.operands[Math.max(index, 1)].location.range?.end ?? range.end;
  return new TlaEvaluationError(
    `Attempted to evaluate an expression of form P /\\ Q when ${index === 0 ? "P" : "Q"} was\n${getKindString(value)}.\n${describeRange({ ...expression, location: { ...expression.location, range: { ...range, end } } })}`,
  );
};

export const getFieldError =
  (expression: Expression & { kind: "FieldAccess" }) => (record: FunctionValue) =>
    isRecordValue(record)
      ? `Attempted to select nonexistent field "${expression.field}" from the record\n${formatValue(record)}\n${describeRange(expression)}`
      : describeMissingField(record, expression.field);

export const getNonFunctionError = (expression: Expression) => (value: Value) =>
  `A non-function (${getKindString(value)}) was applied as a function.\n${describeRange(expression)}`;

export const getNonRecordError =
  (expression: Expression & { kind: "FieldAccess" }) => (value: Value) =>
    `Attempted to select field "${expression.field}" from a non-record value ${formatValue(value)}\n${describeRange(expression)}`;

export const getDomainOperator = (expression: Expression) => (value: Value) => {
  if (!isFunctionValue(value)) {
    throw new TlaEvaluationError(
      `Attempted to apply the operator DOMAIN to a non-function\n(${getKindString(value)})\n${describeRange(expression)}`,
    );
  }
  return getDomain(value);
};

export const getSubsetOperator =
  (expression: Expression, builtin: Builtin) => (left: Value, right: Value) => {
    if (!isSetValue(left) || isOverriddenSet(left)) {
      throw new TlaEvaluationError(
        `Attempted to evaluate an expression of form S \\subseteq T, but S was not enumerable.\n${describeRange(expression)}`,
      );
    }
    return builtin.evaluate([left, right]);
  };

// TLC rejects a decimal, or an integer literal too big for it, while it processes the spec.
export const createRealNumberError = (expression: DecimalExpression) =>
  setExitCode(
    new TlaEvaluationError(
      `TLC can't handle real numbers: ${expression.text} at ${describeLocation(expression)}`,
    ),
    EXIT_STATUS.configParseError,
  );

export const createBigNumberError = (expression: NumberExpression) =>
  setExitCode(
    new TlaEvaluationError(
      `TLC can't handle a number this big: ${expression.text ?? expression.value} at ${describeLocation(expression)}`,
    ),
    EXIT_STATUS.error,
  );

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

const bindPattern = (scope: Scope | undefined, pattern: BoundPattern, value: Value) => {
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
  );
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

const getBoundExplanation = (set: Value, text: string) => {
  const quantified = `universally (\\A) or existentially (\\E) quantify over ${text}, because this would require checking an\ninfinite number of cases.`;
  if (typeof set === "object" && set.kind === "SequenceSet") {
    return `In TLA+, Seq(S) represents the set of all finite sequences whose elements come from the set S. Even when S\nis a finite set, the number of possible sequences in Seq(S) is unbounded because sequences can have any\nfinite length (e.g., length 0, 1, 2, and so on). As a result, TLC cannot evaluate expressions that\n${quantified} Note that for a finite set of sequences s, TLC handles s \\subseteq Seq(S).\nSee https://explain.tlapl.us/seq-unenumerable for additional details.`;
  }
  if (
    typeof set === "object" &&
    set.kind === "InfiniteSet" &&
    set.name !== "STRING" &&
    set.name !== "Any"
  ) {
    return `The set ${set.name} contains infinitely many elements. As a result, TLC cannot evaluate expressions that\n${quantified} Note that TLC handles set membership like T \\subseteq ${set.name} for any finite set T.`;
  }
  return undefined;
};

// TLC enumerates every set except the ones it implements in Java, so any other set fails as its own
// class does.
export const getEnumeratedElements = (set: Value, expression: Expression) => {
  if (!isSetValue(set) || isOverriddenSet(set)) {
    const text = formatValue(set);
    const explanation = getBoundExplanation(set, text);
    throw new TlaEvaluationError(
      explanation === undefined
        ? `TLC encountered a non-enumerable quantifier bound\n${text}.\n${describeRange(expression)}`
        : `TLC encountered the non-enumerable quantifier bound\n${text}\n${describeRange(expression)}\n${explanation}`,
    );
  }
  if (typeof set === "object" && set.kind === "Interval") return getIntervalElements(set);
  return getLazySubsets(set) ?? toFiniteSet(set).elements;
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

// TLC prints a function it can't enumerate as its parameters and the location of its body. It
// prints only the first name of a group such as `m, n \in S`.
interface LazyFunctionTemplate {
  parameters: { index: number; name: string }[];
  body: string;
}

const lazyFunctionTemplates = new WeakMap<Expression, LazyFunctionTemplate>();

const getLazyFunctionTemplate = (bounds: Bound[], body: Expression) => {
  const cached = lazyFunctionTemplates.get(body);
  if (cached) return cached;
  const range = body.location.range;
  if (!range) return undefined;
  const template = {
    parameters: bounds.flatMap((bound, index) =>
      index > 0 && bounds[index - 1].set === bound.set
        ? []
        : [
            {
              index,
              name:
                bound.pattern.kind === "Name"
                  ? bound.pattern.name
                  : `<<${bound.pattern.names.join(", ")}>>`,
            },
          ],
    ),
    body: formatRange(range),
  };
  lazyFunctionTemplates.set(body, template);
  return template;
};

const getLazyFunctionSource = (bounds: Bound[], body: Expression, domain: Value) => {
  const template = getLazyFunctionTemplate(bounds, body);
  if (!template) return undefined;
  const domains =
    bounds.length > 1 && typeof domain === "object" && domain.kind === "ProductSet"
      ? domain.factors
      : [domain];
  return {
    parameters: template.parameters.map((parameter) => ({
      name: parameter.name,
      domain: domains[parameter.index],
    })),
    body: template.body,
  };
};

const createLazyFunction = (
  domain: Value,
  compute: (argument: Value, self: LazyFunctionValue) => Value,
  source: LazyFunctionSource | undefined,
) => {
  const memo = new Map<number, Value[]>();
  const self: LazyFunctionValue = {
    kind: "LazyFunction",
    domain,
    source,
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

const createRecursiveFunction = (definition: FunctionDefinition, context: Context) => {
  const domain = getBoundsDomain(definition.bounds, context);
  const functionValue = createLazyFunction(
    domain,
    (argument, self) =>
      evaluate(
        definition.body,
        withScope(
          context,
          bindArgument(definition.bounds, bindValue(undefined, definition.name, self), argument),
        ),
      ),
    getLazyFunctionSource(definition.bounds, definition.body, domain),
  );
  return definition.bounds.length === 1 ? markLambdaFunction(functionValue) : functionValue;
};

const evaluateDefinitionBody = (definition: Definition, context: Context) =>
  definition.kind === "Function"
    ? createRecursiveFunction(definition, context)
    : evaluate(definition.body, context);

const evaluateDefinitionValue = (definition: Definition, context: Context) => {
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

const callOperatorWithValues = (operator: Operator, args: Value[], context: Context): Value => {
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
        literalBody:
          operator.kind === "Closure" &&
          (operator.body.kind === "Number" || operator.body.kind === "String")
            ? operator.body.value
            : undefined,
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
        return binding?.kind === "Value" || binding?.kind === "Thunk"
          ? binding
          : createThunk(argument, context);
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

const callOperator = (operator: Operator, args: Expression[], context: Context) => {
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

export const bindDefinitions = (
  definitions: Definition[],
  context: Context,
  reevaluated?: ReadonlySet<Definition>,
): Scope | undefined =>
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
    if (definition.params.length > 0 || reevaluated?.has(definition)) {
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
    if (value === undefined) throw createUnassignedError(name, expression);
    return value;
  }
  if (global?.kind === "Value") return global.value;
  if (global?.kind === "Definition") return evaluateDefinitionValue(global.definition, context);
  const builtin = context.environment.builtins.get(name);
  if (builtin?.arity === 0) return builtin.evaluate([], context);
  throw new TlaEvaluationError(`Unknown identifier ${name} at ${describeLocation(expression)}`);
};

export const isTlcInteger = (value: number) =>
  Number.isInteger(value) && value <= MAXIMUM_INTEGER && value >= MINIMUM_INTEGER;

const IMPURE_BUILTINS = new Set([
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

interface Impurity {
  builtins: Set<string>;
  definitions: WeakMap<Definition, boolean>;
}

const ANY_EFFECT: Impurity = { builtins: IMPURE_BUILTINS, definitions: new WeakMap() };

// An Assert that held holds again, so evaluating it twice looks the same as evaluating it once.
const REPEATED_EFFECT: Impurity = {
  builtins: new Set([...IMPURE_BUILTINS].filter((name) => name !== "Assert")),
  definitions: new WeakMap(),
};

const isEvaluatedOnce = (definition: Definition, environment: Environment) =>
  definition.kind === "Operator" &&
  definition.params.length === 0 &&
  isConstantLevel(definition, environment);

const callsImpureBuiltin = (
  expression: Expression,
  environment: Environment,
  impurity: Impurity,
): boolean => {
  const name =
    expression.kind === "Identifier"
      ? expression.name
      : expression.kind === "Apply" || expression.kind === "OperatorReference"
        ? expression.operator
        : undefined;
  if (name !== undefined && !isLocallyResolved(expression)) {
    const definition = getDefinition(name, environment);
    const isImpureCall =
      impurity.builtins.has(name) || environment.builtins.get(name)?.isStateLevel === true;
    if (!definition && isImpureCall) return true;
    if (
      definition &&
      !isEvaluatedOnce(definition, environment) &&
      isImpureDefinition(definition, environment, impurity)
    ) {
      return true;
    }
  }
  return getChildren(expression).some((child) => callsImpureBuiltin(child, environment, impurity));
};

// TLC evaluates a constant definition without parameters once, so only other definitions pass
// on the side effects and random choices of the builtins they call.
const isImpureDefinition = (
  definition: Definition,
  environment: Environment,
  impurity = ANY_EFFECT,
): boolean => {
  const cached = impurity.definitions.get(definition);
  if (cached !== undefined) return cached;
  impurity.definitions.set(definition, false);
  const isImpure =
    callsImpureBuiltin(definition.body, environment, impurity) ||
    (definition.kind === "Function" &&
      definition.bounds.some((bound) => callsImpureBuiltin(bound.set, environment, impurity)));
  impurity.definitions.set(definition, isImpure);
  return isImpure;
};

// TLC's next-state generator does not bind LET definitions to values, so each reference to one
// that calls an impure builtin evaluates it again.
export const getReevaluatedDefinitions = (definitions: Definition[], environment: Environment) =>
  new Set(definitions.filter((definition) => isImpureDefinition(definition, environment)));

export const isImpure = (environment: Environment) =>
  [...environment.definitions.values()].some((definition) =>
    isImpureDefinition(definition, environment),
  );

// Whether evaluating a definition again can show, such as by printing twice.
export const hasRepeatedEffects = (environment: Environment) =>
  [...environment.definitions.values()].some((definition) =>
    isImpureDefinition(definition, environment, REPEATED_EFFECT),
  );

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
) =>
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
    return global?.kind === "Definition" && isEvaluatedOnce(global.definition, environment);
  }
  if (expression.kind === "Apply") {
    if (isImpureBuiltin(expression.operator, environment) || expression.operator === "~>") {
      return false;
    }
    const operator = resolveGlobalOperator(expression.operator, environment);
    if (operator?.kind !== "Builtin" && operator?.kind !== "Closure") return false;
    if (operator.kind === "Closure") {
      const definition = getDefinition(expression.operator, environment);
      if (
        !definition ||
        !isConstantLevel(definition, environment) ||
        isImpureDefinition(definition, environment)
      ) {
        return false;
      }
    }
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

// CallStackTool also evaluates the predicate of a lazy set filter it returns, even one that TLC
// made before the replay.
const filteredSetRetracers = new WeakMap<
  FilteredSetValue,
  (environment: Environment) => FilteredSetValue
>();

const SOURCED_KINDS = new Set<Expression["kind"]>([
  "SetEnumeration",
  "SetMap",
  "SetFilter",
  "Tuple",
  "Record",
  "RecordSet",
  "FunctionSet",
  "Product",
]);

const SOURCED_OPERATORS = new Set(["SUBSET", "UNION", "DOMAIN", "\\cup", "\\cap", "\\"]);

// CallStackTool gives a set, tuple or record it builds the expression as its source, but not a lazy
// set filter, which it returns as a copy.
const isSourced = (expression: Expression, environment: Environment) =>
  SOURCED_KINDS.has(expression.kind) ||
  (expression.kind === "Apply" &&
    SOURCED_OPERATORS.has(expression.operator) &&
    !isLocallyResolved(expression) &&
    resolveGlobalOperator(expression.operator, environment)?.kind === "Builtin");

// When an evaluation fails, CallStackTool freezes the stack at the innermost expression and pushes
// the source of each value whose method failed.
const evaluateTraced = (
  evaluator: Evaluator,
  context: Context,
  trace: Expression[],
  depth: number,
) => {
  try {
    return evaluator(context);
  } catch (error) {
    if (trace.length === depth + 1) trace.push(...(getFingerprintTrace(error) ?? []));
    throw error;
  }
};

export const getEvaluator = (expression: Expression, environment: Environment): Evaluator => {
  const cached = environment.evaluators.get(expression);
  if (cached) return cached;
  const compiled = compile(expression, environment);
  const cachedEvaluator =
    isWorthCaching(expression) && isClosedConstant(expression, environment)
      ? cacheFirstValue(compiled)
      : isStateCached(expression, environment)
        ? cacheStateValue(compiled)
        : compiled;
  const trace = environment.trace;
  const isSourcedExpression = trace !== undefined && isSourced(expression, environment);
  // TLC's CallStackTool pushes each expression it evaluates and keeps the stack when one fails.
  const evaluator: Evaluator = trace
    ? (context) => {
        const depth = trace.length;
        trace.push(expression);
        const value = evaluateTraced(cachedEvaluator, context, trace, depth);
        trace.length = depth;
        if (isSourcedExpression && typeof value === "object" && value.kind !== "FilteredSet") {
          valueSources.current?.set(value, expression);
        }
        const retrace =
          typeof value === "object" && value.kind === "FilteredSet"
            ? filteredSetRetracers.get(value)
            : undefined;
        return retrace ? retrace(environment) : value;
      }
    : cachedEvaluator;
  environment.evaluators.set(expression, evaluator);
  return evaluator;
};

const entryEvaluators = new WeakMap<Expression, Evaluator>();

export const getEntryEvaluator = (expression: Expression, environment: Environment) => {
  if (environment.trace) return getEvaluator(expression, environment);
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
      if (value === undefined) throw createUnassignedError(name, expression);
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

const RECEIVING_OPERATORS = new Set(["=", "#", "\\in", "\\notin", "\\cup", "\\cap", "\\"]);

// The argument whose method TLC calls to apply a built-in operator.
const getReceiver = (name: string, left: Value, right: Value) =>
  name === "\\in" ||
  name === "\\notin" ||
  ((name === "\\cup" || name === "\\cap") && !isReducible(left))
    ? right
    : left;

const compileBuiltinCall = (
  builtin: Builtin,
  args: Expression[],
  environment: Environment,
): Evaluator => {
  if (environment.trace && RECEIVING_OPERATORS.has(builtin.name) && args.length === 2) {
    const evaluateLeft = getEvaluator(args[0], environment);
    const evaluateRight = getEvaluator(args[1], environment);
    return (context) => {
      const left = evaluateLeft(context);
      const right = evaluateRight(context);
      return withSource(getReceiver(builtin.name, left, right), () =>
        builtin.evaluate([left, right], context),
      );
    };
  }
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

interface MemoizedCall {
  sources: (Expression | undefined)[];
  args: Value[];
  value: Value;
}

const MEMOIZED_CALL_LIMIT = 1 << 16;

// A call site that finds fewer than half its calls in a state's memo after this many new ones
// stops paying for the lookups.
const MEMOIZED_TRIAL_CALLS = 1 << 10;

interface CallMemo {
  calls: Map<number, MemoizedCall[]>;
  size: number;
  state: Context["state"];
}

interface CallMemos {
  constant: CallMemo;
  state: CallMemo;
}

const createCallMemo = (): CallMemo => ({ calls: new Map(), size: 0, state: undefined });

const callMemos = new WeakMap<Closure, CallMemos>();

const getCallMemos = (closure: Closure) => {
  const cached = callMemos.get(closure);
  if (cached) return cached;
  const memos = { constant: createCallMemo(), state: createCallMemo() };
  callMemos.set(closure, memos);
  return memos;
};

const readsExceptAt = (expression: Expression): boolean =>
  expression.kind === "ExceptAt" || getChildren(expression).some(readsExceptAt);

// The locals an argument expression reads, when the state and their values decide its value. An @
// reads the value its EXCEPT binds.
const argumentLocals = new WeakMap<Expression, string[] | false>();

const getArgumentLocals = (expression: Expression, environment: Environment) => {
  const cached = argumentLocals.get(expression);
  if (cached !== undefined) return cached;
  const locals =
    getReadVariables(expression, environment) !== undefined &&
    getReadLocals(expression, NO_BOUND_NAMES);
  const unique = locals && [
    ...new Set(readsExceptAt(expression) ? [...locals, EXCEPT_AT] : locals),
  ];
  argumentLocals.set(expression, unique ?? false);
  return unique ?? false;
};

// Hashing a lazy set or function would enumerate it, which TLC does only when it has to.
const isEagerValue = (value: Value) =>
  typeof value !== "object" ||
  value.kind === "ModelValue" ||
  value.kind === "Set" ||
  value.kind === "Function" ||
  value.kind === "Interval";

// The key of the call being looked up, copied into the memo only when the call is new. Counts
// mark its ends, since shortening an array is slow.
const callKey = {
  sources: [] as (Expression | undefined)[],
  sourceCount: 0,
  args: [] as Value[],
  argCount: 0,
  hash: 0,
  isStateKeyed: false,
};

// A model value's rank tells it apart without hashing its name.
const getKeyHash = (value: Value) =>
  typeof value === "object" && value.kind === "ModelValue" ? value.rank : getValueHash(value);

const pushKeyValue = (value: Value) => {
  if (!isEagerValue(value)) return false;
  callKey.sources[callKey.sourceCount++] = undefined;
  callKey.args[callKey.argCount++] = value;
  callKey.hash = combineHash(callKey.hash, getKeyHash(value));
  return true;
};

// An argument TLC has not evaluated yet stands for its expression and the values of the locals it
// reads, so a call keeps the laziness of its arguments.
const pushKeyExpression = (
  expression: Expression,
  locals: string[] | false,
  scope: Scope | undefined,
) => {
  if (!locals) return false;
  callKey.sources[callKey.sourceCount++] = expression;
  callKey.isStateKeyed = true;
  for (let index = 0; index < locals.length; index++) {
    const local = lookupScope(scope, locals[index]);
    if (local?.kind !== "Value" || !isEagerValue(local.value)) return false;
    callKey.args[callKey.argCount++] = local.value;
    callKey.hash = combineHash(callKey.hash, getKeyHash(local.value));
  }
  return true;
};

// Each argument adds to the key what compileArgumentBinder would bind its parameter to.
const compileArgumentKey = (
  argument: Expression,
  environment: Environment,
): ((context: Context) => boolean) => {
  const isLiteral =
    argument.kind === "String" || (argument.kind === "Number" && isTlcInteger(argument.value));
  if (isLiteral) return () => pushKeyValue(argument.value);
  if (argument.kind === "Identifier") {
    const global = isLocallyResolved(argument)
      ? undefined
      : findGlobalName(argument.name, environment);
    if (global?.kind === "Value") return () => pushKeyValue(global.value);
    if (global === undefined) {
      return (context) => {
        const binding = lookupScope(context.scope, argument.name);
        if (binding?.kind === "Value") return pushKeyValue(binding.value);
        if (binding?.kind !== "Thunk" || binding.state !== context.state) return false;
        return pushKeyExpression(
          binding.expression,
          getArgumentLocals(binding.expression, environment),
          binding.scope,
        );
      };
    }
  }
  const locals = getArgumentLocals(argument, environment);
  return (context) => pushKeyExpression(argument, locals, context.scope);
};

const isKnownCall = (call: MemoizedCall) => {
  if (call.args.length !== callKey.argCount || call.sources.length !== callKey.sourceCount) {
    return false;
  }
  for (let index = 0; index < callKey.sourceCount; index++) {
    if (call.sources[index] !== callKey.sources[index]) return false;
  }
  for (let index = 0; index < callKey.argCount; index++) {
    if (!isSameValue(call.args[index], callKey.args[index])) return false;
  }
  return true;
};

const findCall = (bucket: MemoizedCall[] | undefined) => {
  if (bucket === undefined) return undefined;
  for (let index = 0; index < bucket.length; index++) {
    if (isKnownCall(bucket[index])) return bucket[index];
  }
  return undefined;
};

// An operator without side effects yields the same value for the same arguments, a state-level one
// in the same state, so its calls share one result.
const getMemoizedLevel = (expression: Expression & { kind: "Apply" }, environment: Environment) => {
  const definition = getDefinition(expression.operator, environment);
  const isMemoizable =
    definition?.kind === "Operator" &&
    definition.params.length > 0 &&
    definition.params.every((param) => param.arity === 0) &&
    !isImpureDefinition(definition, environment);
  if (!isMemoizable) return undefined;
  if (isConstantLevel(definition, environment)) return "constant";
  return isStatePure(definition, environment) ? "state" : undefined;
};

const compileClosureCall = (
  closure: Closure,
  args: Expression[],
  environment: Environment,
  memoizedLevel: "constant" | "state" | undefined,
): Evaluator => {
  const bindArguments = compileArgumentScope(closure, args, environment);
  const compiled = { body: undefined as Evaluator | undefined };
  const evaluateBody = (scope: Scope | undefined, context: Context) => {
    compiled.body ??= getEntryEvaluator(closure.body, environment);
    return compiled.body({ environment, scope, state: context.state, next: context.next });
  };
  if (!memoizedLevel || args.length !== closure.params.length) {
    return (context) => evaluateBody(bindArguments(context), context);
  }
  const memos = getCallMemos(closure);
  const keys = args.map((arg) => compileArgumentKey(arg, environment));
  const usage = { hits: 0, misses: 0 };
  return (context) => {
    callKey.sourceCount = 0;
    callKey.argCount = 0;
    callKey.hash = args.length;
    callKey.isStateKeyed = false;
    for (let index = 0; index < keys.length; index++) {
      if (!keys[index](context)) return evaluateBody(bindArguments(context), context);
    }
    const isStateKeyed = memoizedLevel === "state" || callKey.isStateKeyed;
    if (isStateKeyed && usage.misses > MEMOIZED_TRIAL_CALLS && usage.hits < usage.misses) {
      return evaluateBody(bindArguments(context), context);
    }
    const memo = isStateKeyed ? memos.state : memos.constant;
    if (isStateKeyed && memo.state !== context.state) {
      memo.state = context.state;
      memo.calls.clear();
      memo.size = 0;
    }
    // A small integer key keeps the Map from boxing it.
    const hash = callKey.hash & 0x3fffffff;
    const bucket = memo.calls.get(hash);
    const known = findCall(bucket);
    if (known) {
      if (isStateKeyed) usage.hits++;
      return known.value;
    }
    if (isStateKeyed) usage.misses++;
    const sources = callKey.sources.slice(0, callKey.sourceCount);
    const keyArgs = callKey.args.slice(0, callKey.argCount);
    const value = evaluateBody(bindArguments(context), context);
    if (memo.size < MEMOIZED_CALL_LIMIT) {
      memo.size++;
      const call = { sources, args: keyArgs, value };
      if (bucket) bucket.push(call);
      else memo.calls.set(hash, [call]);
    }
    return value;
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
  if (global?.kind === "Closure") {
    return compileClosureCall(global, args, environment, getMemoizedLevel(expression, environment));
  }
  if (global?.kind === "Builtin" && global.name === "DOMAIN") {
    const operand = getEvaluator(args[0], environment);
    const domain = getDomainOperator(expression);
    // TLC builds a new interval for the domain of a tuple, so the source it gives one stays its own.
    if (environment.trace) {
      return (context) => {
        const value = domain(operand(context));
        return typeof value === "object" && value.kind === "Interval" ? { ...value } : value;
      };
    }
    return (context) => domain(operand(context));
  }
  // TLC sorts the value of a constant TLCEval argument only where no context binds a name.
  if (global?.kind === "Builtin" && global.name === "TLCEval" && args.length === 1) {
    const operand = getEvaluator(args[0], environment);
    if (contextualApplications.has(expression) || isStateDependent(args[0], environment)) {
      return operand;
    }
    return (context) =>
      context.scope === undefined ? global.evaluate([operand(context)]) : operand(context);
  }
  if (global?.kind === "Builtin" && global.name === "\\subseteq" && args.length === 2) {
    const left = getEvaluator(args[0], environment);
    const right = getEvaluator(args[1], environment);
    const subset = getSubsetOperator(expression, global);
    if (environment.trace) {
      return (context) => {
        const subsetValue = left(context);
        const superset = right(context);
        return withSource(subsetValue, () => subset(subsetValue, superset));
      };
    }
    return (context) => subset(left(context), right(context));
  }
  if (global?.kind === "Builtin") return compileBuiltinCall(global, args, environment);
  return (context) => {
    const operator = resolveOperator(expression.operator, context);
    if (operator) return callOperator(operator, args, context);
    const definition = environment.definitions.get(expression.operator);
    if (definition?.kind === "Function") {
      throw new TlaEvaluationError(`${expression.operator} is a function; apply it with brackets`);
    }
    if (expression.operator === "\\cdot") {
      throw new TlaEvaluationError(
        "The current version of TLC does not support action composition.  An incomplete implementation can be enabled via the tlc2.tool.impl.Tool.cdot=true java property.",
      );
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

const lookupKey = (pattern: BoundPattern, scope: Scope | undefined) => {
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

// TLC keeps a function constructor lazy when it is the function of an application, or the base of
// an EXCEPT that is, so it evaluates the body only at the arguments it is applied to.
const keptLazyExpressions = new WeakSet<Expression>();

export const keepLazy = (expression: Expression) => {
  if (expression.kind === "FunctionConstruction" || expression.kind === "Except") {
    keptLazyExpressions.add(expression);
  }
};

const compileFunctionConstruction = (
  expression: Expression & { kind: "FunctionConstruction" },
  environment: Environment,
): Evaluator => {
  const isKeptLazy = keptLazyExpressions.has(expression);
  const body = getEvaluator(expression.body, environment);
  const bounds = expression.bounds;
  const bound = bounds[0];
  const isSingleName = bounds.length === 1 && bound.pattern.kind === "Name";
  const set = getEvaluator(bound.set, environment);
  return (context) => {
    const domain = isSingleName ? set(context) : getBoundsDomain(bounds, context);
    // TLC builds the function only when it reduces every domain, and evaluates the body lazily
    // otherwise.
    const domains =
      typeof domain === "object" && domain.kind === "ProductSet" && bounds.length > 1
        ? domain.factors
        : [domain];
    if (expression.isRecursive || isKeptLazy || !domains.every(isReducible)) {
      const functionValue = createLazyFunction(
        domain,
        (argument) => body(withScope(context, bindArgument(bounds, context.scope, argument))),
        getLazyFunctionSource(bounds, expression.body, domain),
      );
      return bounds.length === 1 ? markLambdaFunction(functionValue) : functionValue;
    }
    if (isSingleName && bound.pattern.kind === "Name") {
      const name = bound.pattern.name;
      const keys = getFunctionDomain(domain);
      return markLambdaFunction(
        createSortedFunction(
          keys,
          keys.map((key) => body(withScope(context, bindValue(context.scope, name, key)))),
        ),
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
  const isKeptLazy = keptLazyExpressions.has(expression);
  if (isKeptLazy) keepLazy(expression.function);
  const evaluateFunction = getEvaluator(expression.function, environment);
  const updates = expression.updates.map((update) => ({
    path: update.path.map((step): CompiledStep =>
      step.kind === "Field"
        ? { kind: "Field", name: step.name, args: [] }
        : {
            kind: "Index",
            name: "",
            args: step.args.map((arg) => getEvaluator(arg, environment)),
          },
    ),
    value: getEvaluator(update.value, environment),
  }));
  const getKey = (step: CompiledStep, context: Context) => {
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
    return updateFunction(
      current,
      getKey(path[depth], context),
      (previous) => update(previous, path, depth + 1, context, value),
      isKeptLazy && depth === 0,
    );
  };
  return (context) => {
    let current = evaluateFunction(context);
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
      const getTest = (evaluatePredicate: Evaluator) => (element: Value) =>
        expectBoolean(
          evaluatePredicate(withScope(context, bindPattern(context.scope, pattern, element))),
          "a set filter predicate",
        );
      const test = getTest(predicate);
      if (!isReducible(base)) {
        if (isSetValue(base)) {
          const filtered: FilteredSetValue = { kind: "FilteredSet", base, test };
          filteredSetRetracers.set(filtered, (traced) => ({
            ...filtered,
            test: getTest(getEvaluator(expression.predicate, traced)),
          }));
          return filtered;
        }
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
      return createEnumeratedSet(elements);
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
        `Attempted to compute the value of an expression of form\nCHOOSE x \\in S: P, but no element of S satisfied P.\n${describeRange(expression)}`,
      );
    }
    return chosen.value;
  };
};

// TLC orders a record's fields by name.
export const getSortedFields = (fields: RecordField[]) =>
  [...fields].sort((left, right) => compareValues(left.name, right.name));

export const hasDuplicateFields = (sortedFields: RecordField[]) =>
  sortedFields.some((field, index) => index > 0 && sortedFields[index - 1].name === field.name);

export const createUnassignedError = (name: string, expression: Expression) =>
  setOwnExitCode(
    new TlaUnassignedError(
      `In evaluation, the identifier ${name} is either undefined or not an operator.\n${describeRange(expression)}`,
      name,
    ),
    EXIT_STATUS.configParseError,
  );

export const createPrimeOutsideActionError = (expression: Expression) =>
  new TlaEvaluationError(
    `A primed expression appears outside an action at ${describeLocation(expression)}`,
  );

const compileRecord = (recordFields: RecordField[], environment: Environment): Evaluator => {
  const fields = getSortedFields(recordFields);
  const hasDuplicates = hasDuplicateFields(fields);
  const values = fields.map((field) => getEvaluator(field.value, environment));
  if (hasDuplicates) {
    return (context) =>
      createFunction(
        fields.map((field, index): [Value, Value] => [field.name, values[index](context)]),
      );
  }
  const names = fields.map((field) => field.name);
  const writtenNames = recordFields.map((field) => field.name);
  if (writtenNames.some((name, index) => name !== names[index])) {
    return (context) =>
      createWrittenRecord(
        names,
        values.map((value) => value(context)),
        writtenNames,
      );
  }
  return (context) =>
    createSortedFunction(
      names,
      values.map((value) => value(context)),
    );
};

const compile = (expression: Expression, environment: Environment): Evaluator => {
  const child = (node: Expression) => getEvaluator(node, environment);
  switch (expression.kind) {
    case "Number": {
      const value = expression.value;
      return isTlcInteger(value)
        ? () => value
        : () => {
            throw createBigNumberError(expression);
          };
    }
    case "Decimal":
      return () => {
        throw createRealNumberError(expression);
      };
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
      return () => {
        throw new TlaEvaluationError(
          `An operator cannot be used as a value at ${describeLocation(expression)}`,
        );
      };
    case "And": {
      const operands = expression.operands.map(child);
      return (context) => {
        for (let index = 0; index < operands.length; index++) {
          const value = operands[index](context);
          if (typeof value !== "boolean") throw getConjunctError(expression, index, value);
          if (!value) return false;
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
        if (!context.next) throw createPrimeOutsideActionError(expression);
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
      return (context) => {
        const value = condition(context);
        if (typeof value !== "boolean") throw getConditionError(expression, value);
        return value ? consequent(context) : alternative(context);
      };
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
        throw new TlaEvaluationError(
          `Attempted to evaluate a CASE with no conditions true.\n${describeRange(expression)}`,
        );
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
      return () => {
        throw new TlaEvaluationError(
          `TLC cannot evaluate an unbounded quantifier at ${describeLocation(expression)}`,
        );
      };
    case "Choose":
    case "SetFilter":
    case "SetMap":
      return compileSetComprehension(expression, environment);
    case "SetEnumeration": {
      const elements = expression.elements.map(child);
      return (context) => createEnumeratedSet(elements.map((element) => element(context)));
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
      const fields = getSortedFields(expression.fields);
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
      keepLazy(expression.function);
      const evaluateFunction = child(expression.function);
      const args = expression.args.map(child);
      const describeNonFunction = getNonFunctionError(expression);
      if (args.length === 1 && environment.trace) {
        const argument = args[0];
        return (context) => {
          const functionValue = evaluateFunction(context);
          const argumentValue = argument(context);
          const apply = () =>
            applyFunction(functionValue, argumentValue, undefined, describeNonFunction);
          return isFunctionValue(functionValue) ? withSource(functionValue, apply) : apply();
        };
      }
      if (args.length === 1) {
        const argument = args[0];
        return (context) =>
          applyFunction(
            evaluateFunction(context),
            argument(context),
            undefined,
            describeNonFunction,
          );
      }
      return (context) =>
        applyFunction(
          evaluateFunction(context),
          createTuple(args.map((arg) => arg(context))),
          undefined,
          describeNonFunction,
        );
    }
    case "FieldAccess": {
      const record = child(expression.record);
      const field = expression.field;
      const describeMissing = getFieldError(expression);
      const describeNonRecord = getNonRecordError(expression);
      return (context) => applyFunction(record(context), field, describeMissing, describeNonRecord);
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
      const unchanged = child({
        kind: "Unchanged",
        expression: expression.subscript,
        location: expression.location,
      });
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
      return () => {
        throw new TlaEvaluationError(
          `The subexpression reference at ${describeLocation(expression)} does not name a subexpression`,
        );
      };
    case "Always":
    case "Eventually":
    case "WeakFairness":
    case "StrongFairness":
      return () => {
        throw new TlaEvaluationError(
          `TLC cannot evaluate a temporal formula in a state at ${describeLocation(expression)}`,
        );
      };
  }
};
