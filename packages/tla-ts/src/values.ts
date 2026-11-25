import {
  isStackOverflow,
  TlaAliasFormatError,
  TlaEvaluationError,
  TlaFeatureUnsupportedError,
  TlaModuleError,
  TlaSetBoundError,
} from "./errors";
import { getJavaHashCode } from "./java-hash";
import { prettyPrint } from "./pretty-print";
import { isEvalException, withProcessException } from "./tlc/messages";
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
  flags?: number;
}

export interface SetValue {
  kind: "Set";
  elements: Value[];
  writtenElements: Value[] | undefined;
  hash: number;
  fingerprint: number;
  // VALUE_NORMALIZED, VALUE_FINGERPRINTED, VALUE_SELF_COMPARED and VALUE_DEEPLY_NORMALIZED bits.
  flags: number;
  costNode?: number;
}

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
  functionClass: "tuple" | "record" | undefined;
  // VALUE_FINGERPRINTED, VALUE_SELF_COMPARED, VALUE_DEEPLY_NORMALIZED, VALUE_CANONICAL and
  // VALUE_KEYS_ORDERLESS bits.
  flags: number;
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

interface SetCost {
  node: number | undefined;
  charges: ChargeTable | undefined;
}

// A sixth field on RecordSetValue cost recset about 1.5% with no V8 mechanism found, so the cost model is one field.
interface CostedSet {
  cost: SetCost | undefined;
}

export interface SubsetValue extends LazySet, CostedSet {
  kind: "Subset";
  base: Value;
}

export interface FunctionSetValue extends LazySet, CostedSet {
  kind: "FunctionSet";
  domain: Value;
  range: Value;
  hasFilter: boolean;
}

export interface RecordSetValue extends LazySet, CostedSet {
  kind: "RecordSet";
  names: string[];
  sets: Value[];
  hasFilter: boolean;
}

export interface ProductSetValue extends LazySet, CostedSet {
  kind: "ProductSet";
  factors: Value[];
  hasFilter: boolean;
}

export interface SequenceSetValue extends LazySet {
  kind: "SequenceSet";
  base: Value;
}

export interface SetOperationValue extends LazySet, CostedSet {
  kind: "SetOperation";
  operator: "\\cup" | "\\cap" | "\\";
  left: Value;
  right: Value;
  hasFilter: boolean;
}

interface FilteredSetSource {
  names: string;
  predicate: string;
}

export interface FilteredSetValue extends LazySet {
  kind: "FilteredSet";
  base: Value;
  test: (element: Value, isMember: boolean) => boolean;
  isTestObserved?: true;
  startPass?: (isMaterialized: boolean) => FilterPass;
  source?: FilteredSetSource;
}

export interface FilterPass {
  test: (element: Value) => boolean;
  end: () => void;
}

export interface UnionValue extends LazySet, CostedSet {
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

export interface CostModel {
  secondary: number[];
  node: number;
  startConversion: () => () => void;
}

export interface LazyFunctionValue {
  kind: "LazyFunction";
  domain: Value;
  apply: (argument: Value) => Value;
  boundTupleLengths?: (number | undefined)[];
  // Set when an application has an effect or is counted under -coverage, so converting to a tuple applies again as TLC does.
  isApplicationObserved: boolean;
  source?: LazyFunctionSource;
  enumerated?: FunctionValue;
  flags?: number;
}

interface CountedLazyFunctionValue extends LazyFunctionValue {
  costModel: CostModel;
}

interface LazyFunctionCopy extends LazyFunctionValue {
  original: LazyFunctionValue;
  path: Value[];
  depth: number;
  newValue: Value;
  applyBody: (argument: Value) => Value;
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

// A set that TLC has normalized, which it prints in sorted order.
const VALUE_NORMALIZED = 1;
// A value that a state holds once TLC has fingerprinted it.
const VALUE_FINGERPRINTED = 2;
// A value that compareWithItself walked, as TLC's equals and compareTo do once.
const VALUE_SELF_COMPARED = 4;
// A set or function that markNormalized walked, every set within which TLC has normalized.
const VALUE_DEEPLY_NORMALIZED = 8;
// A record of ESCore's heap that CanonicalStateOf made, which it keeps as it is where its
// numbering leaves the record and what it refers to where they are (see escore-canonical.ts).
const VALUE_CANONICAL = 16;
// A function each key of whose domain isOrderless, which a key stays once it is.
const VALUE_KEYS_ORDERLESS = 32;

export const markCanonical = (value: FunctionValue) => {
  value.flags |= VALUE_CANONICAL;
  return value;
};

export const isCanonical = (value: Value) =>
  typeof value === "object" && value.kind === "Function" && (value.flags & VALUE_CANONICAL) !== 0;

// A page of ESCore's heap that CanonicalStateOf made, with the nodes that each of its records refers
// to (see escore-canonical.ts), whose hidden class no other function shares.
export interface CanonicalPage extends FunctionValue {
  edges: Int32Array;
}

export const createCanonicalPage = (records: Value[], edges: Int32Array): CanonicalPage => ({
  kind: "Function",
  domain: getIntervalDomain(records.length),
  range: records,
  hash: 0,
  fingerprint: 0,
  writtenKeys: undefined,
  functionClass: "tuple",
  flags: VALUE_CANONICAL,
  edges,
});

export const isCanonicalPage = (value: Value): value is CanonicalPage =>
  typeof value === "object" && "edges" in value;

export const isNormalizedSet = (set: SetValue | MixedSetValue) =>
  set.kind === "MixedSet" ? set.enumerated !== undefined : (set.flags & VALUE_NORMALIZED) !== 0;

export const setNormalized = (set: SetValue, isNormalized: boolean) => {
  set.flags = isNormalized ? set.flags | VALUE_NORMALIZED : set.flags & ~VALUE_NORMALIZED;
};

const DEFAULT_SET_BOUND = 1000000;
const VALUE_VEC_CAPACITY = 10;

let setBound = DEFAULT_SET_BOUND;

export const getSetBound = () => setBound;

export const getMaximumSetSize = () => Math.max(setBound, VALUE_VEC_CAPACITY);

export const getSetBoundMessage = () =>
  `Attempted to construct a set with too many elements (>${setBound}).`;

export const addBoundedElement = (elements: Value[], element: Value) => {
  if (elements.length === getMaximumSetSize()) throw new TlaSetBoundError(getSetBoundMessage());
  elements.push(element);
};

export const isBeyondSetBound = (value: Value): value is IntervalValue =>
  typeof value === "object" &&
  value.kind === "Interval" &&
  value.high - value.low >= getMaximumSetSize();

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

const describeKind = (value: Value) => {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "integer";
  if (typeof value === "string") return "string";
  if (value.kind === "ModelValue") return "model value";
  return isSetValue(value) ? "set" : "function";
};

export const isTlcInteger = (value: number) =>
  Number.isInteger(value) && value <= MAXIMUM_INTEGER && value >= MINIMUM_INTEGER;

let isWrittenOrderUsed = false;

const setWrittenOrder = (functionValue: FunctionValue, keys: Value[]) => {
  isWrittenOrderUsed = true;
  functionValue.writtenKeys = keys;
  return functionValue;
};

const getWrittenKeys = (functionValue: FunctionValue) =>
  (functionValue.hash !== 0 || functionValue.fingerprint !== 0
    ? undefined
    : functionValue.writtenKeys) ?? functionValue.domain;

export const getWrittenPairs = (functionValue: FunctionValue): [Value, Value][] => {
  const keys = getWrittenKeys(functionValue);
  const domain = functionValue.domain;
  const range = functionValue.range;
  if (keys === domain) return domain.map((key, index) => [key, range[index]]);
  // The position of each key in the domain, its first where it holds a key twice.
  const positions = new Map<Value, number>();
  domain.forEach((key, index) => {
    if (!positions.has(key)) positions.set(key, index);
  });
  return keys.map((key) => [key, range[positions.get(key) ?? -1]]);
};

export const getPrintedPairs = (functionValue: FunctionValue): [Value, Value][] =>
  functionValue.domain.every((key) => typeof key === "number")
    ? functionValue.domain.map((key, index) => [key, functionValue.range[index]])
    : getWrittenPairs(functionValue);

export const createWrittenRecord = (
  names: Value[],
  writtenIndexes: number[],
  writtenRange: Value[],
  writtenNames: Value[],
) =>
  setWrittenOrder(
    createSortedRecord(
      names,
      writtenIndexes.map((index) => writtenRange[index]),
    ),
    writtenNames,
  );

// TLC's SetOfRcdsValue#member, SetOfFcnsValue#member and FcnRcdValue#toRcd normalize the record or function they check in place.
const forgetOwnWrittenOrder = (value: Value) => {
  if (isWrittenOrderUsed && typeof value === "object" && value.kind === "Function") {
    value.writtenKeys = undefined;
  }
};

const isRecordDomain = (domain: Value[]) => domain.every((key) => typeof key === "string");

const isRecordMismatch = (left: Value[], right: Value[]) =>
  left.length > 0 && right.length > 0 && isRecordDomain(left) !== isRecordDomain(right);

const compareFunctions = (left: FunctionValue, right: FunctionValue) => {
  if (isWrittenOrderUsed) {
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
      const leftKey = leftDomain[index];
      const rightKey = rightDomain[index];
      const keyComparison = compareValues(leftKey, rightKey);
      if (keyComparison === 0) continue;
      // TLC compares a model value key with a tuple's or record's keys as an integer or a string, which fails.
      return isModelValue(leftKey) === isModelValue(rightKey)
        ? keyComparison
        : compareLikeTlc(left, right);
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
      `Attempted to ${action} the differently-typed model values ${prettyPrint(formatValue(left))} and ${prettyPrint(formatValue(right))}`,
    );
  }
  if (leftType !== undefined) {
    throw new TlaEvaluationError(
      `Attempted to ${action}${isEquality ? "" : " the"} typed model value ${prettyPrint(formatValue(left))} and non-model value\n${prettyPrint(formatValue(right))}`,
    );
  }
  throw new TlaEvaluationError(
    `Attempted to ${action} the typed model value ${prettyPrint(formatValue(right))} and the non-model value\n${prettyPrint(formatValue(left))}`,
  );
};

interface StringOrder {
  ranks: Record<string, number>;
  size: number;
  searchRank: number | undefined;
  unorderedString: string | undefined;
}

const createStringOrder = (): StringOrder => ({
  ranks: Object.create(null),
  size: 0,
  searchRank: undefined,
  unorderedString: undefined,
});

const stringOrder = createStringOrder();

export const setStringOrder = (texts: Iterable<string>) => {
  Object.assign(stringOrder, createStringOrder());
  modelValues.clear();
  isTypedModelValueCreated = false;
  isWrittenOrderUsed = false;
  hasStreamedSet = false;
  for (const text of texts) rankString(text);
};

export const freezeStringOrder = () => {
  stringOrder.searchRank = stringOrder.size;
};

export const getUnorderedString = () => stringOrder.unorderedString;

let isVersion174 = false;

const printing = { isExpanded: true, isViewPrinted: false };

export const isLazyValueExpanded = () => printing.isExpanded;

export interface ValueOptions {
  version?: TlcVersion;
  maxSetSize?: number;
  isLazyValueExpanded?: boolean;
  isViewPrinted?: boolean;
}

export const setValueOptions = (options: ValueOptions) => {
  isVersion174 = options.version === "1.7.4";
  setBound = options.maxSetSize ?? DEFAULT_SET_BOUND;
  printing.isExpanded = options.isLazyValueExpanded ?? true;
  printing.isViewPrinted = options.isViewPrinted ?? false;
};

const viewTexts = new WeakMap<Record<string, Value>, () => string>();

export const setViewText = (state: Record<string, Value>, getText: () => string) => {
  if (printing.isViewPrinted) viewTexts.set(state, getText);
  return state;
};

const aliasNames = new WeakMap<Record<string, Value>, string>();
const aliasedStates = new WeakMap<Record<string, Value>, () => Record<string, Value>>();

export const ALIAS_EVAL_ERROR = "_ALIASEvalError";

export const setAliasName = (state: Record<string, Value>, alias: string) => {
  aliasNames.set(state, alias);
  return state;
};

export const setAliasedState = (
  record: Record<string, Value>,
  getState: () => Record<string, Value>,
) => {
  aliasedStates.set(record, getState);
  return record;
};

// StatePrinter#getPreviousState diffs a state that its ALIAS leaves as it is against the predecessor as it is.
export const getDiffBase = (state: Record<string, Value>, previous: Record<string, Value>) =>
  aliasedStates.has(state) ? previous : (aliasedStates.get(previous)?.() ?? previous);

export const rankString = (text: string) => {
  if (stringOrder.ranks[text] === undefined) stringOrder.ranks[text] = stringOrder.size++;
  return text;
};

export const getStringRank = (text: string) => stringOrder.ranks[rankString(text)];

// The strings ranked so far, in their order.
export const getRankedStrings = () => {
  const ranks = stringOrder.ranks;
  return Object.keys(ranks).sort((left, right) => ranks[left] - ranks[right]);
};

const compareStrings = (left: string, right: string) => {
  if (left === right) return 0;
  const ranks = stringOrder.ranks;
  const leftRank = ranks[left];
  const rightRank = ranks[right];
  const searchRank = stringOrder.searchRank;
  if (
    searchRank !== undefined &&
    (leftRank === undefined || leftRank >= searchRank) &&
    (rightRank === undefined || rightRank >= searchRank)
  ) {
    stringOrder.unorderedString ??= left;
  }
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
      ? `Attempted to compare overridden value ${prettyPrint(formatValue(left))} with non-overridden value:\n${prettyPrint(formatValue(right))}`
      : `Attempted to compare ${describeKind(left)} ${formatValue(left)} with ${describeKind(right)} ${formatValue(right)}`,
  );

const compareOverriddenSets = (
  left: Value,
  right: Value,
  verb: "compare" | "check equality of",
) => {
  if (!isOverriddenSet(left)) {
    throw new TlaEvaluationError(
      `Attempted to ${verb} the set ${prettyPrint(formatValue(toFiniteSet(left)))} with the value:\n${prettyPrint(formatValue(right))}`,
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
    `Attempted to compare ${prettyPrint(formatValue(left))} with the value\n${prettyPrint(formatValue(right))}`,
  );
};

export const ANY_SET: InfiniteSetValue = { kind: "InfiniteSet", name: "Any" };

const compareAny = (other: Value): never => {
  throw new TlaModuleError(
    `Attempted to compare ANY with the value\n${prettyPrint(formatValue(other))}`,
  );
};

const isHashed = (value: SetValue | FunctionValue) =>
  value.fingerprint !== 0 || (value.hash !== 0 && value.hash !== UNFINGERPRINTABLE_HASH);

// TLC's equals and compareTo walk a value compared with itself, sorting its sets and evaluating its lazy functions; equals stops at an empty set of functions, records or tuples, and compareTo enumerates such a set.
const compareWithItself = (value: Value, isEquality: boolean): boolean => {
  if (typeof value !== "object") return true;
  switch (value.kind) {
    case "ModelValue":
    case "Interval":
      return true;
    case "SequenceSet":
      return compareWithItself(value.base, false);
    case "InfiniteSet":
      if (value === ANY_SET) compareAny(value);
      return true;
    case "LazyFunction":
      return compareWithItself(toFiniteFunction(value), isEquality);
    case "Function": {
      if ((value.flags & VALUE_SELF_COMPARED) !== 0 || isHashed(value)) return true;
      if (isWrittenOrderUsed) value.writtenKeys = undefined;
      const domain = value.domain;
      const range = value.range;
      let isInnerSettled = true;
      for (let index = 0; index < domain.length; index++) {
        isInnerSettled = compareWithItself(domain[index], isEquality) && isInnerSettled;
      }
      for (let index = 0; index < range.length; index++) {
        isInnerSettled = compareWithItself(range[index], isEquality) && isInnerSettled;
      }
      if (isInnerSettled) value.flags |= VALUE_SELF_COMPARED;
      return isInnerSettled;
    }
    case "Set": {
      if ((value.flags & VALUE_SELF_COMPARED) !== 0 || isHashed(value)) return true;
      value.flags |= VALUE_NORMALIZED;
      const elements = value.elements;
      let isInnerSettled = true;
      for (let index = 0; index < elements.length; index++) {
        isInnerSettled = compareWithItself(elements[index], isEquality) && isInnerSettled;
      }
      if (isInnerSettled) value.flags |= VALUE_SELF_COMPARED;
      return isInnerSettled;
    }
    case "Subset":
      return compareWithItself(value.base, isEquality);
    case "FunctionSet": {
      if (!isEquality) break;
      const charges = value.cost?.charges;
      // SetOfFcnsValue#equals, SetOfRcdsValue#equals and SetOfTuplesValue#equals ask both sides, here one set, about emptiness.
      charges?.chargeIsEmpty(value.domain);
      if (isEmptyLikeTlc(charges, value.domain)) return false;
      charges?.chargeIsEmpty(value.range);
      if (isEmptyLikeTlc(charges, value.range)) return false;
      compareWithItself(value.domain, isEquality);
      compareWithItself(value.range, isEquality);
      return false;
    }
    case "RecordSet":
    case "ProductSet": {
      if (!isEquality) break;
      const charges = value.cost?.charges;
      charges?.chargeIsEmpty(value);
      if (isEmptyLikeTlc(charges, value)) return false;
      const parts = value.kind === "RecordSet" ? value.sets : value.factors;
      for (let index = 0; index < parts.length; index++) {
        compareWithItself(parts[index], isEquality);
      }
      return false;
    }
  }
  const charged = getChargedSet(value);
  // SetOfTuplesValue#equals and the like convert nothing, so of the comparisons with itself only a literal's sort, through compareTo, converts a set of tuples.
  compareWithItself(
    charged && (isSortingLiteral || charged.kind === "SetOperation" || charged.kind === "Union")
      ? toChargedSet(charged, true, toFiniteSet)
      : toFiniteSet(value),
    isEquality,
  );
  return false;
};

export const compareValues = (left: Value, right: Value): number => {
  if (left === right) {
    compareWithItself(left, false);
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
    if (
      (leftKind === "SequenceSet" && rightKind === "SequenceSet") ||
      (leftKind === "Subset" && rightKind === "Subset")
    ) {
      return compareReceiver(left.base, right.base);
    }
    if (isSetValue(left) && isSetValue(right) && isOverriddenComparison(left, right)) {
      return compareOverriddenSets(left, right, "compare");
    }
    const isLeftSet = isSetValue(left);
    if (isLeftSet !== isSetValue(right)) {
      throw createComparisonError(left, right);
    }
    if (leftKind === "Interval" && rightKind === "Set") {
      const difference = getCardinality(left) - right.elements.length;
      if (difference !== 0) return difference;
    }
    if (leftKind === "Set" && rightKind === "Interval") {
      const difference = left.elements.length - getCardinality(right);
      if (difference !== 0) return difference;
    }
    if (isLeftSet) {
      const leftCharged = leftKind === "Set" ? undefined : getChargedSet(left);
      const rightCharged = rightKind === "Set" ? undefined : getChargedSet(right);
      return compareSets(
        leftCharged ? toChargedSet(leftCharged, true, toFiniteSet) : toFiniteSet(left),
        rightCharged ? toChargedSet(rightCharged, false, toComparedSet) : toComparedSet(right),
      );
    }
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

let isTypedModelValueCreated = false;

export const hasTypedModelValues = () => isTypedModelValueCreated;

const MAXIMUM_MODEL_VALUES = 32768;

export const createModelValue = (name: string): ModelValue => {
  const known = modelValues.get(name);
  if (known) return known;
  if (modelValues.size === MAXIMUM_MODEL_VALUES) {
    throw new TlaFeatureUnsupportedError(
      `TLC supports at most ${MAXIMUM_MODEL_VALUES} model values, but model value ${name} exceeds this limit.`,
    );
  }
  const type = name.length > 2 && name[1] === "_" ? name[0] : undefined;
  if (type !== undefined) isTypedModelValueCreated = true;
  const value: ModelValue = {
    kind: "ModelValue",
    name,
    type,
    rank: getStringRank(name),
    hash: finalizeHash(combineHash(hashString(name), 0x6d)),
    fingerprint: finalizeFingerprint(fingerprintString(name) ^ 0x3c),
  };
  modelValues.set(name, value);
  return value;
};

export const getModelValues = () => [...modelValues.values()];

export const createSortedSet = (elements: Value[]): SetValue => ({
  kind: "Set",
  elements,
  writtenElements: undefined,
  hash: 0,
  fingerprint: 0,
  flags: 0,
});

export const createNormalizedSet = (elements: Value[]): SetValue => {
  const set = createSortedSet(elements);
  set.flags = VALUE_NORMALIZED;
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
  flags: 0,
});

export type FunctionClass = "lambda" | "tuple" | "record";

export const setFunctionClass = (
  functionValue: FunctionValue,
  functionClass: FunctionValue["functionClass"],
) => {
  if (functionClass !== undefined) functionValue.functionClass = functionClass;
  return functionValue;
};

export const getFunctionClass = (value: Value): FunctionClass | undefined =>
  typeof value !== "object"
    ? undefined
    : value.kind === "LazyFunction"
      ? "lambda"
      : value.kind === "Function"
        ? value.functionClass
        : undefined;

const isObservedLambda = (value: Value) =>
  typeof value === "object" &&
  value.kind === "LazyFunction" &&
  value.isApplicationObserved &&
  value.enumerated === undefined;

// TLC's TupleValue converts the other side with toTuple, which applies a lazy function again on every comparison.
const isTupleAgainstObservedLambda = (left: FunctionValue, right: Value) =>
  left.functionClass === "tuple" && isObservedLambda(right);

const isCachedSet = (value: ObjectValue) => isLazySet(value) && value.isCached === true;

let hasStreamedSet = false;

export const markStreamedSet = <Streamed extends UnionValue | SetOperationValue>(
  value: Streamed,
) => {
  hasStreamedSet = true;
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
    hasStreamedSet &&
    typeof value === "object" &&
    isLazySet(value) &&
    STREAMING_KINDS.has(value.kind)
  ) {
    value.isCached = true;
  }
};

const isMarkedFingerprinted = (value: Value) =>
  typeof value !== "object" ||
  value.kind === "ModelValue" ||
  value.kind === "Interval" ||
  value.kind === "InfiniteSet" ||
  ((value.flags ?? 0) & VALUE_FINGERPRINTED) !== 0;

export const markFingerprinted = (value: Value): void => {
  if (!hasStreamedSet || typeof value !== "object") return;
  if (value.kind === "ModelValue" || value.kind === "Interval" || value.kind === "InfiniteSet") {
    return;
  }
  if (value.kind === "Function" || value.kind === "Set") {
    if ((value.flags & VALUE_FINGERPRINTED) !== 0) return;
    value.flags |= VALUE_FINGERPRINTED;
  } else {
    const flags = value.flags ?? 0;
    if ((flags & VALUE_FINGERPRINTED) !== 0) return;
    value.flags = flags | VALUE_FINGERPRINTED;
  }
  if (value.kind === "Function") {
    for (let index = 0; index < value.domain.length; index++) {
      markFingerprinted(value.domain[index]);
    }
    for (let index = 0; index < value.range.length; index++) {
      markFingerprinted(value.range[index]);
    }
  } else if (value.kind === "Set" || value.kind === "MixedSet") {
    for (let index = 0; index < value.elements.length; index++) {
      markFingerprinted(value.elements[index]);
    }
  } else if (isSetValue(value) && isEnumerable(value)) {
    cacheSet(value);
    toFiniteSet(value).elements.forEach(markFingerprinted);
  }
};

export const valuesEqual = (left: Value, right: Value): boolean => {
  cacheSet(left);
  if (left === right) {
    compareWithItself(left, true);
    return true;
  }
  if (typeof left !== "object" || typeof right !== "object") {
    if (typeof left === typeof right) return false;
    if (typeof left === "object" || typeof right === "object") {
      checkModelValueTypes(left, right, true);
    }
    return compareValues(left, right) === 0;
  }
  if (left.kind === "Function" && right.kind === "Function")
    return compareFunctions(left, right) === 0;
  if (left.kind === "Set" && right.kind === "Set") return compareSets(left, right) === 0;
  if (left.kind === "Interval" && right.kind === "Set") {
    if (getCardinality(left) !== right.elements.length) return false;
  }
  if (left.kind === "Set" && right.kind === "Interval") {
    if (left.elements.length !== getCardinality(right)) return false;
  }
  if (isModelValue(left) || isModelValue(right)) {
    if (left.kind === "LazyFunction") toFiniteFunction(left);
    checkModelValueTypes(left, right, true);
    return isModelValue(left) && isModelValue(right) && left.name === right.name;
  }
  if (left.kind === "Subset" && right.kind === "Subset")
    return isReceiverEqual(left.base, right.base);
  if (left.kind === "FunctionSet" && right.kind === "FunctionSet") {
    const charges = left.cost?.charges ?? right.cost?.charges;
    const isUnit = isEmptyLikeTlc(charges, left.domain);
    const isOtherUnit = isEmptyLikeTlc(charges, right.domain);
    if (isUnit || isOtherUnit) return isUnit === isOtherUnit;
    const isEmpty = isEmptyLikeTlc(charges, left.range);
    const isOtherEmpty = isEmptyLikeTlc(charges, right.range);
    if (isEmpty || isOtherEmpty) return isEmpty === isOtherEmpty;
    return isReceiverEqual(left.domain, right.domain) && isReceiverEqual(left.range, right.range);
  }
  if (left.kind === "RecordSet" && right.kind === "RecordSet") {
    const charges = left.cost?.charges ?? right.cost?.charges;
    if (isEmptyLikeTlc(charges, left)) return isEmptyLikeTlc(charges, right);
    if (isEmptyLikeTlc(charges, right)) return false;
    const getFields = (set: RecordSetValue) =>
      set.names
        .map((name, index): [string, Value] => [name, set.sets[index]])
        .sort((first, second) => (first[0] < second[0] ? -1 : 1));
    const otherFields = getFields(right);
    return (
      left.names.length === right.names.length &&
      getFields(left).every(
        (field, index) =>
          field[0] === otherFields[index][0] && isReceiverEqual(field[1], otherFields[index][1]),
      )
    );
  }
  if (left.kind === "ProductSet" && right.kind === "ProductSet") {
    const charges = left.cost?.charges ?? right.cost?.charges;
    if (isEmptyLikeTlc(charges, left)) return isEmptyLikeTlc(charges, right);
    if (isEmptyLikeTlc(charges, right)) return false;
    return (
      left.factors.length === right.factors.length &&
      left.factors.every((factor, index) => isReceiverEqual(factor, right.factors[index]))
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
    return compareValues(left, right) === 0;
  }
  if (left.kind === "Function" && isTupleAgainstObservedLambda(left, right)) {
    return compareFunctionLikeTlc(left, right, true) === 0;
  }
  return compareValues(left, right) === 0;
};

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
    if (left.kind === "LazyFunction" && left.enumerated) return isSame(left.enumerated, right);
    if (right.kind === "LazyFunction" && right.enumerated) return isSame(left, right.enumerated);
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

// The canonical copy of each set and function a search has stored, in an open-addressed table
// whose slots hold a value's hash and its position in values plus one, so that equal values in
// states share one object.
export const createCanonicalizer = () => {
  let slots = new Int32Array(1 << 11);
  const values: Value[] = [];
  const insert = (hash: number, position: number) => {
    const mask = slots.length - 1;
    let slot = (Math.imul(hash, 0x9e3779b1) >>> 0) & mask & ~1;
    while (slots[slot + 1] !== 0) slot = (slot + 2) & mask;
    slots[slot] = hash;
    slots[slot + 1] = position + 1;
  };
  const canonicalize = (value: Value): Value => {
    if (typeof value !== "object" || (value.kind !== "Set" && value.kind !== "Function")) {
      return value;
    }
    const hash = getValueHash(value);
    const mask = slots.length - 1;
    for (
      let slot = (Math.imul(hash, 0x9e3779b1) >>> 0) & mask & ~1;
      slots[slot + 1] !== 0;
      slot = (slot + 2) & mask
    ) {
      if (slots[slot] !== hash) continue;
      const stored = values[slots[slot + 1] - 1];
      if (stored === value || isInterchangeableValue(stored, value)) return stored;
    }
    if (value.kind === "Set") canonicalizeElements(value.elements, canonicalize);
    else {
      canonicalizeElements(value.domain, canonicalize);
      canonicalizeElements(value.range, canonicalize);
    }
    values.push(value);
    if (values.length * 4 > slots.length) {
      slots = new Int32Array(slots.length * 2);
      values.forEach((stored, position) => insert(getValueHash(stored), position));
    } else {
      insert(hash, values.length - 1);
    }
    return value;
  };
  return (state: Value[]) => {
    for (let index = 0; index < state.length; index++) state[index] = canonicalize(state[index]);
    return state;
  };
};

interface TlcFunction {
  domain: Value[];
  range: Value[];
  low: number | undefined;
}

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
  forgetOwnWrittenOrder(value);
  const functionValue = toFiniteFunction(value);
  return isRecordDomain(functionValue.domain) ? functionValue : undefined;
};

const compareModelValueWith = (modelValue: ModelValue, other: Value, isEquality: boolean) => {
  checkModelValueTypes(other, modelValue, isEquality);
  return 1;
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
  return `Attempted to ${isEquality ? kind.equality : "compare"} ${kind.name} ${prettyPrint(formatValue(left))} with ${kind.other}:\n${prettyPrint(formatValue(right))}`;
};

const getComparisonVerb = (isEquality: boolean) => (isEquality ? "check equality of" : "compare");

const compareTlcFunctions = (
  functionValue: TlcFunction,
  left: Value,
  right: Value,
  isEquality: boolean,
) => {
  const other = toTlcFunction(right);
  if (!other) {
    if (isModelValue(right)) return compareModelValueWith(right, left, isEquality);
    throw new TlaEvaluationError(
      `Attempted to ${getComparisonVerb(isEquality)} the function ${prettyPrint(formatValue(left))} with the value:\n${prettyPrint(formatValue(right))}`,
    );
  }
  if (functionValue.range.length !== other.range.length)
    return functionValue.range.length - other.range.length;
  const compareRanges = () => compareElementsLikeTlc(functionValue.range, other.range, isEquality);
  if (functionValue.low !== undefined && functionValue.range.length === 0) return 0;
  if (functionValue.low !== undefined && other.low !== undefined) {
    return functionValue.low === other.low ? compareRanges() : functionValue.low - other.low;
  }
  const intervalLow = functionValue.low ?? other.low;
  if (intervalLow === undefined) {
    return (
      compareElementsLikeTlc(functionValue.domain, other.domain, isEquality) || compareRanges()
    );
  }
  const keys = functionValue.low === undefined ? functionValue.domain : other.domain;
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    if (typeof key !== "number") {
      throw new TlaEvaluationError(
        `Attempted to compare ${isEquality ? "an " : ""}integer with non-integer${isEquality || functionValue.low !== undefined ? ":" : ""}\n${prettyPrint(formatValue(key))}.`,
      );
    }
    const difference =
      functionValue.low === undefined ? key - (intervalLow + index) : intervalLow + index - key;
    if (difference !== 0) return difference;
  }
  return compareRanges();
};

const compareElementsLikeTlc = (left: Value[], right: Value[], isEquality: boolean) => {
  const sets = setTrace.sets;
  for (let index = 0; index < left.length; index++) {
    sets?.push(left[index]);
    const comparison = compareOrEqualLikeTlc(left[index], right[index], isEquality);
    sets?.pop();
    if (comparison !== 0) return comparison;
  }
  return 0;
};

const compareFunctionLikeTlc = (
  left: FunctionValue | LazyFunctionValue,
  right: Value,
  isEquality: boolean,
) => {
  const functionValue = toFiniteFunction(left);
  if (getFunctionClass(left) === "tuple") {
    const tuple = isFunctionValue(right) ? getSequenceElements(right) : undefined;
    if (!tuple) return compareTlcFunctions({ ...functionValue, low: 1 }, left, right, isEquality);
    return (
      functionValue.range.length - tuple.length ||
      compareElementsLikeTlc(functionValue.range, tuple, isEquality)
    );
  }
  if (getFunctionClass(left) === "record") {
    const record = toTlcRecord(right);
    if (!record) {
      if (isModelValue(right)) return compareModelValueWith(right, left, isEquality);
      throw new TlaEvaluationError(
        `Attempted to ${getComparisonVerb(isEquality)} record:\n${prettyPrint(formatValue(left))}\nwith non-record\n${prettyPrint(formatValue(right))}`,
      );
    }
    return (
      functionValue.domain.length - record.domain.length ||
      compareElementsLikeTlc(functionValue.domain, record.domain, isEquality) ||
      compareElementsLikeTlc(functionValue.range, record.range, isEquality)
    );
  }
  return compareTlcFunctions(
    { ...functionValue, low: getIntervalLow(left, functionValue.domain) },
    left,
    right,
    isEquality,
  );
};

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
  const charged = getChargedSet(right);
  const other = isEnumeratedSet(right)
    ? right
    : charged
      ? toChargedSet(charged, false, charged.kind === "Subset" ? toFiniteSet : toArgumentSet)
      : toArgumentSet(right);
  return { elements: toFiniteSet(left).elements, otherElements: toFiniteSet(other).elements };
};

