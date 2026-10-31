import { TlaEvaluationError, TlaModuleError } from "./errors";
import { prettyPrint } from "./pretty-print";
import type { TlcVersion } from "./tlc-version";

export interface ModelValue {
  kind: "ModelValue";
  name: string;
  type: string | undefined;
  rank: number;
}

export interface SetValue {
  kind: "Set";
  elements: Value[];
  hash: number;
  fingerprint: number;
}

// A set enumeration whose elements TLC can't sort, such as {1, "a"}. TLC sorts a set enumeration
// only when it has to, so it still checks membership in one element by element.
export interface MixedSetValue {
  kind: "MixedSet";
  elements: Value[];
}

export interface FunctionValue {
  kind: "Function";
  domain: Value[];
  range: Value[];
  hash: number;
  fingerprint: number;
  writtenKeys: Value[] | undefined;
  functionClass: FunctionClass | undefined;
}

export interface IntervalValue {
  kind: "Interval";
  low: number;
  high: number;
}

export interface InfiniteSetValue {
  kind: "InfiniteSet";
  name: "Nat" | "Int" | "STRING" | "Any";
}

export interface SubsetValue {
  kind: "Subset";
  base: Value;
}

export interface FunctionSetValue {
  kind: "FunctionSet";
  domain: Value;
  range: Value;
}

export interface RecordSetValue {
  kind: "RecordSet";
  names: string[];
  sets: Value[];
}

export interface ProductSetValue {
  kind: "ProductSet";
  factors: Value[];
}

export interface SequenceSetValue {
  kind: "SequenceSet";
  base: Value;
}

export interface SetOperationValue {
  kind: "SetOperation";
  operator: "\\cup" | "\\cap" | "\\";
  left: Value;
  right: Value;
}

// TLC prints a set filter as its bound names and the location of its predicate.
interface FilteredSetSource {
  names: string;
  predicate: string;
}

export interface FilteredSetValue {
  kind: "FilteredSet";
  base: Value;
  test: (element: Value) => boolean;
  source?: FilteredSetSource;
}

// UNION S when some element of S isn't a set enumeration. TLC enumerates it only when it has to.
export interface UnionValue {
  kind: "Union";
  base: Value;
}

interface LazyFunctionParameter {
  name: string;
  domain: Value;
}

export interface LazyFunctionSource {
  parameters: LazyFunctionParameter[];
  body: string;
}

export interface LazyFunctionValue {
  kind: "LazyFunction";
  domain: Value;
  apply: (argument: Value) => Value;
  source?: LazyFunctionSource;
  functionClass?: FunctionClass;
}

export type Value =
  | boolean
  | number
  | string
  | ModelValue
  | SetValue
  | MixedSetValue
  | FunctionValue
  | IntervalValue
  | InfiniteSetValue
  | SubsetValue
  | FunctionSetValue
  | RecordSetValue
  | ProductSetValue
  | SequenceSetValue
  | SetOperationValue
  | FilteredSetValue
  | UnionValue
  | LazyFunctionValue;

export type ObjectValue = Exclude<Value, boolean | number | string>;

export const MAXIMUM_INTEGER = 2147483647;
export const MINIMUM_INTEGER = -2147483648;
const MAXIMUM_ENUMERATED_SUBSET_BASE = 30;

export const isSetValue = (value: Value) =>
  typeof value === "object" &&
  value.kind !== "ModelValue" &&
  value.kind !== "Function" &&
  value.kind !== "LazyFunction";

// TLC's Reducible values, SetEnumValue and IntervalValue, which combine with another set element by
// element.
export const isReducibleSet = (value: Value): value is SetValue | MixedSetValue | IntervalValue =>
  typeof value === "object" &&
  (value.kind === "Set" || value.kind === "MixedSet" || value.kind === "Interval");

export const isFunctionValue = (value: Value): value is FunctionValue | LazyFunctionValue =>
  typeof value === "object" && (value.kind === "Function" || value.kind === "LazyFunction");

export const isModelValue = (value: Value): value is ModelValue =>
  typeof value === "object" && value.kind === "ModelValue";

export const describeKind = (value: Value) => {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "integer";
  if (typeof value === "string") return "string";
  if (value.kind === "ModelValue") return "model value";
  return isSetValue(value) ? "set" : "function";
};

export const checkInteger = (value: number) => {
  if (!Number.isInteger(value) || value > MAXIMUM_INTEGER || value < MINIMUM_INTEGER) {
    throw new TlaModuleError(`Integer overflow: ${value} is outside TLC's 32-bit range`);
  }
  return value;
};

// TLC keeps a record, or a function with string keys that @@ builds, in the order the spec writes
// it until it sorts the value to compare or fingerprint it. ToString, Assert, and error messages
// show that order.
const writtenOrderUse = { isUsed: false };

const setWrittenOrder = (functionValue: FunctionValue, keys: Value[]) => {
  writtenOrderUse.isUsed = true;
  functionValue.writtenKeys = keys;
  return functionValue;
};

export const getWrittenPairs = (functionValue: FunctionValue): [Value, Value][] => {
  const keys = functionValue.writtenKeys ?? functionValue.domain;
  return keys.map((key) => [key, functionValue.range[findIndex(functionValue.domain, key)]]);
};

export const createWrittenRecord = (names: Value[], range: Value[], writtenNames: Value[]) =>
  setWrittenOrder(createSortedRecord(names, range), writtenNames);

// TLC sorts a value it compares even with itself, and every value inside it, so a value it has
// hashed or fingerprinted is already sorted.
const forgetWrittenOrder = (value: Value): void => {
  if (typeof value !== "object" || (value.kind !== "Function" && value.kind !== "Set")) return;
  if (value.hash !== 0 || value.fingerprint !== 0) return;
  if (value.kind === "Set") return value.elements.forEach(forgetWrittenOrder);
  value.writtenKeys = undefined;
  value.range.forEach(forgetWrittenOrder);
};

const isRecordDomain = (domain: Value[]) => domain.every((key) => typeof key === "string");

// TLC compares a record only with another record, so comparing one with a function of another size
// can fail before the sizes decide.
const isRecordMismatch = (left: Value[], right: Value[]) =>
  left.length > 0 && right.length > 0 && isRecordDomain(left) !== isRecordDomain(right);

const compareFunctions = (left: FunctionValue, right: FunctionValue) => {
  if (writtenOrderUse.isUsed) {
    left.writtenKeys = undefined;
    right.writtenKeys = undefined;
  }
  const leftDomain = left.domain;
  const rightDomain = right.domain;
  if (leftDomain.length !== rightDomain.length) {
    return isRecordMismatch(leftDomain, rightDomain)
      ? compareLikeTlc(left, right)
      : leftDomain.length - rightDomain.length;
  }
  if (leftDomain !== rightDomain) {
    for (let index = 0; index < leftDomain.length; index++) {
      const keyComparison = compareValues(leftDomain[index], rightDomain[index]);
      if (keyComparison !== 0) return keyComparison;
    }
  }
  const leftRange = left.range;
  const rightRange = right.range;
  if (leftRange === rightRange) return 0;
  for (let index = 0; index < leftRange.length; index++) {
    const valueComparison = compareValues(leftRange[index], rightRange[index]);
    if (valueComparison !== 0) return valueComparison;
  }
  return 0;
};

const compareSets = (left: SetValue, right: SetValue) => {
  const leftElements = left.elements;
  const rightElements = right.elements;
  if (leftElements.length !== rightElements.length)
    return leftElements.length - rightElements.length;
  if (leftElements === rightElements) return 0;
  for (let index = 0; index < leftElements.length; index++) {
    const comparison = compareValues(leftElements[index], rightElements[index]);
    if (comparison !== 0) return comparison;
  }
  return 0;
};

const getModelValueType = (value: Value) => (isModelValue(value) ? value.type : undefined);

const checkModelValueTypes = (left: Value, right: Value, isEquality: boolean) => {
  const leftType = getModelValueType(left);
  const rightType = getModelValueType(right);
  if (leftType === undefined && rightType === undefined) return;
  const action = isEquality ? "check equality of" : "compare";
  if (isModelValue(left) && isModelValue(right)) {
    if (leftType === undefined || rightType === undefined || leftType === rightType) return;
    throw new TlaEvaluationError(
      `Attempted to ${action} the differently-typed model values ${formatValue(left)} and ${formatValue(right)}`,
    );
  }
  if (leftType !== undefined) {
    throw new TlaEvaluationError(
      `Attempted to ${action}${isEquality ? "" : " the"} typed model value ${formatValue(left)} and non-model value\n${formatValue(right)}`,
    );
  }
  throw new TlaEvaluationError(
    `Attempted to ${action} the typed model value ${formatValue(right)} and the non-model value\n${formatValue(left)}`,
  );
};

// TLC orders strings and model value names by when it first interned the text, so every
// check sets the order of its spec's strings before it builds any value.
const stringOrder: { ranks: Record<string, number>; size: number } = {
  ranks: Object.create(null),
  size: 0,
};

export const setStringOrder = (texts: Iterable<string>) => {
  stringOrder.ranks = Object.create(null);
  stringOrder.size = 0;
  modelValues.clear();
  for (const text of texts) rankString(text);
};

// TLC 1.7.4 prints an empty function that isn't a tuple with a space between its brackets, and
// looks a key up in a function differently, so every check also sets the version its values follow.
const valueVersion = { is174: false };

export const setValueVersion = (version: TlcVersion | undefined) => {
  valueVersion.is174 = version === "1.7.4";
};

export const rankString = (text: string) => {
  if (stringOrder.ranks[text] === undefined) stringOrder.ranks[text] = stringOrder.size++;
  return text;
};

export const getRankedStringCount = () => stringOrder.size;

export const getStringRank = (text: string) => stringOrder.ranks[rankString(text)];

const compareStrings = (left: string, right: string) => {
  if (left === right) return 0;
  const ranks = stringOrder.ranks;
  const leftRank = ranks[left];
  const rightRank = ranks[right];
  if (leftRank !== undefined && rightRank !== undefined) return leftRank - rightRank;
  if (leftRank !== undefined) return -1;
  if (rightRank !== undefined) return 1;
  return left < right ? -1 : 1;
};

export const isOverriddenSet = (value: Value): value is InfiniteSetValue | SequenceSetValue =>
  typeof value === "object" && (value.kind === "InfiniteSet" || value.kind === "SequenceSet");

const isOverriddenComparison = (left: Value, right: Value) =>
  (isOverriddenSet(left) || isOverriddenSet(right)) &&
  !(
    typeof left === "object" &&
    left.kind === "SequenceSet" &&
    typeof right === "object" &&
    right.kind === "SequenceSet"
  );

// TLC implements Nat, Int, STRING, Seq(S), and Any in Java classes that compare only with each
// other and with model values. Comparing one with any other set is an error, worded by the class of
// the left operand.
const compareOverriddenSets = (
  left: Value,
  right: Value,
  verb: "compare" | "check equality of",
) => {
  if (!isOverriddenSet(left)) {
    throw new TlaEvaluationError(
      `Attempted to ${verb} the set ${formatValue(isEnumerable(left) ? toFiniteSet(left) : left, true)} with the value:\n${formatValue(right, true)}`,
    );
  }
  if (!isOverriddenSet(right)) {
    throw new TlaEvaluationError(
      `Attempted to compare overridden value ${formatValue(left, true)} with non-overridden value:\n${formatValue(right, true)}`,
    );
  }
  const leftName = left.kind === "InfiniteSet" ? left.name : undefined;
  const rightName = right.kind === "InfiniteSet" ? right.name : undefined;
  if (leftName !== undefined && leftName === rightName) return 0;
  if ((leftName === "Nat" && rightName === "Int") || (leftName === "Int" && rightName === "Nat")) {
    return leftName === "Nat" ? -1 : 1;
  }
  throw new TlaEvaluationError(
    `Attempted to compare ${formatValue(left, true)} with the value\n${formatValue(right, true)}`,
  );
};

export const ANY_SET: InfiniteSetValue = { kind: "InfiniteSet", name: "Any" };

