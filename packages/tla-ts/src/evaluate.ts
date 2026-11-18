import {
  getChildren,
  getFunctionConstruction,
  getReferencedName,
  isLocallyResolved,
  isRecursiveConstruction,
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
import {
  isStackOverflow,
  TlaEvaluationError,
  TlaSetBoundError,
  TlaUnassignedError,
  formatRange,
} from "./errors";
import { EXIT_STATUS, setExitCode } from "./exit-codes";
import { generateEvaluator } from "./codegen";
import {
  chargeContexts,
  chargeFunctionConstruction,
  chargeSetOperation,
  costCoverage,
  countCoverage,
  createChargedEnumerator,
  createProductSetEnumerator,
  DO_NOT_RECORD,
  enterFrames,
  exitFrames,
  getCoverageFrames,
  getCoverageNode,
  getSubstitutionNode,
  runAtCoverageNode,
  runInCoverageFrames,
  tagSubset,
  type Coverage,
  type NextStateMode,
} from "./coverage";
import { MESSAGE_CODE } from "./tlc/messages";
import type { CheckerRuntime } from "./runtime";
import {
  isEvaluatedAtStartup,
  isExpressionImpure,
  isImpureDefinition,
  isNonconstant,
  isTlcEvalReached,
  type DefinitionFacts,
} from "./dependencies";
import {
  contextualApplications,
  frameSubstitutions,
  isSubstitutionDefinition,
  substitutedExpressions,
  substitutionFrames,
  type Substitution,
} from "./instances";
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
  isBeyondSetBound,
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
  type CostModel,
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
  isLevelConstant?: boolean;
  isActionLevel?: boolean;
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
  isStreamed: boolean;
  isRebuilt: boolean;
  isReleased?: boolean;
}

type Binding =
  | { kind: "Value"; value: Value; argument?: Expression; isSelf?: boolean }
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
  startupValues: (Value | undefined)[];
  tlcEvalValues: WeakMap<Expression, Value>;
  substitutedDefinitions: Set<Definition>;
  instanceParams: Set<OperatorParam>;
  evaluators: WeakMap<Expression, Evaluator>;
  entryEvaluators: WeakMap<Expression, Evaluator>;
  definitionEvaluators: WeakMap<Definition, Evaluator>;
  callStack?: CallStack;
  coverage?: Coverage;
}

export interface CallStack {
  expressions: Expression[];
  isFrozen: boolean;
  sources: WeakMap<ObjectValue, Expression>;
  values: WeakMap<Expression, Value>;
  failures: WeakMap<Error, Expression>;
  fingerprint?: FingerprintFailure;
}

export interface FingerprintFailure {
  sources: Expression[];
  reason: string;
}

const SOURCED_OPERATORS = new Set(["SUBSET", "UNION", "DOMAIN", "\\cup", "\\cap", "\\"]);

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

export const describeNode = (expression: Expression) =>
  expression.kind === "Number"
    ? (expression.text ?? String(expression.value))
    : describeRange(expression);

export const createConditionError = (expression: Expression, value: Value) =>
  new TlaEvaluationError(
    `A non-boolean expression (${getKindString(value)}) was used as the condition of an IF.\n${describeRange(expression)}`,
  );

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
    return applyFunction(
      value.kind === "LazyFunction" ? toFiniteFunction(value) : value,
      field,
      functionClass === "record" ? describeMissing : describeNotInDomain,
    );
  };
};

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
  (expression: Expression, subset: (left: Value, right: Value) => Value) =>
  (left: Value, right: Value) => {
    if (!isSetValue(left) || isOverriddenSet(left)) {
      throw new TlaEvaluationError(
        `Attempted to evaluate an expression of form S \\subseteq T, but S was not enumerable.\n${describeRange(expression)}`,
      );
    }
    return subset(left, right);
  };

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

const createUndefinedError = (name: string, expression: Expression) =>
  new TlaEvaluationError(
    `In evaluation, the identifier ${name} is either undefined or not an operator.\n${describeRange(expression)}`,
  );

export const createUnassignedError = (name: string, expression: Expression) =>
  new TlaUnassignedError(
    `In evaluation, the identifier ${name} is either undefined or not an operator.\n${describeRange(expression)}`,
    name,
  );

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

const bindSelf = (scope: Scope | undefined, name: string, value: Value): Scope => ({
  name,
  binding: { kind: "Value", value, isSelf: true },
  parent: scope,
});

export const bindPattern = (scope: Scope | undefined, pattern: BoundPattern, value: Value) => {
  if (pattern.kind === "Name") return bindValue(scope, pattern.name, value);
  const elements = getSequenceElements(value);
  if (!elements || elements.length !== pattern.names.length) {
    const range = pattern.ranges?.[0];
    throw new TlaEvaluationError(
      `Argument mismatch in operator application.${range ? formatRange(range) : ""}`,
    );
  }
  return pattern.names.reduce<Scope | undefined>(
    (current, name, index) => bindValue(current, name, elements[index]),
    scope,
  );
};

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

