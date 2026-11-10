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
import {
  isStackOverflow,
  TlaEvaluationError,
  TlaSetBoundError,
  TlaUnassignedError,
} from "./errors";
import { EXIT_STATUS, setExitCode } from "./exit-codes";
import { generateEvaluator } from "./codegen";
import { MESSAGE_CODE } from "./tlc/messages";
import type { CheckerRuntime } from "./runtime";
import {
  isConstantLevel,
  isImpureDefinition,
  isNonconstant,
  type DefinitionFacts,
} from "./dependencies";
import { contextualApplications, substitutionFrames } from "./instances";
import { prettyPrint } from "./pretty-print";
import { isEnabled } from "./successors";
import {
  applyFunction,
  describeMissingArgument,
  compareValues,
  createFunction,
  addBoundedElement,
  createNonIntegerKeyError,
  forEachElement,
  createRecord,
  createEnumeratedSet,
  createSortedFunction,
  createSortedRecord,
  createNormalizedSet,
  createWrittenRecord,
  createTuple,
  formatValue,
  getCardinality,
  getDomain,
  getFunctionDomain,
  getIntervalElements,
  getLazySubsets,
  getStreamedElements,
  normalizeShallowly,
  getFunctionClass,
  getNormalizedSetElements,
  getSequenceElements,
  isElementOf,
  isEnumerable,
  isFunctionValue,
  isOverriddenSet,
  markLambdaFunction,
  isReducibleSet,
  isSetValue,
  isSettledValue,
  isTlcInteger,
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
import type { TlcVersion } from "./tlc/version";

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
  // Whether the value may stream until TLC caches it, so the thunk caches only a settled value.
  isStreamed: boolean;
}

type Binding =
  // A literal argument keeps its expression, which TLC binds lazily like any other.
  | { kind: "Value"; value: Value; argument?: Expression }
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
  instanceNames: Map<string, string>;
  variables: string[];
  variableIndex: Map<string, number>;
  facts: DefinitionFacts;
  // TLC evaluates a constant definition it failed to compute at startup where the spec uses it.
  startupValues: (Value | undefined)[];
  // SANY wraps the body of each of these INSTANCE copies in its substitutions.
  substitutedDefinitions: Set<Definition>;
  instanceParams: Set<OperatorParam>;
  evaluators: WeakMap<Expression, Evaluator>;
  entryEvaluators: WeakMap<Expression, Evaluator>;
  definitionEvaluators: WeakMap<Definition, Evaluator>;
  callStack?: CallStack;
}

export interface CallStack {
  expressions: Expression[];
  // TLC stops popping the stack once an evaluation fails, so it keeps where the failure occurred.
  isFrozen: boolean;
  sources: WeakMap<ObjectValue, Expression>;
  values: WeakMap<Expression, Value>;
  // Tells a failure of an operand from one of the method that computes the operator.
  failures: WeakMap<Error, Expression>;
  fingerprint?: FingerprintFailure;
}

export interface FingerprintFailure {
  // The sources of the values whose methods failed, outermost first.
  sources: Expression[];
  reason: string;
}

// The operators whose value TLC's CallStackTool gives a source.
const SOURCED_OPERATORS = new Set(["SUBSET", "UNION", "DOMAIN", "\\cup", "\\cap", "\\"]);

// CallStackTool returns these lazy values without their source, and a function TLC builds
// from a FcnLambdaValue has none.
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

// The operand whose Java method computes the operator, such as S in e \in S or f in f[e].
const getReceiver = (expression: Expression, values: CallStack["values"]) => {
  if (expression.kind === "FunctionApplication" || expression.kind === "Except") {
    return expression.function;
  }
  if (expression.kind !== "Apply" || expression.args.length !== 2) return undefined;
  if (["\\subseteq", "=", "#", "\\"].includes(expression.operator)) return expression.args[0];
  if (expression.operator === "\\cap" || expression.operator === "\\cup") {
    const left = values.get(expression.args[0]);
    return left !== undefined && isReducibleSet(left) ? expression.args[0] : expression.args[1];
  }
  return expression.operator === "\\in" || expression.operator === "\\notin"
    ? expression.args[1]
    : undefined;
};