const compareAny = (other: Value): never => {
  throw new TlaEvaluationError(`Attempted to compare ANY with the value\n${formatValue(other)}`);
};

export const compareValues = (left: Value, right: Value): number => {
  if (left === right) {
    if (writtenOrderUse.isUsed) forgetWrittenOrder(left);
    return left === ANY_SET ? compareAny(left) : 0;
  }
  if (typeof left === "object" && typeof right === "object") {
    const leftKind = left.kind;
    const rightKind = right.kind;
    if (leftKind === "Function" && rightKind === "Function") return compareFunctions(left, right);
    if (leftKind === "Set" && rightKind === "Set") return compareSets(left, right);
    if (leftKind === "Interval" && rightKind === "Interval") {
      const size = Math.max(0, left.high - left.low + 1);
      const otherSize = Math.max(0, right.high - right.low + 1);
      return size !== otherSize || size === 0 ? size - otherSize : left.low - right.low;
    }
    if (leftKind === "ModelValue" && rightKind === "ModelValue") {
      if (left.type !== undefined && right.type !== undefined) {
        checkModelValueTypes(left, right, false);
      }
      return left.rank - right.rank;
    }
    if (leftKind === "ModelValue" || rightKind === "ModelValue") {
      checkModelValueTypes(left, right, false);
      return leftKind === "ModelValue" ? -1 : 1;
    }
    if (left === ANY_SET || right === ANY_SET) return compareAny(left === ANY_SET ? right : left);
    if (isSetValue(left) && isSetValue(right) && isOverriddenComparison(left, right)) {
      return compareOverriddenSets(left, right, "compare");
    }
    const isLeftSet = isSetValue(left);
    if (isLeftSet !== isSetValue(right)) {
      throw new TlaEvaluationError(
        `Attempted to compare ${describeKind(left)} ${formatValue(left)} with ${describeKind(right)} ${formatValue(right)}`,
      );
    }
    if (isLeftSet) return compareSets(toFiniteSet(left), toFiniteSet(right));
    return compareFunctions(toFiniteFunction(left), toFiniteFunction(right));
  }
  if (typeof left === "number" && typeof right === "number") return left - right;
  if (typeof left === "string" && typeof right === "string") return compareStrings(left, right);
  if (typeof left === "boolean" && typeof right === "boolean") return left < right ? -1 : 1;
  checkModelValueTypes(left, right, false);
  if (isModelValue(left)) return -1;
  if (isModelValue(right)) return 1;
  throw new TlaEvaluationError(
    `Attempted to compare ${describeKind(left)} ${formatValue(left)} with ${describeKind(right)} ${formatValue(right)}`,
  );
};

const modelValues = new Map<string, ModelValue>();

// A check ranks every model value's name when it creates the value, and creates its own values.
export const createModelValue = (name: string): ModelValue => {
  const known = modelValues.get(name);
  if (known) return known;
  const value: ModelValue = {
    kind: "ModelValue",
    name,
    type: name.length > 2 && name[1] === "_" ? name[0] : undefined,
    rank: getStringRank(name),
  };
  modelValues.set(name, value);
  return value;
};

export const createSortedSet = (elements: Value[]): SetValue => ({
  kind: "Set",
  elements,
  hash: 0,
  fingerprint: 0,
});

export const createSortedFunction = (domain: Value[], range: Value[]): FunctionValue => ({
  kind: "Function",
  domain,
  range,
  hash: 0,
  fingerprint: 0,
  writtenKeys: undefined,
  functionClass: undefined,
});

// TLC words a failed function application by the Java class of the function: FcnLambdaValue for
// [x \in S |-> e], TupleValue for <<...>> and what the sequence operators build, RecordValue for
// [a |-> e], and FcnRcdValue for any other function.
export type FunctionClass = "lambda" | "tuple" | "record";

// Whether a lambda exists for markFingerprinted to find, so that a spec without one skips the walk.
const lambdaPresence = { isPresent: false };

export const setFunctionClass = <FunctionLike extends FunctionValue | LazyFunctionValue>(
  functionValue: FunctionLike,
  functionClass: FunctionClass | undefined,
) => {
  if (functionClass === "lambda") lambdaPresence.isPresent = true;
  if (functionClass !== undefined) functionValue.functionClass = functionClass;
  return functionValue;
};

export const getFunctionClass = (value: Value) =>
  typeof value === "object" && (value.kind === "Function" || value.kind === "LazyFunction")
    ? value.functionClass
    : undefined;

export const markLambdaFunction = <FunctionLike extends FunctionValue | LazyFunctionValue>(
  functionValue: FunctionLike,
) => setFunctionClass(functionValue, "lambda");

const fingerprintedValues = new WeakSet<ObjectValue>();

// FcnLambdaValue#fingerPrint caches the FcnRcdValue the function enumerates to, which applies it
// from then on, so a function TLC has fingerprinted is no longer a lambda.
export const markFingerprinted = (value: Value): void => {
  if (!lambdaPresence.isPresent || typeof value !== "object" || fingerprintedValues.has(value)) {
    return;
  }
  fingerprintedValues.add(value);
  if (value.kind === "Function") {
    if (value.functionClass === "lambda") value.functionClass = undefined;
    value.domain.forEach(markFingerprinted);
    value.range.forEach(markFingerprinted);
  }
  if (value.kind === "Set" || value.kind === "MixedSet") value.elements.forEach(markFingerprinted);
};

export const createSortedRecord = (names: Value[], range: Value[]) =>
  setFunctionClass(createSortedFunction(names, range), "record");

export const valuesEqual = (left: Value, right: Value): boolean => {
  if (left === right) {
    if (writtenOrderUse.isUsed) forgetWrittenOrder(left);
    return left !== ANY_SET || compareAny(left);
  }
  if (typeof left !== "object" || typeof right !== "object") {
    if (typeof left === typeof right) return false;
    if (typeof left === "object" || typeof right === "object") {
      checkModelValueTypes(left, right, true);
    }
    return compareValues(left, right) === 0;
  }
  const isHashed =
    (left.kind === "Set" || left.kind === "Function") &&
    (right.kind === "Set" || right.kind === "Function") &&
    left.hash !== 0 &&
    right.hash !== 0;
  if (isHashed && left.hash !== right.hash) return false;
  if (left.kind === "Function" && right.kind === "Function")
    return compareFunctions(left, right) === 0;
  if (left.kind === "Set" && right.kind === "Set") return compareSets(left, right) === 0;
  if (isModelValue(left) || isModelValue(right)) {
    checkModelValueTypes(left, right, true);
    return isModelValue(left) && isModelValue(right) && left.name === right.name;
  }
  if (left.kind === "Subset" && right.kind === "Subset") return valuesEqual(left.base, right.base);
  if (left.kind === "FunctionSet" && right.kind === "FunctionSet") {
    const isUnit = isEmptySet(left.domain);
    const isOtherUnit = isEmptySet(right.domain);
    if (isUnit || isOtherUnit) return isUnit === isOtherUnit;
    const isEmpty = isEmptySet(left.range);
    const isOtherEmpty = isEmptySet(right.range);
    if (isEmpty || isOtherEmpty) return isEmpty === isOtherEmpty;
    return valuesEqual(left.domain, right.domain) && valuesEqual(left.range, right.range);
  }
  if (left.kind === "RecordSet" && right.kind === "RecordSet") {
    if (isEmptySet(left)) return isEmptySet(right);
    if (isEmptySet(right)) return false;
    const getFields = (set: RecordSetValue) =>
      set.names
        .map((name, index): [string, Value] => [name, set.sets[index]])
        .sort((first, second) => (first[0] < second[0] ? -1 : 1));
    const otherFields = getFields(right);
    return (
      left.names.length === right.names.length &&
      getFields(left).every(
        (field, index) =>
          field[0] === otherFields[index][0] && valuesEqual(field[1], otherFields[index][1]),
      )
    );
  }
  if (left.kind === "ProductSet" && right.kind === "ProductSet") {
    if (isEmptySet(left)) return isEmptySet(right);
    if (isEmptySet(right)) return false;
    return (
      left.factors.length === right.factors.length &&
      left.factors.every((factor, index) => valuesEqual(factor, right.factors[index]))
    );
  }
  const isInfiniteComparison =
    isSetValue(left) && isSetValue(right) && !(isEnumerable(left) && isEnumerable(right));
  if (isInfiniteComparison && isOverriddenComparison(left, right)) {
    return compareOverriddenSets(left, right, "check equality of") === 0;
  }
  if (isInfiniteComparison) {
    if (!isOverriddenSet(left)) {
      const elements = toFiniteSet(left);
      if (!isOverriddenSet(right)) return compareSets(elements, toFiniteSet(right)) === 0;
    }
    return getValueKey(left) === getValueKey(right);
  }
  return compareValues(left, right) === 0;
};

// TLC prints and words errors about an equal function by its Java class, so a value can stand for
// another in a state only if each function in it has the same class.
const createSameValueCheck = (isClassSensitive: boolean) => {
  const areSameValues = (left: Value[], right: Value[]) =>
    left === right ||
    (left.length === right.length && left.every((element, index) => isSame(element, right[index])));
  const isSame = (left: Value, right: Value): boolean => {
    if (left === right) return true;
    if (typeof left !== "object" || typeof right !== "object") return false;
    if (left.kind === "Set" && right.kind === "Set")
      return (
        (left.hash === 0 || right.hash === 0 || left.hash === right.hash) &&
        areSameValues(left.elements, right.elements)
      );
    if (left.kind === "Function" && right.kind === "Function")
      return (
        (!isClassSensitive || left.functionClass === right.functionClass) &&
        (left.hash === 0 || right.hash === 0 || left.hash === right.hash) &&
        areSameValues(left.domain, right.domain) &&
        areSameValues(left.range, right.range)
      );
    return getValueKey(left) === getValueKey(right);
  };
  return isSame;
};

export const isSameValue = createSameValueCheck(false);

export const isInterchangeableValue = createSameValueCheck(true);

// The comparisons above fail with their own messages. These follow the compareTo and equals
// methods of TLC's Java value classes, which word a failure by the class of the left operand, so a
// failed comparison runs again through them to fail as TLC does.
interface TlcFunction {
  domain: Value[];
  range: Value[];
  low: number | undefined;
}

const getIntervalLow = (domain: Value[]) => {
  const first = domain.length === 0 ? 1 : domain[0];
  return typeof first === "number" && domain.every((key, index) => key === first + index)
    ? first
    : undefined;
};

const toTlcFunction = (value: Value) => {
  if (!isFunctionValue(value)) return undefined;
  const functionValue = toFiniteFunction(value);
  return {
    domain: functionValue.domain,
    range: functionValue.range,
    low: getIntervalLow(functionValue.domain),
  };
};

const toTlcRecord = (value: Value) => {
  if (!isFunctionValue(value)) return undefined;
  const functionValue = toFiniteFunction(value);
  return functionValue.domain.every((key) => typeof key === "string") ? functionValue : undefined;
};

const compareModelValueWith = (modelValue: ModelValue, other: Value) => {
  if (getModelValueType(modelValue) !== undefined) {
    throw new TlaEvaluationError(
      `Attempted to compare the typed model value ${formatValue(modelValue)} and the non-model value\n${formatValue(other)}`,
    );
  }
  return 1;
};

const equalsModelValueWith = (modelValue: ModelValue, other: Value) => {
  if (getModelValueType(modelValue) !== undefined) {
    throw new TlaEvaluationError(
      `Attempted to check equality of the typed model value ${formatValue(modelValue)} and the non-model value\n${formatValue(other)}`,
    );
  }
  return false;
};

const compareModelValue = (left: ModelValue, right: Value) => {
  const type = getModelValueType(left);
  if (type === undefined) return isModelValue(right) ? left.rank - right.rank : -1;
  if (!isModelValue(right)) {
    throw new TlaEvaluationError(
      `Attempted to compare the typed model value ${formatValue(left)} and non-model value\n${formatValue(right)}`,
    );
  }
  const otherType = getModelValueType(right);
  if (otherType !== undefined && otherType !== type) {
    throw new TlaEvaluationError(
      `Attempted to compare the differently-typed model values ${formatValue(left)} and ${formatValue(right)}`,
    );
  }
  return left.rank - right.rank;
};

