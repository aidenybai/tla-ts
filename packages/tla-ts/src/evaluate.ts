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
  type SourceRange,
} from "./ast";
import { getKindString } from "./builtins";
import { TlaEvaluationError, TlaUnassignedError } from "./errors";
import { EXIT_STATUS, setExitCode } from "./exit-codes";
import { generateEvaluator } from "./codegen";
import { MESSAGE_CODE } from "./tlc-messages";
import type { CheckerRuntime } from "./runtime";
import { getReadVariables } from "./dependencies";
import { contextualApplications, mapChildren, substitutedExpressions } from "./instances";
import { prettyPrint } from "./pretty-print";
import { isEnabled } from "./successors";
import {
  applyFunction,
  describeMissingArgument,
  combineHash,
  compareValues,
  createFunction,
  createNonIntegerKeyError,
  createRecord,
  createEnumeratedSet,
  createSortedFunction,
  createSortedRecord,
  createSortedSet,
  createWrittenRecord,
  createTuple,
  formatValue,
  getCardinality,
  getDomain,
  getFunctionDomain,
  getIntervalElements,
  getFunctionClass,
  getSequenceElements,
  getValueHash,
  isEnumerable,
  isFunctionValue,
  isOverriddenSet,
  isSameValue,
  markLambdaFunction,
  isReducibleSet,
  isSetValue,
  MAXIMUM_INTEGER,
  MINIMUM_INTEGER,
  toFiniteFunction,
  toFiniteSet,
  updateFunction,
  valuesEqual,
  type FilteredSetValue,
  type LazyFunctionSource,
  type LazyFunctionValue,
  type ObjectValue,
  type Value,
  markNormalized,
  setTrace,
} from "./values";
import type { TlcVersion } from "./tlc-version";

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
  // Whether TLC takes an application for a constant one although its value depends on the state.
  isLevelConstant?: boolean;
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
  // The name SANY gives each definition that a named instance such as `M == INSTANCE Module`
  // copies, such as M!Op, by the key of the copy.
  instanceNames: Map<string, string>;
  variables: string[];
  variableIndex: Map<string, number>;
  definitionValues: Map<Definition, Value>;
  constantLevels: Map<Definition, boolean>;
  // The definitions an INSTANCE copies from a module that declares constants or variables. SANY
  // wraps the body of each in its substitutions.
  substitutedDefinitions: Set<Definition>;
  evaluators: WeakMap<Expression, Evaluator>;
  // The expressions being evaluated, outermost first, when the environment replays an error to
  // find where it occurred, as TLC's CallStackTool does.
  callStack?: CallStack;
}

export interface CallStack {
  expressions: Expression[];
  // TLC stops popping the stack once an evaluation fails, so it keeps where the failure occurred.
  isFrozen: boolean;
  // The expression that built each value of the replay that TLC's CallStackTool gives a source.
  sources: WeakMap<ObjectValue, Expression>;
  // The value each expression of the replay last evaluated to.
  values: WeakMap<Expression, Value>;
  // The expression each failure last left, which tells a failure of an operand from one of the
  // method that computes the operator.
  failures: WeakMap<Error, Expression>;
  // The failure of a value with a source, which TLC raises as a FingerprintException.
  fingerprint?: FingerprintFailure;
}

export interface FingerprintFailure {
  // The sources of the values whose methods failed, outermost first.
  sources: Expression[];
  // The message of the error the innermost one raised.
  reason: string;
}

// The operators of Tool#evalAppl whose value TLC's CallStackTool gives a source.
const SOURCED_OPERATORS = new Set(["SUBSET", "UNION", "DOMAIN", "\\cup", "\\cap", "\\"]);

// CallStackTool copies the SetPredValue, FcnLambdaValue and OpLambdaValue that an evaluation
// returns without their source, and a function TLC builds from a FcnLambdaValue has none.
const SOURCED_KINDS = new Set<Expression["kind"]>([
  "SetEnumeration",
  "SetFilter",
  "SetMap",
  "Tuple",
  "FunctionSet",
  "Record",
  "RecordSet",
  "Product",
]);