const compareSetLikeTlc = (left: ObjectValue, right: Value, isEquality: boolean): number => {
  // TLC's UserValue#compareTo puts STRING, Nat, Int and Seq(S) after any model value, typed or not.
  if (isOverriddenSet(left) && isModelValue(right)) return 1;
  // TLC's SetOfFcnsValue, SetOfRcdsValue and SetOfTuplesValue compare their elements, though they test equality by component.
  if (
    !isEquality &&
    (left.kind === "FunctionSet" || left.kind === "RecordSet" || left.kind === "ProductSet")
  ) {
    const charged = getChargedSet(left);
    return compareSetLikeTlc(
      charged ? toChargedSet(charged, true, toCachedSet) : toCachedSet(left),
      right,
      false,
    );
  }
  if (isComparedByClass(left, right)) {
    if (!isEquality) return compareValues(left, right);
    return valuesEqual(left, right) ? 0 : 1;
  }
  if (!isEnumeratedSet(left)) {
    const charged = getChargedSet(left);
    const set = charged ? toChargedSet(charged, true, toCachedSet) : toCachedSet(left);
    return compareSetLikeTlc(set, right, isEquality);
  }
  if (!isSetValue(right)) {
    if (isModelValue(right)) return compareModelValueWith(right, left, isEquality);
    throw new TlaEvaluationError(
      `Attempted to ${getComparisonVerb(isEquality)} the set ${prettyPrint(formatValue(left))} with the value:\n${prettyPrint(formatValue(right))}`,
    );
  }
  const sets = getSetElementsLikeTlc(left, right);
  return (
    sets.elements.length - sets.otherElements.length ||
    compareElementsLikeTlc(sets.elements, sets.otherElements, isEquality)
  );
};

const compareOrEqualLikeTlc = (left: Value, right: Value, isEquality: boolean): number => {
  if (typeof left !== "object") {
    if (typeof right === typeof left) {
      if (!isEquality) return compareValues(left, right);
      return left === right ? 0 : 1;
    }
    if (isModelValue(right)) return compareModelValueWith(right, left, isEquality);
    throw new TlaEvaluationError(describeScalarMismatch(left, right, isEquality));
  }
  if (left.kind === "ModelValue") {
    if (left.type !== undefined) checkModelValueTypes(left, right, isEquality);
    if (!isModelValue(right)) return -1;
    if (!isEquality) return left.rank - right.rank;
    return left.name === right.name ? 0 : 1;
  }
  if (isFunctionValue(left)) return compareFunctionLikeTlc(left, right, isEquality);
  return compareSetLikeTlc(left, right, isEquality);
};

const compareLikeTlc = (left: Value, right: Value) => compareOrEqualLikeTlc(left, right, false);

const equalsLikeTlc = (left: Value, right: Value) => compareOrEqualLikeTlc(left, right, true) === 0;

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

const searchLikeTlc = (element: Value, sorted: Value[]) => {
  let low = 0;
  let high = sorted.length;
  while (low < high) {
    const middle = low + ((high - low) >> 1);
    const comparison = callTracedMethod(element, () => compareLikeTlc(element, sorted[middle]));
    if (comparison === 0) return { index: middle, isFound: true };
    if (comparison < 0) high = middle;
    else low = middle + 1;
  }
  return { index: low, isFound: false };
};

const isElementOfLikeTlc = (element: Value, elements: Value[]) =>
  elements.some((member) => callTracedMethod(member, () => equalsLikeTlc(member, element)));

export const getWrittenElements = (set: SetValue | MixedSetValue) =>
  set.kind === "MixedSet"
    ? (set.enumerated?.elements ?? set.elements)
    : isNormalizedSet(set)
      ? set.elements
      : (set.writtenElements ?? set.elements);

const MAXIMUM_MARK_DEPTH = 1000;

// A value that markNormalized walked once, as the constants that share the runtime's heap do, it
// doesn't walk again. Values nested deeper than MAXIMUM_MARK_DEPTH wait in a list rather than on
// the stack.
const markNormalizedWithin = (
  value: Value,
  depth: number,
  deeper: Value[] | undefined,
): Value[] | undefined => {
  if (typeof value !== "object") return deeper;
  if (depth === MAXIMUM_MARK_DEPTH) {
    const pending = deeper ?? [];
    pending.push(value);
    return pending;
  }
  let pending = deeper;
  if (value.kind === "Set" && (value.flags & VALUE_DEEPLY_NORMALIZED) === 0) {
    value.flags |= VALUE_NORMALIZED | VALUE_DEEPLY_NORMALIZED;
    for (let index = 0; index < value.elements.length; index++) {
      pending = markNormalizedWithin(value.elements[index], depth + 1, pending);
    }
  }
  if (value.kind === "Function" && (value.flags & VALUE_DEEPLY_NORMALIZED) === 0) {
    value.flags |= VALUE_DEEPLY_NORMALIZED;
    value.writtenKeys = undefined;
    for (let index = 0; index < value.domain.length; index++) {
      pending = markNormalizedWithin(value.domain[index], depth + 1, pending);
      pending = markNormalizedWithin(value.range[index], depth + 1, pending);
    }
  }
  return pending;
};

export const markNormalized = (value: Value): void => {
  const deeper = markNormalizedWithin(value, 0, undefined);
  for (let inner = deeper?.pop(); inner !== undefined; inner = deeper?.pop()) {
    markNormalizedWithin(inner, 0, deeper);
  }
};

export const normalizeShallowly = (value: Value): void => {
  if (typeof value !== "object" || isCachedSet(value)) return;
  if (value.kind === "Set") {
    value.flags |= VALUE_NORMALIZED;
    return;
  }
  if (value.kind === "MixedSet") {
    toFiniteSet(value);
    return;
  }
  const sets = setTrace.sets;
  sets?.push(value);
  switch (value.kind) {
    case "FilteredSet":
    case "Subset":
      normalizeShallowly(value.base);
      break;
    case "SetOperation":
      if (value.operator !== "\\cup") {
        normalizeShallowly(value.left);
        normalizeShallowly(value.right);
      }
      break;
    case "FunctionSet":
      normalizeShallowly(value.domain);
      normalizeShallowly(value.range);
      break;
    case "RecordSet":
      value.sets.forEach(normalizeShallowly);
      break;
    case "ProductSet":
      value.factors.forEach(normalizeShallowly);
  }
  sets?.pop();
};

const isUnenumeratedSet = (value: Value): value is ConvertibleSetValue =>
  typeof value === "object" && isLazySet(value) && value.enumerated === undefined;

// TLC's SetEnumValue#equals enumerates the right side before it sorts a set literal on the left.
const isFailingLikeTlc = (left: Value, right: Value) =>
  typeof left === "object" &&
  ((left.kind === "Function" && isTupleAgainstObservedLambda(left, right)) ||
    (isSetValue(left) &&
      !isModelValue(right) &&
      (isComparedByClass(left, right) ||
        (isSetValue(right) &&
          (isUnenumeratedSet(left) ? left.kind !== "MixedSet" : isUnenumeratedSet(right))))));

export const isEqualLikeTlc = (left: Value, right: Value) =>
  computeLikeTlcOnFailure(valuesEqual, equalsLikeTlc, left, right, isFailingLikeTlc);

export const isReceiverEqual = (left: Value, right: Value) => {
  const sets = setTrace.sets;
  if (sets === undefined) return isEqualLikeTlc(left, right);
  sets.push(left);
  const isEqual = isEqualLikeTlc(left, right);
  sets.pop();
  return isEqual;
};

const compareReceiver = (left: Value, right: Value) => {
  const sets = setTrace.sets;
  if (sets === undefined) return compareLikeTlc(left, right);
  sets.push(left);
  const comparison = compareLikeTlc(left, right);
  sets.pop();
  return comparison;
};

// TLC's ValueVec#sort compares each element with the ones before it, which orders what lazy elements evaluate.
const isStrictlySorted = (elements: Value[]) => {
  for (let index = 1; index < elements.length; index++) {
    if (compareValues(elements[index], elements[index - 1]) <= 0) return false;
  }
  return true;
};

const isAscendingIntegers = (elements: Value[]) => {
  for (let index = 0; index < elements.length; index++) {
    const element = elements[index];
    const previous = index > 0 ? elements[index - 1] : undefined;
    if (typeof element !== "number" || (typeof previous === "number" && previous >= element)) {
      return false;
    }
  }
  return true;
};