const equalsModelValue = (left: ModelValue, right: Value) => {
  const type = getModelValueType(left);
  if (type === undefined) return isModelValue(right) && left.name === right.name;
  if (!isModelValue(right)) {
    throw new TlaEvaluationError(
      `Attempted to check equality of typed model value ${formatValue(left)} and non-model value\n${formatValue(right)}`,
    );
  }
  const otherType = getModelValueType(right);
  if (otherType !== undefined && otherType !== type) {
    throw new TlaEvaluationError(
      `Attempted to check equality of the differently-typed model values ${formatValue(left)} and ${formatValue(right)}`,
    );
  }
  return left.name === right.name;
};

const SCALAR_KINDS = {
  number: { name: "integer", other: "non-integer", equality: "check equality of" },
  string: { name: "string", other: "non-string", equality: "check equality of" },
  boolean: { name: "boolean", other: "non-boolean", equality: "compare equality of" },
};

const describeScalarMismatch = (
  left: number | string | boolean,
  right: Value,
  isEquality: boolean,
) => {
  const kind =
    SCALAR_KINDS[
      typeof left === "number" ? "number" : typeof left === "string" ? "string" : "boolean"
    ];
  return `Attempted to ${isEquality ? kind.equality : "compare"} ${kind.name} ${formatValue(left)} with ${kind.other}:\n${formatValue(right)}`;
};

const compareTlcFunctions = (functionValue: TlcFunction, left: Value, right: Value) => {
  const other = toTlcFunction(right);
  if (!other) {
    if (isModelValue(right)) return compareModelValueWith(right, left);
    throw new TlaEvaluationError(
      `Attempted to compare the function ${formatValue(left)} with the value:\n${formatValue(right)}`,
    );
  }
  if (functionValue.range.length !== other.range.length)
    return functionValue.range.length - other.range.length;
  const compareRanges = () => compareElementsLikeTlc(functionValue.range, other.range);
  if (functionValue.low !== undefined && functionValue.range.length === 0) return 0;
  if (functionValue.low !== undefined && other.low !== undefined) {
    return functionValue.low === other.low ? compareRanges() : functionValue.low - other.low;
  }
  const intervalLow = functionValue.low ?? other.low;
  if (intervalLow === undefined) {
    return compareElementsLikeTlc(functionValue.domain, other.domain) || compareRanges();
  }
  const keys = functionValue.low === undefined ? functionValue.domain : other.domain;
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    if (typeof key !== "number") {
      throw new TlaEvaluationError(
        `Attempted to compare integer with non-integer${functionValue.low === undefined ? "" : ":"}\n${formatValue(key)}.`,
      );
    }
    const difference =
      functionValue.low === undefined ? key - (intervalLow + index) : intervalLow + index - key;
    if (difference !== 0) return difference;
  }
  return compareRanges();
};

const compareElementsLikeTlc = (left: Value[], right: Value[]) => {
  for (let index = 0; index < left.length; index++) {
    const comparison = compareLikeTlc(left[index], right[index]);
    if (comparison !== 0) return comparison;
  }
  return 0;
};

const compareFunctionLikeTlc = (left: FunctionValue | LazyFunctionValue, right: Value) => {
  const functionValue = toFiniteFunction(left);
  const isTuple = left.kind === "Function" && getSequenceElements(functionValue) !== undefined;
  if (isTuple) {
    const tuple = isFunctionValue(right) ? getSequenceElements(right) : undefined;
    if (!tuple) return compareTlcFunctions({ ...functionValue, low: 1 }, left, right);
    return (
      functionValue.range.length - tuple.length ||
      compareElementsLikeTlc(functionValue.range, tuple)
    );
  }
  if (getFunctionClass(left) === "record") {
    const record = toTlcRecord(right);
    if (!record) {
      if (isModelValue(right)) return compareModelValueWith(right, left);
      throw new TlaEvaluationError(
        `Attempted to compare record:\n${formatValue(left)}\nwith non-record\n${formatValue(right)}`,
      );
    }
    return (
      functionValue.domain.length - record.domain.length ||
      compareElementsLikeTlc(functionValue.domain, record.domain) ||
      compareElementsLikeTlc(functionValue.range, record.range)
    );
  }
  return compareTlcFunctions(
    { ...functionValue, low: getIntervalLow(functionValue.domain) },
    left,
    right,
  );
};

export const isEnumeratedSet = (value: Value): value is SetValue | MixedSetValue =>
  typeof value === "object" && (value.kind === "Set" || value.kind === "MixedSet");

// TLC compares a lazy set, or a set it overrides in Java, through its own class before it compares
// elements. The comparisons above already fail as those classes do.
const isComparedByClass = (left: ObjectValue, right: Value) =>
  isOverriddenSet(left) ||
  isOverriddenSet(right) ||
  (typeof right === "object" &&
    left.kind === right.kind &&
    (left.kind === "Interval" ||
      left.kind === "Subset" ||
      left.kind === "FunctionSet" ||
      left.kind === "RecordSet" ||
      left.kind === "ProductSet"));

const getSetElementsLikeTlc = (left: SetValue | MixedSetValue, right: Value) => {
  const other = isEnumeratedSet(right) ? right : toFiniteSet(right);
  return { elements: toFiniteSet(left).elements, otherElements: toFiniteSet(other).elements };
};

const compareSetLikeTlc = (left: ObjectValue, right: Value): number => {
  if (isComparedByClass(left, right)) return compareValues(left, right);
  if (!isEnumeratedSet(left)) return compareSetLikeTlc(toFiniteSet(left), right);
  if (!isSetValue(right)) {
    if (isModelValue(right)) return compareModelValueWith(right, left);
    throw new TlaEvaluationError(
      `Attempted to compare the set ${formatValue(left)} with the value:\n${formatValue(right)}`,
    );
  }
  const sets = getSetElementsLikeTlc(left, right);
  return (
    sets.elements.length - sets.otherElements.length ||
    compareElementsLikeTlc(sets.elements, sets.otherElements)
  );
};

const compareLikeTlc = (left: Value, right: Value): number => {
  if (typeof left !== "object") {
    if (typeof right === typeof left) return compareValues(left, right);
    if (isModelValue(right)) return compareModelValueWith(right, left);
    throw new TlaEvaluationError(describeScalarMismatch(left, right, false));
  }
  if (left.kind === "ModelValue") return compareModelValue(left, right);
  if (isFunctionValue(left)) return compareFunctionLikeTlc(left, right);
  return compareSetLikeTlc(left, right);
};

const equalsElementsLikeTlc = (left: Value[], right: Value[]) =>
  left.every((element, index) => equalsLikeTlc(element, right[index]));

const equalsTlcFunctions = (functionValue: TlcFunction, left: Value, right: Value) => {
  const other = toTlcFunction(right);
  if (!other) {
    if (isModelValue(right)) return equalsModelValueWith(right, left);
    throw new TlaEvaluationError(
      `Attempted to check equality of the function ${formatValue(left)} with the value:\n${formatValue(right)}`,
    );
  }
  if (functionValue.range.length !== other.range.length) return false;
  if (functionValue.low !== undefined && other.low !== undefined) {
    return (
      (functionValue.range.length === 0 || functionValue.low === other.low) &&
      equalsElementsLikeTlc(functionValue.range, other.range)
    );
  }
  const intervalLow = functionValue.low ?? other.low;
  if (intervalLow === undefined) {
    return (
      equalsElementsLikeTlc(functionValue.domain, other.domain) &&
      equalsElementsLikeTlc(functionValue.range, other.range)
    );
  }
  const keys = functionValue.low === undefined ? functionValue.domain : other.domain;
  return (
    keys.every((key, index) => {
      if (typeof key !== "number") {
        throw new TlaEvaluationError(
          `Attempted to compare an integer with non-integer:\n${formatValue(key)}.`,
        );
      }
      return key === intervalLow + index;
    }) && equalsElementsLikeTlc(functionValue.range, other.range)
  );
};

const equalsFunctionLikeTlc = (left: FunctionValue | LazyFunctionValue, right: Value) => {
  const functionValue = toFiniteFunction(left);
  const isTuple = left.kind === "Function" && getSequenceElements(functionValue) !== undefined;
  if (isTuple) {
    const tuple = isFunctionValue(right) ? getSequenceElements(right) : undefined;
    if (!tuple) return equalsTlcFunctions({ ...functionValue, low: 1 }, left, right);
    return (
      functionValue.range.length === tuple.length &&
      equalsElementsLikeTlc(functionValue.range, tuple)
    );
  }
  if (getFunctionClass(left) === "record") {
    const record = toTlcRecord(right);
    if (!record) {
      if (isModelValue(right)) return equalsModelValueWith(right, left);
      throw new TlaEvaluationError(
        `Attempted to check equality of record:\n${formatValue(left)}\nwith non-record\n${formatValue(right)}`,
      );
    }
    return (
      functionValue.domain.length === record.domain.length &&
      equalsElementsLikeTlc(functionValue.domain, record.domain) &&
      equalsElementsLikeTlc(functionValue.range, record.range)
    );
  }
  return equalsTlcFunctions(
    { ...functionValue, low: getIntervalLow(functionValue.domain) },
    left,
    right,
  );
};

const equalsSetLikeTlc = (left: ObjectValue, right: Value): boolean => {
  if (isComparedByClass(left, right)) return valuesEqual(left, right);
  if (!isEnumeratedSet(left)) return equalsSetLikeTlc(toFiniteSet(left), right);
  if (!isSetValue(right)) {
    if (isModelValue(right)) return equalsModelValueWith(right, left);
    throw new TlaEvaluationError(
      `Attempted to check equality of the set ${formatValue(left)} with the value:\n${formatValue(right)}`,
    );
  }
  const sets = getSetElementsLikeTlc(left, right);
  return (
    sets.elements.length === sets.otherElements.length &&
    equalsElementsLikeTlc(sets.elements, sets.otherElements)
  );
};

const equalsLikeTlc = (left: Value, right: Value): boolean => {
  if (typeof left !== "object") {
    if (typeof right === typeof left) return left === right;
    if (isModelValue(right)) return equalsModelValueWith(right, left);
    throw new TlaEvaluationError(describeScalarMismatch(left, right, true));
  }
  if (left.kind === "ModelValue") return equalsModelValue(left, right);
  if (isFunctionValue(left)) return equalsFunctionLikeTlc(left, right);
  return equalsSetLikeTlc(left, right);
};

// TLC's ValueVec.sort, which inserts each element into the sorted prefix by binary search.
const sortLikeTlc = (elements: Value[]) => {
  const sorted: Value[] = [];
  for (const element of elements) {
    const found = searchLikeTlc(element, sorted);
    if (!found.isFound) sorted.splice(found.index, 0, element);
  }
  return sorted;
};

// Calls a method of a value as TLC does, whose failure the value heads when it has a source.
const callTracedMethod = <Result>(receiver: Value, method: () => Result) => {
  const sets = setTrace.sets;
  if (sets === undefined) return method();
  sets.push(receiver);
  const result = method();
  sets.pop();
  return result;
};

// ValueVec.search on sorted elements: a binary search with compareTo, which ends where the element
// is or would go.
const searchLikeTlc = (element: Value, sorted: Value[]) => {
  const bounds = { low: 0, high: sorted.length };
  while (bounds.low < bounds.high) {
    const middle = bounds.low + ((bounds.high - bounds.low) >> 1);
    const comparison = callTracedMethod(element, () => compareLikeTlc(element, sorted[middle]));
    if (comparison === 0) return { index: middle, isFound: true };
    if (comparison < 0) bounds.high = middle;
    else bounds.low = middle + 1;
  }
  return { index: bounds.low, isFound: false };
};