export interface Context {
  environment: Environment;
  scope: Scope | undefined;
  state: State | undefined;
  next: State | undefined;
  // TLC's EvalControl.KeepLazy, so a function constructor within an applied function stays lazy.
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

const TEMPORAL_FORMS = {
  Always: "[]A",
  Eventually: "<>A",
  WeakFairness: "WF",
  StrongFairness: "SF",
};

const createTemporalFormulaError = (form: string, expression: Expression) =>
  new TlaEvaluationError(
    `TLC encountered a temporal formula (${form}) when evaluating a predicate or action.\n${describeRange(expression)}`,
  );

// SANY prints a numeral as written and any other expression by its location.
export const describeNode = (expression: Expression) =>
  expression.kind === "Number"
    ? (expression.text ?? String(expression.value))
    : describeRange(expression);

export const createConditionError = (expression: Expression, value: Value) =>
  new TlaEvaluationError(
    `A non-boolean expression (${getKindString(value)}) was used as the condition of an IF.\n${describeRange(expression)}`,
  );

// TLC words the error differently for an infix chain of /\ or \/ and for a bulleted list.
export const createJunctionError = (
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

// TLC selects a field from the function it converts a non-record to, which keeps a tuple's domain.
export const getFieldSelector = (expression: Expression & { kind: "FieldAccess" }) => {
  const field = expression.field;
  const describeMissing = (record: Value) =>
    `Attempted to select nonexistent field "${field}" from the record\n${prettyPrint(formatValue(record))}\n${describeRange(expression)}`;
  const describeNotInDomain = (functionValue: Value) =>
    `Attempted to apply function:\n${prettyPrint(formatValue(functionValue))}\nto argument "${field}", which is not in the domain of the function.`;
  return (value: Value) => {
    if (!isFunctionValue(value)) {
      throw new TlaEvaluationError(
        `Attempted to select field "${field}" from a non-record value ${prettyPrint(formatValue(value))}\n${describeRange(expression)}`,
      );
    }
    const functionClass = getFunctionClass(value);
    if (functionClass === "tuple") throw createNonIntegerKeyError(field);
    // Only TLC's RecordValue names the field it lacks, and TLC enumerates a FcnLambdaValue first.
    return applyFunction(
      value.kind === "LazyFunction" ? toFiniteFunction(value) : value,
      field,
      functionClass === "record" ? describeMissing : describeNotInDomain,
    );
  };
};

// TLC 1.7.4 words what a tuple or a record lacks differently.
export const getMissingArgumentDescriber = (version: TlcVersion | undefined) =>
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
    new TlaEvaluationError(`TLC can't handle real numbers.\n${expression.text}`),
    EXIT_STATUS.configParseError,
  );

export const createBigNumberError = (expression: NumberExpression) =>
  setExitCode(
    new TlaEvaluationError(
      `TLC can't handle a number this big.\n${expression.text ?? expression.value}`,
    ),
    EXIT_STATUS.error,
  );

export const createUnassignedError = (name: string, expression: Expression) =>
  new TlaUnassignedError(
    `In evaluation, the identifier ${name} is either undefined or not an operator.\n${describeRange(expression)}`,
    name,
  );

// TLC reads the subscript of <<A>>_v in the successor as a state of its own, and after 1.7.4
// names the fairness condition when A leaves a variable of v unassigned.
export const toUnspecifiedSubscriptError = (error: unknown, version: TlcVersion | undefined) =>
  error instanceof TlaUnassignedError && version !== "1.7.4"
    ? new TlaEvaluationError(
        `The action formula A appearing in a WF_v(A) or SF_v(A) operator does not specify the primed value of the variable ${error.variable} occurring in the state formula v.\n`,
      )
    : error;

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

export const bindPattern = (scope: Scope | undefined, pattern: BoundPattern, value: Value) => {
  if (pattern.kind === "Name") return bindValue(scope, pattern.name, value);
  const elements = getSequenceElements(value);
  if (!elements || elements.length !== pattern.names.length) {
    // TLC's template for this message ends in a stray %1, which tla-ts leaves out.
    throw new TlaEvaluationError("Argument mismatch in operator application.");
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
  context.isKeepLazy
    ? context
    : {
        environment: context.environment,
        scope: context.scope,
        state: context.state,
        next: context.next,
        isKeepLazy: true,
      };

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

export const expectImplication = (value: Value, expression: Expression, side: "P" | "Q") => {
  if (typeof value !== "boolean") {
    throw new TlaEvaluationError(
      `Attempted to evaluate an expression of form P => Q when ${side} was\n${getKindString(value)}.\n${describeRange(expression)}`,
    );
  }
  return value;
};

export const negate = (value: Value, expression: Expression) => {
  if (typeof value !== "boolean") {
    throw new TlaEvaluationError(
      `Attempted to apply the operator ~ to a non-boolean\n(${getKindString(value)})\n${describeRange(expression)}`,
    );
  }
  return !value;
};

export const isEquivalent = (left: Value, right: Value, expression: Expression) => {
  if (typeof left !== "boolean" || typeof right !== "boolean") {
    throw new TlaEvaluationError(
      `Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.\n${describeRange(expression)}`,
    );
  }
  return left === right;
};

export const expectBooleanBody = (value: Value, expression: Expression) => {
  if (typeof value !== "boolean") {
    throw new TlaEvaluationError(
      `TLC expected a boolean value, but did not find one. ${describeNode(expression)}`,
    );
  }
  return value;
};

export const getDefinition = (name: string, environment: Environment) =>
  environment.definitions.get(environment.substitutions.get(name) ?? name);

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

// TLC enumerates every set but its Java ones, so any other set fails as its own class does.
const checkEnumerable = (set: Value, expression: Expression, version: TlcVersion) => {
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
};

const getEnumeratedElements = (set: Value, expression: Expression, version: TlcVersion) => {
  checkEnumerable(set, expression, version);
  if (typeof set === "object" && set.kind === "Interval") return getIntervalElements(set);
  return getLazySubsets(set) ?? getNormalizedSetElements(set);
};

// TLC 1.7.4 streams a lazy set's elements, where later versions normalize the set first.
export const getContextElements = (set: Value, expression: Expression, version: TlcVersion) => {
  if (version !== "1.7.4") return getEnumeratedElements(set, expression, version);
  checkEnumerable(set, expression, version);
  return getLazySubsets(set) ?? getStreamedElements(set);
};

// Like TLC, keep an interval so a quantifier can stop at a witness in 1..2000000000 early.
const getKeptInterval = (set: Value) => {
  if (typeof set !== "object" || set.kind !== "Interval") return undefined;
  getCardinality(set);
  return set;
};

export const getQuantifierElements = (set: Value, expression: Expression, version: TlcVersion) =>
  getKeptInterval(set) ?? getContextElements(set, expression, version);

const getNormalizedElements = (set: Value, expression: Expression, version: TlcVersion) =>
  getKeptInterval(set) ?? getEnumeratedElements(set, expression, version);

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

// The names of one bound, as in \A x, y \in S, share its set, which TLC evaluates once.
export const mapBoundSets = <Result>(bounds: Bound[], map: (set: Expression) => Result) =>
  bounds.reduce<Result[]>((results, bound, index) => {
    results.push(
      index > 0 && bounds[index - 1].set === bound.set ? results[index - 1] : map(bound.set),
    );
    return results;
  }, []);

export const getBoundElements = (bounds: Bound[], context: Context) =>
  mapBoundSets(bounds, (set) =>
    getQuantifierElements(evaluate(set, context), set, context.environment.runtime.version),
  );

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

const getBoundsDomain = (bounds: Bound[], context: Context): Value => {
  const sets = mapBoundSets(bounds, (set) => evaluate(set, context));
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

interface LazyFunction {
  value: LazyFunctionValue;
  bounds: Bound[];
  body: Expression;
  scope: Scope | undefined;
}

// Kept on the value itself, since a WeakMap entry per short-lived function slows every GC.
interface KeptLazyFunctionValue extends LazyFunctionValue {
  lambda: LazyFunction;
}

const isKeptLazyFunction = (value: Value): value is KeptLazyFunctionValue =>
  typeof value === "object" && value.kind === "LazyFunction" && "lambda" in value;

const keepLambda = (lambda: LazyFunction) => Object.assign(lambda.value, { lambda });

export const getLazyFunction = (value: Value) =>
  isKeptLazyFunction(value) ? value.lambda : undefined;

// Like TLC, ignore arguments beyond the parameters.
export const bindLazyArguments = (
  lambda: LazyFunction,
  expression: Expression & { kind: "FunctionApplication" },
  context: Context,
) => {
  const value = lambda.value;
  const args = expression.args.map((arg) => evaluate(arg, context));
  const argument = args.length === 1 ? args[0] : createTuple(args);
  const describeArgument = (ordinal: string, element: Value, problem: string) =>
    `In applying the function\n${prettyPrint(formatValue(value))},\nthe ${ordinal} is:\n${prettyPrint(formatValue(element))}${problem}.\n${describeRange(expression.function)}`;
  const bounds = lambda.bounds;
  if (bounds.length === 1) {
    if (!isElementOf(argument, value.domain)) {
      throw new TlaEvaluationError(
        describeArgument("first argument", argument, "which is not in its domain"),
      );
    }
    return bindArgument(bounds, lambda.scope, argument);
  }
  const elements = getSequenceElements(argument);
  const domains =
    typeof value.domain === "object" && value.domain.kind === "ProductSet"
      ? value.domain.factors
      : [];
  if (elements === undefined || elements.length < bounds.length) {
    throw new TlaEvaluationError(
      `Attempted to apply a function to an argument not in its domain.\n${describeRange(expression.function)}`,
    );
  }
  bounds.forEach((bound, index) => {
    const element = elements[index];
    const ordinal = `argument number ${index + 1}`;
    if (!isElementOf(element, domains[index])) {
      throw new TlaEvaluationError(
        describeArgument(
          ordinal,
          element,
          `${bound.pattern.kind === "Name" ? "" : "\n"}which is not in its domain`,
        ),
      );
    }
    if (
      bound.pattern.kind === "Tuple" &&
      getSequenceElements(element)?.length !== bound.pattern.names.length
    ) {
      throw new TlaEvaluationError(
        describeArgument(ordinal, element, "which does not match its formal parameter"),
      );
    }
  });
  return bindArgument(bounds, lambda.scope, createTuple(elements.slice(0, bounds.length)));
};

// TLC prints a function it can't enumerate with only the first name of a group such as m, n.
interface LazyFunctionTemplate {
  parameters: { index: number; name: string }[];
  body: string;
}

const getLazyFunctionTemplate = (bounds: Bound[], body: Expression) => {
  const range = body.location.range;
  if (!range) return undefined;
  return {
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
};

const getLazyFunctionSource = (
  template: LazyFunctionTemplate | undefined,
  bounds: Bound[],
  domain: Value,
) => {
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
  boundTupleLengths: (number | undefined)[] | undefined,
) => {
  const self: LazyFunctionValue = {
    kind: "LazyFunction",
    domain,
    source,
    boundTupleLengths,
    apply: (argument) => compute(argument, self),
  };
  return self;
};

const getBoundTupleLengths = (bounds: Bound[]) =>
  bounds.length === 1
    ? undefined
    : bounds.map((bound) =>
        bound.pattern.kind === "Tuple" ? bound.pattern.names.length : undefined,
      );

// The function constructor of a definition, which SANY locates at the whole definition.
const getDefinitionSource = (definition: FunctionDefinition): Expression => ({
  kind: "FunctionConstruction",
  bounds: definition.bounds,
  body: definition.body,
  location: definition.location,
});

const createRecursiveFunction = (
  definition: FunctionDefinition,
  context: Context,
): RebindableLazyFunction => {
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
    getLazyFunctionSource(
      getLazyFunctionTemplate(definition.bounds, definition.body),
      definition.bounds,
      domain,
    ),
    getBoundTupleLengths(definition.bounds),
  );
  keepLambda({
    value: functionValue,
    bounds: definition.bounds,
    body: definition.body,
    scope: bindValue(undefined, definition.name, functionValue),
  });
  const rebindable: RebindableLazyFunction = Object.assign(functionValue, {
    rebind: (tracing: Environment) => {
      const rebound = createRecursiveFunction(definition, { ...context, environment: tracing });
      rebound.enumerated = functionValue.enumerated;
      return rebound;
    },
  });
  return definition.bounds.length === 1 ? markLambdaFunction(rebindable) : rebindable;
};

// TLC computes a constant definition eagerly, so a function over a reducible set is a FcnRcdValue.
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

// TLC evaluates a function definition that isn't recursive as it does a function constructor.
const compileDefinitionBody = (definition: Definition, environment: Environment): Evaluator => {
  if (definition.kind === "Operator" && definition.params.length > 0) {
    return () => {
      throw new TlaEvaluationError(
        `Operator ${definition.name} requires ${definition.params.length} arguments`,
      );
    };
  }
  if (definition.kind !== "Function") return getEntryEvaluator(definition.body, environment);
  if (definition.isSelfReferential)
    return (context) => createRecursiveFunction(definition, context);
  return getEntryEvaluator(getDefinitionSource(definition), environment);
};

const getDefinitionEvaluator = (definition: Definition, environment: Environment): Evaluator => {
  const compiled = environment.definitionEvaluators.get(definition);
  if (compiled) return compiled;
  const body = compileDefinitionBody(definition, environment);
  const id = environment.facts.ids.get(definition);
  const startupValues = environment.startupValues;
  const evaluator: Evaluator =
    id === undefined
      ? (context) => body(withScope(context, undefined))
      : (context) => startupValues[id] ?? body(withScope(context, undefined));
  environment.definitionEvaluators.set(definition, evaluator);
  return evaluator;
};

export const getStartupValue = (definition: Definition, environment: Environment) => {
  const id = environment.facts.ids.get(definition);
  return id === undefined ? undefined : environment.startupValues[id];
};

export const evaluateStartupDefinitions = (definitions: Definition[], environment: Environment) =>
  definitions.forEach((definition) => {
    if (definition.kind === "Operator" && definition.params.length > 0) return;
    const name = definition.name;
    if (environment.constants.has(name) || environment.substitutions.has(name)) return;
    if (!isConstantLevel(definition, environment)) return;
    const id = environment.facts.ids.get(definition);
    if (id === undefined || environment.startupValues[id] !== undefined) return;
    const context = { environment, scope: undefined, state: undefined, next: undefined };
    try {
      const value = environment.runtime.evaluateAtStartup(() =>
        toStartupValue(definition, compileDefinitionBody(definition, environment)(context)),
      );
      markNormalized(value);
      environment.startupValues[id] = value;
    } catch (error) {
      // TLC swallows whatever the definition throws, a stack overflow included.
      if (!(error instanceof TlaEvaluationError) && !isStackOverflow(error)) throw error;
    }
  });

// TLC reuses a cached value while each variable the cached state assigns keeps its value.
const isStateWithin = (state: State | undefined, cached: State | undefined) => {
  if (cached === undefined || state === cached) return true;
  try {
    return cached.every(
      (value, index) =>
        value === undefined || (state?.[index] !== undefined && valuesEqual(state[index], value)),
    );
  } catch (error) {
    if (error instanceof TlaEvaluationError) return false;
    throw error;
  }
};

const forceThunk = (thunk: Thunk, context: Context) => {
  const cache = thunk.cache;
  const isCached =
    cache !== undefined &&
    isStateWithin(context.state, thunk.state) &&
    isStateWithin(context.next, thunk.next);
  if (isCached) return cache;
  const value = evaluate(thunk.expression, withScope(context, thunk.scope));
  if (!thunk.isStreamed || isSettledValue(value)) {
    thunk.cache = value;
    thunk.state = context.state;
    thunk.next = context.next;
  }
  return value;
};

const getDefinitionClosure = (definition: Definition & { kind: "Operator" }): Closure => ({
  kind: "Closure",
  name: definition.name,
  params: definition.params,
  body: definition.body,
  scope: undefined,
});

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

export const resolveApplyOperator = (
  expression: Expression & { kind: "Apply" },
  context: Context,
): Operator | undefined =>
  isLocallyResolved(expression)
    ? resolveOperator(expression.operator, context)
    : (resolveGlobalOperator(expression.operator, context.environment) ??
      resolveOperator(expression.operator, context));

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
  if (operator.kind === "Builtin" && operator.isLazy) {
    return operator.evaluate(
      args.map((value) => ({ kind: "Operator", name: "argument", arity: 0, call: () => value })),
      context,
    );
  }
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

const evaluateBuiltinArguments = (args: Expression[], context: Context) =>
  args.map((arg) =>
    isOperatorArgument(arg, context)
      ? toOperatorValue(evaluateOperatorArgument(arg, context), context)
      : evaluate(arg, context),
  );

const createArityError = (closure: Closure, count: number) =>
  new TlaEvaluationError(
    `Operator ${closure.name} expects ${closure.params.length} arguments but received ${count}`,
  );

const createThunk = (expression: Expression, context: Context): Thunk => ({
  kind: "Thunk",
  expression,
  scope: context.scope,
  state: context.state,
  next: context.next,
  cache: undefined,
  isStreamed: false,
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
    const binding: Binding = { kind: "Value", value: argument.value, argument };
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
    if (global === undefined && !environment.callStack) {
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

export const bindOperatorArguments = (
  closure: Closure,
  args: Expression[],
  context: Context,
  binders?: ArgumentBinder[],
): Scope | undefined => {
  if (args.length !== closure.params.length) throw createArityError(closure, args.length);
  let scope = closure.scope;
  for (let index = 0; index < args.length; index++) {
    const param = closure.params[index];
    const binding: Binding =
      param.arity > 0
        ? { kind: "Operator", operator: evaluateOperatorArgument(args[index], context) }
        : (binders?.[index] ?? compileArgumentBinder(args[index], context.environment))(context);
    scope = { name: param.name, binding, parent: scope };
  }
  return scope;
};

const callOperator = (
  operator: Operator,
  args: Expression[],
  context: Context,
  binders: ArgumentBinder[],
) => {
  if (operator.kind === "Closure") {
    return evaluate(
      operator.body,
      withScope(context, bindOperatorArguments(operator, args, context, binders)),
    );
  }
  if (operator.kind === "Operator") return operator.call(args.map((arg) => evaluate(arg, context)));
  if (operator.isLazy) return operator.evaluate(getLazyArguments(args, context), context);
  return operator.evaluate(evaluateBuiltinArguments(args, context), context);
};

interface ReevaluatedDefinitions {
  impure: ReadonlySet<Definition>;
  streamed: ReadonlySet<Definition>;
}

export const bindDefinitions = (
  definitions: Definition[],
  context: Context,
  reevaluated?: ReevaluatedDefinitions,
): Scope | undefined => {
  const nodes = definitions.map((definition): Scope => ({
    name: definition.name,
    binding: { kind: "Value", value: false },
    parent: undefined,
  }));
  const scope = nodes.reduce<Scope | undefined>((parent, node) => {
    node.parent = parent;
    return node;
  }, context.scope);
  definitions.forEach((definition, index) => {
    nodes[index].binding =
      definition.kind === "Function"
        ? {
            kind: "Thunk",
            expression: {
              kind: "FunctionConstruction",
              bounds: definition.bounds,
              body: definition.body,
              location: definition.location,
              isRecursive: true,
            },
            scope,
            state: context.state,
            next: context.next,
            cache: undefined,
            isStreamed: false,
          }
        : definition.params.length > 0 || reevaluated?.impure.has(definition)
          ? {
              kind: "Operator",
              operator: {
                kind: "Closure",
                name: definition.name,
                params: definition.params,
                body: definition.body,
                scope,
              },
            }
          : {
              kind: "Thunk",
              expression: definition.body,
              scope,
              state: context.state,
              next: context.next,
              cache: undefined,
              isStreamed: reevaluated?.streamed.has(definition) ?? false,
            };
  });
  return scope;
};

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
  if (global?.kind === "Definition") {
    return getDefinitionEvaluator(global.definition, context.environment)(context);
  }
  const builtin = context.environment.builtins.get(name);
  if (builtin?.arity === 0) return builtin.evaluate([], context);
  throw new TlaEvaluationError(`Unknown identifier ${name} at ${describeLocation(expression)}`);
};

// TLC's next-state generator evaluates a LET definition again at each reference, so one that
// calls an impure builtin repeats its effects, and a UNION or \cup set starts out uncached.
export const getReevaluatedDefinitions = (
  definitions: Definition[],
  environment: Environment,
): ReevaluatedDefinitions => ({
  impure: new Set(definitions.filter((definition) => isImpureDefinition(definition, environment))),
  streamed: new Set(
    definitions.filter((definition) => isImpureDefinition(definition, environment, "streamed")),
  ),
});

export const isImpure = (environment: Environment) =>
  [...environment.facts.ids.keys()].some((definition) =>
    isImpureDefinition(definition, environment),
  );

export const hasRepeatedEffects = (environment: Environment) =>
  [...environment.facts.ids.keys()].some((definition) =>
    isImpureDefinition(definition, environment, "repeated"),
  );

interface RebindableFilteredSet extends FilteredSetValue {
  rebind: (environment: Environment) => Value;
}

interface RebindableLazyFunction extends LazyFunctionValue {
  rebind: (environment: Environment) => Value;
}

const isRebindable = (value: Value): value is RebindableFilteredSet | RebindableLazyFunction =>
  typeof value === "object" &&
  (value.kind === "FilteredSet" || value.kind === "LazyFunction") &&
  "rebind" in value;

const toNextContext = (context: Context): Context => ({
  environment: context.environment,
  scope: context.scope,
  state: context.next,
  next: undefined,
  isKeepLazy: context.isKeepLazy,
});

// TLC evaluates the expression in the current state first.
const compileUnchanged =
  (evaluator: Evaluator): Evaluator =>
  (context) => {
    const current = evaluator(context);
    return valuesEqual(current, evaluator(toNextContext(context)));
  };

// TLC's CallStackTool rebinds the lazy values it returns, so their later evaluation records too.
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
      const value = isRebindable(computed) ? computed.rebind(environment) : computed;
      callStack.values.set(expression, value);
      if (typeof value === "object" && value.kind !== "FilteredSet" && isSourced(expression)) {
        callStack.sources.set(value, expression);
      }
      return value;
    } catch (error) {
      if (error instanceof TlaSetBoundError && !callStack.isFrozen) {
        callStack.expressions.length = 0;
        callStack.isFrozen = true;
      }
      const failed = error instanceof Error ? callStack.failures.get(error) : undefined;
      if (error instanceof Error) callStack.failures.set(error, expression);
      const receiver = getReceiver(expression, callStack.values);
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

// A FingerprintException from a method of a value with a source is headed by each such value
// whose method called it in turn, outermost first.
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

// With evaluators of its own, since the environment's evaluators record nothing.
export const createTracingEnvironment = (environment: Environment): Environment => ({
  ...environment,
  evaluators: new WeakMap(),
  entryEvaluators: new WeakMap(),
  definitionEvaluators: new WeakMap(),
  callStack: {
    expressions: [],
    isFrozen: false,
    sources: new WeakMap(),
    values: new WeakMap(),
    failures: new WeakMap(),
  },
});

// A replay that walks into the expression has recorded its frames already.
const traceFrames =
  (
    expression: Expression,
    frames: Expression[],
    evaluator: Evaluator,
    callStack: CallStack,
  ): Evaluator =>
  (context) => {
    if (callStack.expressions.at(-1) === expression) return evaluator(context);
    callStack.expressions.push(...frames);
    try {
      return evaluator(context);
    } finally {
      if (!callStack.isFrozen) callStack.expressions.length -= frames.length;
    }
  };

export const getEvaluator = (expression: Expression, environment: Environment): Evaluator => {
  const cached = environment.evaluators.get(expression);
  if (cached) return cached;
  const compiled = compile(expression, environment);
  const callStack = environment.callStack;
  const frames = callStack && substitutionFrames.get(expression);
  const traced = callStack
    ? traceEvaluator(expression, compiled, environment, callStack)
    : compiled;
  const evaluator =
    callStack && frames ? traceFrames(expression, frames, traced, callStack) : traced;
  environment.evaluators.set(expression, evaluator);
  return evaluator;
};

export const getEntryEvaluator = (expression: Expression, environment: Environment) => {
  if (environment.callStack) return getEvaluator(expression, environment);
  const compiled = environment.entryEvaluators.get(expression);
  if (compiled) return compiled;
  const evaluator =
    generateEvaluator(expression, environment) ?? getEvaluator(expression, environment);
  environment.entryEvaluators.set(expression, evaluator);
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
  if (global?.kind === "Definition") {
    // The body compiles when first evaluated, as a recursive definition's body refers back to it.
    const definition = global.definition;
    const compiled = { reference: undefined as Evaluator | undefined };
    return (context) =>
      (compiled.reference ??= getDefinitionEvaluator(definition, environment))(context);
  }
  return (context) => evaluateLocalIdentifier(name, expression, context);
};

export const isValueArgument = (argument: Expression, environment: Environment) => {
  if (argument.kind === "Lambda" || argument.kind === "OperatorReference") return false;
  if (argument.kind !== "Identifier" || isLocallyResolved(argument)) return true;
  const operator = resolveGlobalOperator(argument.name, environment);
  return operator === undefined || getArity(operator) === 0;
};

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
  return (context) => builtin.evaluate(evaluateBuiltinArguments(args, context), context);
};

export const compileArgumentScope = (
  closure: Closure,
  args: Expression[],
  environment: Environment,
): ((context: Context) => Scope | undefined) => {
  if (args.length !== closure.params.length) {
    return () => {
      throw createArityError(closure, args.length);
    };
  }
  const params = closure.params;
  const binders = args.map((arg, index) =>
    params[index].arity > 0 ? undefined : compileArgumentBinder(arg, environment),
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
  // The body compiles when the call is first evaluated, as a recursive operator's body calls it.
  const compiled = { body: undefined as Evaluator | undefined };
  return (context) => {
    compiled.body ??= getEntryEvaluator(closure.body, environment);
    return compiled.body({
      environment,
      scope: bindArguments(context),
      state: context.state,
      next: context.next,
      isKeepLazy: context.isKeepLazy,
    });
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
      !expectImplication(left(context), expression, "P") ||
      expectImplication(right(context), expression, "Q");
  }
  if (expression.operator === "~" && args.length === 1) {
    const operand = getEvaluator(args[0], environment);
    return (context) => negate(operand(context), expression);
  }
  if (expression.operator === "<=>") {
    const left = getEvaluator(args[0], environment);
    const right = getEvaluator(args[1], environment);
    return (context) => isEquivalent(left(context), right(context), expression);
  }
  if (expression.operator === "~>" || expression.operator === "-+->") {
    return () => {
      throw createTemporalFormulaError(
        expression.operator === "~>" ? "a ~> b" : "a -+-> formula",
        expression,
      );
    };
  }
  const global = isLocallyResolved(expression)
    ? undefined
    : resolveGlobalOperator(expression.operator, environment);
  if (global?.kind === "Closure") return compileClosureCall(global, args, environment);
  if (global?.kind === "Builtin" && global.name === "DOMAIN") {
    const operand = getEvaluator(args[0], environment);
    const domain = getDomainOperator(expression);
    return (context) => domain(operand(context));
  }
  // TLC caches the value of a constant TLCEval argument only where no context binds a name.
  if (global?.kind === "Builtin" && global.name === "TLCEval" && args.length === 1) {
    const isCached =
      !contextualApplications.has(expression) && !isNonconstant(args[0], environment);
    return (context) =>
      global.evaluate(
        getLazyArguments(args, context),
        isCached && context.scope === undefined ? undefined : context,
      );
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
  const binders = args.map((arg) => compileArgumentBinder(arg, environment));
  return (context) => {
    const operator = resolveOperator(expression.operator, context);
    if (operator) return callOperator(operator, args, context, binders);
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
  const body = getEvaluator(expression.body, environment);
  const bound = expression.bounds[0];
  if (expression.bounds.length === 1 && bound.pattern.kind === "Name") {
    const name = bound.pattern.name;
    const set = getEvaluator(bound.set, environment);
    return (context) => {
      const isFound = someElement(
        getQuantifierElements(set(context), bound.set, environment.runtime.version),
        (element) =>
          expectBooleanBody(
            body(withScope(context, bindValue(context.scope, name, element))),
            expression,
          ) !== isForall,
      );
      return isFound ? !isForall : isForall;
    };
  }
  const bounds = expression.bounds;
  if (bounds.every((item) => item.pattern.kind === "Name")) {
    const names = bounds.map((item) => (item.pattern.kind === "Name" ? item.pattern.name : ""));
    return (context) => {
      const lists = mapBoundSets(bounds, (set) =>
        getQuantifierElements(
          getEvaluator(set, environment)(context),
          set,
          environment.runtime.version,
        ),
      );
      const visit = (index: number, scope: Scope | undefined): boolean => {
        if (index < 0) {
          return expectBooleanBody(body(withScope(context, scope)), expression) !== isForall;
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
      (scope) => expectBooleanBody(body(withScope(context, scope)), expression) !== isForall,
    );
    return isFound ? !isForall : isForall;
  };
};

const getBoundValue = (pattern: BoundPattern, scope: Scope | undefined) => {
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

// TLC keeps a function constructor lazy when it is applied, or is the base of an applied EXCEPT.
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
      if (isReducibleSet(domain)) return functionValue;
      functionValue.lambdaDomain = domain;
      return markLambdaFunction(functionValue);
    }
    const pairs: [Value, Value][] = [];
    const sets = mapBoundSets(bounds, (set) =>
      getNormalizedElements(evaluate(set, context), set, context.environment.runtime.version),
    );
    forEachBoundElement(bounds, sets, context.scope, (scope) => {
      const key =
        bounds.length === 1
          ? (getBoundValue(bound.pattern, scope) ?? false)
          : createTuple(bounds.map((item) => getBoundValue(item.pattern, scope) ?? false));
      pairs.push([key, body(withScope(context, scope))]);
      return false;
    });
    return createFunction(pairs);
  };
  const template = getLazyFunctionTemplate(bounds, expression.body);
  const boundTupleLengths = getBoundTupleLengths(bounds);
  const createLazy = (domain: Value, context: Context) => {
    const scope = context.scope;
    const functionValue = keepLambda({
      value: createLazyFunction(
        domain,
        (argument) => body(withScope(context, bindArgument(bounds, scope, argument))),
        getLazyFunctionSource(template, bounds, domain),
        boundTupleLengths,
      ),
      bounds,
      body: expression.body,
      scope,
    });
    return bounds.length === 1 ? markLambdaFunction(functionValue) : functionValue;
  };
  const callStack = environment.callStack;
  return (context) => {
    const domain = isSingleName ? set(context) : getBoundsDomain(bounds, context);
    if (expression.isRecursive || isKeptLazy || context.isKeepLazy || !isEnumerable(domain)) {
      return createLazy(domain, context);
    }
    // TLC builds a function lazily unless each bound is reducible, so its body fails where forced.
    const isReducibleDomain =
      bounds.length === 1
        ? isReducibleSet(domain)
        : typeof domain === "object" &&
          domain.kind === "ProductSet" &&
          domain.factors.every(isReducibleSet);
    if (!isReducibleDomain) {
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
    const predicateNode = describeNode(expression.predicate);
    const createFiltered = (
      base: Value,
      context: Context,
      evaluator: Evaluator,
    ): RebindableFilteredSet => ({
      kind: "FilteredSet",
      base,
      test: (element, isMember) => {
        if (
          pattern.kind === "Tuple" &&
          getSequenceElements(element)?.length !== pattern.names.length
        ) {
          throw new TlaEvaluationError(
            `Attempted to check if the value:\n${prettyPrint(formatValue(element))}\nis an element of a set of ${pattern.names.length}-tuples.`,
          );
        }
        const value = evaluator(withScope(context, bindPattern(context.scope, pattern, element)));
        if (typeof value !== "boolean") {
          throw new TlaEvaluationError(
            `${isMember ? "The evaluation of predicate" : "Evaluating predicate"} ${predicateNode} yielded non-Boolean value.`,
          );
        }
        return value;
      },
      source,
      rebind: (tracing) =>
        createFiltered(
          base,
          { ...context, environment: tracing },
          getEvaluator(expression.predicate, tracing),
        ),
    });
    return (context) => {
      const base = set(context);
      // TLC filters any value it can't enumerate lazily, and fails only when it uses the result.
      if (!isReducibleSet(base)) return createFiltered(base, context, predicate);
      const kept: Value[] = [];
      const visit = (element: Value) => {
        const value = predicate(withScope(context, bindPattern(context.scope, pattern, element)));
        if (typeof value !== "boolean") {
          throw new TlaEvaluationError(
            `Attempted to evaluate an expression of form {x \\in S : P(x)} when P was ${getKindString(value)}.\n${predicateNode}`,
          );
        }
        if (value) addBoundedElement(kept, element);
      };
      forEachElement(base.kind === "Interval" ? base : toFiniteSet(base).elements, visit);
      return createNormalizedSet(kept);
    };
  }
  if (expression.kind === "SetMap") {
    const mapped = getEvaluator(expression.expression, environment);
    return (context) => {
      const elements: Value[] = [];
      forEachBinding(expression.bounds, context, (scope) => {
        addBoundedElement(elements, mapped(withScope(context, scope)));
        return false;
      });
      return createEnumeratedSet(elements);
    };
  }
  const set = expression.set;
  if (!set) {
    return () => {
      throw new TlaEvaluationError(
        `TLC attempted to evaluate an unbounded CHOOSE.\nMake sure that the expression is of form CHOOSE x \\in S: P(x).\n${describeRange(expression)}`,
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
    normalizeShallowly(base);
    const chosen = { value: undefined as Value | undefined };
    const elements = getNormalizedElements(base, set, context.environment.runtime.version);
    const pattern = expression.pattern;
    someElement(elements, (element) => {
      if (
        pattern.kind === "Tuple" &&
        getSequenceElements(element)?.length !== pattern.names.length
      ) {
        throw new TlaEvaluationError(
          `Attempted to compute the value of an expression of form\nCHOOSE <<x1, ... , xN>> \\in S: P, but S was not a set\nof N-tuples.\n${describeRange(expression)}`,
        );
      }
      const scope = bindPattern(context.scope, pattern, element);
      if (!expectBooleanBody(body(withScope(context, scope)), expression)) return false;
      chosen.value = getBoundValue(pattern, scope);
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

export const getSortedFields = (fields: RecordField[]) =>
  [...fields].sort((left, right) => compareValues(left.name, right.name));

export const hasDuplicateFields = (sortedFields: RecordField[]) =>
  sortedFields.some((field, index) => index > 0 && sortedFields[index - 1].name === field.name);

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
  const getChildEvaluator = (node: Expression) => getEvaluator(node, environment);
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
      const operands = expression.operands.map(getChildEvaluator);
      return (context) => {
        for (let index = 0; index < operands.length; index++) {
          const value = operands[index](context);
          if (typeof value !== "boolean") throw createJunctionError(expression, index, value);
          if (!value) return false;
        }
        return true;
      };
    }
    case "Or": {
      const operands = expression.operands.map(getChildEvaluator);
      return (context) => {
        for (let index = 0; index < operands.length; index++) {
          const value = operands[index](context);
          if (typeof value !== "boolean") throw createJunctionError(expression, index, value);
          if (value) return true;
        }
        return false;
      };
    }
    case "Prime": {
      const inner = getChildEvaluator(expression.expression);
      return (context) => inner(toNextContext(context));
    }
    case "Unchanged":
      return compileUnchanged(getChildEvaluator(expression.expression));
    case "If": {
      const condition = getChildEvaluator(expression.condition);
      const consequent = getChildEvaluator(expression.consequent);
      const alternative = getChildEvaluator(expression.alternative);
      return (context) => {
        const value = condition(context);
        if (typeof value !== "boolean") throw createConditionError(expression, value);
        return value ? consequent(context) : alternative(context);
      };
    }
    case "Case": {
      const arms = expression.arms.map((arm) => ({
        source: arm.condition,
        condition: getChildEvaluator(arm.condition),
        body: getChildEvaluator(arm.body),
      }));
      const other = expression.other ? getChildEvaluator(expression.other) : undefined;
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
      const body = getChildEvaluator(expression.body);
      return (context) =>
        body(withScope(context, bindDefinitions(expression.definitions, context)));
    }
    case "Forall":
    case "Exists":
      return compileQuantifier(expression, environment);
    case "UnboundedQuantifier":
      return () => {
        const operator = expression.quantifier === "Forall" ? "\\A" : "\\E";
        if (expression.isTemporal) {
          throw createTemporalFormulaError(
            expression.quantifier === "Forall" ? "\\AA" : "\\EE",
            expression,
          );
        }
        throw new TlaEvaluationError(
          `TLC attempted to evaluate an unbounded ${operator}.\nMake sure that the expression is of form ${operator} x \\in S: P(x).\n${describeRange(expression)}`,
        );
      };
    case "Choose":
    case "SetFilter":
    case "SetMap":
      return compileSetComprehension(expression, environment);
    case "SetEnumeration": {
      const elements = expression.elements.map(getChildEvaluator);
      return (context) => createEnumeratedSet(elements.map((element) => element(context)));
    }
    case "Tuple": {
      const elements = expression.elements.map(getChildEvaluator);
      return (context) => createTuple(elements.map((element) => element(context)));
    }
    case "FunctionConstruction":
      return compileFunctionConstruction(expression, environment);
    case "FunctionSet": {
      const domain = getChildEvaluator(expression.domain);
      const range = getChildEvaluator(expression.range);
      return (context) => ({ kind: "FunctionSet", domain: domain(context), range: range(context) });
    }
    case "Record":
      return compileRecord(expression.fields, environment);
    case "RecordSet": {
      const fields = getSortedFields(expression.fields);
      const names = fields.map((field) => field.name);
      const sets = fields.map((field) => getChildEvaluator(field.value));
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
      const evaluated = getChildEvaluator(expression.function);
      const evaluateFunction = (context: Context) =>
        expectFunction(evaluated(toKeepLazyContext(context)), expression);
      const args = expression.args.map(getChildEvaluator);
      const describeMissing = getMissingArgumentDescriber(environment.runtime.version);
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
      const record = getChildEvaluator(expression.record);
      const select = getFieldSelector(expression);
      return (context) => select(record(context));
    }
    case "Product": {
      const factors = expression.factors.map(getChildEvaluator);
      return (context) => ({
        kind: "ProductSet",
        factors: factors.map((factor) => factor(context)),
      });
    }
    case "BoxAction":
    case "AngleAction": {
      const action = getChildEvaluator(expression.action);
      const unchanged = compileUnchanged(getChildEvaluator(expression.subscript));
      const isBox = expression.kind === "BoxAction";
      const form = isBox ? "[A]_e" : "<A>_e";
      return (context) => {
        const value = action(context);
        if (typeof value !== "boolean") {
          throw new TlaEvaluationError(
            `Attempted to evaluate an expression of form ${form}, but A was not a boolean.\n${describeRange(expression)}`,
          );
        }
        return isBox ? value || unchanged(context) : value && !unchanged(context);
      };
    }
    case "Enabled": {
      const action = expression.expression;
      return (context) => isEnabled(action, context);
    }
    case "Label":
      return getChildEvaluator(expression.body);
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
        throw createTemporalFormulaError(TEMPORAL_FORMS[expression.kind], expression);
      };
  }
};