const isSourced = (expression: Expression) =>
  SOURCED_KINDS.has(expression.kind) ||
  (expression.kind === "Apply" && SOURCED_OPERATORS.has(expression.operator));

// The argument whose method Tool#evalAppl calls to compute an operator, as with S.member(e) for
// e \in S, or f.apply(e) for f[e] when f is a function.
const getReceiver = (expression: Expression) => {
  if (expression.kind === "FunctionApplication" || expression.kind === "Except") {
    return expression.function;
  }
  if (expression.kind !== "Apply" || expression.args.length !== 2) return undefined;
  if (["\\subseteq", "=", "#"].includes(expression.operator)) return expression.args[0];
  return expression.operator === "\\in" || expression.operator === "\\notin"
    ? expression.args[1]
    : undefined;
};

export interface Context {
  environment: Environment;
  scope: Scope | undefined;
  state: State | undefined;
  next: State | undefined;
  // EvalControl.KeepLazy, which Tool#evalAppl sets to evaluate the function it applies and which
  // the evaluation passes on, so that a function constructor within builds a FcnLambdaValue.
  isKeepLazy?: boolean;
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

export const formatRange = (range: SourceRange) =>
  `line ${range.start.line}, col ${range.start.column} to line ${range.end.line}, col ${range.end.column} of module ${range.module}`;

export const describeRange = (expression: Expression) => {
  const range = expression.location.range;
  return range ? formatRange(range) : describeLocation(expression);
};

// SANY prints a numeral as written and any other expression by its location.
export const describeNode = (expression: Expression) =>
  expression.kind === "Number"
    ? (expression.text ?? String(expression.value))
    : describeRange(expression);

export const getConditionError = (expression: Expression, value: Value) =>
  new TlaEvaluationError(
    `A non-boolean expression (${getKindString(value)}) was used as the condition of an IF.\n${describeRange(expression)}`,
  );

// TLC parses an infix chain of /\ or \/ as nested binary junctions and a bulleted list as one
// junction list, and it words the error differently for each.
export const getJunctionError = (
  expression: Expression & { kind: "And" | "Or" },
  index: number,
  value: Value,
) => {
  const range = expression.location.range;
  const isBulleted =
    range?.start.line === expression.location.line &&
    range.start.column === expression.location.column;
  if (isBulleted || !range) {
    return new TlaEvaluationError(
      `A non-boolean expression (${getKindString(value)}) was used as a formula in a ${expression.kind === "And" ? "conjunction" : "disjunction"}.\n${describeNode(expression.operands[index])}`,
    );
  }
  const end = expression.prefixEnds?.[Math.max(index, 1) - 1] ?? range.end;
  return new TlaEvaluationError(
    `Attempted to evaluate an expression of form P ${expression.kind === "And" ? "/\\" : "\\/"} Q when ${index === 0 ? "P" : "Q"} was\n${getKindString(value)}.\n${describeRange({ ...expression, location: { ...expression.location, range: { ...range, end } } })}`,
  );
};

// TLC selects a field of a record, and of another function from the function it converts it to,
// which for a tuple keeps its domain as an interval.
export const getFieldSelector = (expression: Expression & { kind: "FieldAccess" }) => {
  const field = expression.field;
  const describeMissing = (record: Value) =>
    `Attempted to select nonexistent field "${field}" from the record\n${formatValue(record)}\n${describeRange(expression)}`;
  return (value: Value) => {
    if (!isFunctionValue(value)) {
      throw new TlaEvaluationError(
        `Attempted to select field "${field}" from a non-record value ${prettyPrint(formatValue(value))}\n${describeRange(expression)}`,
      );
    }
    if (getFunctionClass(value) === "tuple") throw createNonIntegerKeyError(field);
    return applyFunction(value, field, describeMissing);
  };
};

// TLC 1.7.4 words what a tuple or a record lacks differently.
export const getMissingArgumentError = (version: TlcVersion | undefined) =>
  version === "1.7.4"
    ? (functionValue: Value, argument: Value) =>
        describeMissingArgument(functionValue, argument, version)
    : undefined;

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

// Tool#evalAppl checks that it applies a function before it evaluates the argument.
export const expectFunction = (value: Value, application: Expression) => {
  if (isFunctionValue(value)) return value;
  throw new TlaEvaluationError(
    `A non-function (${getKindString(value)}) was applied as a function.\n${describeRange(application)}`,
  );
};

export const toKeepLazyContext = (context: Context): Context =>
  context.isKeepLazy ? context : { ...context, isKeepLazy: true };

const withScope = (context: Context, scope: Scope | undefined): Context => ({
  environment: context.environment,
  scope,
  state: context.state,
  next: context.next,
  isKeepLazy: context.isKeepLazy,
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

// TLC bounds the level of every action and temporal operator above constant, whatever its operands.
const NONCONSTANT_KINDS = new Set<Expression["kind"]>([
  "Prime",
  "Unchanged",
  "Enabled",
  "BoxAction",
  "AngleAction",
  "Always",
  "Eventually",
  "WeakFairness",
  "StrongFairness",
]);

const NONCONSTANT_OPERATORS = new Set(["~>", "-+->", "\\cdot"]);

const isNonconstant = (expression: Expression, environment: Environment): boolean => {
  if (
    NONCONSTANT_KINDS.has(expression.kind) ||
    (expression.kind === "UnboundedQuantifier" && expression.isTemporal === true) ||
    (expression.kind === "Apply" && NONCONSTANT_OPERATORS.has(expression.operator))
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
  return getChildren(expression).some((child) => isNonconstant(child, environment));
};

export const isConstantLevel = (definition: Definition, environment: Environment): boolean => {
  const cached = environment.constantLevels.get(definition);
  if (cached !== undefined) return cached;
  environment.constantLevels.set(definition, true);
  const isConstant =
    !isNonconstant(definition.body, environment) &&
    (definition.kind === "Operator" ||
      !definition.bounds.some((bound) => isNonconstant(bound.set, environment)));
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
export const getEnumeratedElements = (set: Value, expression: Expression, version: TlcVersion) => {
  if (!isSetValue(set) || isOverriddenSet(set)) {
    const text = formatValue(set);
    // TLC 1.7.4 doesn't explain why it can't enumerate a set.
    const explanation = version === "1.7.4" ? undefined : getBoundExplanation(set, text);
    throw new TlaEvaluationError(
      explanation === undefined
        ? `TLC encountered a non-enumerable quantifier bound\n${text}.\n${describeNode(expression)}`
        : `TLC encountered the non-enumerable quantifier bound\n${text}\n${describeNode(expression)}\n${explanation}`,
    );
  }
  return typeof set === "object" && set.kind === "Interval"
    ? getIntervalElements(set)
    : toFiniteSet(set).elements;
};

// The elements a quantifier visits. Like TLC, it keeps an interval as an interval, so that it can
// stop at the first witness in a large interval such as 1..2000000000 without listing it.
export const getQuantifierElements = (set: Value, expression: Expression, version: TlcVersion) => {
  if (typeof set !== "object" || set.kind !== "Interval")
    return getEnumeratedElements(set, expression, version);
  getCardinality(set);
  return set;
};

const someElement = (
  elements: ReturnType<typeof getQuantifierElements>,
  visit: (element: Value) => boolean,
) => {
  if (Array.isArray(elements)) return elements.some(visit);
  for (let element = elements.low; element <= elements.high; element++) {
    if (visit(element)) return true;
  }
  return false;
};

export const getBoundElements = (bounds: Bound[], context: Context) =>
  bounds.map((bound) =>
    getQuantifierElements(
      evaluate(bound.set, context),
      bound.set,
      context.environment.runtime.version,
    ),
  );

// Visits each binding of the bounds to the elements of their sets, until visit returns true.
export const forEachBoundElement = (
  bounds: Bound[],
  sets: ReturnType<typeof getBoundElements>,
  scope: Scope | undefined,
  visit: (scope: Scope | undefined) => boolean,
): boolean => {
  const visitBound = (index: number, bound: Scope | undefined): boolean => {
    if (index < 0) return visit(bound);
    return someElement(sets[index], (element) =>
      visitBound(index - 1, bindPattern(bound, bounds[index].pattern, element)),
    );
  };
  return visitBound(bounds.length - 1, scope);
};

export const forEachBinding = (
  bounds: Bound[],
  context: Context,
  visit: (scope: Scope | undefined) => boolean,
) => forEachBoundElement(bounds, getBoundElements(bounds, context), context.scope, visit);

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

// TLC computes a constant definition when it starts, without keeping a function it constructs
// lazy, so a function over an interval or an enumerated set is a FcnRcdValue.
const toStartupValue = (definition: Definition, value: Value): Value => {
  if (typeof value !== "object" || getFunctionClass(value) !== "lambda") return value;
  if (
    definition.kind === "Operator" ||
    definition.isSelfReferential ||
    value.kind !== "LazyFunction" ||
    !isReducibleSet(value.domain)
  ) {
    return value;
  }
  try {
    const finite = toFiniteFunction(value);
    return createSortedFunction(finite.domain, finite.range);
  } catch (error) {
    // TLC leaves a definition it fails to compute to evaluate where the spec uses it.
    if (error instanceof TlaEvaluationError) return value;
    throw error;
  }
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
    toStartupValue(definition, evaluateDefinitionBody(definition, topLevel)),
  );
  context.environment.definitionValues.set(definition, value);
  return value;
};

// TLC computes each constant definition the configuration doesn't replace when it starts, and
// leaves one it fails to compute to evaluate where the spec uses it.
export const evaluateStartupDefinitions = (definitions: Definition[], environment: Environment) =>
  definitions.forEach((definition) => {
    if (definition.kind === "Operator" && definition.params.length > 0) return;
    const name = definition.name;
    if (environment.constants.has(name) || environment.substitutions.has(name)) return;
    if (!isConstantLevel(definition, environment)) return;
    try {
      markNormalized(
        evaluateDefinitionValue(definition, {
          environment,
          scope: undefined,
          state: undefined,
          next: undefined,
        }),
      );
    } catch (error) {
      if (!(error instanceof TlaEvaluationError)) throw error;
    }
  });

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

// How to rebuild a set filter TLC evaluates lazily so that its predicate runs in another
// environment.
const filteredSetRebinders = new WeakMap<FilteredSetValue, (environment: Environment) => Value>();

// TLC's CallStackTool rebinds the lazy values its evaluations return, so their later evaluation
// records its call stack too.
const traceEvaluator =
  (
    expression: Expression,
    evaluator: Evaluator,
    environment: Environment,
    callStack: CallStack,
  ): Evaluator =>
  (context) => {
    callStack.expressions.push(expression);
    const outerSets = setTrace.sets;
    const outerCallStack = setTrace.callStack;
    const sets = outerSets ?? [];
    const depth = sets.length;
    setTrace.sets = sets;
    setTrace.callStack = callStack;
    try {
      const computed = evaluator(context);
      const rebind =
        typeof computed === "object" && computed.kind === "FilteredSet"
          ? filteredSetRebinders.get(computed)
          : undefined;
      const value = rebind ? rebind(environment) : computed;
      callStack.values.set(expression, value);
      if (typeof value === "object" && value.kind !== "FilteredSet" && isSourced(expression)) {
        callStack.sources.set(value, expression);
      }
      return value;
    } catch (error) {
      const failed = error instanceof Error ? callStack.failures.get(error) : undefined;
      if (error instanceof Error) callStack.failures.set(error, expression);
      const receiver = getReceiver(expression);
      const received =
        receiver && !getChildren(expression).some((child) => child === failed)
          ? callStack.values.get(receiver)
          : undefined;
      const value =
        expression.kind === "FunctionApplication" &&
        received !== undefined &&
        !isFunctionValue(received)
          ? undefined
          : received;
      freezeCallStack(
        callStack,
        [value, ...sets.slice(depth).filter((set) => set !== value)],
        error,
      );
      throw error;
    } finally {
      if (!callStack.isFrozen) callStack.expressions.pop();
      sets.length = depth;
      setTrace.sets = outerSets;
      setTrace.callStack = outerCallStack;
    }
  };

// A method of a value with a source raises a FingerprintException, which each value with a source
// whose method called it heads in turn. CallStack#freeze adds their sources to the stack, outermost
// first. The values are those whose methods failed, outermost first.
export const freezeCallStack = (
  callStack: CallStack,
  values: (Value | undefined)[],
  error: unknown,
) => {
  // A set that streams its elements enumerates itself too, so it can appear twice.
  const sources = [...new Set(values)].flatMap((item) => {
    const source = typeof item === "object" ? callStack.sources.get(item) : undefined;
    return source ? [source] : [];
  });
  // A value with a source raises a FingerprintException even when the stack is frozen already.
  if (sources.length > 0 && error instanceof TlaEvaluationError) {
    if (!callStack.isFrozen) callStack.expressions.push(...sources);
    const inner = callStack.fingerprint;
    callStack.fingerprint = {
      sources: [...sources, ...(inner?.sources ?? [])],
      reason: inner?.reason ?? error.message,
    };
  }
  callStack.isFrozen = true;
};

// A FingerprintException that a method of a value with a source raises, or that passes through one,
// takes the value's source as its new head.
const headFingerprint = (callStack: CallStack, source: Expression, error: unknown) => {
  if (!(error instanceof TlaEvaluationError)) return;
  if (!callStack.isFrozen) callStack.expressions.push(source);
  callStack.isFrozen = true;
  const inner = callStack.fingerprint;
  callStack.fingerprint = {
    sources: [source, ...(inner?.sources ?? [])],
    reason: inner?.reason ?? error.message,
  };
};

// A copy of the environment that records the call stack of each evaluation, with evaluators of its
// own since the environment's evaluators record nothing.
export const createTracingEnvironment = (environment: Environment): Environment => ({
  ...environment,
  evaluators: new WeakMap(),
  callStack: {
    expressions: [],
    isFrozen: false,
    sources: new WeakMap(),
    values: new WeakMap(),
    failures: new WeakMap(),
  },
});

export const getEvaluator = (expression: Expression, environment: Environment): Evaluator => {
  const cached = environment.evaluators.get(expression);
  if (cached) return cached;
  const compiled = compile(expression, environment);
  const callStack = environment.callStack;
  const evaluator = callStack
    ? traceEvaluator(expression, compiled, environment, callStack)
    : isWorthCaching(expression) && isClosedConstant(expression, environment)
      ? cacheFirstValue(compiled)
      : isStateCached(expression, environment)
        ? cacheStateValue(compiled)
        : compiled;
  environment.evaluators.set(expression, evaluator);
  return evaluator;
};

const entryEvaluators = new WeakMap<Expression, Evaluator>();

const getEntryEvaluator = (expression: Expression, environment: Environment) => {
  if (environment.callStack) return getEvaluator(expression, environment);
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

interface MemoizedCall {
  args: Value[];
  value: Value;
}

const MEMOIZED_CALL_LIMIT = 1 << 16;

const callMemos = new WeakMap<Closure, { calls: Map<number, MemoizedCall[]>; size: number }>();

const getCallMemo = (closure: Closure) => {
  const cached = callMemos.get(closure);
  if (cached) return cached;
  const memo = { calls: new Map<number, MemoizedCall[]>(), size: 0 };
  callMemos.set(closure, memo);
  return memo;
};

const getArgumentValues = (scope: Scope | undefined, arity: number) => {
  const values: Value[] = [];
  for (let current = scope; values.length < arity; current = current?.parent) {
    if (current?.binding.kind !== "Value") return undefined;
    values.push(current.binding.value);
  }
  return values;
};

const isSameArguments = (left: Value[], right: Value[]) =>
  left.every((value, index) => isSameValue(value, right[index]));

// A constant-level operator without side effects yields the same value for the same arguments,
// so its calls with evaluated arguments share one result.
const isMemoizable = (expression: Expression & { kind: "Apply" }, environment: Environment) => {
  const definition = getDefinition(expression.operator, environment);
  return (
    definition?.kind === "Operator" &&
    definition.params.length > 0 &&
    definition.params.every((param) => param.arity === 0) &&
    isConstantLevel(definition, environment) &&
    !isImpureDefinition(definition, environment)
  );
};

const compileClosureCall = (
  closure: Closure,
  args: Expression[],
  environment: Environment,
  isMemoized: boolean,
): Evaluator => {
  const bindArguments = compileArgumentScope(closure, args, environment);
  const compiled = { body: undefined as Evaluator | undefined };
  const evaluateBody = (scope: Scope | undefined, context: Context) => {
    compiled.body ??= getEntryEvaluator(closure.body, environment);
    return compiled.body({
      environment,
      scope,
      state: context.state,
      next: context.next,
      isKeepLazy: context.isKeepLazy,
    });
  };
  if (!isMemoized) return (context) => evaluateBody(bindArguments(context), context);
  const memo = getCallMemo(closure);
  return (context) => {
    const scope = bindArguments(context);
    const values = getArgumentValues(scope, args.length);
    // A call TLC evaluates with EvalControl.KeepLazy builds what a memoized one wouldn't.
    if (!values || context.isKeepLazy) return evaluateBody(scope, context);
    let hash = values.length;
    for (const value of values) hash = combineHash(hash, getValueHash(value));
    const bucket = memo.calls.get(hash);
    const known = bucket?.find((call) => isSameArguments(call.args, values));
    if (known) return known.value;
    const value = evaluateBody(scope, context);
    if (memo.size < MEMOIZED_CALL_LIMIT) {
      memo.size++;
      if (bucket) bucket.push({ args: values, value });
      else memo.calls.set(hash, [{ args: values, value }]);
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
    // The replay records the evaluation of each call, which TLC repeats.
    const isMemoized = !environment.callStack && isMemoizable(expression, environment);
    return compileClosureCall(global, args, environment, isMemoized);
  }
  if (global?.kind === "Builtin" && global.name === "DOMAIN") {
    const operand = getEvaluator(args[0], environment);
    const domain = getDomainOperator(expression);
    return (context) => domain(operand(context));
  }
  // TLC sorts the value of a constant TLCEval argument only where no context binds a name.
  if (global?.kind === "Builtin" && global.name === "TLCEval" && args.length === 1) {
    const operand = getEvaluator(args[0], environment);
    if (contextualApplications.has(expression) || isNonconstant(args[0], environment)) {
      return operand;
    }
    return (context) =>
      context.scope === undefined ? global.evaluate([operand(context)]) : operand(context);
  }
  if (global?.kind === "Builtin" && global.name === "\\subseteq" && args.length === 2) {
    const left = getEvaluator(args[0], environment);
    const right = getEvaluator(args[1], environment);
    const subset = getSubsetOperator(expression, global);
    return (context) => subset(left(context), right(context));
  }
  if (global?.kind === "Builtin") return compileBuiltinCall(global, args, environment);
  // TLC refuses action composition unless a Java property enables its incomplete implementation.
  if (expression.operator === "\\cdot" && args.length === 2) {
    return () => {
      throw new TlaEvaluationError(
        environment.runtime.version === "1.7.4"
          ? "The current version of TLC does not support action composition."
          : "The current version of TLC does not support action composition.  An incomplete implementation can be enabled via the tlc2.tool.impl.Tool.cdot=true java property.",
      );
    };
  }
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
      const isFound = someElement(
        getQuantifierElements(set(context), bound.set, environment.runtime.version),
        (element) =>
          expectBoolean(
            body(withScope(context, bindValue(context.scope, name, element))),
            description,
          ) !== isForall,
      );
      return isFound ? !isForall : isForall;
    };
  }
  const bounds = expression.bounds;
  if (bounds.every((item) => item.pattern.kind === "Name")) {
    const names = bounds.map((item) => (item.pattern.kind === "Name" ? item.pattern.name : ""));
    const sets = bounds.map((item) => getEvaluator(item.set, environment));
    return (context) => {
      const lists = sets.map((set, index) =>
        getQuantifierElements(set(context), bounds[index].set, environment.runtime.version),
      );
      const visit = (index: number, scope: Scope | undefined): boolean => {
        if (index < 0) {
          return expectBoolean(body(withScope(context, scope)), description) !== isForall;
        }
        return someElement(lists[index], (element) =>
          visit(index - 1, bindValue(scope, names[index], element)),
        );
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
  const construct = (domain: Value, context: Context) => {
    if (isSingleName && bound.pattern.kind === "Name") {
      const name = bound.pattern.name;
      const keys = getFunctionDomain(domain);
      const functionValue = createSortedFunction(
        keys,
        keys.map((key) => body(withScope(context, bindValue(context.scope, name, key)))),
      );
      // FcnLambdaValue#toFcnRcd builds a FcnRcdValue over an interval or an enumerated set.
      return isReducibleSet(domain) ? functionValue : markLambdaFunction(functionValue);
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
  const createLazy = (domain: Value, context: Context) => {
    const functionValue = createLazyFunction(
      domain,
      (argument) => body(withScope(context, bindArgument(bounds, context.scope, argument))),
      getLazyFunctionSource(bounds, expression.body, domain),
    );
    return bounds.length === 1 ? markLambdaFunction(functionValue) : functionValue;
  };
  const callStack = environment.callStack;
  return (context) => {
    const domain = isSingleName ? set(context) : getBoundsDomain(bounds, context);
    if (expression.isRecursive || isKeptLazy || context.isKeepLazy || !isEnumerable(domain)) {
      return createLazy(domain, context);
    }
    // TLC builds a function over a domain other than a set enumeration or an interval lazily, so
    // its body fails only where TLC forces it, as the replay does. Building it at once is faster
    // otherwise.
    if (!isReducibleSet(domain)) {
      if (callStack) return createLazy(domain, context);
      try {
        return construct(domain, context);
      } catch (error) {
        if (!(error instanceof TlaEvaluationError)) throw error;
        return createLazy(domain, context);
      }
    }
    if (!callStack) return construct(domain, context);
    // TLC builds the function in a method of the FcnLambdaValue that CallStackTool gives a source.
    try {
      return construct(domain, context);
    } catch (error) {
      headFingerprint(callStack, expression, error);
      throw error;
    }
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
    for (const item of updates) {
      // TLC leaves the value as it is when an update's path is not in it, and warns.
      const found = { value: false };
      current = update(current, item.path, 0, context, (inner) => {
        found.value = true;
        return item.value(inner);
      });
      if (!found.value) {
        context.environment.runtime.warn(
          MESSAGE_CODE.exceptAppliedToUnknownField,
          `The EXCEPT was applied to non-existing fields of the value at\n${describeRange(expression.function)}`,
        );
      }
    }
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
    const range = expression.predicate.location.range;
    const source = range && {
      names: pattern.kind === "Name" ? pattern.name : pattern.names.join(", "),
      predicate: formatRange(range),
    };
    const createTest = (evaluator: Evaluator, context: Context) => (element: Value) =>
      expectBoolean(
        evaluator(withScope(context, bindPattern(context.scope, pattern, element))),
        "a set filter predicate",
      );
    const createFiltered = (
      base: Value,
      context: Context,
      evaluator: Evaluator,
    ): FilteredSetValue => {
      const filtered: FilteredSetValue = {
        kind: "FilteredSet",
        base,
        test: createTest(evaluator, context),
        source,
      };
      filteredSetRebinders.set(filtered, (tracing) =>
        createFiltered(
          base,
          { ...context, environment: tracing },
          getEvaluator(expression.predicate, tracing),
        ),
      );
      return filtered;
    };
    return (context) => {
      const base = set(context);
      // TLC filters any value it can't enumerate lazily, and fails only when it uses the result.
      if (!isReducibleSet(base)) return createFiltered(base, context, predicate);
      return createSortedSet(toFiniteSet(base).elements.filter(createTest(predicate, context)));
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
  const evaluateSet = getEvaluator(set, environment);
  return (context) => {
    const base = evaluateSet(context);
    if (!isSetValue(base) || isOverriddenSet(base)) {
      throw new TlaEvaluationError(
        `Attempted to compute the value of an expression of\nform CHOOSE x \\in S: P, but S was not enumerable.\n${describeRange(expression)}`,
      );
    }
    const chosen = { value: undefined as Value | undefined };
    const elements = getQuantifierElements(base, set, context.environment.runtime.version);
    someElement(elements, (element) => {
      const scope = bindPattern(context.scope, expression.pattern, element);
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

// TLC's Tool#evalAppl fails to look up a variable the state doesn't assign.
export const createUnassignedError = (name: string, expression: Expression) =>
  new TlaUnassignedError(
    `In evaluation, the identifier ${name} is either undefined or not an operator.\n${describeRange(expression)}`,
    name,
  );

// TLC's Tool#enabled reads the subscript of <<A>>_v in the successor as a state of its own, and
// names the fairness condition when A leaves a variable of v unassigned, unlike TLC 1.7.4's.
export const toUnspecifiedSubscriptError = (error: unknown, version: TlcVersion | undefined) =>
  error instanceof TlaUnassignedError && version !== "1.7.4"
    ? new TlaEvaluationError(
        `The action formula A appearing in a WF_v(A) or SF_v(A) operator does not specify the primed value of the variable ${error.variable} occurring in the state formula v.\n`,
      )
    : error;

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
      createRecord(
        fields.map((field, index): [string, Value] => [field.name, values[index](context)]),
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
    createSortedRecord(
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
    case "Bracket":
      return () => {
        throw new TlaEvaluationError(
          `A bracket without a function or subscript is not an expression at ${describeLocation(expression)}`,
        );
      };
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
          if (typeof value !== "boolean") throw getJunctionError(expression, index, value);
          if (!value) return false;
        }
        return true;
      };
    }
    case "Or": {
      const operands = expression.operands.map(child);
      return (context) => {
        for (let index = 0; index < operands.length; index++) {
          const value = operands[index](context);
          if (typeof value !== "boolean") throw getJunctionError(expression, index, value);
          if (value) return true;
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
          isKeepLazy: context.isKeepLazy,
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
        source: arm.condition,
        condition: child(arm.condition),
        body: child(arm.body),
      }));
      const other = expression.other ? child(expression.other) : undefined;
      return (context) => {
        for (const arm of arms) {
          const value = arm.condition(context);
          if (typeof value !== "boolean") {
            throw new TlaEvaluationError(
              `A non-boolean expression (${getKindString(value)}) was used as a condition of a CASE. ${describeNode(arm.source)}`,
            );
          }
          if (value) return arm.body(context);
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
      const evaluated = child(expression.function);
      const evaluateFunction = (context: Context) =>
        expectFunction(evaluated(toKeepLazyContext(context)), expression);
      const args = expression.args.map(child);
      const describeMissing = getMissingArgumentError(environment.runtime.version);
      if (args.length === 1) {
        const argument = args[0];
        return (context) =>
          applyFunction(evaluateFunction(context), argument(context), describeMissing);
      }
      return (context) =>
        applyFunction(
          evaluateFunction(context),
          createTuple(args.map((arg) => arg(context))),
          describeMissing,
        );
    }
    case "FieldAccess": {
      const record = child(expression.record);
      const select = getFieldSelector(expression);
      return (context) => select(record(context));
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