// TLC checks membership in a set enumeration it hasn't sorted element by element, with the equals
// method of each member.
const isElementOfLikeTlc = (element: Value, elements: Value[]) =>
  elements.some((member) => callTracedMethod(member, () => equalsLikeTlc(member, element)));

// The sets TLC has normalized, whose membership ValueVec.search checks by binary search with
// compareTo instead of element by element.
const normalizedSets = new WeakSet<SetValue>();

// IValue.deepNormalize, which TLC applies to the constants of the config and the constant
// definitions it computes as it starts.
export const markNormalized = (value: Value): void => {
  if (typeof value !== "object") return;
  if (value.kind === "Set") {
    normalizedSets.add(value);
    value.elements.forEach(markNormalized);
  }
  if (value.kind === "Function") {
    value.domain.forEach(markNormalized);
    value.range.forEach(markNormalized);
  }
};

export const isEqualLikeTlc = (left: Value, right: Value) =>
  computeLikeTlcOnFailure(
    () => valuesEqual(left, right),
    () => equalsLikeTlc(left, right),
  );

const isStrictlySorted = (elements: Value[]) => {
  for (let index = 1; index < elements.length; index++) {
    if (compareValues(elements[index - 1], elements[index]) >= 0) return false;
  }
  return true;
};

export const createSet = (elements: Value[]): SetValue => {
  if (elements.length < 2 || isStrictlySorted(elements)) return createSortedSet(elements);
  const sorted = [...elements].sort(compareValues);
  const unique = [sorted[0]];
  for (let index = 1; index < sorted.length; index++) {
    if (compareValues(unique[unique.length - 1], sorted[index]) !== 0) unique.push(sorted[index]);
  }
  return createSortedSet(unique);
};

// TLC builds a set enumeration without sorting it, so one whose elements it can't compare still
// evaluates.
export const createEnumeratedSet = (elements: Value[]): SetValue | MixedSetValue =>
  computeLikeTlcOnFailure<SetValue | MixedSetValue>(
    () => createSet(elements),
    () => ({ kind: "MixedSet", elements }),
  );

export const EMPTY_SET = createSortedSet([]);

export const differenceSorted = (left: SetValue, right: SetValue): SetValue => {
  if (left.elements.length === 0 || right.elements.length === 0) return left;
  const leftElements = left.elements;
  const rightElements = right.elements;
  const kept: Value[] = [];
  let rightIndex = 0;
  for (let leftIndex = 0; leftIndex < leftElements.length; leftIndex++) {
    const element = leftElements[leftIndex];
    while (
      rightIndex < rightElements.length &&
      compareValues(rightElements[rightIndex], element) < 0
    ) {
      rightIndex++;
    }
    if (
      rightIndex < rightElements.length &&
      compareValues(rightElements[rightIndex], element) === 0
    ) {
      continue;
    }
    kept.push(element);
  }
  return kept.length === leftElements.length ? left : createSortedSet(kept);
};

export const intersectSorted = (left: SetValue, right: SetValue): SetValue => {
  const leftElements = left.elements;
  const rightElements = right.elements;
  const kept: Value[] = [];
  let rightIndex = 0;
  for (let leftIndex = 0; leftIndex < leftElements.length; leftIndex++) {
    const element = leftElements[leftIndex];
    while (
      rightIndex < rightElements.length &&
      compareValues(rightElements[rightIndex], element) < 0
    ) {
      rightIndex++;
    }
    if (
      rightIndex < rightElements.length &&
      compareValues(rightElements[rightIndex], element) === 0
    ) {
      kept.push(element);
    }
  }
  return kept.length === leftElements.length ? left : createSortedSet(kept);
};

export const unionSorted = (left: SetValue, right: SetValue): SetValue => {
  if (left.elements.length === 0) return right;
  if (right.elements.length === 0) return left;
  const leftElements = left.elements;
  const rightElements = right.elements;
  const merged: Value[] = [];
  const added: Value[] = [];
  let leftIndex = 0;
  let rightIndex = 0;
  while (leftIndex < leftElements.length && rightIndex < rightElements.length) {
    const comparison = compareValues(leftElements[leftIndex], rightElements[rightIndex]);
    if (comparison < 0) merged.push(leftElements[leftIndex++]);
    else if (comparison > 0) {
      added.push(rightElements[rightIndex]);
      merged.push(rightElements[rightIndex++]);
    } else {
      merged.push(leftElements[leftIndex++]);
      rightIndex++;
    }
  }
  while (leftIndex < leftElements.length) merged.push(leftElements[leftIndex++]);
  while (rightIndex < rightElements.length) {
    added.push(rightElements[rightIndex]);
    merged.push(rightElements[rightIndex++]);
  }
  if (added.length === 0) return left;
  const union = createSortedSet(merged);
  if (left.hash !== 0 && left.hash !== UNFINGERPRINTABLE_HASH) {
    let hash = left.hash;
    let index = 0;
    for (; index < added.length; index++) {
      const elementHash = getValueHash(added[index]);
      if (elementHash === UNFINGERPRINTABLE_HASH) break;
      hash = (hash + getElementContribution(elementHash)) | 0;
    }
    if (index === added.length) union.hash = hash;
  }
  if (left.fingerprint !== 0) {
    let fingerprint = left.fingerprint;
    for (let index = 0; index < added.length; index++) {
      fingerprint = (fingerprint + getElementFingerprint(added[index])) | 0;
    }
    union.fingerprint = fingerprint;
  }
  return union;
};

export const createFunction = (pairs: [Value, Value][]): FunctionValue => {
  const sorted =
    pairs.length < 2 ? pairs : [...pairs].sort((left, right) => compareValues(left[0], right[0]));
  const domain: Value[] = [];
  const range: Value[] = [];
  for (const pair of sorted) {
    if (domain.length > 0 && compareValues(domain[domain.length - 1], pair[0]) === 0) continue;
    domain.push(pair[0]);
    range.push(pair[1]);
  }
  return createSortedFunction(domain, range);
};

export const createWrittenFunction = (pairs: [Value, Value][]) => {
  const functionValue = createFunction(pairs);
  const isWrittenSorted =
    functionValue.domain.length !== pairs.length ||
    pairs.some((pair) => typeof pair[0] !== "string") ||
    pairs.every((pair, index) => pair[0] === functionValue.domain[index]);
  return isWrittenSorted
    ? functionValue
    : setWrittenOrder(
        functionValue,
        pairs.map((pair) => pair[0]),
      );
};

const intervalDomains: Value[][] = [];
const intervalValues: IntervalValue[] = [];
const intervalArrays = new WeakMap<Value[], IntervalValue>();

// TLC keeps the domain of a tuple, or of a function built over an interval, as an interval. Every
// function over 1..n shares one domain array per length, and the elements of any other interval
// map to it, so the array's identity records it. Callers must not mutate the returned array.
const getIntervalDomain = (length: number): Value[] => {
  const cached = intervalDomains[length];
  if (cached) return cached;
  const domain = Array.from({ length }, (_, index) => index + 1);
  intervalDomains[length] = domain;
  return domain;
};

// The elements of an interval for a caller that only iterates them, so they need not record
// the interval for DOMAIN.
export const getIntervalElements = (value: IntervalValue): Value[] => {
  getCardinality(value);
  if (value.low === 1 && value.high >= 1) return getIntervalDomain(value.high);
  const elements: number[] = [];
  for (let element = value.low; element <= value.high; element++) elements.push(element);
  return elements;
};

const isIntervalDomain = (domain: Value[]) =>
  domain.length > 0 && (domain === intervalDomains[domain.length] || intervalArrays.has(domain));

// TLC keeps an interval domain only for a function built over an interval itself, so a set
// such as (1..2) \cap S, whose elements are the shared array, gets a copy.
export const getFunctionDomain = (set: Value): Value[] => {
  const elements = toFiniteSet(set).elements;
  return isIntervalDomain(elements) && !(typeof set === "object" && set.kind === "Interval")
    ? [...elements]
    : elements;
};

const getIntervalValue = (high: number): IntervalValue => {
  const cached = intervalValues[high];
  if (cached) return cached;
  const interval: IntervalValue = { kind: "Interval", low: 1, high };
  intervalValues[high] = interval;
  return interval;
};

export const createTuple = (elements: Value[]): FunctionValue =>
  setFunctionClass(createSortedFunction(getIntervalDomain(elements.length), elements), "tuple");

export const createRecord = (fields: [string, Value][]): FunctionValue =>
  setFunctionClass(createFunction(fields), "record");

// TLC's Enumerable classes: every set except the ones it implements in Java.
export const isTlcEnumerable = (value: Value) => isSetValue(value) && !isOverriddenSet(value);

const formatUnion = (value: UnionValue, isStrict = false) =>
  `UNION(${formatValue(value.base, isStrict)})`;

const getUnionSets = (value: UnionValue) => {
  if (!isTlcEnumerable(value.base)) {
    throw new TlaEvaluationError(
      `Attempted to enumerate the nonenumerable set:\n${formatUnion(value)}`,
    );
  }
  return toFiniteSet(value.base).elements;
};

const getUnionSet = (set: Value, index: number, union: UnionValue) => {
  if (isTlcEnumerable(set)) return set;
  throw new TlaEvaluationError(
    index === 0
      ? "Attempted to enumerate UNION(s), but some element of s is nonenumerable."
      : `Attempted to enumerate the nonenumerable set:\n${formatValue(set)}\nwhen enumerating:\n${formatUnion(union)}`,
  );
};

export const isEnumerable = (value: Value): boolean => {
  if (typeof value !== "object") return false;
  switch (value.kind) {
    case "Set":
    case "MixedSet":
    case "Interval":
      return true;
    case "InfiniteSet":
    case "SequenceSet":
      return false;
    case "Subset":
    case "FilteredSet":
      return isEnumerable(value.base);
    case "FunctionSet":
      return (
        (isEnumerable(value.domain) && isEnumerable(value.range)) ||
        getEmptiness(value.domain) === true ||
        getEmptiness(value) === true
      );
    case "RecordSet":
      return value.sets.every(isEnumerable) || getEmptiness(value) === true;
    case "ProductSet":
      return value.factors.every(isEnumerable) || getEmptiness(value) === true;
    case "Union":
      return isEnumerable(value.base) && toFiniteSet(value.base).elements.every(isEnumerable);
    case "SetOperation":
      if (value.operator === "\\cup") return isEnumerable(value.left) && isEnumerable(value.right);
      if (value.operator === "\\cap") return isEnumerable(value.left) || isEnumerable(value.right);
      return isEnumerable(value.left);
    default:
      return false;
  }
};

const getEmptiness = (value: Value): boolean | undefined => {
  if (typeof value !== "object") return undefined;
  switch (value.kind) {
    case "Set":
    case "MixedSet":
      return value.elements.length === 0;
    case "Interval":
      return value.low > value.high;
    case "InfiniteSet":
      return value.name === "Any" ? undefined : false;
    case "Subset":
    case "SequenceSet":
      return false;
    case "FunctionSet": {
      const isUnit = getEmptiness(value.domain);
      if (isUnit === undefined) return undefined;
      return isUnit ? false : getEmptiness(value.range);
    }
    case "RecordSet":
    case "ProductSet": {
      for (const part of value.kind === "RecordSet" ? value.sets : value.factors) {
        const isEmpty = getEmptiness(part);
        if (isEmpty !== false) return isEmpty;
      }
      return false;
    }
    case "SetOperation":
    case "FilteredSet":
    case "Union":
      return isEnumerable(value) ? toFiniteSet(value).elements.length === 0 : undefined;
    default:
      return undefined;
  }
};

const getCartesianProduct = (lists: Value[][]) => {
  const total = lists.reduce((product, list) => product * list.length, 1);
  const combinations: Value[][] = [];
  const positions = lists.map(() => 0);
  for (let count = 0; count < total; count++) {
    combinations.push(lists.map((list, index) => list[positions[index]]));
    for (let index = lists.length - 1; index >= 0; index--) {
      positions[index]++;
      if (positions[index] < lists[index].length) break;
      positions[index] = 0;
    }
  }
  return combinations;
};

