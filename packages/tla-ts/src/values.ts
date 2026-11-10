import { isStackOverflow, TlaEvaluationError, TlaModuleError, TlaSetBoundError } from "./errors";
import { prettyPrint } from "./pretty-print";
import { isEvalException } from "./tlc/messages";
import type { TlcVersion } from "./tlc/version";

export interface ModelValue {
  kind: "ModelValue";
  name: string;
  type: string | undefined;
  rank: number;
  hash: number;
  fingerprint: number;
}

interface LazySet {
  enumerated?: SetValue;
  isCached?: boolean;
  isFingerprinted?: boolean;
}

export interface SetValue {
  kind: "Set";
  elements: Value[];
  // A set enumeration's unsorted elements, duplicates included, until TLC normalizes it.
  writtenElements: Value[] | undefined;
  // Once normalized, TLC checks membership by binary search with compareTo, not with equals.
  isNormalized: boolean;
  hash: number;
  fingerprint: number;
  isFingerprinted: boolean;
}

// TLC sorts a set enumeration only when it has to, so it checks membership element by element.
export interface MixedSetValue extends LazySet {
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
  // The set a lambda ranges over, which TLC's DOMAIN returns until it builds the function.
  lambdaDomain: Value | undefined;
  isFingerprinted: boolean;
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

export interface SubsetValue extends LazySet {
  kind: "Subset";
  base: Value;
}

export interface FunctionSetValue extends LazySet {
  kind: "FunctionSet";
  domain: Value;
  range: Value;
}

export interface RecordSetValue extends LazySet {
  kind: "RecordSet";
  names: string[];
  sets: Value[];
}

export interface ProductSetValue extends LazySet {
  kind: "ProductSet";
  factors: Value[];
}

export interface SequenceSetValue extends LazySet {
  kind: "SequenceSet";
  base: Value;
}

export interface SetOperationValue extends LazySet {
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

export interface FilteredSetValue extends LazySet {
  kind: "FilteredSet";
  base: Value;
  test: (element: Value, isMember: boolean) => boolean;
  source?: FilteredSetSource;
}

// UNION S when some element of S isn't a set enumeration. TLC enumerates it only when it has to.
export interface UnionValue extends LazySet {
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

// enumerated is the FcnRcdValue TLC converts the function to once it compares or fingerprints it.
export interface LazyFunctionValue {
  kind: "LazyFunction";
  domain: Value;
  apply: (argument: Value) => Value;
  // The length of each bound's tuple pattern, or undefined for a name.
  boundTupleLengths?: (number | undefined)[];
  source?: LazyFunctionSource;
  functionClass?: FunctionClass;
  enumerated?: FunctionValue;
  isFingerprinted?: boolean;
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

type ConvertibleSetValue =
  | MixedSetValue
  | SubsetValue
  | FunctionSetValue
  | RecordSetValue
  | ProductSetValue
  | SequenceSetValue
  | SetOperationValue
  | FilteredSetValue
  | UnionValue;

const isLazySet = (value: ObjectValue): value is ConvertibleSetValue =>
  value.kind !== "ModelValue" &&
  value.kind !== "Set" &&
  value.kind !== "Function" &&
  value.kind !== "Interval" &&
  value.kind !== "InfiniteSet" &&
  value.kind !== "LazyFunction";

export const MAXIMUM_INTEGER = 2147483647;

const DEFAULT_SET_BOUND = 1000000;
const VALUE_VEC_CAPACITY = 10;

// TLCGlobals.setBound, which TLC's -maxSetSize sets.
const setBound = { size: DEFAULT_SET_BOUND };

export const getSetBound = () => setBound.size;

// A ValueVec that TLC grows one element at a time starts with room for 10, and fails to grow once
// its room reaches the bound.
export const getMaximumSetSize = () => Math.max(setBound.size, VALUE_VEC_CAPACITY);

export const getSetBoundMessage = () =>
  `Attempted to construct a set with too many elements (>${setBound.size}).`;

export const addBoundedElement = (elements: Value[], element: Value) => {
  if (elements.length === getMaximumSetSize()) throw new TlaSetBoundError(getSetBoundMessage());
  elements.push(element);
};

export const isBeyondSetBound = (value: Value) =>
  typeof value === "object" &&
  value.kind === "Interval" &&
  value.high - value.low >= getMaximumSetSize();

// TLC steps through an interval without building its elements.
export const forEachElement = (
  elements: IntervalValue | Value[],
  visit: (element: Value) => void,
) => {
  if (Array.isArray(elements)) return elements.forEach(visit);
  for (let element = elements.low; element <= elements.high; element++) visit(element);
};
export const MINIMUM_INTEGER = -2147483648;
const MAXIMUM_ENUMERATED_SUBSET_BASE = 30;
const MAXIMUM_BUILT_SUBSET_BASE = 20;

export const isSetValue = (value: Value) =>
  typeof value === "object" &&
  value.kind !== "ModelValue" &&
  value.kind !== "Function" &&
  value.kind !== "LazyFunction";

export const isReducibleSet = (value: Value): value is SetValue | MixedSetValue | IntervalValue =>
  typeof value === "object" &&
  (value.kind === "Set" || value.kind === "MixedSet" || value.kind === "Interval");

export const isFunctionValue = (value: Value): value is FunctionValue | LazyFunctionValue =>
  typeof value === "object" && (value.kind === "Function" || value.kind === "LazyFunction");

export const isModelValue = (value: Value): value is ModelValue =>
  typeof value === "object" && value.kind === "ModelValue";

export const isEnumeratedSet = (value: Value): value is SetValue | MixedSetValue =>
  typeof value === "object" && (value.kind === "Set" || value.kind === "MixedSet");

export const describeKind = (value: Value) => {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "integer";
  if (typeof value === "string") return "string";
  if (value.kind === "ModelValue") return "model value";
  return isSetValue(value) ? "set" : "function";
};

export const isTlcInteger = (value: number) =>
  Number.isInteger(value) && value <= MAXIMUM_INTEGER && value >= MINIMUM_INTEGER;

// TLC keeps a record, or a function @@ builds, in written order until it sorts it to compare or
// fingerprint it. It searches the function in that order, and ToString, Assert, and error
// messages show it, unless every key is an integer.
const writtenOrderUse = { isUsed: false };

const setWrittenOrder = (functionValue: FunctionValue, keys: Value[]) => {
  writtenOrderUse.isUsed = true;
  functionValue.writtenKeys = keys;
  return functionValue;
};

const getWrittenKeys = (functionValue: FunctionValue) =>
  (functionValue.hash !== 0 || functionValue.fingerprint !== 0
    ? undefined
    : functionValue.writtenKeys) ?? functionValue.domain;

export const getWrittenPairs = (functionValue: FunctionValue): [Value, Value][] =>
  getWrittenKeys(functionValue).map((key) => [
    key,
    functionValue.range[functionValue.domain.indexOf(key)],
  ]);

// TLC sorts a function whose keys are all integers to check whether it is a tuple.
export const getPrintedPairs = (functionValue: FunctionValue): [Value, Value][] =>
  functionValue.domain.every((key) => typeof key === "number")
    ? functionValue.domain.map((key, index) => [key, functionValue.range[index]])
    : getWrittenPairs(functionValue);

export const createWrittenRecord = (names: Value[], range: Value[], writtenNames: Value[]) =>
  setWrittenOrder(createSortedRecord(names, range), writtenNames);

// TLC sorts a value it compares, even with itself, so a hashed or fingerprinted value is sorted.
const forgetWrittenOrder = (value: Value): void => {
  if (typeof value !== "object" || (value.kind !== "Function" && value.kind !== "Set")) return;
  if (value.hash !== 0 || value.fingerprint !== 0) return;
  if (value.kind === "Set") return value.elements.forEach(forgetWrittenOrder);
  value.writtenKeys = undefined;
  value.range.forEach(forgetWrittenOrder);
};

const isRecordDomain = (domain: Value[]) => domain.every((key) => typeof key === "string");

// TLC compares a record only with a record, so this can fail before the sizes decide.
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
    const leftValue = leftRange[index];
    const rightValue = rightRange[index];
    // V8 can't inline the recursive compareValues here, so two numbers skip the call.
    const valueComparison =
      typeof leftValue === "number" && typeof rightValue === "number"
        ? leftValue - rightValue
        : compareValues(leftValue, rightValue);
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

// TLC orders strings and model values by first interning, so each check sets its order first.
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

// TLC 1.7.4 prints and looks keys up in functions differently, so each check sets the version.
const valueVersion = { is174: false };

// TLCGlobals.expand, which TLC's -terse clears, and TLCGlobals.useView, which -view sets.
const printing = { isExpanded: true, isViewPrinted: false };

export interface ValueOptions {
  version?: TlcVersion;
  maxSetSize?: number;
  isLazyValueExpanded?: boolean;
  isViewPrinted?: boolean;
}

export const setValueOptions = (options: ValueOptions) => {
  valueVersion.is174 = options.version === "1.7.4";
  setBound.size = options.maxSetSize ?? DEFAULT_SET_BOUND;
  printing.isExpanded = options.isLazyValueExpanded ?? true;
  printing.isViewPrinted = options.isViewPrinted ?? false;
};

// TLC evaluates the VIEW of a state it prints as it prints it.
const viewTexts = new WeakMap<Record<string, Value>, () => string>();

export const setViewText = (state: Record<string, Value>, getText: () => string) => {
  if (printing.isViewPrinted) viewTexts.set(state, getText);
  return state;
};

export const rankString = (text: string) => {
  if (stringOrder.ranks[text] === undefined) stringOrder.ranks[text] = stringOrder.size++;
  return text;
};

export const getRankedStringCount = () => stringOrder.size;

export const getRankedString = (rank: number) =>
  Object.keys(stringOrder.ranks).find((text) => stringOrder.ranks[text] === rank);

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

const createComparisonError = (left: Value, right: Value) =>
  new TlaEvaluationError(
    isOverriddenSet(left)
      ? `Attempted to compare overridden value ${formatValue(left, true)} with non-overridden value:\n${formatValue(right)}`
      : `Attempted to compare ${describeKind(left)} ${formatValue(left)} with ${describeKind(right)} ${formatValue(right)}`,
  );

// TLC's Nat, Int, STRING, Seq(S), and Any compare only with each other and with model values,
// and fail with any other set, worded by the class of the left operand.
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
  if (!isOverriddenSet(right)) throw createComparisonError(left, right);
  const leftName = left.kind === "InfiniteSet" ? left.name : undefined;
  const rightName = right.kind === "InfiniteSet" ? right.name : undefined;
  if (leftName !== undefined && leftName === rightName) return 0;
  if ((leftName === "Nat" && rightName === "Int") || (leftName === "Int" && rightName === "Nat")) {
    return leftName === "Nat" ? -1 : 1;
  }
  throw new TlaModuleError(
    `Attempted to compare ${formatValue(left, true)} with the value\n${formatValue(right, true)}`,
  );
};

export const ANY_SET: InfiniteSetValue = { kind: "InfiniteSet", name: "Any" };

const compareAny = (other: Value): never => {
  throw new TlaModuleError(`Attempted to compare ANY with the value\n${formatValue(other)}`);
};

// TLC enumerates a lambda to compare it, even with itself.
const compareWithItself = (value: Value) => {
  if (writtenOrderUse.isUsed) forgetWrittenOrder(value);
  if (value === ANY_SET) compareAny(value);
  if (typeof value === "object" && value.kind === "LazyFunction") toFiniteFunction(value);
};

export const compareValues = (left: Value, right: Value): number => {
  if (left === right) {
    compareWithItself(left);
    return 0;
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
      throw createComparisonError(left, right);
    }
    // The sizes decide first, so an interval of another size never needs its elements.
    if (leftKind === "Interval" && rightKind === "Set") {
      const difference = getCardinality(left) - right.elements.length;
      if (difference !== 0) return difference;
    }
    if (leftKind === "Set" && rightKind === "Interval") {
      const difference = left.elements.length - getCardinality(right);
      if (difference !== 0) return difference;
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
  throw createComparisonError(left, right);
};

const modelValues = new Map<string, ModelValue>();

// setStringOrder clears the model values, so each check ranks and creates its own.
export const createModelValue = (name: string): ModelValue => {
  const known = modelValues.get(name);
  if (known) return known;
  const value: ModelValue = {
    kind: "ModelValue",
    name,
    type: name.length > 2 && name[1] === "_" ? name[0] : undefined,
    rank: getStringRank(name),
    hash: finalizeHash(combineHash(hashString(name), 0x6d)),
    fingerprint: finalizeFingerprint(fingerprintString(name) ^ 0x3c),
  };
  modelValues.set(name, value);
  return value;
};

export const createSortedSet = (elements: Value[]): SetValue => ({
  kind: "Set",
  elements,
  writtenElements: undefined,
  isNormalized: false,
  hash: 0,
  fingerprint: 0,
  isFingerprinted: false,
});

export const createNormalizedSet = (elements: Value[]): SetValue => {
  const set = createSortedSet(elements);
  set.isNormalized = true;
  return set;
};

export const createSortedFunction = (domain: Value[], range: Value[]): FunctionValue => ({
  kind: "Function",
  domain,
  range,
  hash: 0,
  fingerprint: 0,
  writtenKeys: undefined,
  functionClass: undefined,
  lambdaDomain: undefined,
  isFingerprinted: false,
});

// TLC words a failed application by the function's Java class: FcnLambdaValue, TupleValue,
// RecordValue, or FcnRcdValue.
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

// TLC caches a lazy set as the receiver of compareTo, equals, size, and fingerPrint, not as
// their argument, and enumerates the sets an uncached one combines, duplicates and all.
const isCachedSet = (value: ObjectValue) => isLazySet(value) && value.isCached === true;

// Lets a spec without a UNION or \cup set, which stream duplicates, skip tracking TLC's caches.
const streamedSetPresence = { isPresent: false };

export const markStreamedSet = <Streamed extends UnionValue | SetOperationValue>(
  value: Streamed,
) => {
  streamedSetPresence.isPresent = true;
  return value;
};

const STREAMING_KINDS = new Set<ObjectValue["kind"]>([
  "Union",
  "SetOperation",
  "FilteredSet",
  "ProductSet",
  "RecordSet",
  "FunctionSet",
]);

const cacheSet = (value: Value) => {
  if (
    streamedSetPresence.isPresent &&
    typeof value === "object" &&
    isLazySet(value) &&
    STREAMING_KINDS.has(value.kind)
  ) {
    value.isCached = true;
  }
};

// Fingerprinting caches the FcnRcdValue a lambda enumerates to, so it is no longer a lambda.
export const markFingerprinted = (value: Value): void => {
  if ((!lambdaPresence.isPresent && !streamedSetPresence.isPresent) || typeof value !== "object") {
    return;
  }
  if (value.kind === "ModelValue" || value.kind === "Interval" || value.kind === "InfiniteSet") {
    return;
  }
  if (value.isFingerprinted) return;
  value.isFingerprinted = true;
  if (value.kind === "Function") {
    if (value.functionClass === "lambda") value.functionClass = undefined;
    value.domain.forEach(markFingerprinted);
    value.range.forEach(markFingerprinted);
  } else if (value.kind === "Set" || value.kind === "MixedSet") {
    value.elements.forEach(markFingerprinted);
  } else if (isSetValue(value) && isEnumerable(value)) {
    cacheSet(value);
    toFiniteSet(value).elements.forEach(markFingerprinted);
  }
};

export const valuesEqual = (left: Value, right: Value): boolean => {
  cacheSet(left);
  if (left === right) {
    compareWithItself(left);
    return true;
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
    // TLC enumerates a lambda, which can fail, before it compares it.
    if (left.kind === "LazyFunction") toFiniteFunction(left);
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

// TLC words errors by each function's Java class, so a stand-in must match each function's class.
const createSameValueCheck = (isClassSensitive: boolean) => {
  const areSameValues = (left: Value[], right: Value[]) => {
    if (left === right) return true;
    if (left.length !== right.length) return false;
    for (let index = 0; index < left.length; index++) {
      if (!isSame(left[index], right[index])) return false;
    }
    return true;
  };
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

const isInterchangeableValue = createSameValueCheck(true);

const canonicalizeElements = (elements: Value[], canonicalize: (value: Value) => Value) => {
  for (let index = 0; index < elements.length; index++) {
    elements[index] = canonicalize(elements[index]);
  }
};

// So that the states it keeps share their values.
export const createCanonicalizer = () => {
  const canonicalValues = new Map<number, Value | Value[]>();
  const canonicalize = (value: Value): Value => {
    if (typeof value !== "object" || (value.kind !== "Set" && value.kind !== "Function")) {
      return value;
    }
    const hash = getValueHash(value);
    const bucket = canonicalValues.get(hash);
    if (bucket !== undefined && !Array.isArray(bucket)) {
      if (bucket === value || isInterchangeableValue(bucket, value)) return bucket;
    }
    if (Array.isArray(bucket)) {
      for (let index = 0; index < bucket.length; index++) {
        if (bucket[index] === value || isInterchangeableValue(bucket[index], value))
          return bucket[index];
      }
    }
    if (value.kind === "Set") canonicalizeElements(value.elements, canonicalize);
    else {
      canonicalizeElements(value.domain, canonicalize);
      canonicalizeElements(value.range, canonicalize);
    }
    if (bucket === undefined) canonicalValues.set(hash, value);
    else if (Array.isArray(bucket)) bucket.push(value);
    else canonicalValues.set(hash, [bucket, value]);
    return value;
  };
  return (state: Value[]) => {
    for (let index = 0; index < state.length; index++) state[index] = canonicalize(state[index]);
    return state;
  };
};

// These follow TLC's compareTo and equals, which word a failure by the left operand's class,
// so a failed comparison above runs again through them to fail as TLC does.
interface TlcFunction {
  domain: Value[];
  range: Value[];
  low: number | undefined;
}

// TLC compares a domain it keeps as an interval apart from one it keeps as an array.
const getIntervalLow = (value: Value, domain: Value[]) =>
  domain.length === 0 || getFunctionClass(value) === "tuple" ? 1 : getDomainInterval(domain)?.low;

const toTlcFunction = (value: Value) => {
  if (!isFunctionValue(value)) return undefined;
  const functionValue = toFiniteFunction(value);
  return {
    domain: functionValue.domain,
    range: functionValue.range,
    low: getIntervalLow(value, functionValue.domain),
  };
};

const toTlcRecord = (value: Value) => {
  if (!isFunctionValue(value)) return undefined;
  const functionValue = toFiniteFunction(value);
  return functionValue.domain.every((key) => typeof key === "string") ? functionValue : undefined;
};

// A model value compared with a value of another kind. The other value is never a model value.
const compareModelValueWith = (modelValue: ModelValue, other: Value) => {
  checkModelValueTypes(other, modelValue, false);
  return 1;
};

const equalsModelValueWith = (modelValue: ModelValue, other: Value) => {
  checkModelValueTypes(other, modelValue, true);
  return false;
};

const compareModelValue = (left: ModelValue, right: Value) => {
  if (left.type !== undefined) checkModelValueTypes(left, right, false);
  return isModelValue(right) ? left.rank - right.rank : -1;
};

const equalsModelValue = (left: ModelValue, right: Value) => {
  if (left.type !== undefined) checkModelValueTypes(left, right, true);
  return isModelValue(right) && left.name === right.name;
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
  if (getFunctionClass(left) === "tuple") {
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
    { ...functionValue, low: getIntervalLow(left, functionValue.domain) },
    left,
    right,
  );
};

// TLC compares a lazy or Java-overridden set through its own class before it compares elements.
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
  if (getFunctionClass(left) === "tuple") {
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
    { ...functionValue, low: getIntervalLow(left, functionValue.domain) },
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

const callTracedMethod = <Result>(receiver: Value, method: () => Result) => {
  const sets = setTrace.sets;
  if (sets === undefined) return method();
  sets.push(receiver);
  const result = method();
  sets.pop();
  return result;
};

// A binary search with compareTo, which ends where the element is or would go.
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

const isElementOfLikeTlc = (element: Value, elements: Value[]) =>
  elements.some((member) => callTracedMethod(member, () => equalsLikeTlc(member, element)));

export const getWrittenElements = (set: SetValue | MixedSetValue) =>
  set.kind === "MixedSet" || set.isNormalized
    ? set.elements
    : (set.writtenElements ?? set.elements);

export const markNormalized = (value: Value): void => {
  if (typeof value !== "object") return;
  if (value.kind === "Set") {
    value.isNormalized = true;
    value.elements.forEach(markNormalized);
  }
  if (value.kind === "Function") {
    value.domain.forEach(markNormalized);
    value.range.forEach(markNormalized);
  }
};

// TLC's Value.normalize sorts a set enumeration, and the sets a lazy set it hasn't cached combines.
export const normalizeShallowly = (value: Value): void => {
  if (typeof value !== "object" || isCachedSet(value)) return;
  switch (value.kind) {
    case "Set":
      value.isNormalized = true;
      return;
    case "MixedSet":
      toFiniteSet(value);
      return;
    case "FilteredSet":
    case "Subset":
      return normalizeShallowly(value.base);
    case "SetOperation":
      if (value.operator === "\\cup") return;
      normalizeShallowly(value.left);
      return normalizeShallowly(value.right);
    case "FunctionSet":
      normalizeShallowly(value.domain);
      return normalizeShallowly(value.range);
    case "RecordSet":
      return value.sets.forEach(normalizeShallowly);
    case "ProductSet":
      return value.factors.forEach(normalizeShallowly);
  }
};

export const isEqualLikeTlc = (left: Value, right: Value) =>
  computeLikeTlcOnFailure(valuesEqual, equalsLikeTlc, left, right);

const isStrictlySorted = (elements: Value[]) => {
  for (let index = 1; index < elements.length; index++) {
    if (compareValues(elements[index - 1], elements[index]) >= 0) return false;
  }
  return true;
};

export const createSet = (elements: Value[]): SetValue => {
  // TLC's sort compares each element after the first with those before it.
  for (let index = 1; index < elements.length; index++) cacheSet(elements[index]);
  if (elements.length < 2 || isStrictlySorted(elements)) return createSortedSet(elements);
  const sorted = [...elements].sort(compareValues);
  const unique = [sorted[0]];
  for (let index = 1; index < sorted.length; index++) {
    if (compareValues(unique[unique.length - 1], sorted[index]) !== 0) unique.push(sorted[index]);
  }
  return createSortedSet(unique);
};

// TLC builds a set enumeration unsorted, so one whose elements it can't compare still evaluates.
export const createEnumeratedSet = (elements: Value[]): SetValue | MixedSetValue => {
  const set = computeLikeTlcOnFailure<Value[], undefined, SetValue | MixedSetValue>(
    createSet,
    (mixed) => ({ kind: "MixedSet", elements: mixed }),
    elements,
    undefined,
  );
  if (set.kind === "Set" && set.elements !== elements) set.writtenElements = elements;
  return set;
};

export const EMPTY_SET = createSortedSet([]);

export const getSortedDifference = (left: SetValue, right: SetValue): SetValue => {
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

export const getSortedIntersection = (left: SetValue, right: SetValue): SetValue => {
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

export const getSortedUnion = (left: SetValue, right: SetValue): SetValue => {
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

// Every function over 1..n shares one domain array per length, so the array's identity records
// the interval. Callers must not mutate the returned array.
const getIntervalDomain = (length: number): Value[] => {
  const cached = intervalDomains[length];
  if (cached) return cached;
  const domain = Array.from({ length }, (_, index) => index + 1);
  intervalDomains[length] = domain;
  return domain;
};

// The caller only iterates the elements, so they need not record the interval for DOMAIN.
export const getIntervalElements = (value: IntervalValue): Value[] => {
  getCardinality(value);
  if (value.low === 1 && value.high >= 1) return getIntervalDomain(value.high);
  const elements: number[] = [];
  for (let element = value.low; element <= value.high; element++) elements.push(element);
  return elements;
};

const isIntervalDomain = (domain: Value[]) =>
  (domain.length > 0 && domain === intervalDomains[domain.length]) || intervalArrays.has(domain);

// A set such as (1..2) \cap S, whose elements are the shared array, gets a copy.
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

export const createSortedRecord = (names: Value[], range: Value[]) =>
  setFunctionClass(createSortedFunction(names, range), "record");

export const isTlcEnumerable = (value: Value) => isSetValue(value) && !isOverriddenSet(value);

const formatUnion = (value: UnionValue, isStrict = false) =>
  `UNION(${formatValue(value.base, isStrict)})`;

const getUnionSets = (
  value: UnionValue,
  getElements = (set: Value) => toFiniteSet(set).elements,
) => {
  if (!isTlcEnumerable(value.base)) {
    throw new TlaEvaluationError(
      `Attempted to enumerate the nonenumerable set:\n${formatUnion(value)}`,
    );
  }
  return getElements(value.base);
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
      return (
        isEnumerable(value.base) &&
        (isEnumeratedSet(value.base)
          ? getWrittenElements(value.base)
          : getStreamedElements(value.base)
        ).every(isEnumerable)
      );
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

// TLC enumerates SUBSET S lazily, by size and then in the order of S, so a quantifier that
// finds its witness early never builds the rest.
export const getLazySubsets = (value: Value): Value[] | undefined => {
  if (typeof value !== "object" || value.kind !== "Subset" || isOverriddenSet(value.base)) {
    return undefined;
  }
  const base = toFiniteSet(value.base).elements;
  if (base.length <= MAXIMUM_BUILT_SUBSET_BASE) return undefined;
  const cursor = { index: -1, indices: [0] };
  const getSubset = (index: number) => {
    if (index <= cursor.index) cursor.index = -1;
    while (cursor.index < index) {
      if (cursor.index === -1) cursor.indices = [];
      else if (!advanceCombination(cursor.indices, base.length)) {
        cursor.indices = Array.from({ length: cursor.indices.length + 1 }, (_, item) => item);
      }
      cursor.index++;
    }
    return createSortedSet(cursor.indices.map((item) => base[item]));
  };
  const length = 2 ** base.length;
  const isIndex = (property: string | symbol) =>
    typeof property === "string" && /^\d+$/.test(property) && Number(property) < length;
  return new Proxy<Value[]>([], {
    get: (target, property, receiver) => {
      if (property === "length") return length;
      return isIndex(property)
        ? getSubset(Number(property))
        : Reflect.get(target, property, receiver);
    },
    has: (target, property) => isIndex(property) || Reflect.has(target, property),
  });
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

// TLC enumerates the sets in turn and stops at the first empty one. Later versions decide
// that the set is empty before they enumerate it.
const getComponentElements = (
  sets: Value[],
  getElements: (set: Value) => Value[],
  describeUnenumerable: (set: Value, index: number) => string,
) => {
  const lists: Value[][] = [];
  for (let index = 0; index < sets.length; index++) {
    const set = sets[index];
    if (isOverriddenSet(set)) throw new TlaEvaluationError(describeUnenumerable(set, index));
    const elements = getElements(set);
    if (elements.length === 0) return [[]];
    lists.push(elements);
  }
  return lists;
};

const enumerateSet = (
  value: Value,
  getElements = (set: Value) => toFiniteSet(set).elements,
): Value[] => {
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
      // TLC sizes the set before it enumerates it, and enumerates a set of size 0 as {{}}.
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
      if (!valueVersion.is174 && isEmptySet(value)) return [];
      if (isOverriddenSet(value.domain)) {
        throw new TlaEvaluationError(
          `Attempted to enumerate a set of the form [D -> R],but the domain D:\n${formatValue(value.domain)}\ncannot be enumerated.`,
        );
      }
      const domain = getFunctionDomain(value.domain);
      // TLC 1.7.4 requires an enumerable range even of an empty domain.
      if ((domain.length > 0 || valueVersion.is174) && isOverriddenSet(value.range)) {
        throw new TlaEvaluationError(
          `Attempted to enumerate a set of the form [D -> R],but the range R:\n${formatValue(value.range)}\ncannot be enumerated.`,
        );
      }
      const range = domain.length === 0 ? [] : getElements(value.range);
      return getCartesianProduct(domain.map(() => range)).map((combination): Value =>
        createSortedFunction(domain, combination),
      );
    }
    case "RecordSet": {
      if (!valueVersion.is174 && isEmptySet(value)) return [];
      const fields = getComponentElements(
        value.sets,
        getElements,
        (set, index) =>
          `Attempted to enumerate a set of the form [l1 : v1, ..., ln : vn],\nbut can't enumerate the value of the \`${value.names[index]}' field:\n${formatValue(set)}`,
      );
      return getCartesianProduct(fields).map((combination) =>
        createRecord(value.names.map((name, index): [string, Value] => [name, combination[index]])),
      );
    }
    case "ProductSet": {
      if (!valueVersion.is174 && isEmptySet(value)) return [];
      const factors = getComponentElements(
        value.factors,
        getElements,
        (factor, index) =>
          `Attempted to enumerate a set of the form s1 \\X s2 ... \\X sn,\nbut can't enumerate s${index}:\n${formatValue(factor)}`,
      );
      return getCartesianProduct(factors).map(createTuple);
    }
    case "FilteredSet":
      if (!isSetValue(value.base) || isOverriddenSet(value.base)) {
        throw new TlaEvaluationError(
          `Attempted to enumerate { x \\in S : p(x) } when S:\n${formatValue(value.base)}\nis not enumerable`,
        );
      }
      return toFiniteSet(
        createEnumeratedSet(
          getStreamedElements(value.base).filter((element) => value.test(element, false)),
        ),
      ).elements;
    case "Union": {
      const elements: Value[] = [];
      getUnionSets(value).forEach((set, index) => {
        const unionSet = getUnionSet(set, index, value);
        if (isBeyondSetBound(unionSet)) throw new TlaSetBoundError(getSetBoundMessage());
        getStreamedElements(unionSet).forEach((element) => addBoundedElement(elements, element));
      });
      return toFiniteSet(createEnumeratedSet(elements)).elements;
    }
    case "SetOperation": {
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
      if (value.operator === "\\cup") {
        return toFiniteSet(createEnumeratedSet(listUnionLikeTlc(value))).elements;
      }
      const isLeftEnumerated = value.operator === "\\" || isTlcEnumerable(value.left);
      const enumerated = isLeftEnumerated ? value.left : value.right;
      const other = isLeftEnumerated ? value.right : value.left;
      const kept: Value[] = [];
      forEachElement(
        typeof enumerated === "object" && enumerated.kind === "Interval"
          ? enumerated
          : getStreamedElements(enumerated),
        (element) => {
          if (isElementOf(element, other) === (value.operator === "\\cap")) {
            addBoundedElement(kept, element);
          }
        },
      );
      return toFiniteSet(createEnumeratedSet(kept)).elements;
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

export const toFiniteSet = (value: Value): SetValue => {
  if (typeof value === "object" && value.kind === "Set") return value;
  if (typeof value === "object" && value.kind === "Interval") {
    return createSortedSet(enumerateSet(value));
  }
  const lazy = typeof value === "object" && isLazySet(value) ? value : undefined;
  if (lazy?.enumerated) return lazy.enumerated;
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
  if (lazy) lazy.enumerated = set;
  return set;
};

// TLC's enumerator of a set sorts the set enumerations it streams, and fails on a set it can't
// enumerate, before it yields an element, so S \cup T fails on T before it streams S.
const openStream = (value: Value): void => {
  if (typeof value !== "object" || isCachedSet(value)) return;
  switch (value.kind) {
    case "MixedSet":
      toFiniteSet(value);
      return;
    case "FilteredSet":
      if (!isTlcEnumerable(value.base)) getStreamedElements(value);
      return openStream(value.base);
    case "Union":
      if (!isEnumeratedSet(value.base) && isTlcEnumerable(value.base)) {
        return openStream(value.base);
      }
      getUnionSets(value)
        .slice(0, 1)
        .forEach((set) => openStream(getUnionSet(set, 0, value)));
      return;
    case "SetOperation":
      if (value.operator === "\\" && !isTlcEnumerable(value.left)) getStreamedElements(value);
      if (value.operator !== "\\cap" || isTlcEnumerable(value.left)) openStream(value.left);
      else openStream(value.right);
      if (value.operator === "\\cup") openStream(value.right);
  }
};

const listUnionLikeTlc = (union: SetOperationValue) => {
  if (!isTlcEnumerable(union.left) || !isTlcEnumerable(union.right)) {
    throw new TlaEvaluationError(
      `Attempted to enumerate S \\cup T when S:\n${formatValue(union.left)}\nand T:\n${formatValue(union.right)}\nare not both enumerable`,
    );
  }
  openStream(union.left);
  openStream(union.right);
  if (isBeyondSetBound(union.left)) throw new TlaSetBoundError(getSetBoundMessage());
  const left = getStreamedElements(union.left);
  const right = isBeyondSetBound(union.right) ? undefined : getStreamedElements(union.right);
  if (!right || left.length + right.length > getMaximumSetSize()) {
    throw new TlaSetBoundError(getSetBoundMessage());
  }
  return [...left, ...right];
};

// EnumerableValue#elements(NORMALIZED) sorts a union outside its methods, so a failed comparison
// isn't a fingerprint failure.
export const getNormalizedSetElements = (value: Value) => {
  if (
    typeof value !== "object" ||
    value.kind !== "SetOperation" ||
    value.operator !== "\\cup" ||
    value.enumerated
  ) {
    return toFiniteSet(value).elements;
  }
  const listed = callTracedMethod(value, () => listUnionLikeTlc(value));
  const elements = toFiniteSet(createEnumeratedSet(listed)).elements;
  value.enumerated = createSortedSet(elements);
  return elements;
};

// TLC streams the sets a lazy set combines until it caches it, so a shared element repeats.
export const getStreamedElements = (value: Value): Value[] => {
  if (typeof value !== "object" || isCachedSet(value)) return toFiniteSet(value).elements;
  const sets = setTrace.sets;
  sets?.push(value);
  const elements = streamElements(value);
  sets?.pop();
  return elements;
};

const getCombinedSets = (value: ObjectValue) =>
  value.kind === "ProductSet"
    ? value.factors
    : value.kind === "RecordSet"
      ? value.sets
      : value.kind === "FunctionSet"
        ? [value.range]
        : undefined;

// Whether one evaluation can stand for the next: no UNION or \cup, which streams until TLC
// caches it, no lambda, which fingerprinting turns into a record, and no record a
// comparison reorders.
export const isSettledValue = (value: Value): boolean => {
  if (typeof value !== "object") return true;
  switch (value.kind) {
    case "ModelValue":
    case "Interval":
      return true;
    case "Set":
      return value.elements.every(isSettledValue);
    case "Function":
      return (
        value.functionClass !== "lambda" &&
        value.writtenKeys === undefined &&
        value.domain.every(isSettledValue) &&
        value.range.every(isSettledValue)
      );
    case "SetOperation":
      return (
        value.operator !== "\\cup" && isSettledValue(value.left) && isSettledValue(value.right)
      );
    case "FilteredSet":
      return isSettledValue(value.base);
    case "ProductSet":
      return value.factors.every(isSettledValue);
    default:
      return false;
  }
};

// A set of tuples, records, or functions with such a component has to stream too.
const isStreamedApart = (value: Value): boolean => {
  if (typeof value !== "object" || isCachedSet(value)) return false;
  if (value.kind === "Union") return true;
  if (value.kind === "FilteredSet") return isStreamedApart(value.base);
  if (value.kind === "SetOperation") {
    return (
      value.operator === "\\cup" || isStreamedApart(value.left) || isStreamedApart(value.right)
    );
  }
  return getCombinedSets(value)?.some(isStreamedApart) ?? false;
};

const streamElements = (value: ObjectValue): Value[] => {
  // TLC streams the sets of a UNION it hasn't enumerated, so a repeated set yields them twice.
  if (value.kind === "Union") {
    return getUnionSets(value, getStreamedElements).flatMap((set, index) =>
      getStreamedElements(getUnionSet(set, index, value)),
    );
  }
  if (value.kind === "FilteredSet" && isTlcEnumerable(value.base)) {
    return getStreamedElements(value.base).filter((element) => value.test(element, false));
  }
  const components = getCombinedSets(value);
  if (components?.some(isStreamedApart)) return enumerateSet(value, getStreamedElements);
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

// TLC 1.7.4 sizes every component without checking for an empty one, so an infinite one fails.
export const getCardinality = (value: Value, version?: TlcVersion): number => {
  if (typeof value !== "object") {
    throw new TlaEvaluationError(
      `Attempted to compute the number of elements in the ${describeKind(value)} ${formatValue(value)}.`,
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
      cacheSet(value);
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

const findSortedIndex = (sortedValues: Value[], target: Value, compare = compareValues) => {
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

// A sorted set as TLC builds it unsorted, by adding each element it doesn't hold yet.
export const createUnsortedCopy = (set: SetValue, added: Value[]): SetValue => {
  const elements = set.elements;
  if (elements.length > getMaximumSetSize()) throw new TlaSetBoundError(getSetBoundMessage());
  const isAdded = Array.from({ length: elements.length }, () => false);
  const written = added.filter((element) => {
    const index = findSortedIndex(elements, element);
    if (isAdded[index]) return false;
    isAdded[index] = true;
    return true;
  });
  const copy = createSortedSet(elements);
  if (written.some((element, index) => element !== elements[index])) {
    copy.writtenElements = written;
  }
  return copy;
};

export const getSequenceElements = (value: Value): Value[] | undefined => {
  if (typeof value !== "object" || !isFunctionValue(value)) return undefined;
  if (
    value.kind === "LazyFunction" &&
    (!isSetValue(value.domain) || isOverriddenSet(value.domain))
  ) {
    throw new TlaEvaluationError(
      "To convert a function of form [x \\in S |-> f(x)] to a tuple, the set S must be enumerable.",
    );
  }
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

interface TracedCallStack {
  expressions: unknown[];
  isFrozen: boolean;
  sources: WeakMap<ObjectValue, unknown>;
  fingerprint?: unknown;
}

// The values being checked or enumerated, outermost first, as TLC's CallStackTool replays a
// computation. TLC adds each one with a source to the FingerprintException.
export const setTrace: { sets: Value[] | undefined; callStack?: TracedCallStack } = {
  sets: undefined,
};

// TLC never takes the fast path, so the failure's leftovers in the replay's trace go first.
// The operands are arguments so that a hot caller passes functions it doesn't allocate.
export const computeLikeTlcOnFailure = <Left, Right, Result>(
  compute: (left: Left, right: Right) => Result,
  computeLikeTlc: (left: Left, right: Right, error: TlaEvaluationError) => Result,
  left: Left,
  right: Right,
): Result => {
  const sets = setTrace.sets;
  const callStack = setTrace.callStack;
  const depth = sets?.length ?? 0;
  const trace = callStack && { ...callStack, length: callStack.expressions.length };
  try {
    return compute(left, right);
  } catch (error) {
    if (!(error instanceof TlaEvaluationError)) throw error;
    if (sets) sets.length = depth;
    if (callStack && trace) {
      callStack.expressions.length = trace.length;
      callStack.isFrozen = trace.isFrozen;
      callStack.fingerprint = trace.fingerprint;
    }
    return computeLikeTlc(left, right, error);
  }
};

export const isFingerprintedSince = (depth: number) =>
  (setTrace.sets ?? [])
    .slice(depth)
    .some((set) => typeof set === "object" && setTrace.callStack?.sources.has(set) === true);

export const isElementOf = (element: Value, set: Value): boolean => {
  const sets = setTrace.sets;
  if (sets === undefined) return isElementOfSet(element, set);
  sets.push(set);
  const isElement = isElementOfSet(element, set);
  sets.pop();
  return isElement;
};

const isInSortedSet = (element: Value, set: SetValue) =>
  findSortedIndex(set.elements, element) !== -1;

const isInSortedSetLikeTlc = (element: Value, set: SetValue) =>
  set.isNormalized
    ? searchLikeTlc(element, set.elements).isFound
    : isElementOfLikeTlc(element, getWrittenElements(set));

const isModelValueMember = (modelValue: ModelValue, set: Value) => {
  if (modelValue.type !== undefined) {
    throw new TlaEvaluationError(
      `Attempted to check if the typed model value ${prettyPrint(formatValue(modelValue))} is an element of\n${prettyPrint(formatValue(set))}`,
    );
  }
  return false;
};

const isElementOfSet = (element: Value, set: Value): boolean => {
  if (!isSetValue(set)) throw new TlaEvaluationError(describeNonSetMembership(element, set));
  switch (set.kind) {
    case "Set":
      // TLC compares the element with the set's.
      cacheSet(element);
      return computeLikeTlcOnFailure(isInSortedSet, isInSortedSetLikeTlc, element, set);
    case "MixedSet":
      return isElementOfLikeTlc(element, set.elements);
    case "Interval":
      if (typeof element === "number") return element >= set.low && element <= set.high;
      if (set.low <= set.high && (!isModelValue(element) || element.type !== undefined)) {
        throw new TlaEvaluationError(
          `Attempted to check if the value:\n${formatValue(element)}\nis in the integer interval ${formatValue(set)}`,
        );
      }
      return false;
    case "InfiniteSet": {
      if (set.name === "Any") return true;
      if (isModelValue(element)) return isModelValueMember(element, set);
      const isMemberType =
        set.name === "STRING" ? typeof element === "string" : typeof element === "number";
      if (!isMemberType) {
        throw new TlaModuleError(
          `Attempted to check if the value:\n${formatValue(element)}\nis an element of ${set.name}.`,
        );
      }
      return set.name !== "Nat" || (typeof element === "number" && element >= 0);
    }
    case "Subset":
      // TLC fails on a value that isn't Enumerable, model values and Java-overridden sets included.
      if (!isSetValue(element) || isOverriddenSet(element)) {
        throw new TlaEvaluationError(
          `Attempted to check if the non-enumerable value\n${prettyPrint(formatValue(element))}\nis element of\n${prettyPrint(formatValue(set))}`,
        );
      }
      return toFiniteSet(element).elements.every((item) => isElementOf(item, set.base));
    case "FunctionSet": {
      if (!isFunctionValue(element)) {
        if (isModelValue(element)) return isModelValueMember(element, set);
        // TLC prints the element without Values.ppr.
        throw new TlaEvaluationError(
          `Attempted to check if \n${formatValue(element)}\nwhich is not a TLC function value, is in the set of functions:\n${prettyPrint(formatValue(set))}`,
        );
      }
      const functionValue = toFiniteFunction(element);
      const low = getIntervalLow(element, functionValue.domain);
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
        if (isModelValue(element)) return isModelValueMember(element, set);
        throw new TlaEvaluationError(
          `Attempted to check if non-record\n${formatValue(element)}\nis in the set of records:\n${formatValue(set)}`,
        );
      }
      return (
        functionValue.domain.length === set.names.length &&
        set.names.every((name, index) => {
          const position = findSortedIndex(functionValue.domain, name);
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
        if (isModelValue(element)) return isModelValueMember(element, set);
        if (isFunction) return false;
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
      try {
        return isElementOf(element, set.base) && set.test(element, true);
      } catch (error) {
        if (!(error instanceof TlaEvaluationError) || !isEvalException(error)) throw error;
        throw new TlaEvaluationError(
          `Cannot decide if element:\n${prettyPrint(formatValue(element))}\n is element of:\n${prettyPrint(formatValue(set.base))}\nand satisfies the predicate ${set.source?.predicate}`,
        );
      }
    case "Union": {
      if (!isTlcEnumerable(set.base)) {
        throw new TlaEvaluationError(
          `Attempted to check if:\n ${formatValue(element)}\nis an element of the non-enumerable set:\n ${formatUnion(set)}`,
        );
      }
      const sets = toFiniteSet(set.base).elements;
      // TLC sorts the sets to enumerate them, and comparing two sets normalizes both.
      if (sets.length > 1) {
        sets.forEach((inner) => {
          if (typeof inner === "object" && inner.kind === "Set") inner.isNormalized = true;
        });
      }
      return sets.some((inner) => isElementOf(element, inner));
    }
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
        if (isModelValue(element)) return isModelValueMember(element, set);
        // TLC raises TLC_MODULE_CHECK_MEMBER_OF.
        throw new TlaModuleError(
          `Attempted to check if the value:\n${prettyPrint(formatValue(element))}\nis an element of ${prettyPrint(formatValue(set))}.`,
        );
      }
      return elements.every((item) => isElementOf(item, set.base));
    }
    default:
      throw new TlaEvaluationError(describeNonSetMembership(element, set));
  }
};

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
    if (value.enumerated) return value.enumerated;
    if (!isEnumerable(value.domain)) getCardinality(value.domain);
    if (!isSetValue(value.domain)) {
      throw new TlaEvaluationError("The domains of formal parameters must be enumerable.");
    }
    const domain = getFunctionDomain(value.domain);
    value.enumerated = setFunctionClass(
      createSortedFunction(
        domain,
        domain.map((key) => value.apply(key)),
      ),
      getFunctionClass(value),
    );
    return value.enumerated;
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

// A key the domain holds itself, which TLC finds without a comparison that can fail.
const findIdenticalKey = (domain: Value[], argument: Value) => {
  const first = domain[0];
  if (typeof argument === "number" && typeof first === "number") {
    const offset = argument - first;
    if (domain[offset] === argument) return offset;
  }
  return domain.length <= 8 ? domain.indexOf(argument) : -1;
};

export const createNonIntegerKeyError = (argument: Value) =>
  new TlaEvaluationError(
    `Attempted to apply function with integer domain to the non-integer argument ${prettyPrint(formatValue(argument))}`,
  );

// TLC searches a domain this small linearly with equals, and a larger one with compareTo.
const LINEAR_SEARCH_LIMIT = 32;

const findDomainIndex = (functionValue: FunctionValue, argument: Value) =>
  findSortedIndex(functionValue.domain, argument);

// TLC searches a function it hasn't normalized linearly, in the order its keys were written.
const failKeyLikeTlc = (
  functionValue: FunctionValue,
  argument: Value,
  error: TlaEvaluationError,
): never => {
  const keys = getWrittenKeys(functionValue);
  if (valueVersion.is174 || keys !== functionValue.domain || keys.length < LINEAR_SEARCH_LIMIT) {
    keys.forEach((key) => equalsLikeTlc(key, argument));
  } else {
    findSortedIndex(keys, argument, compareLikeTlc);
  }
  throw error;
};

// A tuple or a record rejects a key of the wrong type, and another function a non-integer for
// an interval domain, which TLC 1.7.4 doesn't. Any other key type fails TLC's comparison.
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
    if (
      keyType === undefined &&
      !valueVersion.is174 &&
      typeof argument !== "number" &&
      isIntervalDomain(domain)
    ) {
      throw createNonIntegerKeyError(argument);
    }
  }
  const identical = findIdenticalKey(domain, argument);
  if (identical !== -1) return identical;
  return computeLikeTlcOnFailure(findDomainIndex, failKeyLikeTlc, functionValue, argument);
};

// TLC checks each argument against its bound in turn. It indexes past an argument tuple shorter
// than the bounds and ignores one longer, where this fails instead.
const checkBoundArguments = (
  functionValue: LazyFunctionValue,
  tupleLengths: (number | undefined)[],
  argument: Value,
) => {
  const domain = functionValue.domain;
  const elements = getSequenceElements(argument);
  const describe = (position: string, shown: Value, problem: string) =>
    `In applying the function\n${prettyPrint(formatValue(functionValue))},\nthe ${position} is:\n${prettyPrint(formatValue(shown))}\nwhich ${problem}.\n`;
  if (elements === undefined) {
    throw new TlaEvaluationError(
      describe("argument list", argument, "does not match its formal parameter"),
    );
  }
  const describeOutside = () =>
    `Attempted to apply a function to ${formatValue(argument)}, which is not in its domain`;
  if (typeof domain !== "object" || domain.kind !== "ProductSet") {
    throw new TlaEvaluationError(describeOutside());
  }
  tupleLengths.forEach((tupleLength, index) => {
    if (index >= elements.length) throw new TlaEvaluationError(describeOutside());
    const element = elements[index];
    const position = `argument number ${index + 1}`;
    if (!isElementOf(element, domain.factors[index])) {
      throw new TlaEvaluationError(
        describe(
          position,
          element,
          tupleLength === undefined
            ? `is not in the function's domain ${formatValue(domain)}`
            : "is not in its domain",
        ),
      );
    }
    if (tupleLength !== undefined && getSequenceElements(element)?.length !== tupleLength) {
      throw new TlaEvaluationError(
        describe(position, element, "does not match its formal parameter"),
      );
    }
  });
  if (elements.length > tupleLengths.length) throw new TlaEvaluationError(describeOutside());
};

// TLC checks that a FcnLambdaValue's domain holds the argument, and searches only the FcnRcdValue
// it converts the lambda to when it fingerprints it.
const isOutsideLambdaDomain = (functionValue: FunctionValue, argument: Value) =>
  functionValue.lambdaDomain !== undefined &&
  functionValue.hash === 0 &&
  functionValue.fingerprint === 0 &&
  !isElementOf(argument, functionValue.lambdaDomain);

export const applyFunction = (
  functionValue: Value,
  argument: Value,
  describeMissing?: (functionValue: FunctionValue, argument: Value) => string,
): Value => {
  if (typeof functionValue === "object" && functionValue.kind === "LazyFunction") {
    if (functionValue.enumerated) {
      return applyFunction(functionValue.enumerated, argument, describeMissing);
    }
    const tupleLengths = functionValue.boundTupleLengths;
    if (tupleLengths !== undefined) {
      checkBoundArguments(functionValue, tupleLengths, argument);
      return functionValue.apply(argument);
    }
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
  if (isOutsideLambdaDomain(functionValue, argument)) {
    throw new TlaEvaluationError(describe(functionValue, argument));
  }
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
  const finite = toFiniteFunction(functionValue);
  if (finite.functionClass === "lambda" && finite.lambdaDomain) return finite.lambdaDomain;
  const interval = getDomainInterval(finite.domain);
  if (interval) return interval;
  const set = createSortedSet(finite.domain);
  // TLC keeps a record's domain in written order and sorts any other function's.
  if (finite.functionClass === "record") {
    if (finite.writtenKeys) set.writtenElements = finite.writtenKeys;
    return set;
  }
  set.isNormalized = true;
  return set;
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
    (isKeptLazy || functionValue.enumerated === undefined);
  if (isLazy) {
    if (!isElementOf(argument, functionValue.domain)) return functionValue;
    const updated = update(functionValue.apply(argument));
    return setFunctionClass<LazyFunctionValue>(
      {
        kind: "LazyFunction",
        domain: functionValue.domain,
        apply: (key) => (isEqualLikeTlc(argument, key) ? updated : functionValue.apply(key)),
        source: functionValue.source,
        boundTupleLengths: functionValue.boundTupleLengths,
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
  if (isOutsideLambdaDomain(finite, argument)) return finite;
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
  updated.lambdaDomain = finite.lambdaDomain;
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

// The hash of a value TLC fails to fingerprint, such as Nat. Calls with one as an argument still
// share their result, and a state that holds one fails when TLC fingerprints it.
const UNFINGERPRINTABLE_HASH = 0x2f6b1c4d;

const computeValueHash = (value: SetValue | FunctionValue) => {
  if (value.kind === "Set") {
    const elements = value.elements;
    let hash = SET_HASH_SEED;
    for (let index = 0; index < elements.length; index++) {
      const elementHash = getValueHash(elements[index]);
      if (elementHash === UNFINGERPRINTABLE_HASH) return UNFINGERPRINTABLE_HASH;
      hash = (hash + getElementContribution(elementHash)) | 0;
    }
    return hash;
  }
  let hash = FUNCTION_HASH_SEED;
  for (let index = 0; index < value.domain.length; index++) {
    const keyHash = getValueHash(value.domain[index]);
    const itemHash = getValueHash(value.range[index]);
    if (keyHash === UNFINGERPRINTABLE_HASH || itemHash === UNFINGERPRINTABLE_HASH) {
      return UNFINGERPRINTABLE_HASH;
    }
    hash = (hash + getEntryContribution(keyHash, itemHash)) | 0;
  }
  return hash;
};

// TLC enumerates each set and function, and fails on Nat, Seq(S) and the like.
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

// Hashing can fail, as for a set too large to enumerate, and so can a value TLC fails on.
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
  if (value.kind === "ModelValue") return value.hash;
  if (value.kind === "LazyFunction") {
    return isEnumerable(value.domain)
      ? getValueHash(toFiniteFunction(value))
      : UNFINGERPRINTABLE_HASH;
  }
  return isEnumerable(value) ? getValueHash(toFiniteSet(value)) : UNFINGERPRINTABLE_HASH;
};

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

const computeValueFingerprint = (value: SetValue | FunctionValue) => {
  if (value.kind === "Set") {
    const elements = value.elements;
    let fingerprint = 0x1b873593;
    for (let index = 0; index < elements.length; index++) {
      fingerprint = (fingerprint + getElementFingerprint(elements[index])) | 0;
    }
    return fingerprint;
  }
  let fingerprint = 0x4cf5ad43;
  for (let index = 0; index < value.domain.length; index++) {
    fingerprint = (fingerprint + getEntryFingerprint(value.domain[index], value.range[index])) | 0;
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
  if (value.kind === "ModelValue") return value.fingerprint;
  if (value.kind === "LazyFunction") return getValueFingerprint(toFiniteFunction(value));
  return isEnumerable(value)
    ? getValueFingerprint(toFiniteSet(value))
    : fingerprintString(getValueKey(value));
};

export const getValueKey = (value: Value): string => {
  if (typeof value === "boolean") return value ? "T" : "F";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return JSON.stringify(value);
  return computeValueKey(value);
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

const PRINTED_ESCAPES: Record<string, string> = {
  '"': '\\"',
  "\\": "\\\\",
  "\t": "\\t",
  "\n": "\\n",
  "\f": "\\f",
  "\r": "\\r",
};

const formatString = (value: string) =>
  `"${value.replace(/["\\\t\n\f\r]/g, (character) => PRINTED_ESCAPES[character])}"`;

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
  // TLC asks whether the domain is empty before it sizes it.
  if (value.kind === "FunctionSet") {
    const domainSize = isEmptySet(value.domain) ? 0 : getCardinality(value.domain);
    const size = domainSize === 0 ? 1 : getCardinality(value.range) ** domainSize;
    return size <= MAXIMUM_EXPANDED_PRODUCT ? toFiniteSet(value) : undefined;
  }
  const size = getProductSize(value.kind === "RecordSet" ? value.sets : value.factors);
  return size <= MAXIMUM_EXPANDED_PRODUCT ? toFiniteSet(value) : undefined;
};

const getExpandedLazySet = (value: LazySetValue, isStrict: boolean) => {
  // UnionValue alone of TLC's lazy sets doesn't swallow the failure to enumerate itself.
  if (isStrict || value.kind === "Union") return expandLazySet(value);
  // TLC sizes the base of SUBSET before it enumerates it, and only a failure to size it is quiet.
  if (
    value.kind === "Subset" &&
    isFunctionValue(value.base) &&
    (value.base.kind === "Function" || isEnumerable(value.base.domain))
  ) {
    return expandLazySet(value);
  }
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

// TLC prints a record when every key is letters, digits, and underscores, with a letter.
const isFieldName = (name: string) =>
  /^[\p{L}\p{Nd}_]*$/u.test(name) &&
  /\p{L}/u.test(name) &&
  (name.length < 4 || !/^[WS]F_/.test(name));

const toPrintedFunction = (value: LazyFunctionValue) => {
  if (!isEnumerable(value.domain)) return undefined;
  try {
    return toFiniteFunction(value);
  } catch (error) {
    if (error instanceof TlaEvaluationError || isStackOverflow(error)) return undefined;
    throw error;
  }
};

// TLC prints normalized copies, so the printed values themselves stay unnormalized.
export const formatNormalizedCopies = (values: Value[]) => {
  const markedSets: SetValue[] = [];
  const normalize = (value: Value): void => {
    if (typeof value !== "object") return;
    switch (value.kind) {
      case "Set":
        value.elements.forEach(normalize);
        if (value.isNormalized) return;
        value.isNormalized = true;
        markedSets.push(value);
        return;
      case "MixedSet":
        value.elements.forEach(normalize);
        toFiniteSet(value);
        return;
      case "Function":
        value.range.forEach(normalize);
        return;
      case "LazyFunction":
        normalize(value.enumerated ?? value.domain);
        return;
      case "SetOperation":
        normalize(value.left);
        normalize(value.right);
        return;
      case "FunctionSet":
        normalize(value.domain);
        normalize(value.range);
        return;
      case "RecordSet":
        value.sets.forEach(normalize);
        return;
      case "ProductSet":
        value.factors.forEach(normalize);
        return;
      case "Subset":
      case "Union":
      case "FilteredSet":
      case "SequenceSet":
        normalize(value.base);
        return;
      default:
        return;
    }
  };
  try {
    values.forEach(normalize);
    return values.map((value) => formatValue(value, true, true));
  } finally {
    markedSets.forEach((set) => {
      set.isNormalized = false;
    });
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
      const expanded = printing.isExpanded ? getExpandedLazySet(value, isStrict) : undefined;
      return expanded ? format(expanded) : formatLazySet(value, isStrict);
    }

    case "SequenceSet":
      return `Seq(${format(value.base)})`;
    case "Function":
    case "LazyFunction": {
      const functionValue =
        value.kind !== "LazyFunction"
          ? value
          : printing.isExpanded || !value.source
            ? toPrintedFunction(value)
            : undefined;
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
      // TLC normalizes a lambda's domain to print it, but evaluates its body afterward.
      const formatRange = (inner: Value) =>
        formatValue(inner, isStrict, isNormalized && getFunctionClass(value) !== "lambda");
      if (functionValue.domain.length === 0 && getFunctionClass(value) === "record") return "[]";
      if (functionValue.domain.every((key, index) => key === index + 1)) {
        return `<<${functionValue.range.map(formatRange).join(", ")}>>`;
      }
      const pairs = isNormalized
        ? functionValue.domain.map((key, index) => [key, functionValue.range[index]])
        : getPrintedPairs(functionValue);
      // A RecordValue always prints as a record, a FcnRcdValue only if its keys are names.
      if (
        getFunctionClass(value) === "record" ||
        functionValue.domain.every((key) => typeof key === "string" && isFieldName(key))
      ) {
        return `[${pairs.map((pair) => `${String(pair[0])} |-> ${formatRange(pair[1])}`).join(", ")}]`;
      }
      return `(${pairs.map((pair) => `${format(pair[0])} :> ${formatRange(pair[1])}`).join(" @@ ")})`;
    }
  }
};

// TLC counts a value it can't compare with the previous one as changed.
const isUnchanged = (previous: Value | undefined, value: Value) => {
  if (previous === undefined) return false;
  try {
    return valuesEqual(previous, value);
  } catch (error) {
    if (error instanceof TlaEvaluationError) return false;
    throw error;
  }
};

// TLC prints the VIEW of a state, but not of one it prints as a difference from the previous.
export const formatState = (state: Record<string, Value>, previous?: Record<string, Value>) => {
  const getViewText = previous ? undefined : viewTexts.get(state);
  if (getViewText) return getViewText();
  const entries = Object.entries(state);
  return entries
    .filter(([name, value]) => !previous || !isUnchanged(previous[name], value))
    .map(
      ([name, value]) =>
        `${entries.length === 1 ? "" : "/\\ "}${name} = ${prettyPrint(formatValue(value))}\n`,
    )
    .join("");
};