export const createSet = (elements: Value[]): SetValue => {
  for (let index = 1; index < elements.length; index++) cacheSet(elements[index]);
  if (elements.length < 2 || isStrictlySorted(elements)) return createSortedSet(elements);
  const sorted = [...elements].sort(compareValues);
  const unique = [sorted[0]];
  for (let index = 1; index < sorted.length; index++) {
    if (compareValues(unique[unique.length - 1], sorted[index]) !== 0) unique.push(sorted[index]);
  }
  return createSortedSet(unique);
};

// TLC sorts a set literal only once an operation needs it sorted, so a lazy function or a filter the sort would evaluate keeps the literal unsorted.
let isSortingLiteral = false;

export const createEnumeratedSet = (elements: Value[]): SetValue | MixedSetValue => {
  if (isAscendingIntegers(elements)) return createSortedSet(elements);
  const isOuterSorting = isSortingLiteral;
  isSortingLiteral = true;
  try {
    const set = computeLikeTlcOnFailure<Value[], undefined, SetValue | MixedSetValue>(
      createSet,
      (mixed) => ({ kind: "MixedSet", elements: mixed }),
      elements,
      undefined,
    );
    if (set.kind === "Set" && set.elements !== elements) set.writtenElements = elements;
    return set;
  } finally {
    isSortingLiteral = isOuterSorting;
  }
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

// A key that holds no written order, so comparing it forgets none: TLC compares such keys without
// anything observable but the result. An untyped model value compares with any other value but a
// function's key without failing.
const isOrderless = (value: Value): boolean =>
  typeof value !== "object" ||
  (value.kind === "ModelValue" && value.type === undefined) ||
  (value.kind === "Function" &&
    ((value.flags & VALUE_SELF_COMPARED) !== 0 ||
      (value.writtenKeys === undefined &&
        value.domain.every(isOrderlessKey) &&
        value.range.every(isOrderless))));

const isOrderlessKey = (key: Value) => !isModelValue(key) && isOrderless(key);

const hasOrderlessKeys = (functionValue: FunctionValue) => {
  if ((functionValue.flags & VALUE_KEYS_ORDERLESS) !== 0) return true;
  if (!functionValue.domain.every(isOrderless)) return false;
  functionValue.flags |= VALUE_KEYS_ORDERLESS;
  return true;
};

// The keys and values of two sorted domains, merged by searching the longer for each key of the
// shorter, or undefined where two keys compare equal.
const mergeSorted = (
  domain: Value[],
  range: Value[],
  otherDomain: Value[],
  otherRange: Value[],
): [Value[], Value[]] | undefined => {
  const isOtherShorter = otherDomain.length <= domain.length;
  const longKeys = isOtherShorter ? domain : otherDomain;
  const longValues = isOtherShorter ? range : otherRange;
  const shortKeys = isOtherShorter ? otherDomain : domain;
  const shortValues = isOtherShorter ? otherRange : range;
  const mergedKeys: Value[] = [];
  const mergedValues: Value[] = [];
  let taken = 0;
  const takeUntil = (position: number) => {
    for (; taken < position; taken++) {
      mergedKeys.push(longKeys[taken]);
      mergedValues.push(longValues[taken]);
    }
  };
  for (let index = 0; index < shortKeys.length; index++) {
    const key = shortKeys[index];
    let low = taken;
    let high = longKeys.length;
    while (low < high) {
      const middle = (low + high) >> 1;
      const comparison = compareValues(longKeys[middle], key);
      if (comparison === 0) return undefined;
      if (comparison < 0) low = middle + 1;
      else high = middle;
    }
    takeUntil(low);
    mergedKeys.push(key);
    mergedValues.push(shortValues[index]);
  }
  takeUntil(longKeys.length);
  return [mergedKeys, mergedValues];
};

// f @@ g as TLC's CombineFcn: f's pairs, then those of g whose keys equal none of f's, written in
// that order. The keys sort by merging the sorted domains where comparing them forgets nothing and
// can't fail, and by sorting every pair otherwise.
export const combineFunctions = (left: FunctionValue, right: FunctionValue): FunctionValue => {
  const leftKeys = getWrittenKeys(left);
  const rightKeys = getWrittenKeys(right);
  const dropped =
    findDroppedKeys(left, right) ??
    new Set(rightKeys.filter((key) => leftKeys.some((leftKey) => isEqualLikeTlc(key, leftKey))));
  const keys = [...leftKeys, ...rightKeys.filter((key) => !dropped.has(key))];
  const merged = mergeCombined(left, right, dropped);
  if (!merged) {
    const leftPairs = getWrittenPairs(left);
    const addedPairs = getWrittenPairs(right).filter((pair) => !dropped.has(pair[0]));
    return createWrittenFunction([...leftPairs, ...addedPairs]);
  }
  const combined = createSortedFunction(merged[0], merged[1]);
  combined.flags |= VALUE_KEYS_ORDERLESS;
  return keys.every((key, index) => key === combined.domain[index])
    ? combined
    : setWrittenOrder(combined, keys);
};

// The keys of g that equal one of f's, found by searching g's sorted domain for each key of f where
// no key holds a written order to forget, as TLC's equality loop finds them; or undefined, for the
// loop to find them, where a comparison fails.
const findDroppedKeys = (left: FunctionValue, right: FunctionValue) => {
  if (!hasOrderlessKeys(left) || !hasOrderlessKeys(right)) return undefined;
  const dropped = new Set<Value>();
  try {
    left.domain.forEach((key) => {
      const index = findSortedIndex(right.domain, key);
      if (index !== -1) dropped.add(right.domain[index]);
    });
  } catch (error) {
    // TLC's loop reports whatever equality fails as it always has.
    if (error instanceof TlaEvaluationError) return undefined;
    throw error;
  }
  return dropped;
};

const mergeCombined = (left: FunctionValue, right: FunctionValue, dropped: Set<Value>) => {
  const addedDomain =
    dropped.size === 0 ? right.domain : right.domain.filter((key) => !dropped.has(key));
  const addedRange =
    dropped.size === 0
      ? right.range
      : right.range.filter((_, index) => !dropped.has(right.domain[index]));
  if (
    !hasOrderlessKeys(left) ||
    !(dropped.size === 0 ? hasOrderlessKeys(right) : addedDomain.every(isOrderless))
  ) {
    return undefined;
  }
  try {
    return mergeSorted(left.domain, left.range, addedDomain, addedRange);
  } catch (error) {
    // Sorting every pair reports whatever comparison fails as it always has.
    if (error instanceof TlaEvaluationError) return undefined;
    throw error;
  }
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

// The elements of an interval, which keep it: a function whose domain they are has the interval as
// its domain, as TLC's functions over an interval keep it. An array made from them is a plain array.
class IntervalElements extends Array<Value> {
  static override get [Symbol.species]() {
    return Array;
  }

  readonly interval: IntervalValue;

  constructor(interval: IntervalValue) {
    // Sized up front: pushing onto an Array subclass costs about 30 times as much per element.
    super(Math.max(interval.high - interval.low + 1, 0));
    this.interval = interval;
    for (let index = 0; index < this.length; index++) this[index] = interval.low + index;
  }
}

const MAX_SHARED_INTERVAL_LENGTH = 1024;
// The elements of 1..length for each length up to MAX_SHARED_INTERVAL_LENGTH, which every function
// over one of them shares.
const intervalDomains: IntervalElements[] = [];

const getIntervalDomain = (length: number): Value[] => {
  const shared = intervalDomains[length];
  if (shared) return shared;
  const domain = new IntervalElements({ kind: "Interval", low: 1, high: length });
  if (length <= MAX_SHARED_INTERVAL_LENGTH) intervalDomains[length] = domain;
  return domain;
};

// The kind of the mark that stands for 1..n, the elements of an array of their own class, in a
// copy of a value that encodeGraph holds.
const INTERVAL_MARK = "IntervalElements";

interface IntervalMark {
  kind: typeof INTERVAL_MARK;
  length: number;
}

const isIntervalMark = (value: object): value is IntervalMark =>
  Reflect.get(value, "kind") === INTERVAL_MARK;

// Copies of values of plain objects and arrays, which share what the values share, as encodeGraph
// holds them, with a mark for each array of 1..n. A value that holds a function, as a lazy one
// does, keeps it, which encodeGraph rejects.
export const getPlainValues = (values: Value[]): unknown[] => {
  const copies = new Map<object, unknown>();
  const copy = (value: unknown): unknown => {
    if (typeof value !== "object" || value === null) return value;
    const known = copies.get(value);
    if (known !== undefined) return known;
    if (value instanceof IntervalElements) {
      const mark: IntervalMark = { kind: INTERVAL_MARK, length: value.length };
      copies.set(value, mark);
      return mark;
    }
    if (Array.isArray(value)) {
      const array: unknown[] = [];
      copies.set(value, array);
      for (const item of value) array.push(copy(item));
      return array;
    }
    const object: Record<string, unknown> = {};
    copies.set(value, object);
    for (const [key, item] of Object.entries(value)) object[key] = copy(item);
    return object;
  };
  return values.map(copy);
};

// The values that getPlainValues copied, as decodeGraph reads them, made values again in place: each
// mark its array of 1..n, and what made the values noted, as it is where a check makes them.
export const readPlainValues = (plain: unknown[]): Value[] => {
  const isRead = new Set<object>();
  const read = (value: unknown): unknown => {
    if (typeof value !== "object" || value === null) return value;
    if (isIntervalMark(value)) return getIntervalDomain(value.length);
    if (isRead.has(value)) return value;
    isRead.add(value);
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index++) value[index] = read(value[index]);
      return value;
    }
    for (const key of Object.keys(value)) Reflect.set(value, key, read(Reflect.get(value, key)));
    const kind: unknown = Reflect.get(value, "kind");
    if (kind === "Union" || kind === "SetOperation") hasStreamedSet = true;
    if (Reflect.get(value, "writtenKeys") !== undefined) isWrittenOrderUsed = true;
    return value;
  };
  return plain.map((value) => read(value) as Value);
};

export const getIntervalElements = (value: IntervalValue): Value[] => {
  getCardinality(value);
  if (value.low === 1 && value.high >= 1) return getIntervalDomain(value.high);
  const elements: number[] = [];
  for (let element = value.low; element <= value.high; element++) elements.push(element);
  return elements;
};

const isIntervalDomain = (domain: Value[]) => domain instanceof IntervalElements;