const advanceCombination = (indices: number[], length: number) => {
  for (let position = indices.length - 1; position >= 0; position--) {
    if (indices[position] < length - indices.length + position) {
      indices[position]++;
      for (let next = position + 1; next < indices.length; next++) {
        indices[next] = indices[next - 1] + 1;
      }
      return true;
    }
  }
  return false;
};

const getSortedSubsets = (base: Value[]) => {
  const subsets: Value[] = [];
  for (let size = 0; size <= base.length; size++) {
    const indices = Array.from({ length: size }, (_, index) => index);
    do {
      subsets.push(createSortedSet(indices.map((index) => base[index])));
    } while (advanceCombination(indices, base.length));
  }
  return subsets;
};

const enumerateSet = (value: Value): Value[] => {
  if (typeof value !== "object")
    throw new TlaEvaluationError(`Expected a set but found ${formatValue(value)}`);
  switch (value.kind) {
    case "Set":
      return value.elements;
    case "MixedSet":
      return sortLikeTlc(value.elements);
    case "Interval": {
      const elements = getIntervalElements(value);
      if (elements !== intervalDomains[elements.length]) intervalArrays.set(elements, value);
      return elements;
    }
    case "Subset": {
      // SubsetValue.toSetEnum sizes the set before it enumerates it, and enumerates only the empty
      // set of a value of size 0, a function with an empty domain among them.
      if (getCardinality(value.base) === 0) return getSortedSubsets([]);
      if (!isSetValue(value.base)) {
        throw new TlaEvaluationError(
          `Attempted to compute the value of an expression of form\nSUBSET S, but S is a non-enumerable value:\n${prettyPrint(formatValue(value.base))}`,
        );
      }
      const base = toFiniteSet(value.base).elements;
      if (base.length > MAXIMUM_ENUMERATED_SUBSET_BASE) {
        throw new TlaEvaluationError(describeOverflow(value));
      }
      return getSortedSubsets(base);
    }
    case "FunctionSet": {
      if (isEmptySet(value)) return [];
      if (isOverriddenSet(value.domain)) {
        throw new TlaEvaluationError(
          `Attempted to enumerate a set of the form [D -> R],but the domain D:\n${formatValue(value.domain)}\ncannot be enumerated.`,
        );
      }
      const domain = getFunctionDomain(value.domain);
      if (domain.length > 0 && isOverriddenSet(value.range)) {
        throw new TlaEvaluationError(
          `Attempted to enumerate a set of the form [D -> R],but the range R:\n${formatValue(value.range)}\ncannot be enumerated.`,
        );
      }
      const range = domain.length === 0 ? [] : toFiniteSet(value.range).elements;
      return getCartesianProduct(domain.map(() => range)).map((combination): Value =>
        createSortedFunction(domain, combination),
      );
    }
    case "RecordSet": {
      if (isEmptySet(value)) return [];
      const fields = value.sets.map((set, index) => {
        if (isOverriddenSet(set)) {
          throw new TlaEvaluationError(
            `Attempted to enumerate a set of the form [l1 : v1, ..., ln : vn],\nbut can't enumerate the value of the \`${value.names[index]}' field:\n${formatValue(set)}`,
          );
        }
        return toFiniteSet(set).elements;
      });
      return getCartesianProduct(fields).map((combination) =>
        createRecord(value.names.map((name, index): [string, Value] => [name, combination[index]])),
      );
    }
    case "ProductSet": {
      if (isEmptySet(value)) return [];
      const factors = value.factors.map((factor, index) => {
        if (isOverriddenSet(factor)) {
          throw new TlaEvaluationError(
            `Attempted to enumerate a set of the form s1 \\X s2 ... \\X sn,\nbut can't enumerate s${index}:\n${formatValue(factor)}`,
          );
        }
        return toFiniteSet(factor).elements;
      });
      return getCartesianProduct(factors).map(createTuple);
    }
    case "FilteredSet":
      if (!isSetValue(value.base) || isOverriddenSet(value.base)) {
        throw new TlaEvaluationError(
          `Attempted to enumerate { x \\in S : p(x) } when S:\n${formatValue(value.base)}\nis not enumerable`,
        );
      }
      return toFiniteSet(value.base).elements.filter(value.test);
    case "Union": {
      const elements = getUnionSets(value).flatMap(
        (set, index) => toFiniteSet(getUnionSet(set, index, value)).elements,
      );
      return toFiniteSet(createEnumeratedSet(elements)).elements;
    }
    case "SetOperation": {
      if (
        value.operator === "\\cup" &&
        (!isTlcEnumerable(value.left) || !isTlcEnumerable(value.right))
      ) {
        throw new TlaEvaluationError(
          `Attempted to enumerate S \\cup T when S:\n${formatValue(value.left)}\nand T:\n${formatValue(value.right)}\nare not both enumerable`,
        );
      }
      if (
        value.operator === "\\cap" &&
        !isTlcEnumerable(value.left) &&
        !isTlcEnumerable(value.right)
      ) {
        throw new TlaEvaluationError(
          `Attempted to enumerate S \\cap T when neither S:\n${formatValue(value.left)}\nnor T:\n${formatValue(value.right)}\nis enumerable`,
        );
      }
      if (value.operator === "\\" && !isTlcEnumerable(value.left)) {
        throw new TlaEvaluationError(
          `Attempted to enumerate S \\ T when S:\n${formatValue(value.left)}\nis not enumerable.`,
        );
      }
      if (value.operator === "\\cup")
        return unionSorted(toFiniteSet(value.left), toFiniteSet(value.right)).elements;
      const isLeftEnumerated = value.operator === "\\" || isTlcEnumerable(value.left);
      const enumerated = isLeftEnumerated ? value.left : value.right;
      const other = isLeftEnumerated ? value.right : value.left;
      return toFiniteSet(enumerated).elements.filter(
        (element) => isElementOf(element, other) === (value.operator === "\\cap"),
      );
    }
    case "InfiniteSet":
    case "SequenceSet":
      throw new TlaEvaluationError(
        `Attempted to enumerate the non-enumerable set ${formatValue(value)}`,
      );
    default:
      throw new TlaEvaluationError(`Expected a set but found ${formatValue(value)}`);
  }
};

const finiteSets = new WeakMap<ObjectValue, SetValue>();

export const toFiniteSet = (value: Value): SetValue => {
  if (typeof value === "object" && value.kind === "Set") return value;
  if (typeof value === "object" && value.kind === "Interval") {
    return createSortedSet(enumerateSet(value));
  }
  const cached = typeof value === "object" ? finiteSets.get(value) : undefined;
  if (cached) return cached;
  const sets = setTrace.sets;
  sets?.push(value);
  const elements = enumerateSet(value);
  sets?.pop();
  const isSorted =
    typeof value === "object" &&
    (value.kind === "MixedSet" ||
      value.kind === "Union" ||
      value.kind === "SetOperation" ||
      value.kind === "FilteredSet" ||
      value.kind === "ProductSet" ||
      value.kind === "FunctionSet" ||
      value.kind === "Subset");
  const set = isSorted ? createSortedSet(elements) : createSet(elements);
  if (typeof value === "object") finiteSets.set(value, set);
  return set;
};

// TLC's Enumerator for a lazy set streams the sets it combines until the set caches its elements,
// so an element that two of them share comes up once for each.
export const getStreamedElements = (value: Value): Value[] => {
  if (typeof value !== "object" || finiteSets.has(value)) return toFiniteSet(value).elements;
  const sets = setTrace.sets;
  sets?.push(value);
  const elements = streamElements(value);
  sets?.pop();
  return elements;
};

const streamElements = (value: ObjectValue): Value[] => {
  if (value.kind === "Union") {
    return getUnionSets(value).flatMap((set, index) =>
      getStreamedElements(getUnionSet(set, index, value)),
    );
  }
  if (value.kind === "FilteredSet" && !isOverriddenSet(value.base)) {
    return getStreamedElements(value.base).filter(value.test);
  }
  if (value.kind !== "SetOperation") return toFiniteSet(value).elements;
  if (value.operator === "\\cup") {
    return !isTlcEnumerable(value.left) || !isTlcEnumerable(value.right)
      ? toFiniteSet(value).elements
      : [...getStreamedElements(value.left), ...getStreamedElements(value.right)];
  }
  const isLeftEnumerated = value.operator === "\\" || isTlcEnumerable(value.left);
  const enumerated = isLeftEnumerated ? value.left : value.right;
  const other = isLeftEnumerated ? value.right : value.left;
  if (!isTlcEnumerable(enumerated)) return toFiniteSet(value).elements;
  return getStreamedElements(enumerated).filter(
    (element) => isElementOf(element, other) === (value.operator === "\\cap"),
  );
};

export const isEmptySet = (value: Value): boolean => {
  if (typeof value !== "object" || !isSetValue(value)) {
    throw new TlaEvaluationError(`Shouldn't call isEmpty() on value ${formatValue(value)}`);
  }
  switch (value.kind) {
    case "Set":
    case "MixedSet":
      return value.elements.length === 0;
    case "Interval":
      return value.low > value.high;
    case "InfiniteSet":
      if (value.name === "Any") {
        throw new TlaEvaluationError("Shouldn't call isEmpty() on value ANY");
      }
      return false;
    case "Subset":
    case "SequenceSet":
      return false;
    case "ProductSet":
      return value.factors.some(isEmptySet);
    case "RecordSet":
      return value.sets.some(isEmptySet);
    case "FunctionSet":
      return !isEmptySet(value.domain) && isEmptySet(value.range);
    case "Union":
      return getUnionSets(value).every((set, index) => isEmptySet(getUnionSet(set, index, value)));
    default:
      return toFiniteSet(value).elements.length === 0;
  }
};

const getProductCardinality = (
  sets: Value[],
  version: TlcVersion | undefined,
  describe: () => string,
) =>
  sets.reduce<number>((product, set) => {
    const size = product * getCardinality(set, version);
    if (size > MAXIMUM_INTEGER) throw new TlaEvaluationError(describe());
    return size;
  }, 1);

const describeOverflow = (value: Value) =>
  `Overflow when computing the number of elements in:\n${formatValue(value)}`;

// TLC 1.7.4 sizes every component of a set of functions, records, or tuples without first
// checking whether one is empty, so an infinite component fails even beside an empty one.
export const getCardinality = (value: Value, version?: TlcVersion): number => {
  if (typeof value !== "object") {
    const kind =
      typeof value === "number" ? "integer" : typeof value === "string" ? "string" : "boolean";
    throw new TlaEvaluationError(
      `Attempted to compute the number of elements in the ${kind} ${formatValue(value)}.`,
    );
  }
  switch (value.kind) {
    case "ModelValue":
      throw new TlaEvaluationError(
        `Attempted to compute the number of elements in the model value ${formatValue(value)}.`,
      );
    case "Function":
      return value.domain.length;
    case "LazyFunction":
      return getCardinality(value.domain, version);
    case "Interval": {
      const size = Math.max(0, value.high - value.low + 1);
      if (size > MAXIMUM_INTEGER) {
        throw new TlaEvaluationError(
          `Size of interval value exceeds the maximum representable size (32bits): ${value.low}..${value.high}.`,
        );
      }
      return size;
    }
    case "InfiniteSet":
    case "SequenceSet":
      throw new TlaEvaluationError(
        `Attempted to compute the number of elements in the overridden value ${formatValue(value)}.`,
      );
    case "Subset": {
      const size = getCardinality(value.base, version);
      if (size >= 31) throw new TlaEvaluationError(describeOverflow(value));
      return 2 ** size;
    }
    case "FunctionSet": {
      if (version !== "1.7.4") {
        if (isEmptySet(value.domain)) return 1;
        if (isEmptySet(value.range)) return 0;
        if (getCardinality(value.range, version) === 1) return 1;
      }
      const domainSize = getCardinality(value.domain, version);
      const rangeSize = getCardinality(value.range, version);
      if (rangeSize <= 1) return domainSize === 0 ? 1 : rangeSize;
      const size = { value: 1 };
      for (let index = 0; index < domainSize; index++) {
        size.value *= rangeSize;
        if (size.value > MAXIMUM_INTEGER) throw new TlaEvaluationError(describeOverflow(value));
      }
      return size.value;
    }
    case "RecordSet":
      if (version !== "1.7.4" && isEmptySet(value)) return 0;
      return getProductCardinality(value.sets, version, () => describeOverflow(value));
    case "ProductSet":
      if (version !== "1.7.4" && isEmptySet(value)) return 0;
      return getProductCardinality(
        value.factors,
        version,
        () => `Overflow when computing the number of elements in ${formatValue(value)}`,
      );
    default:
      return toFiniteSet(value).elements.length;
  }
};