const checkEnumerable = (set: Value, expression: Expression, version: TlcVersion) => {
  if (!isSetValue(set) || isOverriddenSet(set)) {
    const text = formatValue(set);
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

export const getContextElements = (set: Value, expression: Expression, version: TlcVersion) => {
  if (version !== "1.7.4") return getEnumeratedElements(set, expression, version);
  checkEnumerable(set, expression, version);
  return getLazySubsets(set) ?? getStreamedElements(set);
};

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

export const mapBoundSets = <Result>(
  bounds: Bound[],
  map: (set: Expression, index: number) => Result,
) =>
  bounds.reduce<Result[]>((results, bound, index) => {
    results.push(
      index > 0 && bounds[index - 1].set === bound.set ? results[index - 1] : map(bound.set, index),
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

const forEachChargedBinding = (
  bounds: Bound[],
  context: Context,
  coverage: Coverage,
  visit: (scope: Scope | undefined) => boolean,
) => {
  const bounded = mapBoundSets(bounds, (set) => {
    const value = evaluate(set, context);
    return {
      value,
      elements: getQuantifierElements(value, set, context.environment.runtime.version),
    };
  });
  const sets = bounded.map((item) => item.elements);
  const charge = chargeContexts(
    coverage,
    bounded.map((item) => item.value),
    sets,
  );
  return forEachBoundElement(bounds, sets, context.scope, (scope) => {
    charge();
    return visit(scope);
  });
};

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
  compute: (argument: Value, self: LazyFunctionValue) => Value;
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

// FcnLambdaValue#takeExcept copies the function without its cost model.
const getUnrecordedApply = (functionValue: Value, coverage: Coverage) => {
  const lambda = getLazyFunction(functionValue);
  if (!lambda) return undefined;
  return (argument: Value) =>
    coverage.current === -1
      ? lambda.compute(argument, lambda.value)
      : runAtCoverageNode(coverage, DO_NOT_RECORD, () => lambda.compute(argument, lambda.value));
};

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
  if (elements === undefined) {
    throw new TlaEvaluationError(
      `Attempted to apply a function to an argument not in its domain.\n${describeRange(expression.function)}`,
    );
  }
  // Deviation from TLC: Tool#getFcnContext indexes past an argument tuple shorter than the bounds and ignores a longer one.
  const createListError = () =>
    new TlaEvaluationError(
      `In applying the function\n${prettyPrint(formatValue(value))},\nthe argument list is:\n${prettyPrint(formatValue(argument))}\nwhich does not match its formal parameter.\n`,
    );
  bounds.forEach((bound, index) => {
    if (index >= elements.length) throw createListError();
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
  if (elements.length > bounds.length) throw createListError();
  return bindArgument(bounds, lambda.scope, argument);
};

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
    body: describeNode(body),
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
  costModel: CostModel | undefined,
) => {
  const self: LazyFunctionValue = {
    kind: "LazyFunction",
    domain,
    source,
    boundTupleLengths,
    costModel,
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

// TLC keeps a $RecursiveFcnSpec's FcnLambdaValue lazy, so FcnLambdaValue#toFcnRcd charges its cost model when it fingerprints a state holding it.
const getRecursiveCostModel = (coverage: Coverage | undefined, node: number) =>
  coverage && node >= 0 ? { secondary: coverage.secondary, node } : undefined;

const createRecursiveFunction = (
  definition: FunctionDefinition,
  context: Context,
  domain: Value,
): RebindableLazyFunction => {
  const compute = (argument: Value, self: Value) =>
    evaluate(
      definition.body,
      withScope(
        context,
        bindArgument(definition.bounds, bindSelf(undefined, definition.name, self), argument),
      ),
    );
  const coverage = context.environment.coverage;
  const node = coverage && !context.environment.callStack ? coverage.current : -1;
  const frames = coverage && getCoverageFrames(coverage);
  const functionValue = createLazyFunction(
    domain,
    coverage
      ? (argument, self) =>
          coverage.current === node && !frames
            ? compute(argument, self)
            : runInCoverageFrames(coverage, node, frames, () => compute(argument, self))
      : compute,
    getLazyFunctionSource(
      getLazyFunctionTemplate(definition.bounds, definition.body),
      definition.bounds,
      domain,
    ),
    getBoundTupleLengths(definition.bounds),
    getRecursiveCostModel(coverage, node),
  );
  keepLambda({
    value: functionValue,
    bounds: definition.bounds,
    body: definition.body,
    scope: bindSelf(undefined, definition.name, functionValue),
    compute,
  });
  const rebindable: RebindableLazyFunction = Object.assign(functionValue, {
    rebind: (tracing: Environment) => {
      const rebound = createRecursiveFunction(
        definition,
        { ...context, environment: tracing },
        functionValue.domain,
      );
      rebound.enumerated = functionValue.enumerated;
      return rebound;
    },
  });
  return definition.bounds.length === 1 ? markLambdaFunction(rebindable) : rebindable;
};

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
    if (error instanceof TlaEvaluationError) return value;
    throw error;
  }
};

const compileDefinitionBody = (definition: Definition, environment: Environment): Evaluator => {
  if (definition.kind === "Operator" && definition.params.length > 0) {
    return () => {
      throw new TlaEvaluationError(
        `Operator ${definition.name} requires ${definition.params.length} arguments`,
      );
    };
  }
  if (definition.kind !== "Function") return getEntryEvaluator(definition.body, environment);
  const construction = getFunctionConstruction(definition);
  if (!definition.isSelfReferential) return getEntryEvaluator(construction, environment);
  const evaluator: Evaluator = (context) =>
    createRecursiveFunction(definition, context, getBoundsDomain(definition.bounds, context));
  const coverage = environment.coverage;
  return coverage ? countEvaluator(construction, evaluator, coverage) : evaluator;
};

const CALLER_SCOPE: Scope = {
  name: "",
  binding: { kind: "Value", value: false },
  parent: undefined,
};

const getDefinitionEvaluator = (definition: Definition, environment: Environment): Evaluator => {
  const compiled = environment.definitionEvaluators.get(definition);
  if (compiled) return compiled;
  const body = compileDefinitionBody(definition, environment);
  const definitionId = environment.facts.ids.get(definition);
  const startupValues = environment.startupValues;
  const isInCallerContext =
    definition.kind === "Operator" &&
    definition.params.length === 0 &&
    isTlcEvalReached(definition.body, environment);
  const evaluator: Evaluator = isInCallerContext
    ? (context) =>
        (definitionId === undefined ? undefined : startupValues[definitionId]) ??
        body(withScope(context, isTlcContextEmpty(context.scope) ? undefined : CALLER_SCOPE))
    : definitionId === undefined
      ? (context) => body(withScope(context, undefined))
      : (context) => startupValues[definitionId] ?? body(withScope(context, undefined));
  environment.definitionEvaluators.set(definition, evaluator);
  return evaluator;
};

export const getStartupValue = (definition: Definition, environment: Environment) => {
  const definitionId = environment.facts.ids.get(definition);
  return definitionId === undefined ? undefined : environment.startupValues[definitionId];
};

export const evaluateStartupDefinitions = (definitions: Definition[], environment: Environment) =>
  definitions.forEach((definition) => {
    if (definition.kind === "Operator" && definition.params.length > 0) return;
    const name = definition.name;
    if (environment.constants.has(name) || environment.substitutions.has(name)) return;
    if (!isEvaluatedAtStartup(definition, environment)) return;
    const definitionId = environment.facts.ids.get(definition);
    if (definitionId === undefined || environment.startupValues[definitionId] !== undefined) return;
    const context = { environment, scope: undefined, state: undefined, next: undefined };
    try {
      const value = environment.runtime.evaluateAtStartup(() =>
        toStartupValue(definition, compileDefinitionBody(definition, environment)(context)),
      );
      markNormalized(value);
      environment.startupValues[definitionId] = value;
    } catch (error) {
      // TLC swallows whatever the definition throws, a stack overflow included.
      if (!(error instanceof TlaEvaluationError) && !isStackOverflow(error)) throw error;
    }
  });

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
    isStateWithin(context.next, thunk.next) &&
    // TLC builds the function again at each reference, and outside KeepLazy evaluates each element.
    !(
      thunk.isRebuilt &&
      !context.isKeepLazy &&
      typeof cache === "object" &&
      cache.kind === "LazyFunction"
    );
  if (isCached) return cache;
  const coverage = context.environment.coverage;
  const node = coverage?.current === -1 ? undefined : coverage?.values.get(thunk);
  const value =
    coverage && node !== undefined
      ? runAtCoverageNode(coverage, node, () =>
          evaluate(thunk.expression, withScope(context, thunk.scope)),
        )
      : evaluate(thunk.expression, withScope(context, thunk.scope));
  if (!thunk.isStreamed || isSettledValue(value)) {
    thunk.cache = value;
    thunk.state = context.state;
    thunk.next = context.next;
  }
  if (
    thunk.cache !== undefined &&
    thunk.state === undefined &&
    thunk.next === undefined &&
    !thunk.isRebuilt
  ) {
    thunk.scope = undefined;
    thunk.isReleased = true;
  }
  return value;
};

export const getDefinitionClosure = (definition: Definition & { kind: "Operator" }): Closure => ({
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
      };

const isOperatorArgument = (expression: Expression, context: Context) => {
  if (expression.kind === "Lambda" || expression.kind === "OperatorReference") return true;
  if (expression.kind !== "Identifier") return false;
  const operator = resolveOperator(expression.name, context);
  return operator !== undefined && getArity(operator) > 0;
};

// Deviation from TLC: SymbolNodeValueLookupProvider#lookup takes an operator whose body is a literal for that literal, so a Java override rejects it as an argument.
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
  isRebuilt: false,
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
  const coverage = environment.coverage;
  if (coverage) {
    return (context) => {
      const thunk = createThunk(argument, context);
      if (coverage.current !== -1) coverage.values.set(thunk, coverage.current);
      return thunk;
    };
  }
  if (argument.kind === "Identifier" && !argument.resolution?.isSelf) {
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
  isFunctionRebuilt?: boolean;
}

const isRecursiveOperator = (definition: Definition) =>
  definition.kind === "Operator" && definition.isRecursive && definition.params.length > 0;

// TLC finds a RECURSIVE operator with parameters by its definition, not in its context, so every definition reaches it.
const chainRecursiveOperatorsFirst = (
  definitions: Definition[],
  nodes: Scope[],
  outer: Scope | undefined,
) => {
  let scope = outer;
  for (let index = 0; index < definitions.length; index++) {
    if (isRecursiveOperator(definitions[index])) {
      nodes[index].parent = scope;
      scope = nodes[index];
    }
  }
  for (let index = 0; index < definitions.length; index++) {
    if (!isRecursiveOperator(definitions[index])) {
      nodes[index].parent = scope;
      scope = nodes[index];
    }
  }
  return scope;
};

const NO_PARAMS: OperatorParam[] = [];

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
  let scope = context.scope;
  let hasRecursive = false;
  for (let index = 0; index < nodes.length; index++) {
    nodes[index].parent = scope;
    scope = nodes[index];
    hasRecursive ||= definitions[index].isRecursive;
  }
  if (hasRecursive) scope = chainRecursiveOperatorsFirst(definitions, nodes, context.scope);
  let isRecursiveValueAtOrAfter = false;
  for (let index = definitions.length - 1; index >= 0; index--) {
    const definition = definitions[index];
    isRecursiveValueAtOrAfter ||=
      definition.isRecursive && definition.kind === "Operator" && definition.params.length === 0;
    // TLC's LET evaluates an operator without parameters in the context before it, which TLCEval#tlcEval tells from an empty one.
    const ownScope =
      definition.kind === "Operator" && definition.params.length === 0 && !isRecursiveValueAtOrAfter
        ? nodes[index].parent
        : scope;
    const isReevaluated =
      (definition.kind === "Operator" && definition.params.length > 0) ||
      reevaluated?.impure.has(definition);
    const body =
      definition.kind === "Function" ? getFunctionConstruction(definition) : definition.body;
    nodes[index].binding = isReevaluated
      ? {
          kind: "Operator",
          operator: {
            kind: "Closure",
            name: definition.name,
            params: definition.kind === "Operator" ? definition.params : NO_PARAMS,
            body,
            scope: ownScope,
          },
        }
      : {
          kind: "Thunk",
          expression: body,
          scope: ownScope,
          state: context.state,
          next: context.next,
          cache: undefined,
          isStreamed:
            definition.kind === "Operator" && (reevaluated?.streamed.has(definition) ?? false),
          isRebuilt:
            (definition.kind === "Operator" || !definition.isSelfReferential) &&
            reevaluated?.isFunctionRebuilt === true,
        };
  }
  const coverage = context.environment.coverage;
  if (coverage && coverage.current !== -1) {
    nodes.forEach((node) => {
      if (node.binding.kind === "Thunk") coverage.values.set(node.binding, coverage.current);
    });
  }
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
  const builtin = context.environment.builtins.get(
    context.environment.substitutions.get(name) ?? name,
  );
  if (builtin?.arity === 0) return builtin.evaluate([], context);
  throw createUndefinedError(name, expression);
};

export const getReevaluatedDefinitions = (
  definitions: Definition[],
  environment: Environment,
): ReevaluatedDefinitions => ({
  impure: new Set(
    definitions.filter(
      // TLC evaluates a LET definition at each reference; caching a pure one shows only in coverage.
      (definition) =>
        environment.coverage !== undefined ||
        isImpureDefinition(definition, environment, "varying"),
    ),
  ),
  streamed: new Set(
    definitions.filter((definition) => isImpureDefinition(definition, environment, "streamed")),
  ),
  isFunctionRebuilt: true,
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

export const toNextContext = (context: Context): Context => ({
  environment: context.environment,
  scope: context.scope,
  state: context.next,
  next: undefined,
  isKeepLazy: context.isKeepLazy,
});

const evaluateWithNextState = (
  coverage: Coverage,
  nextState: NextStateMode,
  evaluator: Evaluator,
  context: Context,
) => {
  const outer = coverage.nextState;
  coverage.nextState = nextState;
  try {
    return evaluator(context);
  } finally {
    coverage.nextState = outer;
  }
};

const compileUnchanged = (evaluator: Evaluator, coverage: Coverage | undefined): Evaluator =>
  coverage
    ? (context) =>
        valuesEqual(
          evaluateWithNextState(coverage, "empty", evaluator, context),
          evaluateWithNextState(coverage, "primed", evaluator, toNextContext(context)),
        )
    : (context) => valuesEqual(evaluator(context), evaluator(toNextContext(context)));

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

export const freezeCallStack = (
  callStack: CallStack,
  values: (Value | undefined)[],
  error: unknown,
) => {
  const sources = [...new Set(values)].flatMap((item) => {
    const source = typeof item === "object" ? callStack.sources.get(item) : undefined;
    return source ? [source] : [];
  });
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

// TLC evaluates `a /\ b /\ c` as `(a /\ b) /\ c`, so its call stack holds each prefix.
const compileTracedJunction = (
  expression: Expression & { kind: "And" | "Or" },
  operands: Evaluator[],
  callStack: CallStack | undefined,
): Evaluator | undefined => {
  const range = expression.location.range;
  const prefixEnds = expression.prefixEnds;
  if (!callStack || expression.isBulleted || !range || !prefixEnds || operands.length < 3) {
    return undefined;
  }
  const prefixes = prefixEnds
    .slice(0, operands.length - 2)
    .map((end) => ({
      ...expression,
      location: { ...expression.location, range: { ...range, end } },
    }))
    .reverse();
  const isAnd = expression.kind === "And";
  return (context) => {
    callStack.expressions.push(...prefixes);
    for (let index = 0; index < operands.length; index++) {
      if (index >= 2 && !callStack.isFrozen) callStack.expressions.pop();
      const value = operands[index](context);
      if (typeof value !== "boolean") throw createJunctionError(expression, index, value);
      if (value !== isAnd) {
        if (!callStack.isFrozen)
          callStack.expressions.length -= prefixes.length - Math.max(index - 1, 0);
        return value;
      }
    }
    return isAnd;
  };
};

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

const countEvaluator =
  (expression: Expression, evaluator: Evaluator, coverage: Coverage): Evaluator =>
  (context) => {
    const outer = coverage.current;
    if (outer < 0 || !coverage.covered.has(expression)) return evaluator(context);
    const node = getCoverageNode(coverage, outer, expression);
    countCoverage(coverage, node);
    coverage.current = node;
    try {
      const value = evaluator(context);
      const isTagged =
        expression.kind === "SetEnumeration" ||
        ((expression.kind === "SetFilter" || expression.kind === "SetMap") &&
          isReducibleSet(value)) ||
        (expression.kind === "SetFilter" &&
          typeof value === "object" &&
          value.kind === "FilteredSet") ||
        ((expression.kind === "FunctionSet" || expression.kind === "RecordSet") &&
          typeof value === "object" &&
          value.kind === expression.kind) ||
        (expression.kind === "Apply" &&
          expression.operator === "SUBSET" &&
          typeof value === "object" &&
          value.kind === "Subset");
      if (typeof value === "object" && isTagged) coverage.values.set(value, node);
      return value;
    } finally {
      coverage.current = outer;
    }
  };

const countSubstitution =
  (substitution: Substitution, evaluator: Evaluator, coverage: Coverage): Evaluator =>
  (context) => {
    const outer = coverage.current;
    const node = getSubstitutionNode(coverage, substitution);
    coverage.current = node === -1 && outer < 0 ? outer : node;
    try {
      return evaluator(context);
    } finally {
      coverage.current = outer;
    }
  };

const enterEvaluator =
  (frames: Expression[], evaluator: Evaluator, coverage: Coverage): Evaluator =>
  (context) => {
    const entered = enterFrames(coverage, frames, coverage.current, true);
    if (entered === 0) return evaluator(context);
    try {
      return evaluator(context);
    } finally {
      exitFrames(coverage, entered);
    }
  };

const getCoverageEvaluator = (expression: Expression, evaluator: Evaluator, coverage: Coverage) => {
  const frames = substitutionFrames.get(expression);
  if (frames?.some((frame) => frameSubstitutions.has(frame))) {
    return enterEvaluator(frames, countEvaluator(expression, evaluator, coverage), coverage);
  }
  const substitution = substitutedExpressions.get(expression);
  if (!substitution) return countEvaluator(expression, evaluator, coverage);
  if (substitution.replacement === expression) {
    return countSubstitution(
      substitution,
      countEvaluator(expression, evaluator, coverage),
      coverage,
    );
  }
  return countEvaluator(
    expression,
    countSubstitution(
      substitution,
      countEvaluator(substitution.replacement, evaluator, coverage),
      coverage,
    ),
    coverage,
  );
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
  const framed = callStack && frames ? traceFrames(expression, frames, traced, callStack) : traced;
  const coverage = environment.coverage;
  const evaluator = coverage ? getCoverageEvaluator(expression, framed, coverage) : framed;
  environment.evaluators.set(expression, evaluator);
  return evaluator;
};

export const getEntryEvaluator = (expression: Expression, environment: Environment) => {
  if (environment.callStack || environment.coverage) return getEvaluator(expression, environment);
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
    const definition = global.definition;
    let compiled: Evaluator | undefined;
    return (context) => (compiled ??= getDefinitionEvaluator(definition, environment))(context);
  }
  if (expression.resolution?.isSelf) {
    return (context) => {
      const binding = lookupScope(context.scope, name);
      if (binding?.kind === "Value" && binding.isSelf) return binding.value;
      throw createUndefinedError(name, expression);
    };
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
  let body: Evaluator | undefined;
  return (context) => {
    body ??= getEntryEvaluator(closure.body, environment);
    return body({
      environment,
      scope: bindArguments(context),
      state: context.state,
      next: context.next,
      isKeepLazy: context.isKeepLazy,
    });
  };
};

// TLC's LET conses only its arity-0 definitions onto the context that TLCEval#tlcEval caches under when it is empty.
const isTlcContextEmpty = (scope: Scope | undefined) => {
  for (let node = scope; node !== undefined; node = node.parent) {
    const binding = node.binding;
    if (
      binding.kind !== "Operator" ||
      binding.operator.kind !== "Closure" ||
      binding.operator.params.length === 0
    ) {
      return false;
    }
    let letScope = binding.operator.scope;
    while (letScope !== undefined && letScope !== node) letScope = letScope.parent;
    if (letScope !== node) return false;
  }
  return true;
};

const SET_OPERATORS = new Set(["\\cup", "\\cap", "\\"]);

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
  if (global?.kind === "Builtin" && global.name === "TLCEval" && args.length === 1) {
    // Deviation from TLC: TLCEval#tlcEval evaluates an argument SANY takes for constant, such as Print(v, TRUE), in an empty state.
    const isCached =
      !contextualApplications.has(expression) && !isNonconstant(args[0], environment);
    const tlcEvalValues = environment.tlcEvalValues;
    return (context) => {
      if (!isCached || !isTlcContextEmpty(context.scope)) {
        return global.evaluate(getLazyArguments(args, context), context);
      }
      const cached = tlcEvalValues.get(expression);
      if (cached !== undefined) return cached;
      const value = global.evaluate(getLazyArguments(args, context), undefined);
      tlcEvalValues.set(expression, value);
      return value;
    };
  }
  if (
    global?.kind === "Builtin" &&
    global.name === "\\subseteq" &&
    global.evaluateBinary &&
    args.length === 2
  ) {
    const left = getEvaluator(args[0], environment);
    const right = getEvaluator(args[1], environment);
    const subset = getSubsetOperator(expression, global.evaluateBinary);
    const coverage = environment.coverage;
    if (!coverage) return (context) => subset(left(context), right(context));
    return (context) => {
      const leftValue = left(context);
      const rightValue = right(context);
      if (
        typeof leftValue !== "object" ||
        leftValue.kind !== "Set" ||
        !coverage.values.has(leftValue)
      ) {
        return subset(leftValue, rightValue);
      }
      const missing = leftValue.elements.findIndex((element) => !isElementOf(element, rightValue));
      costCoverage(coverage, leftValue, (missing === -1 ? leftValue.elements.length : missing) + 1);
      return missing === -1;
    };
  }
  const coverage = environment.coverage;
  const combine = global?.kind === "Builtin" ? global.evaluateBinary : undefined;
  if (coverage && combine && SET_OPERATORS.has(expression.operator) && args.length === 2) {
    const left = getEvaluator(args[0], environment);
    const right = getEvaluator(args[1], environment);
    return (context) => {
      const leftValue = left(context);
      const rightValue = right(context);
      return chargeSetOperation(
        coverage,
        expression.operator,
        leftValue,
        rightValue,
        combine(leftValue, rightValue),
      );
    };
  }
  if (global?.kind === "Builtin") return compileBuiltinCall(global, args, environment);
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
  const coverage = environment.coverage;
  if (coverage) {
    return (context) => {
      const isFound = forEachChargedBinding(
        expression.bounds,
        context,
        coverage,
        (scope) => expectBooleanBody(body(withScope(context, scope)), expression) !== isForall,
      );
      return isFound ? !isForall : isForall;
    };
  }
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

const keptLazyExpressions = new WeakSet<Expression>();

export const keepLazy = (expression: Expression) => {
  if (expression.kind === "FunctionConstruction" || expression.kind === "Except") {
    keptLazyExpressions.add(expression);
  }
};

const scopeNames = new WeakMap<Expression, string[] | undefined>();

const getScopeNames = (expression: Expression) => {
  if (scopeNames.has(expression)) return scopeNames.get(expression);
  const names = new Set<string>();
  const visit = (node: Expression): boolean => {
    if (node.kind === "Subexpression") return false;
    const name = getReferencedName(node);
    if (name !== undefined) names.add(name);
    if (node.kind === "ExceptAt") names.add(EXCEPT_AT);
    return getChildren(node).every(visit);
  };
  const result = visit(expression) ? [...names] : undefined;
  scopeNames.set(expression, result);
  return result;
};

const trimScope = (scope: Scope | undefined, names: string[] | undefined) =>
  names === undefined || scope === undefined
    ? scope
    : names.reduce<Scope>(
        (trimmed, name) => {
          const binding = lookupScope(scope, name);
          return binding ? { name, binding, parent: trimmed } : trimmed;
        },
        { name: "", binding: { kind: "Value", value: false }, parent: undefined },
      );

export const isKeptLazy = (expression: Expression) => keptLazyExpressions.has(expression);

export const getFunctionBuilder = (
  expression: Expression & { kind: "FunctionConstruction" },
  environment: Environment,
) => {
  const isLazy = isKeptLazy(expression) || isRecursiveConstruction(expression);
  const body = getEvaluator(expression.body, environment);
  const bounds = expression.bounds;
  const bound = bounds[0];
  const isSingleName = bounds.length === 1 && bound.pattern.kind === "Name";
  const construct = (domain: Value, context: Context) => {
    if (isSingleName && bound.pattern.kind === "Name") {
      const name = bound.pattern.name;
      const evaluateAt = (key: Value) =>
        body(withScope(context, bindValue(context.scope, name, key)));
      // TLC sizes the domain and evaluates the body at each element of a domain too large to hold.
      if (isBeyondSetBound(domain)) {
        getCardinality(domain);
        forEachElement(domain, evaluateAt);
        return createLazy(domain, context);
      }
      const keys = getFunctionDomain(domain);
      const functionValue = createSortedFunction(keys, keys.map(evaluateAt));
      if (isReducibleSet(domain)) return functionValue;
      functionValue.lambdaDomain = domain;
      return markLambdaFunction(functionValue);
    }
    const pairs: [Value, Value][] = [];
    const sets = mapBoundSets(bounds, (set, index) =>
      getNormalizedElements(
        bounds.length > 1 && typeof domain === "object" && domain.kind === "ProductSet"
          ? domain.factors[index]
          : domain,
        set,
        context.environment.runtime.version,
      ),
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
  const bodyNames = getScopeNames(expression.body);
  const coverage = environment.coverage;
  const name = expression.definition?.isSelfReferential ? expression.definition.name : undefined;
  const createLazy = (domain: Value, context: Context) => {
    const outer = trimScope(context.scope, bodyNames);
    const lambdaContext = withScope(context, outer);
    let scope = outer;
    const compute = (argument: Value) =>
      body(withScope(lambdaContext, bindArgument(bounds, scope, argument)));
    const node = coverage && !environment.callStack ? coverage.current : -1;
    const frames = coverage && getCoverageFrames(coverage);
    const value = createLazyFunction(
      domain,
      coverage
        ? (argument) => {
            const at = coverage.current === -1 && name === undefined ? -1 : node;
            return at === coverage.current && !frames
              ? compute(argument)
              : runInCoverageFrames(coverage, at, frames, () => compute(argument));
          }
        : compute,
      getLazyFunctionSource(template, bounds, domain),
      boundTupleLengths,
      name === undefined ? undefined : getRecursiveCostModel(coverage, node),
    );
    if (name !== undefined) scope = bindSelf(outer, name, value);
    const functionValue = keepLambda({ value, bounds, body: expression.body, scope, compute });
    return bounds.length === 1 ? markLambdaFunction(functionValue) : functionValue;
  };
  const callStack = environment.callStack;
  const build = (domain: Value, context: Context) => {
    if (isLazy || context.isKeepLazy || !isEnumerable(domain)) {
      return createLazy(domain, context);
    }
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
    try {
      return construct(domain, context);
    } catch (error) {
      headFingerprint(callStack, expression, error);
      throw error;
    }
  };
  return { build, createLazy };
};

const compileFunctionConstruction = (
  expression: Expression & { kind: "FunctionConstruction" },
  environment: Environment,
): Evaluator => {
  const build = getFunctionBuilder(expression, environment).build;
  const bounds = expression.bounds;
  const coverage = environment.coverage;
  if (coverage) {
    return (context) => {
      const domain = getBoundsDomain(bounds, context);
      const value = build(domain, context);
      const sets =
        bounds.length === 1 || typeof domain !== "object" || domain.kind !== "ProductSet"
          ? [domain]
          : domain.factors;
      const isConverted =
        (typeof value !== "object" || value.kind !== "LazyFunction") && sets.every(isReducibleSet);
      if (isConverted && coverage.current >= 0 && coverage.covered.has(expression)) {
        chargeFunctionConstruction(coverage, coverage.current, sets);
      }
      return value;
    };
  }
  if (bounds.length === 1 && bounds[0].pattern.kind === "Name") {
    const set = getEvaluator(bounds[0].set, environment);
    return (context) => build(set(context), context);
  }
  return (context) => build(getBoundsDomain(bounds, context), context);
};

const compileExcept = (
  expression: Expression & { kind: "Except" },
  environment: Environment,
): Evaluator => {
  const isKeptLazyExpression = keptLazyExpressions.has(expression);
  if (isKeptLazyExpression) keepLazy(expression.function);
  const evaluateFunction = getEvaluator(expression.function, environment);
  const coverage = environment.coverage;
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
      isKeptLazyExpression && depth === 0,
      coverage && getUnrecordedApply(current, coverage),
    );
  };
  return (context) => {
    let current = evaluateFunction(context);
    for (const item of updates) {
      let isFound = false;
      current = update(current, item.path, 0, context, (inner) => {
        isFound = true;
        return item.value(inner);
      });
      if (!isFound) {
        context.environment.runtime.warn(
          MESSAGE_CODE.exceptAppliedToUnknownField,
          `The EXCEPT was applied to non-existing fields of the value at\n${describeRange(expression.function)}`,
        );
      }
    }
    return current;
  };
};

export const getLazyFilter = (
  expression: Expression & { kind: "SetFilter" },
  environment: Environment,
) => {
  const predicate = getEvaluator(expression.predicate, environment);
  const pattern = expression.bound.pattern;
  const predicateNode = describeNode(expression.predicate);
  const source = expression.predicate.location.range && {
    names: pattern.kind === "Name" ? pattern.name : pattern.names.join(", "),
    predicate: predicateNode,
  };
  const coverage = environment.coverage;
  const createFiltered = (
    base: Value,
    context: Context,
    evaluator: Evaluator,
    node: number,
  ): RebindableFilteredSet => {
    const test = (element: Value, isMember: boolean) => {
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
    };
    const rebind = (tracing: Environment) =>
      createFiltered(
        base,
        { ...context, environment: tracing },
        getEvaluator(expression.predicate, tracing),
        -1,
      );
    if (!coverage || node < 0) return { kind: "FilteredSet", base, test, source, rebind };
    return {
      kind: "FilteredSet",
      base,
      test: (element, isMember) =>
        runAtCoverageNode(coverage, isMember ? -1 : node, () => test(element, isMember)),
      startPass: (isMaterialized) => {
        const draws = createProductSetEnumerator(coverage, base);
        return (element) => {
          draws?.next();
          tagSubset(coverage, base, element);
          coverage.secondary[node]++;
          const value = runAtCoverageNode(coverage, node, () => test(element, false));
          if (isMaterialized && value) coverage.secondary[node]++;
          return value;
        };
      },
      source,
      rebind,
    };
  };
  return (base: Value, context: Context, node = -1) =>
    createFiltered(base, context, predicate, node);
};

const hasLocalName = (expression: Expression): boolean =>
  isLocallyResolved(expression) ||
  expression.kind === "OperatorReference" ||
  getChildren(expression).some(hasLocalName);

export const isUniformPredicate = (
  expression: Expression & { kind: "SetFilter" },
  environment: Environment,
) =>
  expression.bound.pattern.kind === "Name" &&
  !environment.coverage &&
  !hasLocalName(expression.predicate) &&
  !isExpressionImpure([expression.predicate], environment, "varying");

export const expectFilterPredicate = (
  value: Value,
  expression: Expression & { kind: "SetFilter" },
) => {
  if (typeof value !== "boolean") {
    throw new TlaEvaluationError(
      `Attempted to evaluate an expression of form {x \\in S : P(x)} when P was ${getKindString(value)}.\n${describeNode(expression.predicate)}`,
    );
  }
  return value;
};

export const getChoiceElements = (
  base: Value,
  expression: Expression & { kind: "Choose" },
  set: Expression,
  version: TlcVersion,
) => {
  if (!isSetValue(base) || isOverriddenSet(base)) {
    throw new TlaEvaluationError(
      `Attempted to compute the value of an expression of\nform CHOOSE x \\in S: P, but S was not enumerable.\n${describeRange(expression)}`,
    );
  }
  normalizeShallowly(base);
  return getNormalizedElements(base, set, version);
};

export const createNoChoiceError = (expression: Expression & { kind: "Choose" }) =>
  new TlaEvaluationError(
    `Attempted to compute the value of an expression of form\nCHOOSE x \\in S: P, but no element of S satisfied P.\n${describeRange(expression)}`,
  );

const compileSetComprehension = (
  expression: Expression & { kind: "SetFilter" | "SetMap" | "Choose" },
  environment: Environment,
): Evaluator => {
  if (expression.kind === "SetFilter") {
    const predicate = getEvaluator(expression.predicate, environment);
    const set = getEvaluator(expression.bound.set, environment);
    const filterLazily = getLazyFilter(expression, environment);
    const pattern = expression.bound.pattern;
    const coverage = environment.coverage;
    const isUniform = isUniformPredicate(expression, environment);
    return (context) => {
      const base = set(context);
      if (!isReducibleSet(base)) return filterLazily(base, context, coverage?.current);
      const kept: Value[] = [];
      const elements = base.kind === "Interval" ? base : toFiniteSet(base).elements;
      const size = Array.isArray(elements) ? elements.length : elements.high - elements.low + 1;
      for (let position = 0; position < size; position++) {
        const element = Array.isArray(elements) ? elements[position] : elements.low + position;
        const value = predicate(withScope(context, bindPattern(context.scope, pattern, element)));
        if (expectFilterPredicate(value, expression)) addBoundedElement(kept, element);
        else if (isUniform) break;
      }
      if (coverage) costCoverage(coverage, base, size + 1);
      return createNormalizedSet(kept);
    };
  }
  if (expression.kind === "SetMap") {
    const mapped = getEvaluator(expression.expression, environment);
    const coverage = environment.coverage;
    return (context) => {
      const elements: Value[] = [];
      const add = (scope: Scope | undefined) => {
        addBoundedElement(elements, mapped(withScope(context, scope)));
        return false;
      };
      if (coverage) forEachChargedBinding(expression.bounds, context, coverage, add);
      else forEachBinding(expression.bounds, context, add);
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
  const coverage = environment.coverage;
  return (context) => {
    const base = evaluateSet(context);
    const elements = getChoiceElements(base, expression, set, context.environment.runtime.version);
    const enumerator = coverage && createChargedEnumerator(coverage, base, elements, true);
    let chosen: Value | undefined;
    const pattern = expression.pattern;
    someElement(elements, (element) => {
      enumerator?.next();
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
      chosen = getBoundValue(pattern, scope);
      return true;
    });
    if (chosen !== undefined) return chosen;
    enumerator?.next();
    throw createNoChoiceError(expression);
  };
};

export const getSortedFields = (fields: RecordField[]) =>
  [...fields].sort((left, right) => compareValues(left.name, right.name));

export const hasDuplicateFields = (sortedFields: RecordField[]) =>
  sortedFields.some((field, index) => index > 0 && sortedFields[index - 1].name === field.name);

const compileRecord = (recordFields: RecordField[], environment: Environment): Evaluator => {
  const fields = getSortedFields(recordFields);
  const values = recordFields.map((field) => getEvaluator(field.value, environment));
  if (hasDuplicateFields(fields)) {
    return (context) =>
      createRecord(
        recordFields.map((field, index): [string, Value] => [field.name, values[index](context)]),
      );
  }
  const names = fields.map((field) => field.name);
  const writtenNames = recordFields.map((field) => field.name);
  if (writtenNames.some((name, index) => name !== names[index])) {
    const writtenIndexes = fields.map((field) => recordFields.indexOf(field));
    return (context) =>
      createWrittenRecord(
        names,
        writtenIndexes,
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
      return (
        compileTracedJunction(expression, operands, environment.callStack) ??
        ((context) => {
          for (let index = 0; index < operands.length; index++) {
            const value = operands[index](context);
            if (typeof value !== "boolean") throw createJunctionError(expression, index, value);
            if (!value) return false;
          }
          return true;
        })
      );
    }
    case "Or": {
      const operands = expression.operands.map(getChildEvaluator);
      return (
        compileTracedJunction(expression, operands, environment.callStack) ??
        ((context) => {
          for (let index = 0; index < operands.length; index++) {
            const value = operands[index](context);
            if (typeof value !== "boolean") throw createJunctionError(expression, index, value);
            if (value) return true;
          }
          return false;
        })
      );
    }
    case "Prime": {
      const inner = getChildEvaluator(expression.expression);
      const coverage = environment.coverage;
      return coverage
        ? (context) => evaluateWithNextState(coverage, "primed", inner, toNextContext(context))
        : (context) => inner(toNextContext(context));
    }
    case "Unchanged":
      return compileUnchanged(getChildEvaluator(expression.expression), environment.coverage);
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
      const substituted = environment.coverage
        ? expression.definitions.filter(isSubstitutionDefinition)
        : [];
      const reevaluated =
        substituted.length > 0
          ? { impure: new Set(substituted), streamed: new Set<Definition>() }
          : undefined;
      return (context) =>
        body(withScope(context, bindDefinitions(expression.definitions, context, reevaluated)));
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
      const writtenIndexes = fields.map((field) => expression.fields.indexOf(field));
      const sets = expression.fields.map((field) => getChildEvaluator(field.value));
      if (writtenIndexes.every((writtenIndex, index) => writtenIndex === index)) {
        return (context) => ({ kind: "RecordSet", names, sets: sets.map((set) => set(context)) });
      }
      return (context) => {
        const writtenSets = sets.map((set) => set(context));
        return {
          kind: "RecordSet",
          names,
          sets: writtenIndexes.map((index) => writtenSets[index]),
        };
      };
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
      const unchanged = compileUnchanged(
        getChildEvaluator(expression.subscript),
        environment.coverage,
      );
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
    case "Selection":
      return getChildEvaluator(expression.expression);
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