export const getFunctionDomain = (set: Value, isBounded = true): Value[] => {
  const elements = isBounded ? toFiniteSet(set).elements : getUnboundedElements(set);
  return isIntervalDomain(elements) && !(typeof set === "object" && set.kind === "Interval")
    ? [...elements]
    : elements;
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

// TLC's UnionValue streams S into UNION S, so -maxSetSize doesn't bound S.
const getUnionBase = (base: Value) =>
  typeof base === "object" && base.kind === "Set" ? base.elements : getStreamedElements(base);

const getUnionSet = (set: Value, index: number, union: UnionValue) => {
  if (isTlcEnumerable(set)) return set;
  throw new TlaEvaluationError(
    index === 0
      ? "Attempted to enumerate UNION(s), but some element of s is nonenumerable."
      : `Attempted to enumerate the nonenumerable set:\n${prettyPrint(formatValue(set))}\nwhen enumerating:\n${prettyPrint(formatUnion(union))}`,
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

const getCartesianProduct = (lists: Value[][], isBounded: boolean) => {
  const total = lists.reduce((product, list) => product * list.length, 1);
  if (isBounded && total > getMaximumSetSize()) {
    // TLC's toSetEnum doesn't catch the -maxSetSize failure, so the set it enumerates adds no frame.
    setTrace.sets?.pop();
    throw new TlaSetBoundError(getSetBoundMessage());
  }
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

export const getLazySubsets = (value: Value): Value[] | undefined => {
  if (typeof value !== "object" || value.kind !== "Subset" || isOverriddenSet(value.base)) {
    return undefined;
  }
  const sets = setTrace.sets;
  sets?.push(value);
  const base = toFiniteSet(value.base).elements;
  sets?.pop();
  if (base.length <= MAXIMUM_BUILT_SUBSET_BASE) return undefined;
  const costNode = value.cost?.node;
  let cursorIndex = -1;
  let indices = [0];
  const getSubset = (index: number) => {
    if (index <= cursorIndex) cursorIndex = -1;
    while (cursorIndex < index) {
      if (cursorIndex === -1) indices = [];
      else if (!advanceCombination(indices, base.length)) {
        indices = Array.from({ length: indices.length + 1 }, (_value, position) => position);
      }
      cursorIndex++;
    }
    const subset = createSortedSet(indices.map((baseIndex) => base[baseIndex]));
    return costNode === undefined ? subset : { ...subset, costNode };
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

const someSubset = (
  base: Value[],
  visit: (subset: SetValue) => boolean,
  costNode: number | undefined,
) => {
  for (let size = 0; size <= base.length; size++) {
    const indices = Array.from({ length: size }, (_value, index) => index);
    do {
      // eslint-disable-next-line unicorn/no-new-array
      const elements = new Array<Value>(size);
      for (let position = 0; position < size; position++)
        elements[position] = base[indices[position]];
      const subset = createSortedSet(elements);
      if (visit(costNode === undefined ? subset : { ...subset, costNode })) return true;
    } while (advanceCombination(indices, base.length));
  }
  return false;
};

const getSortedSubsets = (base: Value[], costNode: number | undefined) => {
  const subsets: SetValue[] = [];
  someSubset(
    base,
    (subset) => {
      subsets.push(subset);
      return false;
    },
    costNode,
  );
  return subsets;
};

const getSubsetBase = (value: SubsetValue) => {
  if (getCardinality(value.base) === 0) return [];
  if (!isSetValue(value.base)) {
    throw new TlaEvaluationError(
      `Attempted to compute the value of an expression of form\nSUBSET S, but S is a non-enumerable value:\n${prettyPrint(formatValue(value.base))}`,
    );
  }
  return toFiniteSet(value.base).elements;
};

const describeUnenumerableFunctionSet = (part: string, set: Value) =>
  `Attempted to enumerate a set of the form [D -> R],but the ${part}:\n${prettyPrint(formatValue(set))}\ncannot be enumerated.`;

const describeUnenumerableComponent = (value: RecordSetValue | ProductSetValue, index: number) =>
  value.kind === "RecordSet"
    ? `Attempted to enumerate a set of the form [l1 : v1, ..., ln : vn],\nbut can't enumerate the value of the \`${value.names[index]}' field:\n${prettyPrint(formatValue(value.sets[index]))}`
    : `Attempted to enumerate a set of the form s1 \\X s2 ... \\X sn,\nbut can't enumerate s${index}:\n${prettyPrint(formatValue(value.factors[index]))}`;

const getComponentElements = (
  value: RecordSetValue | ProductSetValue,
  getElements: (set: Value) => Value[],
) => {
  const sets = value.kind === "RecordSet" ? value.sets : value.factors;
  const lists: Value[][] = [];
  for (let index = 0; index < sets.length; index++) {
    const set = sets[index];
    if (isOverriddenSet(set)) {
      throw new TlaEvaluationError(describeUnenumerableComponent(value, index));
    }
    const elements = getElements(set);
    if (elements.length === 0) return [[]];
    lists.push(elements);
  }
  return lists;
};

const enumerateSetOperation = (value: SetOperationValue, opened: OpenedStream | undefined) => {
  if (value.operator === "\\cap" && !isTlcEnumerable(value.left) && !isTlcEnumerable(value.right)) {
    throw new TlaEvaluationError(
      `Attempted to enumerate S \\cap T when neither S:\n${prettyPrint(formatValue(value.left))}\nnor T:\n${prettyPrint(formatValue(value.right))}\nis enumerable`,
    );
  }
  if (value.operator === "\\" && !isTlcEnumerable(value.left)) {
    throw new TlaEvaluationError(
      `Attempted to enumerate S \\ T when S:\n${prettyPrint(formatValue(value.left))}\nis not enumerable.`,
    );
  }
  if (value.operator === "\\cup") {
    return toFiniteSet(createEnumeratedSet(listUnionLikeTlc(value, opened))).elements;
  }
  const isLeftEnumerated = value.operator === "\\" || isTlcEnumerable(value.left);
  const enumerated = isLeftEnumerated ? value.left : value.right;
  const other = isLeftEnumerated ? value.right : value.left;
  const kept: Value[] = [];
  const keep = (element: Value) => {
    if (isElementOf(element, other) === (value.operator === "\\cap")) {
      addBoundedElement(kept, element);
    }
    return false;
  };
  if (typeof enumerated === "object" && enumerated.kind === "Interval")
    forEachElement(enumerated, keep);
  else someOpenedElement(enumerated, opened ?? openSetStream(enumerated), keep);
  return toFiniteSet(createEnumeratedSet(kept)).elements;
};

// TLC's elements() streams [S -> T], [l : S], S \X T and set filters past -maxSetSize, which bounds only toSetEnum.
const getUnboundedElements = (value: Value): Value[] => {
  if (
    typeof value !== "object" ||
    (value.kind !== "FunctionSet" &&
      value.kind !== "RecordSet" &&
      value.kind !== "ProductSet" &&
      value.kind !== "FilteredSet") ||
    value.enumerated
  ) {
    return toFiniteSet(value).elements;
  }
  // TLC's toSetEnum frames the set only as its elements() opens it.
  const opened = setTrace.sets ? openOperandStream(value, false) : undefined;
  const isOuterSorting = isSortingLiteral;
  isSortingLiteral = false;
  let elements: Value[];
  try {
    elements = enumerateSet(value, false, undefined, opened);
  } finally {
    isSortingLiteral = isOuterSorting;
  }
  const set = value.kind === "RecordSet" ? createSet(elements) : createSortedSet(elements);
  if (elements.length <= getMaximumSetSize()) value.enumerated = set;
  return set.elements;
};

// TLC streams SUBSET S into a product it collects, so the product fails past -maxSetSize before SUBSET S overflows.
const getCollectedComponent = (set: Value) => {
  const subsets = getLazySubsets(set);
  return subsets !== undefined && subsets.length > getMaximumSetSize()
    ? subsets
    : getUnboundedElements(set);
};

const enumerateSet = (
  value: Value,
  isBounded = true,
  getElements = isBounded ? getCollectedComponent : getUnboundedElements,
  opened?: OpenedStream,
): Value[] => {
  if (typeof value !== "object")
    throw new TlaEvaluationError(`Expected a set but found ${formatValue(value)}`);
  const product = getPredicatedProduct(value);
  if (product) {
    const elements = getPulledElements(getProductStream(product, opened), isBounded);
    // TLC's toSetEnum collects the stream, which S \cup T and UNION S leave unsorted, and normalizes it.
    return isStreamedApart(product) ? sortLikeTlc(elements) : elements;
  }
  switch (value.kind) {
    case "Set":
      return value.elements;
    case "MixedSet":
      return sortLikeTlc(value.elements);
    case "Interval":
      getCardinality(value);
      return value.low === 1 && value.high >= 1
        ? getIntervalDomain(value.high)
        : new IntervalElements(value);
    case "Subset": {
      const base = getSubsetBase(value);
      if (base.length > MAXIMUM_ENUMERATED_SUBSET_BASE) {
        throw new TlaEvaluationError(describeOverflow(value));
      }
      return getSortedSubsets(base, value.cost?.node);
    }
    case "FunctionSet": {
      if (!isVersion174 && isEmptySet(value)) return [];
      if (isOverriddenSet(value.domain)) {
        throw new TlaEvaluationError(describeUnenumerableFunctionSet("domain D", value.domain));
      }
      const domain = getFunctionDomain(value.domain);
      if ((domain.length > 0 || isVersion174) && isOverriddenSet(value.range)) {
        throw new TlaEvaluationError(describeUnenumerableFunctionSet("range R", value.range));
      }
      const range = domain.length === 0 ? [] : getElements(value.range);
      return getCartesianProduct(
        domain.map(() => range),
        isBounded,
      ).map((combination): Value => createSortedFunction(domain, combination));
    }
    case "RecordSet": {
      if (!isVersion174 && isEmptySet(value)) return [];
      const fields = getComponentElements(value, getElements);
      return getCartesianProduct(fields, isBounded).map((combination) =>
        createSortedRecord(value.names, combination),
      );
    }
    case "ProductSet": {
      if (!isVersion174 && isEmptySet(value)) return [];
      const factors = getComponentElements(value, getElements);
      return getCartesianProduct(factors, isBounded).map(createTuple);
    }
    case "FilteredSet": {
      if (!isSetValue(value.base) || isOverriddenSet(value.base)) {
        throw new TlaEvaluationError(
          `Attempted to enumerate { x \\in S : p(x) } when S:\n${prettyPrint(formatValue(value.base))}\nis not enumerable`,
        );
      }
      const test = value.startPass?.(true).test ?? getPlainTest(value);
      const kept: Value[] = [];
      someOpenedElement(value.base, opened ?? openSetStream(value.base), (element) => {
        if (!test(element)) return false;
        if (isBounded) addBoundedElement(kept, element);
        else kept.push(element);
        return false;
      });
      return toFiniteSet(createEnumeratedSet(kept)).elements;
    }
    case "Union": {
      const elements: Value[] = [];
      (opened ? getOpenedUnionSets(value, opened) : getUnionSets(value, getUnionBase)).forEach(
        (set, index) => {
          const unionSet = getUnionSet(set, index, value);
          if (isBeyondSetBound(unionSet)) throw new TlaSetBoundError(getSetBoundMessage());
          (opened && index === 0 && isEnumeratedSet(value.base)
            ? getOpenedElements(unionSet, opened)
            : getStreamedElements(unionSet)
          ).forEach((element) => addBoundedElement(elements, element));
        },
      );
      return toFiniteSet(createEnumeratedSet(elements)).elements;
    }
    case "SetOperation":
      return enumerateSetOperation(value, opened);
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
  return convertSet(value, lazy, false);
};

const convertSet = (
  value: Value,
  lazy: ConvertibleSetValue | undefined,
  isFramedAsOpened: boolean,
) => {
  if (isSortingLiteral && lazy !== undefined && isPredicated(lazy) && hasObservedFilter(lazy)) {
    throw new TlaEvaluationError("The set literal holds a filter");
  }
  const sets = setTrace.sets;
  if (!isFramedAsOpened) sets?.push(value);
  const isOuterSorting = isSortingLiteral;
  isSortingLiteral = isOuterSorting && lazy?.kind === "MixedSet";
  let elements: Value[];
  try {
    elements = isFramedAsOpened
      ? enumerateSet(value, true, undefined, openOperandStream(value, false))
      : enumerateSet(value);
  } finally {
    isSortingLiteral = isOuterSorting;
  }
  if (!isFramedAsOpened) sets?.pop();
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

// TLC's toSetEnum frames S \cup T, S \cap T, S \ T and UNION S only as their elements() opens them.
const toOpenedSet = (value: SetOperationValue | UnionValue) =>
  setTrace.sets !== undefined && !value.enumerated
    ? convertSet(value, value, true)
    : toFiniteSet(value);

// TLC's toSetEnum keeps nothing, so a filter inside runs again on the next conversion.
const toArgumentSet = (value: Value) => {
  const lazy = typeof value === "object" && isLazySet(value) ? value : undefined;
  if (lazy === undefined || lazy.enumerated) return toFiniteSet(value);
  const isRepeated = isPredicated(lazy) && hasObservedFilter(lazy);
  const set =
    lazy.kind === "SetOperation" || lazy.kind === "Union" ? toOpenedSet(lazy) : toFiniteSet(lazy);
  if (isRepeated) lazy.enumerated = undefined;
  return set;
};

type CostedSetValue =
  | SubsetValue
  | FunctionSetValue
  | RecordSetValue
  | ProductSetValue
  | SetOperationValue
  | UnionValue;

export const getChargedSet = (value: Value): CostedSetValue | undefined => {
  if (typeof value !== "object") return undefined;
  switch (value.kind) {
    case "Subset":
    case "FunctionSet":
    case "RecordSet":
    case "ProductSet":
    case "SetOperation":
    case "Union":
      return value.cost?.charges === undefined ? undefined : value;
    default:
      return undefined;
  }
};

export const isCostedSet = (value: Value) => {
  if (typeof value !== "object") return false;
  switch (value.kind) {
    case "Subset":
    case "FunctionSet":
    case "RecordSet":
    case "ProductSet":
    case "SetOperation":
    case "Union":
      return (
        value.cost !== undefined &&
        (value.cost.node !== undefined || value.cost.charges !== undefined)
      );
    default:
      return false;
  }
};

const toCachedSet = (value: Value) => {
  cacheSet(value);
  return toFiniteSet(value);
};

const toChargedSet = (
  value: CostedSetValue,
  isCached: boolean,
  convert: (value: Value) => SetValue,
) => {
  // TLC's SetEnumValue#member scans an unsorted literal, so a literal whose sort charges a set stays unsorted.
  if (isSortingLiteral) throw new TlaEvaluationError("The set literal holds a charged set");
  const cost = value.cost;
  const node = cost?.node;
  const charges = cost?.charges;
  if (value.kind === "Subset") charges?.chargeSubsetConversion(value);
  else charges?.chargeSetEnumeration(value);
  const set = convert(value);
  if (value.kind === "Subset" && charges !== undefined && node !== undefined) {
    charges.secondary[node] += set.elements.length;
  }
  if (isCached && cost) cost.charges = undefined;
  return set;
};

const toComparedSet = (value: Value) =>
  typeof value === "object" && (value.kind === "SetOperation" || value.kind === "Union")
    ? toOpenedSet(value)
    : toFiniteSet(value);

interface ListStream {
  kind: "List";
  elements: Value[];
  position: number;
}

interface FilterStream {
  kind: "Filter";
  set: FilteredSetValue;
  base: ElementStream;
  test: (element: Value) => boolean;
  end: (() => void) | undefined;
}

interface ProductStream {
  kind: "Product";
  set: FunctionSetValue | RecordSetValue | ProductSetValue;
  domain: Value[];
  parts: ElementStream[];
  current: Value[];
  isDone: boolean;
}

interface ConcatenatedStream {
  kind: "Concatenated";
  left: ElementStream;
  right: ElementStream;
}

interface SelectedStream {
  kind: "Selected";
  base: ElementStream;
  other: Value;
  isIntersection: boolean;
}

interface UnionedStream {
  kind: "Unioned";
  union: UnionValue;
  sets: Value[];
  index: number;
  part: ElementStream | undefined;
}

type ElementStream =
  | ListStream
  | FilterStream
  | ProductStream
  | ConcatenatedStream
  | SelectedStream
  | UnionedStream;

interface CupStream {
  kind: "Cup";
  left: OpenedStream | undefined;
  right: OpenedStream | undefined;
}

type OpenedStream = ElementStream | CupStream;

// TLC's enumerators of [S -> T], [a : S] and S \X T read ahead and reset their components, which shows when a component evaluates a predicate.
// hasFilter records an unconverted filter when the set was built. The filter can convert later, as TLC's SetPredValue does once it caches its elements.
const isPredicated = (value: Value): boolean => {
  if (typeof value !== "object") return false;
  switch (value.kind) {
    case "FilteredSet":
      return value.isCached !== true;
    case "SetOperation":
      return (
        value.hasFilter &&
        value.isCached !== true &&
        (isPredicated(value.left) || isPredicated(value.right))
      );
    case "Union":
      return (
        value.isCached !== true &&
        typeof value.base === "object" &&
        (value.base.kind === "Set" || value.base.kind === "MixedSet") &&
        hasPredicatedSet(value.base.elements)
      );
    case "FunctionSet":
    case "RecordSet":
    case "ProductSet":
      return isPredicatedProduct(value);
    default:
      return false;
  }
};

const isPredicatedProduct = (value: FunctionSetValue | RecordSetValue | ProductSetValue) =>
  value.hasFilter &&
  value.isCached !== true &&
  !value.enumerated &&
  (value.kind === "FunctionSet"
    ? isPredicated(value.range)
    : hasPredicatedSet(value.kind === "RecordSet" ? value.sets : value.factors));

const hasPredicatedSet = (sets: Value[]) => {
  for (let index = 0; index < sets.length; index++) {
    if (isPredicated(sets[index])) return true;
  }
  return false;
};

const hasObservedFilter = (value: Value): boolean => {
  if (typeof value !== "object") return false;
  switch (value.kind) {
    case "FilteredSet":
      return value.isTestObserved === true || hasObservedFilter(value.base);
    case "SetOperation":
      return hasObservedFilter(value.left) || hasObservedFilter(value.right);
    case "Union":
      return (
        typeof value.base === "object" &&
        (value.base.kind === "Set" || value.base.kind === "MixedSet") &&
        hasObservedSet(value.base.elements)
      );
    case "FunctionSet":
      return hasObservedFilter(value.range);
    case "RecordSet":
      return hasObservedSet(value.sets);
    case "ProductSet":
      return hasObservedSet(value.factors);
    default:
      return false;
  }
};

const hasObservedSet = (sets: Value[]) => {
  for (let index = 0; index < sets.length; index++) {
    if (hasObservedFilter(sets[index])) return true;
  }
  return false;
};

export const createFunctionSet = (
  domain: Value,
  range: Value,
  cost: SetCost | undefined,
): FunctionSetValue => ({
  kind: "FunctionSet",
  domain,
  range,
  hasFilter: isPredicated(range),
  cost,
});

export const createRecordSet = (
  names: string[],
  sets: Value[],
  cost: SetCost | undefined,
): RecordSetValue => ({
  kind: "RecordSet",
  names,
  sets,
  hasFilter: hasPredicatedSet(sets),
  cost,
});

export const createProductSet = (factors: Value[], cost: SetCost | undefined): ProductSetValue => ({
  kind: "ProductSet",
  factors,
  hasFilter: hasPredicatedSet(factors),
  cost,
});

export const createSetOperation = (
  operator: SetOperationValue["operator"],
  left: Value,
  right: Value,
  cost: SetCost | undefined,
): SetOperationValue => ({
  kind: "SetOperation",
  operator,
  left,
  right,
  hasFilter: isPredicated(left) || isPredicated(right),
  cost,
});

export const createUnion = (base: Value, cost: SetCost | undefined): UnionValue => ({
  kind: "Union",
  base,
  cost,
});

const getPredicatedProduct = (value: ObjectValue) =>
  (value.kind === "FunctionSet" || value.kind === "RecordSet" || value.kind === "ProductSet") &&
  isPredicatedProduct(value)
    ? value
    : undefined;

const EMPTY_STREAM: ListStream = { kind: "List", elements: [], position: 0 };

const getPlainTest = (value: FilteredSetValue) => (element: Value) => value.test(element, false);

// TLC's elements() checks that the set has an element and reads the first element of each component, which nextElement continues.
const openProductStream = (
  value: FunctionSetValue | RecordSetValue | ProductSetValue,
): ElementStream => {
  if (!isVersion174 && isEmptySet(value)) return EMPTY_STREAM;
  const stream: ProductStream = {
    kind: "Product",
    set: value,
    domain: [],
    parts: [],
    current: [],
    isDone: false,
  };
  if (value.kind === "FunctionSet") {
    openOperandStream(value.domain, true);
    if (isOverriddenSet(value.domain)) {
      throw new TlaEvaluationError(describeUnenumerableFunctionSet("domain D", value.domain));
    }
    stream.domain = getFunctionDomain(value.domain);
    if ((stream.domain.length > 0 || isVersion174) && isOverriddenSet(value.range)) {
      throw new TlaEvaluationError(describeUnenumerableFunctionSet("range R", value.range));
    }
  }
  const sets =
    value.kind === "FunctionSet"
      ? stream.domain.map(() => value.range)
      : value.kind === "RecordSet"
        ? value.sets
        : value.factors;
  for (let index = 0; index < sets.length; index++) {
    if (value.kind !== "FunctionSet" && isOverriddenSet(sets[index])) {
      throw new TlaEvaluationError(describeUnenumerableComponent(value, index));
    }
    const part = openPart(sets[index]);
    const element = getNextElement(part);
    if (element === undefined) return EMPTY_STREAM;
    stream.parts.push(part);
    stream.current.push(element);
  }
  return stream;
};

const openPart = (value: Value): ElementStream => {
  const sets = setTrace.sets;
  if (typeof value === "object" && value.kind === "FilteredSet" && !isCachedSet(value)) {
    sets?.push(value);
    if (!isTlcEnumerable(value.base)) toFiniteSet(value);
    const base = openPart(value.base);
    const pass = value.startPass?.(false);
    const stream: FilterStream = {
      kind: "Filter",
      set: value,
      base,
      test: pass?.test ?? getPlainTest(value),
      end: pass?.end,
    };
    sets?.pop();
    return stream;
  }
  if (
    typeof value === "object" &&
    (value.kind === "SetOperation" || value.kind === "Union") &&
    isPredicated(value)
  ) {
    return hasObservedFilter(value) || setTrace.sets !== undefined
      ? openStreamedPart(value)
      : computeLikeTlcOnFailure(openListPart, openStreamedPart, value, undefined);
  }
  const product = typeof value === "object" ? getPredicatedProduct(value) : undefined;
  if (product === undefined) return openListPart(value);
  sets?.push(product);
  const stream = openProductStream(product);
  sets?.pop();
  return stream;
};

const openListPart = (value: Value): ElementStream => ({
  kind: "List",
  elements: getStreamedElements(value),
  position: 0,
});

const openStreamedPart = (value: SetOperationValue | UnionValue) => {
  const sets = setTrace.sets;
  sets?.push(value);
  const stream = value.kind === "Union" ? openUnionPart(value) : openOperationPart(value);
  sets?.pop();
  return stream;
};

const openOperationPart = (value: SetOperationValue): ElementStream => {
  if (value.operator === "\\cup") {
    if (!isTlcEnumerable(value.left) || !isTlcEnumerable(value.right)) toFiniteSet(value);
    return { kind: "Concatenated", left: openPart(value.left), right: openPart(value.right) };
  }
  const isLeftDrawn = value.operator === "\\" || isTlcEnumerable(value.left);
  const drawn = isLeftDrawn ? value.left : value.right;
  if (!isTlcEnumerable(drawn)) toFiniteSet(value);
  return {
    kind: "Selected",
    base: openPart(drawn),
    other: isLeftDrawn ? value.right : value.left,
    isIntersection: value.operator === "\\cap",
  };
};

const openUnionPart = (value: UnionValue): UnionedStream => {
  const sets = getUnionSets(value);
  return {
    kind: "Unioned",
    union: value,
    sets,
    index: 0,
    part: sets.length > 0 ? openPart(getUnionSet(sets[0], 0, value)) : undefined,
  };
};

const restartPart = (stream: ProductStream, index: number) => {
  resetStream(stream.parts[index]);
  const element = getNextElement(stream.parts[index]);
  if (element === undefined) stream.isDone = true;
  else stream.current[index] = element;
};

const resetStream = (stream: ElementStream): void => {
  switch (stream.kind) {
    case "List":
      stream.position = 0;
      return;
    case "Filter": {
      resetStream(stream.base);
      const pass = stream.set.startPass?.(false);
      stream.test = pass?.test ?? getPlainTest(stream.set);
      stream.end = pass?.end;
      return;
    }
    case "Product":
      stream.isDone = false;
      for (let index = 0; index < stream.parts.length; index++) restartPart(stream, index);
      return;
    case "Concatenated":
      resetStream(stream.left);
      resetStream(stream.right);
      return;
    case "Selected":
      resetStream(stream.base);
      return;
    case "Unioned":
      stream.index = 0;
      stream.part =
        stream.sets.length > 0 ? openPart(getUnionSet(stream.sets[0], 0, stream.union)) : undefined;
  }
};

const getNextElement = (stream: ElementStream): Value | undefined => {
  switch (stream.kind) {
    case "List":
      return stream.position < stream.elements.length
        ? stream.elements[stream.position++]
        : undefined;
    case "Filter":
      for (
        let element = getNextElement(stream.base);
        element !== undefined;
        element = getNextElement(stream.base)
      ) {
        if (stream.test(element)) return element;
      }
      stream.end?.();
      return undefined;
    case "Product": {
      if (stream.isDone) return undefined;
      const elements = [...stream.current];
      stream.isDone = stream.parts.length === 0;
      for (let index = stream.parts.length - 1; index >= 0 && !stream.isDone; index--) {
        const element = getNextElement(stream.parts[index]);
        if (element !== undefined) {
          stream.current[index] = element;
          break;
        }
        if (index === 0) stream.isDone = true;
        else restartPart(stream, index);
      }
      const set = stream.set;
      return set.kind === "FunctionSet"
        ? createSortedFunction(stream.domain, elements)
        : set.kind === "RecordSet"
          ? createSortedRecord(set.names, elements)
          : createTuple(elements);
    }
    case "Concatenated":
      return getNextElement(stream.left) ?? getNextElement(stream.right);
    case "Selected":
      for (
        let element = getNextElement(stream.base);
        element !== undefined;
        element = getNextElement(stream.base)
      ) {
        if (isElementOf(element, stream.other) === stream.isIntersection) return element;
      }
      return undefined;
    case "Unioned":
      while (stream.part !== undefined) {
        const element = getNextElement(stream.part);
        if (element !== undefined) return element;
        stream.index++;
        stream.part =
          stream.index < stream.sets.length
            ? openPart(getUnionSet(stream.sets[stream.index], stream.index, stream.union))
            : undefined;
      }
      return undefined;
  }
};

const somePulledElement = (stream: ElementStream, visit: (element: Value) => boolean) => {
  for (
    let element = getNextElement(stream);
    element !== undefined;
    element = getNextElement(stream)
  ) {
    if (visit(element)) return true;
  }
  return false;
};

export interface ChargeTable {
  values: WeakMap<object, number>;
  secondary: number[];
  isMember: typeof isElementOf;
  chargeSetEnumeration: (set: Value) => void;
  chargeSubsetConversion: (set: SubsetValue) => void;
  chargeSubsetElements: (set: SubsetValue) => void;
  chargePrintedSize: (set: Value) => void;
  chargeIsEmpty: (set: Value) => void;
}

interface PlainStream {
  kind: "Plain";
  part: ElementStream;
}

interface ChargedLeafStream {
  kind: "ChargedLeaf";
  node: number;
  part: ElementStream;
}

interface ChargedProductStream {
  kind: "ChargedProduct";
  node: number;
  set: FunctionSetValue | RecordSetValue | ProductSetValue;
  domain: Value[];
  parts: ChargedStream[];
  current: Value[];
  isDone: boolean;
}

interface ChargedUnionStream {
  kind: "ChargedUnion";
  node: number;
  left: ChargedStream;
  right: ChargedStream;
}

interface ChargedSelectedStream {
  kind: "ChargedSelected";
  base: ChargedStream;
  other: Value;
  isIntersection: boolean;
}

interface ChargedFilterStream {
  kind: "ChargedFilter";
  node: number;
  set: FilteredSetValue;
  base: ChargedStream;
}

type ChargedStream =
  | PlainStream
  | ChargedLeafStream
  | ChargedProductStream
  | ChargedUnionStream
  | ChargedSelectedStream
  | ChargedFilterStream;

const EMPTY_CHARGED_STREAM: PlainStream = { kind: "Plain", part: EMPTY_STREAM };

export const getValueNode = (charges: ChargeTable, value: Value) => {
  if (typeof value !== "object") return undefined;
  switch (value.kind) {
    case "Subset":
    case "FunctionSet":
    case "RecordSet":
    case "ProductSet":
    case "SetOperation":
    case "Union":
      return value.cost?.node;
    case "Set":
      return charges.values.get(value) ?? value.costNode;
    default:
      return charges.values.get(value);
  }
};

const getChargedProduct = (charges: ChargeTable, value: Value) => {
  if (typeof value !== "object") return undefined;
  const product = getPredicatedProduct(value);
  if (product === undefined) return undefined;
  if (product.kind === "FunctionSet") {
    return isChargedPart(charges, product.range) ? product : undefined;
  }
  const sets = product.kind === "RecordSet" ? product.sets : product.factors;
  for (let index = 0; index < sets.length; index++) {
    if (!isChargedPart(charges, sets[index])) return undefined;
  }
  return product;
};

const isChargedUnion = (charges: ChargeTable, value: SetOperationValue): boolean =>
  value.operator === "\\cup" &&
  value.enumerated === undefined &&
  isPredicated(value) &&
  getValueNode(charges, value) !== undefined &&
  isTlcEnumerable(value.left) &&
  isTlcEnumerable(value.right) &&
  !isBeyondSetBound(value.left) &&
  !isBeyondSetBound(value.right) &&
  isChargedPart(charges, value.left) &&
  isChargedPart(charges, value.right);

export const getDrawnSet = (value: SetOperationValue) =>
  value.operator === "\\" || isTlcEnumerable(value.left) ? value.left : value.right;

const isChargedSelection = (charges: ChargeTable, value: SetOperationValue): boolean =>
  value.enumerated === undefined &&
  isPredicated(value) &&
  isTlcEnumerable(getDrawnSet(value)) &&
  isChargedPart(charges, getDrawnSet(value));

const isChargedOperation = (charges: ChargeTable, value: SetOperationValue) =>
  value.operator === "\\cup" ? isChargedUnion(charges, value) : isChargedSelection(charges, value);

const isChargedPart = (charges: ChargeTable, value: Value): boolean => {
  if (typeof value !== "object") return true;
  if (value.kind === "SetOperation") return isChargedOperation(charges, value);
  if (value.kind !== "FunctionSet" && value.kind !== "RecordSet" && value.kind !== "ProductSet") {
    return true;
  }
  return (
    getValueNode(charges, value) === undefined || getChargedProduct(charges, value) !== undefined
  );
};

const isChargedBase = (charges: ChargeTable, value: Value) =>
  typeof value === "object" &&
  (value.kind === "FilteredSet" ||
    value.kind === "Subset" ||
    (value.kind === "SetOperation"
      ? isChargedOperation(charges, value)
      : getChargedProduct(charges, value) !== undefined));

const getChargedFilterNode = (charges: ChargeTable, value: FilteredSetValue) =>
  isCachedSet(value) || !isChargedBase(charges, value.base)
    ? undefined
    : getValueNode(charges, value);

const openChargedPart = (charges: ChargeTable, value: Value): ChargedStream => {
  const node =
    typeof value !== "object" || value.kind === "FilteredSet" || value.kind === "Subset"
      ? undefined
      : getValueNode(charges, value);
  const sets = setTrace.sets;
  if (typeof value === "object" && value.kind === "FilteredSet") {
    const filterNode = getChargedFilterNode(charges, value);
    if (filterNode === undefined) return { kind: "Plain", part: openPart(value) };
    sets?.push(value);
    if (!isTlcEnumerable(value.base)) toFiniteSet(value);
    const stream: ChargedFilterStream = {
      kind: "ChargedFilter",
      node: filterNode,
      set: value,
      base: openChargedPart(charges, value.base),
    };
    sets?.pop();
    return stream;
  }
  if (typeof value === "object" && value.kind === "SetOperation" && value.operator !== "\\cup") {
    sets?.push(value);
    const drawn = getDrawnSet(value);
    const stream: ChargedSelectedStream = {
      kind: "ChargedSelected",
      base: openChargedPart(charges, drawn),
      other: drawn === value.left ? value.right : value.left,
      isIntersection: value.operator === "\\cap",
    };
    sets?.pop();
    return stream;
  }
  if (node !== undefined && typeof value === "object" && value.kind === "SetOperation") {
    sets?.push(value);
    const stream: ChargedUnionStream = {
      kind: "ChargedUnion",
      node,
      left: openChargedPart(charges, value.left),
      right: openChargedPart(charges, value.right),
    };
    sets?.pop();
    return stream;
  }
  const product =
    node === undefined || typeof value !== "object" ? undefined : getPredicatedProduct(value);
  if (node !== undefined && product !== undefined) {
    sets?.push(product);
    const stream = openChargedProduct(charges, product, node);
    sets?.pop();
    return stream;
  }
  if (typeof value === "object" && value.kind === "Subset" && value.cost?.node !== undefined) {
    if (value.cost.charges === undefined) {
      return { kind: "ChargedLeaf", node: value.cost.node, part: openPart(value) };
    }
    charges.chargeSubsetElements(value);
  }
  const part = openPart(value);
  return node === undefined ? { kind: "Plain", part } : { kind: "ChargedLeaf", node, part };
};

// TLC's isEmpty asks S \cup T, S \cap T, S \ T or { x \in S : p(x) } for its first element, which opens its enumerator.
const isChargedEmpty = (charges: ChargeTable, value: Value): boolean => {
  if (
    typeof value !== "object" ||
    (value.kind !== "SetOperation" &&
      value.kind !== "FilteredSet" &&
      value.kind !== "FunctionSet" &&
      value.kind !== "RecordSet" &&
      value.kind !== "ProductSet") ||
    (value.kind === "FilteredSet"
      ? getChargedFilterNode(charges, value) === undefined
      : (value.kind !== "SetOperation" || value.operator === "\\cup") &&
        getValueNode(charges, value) === undefined)
  ) {
    return isEmptySet(value);
  }
  const sets = setTrace.sets;
  sets?.push(value);
  const isEmpty =
    value.kind === "SetOperation" || value.kind === "FilteredSet"
      ? getNextChargedElement(charges, openChargedPart(charges, value)) === undefined
      : value.kind === "FunctionSet"
        ? !isEmptySet(value.domain) && isChargedEmpty(charges, value.range)
        : hasChargedEmptySet(charges, value.kind === "RecordSet" ? value.sets : value.factors);
  sets?.pop();
  return isEmpty;
};

const isEmptyLikeTlc = (charges: ChargeTable | undefined, value: Value) => {
  charges?.chargeIsEmpty(value);
  return isEmptySet(value);
};

const hasChargedEmptySet = (charges: ChargeTable, sets: Value[]) => {
  for (let index = 0; index < sets.length; index++) {
    if (isChargedEmpty(charges, sets[index])) return true;
  }
  return false;
};

const openChargedProduct = (
  charges: ChargeTable,
  value: FunctionSetValue | RecordSetValue | ProductSetValue,
  node: number,
): ChargedStream => {
  if (!isVersion174 && isChargedEmpty(charges, value)) return EMPTY_CHARGED_STREAM;
  const stream: ChargedProductStream = {
    kind: "ChargedProduct",
    node,
    set: value,
    domain: [],
    parts: [],
    current: [],
    isDone: false,
  };
  if (value.kind === "FunctionSet") {
    openOperandStream(value.domain, true);
    if (isOverriddenSet(value.domain)) {
      throw new TlaEvaluationError(describeUnenumerableFunctionSet("domain D", value.domain));
    }
    stream.domain = getFunctionDomain(value.domain);
    if ((stream.domain.length > 0 || isVersion174) && isOverriddenSet(value.range)) {
      throw new TlaEvaluationError(describeUnenumerableFunctionSet("range R", value.range));
    }
  }
  const sets =
    value.kind === "FunctionSet"
      ? stream.domain.map(() => value.range)
      : value.kind === "RecordSet"
        ? value.sets
        : value.factors;
  for (let index = 0; index < sets.length; index++) {
    if (value.kind !== "FunctionSet" && isOverriddenSet(sets[index])) {
      throw new TlaEvaluationError(describeUnenumerableComponent(value, index));
    }
    const part = openChargedPart(charges, sets[index]);
    const element = getNextChargedElement(charges, part);
    if (element === undefined) return EMPTY_CHARGED_STREAM;
    stream.parts.push(part);
    stream.current.push(element);
  }
  return stream;
};

const restartChargedPart = (charges: ChargeTable, stream: ChargedProductStream, index: number) => {
  resetChargedStream(charges, stream.parts[index]);
  const element = getNextChargedElement(charges, stream.parts[index]);
  if (element === undefined) stream.isDone = true;
  else stream.current[index] = element;
};

const resetChargedStream = (charges: ChargeTable, stream: ChargedStream): void => {
  switch (stream.kind) {
    case "Plain":
    case "ChargedLeaf":
      resetStream(stream.part);
      return;
    case "ChargedProduct":
      stream.isDone = false;
      for (let index = 0; index < stream.parts.length; index++)
        restartChargedPart(charges, stream, index);
      return;
    case "ChargedUnion":
      resetChargedStream(charges, stream.left);
      resetChargedStream(charges, stream.right);
      return;
    case "ChargedSelected":
    case "ChargedFilter":
      resetChargedStream(charges, stream.base);
  }
};

const getNextChargedElement = (charges: ChargeTable, stream: ChargedStream): Value | undefined => {
  switch (stream.kind) {
    case "Plain":
      return getNextElement(stream.part);
    case "ChargedLeaf":
      charges.secondary[stream.node]++;
      return getNextElement(stream.part);
    case "ChargedProduct": {
      if (stream.isDone) return undefined;
      const elements = [...stream.current];
      charges.secondary[stream.node] += Math.max(stream.parts.length, 1);
      stream.isDone = stream.parts.length === 0;
      for (let index = stream.parts.length - 1; index >= 0 && !stream.isDone; index--) {
        const element = getNextChargedElement(charges, stream.parts[index]);
        if (element !== undefined) {
          stream.current[index] = element;
          break;
        }
        if (index === 0) stream.isDone = true;
        else restartChargedPart(charges, stream, index);
      }
      const set = stream.set;
      return set.kind === "FunctionSet"
        ? createSortedFunction(stream.domain, elements)
        : set.kind === "RecordSet"
          ? createSortedRecord(set.names, elements)
          : createTuple(elements);
    }
    case "ChargedUnion":
      charges.secondary[stream.node]++;
      return (
        getNextChargedElement(charges, stream.left) ?? getNextChargedElement(charges, stream.right)
      );
    case "ChargedSelected":
      return getNextSelectedElement(charges, stream);
    case "ChargedFilter":
      return getNextFilteredElement(charges, stream);
  }
};

// V8 runs getNextChargedElement about 0.8% slower on PS under -coverage with this loop inline.
const getNextSelectedElement = (charges: ChargeTable, stream: ChargedSelectedStream) => {
  for (
    let element = getNextChargedElement(charges, stream.base);
    element !== undefined;
    element = getNextChargedElement(charges, stream.base)
  ) {
    if (charges.isMember(element, stream.other) === stream.isIntersection) return element;
  }
  return undefined;
};

const getNextFilteredElement = (charges: ChargeTable, stream: ChargedFilterStream) => {
  for (
    let element = getNextChargedElement(charges, stream.base);
    element !== undefined;
    element = getNextChargedElement(charges, stream.base)
  ) {
    charges.secondary[stream.node]++;
    if (stream.set.test(element, false)) return element;
  }
  return undefined;
};

const drainChargedStream = (charges: ChargeTable, stream: ChargedStream, isBounded: boolean) => {
  const elements: Value[] = [];
  for (
    let element = getNextChargedElement(charges, stream);
    element !== undefined;
    element = getNextChargedElement(charges, stream)
  ) {
    if (isBounded) addBoundedElement(elements, element);
    else elements.push(element);
  }
  return elements;
};

const drainChargedFilter = (charges: ChargeTable, value: FilteredSetValue) => {
  const node = getChargedFilterNode(charges, value);
  if (node === undefined || value.enumerated || !isTlcEnumerable(value.base) || isSortingLiteral) {
    return undefined;
  }
  const sets = setTrace.sets;
  sets?.push(value);
  const elements = drainChargedStream(
    charges,
    { kind: "ChargedFilter", node, set: value, base: openChargedPart(charges, value.base) },
    true,
  );
  sets?.pop();
  charges.secondary[node] += elements.length;
  const set = createSortedSet(toFiniteSet(createEnumeratedSet(elements)).elements);
  value.enumerated = set;
  return set.elements;
};

const hasChargedStream = (charges: ChargeTable, value: ObjectValue) =>
  value.kind === "FilteredSet"
    ? !value.enumerated &&
      isTlcEnumerable(value.base) &&
      getChargedFilterNode(charges, value) !== undefined
    : value.kind === "SetOperation"
      ? isChargedOperation(charges, value)
      : getChargedProduct(charges, value) !== undefined &&
        getValueNode(charges, value) !== undefined;

// TLC's x' \in S draws S through its enumerator, which charges its draws, and keeps nothing.
export const streamChargedSet = (charges: ChargeTable, value: Value) =>
  typeof value === "object" && hasChargedStream(charges, value)
    ? drainChargedStream(charges, openChargedPart(charges, value), false)
    : undefined;

export const isChargedMember = (
  charges: ChargeTable,
  element: Value,
  set: SubsetValue | UnionValue,
) => {
  const isSubset = set.kind === "Subset";
  const drawn = isSubset ? element : set.base;
  if (typeof drawn !== "object" || !hasChargedStream(charges, drawn)) return undefined;
  const sets = setTrace.sets;
  sets?.push(set);
  const stream = openChargedPart(charges, drawn);
  let isDecided = false;
  for (
    let item = getNextChargedElement(charges, stream);
    item !== undefined;
    item = getNextChargedElement(charges, stream)
  ) {
    if (isSubset ? !charges.isMember(item, set.base) : charges.isMember(element, item)) {
      isDecided = true;
      break;
    }
  }
  sets?.pop();
  return isSubset !== isDecided;
};

// TLC's toSetEnum drains the enumerator of [S -> T], [a : S], S \X T, S \cup T, S \cap T, S \ T or { x \in S : p(x) }, which charges its draws, then charges the set its size.
export const drainChargedSet = (charges: ChargeTable, value: Value) => {
  if (typeof value !== "object") return undefined;
  if (value.kind === "FilteredSet") return drainChargedFilter(charges, value);
  const node = getValueNode(charges, value);
  const drained =
    value.kind === "SetOperation"
      ? isChargedOperation(charges, value)
        ? value
        : undefined
      : node === undefined
        ? undefined
        : getChargedProduct(charges, value);
  if (drained === undefined) return undefined;
  const elements = drainChargedStream(charges, openChargedPart(charges, drained), true);
  if (node !== undefined) charges.secondary[node] += elements.length;
  const sorted =
    drained.kind !== "SetOperation" && isStreamedApart(drained) ? sortLikeTlc(elements) : elements;
  const set =
    drained.kind === "SetOperation"
      ? createSortedSet(toFiniteSet(createEnumeratedSet(elements)).elements)
      : drained.kind === "RecordSet"
        ? createSet(sorted)
        : createSortedSet(sorted);
  drained.enumerated = set;
  return set.elements;
};

const getProductStream = (
  value: FunctionSetValue | RecordSetValue | ProductSetValue,
  opened: OpenedStream | undefined,
) => (opened === undefined || opened.kind === "Cup" ? openProductStream(value) : opened);

const getPulledElements = (stream: ElementStream, isBounded: boolean) => {
  const elements: Value[] = [];
  somePulledElement(stream, (element) => {
    if (isBounded) addBoundedElement(elements, element);
    else elements.push(element);
    return false;
  });
  return elements;
};

const openStream = (value: Value, isEager: boolean): OpenedStream | undefined => {
  if (typeof value !== "object" || isCachedSet(value)) return undefined;
  switch (value.kind) {
    case "MixedSet":
      toFiniteSet(value);
      return undefined;
    case "FilteredSet":
      if (!isTlcEnumerable(value.base)) toFiniteSet(value);
      return openOperandStream(value.base, isEager);
    case "Union": {
      if (!isEnumeratedSet(value.base) && isTlcEnumerable(value.base)) {
        return openOperandStream(value.base, isEager);
      }
      const unionSets = getUnionSets(value);
      return unionSets.length > 0
        ? openOperandStream(getUnionSet(unionSets[0], 0, value), isEager)
        : undefined;
    }
    case "SetOperation": {
      if (value.operator === "\\" && !isTlcEnumerable(value.left)) toFiniteSet(value);
      if (
        value.operator === "\\cap" &&
        !isTlcEnumerable(value.left) &&
        !isTlcEnumerable(value.right)
      ) {
        toFiniteSet(value);
      }
      if (value.operator === "\\cup") {
        if (!isTlcEnumerable(value.left) || !isTlcEnumerable(value.right)) toFiniteSet(value);
        const left = openOperandStream(value.left, true);
        const right = openOperandStream(value.right, true);
        return left || right ? { kind: "Cup", left, right } : undefined;
      }
      return openOperandStream(
        value.operator === "\\cap" && !isTlcEnumerable(value.left) ? value.right : value.left,
        isEager,
      );
    }
    case "FunctionSet":
    case "RecordSet":
    case "ProductSet":
      if (isPredicatedProduct(value)) return openProductStream(value);
      if (isEager) openCombinedStream(value);
      return undefined;
    case "Subset":
      if (isEager) openCombinedStream(value);
      return undefined;
    default:
      return undefined;
  }
};

// TLC's elements() does this work up front, which shows only in frames or before S \cup T streams its other operand.
const openCombinedStream = (
  value: SubsetValue | FunctionSetValue | RecordSetValue | ProductSetValue,
) => {
  switch (value.kind) {
    case "Subset": {
      const base = value.base;
      if (value.enumerated || (typeof base === "object" && base.kind === "Set")) return;
      if (typeof base === "object" && base.kind === "Interval") {
        getCardinality(base);
        return;
      }
      getSubsetBase(value);
      return;
    }
    case "FunctionSet": {
      if (value.enumerated || isEmptySet(value)) return;
      const domain = value.domain;
      openOperandStream(domain, true);
      if (isOverriddenSet(domain)) {
        throw new TlaEvaluationError(describeUnenumerableFunctionSet("domain D", domain));
      }
      if (typeof domain === "object" && isLazySet(domain)) toFiniteSet(domain);
      if (isEmptySet(domain)) return;
      if (isOverriddenSet(value.range)) {
        throw new TlaEvaluationError(describeUnenumerableFunctionSet("range R", value.range));
      }
      openOperandStream(value.range, true);
      return;
    }
    case "RecordSet":
    case "ProductSet": {
      if (value.enumerated || isEmptySet(value)) return;
      const sets = value.kind === "RecordSet" ? value.sets : value.factors;
      for (let index = 0; index < sets.length; index++) {
        if (isOverriddenSet(sets[index])) {
          throw new TlaEvaluationError(describeUnenumerableComponent(value, index));
        }
        openOperandStream(sets[index], true);
      }
    }
  }
};

const openOperandStream = (value: Value, isEager: boolean) => {
  const sets = setTrace.sets;
  sets?.push(value);
  const opened = openStream(value, isEager || sets !== undefined);
  sets?.pop();
  return opened;
};

const openSetStream = (value: Value) =>
  typeof value !== "object" || isCachedSet(value) ? undefined : openOperandStream(value, false);

const listUnionLikeTlc = (union: SetOperationValue, opened: OpenedStream | undefined) => {
  if (!isTlcEnumerable(union.left) || !isTlcEnumerable(union.right)) {
    throw new TlaEvaluationError(
      `Attempted to enumerate S \\cup T when S:\n${prettyPrint(formatValue(union.left))}\nand T:\n${prettyPrint(formatValue(union.right))}\nare not both enumerable`,
    );
  }
  const cup = opened?.kind === "Cup" ? opened : undefined;
  const left = cup ? cup.left : openOperandStream(union.left, true);
  const right = cup ? cup.right : openOperandStream(union.right, true);
  if (isBeyondSetBound(union.left)) throw new TlaSetBoundError(getSetBoundMessage());
  const elements: Value[] = [];
  const add = (element: Value) => {
    addBoundedElement(elements, element);
    return false;
  };
  someOpenedElement(union.left, left, add);
  if (isBeyondSetBound(union.right)) throw new TlaSetBoundError(getSetBoundMessage());
  someOpenedElement(union.right, right, add);
  return elements;
};

export const getNormalizedSetElements = (value: Value, isBounded: boolean) => {
  if (
    typeof value !== "object" ||
    (value.kind !== "SetOperation" &&
      value.kind !== "Union" &&
      (!isBounded ||
        (value.kind !== "FunctionSet" &&
          value.kind !== "RecordSet" &&
          value.kind !== "ProductSet"))) ||
    value.enumerated
  ) {
    return isBounded ? toFiniteSet(value).elements : getUnboundedElements(value);
  }
  // TLC frames the set as its elements() opens the stream, but not as toSetEnum collects it.
  const elements = enumerateSet(
    value,
    true,
    undefined,
    setTrace.sets ? openOperandStream(value, false) : undefined,
  );
  const set = value.kind === "RecordSet" ? createSet(elements) : createSortedSet(elements);
  value.enumerated = set;
  return set.elements;
};

const someOpenedElement = (
  value: Value,
  opened: OpenedStream | undefined,
  visit: (element: Value) => boolean,
) =>
  typeof value !== "object" || isCachedSet(value)
    ? toFiniteSet(value).elements.some(visit)
    : someElementOfStream(value, visit, opened);

// TLC frames a set as its elements() opens the stream, but not as it streams it.
export const someStreamedElement = (value: Value, visit: (element: Value) => boolean): boolean =>
  someOpenedElement(value, openSetStream(value), visit);

const getOpenedElements = (value: Value, opened: OpenedStream | undefined) => {
  const elements: Value[] = [];
  someOpenedElement(value, opened, (element) => {
    elements.push(element);
    return false;
  });
  return elements;
};

export const getStreamedElements = (value: Value) => getOpenedElements(value, openSetStream(value));

const getCombinedSets = (value: ObjectValue) =>
  value.kind === "ProductSet"
    ? value.factors
    : value.kind === "RecordSet"
      ? value.sets
      : value.kind === "FunctionSet"
        ? [value.range]
        : undefined;

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

// UNION S opens S, or the first set of S when S is enumerated, as its elements() opens the stream.
const getOpenedUnionSets = (value: UnionValue, opened: OpenedStream | undefined) =>
  getUnionSets(value, (base) =>
    isEnumeratedSet(base) ? getUnionBase(base) : getOpenedElements(base, opened),
  );

const someElementOfStream = (
  value: ObjectValue,
  visit: (element: Value) => boolean,
  opened: OpenedStream | undefined,
): boolean => {
  if (value.kind === "Union") {
    return getOpenedUnionSets(value, opened).some((set, index) => {
      const unionSet = getUnionSet(set, index, value);
      return index === 0 && isEnumeratedSet(value.base)
        ? someOpenedElement(unionSet, opened, visit)
        : someStreamedElement(unionSet, visit);
    });
  }
  if (value.kind === "FilteredSet" && isTlcEnumerable(value.base)) {
    const pass = value.startPass?.(false);
    if (pass) {
      if (
        someOpenedElement(value.base, opened, (element) => pass.test(element) && visit(element))
      ) {
        return true;
      }
      pass.end();
      return false;
    }
    return someOpenedElement(
      value.base,
      opened,
      (element) => value.test(element, false) && visit(element),
    );
  }
  if (
    (value.kind === "FunctionSet" || value.kind === "RecordSet" || value.kind === "ProductSet") &&
    opened !== undefined
  ) {
    return somePulledElement(getProductStream(value, opened), visit);
  }
  const components = getCombinedSets(value);
  if (components?.some(isStreamedApart)) {
    return enumerateSet(value, false, getStreamedElements).some(visit);
  }
  if (
    value.kind === "Subset" &&
    value.enumerated === undefined &&
    getCardinality(value.base) > MAXIMUM_BUILT_SUBSET_BASE
  ) {
    return someSubset(getSubsetBase(value), visit, value.cost?.node);
  }
  if (value.kind !== "SetOperation") return getUnboundedElements(value).some(visit);
  if (value.operator === "\\cup") {
    if (!isTlcEnumerable(value.left) || !isTlcEnumerable(value.right)) {
      return toFiniteSet(value).elements.some(visit);
    }
    const cup = opened?.kind === "Cup" ? opened : undefined;
    return (
      someOpenedElement(value.left, cup?.left, visit) ||
      someOpenedElement(value.right, cup?.right, visit)
    );
  }
  const isLeftEnumerated = value.operator === "\\" || isTlcEnumerable(value.left);
  const enumerated = isLeftEnumerated ? value.left : value.right;
  const other = isLeftEnumerated ? value.right : value.left;
  if (!isTlcEnumerable(enumerated)) return toFiniteSet(value).elements.some(visit);
  return someOpenedElement(
    enumerated,
    opened,
    (element) => isElementOf(element, other) === (value.operator === "\\cap") && visit(element),
  );
};

const isAnyElement = () => true;

export const isEmptySet = (value: Value): boolean => {
  if (typeof value !== "object" || !isSetValue(value)) {
    setTrace.sets?.push(value);
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
  }
  const sets = setTrace.sets;
  if (sets === undefined) return isEmptyComposite(value);
  sets.push(value);
  const isEmpty = isEmptyComposite(value);
  sets.pop();
  return isEmpty;
};

const isEmptyComposite = (
  value:
    | ProductSetValue
    | RecordSetValue
    | FunctionSetValue
    | UnionValue
    | SetOperationValue
    | FilteredSetValue,
): boolean => {
  switch (value.kind) {
    case "ProductSet":
      return value.factors.some(isEmptySet);
    case "RecordSet":
      return value.sets.some(isEmptySet);
    case "FunctionSet":
      return !isEmptySet(value.domain) && isEmptySet(value.range);
    case "Union":
      return getUnionSets(value).every((set, index) => isEmptySet(getUnionSet(set, index, value)));
    default:
      return !someStreamedElement(value, isAnyElement);
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
  `Overflow when computing the number of elements in:\n${prettyPrint(formatValue(value))}`;

export const getCardinality = (value: Value, version?: TlcVersion): number => {
  if (typeof value !== "object") {
    throw new TlaEvaluationError(
      `Attempted to compute the number of elements in the ${describeKind(value)} ${prettyPrint(formatValue(value))}.`,
    );
  }
  switch (value.kind) {
    case "ModelValue":
      throw new TlaEvaluationError(
        `Attempted to compute the number of elements in the model value ${prettyPrint(formatValue(value))}.`,
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
        `Attempted to compute the number of elements in the overridden value ${prettyPrint(formatValue(value))}.`,
      );
    case "Subset":
    case "FunctionSet":
    case "RecordSet":
    case "ProductSet": {
      const sets = setTrace.sets;
      sets?.push(value);
      const size = getCombinedCardinality(value, version);
      sets?.pop();
      return size;
    }
    default:
      cacheSet(value);
      return toFiniteSet(value).elements.length;
  }
};

const getCombinedCardinality = (
  value: SubsetValue | FunctionSetValue | RecordSetValue | ProductSetValue,
  version: TlcVersion | undefined,
) => {
  switch (value.kind) {
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
      let size = 1;
      for (let index = 0; index < domainSize; index++) {
        size *= rangeSize;
        if (size > MAXIMUM_INTEGER) throw new TlaEvaluationError(describeOverflow(value));
      }
      return size;
    }
    case "RecordSet":
      if (version !== "1.7.4" && isEmptySet(value)) return 0;
      return getProductCardinality(value.sets, version, () => describeOverflow(value));
    case "ProductSet":
      if (version !== "1.7.4" && isEmptySet(value)) return 0;
      return getProductCardinality(
        value.factors,
        version,
        () =>
          `Overflow when computing the number of elements in ${prettyPrint(formatValue(value))}`,
      );
  }
};

const describeInfiniteCheck = (value: Value) =>
  `Attempted to check if the set ${prettyPrint(formatValue(value))}is finite.`;

export const isFiniteSet = (value: Value): boolean => {
  if (typeof value !== "object" || value.kind === "ModelValue") {
    throw new TlaEvaluationError(
      `Attempted to check if the ${describeKind(value)} ${prettyPrint(formatValue(value))} is a finite set.`,
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
        `Attempted to check if the function:\n${prettyPrint(formatValue(value))}\nis a finite set.`,
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
      let isAllFinite = true;
      for (const part of parts) {
        if (!isFiniteSet(part)) isAllFinite = false;
        else if (isEmptySet(part)) return true;
      }
      return isAllFinite;
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
          `Attempted to check if expression of form {x \\in S : p(x)} is a finite set, but cannot check if S:\n${prettyPrint(formatValue(value.base))}\nis finite.`,
        );
      }
      return true;
  }
};

const findSortedIndex = (sortedValues: Value[], target: Value, compare = compareValues) => {
  let low = 0;
  let high = sortedValues.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    const comparison = compare(sortedValues[middle], target);
    if (comparison === 0) return middle;
    if (comparison < 0) low = middle + 1;
    else high = middle - 1;
  }
  return -1;
};

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

export const isSequenceDomain = (keys: Value[]) => keys.every((key, index) => key === index + 1);

// TLC's FcnLambdaValue#toTuple applies the function at 1, 2, ... until a key breaks the run, and caches nothing.
const getAppliedSequenceElements = (value: LazyFunctionValue) => {
  const keys = getUnboundedElements(value.domain);
  const elements: Value[] = [];
  for (let index = 0; index < keys.length; index++) {
    if (keys[index] !== index + 1) return undefined;
    elements.push(value.apply(keys[index]));
  }
  if (isCountedLazyFunction(value) && value.costModel.node >= 0) {
    value.costModel.secondary[value.costModel.node] += keys.length;
  }
  return elements;
};

const hasSequenceDomain = (value: LazyFunctionValue) =>
  typeof value.domain === "object" && value.domain.kind === "Interval"
    ? value.domain.low === 1 || value.domain.high < value.domain.low
    : isSequenceDomain(getUnboundedElements(value.domain));

export const getSequenceElements = (value: Value): Value[] | undefined => {
  if (typeof value !== "object" || !isFunctionValue(value)) return undefined;
  if (value.kind === "LazyFunction") {
    if (value.boundTupleLengths !== undefined) return undefined;
    if (!isSetValue(value.domain) || isOverriddenSet(value.domain)) {
      throw new TlaEvaluationError(
        "To convert a function of form [x \\in S |-> f(x)] to a tuple, the set S must be enumerable.",
      );
    }
    // Applying once and keeping the values is the same as TLC's toTuple when nothing observes an application.
    if (!value.enumerated && (value.isApplicationObserved || !hasSequenceDomain(value))) {
      return getAppliedSequenceElements(value);
    }
  }
  const functionValue = toFiniteFunction(value);
  return isSortedSequenceDomain(functionValue.domain) ? functionValue.range : undefined;
};

// A function's domain is sorted and of values that compare with each other, so one that starts at 1
// and ends at its length holds only integers, each once, and is 1..n.
const isSortedSequenceDomain = (domain: Value[]) =>
  domain.length === 0 || (domain[0] === 1 && domain[domain.length - 1] === domain.length);

const describeNonSetMembership = (element: Value, value: Value) => {
  const prefix = `Attempted to check if the value:\n${prettyPrint(formatValue(element))}\nis an element of the`;
  if (!isFunctionValue(value))
    return `${prefix} ${describeKind(value)} ${prettyPrint(formatValue(value))}`;
  const functionClass = getFunctionClass(value);
  if (functionClass === "record") {
    return `Attempted to check if element:\n${prettyPrint(formatValue(element))}\nis in the record:\n${prettyPrint(formatValue(value))}`;
  }
  if (functionClass === "tuple") return "Attempted to check set membership in a tuple value.";
  return `${prefix} function ${prettyPrint(formatValue(value))}`;
};

interface TracedCallStack {
  expressions: unknown[];
  isFrozen: boolean;
  sources: WeakMap<ObjectValue, unknown>;
  fingerprint?: unknown;
}

export const setTrace: { sets: Value[] | undefined; callStack?: TracedCallStack } = {
  sets: undefined,
};

interface TraceMark {
  depth: number;
  length: number;
  isFrozen: boolean;
  fingerprint: unknown;
}

const markTrace = (): TraceMark | undefined => {
  const sets = setTrace.sets;
  const callStack = setTrace.callStack;
  if (sets === undefined && callStack === undefined) return undefined;
  return {
    depth: sets?.length ?? 0,
    length: callStack?.expressions.length ?? 0,
    isFrozen: callStack?.isFrozen ?? false,
    fingerprint: callStack?.fingerprint,
  };
};

// TLC drops the FingerprintException of an exception it swallows, while its CallStackTool stays frozen where the exception left it.
const dropFingerprint = (mark: TraceMark | undefined) => {
  if (mark === undefined) return;
  if (setTrace.sets) setTrace.sets.length = mark.depth;
  if (setTrace.callStack) setTrace.callStack.fingerprint = mark.fingerprint;
};

const resetTrace = (mark: TraceMark | undefined) => {
  dropFingerprint(mark);
  const callStack = setTrace.callStack;
  if (mark === undefined || !callStack) return;
  callStack.expressions.length = mark.length;
  callStack.isFrozen = mark.isFrozen;
};

export const computeLikeTlcOnFailure = <Left, Right, Result>(
  compute: (left: Left, right: Right) => Result,
  computeLikeTlc: (left: Left, right: Right, error: TlaEvaluationError) => Result,
  left: Left,
  right: Right,
  isFailingLikeTlc?: (left: Left, right: Right) => boolean,
): Result => {
  const mark = markTrace();
  try {
    return compute(left, right);
  } catch (error) {
    if (!(error instanceof TlaEvaluationError) || isFailingLikeTlc?.(left, right)) throw error;
    resetTrace(mark);
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

export const isElementOfSetLikeTlc = (element: Value, set: SetValue): boolean => {
  const sets = setTrace.sets;
  sets?.push(set);
  cacheSet(element);
  const isElement = isInSortedSetLikeTlc(element, set);
  sets?.pop();
  return isElement;
};

export const isElementOfWith = (
  element: Value,
  set: Value,
  isMember: typeof isElementOf,
): boolean => {
  const sets = setTrace.sets;
  if (sets === undefined) return isElementOfComponents(element, set, isMember);
  sets.push(set);
  const isElement = isElementOfComponents(element, set, isMember);
  sets.pop();
  return isElement;
};

const isIntegerInSortedSet = (element: number, set: SetValue) => {
  const elements = set.elements;
  let low = 0;
  let high = elements.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    const probe = elements[middle];
    if (typeof probe !== "number") return undefined;
    if (probe === element) return true;
    if (probe < element) low = middle + 1;
    else high = middle - 1;
  }
  return false;
};

const isInSortedSet = (element: Value, set: SetValue) =>
  findSortedIndex(set.elements, element) !== -1;

const isInSortedSetLikeTlc = (element: Value, set: SetValue) =>
  isNormalizedSet(set)
    ? searchLikeTlc(element, set.elements).isFound
    : isElementOfLikeTlc(element, getWrittenElements(set));

const isModelValueMember = (modelValue: ModelValue, set: Value): false => {
  if (modelValue.type !== undefined) {
    throw new TlaEvaluationError(
      `Attempted to check if the typed model value ${prettyPrint(formatValue(modelValue))} is an element of\n${prettyPrint(formatValue(set))}`,
    );
  }
  return false;
};

// The common cases stay small enough for V8 to inline.
const isElementOfSet = (element: Value, set: Value): boolean => {
  if (typeof element === "number" && typeof set === "object") {
    if (set.kind === "Set" && !isTypedModelValueCreated)
      return isIntegerInSortedSet(element, set) ?? isElementOfAnySet(element, set);
    if (set.kind === "Interval") return element >= set.low && element <= set.high;
  }
  return isElementOfAnySet(element, set);
};

// SubsetValue#member streams the element and stops at its first element outside the base.
const isStreamedSubsetMember = (element: Value, set: SubsetValue, isMember: typeof isElementOf) => {
  if (!isSetValue(element) || isOverriddenSet(element)) {
    throw new TlaEvaluationError(
      `Attempted to check if the non-enumerable value\n${prettyPrint(formatValue(element))}\nis element of\n${prettyPrint(formatValue(set))}`,
    );
  }
  return !someStreamedElement(element, (item) => !isMember(item, set.base));
};

const getFunctionSetMemberRange = (element: Value, set: FunctionSetValue) => {
  if (!isFunctionValue(element)) {
    if (isModelValue(element)) return isModelValueMember(element, set);
    throw new TlaEvaluationError(
      `Attempted to check if \n${formatValue(element)}\nwhich is not a TLC function value, is in the set of functions:\n${prettyPrint(formatValue(set))}`,
    );
  }
  forgetOwnWrittenOrder(element);
  const functionValue = toFiniteFunction(element);
  const low = getIntervalLow(element, functionValue.domain);
  const isDomain =
    low === undefined
      ? isReceiverEqual(set.domain, createSortedSet(functionValue.domain))
      : isEqualLikeTlc(
          { kind: "Interval", low, high: low + functionValue.domain.length - 1 },
          set.domain,
        );
  return isDomain && functionValue.range;
};

const getRecordSetMember = (element: Value, set: RecordSetValue) => {
  forgetOwnWrittenOrder(element);
  const functionValue = isFunctionValue(element) ? toFiniteFunction(element) : undefined;
  if (!functionValue || !isRecordDomain(functionValue.domain)) {
    if (isModelValue(element)) return isModelValueMember(element, set);
    throw new TlaEvaluationError(
      `Attempted to check if non-record\n${formatValue(element)}\nis in the set of records:\n${prettyPrint(formatValue(set))}`,
    );
  }
  return functionValue.domain.length === set.names.length && functionValue;
};

const getProductSetMemberElements = (element: Value, set: ProductSetValue) => {
  const elements = isFunctionValue(element) ? getSequenceElements(element) : undefined;
  if (elements === undefined) {
    const isFunction =
      isFunctionValue(element) &&
      toFiniteFunction(element).domain.every((key) => typeof key === "number");
    if (isModelValue(element)) return isModelValueMember(element, set);
    if (isFunction) return false;
    throw new TlaEvaluationError(
      `Attempted to check if non-tuple\n${prettyPrint(formatValue(element))}\nis in the set of tuples:\n${prettyPrint(formatValue(set))}`,
    );
  }
  return elements.length === set.factors.length && elements;
};

// TLC's SetPredValue#member catches an EvalException, but not the FingerprintException a base with a source turns it into.
const isCaughtFilterError = (error: unknown, depth: number) =>
  error instanceof TlaEvaluationError && isEvalException(error) && !isFingerprintedSince(depth);

const describeUndecidedFilterMember = (element: Value, set: FilteredSetValue) =>
  `Cannot decide if element:\n${prettyPrint(formatValue(element))}\n is element of:\n${prettyPrint(formatValue(set.base))}\nand satisfies the predicate ${set.source?.predicate}`;

const getUnionMemberSets = (base: SetValue | MixedSetValue | IntervalValue) => {
  const sets = toFiniteSet(base).elements;
  if (sets.length > 1) {
    sets.forEach((inner) => {
      if (typeof inner === "object" && inner.kind === "Set") inner.flags |= VALUE_NORMALIZED;
    });
  }
  return sets;
};

// UnionValue#member streams its set of sets and stops at the first one that holds the element.
const isStreamedUnionMember = (element: Value, set: UnionValue, isMember: typeof isElementOf) => {
  if (!isTlcEnumerable(set.base)) {
    throw new TlaEvaluationError(
      `Attempted to check if:\n ${prettyPrint(formatValue(element))}\nis an element of the non-enumerable set:\n ${prettyPrint(formatUnion(set))}`,
    );
  }
  return someStreamedElement(set.base, (inner) => isMember(element, inner));
};

const getSequenceSetMemberElements = (element: Value, set: SequenceSetValue) => {
  const elements = getSequenceElements(element);
  if (elements === undefined) {
    if (isModelValue(element)) return isModelValueMember(element, set);
    throw new TlaModuleError(
      `Attempted to check if the value:\n${prettyPrint(formatValue(element))}\nis an element of ${prettyPrint(formatValue(set))}.`,
    );
  }
  return elements;
};

const isElementOfAnySet = (element: Value, set: Value): boolean => {
  if (!isSetValue(set)) throw new TlaEvaluationError(describeNonSetMembership(element, set));
  switch (set.kind) {
    case "Set":
      cacheSet(element);
      // TLC's ValueVec#search makes the element the receiver of a sorted set's comparisons, and each member the receiver of an unsorted one's.
      return isTypedModelValueCreated || isObservedLambda(element)
        ? isInSortedSetLikeTlc(element, set)
        : computeLikeTlcOnFailure(isInSortedSet, isInSortedSetLikeTlc, element, set);
    case "MixedSet":
      return set.enumerated
        ? searchLikeTlc(element, set.enumerated.elements).isFound
        : isElementOfLikeTlc(element, set.elements);
    case "Interval":
      if (typeof element === "number") return element >= set.low && element <= set.high;
      if (set.low <= set.high && (!isModelValue(element) || element.type !== undefined)) {
        throw new TlaEvaluationError(
          `Attempted to check if the value:\n${prettyPrint(formatValue(element))}\nis in the integer interval ${prettyPrint(formatValue(set))}`,
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
          `Attempted to check if the value:\n${prettyPrint(formatValue(element))}\nis an element of ${set.name}.`,
        );
      }
      return set.name !== "Nat" || (typeof element === "number" && element >= 0);
    }
    case "Subset":
      return isReducibleSet(element)
        ? toFiniteSet(element).elements.every((item) => isElementOf(item, set.base))
        : isStreamedSubsetMember(element, set, isElementOf);
    case "FunctionSet": {
      const range = getFunctionSetMemberRange(element, set);
      return range !== false && range.every((item) => isElementOf(item, set.range));
    }
    case "RecordSet": {
      const record = getRecordSetMember(element, set);
      return (
        record !== false &&
        set.names.every((name, index) => {
          const position = findSortedIndex(record.domain, name);
          return position !== -1 && isElementOf(record.range[position], set.sets[index]);
        })
      );
    }
    case "ProductSet": {
      const elements = getProductSetMemberElements(element, set);
      return (
        elements !== false && elements.every((item, index) => isElementOf(item, set.factors[index]))
      );
    }
    case "FilteredSet": {
      const depth = setTrace.sets?.length ?? 0;
      try {
        return isElementOf(element, set.base) && set.test(element, true);
      } catch (error) {
        if (!isCaughtFilterError(error, depth)) throw error;
        throw new TlaEvaluationError(describeUndecidedFilterMember(element, set));
      }
    }
    case "Union":
      return isReducibleSet(set.base)
        ? getUnionMemberSets(set.base).some((inner) => isElementOf(element, inner))
        : isStreamedUnionMember(element, set, isElementOf);
    case "SetOperation":
      if (set.operator === "\\cup")
        return isElementOf(element, set.left) || isElementOf(element, set.right);
      return (
        isElementOf(element, set.left) &&
        isElementOf(element, set.right) === (set.operator === "\\cap")
      );
    case "SequenceSet": {
      const elements = getSequenceSetMemberElements(element, set);
      return elements !== false && elements.every((item) => isElementOf(item, set.base));
    }
    default:
      throw new TlaEvaluationError(describeNonSetMembership(element, set));
  }
};

const isElementOfComponents = (
  element: Value,
  set: Value,
  isMember: typeof isElementOf,
): boolean => {
  if (typeof set !== "object") return isElementOfAnySet(element, set);
  switch (set.kind) {
    case "Subset":
      return isReducibleSet(element)
        ? toFiniteSet(element).elements.every((item) => isMember(item, set.base))
        : isStreamedSubsetMember(element, set, isMember);
    case "FunctionSet": {
      const range = getFunctionSetMemberRange(element, set);
      return range !== false && range.every((item) => isMember(item, set.range));
    }
    case "RecordSet": {
      const record = getRecordSetMember(element, set);
      return (
        record !== false &&
        set.names.every((name, index) => {
          const position = findSortedIndex(record.domain, name);
          return position !== -1 && isMember(record.range[position], set.sets[index]);
        })
      );
    }
    case "ProductSet": {
      const elements = getProductSetMemberElements(element, set);
      return (
        elements !== false && elements.every((item, index) => isMember(item, set.factors[index]))
      );
    }
    case "FilteredSet": {
      const depth = setTrace.sets?.length ?? 0;
      try {
        return isMember(element, set.base) && set.test(element, true);
      } catch (error) {
        if (!isCaughtFilterError(error, depth)) throw error;
        throw new TlaEvaluationError(describeUndecidedFilterMember(element, set));
      }
    }
    case "Union":
      return isReducibleSet(set.base)
        ? getUnionMemberSets(set.base).some((inner) => isMember(element, inner))
        : isStreamedUnionMember(element, set, isMember);
    case "SetOperation":
      if (set.operator === "\\cup")
        return isMember(element, set.left) || isMember(element, set.right);
      return (
        isMember(element, set.left) && isMember(element, set.right) === (set.operator === "\\cap")
      );
    case "SequenceSet": {
      const elements = getSequenceSetMemberElements(element, set);
      return elements !== false && elements.every((item) => isMember(item, set.base));
    }
    default:
      return isElementOfAnySet(element, set);
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

const isCountedLazyFunction = (value: LazyFunctionValue): value is CountedLazyFunctionValue =>
  "costModel" in value;

export const getLazyFunctionNode = (value: LazyFunctionValue) =>
  isCountedLazyFunction(value) ? value.costModel.node : -1;

const isLazyFunctionCopy = (value: LazyFunctionValue): value is LazyFunctionCopy =>
  "original" in value;

// FcnLambdaValue#apply and #select take the value of an EXCEPT that ends at the argument without
// checking the domain, matching each EXCEPT from the newest until one does.
const hasReplacedKey = (copy: LazyFunctionCopy, argument: Value) => {
  for (
    let current: LazyFunctionValue = copy;
    isLazyFunctionCopy(current);
    current = current.original
  ) {
    if (
      isEqualLikeTlc(current.path[current.depth], argument) &&
      current.depth === current.path.length - 1
    ) {
      return true;
    }
  }
  return false;
};

// FcnLambdaValue#toFcnRcd evaluates the body at every key of an EXCEPT copy, then applies its EXCEPTs.
const getCopiedValue = (copy: LazyFunctionCopy, key: Value, value: Value): Value => {
  const previous = isLazyFunctionCopy(copy.original)
    ? getCopiedValue(copy.original, key, value)
    : value;
  return isEqualLikeTlc(copy.path[copy.depth], key)
    ? takeExcept(previous, copy.path, copy.depth + 1, copy.newValue)
    : previous;
};

export const toFiniteFunction = (value: Value): FunctionValue => {
  if (typeof value === "object" && value.kind === "Function") return value;
  if (typeof value === "object" && value.kind === "LazyFunction") {
    if (value.enumerated) return value.enumerated;
    if (isSortingLiteral) throw new TlaEvaluationError("The set literal holds a lazy function");
    const finishConversion = isCountedLazyFunction(value)
      ? value.costModel.startConversion()
      : undefined;
    // TLC's FcnLambdaValue#toFcnRcd sizes its domain, which enumerates a filter under -maxSetSize, and then streams it.
    getCardinality(value.domain);
    if (!isSetValue(value.domain)) {
      throw new TlaEvaluationError("The domains of formal parameters must be enumerable.");
    }
    const domain = getFunctionDomain(value.domain, false);
    value.enumerated = createSortedFunction(
      domain,
      isLazyFunctionCopy(value)
        ? domain.map((key) => getCopiedValue(value, key, value.applyBody(key)))
        : domain.map((key) => value.apply(key)),
    );
    finishConversion?.();
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

const describeExceptKey = (functionValue: FunctionValue, argument: Value) => {
  if (!isVersion174) return describeMissingArgument(functionValue, argument);
  const shown = prettyPrint(formatValue(argument));
  return getFunctionClass(functionValue) === "tuple"
    ? `Attempted to apply tuple to a non-integer argument ${shown}.`
    : `Attempted to apply record to a non-string argument ${shown}.`;
};

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

const LINEAR_SEARCH_LIMIT = 32;

const findDomainIndex = (functionValue: FunctionValue, argument: Value) =>
  findSortedIndex(functionValue.domain, argument);

const failKeyLikeTlc = (
  functionValue: FunctionValue,
  argument: Value,
  error: TlaEvaluationError,
): never => {
  const keys = getWrittenKeys(functionValue);
  if (isVersion174 || keys !== functionValue.domain || keys.length < LINEAR_SEARCH_LIMIT) {
    keys.forEach((key) => equalsLikeTlc(key, argument));
  } else {
    findSortedIndex(keys, argument, compareLikeTlc);
  }
  throw error;
};

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
      !isVersion174 &&
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

const describeBoundArgument = (
  functionValue: LazyFunctionValue,
  position: string,
  shown: Value,
  problem: string,
) =>
  `In applying the function\n${prettyPrint(formatValue(functionValue))},\nthe ${position} is:\n${prettyPrint(formatValue(shown))}\nwhich ${problem}.\n`;

const createArgumentListError = (functionValue: LazyFunctionValue, argument: Value) =>
  new TlaEvaluationError(
    describeBoundArgument(
      functionValue,
      "argument list",
      argument,
      "does not match its formal parameter",
    ),
  );

const createBoundDomainError = (argument: Value) =>
  new TlaEvaluationError(
    `Attempted to apply a function to ${formatValue(argument)}, which is not in its domain`,
  );

const createBoundNonMemberError = (
  functionValue: LazyFunctionValue,
  index: number,
  element: Value,
  tupleLength: number | undefined,
) =>
  new TlaEvaluationError(
    describeBoundArgument(
      functionValue,
      `argument number ${index + 1}`,
      element,
      tupleLength === undefined
        ? `is not in the function's domain ${formatValue(functionValue.domain)}`
        : "is not in its domain",
    ),
  );

const checkBoundTuple = (
  functionValue: LazyFunctionValue,
  index: number,
  element: Value,
  tupleLength: number | undefined,
) => {
  if (tupleLength !== undefined && getSequenceElements(element)?.length !== tupleLength) {
    throw new TlaEvaluationError(
      describeBoundArgument(
        functionValue,
        `argument number ${index + 1}`,
        element,
        "does not match its formal parameter",
      ),
    );
  }
};

// Deviation from TLC: FcnLambdaValue#apply indexes past an argument tuple shorter than the bounds and ignores a longer one, where this rejects the list.
const checkBoundArguments = (
  functionValue: LazyFunctionValue,
  tupleLengths: (number | undefined)[],
  argument: Value,
) => {
  const domain = functionValue.domain;
  const elements = getSequenceElements(argument);
  if (elements === undefined) throw createArgumentListError(functionValue, argument);
  if (typeof domain !== "object" || domain.kind !== "ProductSet") {
    throw createBoundDomainError(argument);
  }
  tupleLengths.forEach((tupleLength, index) => {
    if (index >= elements.length) throw createArgumentListError(functionValue, argument);
    const element = elements[index];
    if (!isElementOf(element, domain.factors[index])) {
      throw createBoundNonMemberError(functionValue, index, element, tupleLength);
    }
    checkBoundTuple(functionValue, index, element, tupleLength);
  });
  if (elements.length > tupleLengths.length) {
    throw createArgumentListError(functionValue, argument);
  }
};

const checkBoundArgumentsWith = (
  functionValue: LazyFunctionValue,
  tupleLengths: (number | undefined)[],
  argument: Value,
  isMember: typeof isElementOf,
) => {
  const domain = functionValue.domain;
  const elements = getSequenceElements(argument);
  if (elements === undefined) throw createArgumentListError(functionValue, argument);
  if (typeof domain !== "object" || domain.kind !== "ProductSet") {
    throw createBoundDomainError(argument);
  }
  tupleLengths.forEach((tupleLength, index) => {
    if (index >= elements.length) throw createArgumentListError(functionValue, argument);
    const element = elements[index];
    if (!isMember(element, domain.factors[index])) {
      throw createBoundNonMemberError(functionValue, index, element, tupleLength);
    }
    checkBoundTuple(functionValue, index, element, tupleLength);
  });
  if (elements.length > tupleLengths.length) {
    throw createArgumentListError(functionValue, argument);
  }
};

const checkLazyArgumentWith = (
  functionValue: LazyFunctionValue,
  argument: Value,
  isMember: typeof isElementOf,
) => {
  const tupleLengths = functionValue.boundTupleLengths;
  if (tupleLengths !== undefined) {
    checkBoundArgumentsWith(functionValue, tupleLengths, argument, isMember);
  } else if (!isMember(argument, functionValue.domain)) {
    throw new TlaEvaluationError(describeMissingArgument(functionValue, argument));
  }
};

export const applyFunction = (
  functionValue: Value,
  argument: Value,
  describeMissing?: (functionValue: FunctionValue, argument: Value) => string,
): Value => {
  if (typeof functionValue === "object" && functionValue.kind === "LazyFunction") {
    if (functionValue.enumerated) {
      return applyFunction(functionValue.enumerated, argument, describeMissing);
    }
    if (isLazyFunctionCopy(functionValue) && hasReplacedKey(functionValue, argument)) {
      return functionValue.apply(argument);
    }
    const tupleLengths = functionValue.boundTupleLengths;
    if (tupleLengths !== undefined) {
      checkBoundArguments(functionValue, tupleLengths, argument);
      return functionValue.apply(argument);
    }
    if (!isElementOf(argument, functionValue.domain)) {
      throw new TlaEvaluationError(describeMissingArgument(functionValue, argument));
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

export const applyFunctionWith = (
  functionValue: Value,
  argument: Value,
  describeMissing: ((functionValue: FunctionValue, argument: Value) => string) | undefined,
  isMember: typeof isElementOf,
) => {
  if (
    typeof functionValue !== "object" ||
    functionValue.kind !== "LazyFunction" ||
    functionValue.enumerated !== undefined
  ) {
    return applyFunction(functionValue, argument, describeMissing);
  }
  if (!isLazyFunctionCopy(functionValue) || !hasReplacedKey(functionValue, argument)) {
    checkLazyArgumentWith(functionValue, argument, isMember);
  }
  return functionValue.apply(argument);
};

export const getDomainInterval = (domain: Value[]) =>
  domain instanceof IntervalElements ? domain.interval : undefined;

// FcnLambdaValue#getDomain answers with its record's domain once it has converted.
export const getDomain = (functionValue: Value): Value => {
  if (
    typeof functionValue === "object" &&
    functionValue.kind === "LazyFunction" &&
    functionValue.enumerated === undefined
  ) {
    return functionValue.domain;
  }
  const finite = toFiniteFunction(functionValue);
  const interval = getDomainInterval(finite.domain);
  if (interval) return interval;
  const set = createSortedSet(finite.domain);
  if (finite.functionClass === "record") {
    if (finite.writtenKeys) set.writtenElements = finite.writtenKeys;
    return set;
  }
  set.flags |= VALUE_NORMALIZED;
  return set;
};

const copyLazyFunction = (
  functionValue: LazyFunctionValue,
  path: Value[],
  depth: number,
  newValue: Value,
) => {
  const argument = path[depth];
  // Deviation from TLC: FcnLambdaValue#takeExcept builds its copy with new FcnLambdaValue(this), which drops cm, so TLC counts none of the copy's evaluations of the body, not even the second one at a key whose EXCEPT goes deeper.
  const copy: LazyFunctionCopy = {
    kind: "LazyFunction",
    domain: functionValue.domain,
    apply:
      depth === path.length - 1
        ? (key) => (isEqualLikeTlc(argument, key) ? newValue : functionValue.apply(key))
        : (key) =>
            isEqualLikeTlc(argument, key)
              ? takeExcept(functionValue.apply(key), path, depth + 1, newValue)
              : functionValue.apply(key),
    source: functionValue.source,
    boundTupleLengths: functionValue.boundTupleLengths,
    isApplicationObserved: functionValue.isApplicationObserved,
    original: functionValue,
    path,
    depth,
    newValue,
    applyBody: isLazyFunctionCopy(functionValue) ? functionValue.applyBody : functionValue.apply,
  };
  return isCountedLazyFunction(functionValue)
    ? Object.assign(copy, { costModel: functionValue.costModel })
    : copy;
};

const getExceptTarget = (value: Value) => {
  if (!isFunctionValue(value)) {
    throw new TlaEvaluationError(
      `Attempted to apply EXCEPT construct to the value ${prettyPrint(formatValue(value))}.`,
    );
  }
  return toFiniteFunction(value);
};

const selectPath = (value: Value, path: Value[], depth: number) => {
  let selected = value;
  for (let index = depth; index < path.length; index++) {
    const argument = path[index];
    if (
      typeof selected === "object" &&
      selected.kind === "LazyFunction" &&
      selected.enumerated === undefined
    ) {
      if (!isLazyFunctionCopy(selected) || !hasReplacedKey(selected, argument)) {
        if (
          selected.boundTupleLengths !== undefined &&
          getSequenceElements(argument) === undefined
        ) {
          throw createArgumentListError(selected, argument);
        }
        if (!isElementOf(argument, selected.domain)) return undefined;
      }
      selected = selected.apply(argument);
      continue;
    }
    const finite = getExceptTarget(selected);
    const position = findKeyIndexLikeTlc(finite, argument, describeExceptKey);
    if (position === -1) return undefined;
    selected = finite.range[position];
  }
  return selected;
};

const takeExcept = (value: Value, path: Value[], depth: number, newValue: Value): Value => {
  if (depth === path.length) return newValue;
  if (
    typeof value === "object" &&
    value.kind === "LazyFunction" &&
    value.enumerated === undefined
  ) {
    return copyLazyFunction(value, path, depth, newValue);
  }
  const finite = getExceptTarget(value);
  const position = findKeyIndexLikeTlc(finite, path[depth], describeExceptKey);
  if (position === -1) return finite;
  return setFunctionValue(
    finite,
    position,
    takeExcept(finite.range[position], path, depth + 1, newValue),
  );
};

export const updateFunction = (
  functionValue: Value,
  path: Value[],
  depth: number,
  getNewValue: (previous: Value) => Value,
): Value => {
  if (depth === path.length) return getNewValue(functionValue);
  if (
    typeof functionValue === "object" &&
    functionValue.kind === "LazyFunction" &&
    functionValue.enumerated === undefined
  ) {
    const selected = selectPath(functionValue, path, depth);
    return selected === undefined
      ? functionValue
      : copyLazyFunction(functionValue, path, depth, getNewValue(selected));
  }
  const finite = getExceptTarget(functionValue);
  const position = findKeyIndexLikeTlc(finite, path[depth], describeExceptKey);
  if (position === -1) return finite;
  return setFunctionValue(
    finite,
    position,
    updateFunction(finite.range[position], path, depth + 1, getNewValue),
  );
};

const UNREADY_HASH = 0;

// TLC fingerprints a value only with its state, so EXCEPT hashes what it stores as getValueHash does, but gives up where that would convert a lazy value or sort a set.
const getReadyHash = (value: Value): number => {
  if (typeof value !== "object" || value.kind === "ModelValue") return getValueHash(value);
  if (value.kind === "LazyFunction") {
    return value.enumerated === undefined ? UNREADY_HASH : getReadyHash(value.enumerated);
  }
  if (value.kind === "Set") {
    if (!isNormalizedSet(value)) return UNREADY_HASH;
    if (value.hash !== 0) return value.hash;
    const elements = value.elements;
    let hash = SET_HASH_SEED;
    for (let index = 0; index < elements.length; index++) {
      const elementHash = getReadyHash(elements[index]);
      if (elementHash === UNREADY_HASH || elementHash === UNFINGERPRINTABLE_HASH) {
        return elementHash;
      }
      hash = (hash + getElementContribution(elementHash)) | 0;
    }
    value.hash = hash;
    return hash;
  }
  if (value.kind !== "Function") return UNREADY_HASH;
  if (value.hash !== 0) return value.hash;
  let hash = FUNCTION_HASH_SEED;
  for (let index = 0; index < value.domain.length; index++) {
    const keyHash = getReadyHash(value.domain[index]);
    if (keyHash === UNREADY_HASH || keyHash === UNFINGERPRINTABLE_HASH) return keyHash;
    const itemHash = getReadyHash(value.range[index]);
    if (itemHash === UNREADY_HASH || itemHash === UNFINGERPRINTABLE_HASH) return itemHash;
    hash = (hash + getEntryContribution(keyHash, itemHash)) | 0;
  }
  value.hash = hash;
  return hash;
};

export const createChangedFunction = (source: FunctionValue, range: Value[]) => {
  const changed = setFunctionClass(
    createSortedFunction(source.domain, range),
    source.functionClass,
  );
  let isHashed = source.hash !== 0 && source.hash !== UNFINGERPRINTABLE_HASH;
  let isFingerprinted = (source.flags & VALUE_FINGERPRINTED) !== 0;
  let hash = source.hash;
  for (let index = 0; index < range.length && (isHashed || isFingerprinted); index++) {
    const previous = source.range[index];
    const next = range[index];
    if (next === previous) continue;
    if (isFingerprinted && !isMarkedFingerprinted(next)) isFingerprinted = false;
    if (!isHashed) continue;
    const nextHash = getReadyHash(next);
    if (nextHash === UNREADY_HASH || nextHash === UNFINGERPRINTABLE_HASH) {
      isHashed = false;
      continue;
    }
    const keyHash = getValueHash(source.domain[index]);
    hash =
      (hash -
        getEntryContribution(keyHash, getValueHash(previous)) +
        getEntryContribution(keyHash, nextHash)) |
      0;
  }
  if (isHashed) changed.hash = hash;
  if (isFingerprinted) changed.flags = VALUE_FINGERPRINTED;
  return changed;
};

const setFunctionValue = (finite: FunctionValue, position: number, next: Value) => {
  const range = [...finite.range];
  const previous = finite.range[position];
  range[position] = next;
  const updated = setFunctionClass(
    createSortedFunction(finite.domain, range),
    finite.functionClass,
  );
  updated.writtenKeys = finite.writtenKeys;
  const isHashed = finite.hash !== 0 && finite.hash !== UNFINGERPRINTABLE_HASH;
  if (!isHashed && finite.fingerprint === 0) return updated;
  const nextHash = getReadyHash(next);
  if (nextHash === UNREADY_HASH || nextHash === UNFINGERPRINTABLE_HASH) return updated;
  if (isHashed) {
    const keyHash = getValueHash(finite.domain[position]);
    updated.hash =
      previous === next
        ? finite.hash
        : (finite.hash -
            getEntryContribution(keyHash, getValueHash(previous)) +
            getEntryContribution(keyHash, nextHash)) |
          0;
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

const fingerprintValue = (value: Value): void => {
  if (typeof value !== "object" || value.kind === "ModelValue") return;
  if (value.kind === "InfiniteSet" || value.kind === "SequenceSet") {
    throw new TlaEvaluationError(
      `TLC has found a state in which the value of a variable contains ${prettyPrint(formatValue(value))}`,
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

// The error that streaming a set's elements raises, which is how TLC reads the set a filter
// selects from rather than fingerprinting it.
export const getStreamError = (value: Value) => {
  try {
    someStreamedElement(value, () => false);
    return undefined;
  } catch (error) {
    if (!(error instanceof TlaEvaluationError)) throw error;
    return error;
  }
};

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
    // TLC sorts a set in place as it fingerprints it, also a union that inherited its hash, so every lookup marks it.
    if (value.kind === "Set") value.flags |= VALUE_NORMALIZED;
    if (value.hash === 0) value.hash = computeValueHash(value);
    return value.hash;
  }
  if (value.kind === "ModelValue") return value.hash;
  if (value.kind === "LazyFunction") {
    return isEnumerable(value.domain)
      ? getValueHash(toFiniteFunction(value))
      : UNFINGERPRINTABLE_HASH;
  }
  if (!isEnumerable(value)) return UNFINGERPRINTABLE_HASH;
  const charged = getChargedSet(value);
  return getValueHash(charged ? toChargedSet(charged, true, toFiniteSet) : toFiniteSet(value));
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

type LazySetValue = Exclude<ConvertibleSetValue, MixedSetValue | SequenceSetValue>;

const MAXIMUM_EXPANDED_SUBSET_BASE = 6;
const MAXIMUM_EXPANDED_PRODUCT = 1999;

const getProductSize = (sets: Value[]) =>
  sets.reduce<number>((size, set) => (size === 0 ? 0 : size * getCardinality(set)), 1);

const toPrintedSet = (value: LazySetValue) => {
  const charged = getChargedSet(value);
  return charged ? toChargedSet(charged, false, toFiniteSet) : toFiniteSet(value);
};

const expandLazySet = (value: LazySetValue) => {
  if (value.kind === "SetOperation" || value.kind === "FilteredSet" || value.kind === "Union") {
    return toPrintedSet(value);
  }
  value.cost?.charges?.chargePrintedSize(value);
  if (value.kind === "Subset") {
    if (getCardinality(value.base) > MAXIMUM_EXPANDED_SUBSET_BASE) return undefined;
    return toPrintedSet(value);
  }
  if (value.kind === "FunctionSet") {
    const domainSize = isEmptySet(value.domain) ? 0 : getCardinality(value.domain);
    const size = domainSize === 0 ? 1 : getCardinality(value.range) ** domainSize;
    return size <= MAXIMUM_EXPANDED_PRODUCT ? toPrintedSet(value) : undefined;
  }
  const size = getProductSize(value.kind === "RecordSet" ? value.sets : value.factors);
  return size <= MAXIMUM_EXPANDED_PRODUCT ? toPrintedSet(value) : undefined;
};

const getExpandedLazySet = (value: LazySetValue, isStrict: boolean) => {
  if (isStrict || value.kind === "Union") return expandLazySet(value);
  if (
    value.kind === "Subset" &&
    isFunctionValue(value.base) &&
    (value.base.kind === "Function" || isEnumerable(value.base.domain))
  ) {
    return expandLazySet(value);
  }
  if (!isEnumerable(value)) return undefined;
  const mark = markTrace();
  try {
    return expandLazySet(value);
  } catch (error) {
    if (!(error instanceof TlaEvaluationError)) throw error;
    dropFingerprint(mark);
    return undefined;
  }
};

const MAXIMUM_FORMAT_DEPTH = 1000;

interface FormattedValue {
  kind: "Value";
  value: Value;
  isStrict: boolean;
  isNormalized: boolean;
}

interface FormattedSetEnd {
  kind: "SetEnd";
  sets: Value[] | undefined;
}

type FormatPart = string | FormattedValue | FormattedSetEnd;

interface ValueWriter {
  text: string;
  depth: number;
  pending: FormatPart[] | undefined;
}

const writeText = (writer: ValueWriter, text: string) => {
  if (writer.pending === undefined) writer.text += text;
  else writer.pending.push(text);
};

const writeSetEnd = (writer: ValueWriter, sets: Value[] | undefined) => {
  if (writer.pending === undefined) sets?.pop();
  else writer.pending.push({ kind: "SetEnd", sets });
};

const writeDeepValue = (
  writer: ValueWriter,
  value: Value,
  isStrict: boolean,
  isNormalized: boolean,
) => {
  const pending: FormatPart[] = [{ kind: "Value", value, isStrict, isNormalized }];
  writer.pending = pending;
  for (let part = pending.pop(); part !== undefined; part = pending.pop()) {
    if (typeof part === "string") {
      writer.text += part;
      continue;
    }
    if (part.kind === "SetEnd") {
      part.sets?.pop();
      continue;
    }
    const start = pending.length;
    writeValue(writer, part.value, part.isStrict, part.isNormalized);
    for (let low = start, high = pending.length - 1; low < high; low++, high--) {
      const written = pending[low];
      pending[low] = pending[high];
      pending[high] = written;
    }
  }
  writer.pending = undefined;
};

const writeInner = (
  writer: ValueWriter,
  value: Value,
  isStrict: boolean,
  isNormalized: boolean,
) => {
  if (writer.pending !== undefined) {
    writer.pending.push({ kind: "Value", value, isStrict, isNormalized });
    return;
  }
  if (writer.depth === MAXIMUM_FORMAT_DEPTH) {
    writeDeepValue(writer, value, isStrict, isNormalized);
    return;
  }
  writer.depth++;
  writeValue(writer, value, isStrict, isNormalized);
  writer.depth--;
};

const writeItems = (
  writer: ValueWriter,
  items: Value[],
  separator: string,
  isStrict: boolean,
  isNormalized: boolean,
) => {
  for (let index = 0; index < items.length; index++) {
    if (index > 0) writeText(writer, separator);
    writeInner(writer, items[index], isStrict, isNormalized);
  }
};

const writeLazySet = (writer: ValueWriter, value: LazySetValue, isStrict: boolean) => {
  switch (value.kind) {
    case "Subset": {
      const isInterval = typeof value.base === "object" && value.base.kind === "Interval";
      writeText(writer, isInterval ? "SUBSET (" : "SUBSET ");
      writeInner(writer, value.base, isStrict, false);
      if (isInterval) writeText(writer, ")");
      return;
    }
    case "FunctionSet":
      writeText(writer, "[");
      writeInner(writer, value.domain, isStrict, false);
      writeText(writer, " -> ");
      writeInner(writer, value.range, isStrict, false);
      return writeText(writer, "]");
    case "RecordSet":
      writeText(writer, "[");
      for (let index = 0; index < value.names.length; index++) {
        writeText(writer, `${index > 0 ? ", " : ""}${value.names[index]}: `);
        writeInner(writer, value.sets[index], isStrict, false);
      }
      return writeText(writer, "]");
    case "ProductSet":
      writeText(writer, "(");
      writeItems(writer, value.factors, " \\X ", isStrict, false);
      return writeText(writer, ")");
    case "SetOperation":
      writeInner(writer, value.left, isStrict, false);
      writeText(writer, ` ${value.operator} `);
      return writeInner(writer, value.right, isStrict, false);
    case "FilteredSet":
      writeText(writer, value.source ? `{${value.source.names} \\in ` : "{x \\in ");
      writeInner(writer, value.base, isStrict, false);
      return writeText(
        writer,
        value.source ? ` : <expression ${value.source.predicate}> }` : " : ...}",
      );
    case "Union":
      writeText(writer, "UNION(");
      writeInner(writer, value.base, isStrict, false);
      return writeText(writer, ")");
  }
};

const isFieldName = (name: string) =>
  /^[\p{L}\p{Nd}_]*$/u.test(name) &&
  /\p{L}/u.test(name) &&
  (name.length < 4 || !/^[WS]F_/.test(name));

const toPrintedFunction = (value: LazyFunctionValue) => {
  if (!isEnumerable(value.domain)) return undefined;
  const mark = markTrace();
  try {
    return toFiniteFunction(value);
  } catch (error) {
    if (!(error instanceof TlaEvaluationError) && !isStackOverflow(error)) throw error;
    dropFingerprint(mark);
    return undefined;
  }
};

const MAXIMUM_COPY_DEPTH = 1000;

interface CopiedValue {
  kind: "Value";
  value: Value;
  isWrittenOrderKept: boolean;
  isCopied: boolean;
}

interface CopiedSetEnd {
  kind: "SetEnd";
  value: SetValue | MixedSetValue;
  isCopied: boolean;
}

interface CopiedFunctionEnd {
  kind: "FunctionEnd";
  value: FunctionValue;
  lazy: LazyFunctionValue | undefined;
  isWrittenOrderKept: boolean;
  isCopied: boolean;
}

type CopyPart = CopiedValue | CopiedSetEnd | CopiedFunctionEnd;

interface ValueCopier {
  depth: number;
  pending: CopyPart[] | undefined;
  copies: Value[];
}

const finishSetCopy = (copier: ValueCopier, value: SetValue | MixedSetValue, isCopied: boolean) => {
  if (value.kind === "Set") setNormalized(value, true);
  else toFiniteSet(value);
  if (isCopied) copier.copies.push(value);
};

const finishFunctionCopy = (
  copier: ValueCopier,
  value: FunctionValue,
  lazy: LazyFunctionValue | undefined,
  isWrittenOrderKept: boolean,
  isCopied: boolean,
) => {
  const writtenKeys = isWrittenOrderKept ? value.writtenKeys : undefined;
  if (!isCopied) {
    value.writtenKeys = writtenKeys;
    return;
  }
  const range = copier.copies.splice(copier.copies.length - value.range.length);
  const copied = { ...value, range, writtenKeys };
  copier.copies.push(lazy ? { ...lazy, enumerated: copied } : copied);
};

const endSetCopy = (copier: ValueCopier, value: SetValue | MixedSetValue, isCopied: boolean) => {
  if (copier.pending === undefined) finishSetCopy(copier, value, isCopied);
  else copier.pending.push({ kind: "SetEnd", value, isCopied });
};

const endFunctionCopy = (
  copier: ValueCopier,
  value: FunctionValue,
  lazy: LazyFunctionValue | undefined,
  isWrittenOrderKept: boolean,
  isCopied: boolean,
) => {
  if (copier.pending === undefined) {
    finishFunctionCopy(copier, value, lazy, isWrittenOrderKept, isCopied);
    return;
  }
  copier.pending.push({ kind: "FunctionEnd", value, lazy, isWrittenOrderKept, isCopied });
};

const copyDeepValue = (
  copier: ValueCopier,
  value: Value,
  isWrittenOrderKept: boolean,
  isCopied: boolean,
) => {
  const pending: CopyPart[] = [{ kind: "Value", value, isWrittenOrderKept, isCopied }];
  copier.pending = pending;
  for (let part = pending.pop(); part !== undefined; part = pending.pop()) {
    if (part.kind === "SetEnd") {
      finishSetCopy(copier, part.value, part.isCopied);
      continue;
    }
    if (part.kind === "FunctionEnd") {
      finishFunctionCopy(copier, part.value, part.lazy, part.isWrittenOrderKept, part.isCopied);
      continue;
    }
    const start = pending.length;
    copyValue(copier, part.value, part.isWrittenOrderKept, part.isCopied);
    for (let low = start, high = pending.length - 1; low < high; low++, high--) {
      const copied = pending[low];
      pending[low] = pending[high];
      pending[high] = copied;
    }
  }
  copier.pending = undefined;
};

const copyInner = (
  copier: ValueCopier,
  value: Value,
  isWrittenOrderKept: boolean,
  isCopied: boolean,
) => {
  if (copier.pending !== undefined) {
    copier.pending.push({ kind: "Value", value, isWrittenOrderKept, isCopied });
    return;
  }
  if (copier.depth === MAXIMUM_COPY_DEPTH) {
    copyDeepValue(copier, value, isWrittenOrderKept, isCopied);
    return;
  }
  copier.depth++;
  copyValue(copier, value, isWrittenOrderKept, isCopied);
  copier.depth--;
};

const copyItems = (
  copier: ValueCopier,
  items: Value[],
  isWrittenOrderKept: boolean,
  isCopied: boolean,
) => {
  for (let index = 0; index < items.length; index++) {
    copyInner(copier, items[index], isWrittenOrderKept, isCopied);
  }
};

const copyValue = (
  copier: ValueCopier,
  value: Value,
  isWrittenOrderKept: boolean,
  isCopied: boolean,
): void => {
  if (typeof value === "object") {
    switch (value.kind) {
      case "Set":
      case "MixedSet":
        copyItems(copier, value.elements, isWrittenOrderKept, false);
        return endSetCopy(copier, value, isCopied);
      case "Function":
        copyItems(copier, value.range, isWrittenOrderKept, isCopied);
        return endFunctionCopy(copier, value, undefined, isWrittenOrderKept, isCopied);
      case "LazyFunction":
        if (value.enumerated) {
          copyItems(copier, value.enumerated.range, true, isCopied);
          return endFunctionCopy(copier, value.enumerated, value, true, isCopied);
        }
        copyInner(copier, value.domain, isWrittenOrderKept, false);
        // Deviation from TLC: FcnLambdaValue#deepCopy builds its copy with new FcnLambdaValue(this), which drops cm, so PrintT's copy counts nothing.
        if (isCopied) copier.copies.push({ ...value });
        return;
      case "SetOperation":
        copyInner(copier, value.left, isWrittenOrderKept, false);
        copyInner(copier, value.right, isWrittenOrderKept, false);
        break;
      case "FunctionSet":
        copyInner(copier, value.domain, isWrittenOrderKept, false);
        copyInner(copier, value.range, isWrittenOrderKept, false);
        break;
      case "RecordSet":
        copyItems(copier, value.sets, isWrittenOrderKept, false);
        break;
      case "ProductSet":
        copyItems(copier, value.factors, isWrittenOrderKept, false);
        break;
      case "Subset":
      case "Union":
      case "FilteredSet":
      case "SequenceSet":
        copyInner(copier, value.base, isWrittenOrderKept, false);
        break;
    }
  }
  if (isCopied) copier.copies.push(value);
};

export const formatNormalizedCopies = (values: Value[]) => {
  // TLC prints a deep copy, which copies functions but shares sets, so a set and the functions inside it stay normalized and cached.
  const copier: ValueCopier = { depth: 0, pending: undefined, copies: [] };
  values.forEach((value) => copyValue(copier, value, false, true));
  return copier.copies.map((value) => formatValue(value, true, true));
};

const writeValue = (
  writer: ValueWriter,
  value: Value,
  isStrict: boolean,
  isNormalized: boolean,
): void => {
  if (typeof value === "boolean") return writeText(writer, value ? "TRUE" : "FALSE");
  if (typeof value === "number") return writeText(writer, String(value));
  if (typeof value === "string") return writeText(writer, formatString(value));
  switch (value.kind) {
    case "ModelValue":
      return writeText(writer, value.name);
    case "Set":
      writeText(writer, "{");
      writeItems(writer, value.elements, ", ", isStrict, isNormalized);
      return writeText(writer, "}");
    case "MixedSet":
      return writeInner(writer, toFiniteSet(value), isStrict, isNormalized);
    case "Interval":
      return writeText(writer, value.low <= value.high ? `${value.low}..${value.high}` : "{}");
    case "InfiniteSet":
      return writeText(writer, value.name === "Any" ? "ANY" : value.name);
    case "Subset":
    case "FunctionSet":
    case "RecordSet":
    case "ProductSet":
    case "SetOperation":
    case "FilteredSet":
    case "Union": {
      const sets = setTrace.sets;
      sets?.push(value);
      const expanded = printing.isExpanded ? getExpandedLazySet(value, isStrict) : undefined;
      if (expanded) writeInner(writer, expanded, isStrict, isNormalized);
      else writeLazySet(writer, value, isStrict);
      return writeSetEnd(writer, sets);
    }

    case "SequenceSet":
      writeText(writer, "Seq(");
      writeInner(writer, value.base, isStrict, isNormalized);
      return writeText(writer, ")");
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
        if (!source) return writeText(writer, "<function>");
        writeText(writer, "[");
        for (let index = 0; index < source.parameters.length; index++) {
          const parameter = source.parameters[index];
          writeText(writer, `${index > 0 ? ", " : ""}${parameter.name} \\in `);
          writeInner(writer, parameter.domain, false, false);
        }
        return writeText(writer, ` |-> <expression ${source.body}>]`);
      }
      if (
        functionValue.domain.length === 0 &&
        isVersion174 &&
        getFunctionClass(value) !== "tuple"
      ) {
        return writeText(writer, "<< >>");
      }
      if (functionValue.domain.length === 0 && getFunctionClass(value) === "record") {
        return writeText(writer, "[]");
      }
      const isRangeNormalized = isNormalized && getFunctionClass(value) !== "lambda";
      if (isSequenceDomain(functionValue.domain)) {
        writeText(writer, "<<");
        writeItems(writer, functionValue.range, ", ", isStrict, isRangeNormalized);
        return writeText(writer, ">>");
      }
      const pairs = isNormalized
        ? functionValue.domain.map((key, index) => [key, functionValue.range[index]])
        : getPrintedPairs(functionValue);
      if (
        getFunctionClass(value) === "record" ||
        functionValue.domain.every((key) => typeof key === "string" && isFieldName(key))
      ) {
        writeText(writer, "[");
        for (let index = 0; index < pairs.length; index++) {
          writeText(writer, `${index > 0 ? ", " : ""}${String(pairs[index][0])} |-> `);
          writeInner(writer, pairs[index][1], isStrict, isRangeNormalized);
        }
        return writeText(writer, "]");
      }
      writeText(writer, "(");
      for (let index = 0; index < pairs.length; index++) {
        if (index > 0) writeText(writer, " @@ ");
        writeInner(writer, pairs[index][0], isStrict, isNormalized);
        writeText(writer, " :> ");
        writeInner(writer, pairs[index][1], isStrict, isRangeNormalized);
      }
      return writeText(writer, ")");
    }
  }
};

export const formatValue = (value: Value, isStrict = false, isNormalized = false): string => {
  const writer: ValueWriter = { text: "", depth: 0, pending: undefined };
  writeValue(writer, value, isStrict, isNormalized);
  return writer.text;
};

const isUnchanged = (previous: Value | undefined, value: Value) => {
  if (previous === undefined) return false;
  try {
    return valuesEqual(previous, value);
  } catch (error) {
    if (error instanceof TlaEvaluationError) return false;
    throw error;
  }
};

const JAVA_FORMAT_SPECIFIER = /%(\d+\$)?([-#+ 0,(<]*)(\d+)?(\.\d+)?(.?)/gs;

const formatJava = (format: string, args: string[]) => {
  let nextIndex = 0;
  let lastIndex = -1;
  let isFitting = true;
  const text = format.replace(
    JAVA_FORMAT_SPECIFIER,
    (match, explicit?: string, flags = "", width?: string, precision?: string, conversion = "") => {
      const pad = (value: string) =>
        flags.includes("-") ? value.padEnd(Number(width)) : value.padStart(Number(width ?? 0));
      const isRelative = flags.includes("<");
      const otherFlags = flags.replace("<", "");
      if (conversion === "n" && match === "%n") return "\n";
      if (conversion === "%" && precision === undefined && /^-?$/.test(otherFlags)) {
        if (otherFlags === "-" && width === undefined) isFitting = false;
        return pad("%");
      }
      const index = isRelative
        ? lastIndex
        : explicit === undefined
          ? nextIndex++
          : Number(explicit.slice(0, -1)) - 1;
      lastIndex = index;
      const arg = args[index];
      if (
        !"sSbBhH".includes(conversion) ||
        conversion === "" ||
        !/^-?$/.test(otherFlags) ||
        (otherFlags === "-" && width === undefined) ||
        arg === undefined
      ) {
        isFitting = false;
        return match;
      }
      const lower = conversion.toLowerCase();
      const value =
        lower === "s" ? arg : lower === "b" ? "true" : (getJavaHashCode(arg) >>> 0).toString(16);
      const shown = pad(
        precision === undefined ? value : value.slice(0, Number(precision.slice(1))),
      );
      return conversion === lower ? shown : shown.toUpperCase();
    },
  );
  return isFitting ? text : undefined;
};

export const formatState = (state: Record<string, Value>, previous?: Record<string, Value>) => {
  const getViewText = previous ? undefined : viewTexts.get(state);
  if (getViewText) return getViewText();
  const entries = Object.entries(state);
  const alias = aliasNames.get(state);
  const isFormatted = alias !== undefined && "_format" in state;
  const format = isFormatted ? state._format : entries.length === 1 ? "%s = %s\n" : "/\\ %s = %s\n";
  if (typeof format !== "string") {
    throw new TlaAliasFormatError(
      `The _format field of the ALIAS ${alias} is ${formatValue(format)}, but it must be a string.`,
    );
  }
  // TLC lists an alias's evaluation error even where it repeats, so that a long trace doesn't hide it.
  return entries
    .filter((entry) => !(isFormatted && entry[0] === "_format"))
    .filter(
      (entry) =>
        !previous || entry[0] === ALIAS_EVAL_ERROR || !isUnchanged(previous[entry[0]], entry[1]),
    )
    .map((entry) => {
      const text = formatJava(format, [entry[0], prettyPrint(formatValue(entry[1]))]);
      if (text === undefined) {
        throw new TlaAliasFormatError(
          `The _format field of the ALIAS ${alias} is ${formatValue(format)}, but it must format two strings, the name and the value of a field.`,
        );
      }
      return text;
    })
    .join("");
};

// TLCStateMut#toString evaluates the VIEW under -view, and what that throws while TLC reports an error escapes to TLC#process.
export const formatErrorState = (state: Record<string, Value>) =>
  withProcessException(() => formatState(state));