const describeInfiniteCheck = (value: Value) =>
  `Attempted to check if the set ${formatValue(value)}is finite.`;

export const isFiniteSet = (value: Value): boolean => {
  if (typeof value !== "object" || value.kind === "ModelValue") {
    throw new TlaEvaluationError(
      `Attempted to check if the ${describeKind(value)} ${formatValue(value)} is a finite set.`,
    );
  }
  switch (value.kind) {
    case "Set":
    case "MixedSet":
    case "Interval":
    case "Function":
      return true;
    case "LazyFunction":
      throw new TlaEvaluationError(
        `Attempted to check if the function:\n${formatValue(value)}\nis a finite set.`,
      );
    case "InfiniteSet":
      return false;
    case "SequenceSet":
      return isFiniteSet(value.base) && isEmptySet(value.base);
    case "Subset":
      return isFiniteSet(value.base);
    case "FunctionSet": {
      const isFiniteDomain = isFiniteSet(value.domain);
      if (isFiniteDomain && isEmptySet(value.domain)) return true;
      const isFiniteRange = isFiniteSet(value.range);
      if (isFiniteRange && isEmptySet(value.range)) return true;
      return isFiniteRange && (isFiniteDomain || getCardinality(value.range) === 1);
    }
    case "RecordSet":
    case "ProductSet": {
      const parts = value.kind === "RecordSet" ? value.sets : value.factors;
      const finiteness = { isAllFinite: true };
      for (const part of parts) {
        if (!isFiniteSet(part)) finiteness.isAllFinite = false;
        else if (isEmptySet(part)) return true;
      }
      return finiteness.isAllFinite;
    }
    case "Union":
      if (!isTlcEnumerable(value.base)) {
        throw new TlaEvaluationError(
          `Attempted to check if the nonenumerable set:\n${formatUnion(value)}\nis a finite set.`,
        );
      }
      return toFiniteSet(value.base).elements.every(isFiniteSet);
    case "SetOperation":
      if (value.operator === "\\cup") return isFiniteSet(value.left) && isFiniteSet(value.right);
      if (value.operator === "\\cap") {
        if (!isFiniteSet(value.left) && !isFiniteSet(value.right)) {
          throw new TlaEvaluationError(describeInfiniteCheck(value));
        }
        return true;
      }
      if (isFiniteSet(value.left)) return true;
      if (!isFiniteSet(value.right)) throw new TlaEvaluationError(describeInfiniteCheck(value));
      return false;
    case "FilteredSet":
      if (!isFiniteSet(value.base)) {
        throw new TlaEvaluationError(
          `Attempted to check if expression of form {x \\in S : p(x)} is a finite set, but cannot check if S:\n${formatValue(value.base)}\nis finite.`,
        );
      }
      return true;
  }
};

const findIndex = (sortedValues: Value[], target: Value, compare = compareValues) => {
  const bounds = { low: 0, high: sortedValues.length - 1 };
  while (bounds.low <= bounds.high) {
    const middle = (bounds.low + bounds.high) >> 1;
    const comparison = compare(sortedValues[middle], target);
    if (comparison === 0) return middle;
    if (comparison < 0) bounds.low = middle + 1;
    else bounds.high = middle - 1;
  }
  return -1;
};

export const getSequenceElements = (value: Value): Value[] | undefined => {
  if (typeof value !== "object" || !isFunctionValue(value)) return undefined;
  const functionValue = toFiniteFunction(value);
  return functionValue.domain.every((key, index) => key === index + 1)
    ? functionValue.range
    : undefined;
};

const describeNonSetMembership = (element: Value, value: Value) => {
  const prefix = `Attempted to check if the value:\n${formatValue(element)}\nis an element of the`;
  if (!isFunctionValue(value)) return `${prefix} ${describeKind(value)} ${formatValue(value)}`;
  const functionClass = getFunctionClass(value);
  if (functionClass === "record") {
    return `Attempted to check if element:\n${formatValue(element)}\nis in the record:\n${formatValue(value)}`;
  }
  if (functionClass === "tuple") return "Attempted to check set membership in a tuple value.";
  return `${prefix} function ${formatValue(value)}`;
};

// The call stack of the replay, which a failed fast path leaves frozen.
interface TracedCallStack {
  expressions: unknown[];
  isFrozen: boolean;
  fingerprint?: unknown;
}

// The sets whose membership is being checked or whose elements are being enumerated, and the
// members being compared, outermost first, while TLC's CallStackTool replays a computation. A failed
// check or enumeration leaves the values it was in, each of which TLC adds to the
// FingerprintException when it has a source.
export const setTrace: { sets: Value[] | undefined; callStack?: TracedCallStack } = {
  sets: undefined,
};

// Takes a fast path, and computes as TLC does where it fails. TLC never takes the fast path, so
// the failure's leftovers in the replay's trace go first.
export const computeLikeTlcOnFailure = <Result>(
  compute: () => Result,
  computeLikeTlc: (error: TlaEvaluationError) => Result,
): Result => {
  const sets = setTrace.sets;
  const callStack = setTrace.callStack;
  const depth = sets?.length ?? 0;
  const trace = callStack && { ...callStack, length: callStack.expressions.length };
  try {
    return compute();
  } catch (error) {
    if (!(error instanceof TlaEvaluationError)) throw error;
    if (sets) sets.length = depth;
    if (callStack && trace) {
      callStack.expressions.length = trace.length;
      callStack.isFrozen = trace.isFrozen;
      callStack.fingerprint = trace.fingerprint;
    }
    return computeLikeTlc(error);
  }
};

export const isElementOf = (element: Value, set: Value): boolean => {
  const sets = setTrace.sets;
  if (sets === undefined) return isElementOfSet(element, set);
  sets.push(set);
  const isElement = isElementOfSet(element, set);
  sets.pop();
  return isElement;
};

const isElementOfSet = (element: Value, set: Value): boolean => {
  if (!isSetValue(set)) throw new TlaEvaluationError(describeNonSetMembership(element, set));
  switch (set.kind) {
    case "Set":
      return computeLikeTlcOnFailure(
        () => findIndex(set.elements, element) !== -1,
        () =>
          normalizedSets.has(set)
            ? searchLikeTlc(element, set.elements).isFound
            : isElementOfLikeTlc(element, set.elements),
      );
    case "MixedSet":
      return isElementOfLikeTlc(element, set.elements);
    case "Interval":
      if (typeof element === "number") return element >= set.low && element <= set.high;
      if (set.low <= set.high && !isModelValue(element)) {
        throw new TlaEvaluationError(
          `Attempted to check if the value:\n${formatValue(element)}\nis in the integer interval ${formatValue(set)}`,
        );
      }
      return false;
    case "InfiniteSet": {
      if (set.name === "Any") return true;
      if (isModelValue(element)) return false;
      const isMemberType =
        set.name === "STRING" ? typeof element === "string" : typeof element === "number";
      if (!isMemberType) {
        throw new TlaEvaluationError(
          `Attempted to check if the value:\n${formatValue(element)}\nis an element of ${set.name}.`,
        );
      }
      return set.name !== "Nat" || (typeof element === "number" && element >= 0);
    }
    case "Subset":
      // SubsetValue.member fails on any value that is not Enumerable, model values and the sets a
      // Java class overrides included.
      if (!isSetValue(element) || isOverriddenSet(element)) {
        throw new TlaEvaluationError(
          `Attempted to check if the non-enumerable value\n${prettyPrint(formatValue(element))}\nis element of\n${prettyPrint(formatValue(set))}`,
        );
      }
      return toFiniteSet(element).elements.every((item) => isElementOf(item, set.base));
    case "FunctionSet": {
      if (!isFunctionValue(element)) {
        if (isModelValue(element)) return false;
        // SetOfFcnsValue.member prints the element without Values.ppr.
        throw new TlaEvaluationError(
          `Attempted to check if \n${formatValue(element)}\nwhich is not a TLC function value, is in the set of functions:\n${prettyPrint(formatValue(set))}`,
        );
      }
      const functionValue = toFiniteFunction(element);
      const low = getIntervalLow(functionValue.domain);
      const isDomain =
        low === undefined
          ? isEqualLikeTlc(set.domain, createSortedSet(functionValue.domain))
          : isEqualLikeTlc(
              { kind: "Interval", low, high: low + functionValue.domain.length - 1 },
              set.domain,
            );
      return isDomain && functionValue.range.every((item) => isElementOf(item, set.range));
    }
    case "RecordSet": {
      const functionValue = isFunctionValue(element) ? toFiniteFunction(element) : undefined;
      if (!functionValue || !isRecordDomain(functionValue.domain)) {
        if (isModelValue(element)) return false;
        throw new TlaEvaluationError(
          `Attempted to check if non-record\n${formatValue(element)}\nis in the set of records:\n${formatValue(set)}`,
        );
      }
      return (
        functionValue.domain.length === set.names.length &&
        set.names.every((name, index) => {
          const position = findIndex(functionValue.domain, name);
          return position !== -1 && isElementOf(functionValue.range[position], set.sets[index]);
        })
      );
    }
    case "ProductSet": {
      const elements = isFunctionValue(element) ? getSequenceElements(element) : undefined;
      if (elements === undefined) {
        const isFunction =
          isFunctionValue(element) &&
          toFiniteFunction(element).domain.every((key) => typeof key === "number");
        if (isFunction || isModelValue(element)) return false;
        throw new TlaEvaluationError(
          `Attempted to check if non-tuple\n${formatValue(element)}\nis in the set of tuples:\n${formatValue(set)}`,
        );
      }
      return (
        elements.length === set.factors.length &&
        elements.every((item, index) => isElementOf(item, set.factors[index]))
      );
    }
    case "FilteredSet":
      return isElementOf(element, set.base) && set.test(element);
    case "Union":
      if (!isTlcEnumerable(set.base)) {
        throw new TlaEvaluationError(
          `Attempted to check if:\n ${formatValue(element)}\nis an element of the non-enumerable set:\n ${formatUnion(set)}`,
        );
      }
      return toFiniteSet(set.base).elements.some((inner) => isElementOf(element, inner));
    case "SetOperation":
      if (set.operator === "\\cup")
        return isElementOf(element, set.left) || isElementOf(element, set.right);
      return (
        isElementOf(element, set.left) &&
        isElementOf(element, set.right) === (set.operator === "\\cap")
      );
    case "SequenceSet": {
      const elements = getSequenceElements(element);
      if (elements === undefined) {
        if (isModelValue(element)) return false;
        // Sequences.member raises TLC_MODULE_CHECK_MEMBER_OF.
        throw new TlaEvaluationError(
          `Attempted to check if the value:\n${prettyPrint(formatValue(element))}\nis an element of ${prettyPrint(formatValue(set))}.`,
        );
      }
      return elements.every((item) => isElementOf(item, set.base));
    }
    default:
      throw new TlaEvaluationError(describeNonSetMembership(element, set));
  }
};

// A function that agrees with a member of a function set outside some entries is a member when
// those entries are.
export const isUpdatedElementOf = (element: Value, member: Value, set: Value): boolean => {
  if (element === member) return true;
  if (
    typeof element !== "object" ||
    typeof member !== "object" ||
    typeof set !== "object" ||
    element.kind !== "Function" ||
    member.kind !== "Function" ||
    set.kind !== "FunctionSet" ||
    element.domain !== member.domain
  )
    return isElementOf(element, set);
  return element.range.every((item, index) =>
    isUpdatedElementOf(item, member.range[index], set.range),
  );
};

export const toFiniteFunction = (value: Value): FunctionValue => {
  if (typeof value === "object" && value.kind === "Function") return value;
  if (typeof value === "object" && value.kind === "LazyFunction") {
    if (!isEnumerable(value.domain)) getCardinality(value.domain);
    const domain = getFunctionDomain(value.domain);
    return setFunctionClass(
      createSortedFunction(
        domain,
        domain.map((key) => value.apply(key)),
      ),
      getFunctionClass(value),
    );
  }
  throw new TlaEvaluationError(`Expected a function but found ${formatValue(value)}`);
};

export const describeMissingArgument = (
  functionValue: Value,
  argument: Value,
  version?: TlcVersion,
) => {
  const shown = prettyPrint(formatValue(functionValue));
  const shownArgument = prettyPrint(formatValue(argument));
  const is174 = version === "1.7.4";
  switch (getFunctionClass(functionValue)) {
    case "lambda":
      return `In applying the function\n${shown},\nthe first argument is:\n${shownArgument}\nwhich is not in its domain.\n`;
    case "tuple":
      if (typeof argument !== "number") {
        return is174
          ? "Attempted to apply tuple to a non-integer argument."
          : `Attempted to access tuple at a non integral index: ${shownArgument}`;
      }
      return is174
        ? `Attempted to apply tuple\n${shown}\nto integer ${argument} which is out of domain.`
        : `Attempted to access index ${argument} of tuple\n${shown}\nwhich is out of bounds.`;
    case "record":
      if (typeof argument !== "string") {
        return is174
          ? `Attempted to apply record to a non-string value ${shownArgument}.`
          : `Attempted to access record by a non-string argument: ${shownArgument}`;
      }
      return is174
        ? `Attempted to apply the record\n${shown}\nto nonexistent record field ${argument}.`
        : `Attempted to access nonexistent field '${argument}' of record\n${shown}`;
    default:
      return `Attempted to apply function:\n${shown}\nto argument ${shownArgument}, which is not in the domain of the function.`;
  }
};

// TLC 1.7.4 words a key of the wrong type in an EXCEPT, which selects rather than applies, apart.
const describeExceptKey = (functionValue: FunctionValue, argument: Value) => {
  if (!valueVersion.is174) return describeMissingArgument(functionValue, argument);
  const shown = prettyPrint(formatValue(argument));
  return getFunctionClass(functionValue) === "tuple"
    ? `Attempted to apply tuple to a non-integer argument ${shown}.`
    : `Attempted to apply record to a non-string argument ${shown}.`;
};

const findKeyIndex = (domain: Value[], argument: Value) => {
  const first = domain[0];
  if (typeof argument === "number" && typeof first === "number") {
    const offset = argument - first;
    if (domain[offset] === argument) return offset;
  }
  if (domain.length <= 8) {
    for (let index = 0; index < domain.length; index++)
      if (domain[index] === argument) return index;
  }
  return findIndex(domain, argument);
};

export const createNonIntegerKeyError = (argument: Value) =>
  new TlaEvaluationError(
    `Attempted to apply function with integer domain to the non-integer argument ${prettyPrint(formatValue(argument))}`,
  );

// TLC's FcnRcdValue searches a domain this small linearly with equals, and a larger normalized one by
// binary search with compareTo.
const LINEAR_SEARCH_LIMIT = 32;

// TLC looks a key up by the Java class of the function: a tuple or a record rejects a key of the
// wrong type, and another function rejects a non-integer for a domain it keeps as an interval, which
// TLC 1.7.4 doesn't. A key of another type than the domain's keys otherwise fails TLC's comparison.
const findKeyIndexLikeTlc = (
  functionValue: FunctionValue,
  argument: Value,
  describeWrongKey: (functionValue: FunctionValue, argument: Value) => string,
) => {
  const domain = functionValue.domain;
  if (typeof argument !== typeof domain[0]) {
    const functionClass = getFunctionClass(functionValue);
    const keyType =
      functionClass === "tuple" ? "number" : functionClass === "record" ? "string" : undefined;
    if (keyType !== undefined && typeof argument !== keyType) {
      throw new TlaEvaluationError(describeWrongKey(functionValue, argument));
    }
    if (keyType === undefined && !valueVersion.is174 && isIntervalDomain(domain)) {
      throw createNonIntegerKeyError(argument);
    }
  }
  return computeLikeTlcOnFailure(
    () => findKeyIndex(domain, argument),
    (error) => {
      if (valueVersion.is174 || domain.length < LINEAR_SEARCH_LIMIT) {
        domain.forEach((key) => equalsLikeTlc(key, argument));
      } else {
        findIndex(domain, argument, compareLikeTlc);
      }
      throw error;
    },
  );
};

export const applyFunction = (
  functionValue: Value,
  argument: Value,
  describeMissing?: (functionValue: FunctionValue, argument: Value) => string,
): Value => {
  if (typeof functionValue === "object" && functionValue.kind === "LazyFunction") {
    if (!isElementOf(argument, functionValue.domain)) {
      throw new TlaEvaluationError(
        getFunctionClass(functionValue) === "lambda"
          ? describeMissingArgument(functionValue, argument)
          : `Attempted to apply a function to ${formatValue(argument)}, which is not in its domain`,
      );
    }
    return functionValue.apply(argument);
  }
  if (typeof functionValue !== "object" || functionValue.kind !== "Function") {
    throw new TlaEvaluationError(
      `Attempted to apply ${formatValue(functionValue)}, which is not a function`,
    );
  }
  const describe = describeMissing ?? describeMissingArgument;
  const position = findKeyIndexLikeTlc(functionValue, argument, describe);
  if (position === -1) throw new TlaEvaluationError(describe(functionValue, argument));
  return functionValue.range[position];
};

export const getDomainInterval = (domain: Value[]) =>
  isIntervalDomain(domain)
    ? (intervalArrays.get(domain) ?? getIntervalValue(domain.length))
    : undefined;

export const getDomain = (functionValue: Value): Value => {
  if (typeof functionValue === "object" && functionValue.kind === "LazyFunction")
    return functionValue.domain;
  const domain = toFiniteFunction(functionValue).domain;
  return getDomainInterval(domain) ?? createSortedSet(domain);
};

export const updateFunction = (
  functionValue: Value,
  argument: Value,
  update: (previous: Value) => Value,
  isKeptLazy = false,
): Value => {
  const isLazy =
    typeof functionValue === "object" &&
    functionValue.kind === "LazyFunction" &&
    (isKeptLazy || !isEnumerable(functionValue.domain));
  if (isLazy) {
    if (!isElementOf(argument, functionValue.domain)) return functionValue;
    const updated = update(functionValue.apply(argument));
    return setFunctionClass<LazyFunctionValue>(
      {
        kind: "LazyFunction",
        domain: functionValue.domain,
        apply: (key) => (isEqualLikeTlc(argument, key) ? updated : functionValue.apply(key)),
        source: functionValue.source,
      },
      getFunctionClass(functionValue),
    );
  }
  if (!isFunctionValue(functionValue)) {
    throw new TlaEvaluationError(
      `Attempted to apply EXCEPT construct to the value ${prettyPrint(formatValue(functionValue))}.`,
    );
  }
  const finite = toFiniteFunction(functionValue);
  const position = findKeyIndexLikeTlc(finite, argument, describeExceptKey);
  if (position === -1) return finite;
  const range = [...finite.range];
  const previous = finite.range[position];
  const next = update(previous);
  range[position] = next;
  const updated = setFunctionClass(
    createSortedFunction(finite.domain, range),
    getFunctionClass(finite),
  );
  updated.writtenKeys = finite.writtenKeys;
  if (finite.hash !== 0 && finite.hash !== UNFINGERPRINTABLE_HASH) {
    const nextHash = getValueHash(next);
    if (nextHash !== UNFINGERPRINTABLE_HASH) {
      const keyHash = getValueHash(finite.domain[position]);
      updated.hash =
        previous === next
          ? finite.hash
          : (finite.hash -
              getEntryContribution(keyHash, getValueHash(previous)) +
              getEntryContribution(keyHash, nextHash)) |
            0;
    }
  }
  if (finite.fingerprint !== 0) {
    const key = finite.domain[position];
    updated.fingerprint =
      previous === next
        ? finite.fingerprint
        : (finite.fingerprint -
            getEntryFingerprint(key, previous) +
            getEntryFingerprint(key, next)) |
          0;
  }
  return updated;
};

const valueHashes = new WeakMap<ObjectValue, number>();

const HASH_SEED = 0x811c9dc5;

const finalizeHash = (hash: number) => {
  const first = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
  const second = Math.imul(first ^ (first >>> 13), 0xc2b2ae35);
  return second ^ (second >>> 16);
};

export const combineHash = (hash: number, value: number) => Math.imul(hash ^ value, 0x01000193);

const hashString = (value: string) => {
  let hash = HASH_SEED;
  for (let index = 0; index < value.length; index++)
    hash = Math.imul(hash ^ value.charCodeAt(index), 0x01000193);
  return finalizeHash(hash);
};

const SET_HASH_SEED = 0x73a5c3e1;
const FUNCTION_HASH_SEED = 0x66d1b4f7;

const getElementContribution = (elementHash: number) =>
  finalizeHash((elementHash + 0x9e3779b9) | 0);

const getEntryContribution = (keyHash: number, valueHash: number) =>
  finalizeHash((Math.imul(keyHash, 0x27d4eb2d) + valueHash) | 0);

// The hash of each value that TLC fails to fingerprint, such as Nat or a set that holds it. Calls
// with such a value as an argument still share their result, and a state that holds one fails
// when TLC fingerprints it.
const UNFINGERPRINTABLE_HASH = 0x2f6b1c4d;

const computeValueHash = (value: ObjectValue) => {
  if (value.kind === "ModelValue") return finalizeHash(combineHash(hashString(value.name), 0x6d));
  if (isSetValue(value)) {
    if (!isEnumerable(value)) return UNFINGERPRINTABLE_HASH;
    const elements = toFiniteSet(value).elements;
    let hash = SET_HASH_SEED;
    for (let index = 0; index < elements.length; index++) {
      const elementHash = getValueHash(elements[index]);
      if (elementHash === UNFINGERPRINTABLE_HASH) return UNFINGERPRINTABLE_HASH;
      hash = (hash + getElementContribution(elementHash)) | 0;
    }
    return hash;
  }
  if (value.kind === "LazyFunction" && !isEnumerable(value.domain)) return UNFINGERPRINTABLE_HASH;
  const functionValue = toFiniteFunction(value);
  let hash = FUNCTION_HASH_SEED;
  for (let index = 0; index < functionValue.domain.length; index++) {
    const keyHash = getValueHash(functionValue.domain[index]);
    const itemHash = getValueHash(functionValue.range[index]);
    if (keyHash === UNFINGERPRINTABLE_HASH || itemHash === UNFINGERPRINTABLE_HASH) {
      return UNFINGERPRINTABLE_HASH;
    }
    hash = (hash + getEntryContribution(keyHash, itemHash)) | 0;
  }
  return hash;
};

// TLC's fingerPrint enumerates each set and function a value holds, and fails on Nat, Seq(S) and
// the like, which it never enumerates.
const fingerprintValue = (value: Value): void => {
  if (typeof value !== "object" || value.kind === "ModelValue") return;
  if (value.kind === "InfiniteSet" || value.kind === "SequenceSet") {
    throw new TlaEvaluationError(
      `TLC has found a state in which the value of a variable contains ${formatValue(value)}`,
    );
  }
  if (isSetValue(value)) {
    toFiniteSet(value).elements.forEach(fingerprintValue);
    return;
  }
  const functionValue = toFiniteFunction(value);
  functionValue.domain.forEach(fingerprintValue);
  functionValue.range.forEach(fingerprintValue);
};

// The error TLC raises as it fingerprints a value: one that hashing the value raises, as for a set
// too large to enumerate, or one of a value with the hash of the values TLC fails on.
export const getFingerprintError = (value: Value) => {
  if (typeof value !== "object" || value.kind === "ModelValue") return undefined;
  try {
    if (getValueHash(value) === UNFINGERPRINTABLE_HASH) fingerprintValue(value);
    return undefined;
  } catch (error) {
    if (!(error instanceof TlaEvaluationError)) throw error;
    return error;
  }
};

// The values a value holds, which TLC fingerprints as it fingerprints the value.
export const getHeldValues = (value: ObjectValue): Value[] => {
  switch (value.kind) {
    case "Set":
    case "MixedSet":
      return value.elements;
    case "Function":
      return [...value.domain, ...value.range];
    case "Subset":
    case "SequenceSet":
    case "FilteredSet":
    case "Union":
      return [value.base];
    case "FunctionSet":
      return [value.domain, value.range];
    case "RecordSet":
      return value.sets;
    case "ProductSet":
      return value.factors;
    case "SetOperation":
      return [value.left, value.right];
    case "LazyFunction":
      return [value.domain];
    default:
      return [];
  }
};

export const getValueHash = (value: Value): number => {
  if (typeof value === "number") return finalizeHash(value ^ 0x5bd1e995);
  if (typeof value === "boolean") return value ? 0x2b7e1516 : 0x28aed2a6;
  if (typeof value === "string") return hashString(value);
  if (value.kind === "Set" || value.kind === "Function") {
    if (value.hash === 0) value.hash = computeValueHash(value);
    return value.hash;
  }
  const cached = valueHashes.get(value);
  if (cached !== undefined) return cached;
  const hash = computeValueHash(value);
  valueHashes.set(value, hash);
  return hash;
};

const valueFingerprints = new WeakMap<ObjectValue, number>();

const finalizeFingerprint = (hash: number) => {
  const first = Math.imul(hash ^ (hash >>> 15), 0x2c1b3c6d);
  const second = Math.imul(first ^ (first >>> 12), 0x297a2d39);
  return second ^ (second >>> 15);
};

const fingerprintString = (value: string) => {
  let hash = 0x9747b28c;
  for (let index = 0; index < value.length; index++)
    hash = Math.imul(hash ^ value.charCodeAt(index), 0x5bd1e995);
  return finalizeFingerprint(hash);
};

const getElementFingerprint = (element: Value) =>
  finalizeFingerprint((getValueFingerprint(element) + 0x7f4a7c15) | 0);

const getEntryFingerprint = (key: Value, value: Value) =>
  finalizeFingerprint(
    (Math.imul(getValueFingerprint(key), 0x165667b1) + getValueFingerprint(value)) | 0,
  );

const computeValueFingerprint = (value: ObjectValue) => {
  if (value.kind === "ModelValue") return finalizeFingerprint(fingerprintString(value.name) ^ 0x3c);
  if (isSetValue(value)) {
    if (!isEnumerable(value)) return fingerprintString(getValueKey(value));
    const elements = toFiniteSet(value).elements;
    let fingerprint = 0x1b873593;
    for (let index = 0; index < elements.length; index++) {
      fingerprint = (fingerprint + getElementFingerprint(elements[index])) | 0;
    }
    return fingerprint;
  }
  const functionValue = toFiniteFunction(value);
  let fingerprint = 0x4cf5ad43;
  for (let index = 0; index < functionValue.domain.length; index++) {
    fingerprint =
      (fingerprint + getEntryFingerprint(functionValue.domain[index], functionValue.range[index])) |
      0;
  }
  return fingerprint;
};

export const getValueFingerprint = (value: Value): number => {
  if (typeof value === "number") return finalizeFingerprint(value ^ 0x68e31da4);
  if (typeof value === "boolean") return value ? 0x3b9aca07 : 0x1f123bb5;
  if (typeof value === "string") return fingerprintString(value);
  if (value.kind === "Set" || value.kind === "Function") {
    if (value.fingerprint === 0) value.fingerprint = computeValueFingerprint(value);
    return value.fingerprint;
  }
  const cached = valueFingerprints.get(value);
  if (cached !== undefined) return cached;
  const fingerprint = computeValueFingerprint(value);
  valueFingerprints.set(value, fingerprint);
  return fingerprint;
};

const valueKeys = new WeakMap<ObjectValue, string>();

export const getValueKey = (value: Value): string => {
  if (typeof value === "boolean") return value ? "T" : "F";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return JSON.stringify(value);
  const cached = valueKeys.get(value);
  if (cached !== undefined) return cached;
  const key = computeValueKey(value);
  valueKeys.set(value, key);
  return key;
};

const computeValueKey = (value: ObjectValue) => {
  if (value.kind === "ModelValue") return `@${value.name}`;
  if (value.kind === "InfiniteSet") return `<${value.name}>`;
  if (value.kind === "SequenceSet") return `<Seq ${getValueKey(value.base)}>`;
  if (value.kind === "FilteredSet" && !isEnumerable(value)) {
    throw new TlaEvaluationError(
      `Attempted to compare the non-enumerable set ${formatValue(value)} with another value`,
    );
  }
  if (isSetValue(value)) {
    if (!isEnumerable(value)) return `<${value.kind} ${formatValue(value)}>`;
    return `{${toFiniteSet(value).elements.map(getValueKey).join(",")}}`;
  }
  const functionValue = toFiniteFunction(value);
  return `(${functionValue.domain.map((key, index) => `${getValueKey(key)}:${getValueKey(functionValue.range[index])}`).join(",")})`;
};

const formatString = (value: string) =>
  `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\t/g, "\\t")}"`;

type LazySetValue =
  | SubsetValue
  | FunctionSetValue
  | RecordSetValue
  | ProductSetValue
  | SetOperationValue
  | FilteredSetValue
  | UnionValue;

const MAXIMUM_EXPANDED_SUBSET_BASE = 6;
const MAXIMUM_EXPANDED_PRODUCT = 1999;

const getProductSize = (sets: Value[]) =>
  sets.reduce<number>((size, set) => (size === 0 ? 0 : size * getCardinality(set)), 1);

const expandLazySet = (value: LazySetValue) => {
  if (value.kind === "Subset") {
    return getCardinality(value.base) <= MAXIMUM_EXPANDED_SUBSET_BASE
      ? toFiniteSet(value)
      : undefined;
  }
  if (value.kind === "SetOperation" || value.kind === "FilteredSet" || value.kind === "Union") {
    return toFiniteSet(value);
  }
  if (
    value.kind === "FunctionSet" &&
    isEnumerable(value.domain) &&
    getCardinality(value.domain) === 0
  ) {
    return createSortedSet([createSortedFunction([], [])]);
  }
  const size =
    value.kind === "FunctionSet"
      ? getCardinality(value.range) ** getCardinality(value.domain)
      : getProductSize(value.kind === "RecordSet" ? value.sets : value.factors);
  if (size === 0) return EMPTY_SET;
  return size <= MAXIMUM_EXPANDED_PRODUCT ? toFiniteSet(value) : undefined;
};

const getExpandedLazySet = (value: LazySetValue, isStrict: boolean) => {
  if (isStrict) return expandLazySet(value);
  // TLC prints a set it can't enumerate symbolically, except in Print, PrintT, and ToString.
  if (!isEnumerable(value)) return undefined;
  try {
    return expandLazySet(value);
  } catch (error) {
    if (error instanceof TlaEvaluationError) return undefined;
    throw error;
  }
};

const formatLazySet = (value: LazySetValue, isStrict: boolean): string => {
  const format = (inner: Value) => formatValue(inner, isStrict);
  switch (value.kind) {
    case "Subset":
      return typeof value.base === "object" && value.base.kind === "Interval"
        ? `SUBSET (${format(value.base)})`
        : `SUBSET ${format(value.base)}`;
    case "FunctionSet":
      return `[${format(value.domain)} -> ${format(value.range)}]`;
    case "RecordSet":
      return `[${value.names.map((name, index) => `${name}: ${format(value.sets[index])}`).join(", ")}]`;
    case "ProductSet":
      return `(${value.factors.map(format).join(" \\X ")})`;
    case "SetOperation":
      return `${format(value.left)} ${value.operator} ${format(value.right)}`;
    case "FilteredSet":
      return value.source
        ? `{${value.source.names} \\in ${format(value.base)} : <expression ${value.source.predicate}> }`
        : `{x \\in ${format(value.base)} : ...}`;
    case "Union":
      return formatUnion(value, isStrict);
  }
};

// FcnRcdValue#isName: TLC prints a function as a record when every key consists of letters,
// decimal digits, and underscores, with at least one letter.
const isFieldName = (name: string) =>
  /^[\p{L}\p{Nd}_]*$/u.test(name) &&
  /\p{L}/u.test(name) &&
  (name.length < 4 || !/^[WS]F_/.test(name));

// FcnLambdaValue#toString prints a function it fails to enumerate as its parameters and body.
const toPrintedFunction = (value: LazyFunctionValue) => {
  if (!isEnumerable(value.domain)) return undefined;
  try {
    return toFiniteFunction(value);
  } catch (error) {
    if (error instanceof TlaEvaluationError) return undefined;
    throw error;
  }
};

export const formatValue = (value: Value, isStrict = false, isNormalized = false): string => {
  const format = (inner: Value) => formatValue(inner, isStrict, isNormalized);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return formatString(value);
  switch (value.kind) {
    case "ModelValue":
      return value.name;
    case "Set":
      return `{${value.elements.map(format).join(", ")}}`;
    case "MixedSet":
      return format(toFiniteSet(value));
    case "Interval":
      return value.low <= value.high ? `${value.low}..${value.high}` : "{}";
    case "InfiniteSet":
      return value.name === "Any" ? "ANY" : value.name;
    case "Subset":
    case "FunctionSet":
    case "RecordSet":
    case "ProductSet":
    case "SetOperation":
    case "FilteredSet":
    case "Union": {
      const expanded = getExpandedLazySet(value, isStrict);
      return expanded ? format(expanded) : formatLazySet(value, isStrict);
    }

    case "SequenceSet":
      return `Seq(${format(value.base)})`;
    case "Function":
    case "LazyFunction": {
      const functionValue = value.kind === "LazyFunction" ? toPrintedFunction(value) : value;
      if (functionValue === undefined) {
        const source = value.kind === "LazyFunction" ? value.source : undefined;
        if (!source) return "<function>";
        const parameters = source.parameters
          .map((parameter) => `${parameter.name} \\in ${formatValue(parameter.domain)}`)
          .join(", ");
        return `[${parameters} |-> <expression ${source.body}>]`;
      }
      if (
        functionValue.domain.length === 0 &&
        valueVersion.is174 &&
        getFunctionClass(value) !== "tuple"
      ) {
        return "<< >>";
      }
      if (functionValue.domain.every((key, index) => key === index + 1)) {
        return `<<${functionValue.range.map(format).join(", ")}>>`;
      }
      // A RecordValue prints as a record whatever its fields, and a FcnRcdValue only if each key
      // is a name.
      if (
        getFunctionClass(value) === "record" ||
        functionValue.domain.every((key) => typeof key === "string" && isFieldName(key))
      ) {
        const isSorted =
          isNormalized || functionValue.hash !== 0 || functionValue.fingerprint !== 0;
        const pairs = isSorted
          ? functionValue.domain.map((key, index) => [key, functionValue.range[index]])
          : getWrittenPairs(functionValue);
        return `[${pairs.map((pair) => `${String(pair[0])} |-> ${format(pair[1])}`).join(", ")}]`;
      }
      return `(${functionValue.domain.map((key, index) => `${format(key)} :> ${format(functionValue.range[index])}`).join(" @@ ")})`;
    }
  }
};

// TLC's TLCState.toString: a line per variable, as a conjunction when there are several.
export const formatState = (state: Record<string, Value>) => {
  const entries = Object.entries(state);
  return entries
    .map(
      ([name, value]) =>
        `${entries.length === 1 ? "" : "/\\ "}${name} = ${prettyPrint(formatValue(value))}\n`,
    )
    .join("");
};
