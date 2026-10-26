import { TlaEvaluationError } from "./errors";

export interface ModelValue {
  kind: "ModelValue";
  name: string;
}

export interface SetValue {
  kind: "Set";
  elements: Value[];
  hash: number;
}

export interface FunctionValue {
  kind: "Function";
  domain: Value[];
  range: Value[];
  hash: number;
}

export interface IntervalValue {
  kind: "Interval";
  low: number;
  high: number;
}

export interface InfiniteSetValue {
  kind: "InfiniteSet";
  name: "Nat" | "Int" | "STRING";
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

export interface LazyFunctionValue {
  kind: "LazyFunction";
  domain: Value;
  apply: (argument: Value) => Value;
}

export type Value =
  | boolean
  | number
  | string
  | ModelValue
  | SetValue
  | FunctionValue
  | IntervalValue
  | InfiniteSetValue
  | SubsetValue
  | FunctionSetValue
  | RecordSetValue
  | ProductSetValue
  | SequenceSetValue
  | LazyFunctionValue;

type ObjectValue = Exclude<Value, boolean | number | string>;

const MAXIMUM_INTEGER = 2147483647;
const MINIMUM_INTEGER = -2147483648;
const MAXIMUM_ENUMERATED_SUBSET_BASE = 30;

export const isSetValue = (value: Value) =>
  typeof value === "object" &&
  value.kind !== "ModelValue" &&
  value.kind !== "Function" &&
  value.kind !== "LazyFunction";

export const isFunctionValue = (value: Value): value is FunctionValue | LazyFunctionValue =>
  typeof value === "object" && (value.kind === "Function" || value.kind === "LazyFunction");

export const isModelValue = (value: Value): value is ModelValue =>
  typeof value === "object" && value.kind === "ModelValue";

const describeKind = (value: Value) => {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "integer";
  if (typeof value === "string") return "string";
  if (value.kind === "ModelValue") return "model value";
  return isSetValue(value) ? "set" : "function";
};

export const checkInteger = (value: number) => {
  if (!Number.isInteger(value) || value > MAXIMUM_INTEGER || value < MINIMUM_INTEGER) {
    throw new TlaEvaluationError(`Integer overflow: ${value} is outside TLC's 32-bit range`);
  }
  return value;
};

const compareFunctions = (left: FunctionValue, right: FunctionValue): number => {
  const leftDomain = left.domain;
  const rightDomain = right.domain;
  if (leftDomain.length !== rightDomain.length) return leftDomain.length - rightDomain.length;
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

const compareSets = (left: SetValue, right: SetValue): number => {
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

export const compareValues = (left: Value, right: Value): number => {
  if (left === right) return 0;
  if (typeof left === "object" && typeof right === "object") {
    const leftKind = left.kind;
    const rightKind = right.kind;
    if (leftKind === "Function" && rightKind === "Function") return compareFunctions(left, right);
    if (leftKind === "Set" && rightKind === "Set") return compareSets(left, right);
    if (leftKind === "ModelValue" || rightKind === "ModelValue") {
      if (leftKind === "ModelValue" && rightKind === "ModelValue") {
        return left.name < right.name ? -1 : left.name > right.name ? 1 : 0;
      }
      return leftKind === "ModelValue" ? -1 : 1;
    }
    const leftIsSet = isSetValue(left);
    if (leftIsSet !== isSetValue(right)) {
      throw new TlaEvaluationError(
        `Attempted to compare ${describeKind(left)} ${formatValue(left)} with ${describeKind(right)} ${formatValue(right)}`,
      );
    }
    if (leftIsSet) return compareSets(toFiniteSet(left), toFiniteSet(right));
    return compareFunctions(toFiniteFunction(left), toFiniteFunction(right));
  }
  if (typeof left === "number" && typeof right === "number") return left - right;
  if (typeof left === "string" && typeof right === "string") return left < right ? -1 : 1;
  if (typeof left === "boolean" && typeof right === "boolean") return left < right ? -1 : 1;
  if (isModelValue(left)) return -1;
  if (isModelValue(right)) return 1;
  throw new TlaEvaluationError(
    `Attempted to compare ${describeKind(left)} ${formatValue(left)} with ${describeKind(right)} ${formatValue(right)}`,
  );
};

export const createSortedSet = (elements: Value[]): SetValue => ({
  kind: "Set",
  elements,
  hash: 0,
});

export const createSortedFunction = (domain: Value[], range: Value[]): FunctionValue => ({
  kind: "Function",
  domain,
  range,
  hash: 0,
});

export const valuesEqual = (left: Value, right: Value): boolean => {
  if (left === right) return true;
  if (typeof left !== "object" || typeof right !== "object")
    return compareValues(left, right) === 0;
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
    return isModelValue(left) && isModelValue(right) && left.name === right.name;
  }
  const isInfiniteComparison =
    isSetValue(left) && isSetValue(right) && !(isEnumerable(left) && isEnumerable(right));
  if (isInfiniteComparison) return getValueKey(left) === getValueKey(right);
  return compareValues(left, right) === 0;
};

export const createSet = (elements: Value[]): SetValue => {
  if (elements.length < 2) return createSortedSet(elements);
  const sorted = [...elements].sort(compareValues);
  const unique = [sorted[0]];
  for (let index = 1; index < sorted.length; index++) {
    if (compareValues(unique[unique.length - 1], sorted[index]) !== 0) unique.push(sorted[index]);
  }
  return createSortedSet(unique);
};

export const EMPTY_SET = createSortedSet([]);

export const unionSorted = (left: Value[], right: Value[]): SetValue => {
  if (left.length === 0) return createSortedSet(right);
  if (right.length === 0) return createSortedSet(left);
  const merged: Value[] = [];
  let leftIndex = 0;
  let rightIndex = 0;
  while (leftIndex < left.length && rightIndex < right.length) {
    const comparison = compareValues(left[leftIndex], right[rightIndex]);
    if (comparison < 0) merged.push(left[leftIndex++]);
    else if (comparison > 0) merged.push(right[rightIndex++]);
    else {
      merged.push(left[leftIndex++]);
      rightIndex++;
    }
  }
  while (leftIndex < left.length) merged.push(left[leftIndex++]);
  while (rightIndex < right.length) merged.push(right[rightIndex++]);
  return createSortedSet(merged);
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

export const createTuple = (elements: Value[]): FunctionValue =>
  createSortedFunction(
    elements.map((_, index) => index + 1),
    elements,
  );

export const createRecord = (fields: [string, Value][]): FunctionValue => createFunction(fields);

export const isEnumerable = (value: Value): boolean => {
  if (typeof value !== "object") return false;
  switch (value.kind) {
    case "Set":
    case "Interval":
      return true;
    case "InfiniteSet":
    case "SequenceSet":
      return false;
    case "Subset":
      return isEnumerable(value.base);
    case "FunctionSet":
      return isEnumerable(value.domain) && isEnumerable(value.range);
    case "RecordSet":
      return value.sets.every(isEnumerable);
    case "ProductSet":
      return value.factors.every(isEnumerable);
    default:
      return false;
  }
};

const getCartesianProduct = (lists: Value[][]): Value[][] =>
  lists.reduce<Value[][]>(
    (combinations, list) =>
      combinations.flatMap((combination) => list.map((item) => [...combination, item])),
    [[]],
  );

const enumerateSet = (value: Value): Value[] => {
  if (typeof value !== "object")
    throw new TlaEvaluationError(`Expected a set but found ${formatValue(value)}`);
  switch (value.kind) {
    case "Set":
      return value.elements;
    case "Interval":
      return Array.from(
        { length: Math.max(0, value.high - value.low + 1) },
        (_, index) => value.low + index,
      );
    case "Subset": {
      const base = toFiniteSet(value.base).elements;
      if (base.length > MAXIMUM_ENUMERATED_SUBSET_BASE) {
        throw new TlaEvaluationError(
          `SUBSET of a set with ${base.length} elements is too large to enumerate`,
        );
      }
      return Array.from({ length: 2 ** base.length }, (_, mask) =>
        createSet(base.filter((_, index) => (mask & (1 << index)) !== 0)),
      );
    }
    case "FunctionSet": {
      const domain = toFiniteSet(value.domain).elements;
      const range = toFiniteSet(value.range).elements;
      return getCartesianProduct(domain.map(() => range)).map((combination): Value =>
        createSortedFunction(domain, combination),
      );
    }
    case "RecordSet":
      return getCartesianProduct(value.sets.map((set) => toFiniteSet(set).elements)).map(
        (combination) =>
          createRecord(
            value.names.map((name, index): [string, Value] => [name, combination[index]]),
          ),
      );
    case "ProductSet":
      return getCartesianProduct(value.factors.map((factor) => toFiniteSet(factor).elements)).map(
        createTuple,
      );
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
  const cached = typeof value === "object" ? finiteSets.get(value) : undefined;
  if (cached) return cached;
  const elements = enumerateSet(value);
  const set =
    typeof value === "object" && value.kind === "Interval"
      ? createSortedSet(elements)
      : createSet(elements);
  if (typeof value === "object") finiteSets.set(value, set);
  return set;
};

export const getCardinality = (value: Value) => {
  if (typeof value === "object" && value.kind === "Interval")
    return Math.max(0, value.high - value.low + 1);
  return toFiniteSet(value).elements.length;
};

const findIndex = (sortedValues: Value[], target: Value) => {
  const bounds = { low: 0, high: sortedValues.length - 1 };
  while (bounds.low <= bounds.high) {
    const middle = (bounds.low + bounds.high) >> 1;
    const comparison = compareValues(sortedValues[middle], target);
    if (comparison === 0) return middle;
    if (comparison < 0) bounds.low = middle + 1;
    else bounds.high = middle - 1;
  }
  return -1;
};

export const getSequenceElements = (value: Value): Value[] | undefined => {
  if (typeof value !== "object" || !isFunctionValue(value)) return undefined;
  const fn = toFiniteFunction(value);
  return fn.domain.every((key, index) => key === index + 1) ? fn.range : undefined;
};

export const isElementOf = (element: Value, set: Value): boolean => {
  if (typeof set !== "object")
    throw new TlaEvaluationError(`Expected a set but found ${formatValue(set)}`);
  switch (set.kind) {
    case "Set":
      return findIndex(set.elements, element) !== -1;
    case "Interval":
      return typeof element === "number" && element >= set.low && element <= set.high;
    case "InfiniteSet":
      if (set.name === "STRING") return typeof element === "string";
      return typeof element === "number" && (set.name === "Int" || element >= 0);
    case "Subset":
      return (
        isSetValue(element) &&
        toFiniteSet(element).elements.every((item) => isElementOf(item, set.base))
      );
    case "FunctionSet": {
      if (!isFunctionValue(element)) return false;
      const fn = toFiniteFunction(element);
      return (
        valuesEqual(createSortedSet(fn.domain), set.domain) &&
        fn.range.every((item) => isElementOf(item, set.range))
      );
    }
    case "RecordSet": {
      if (!isFunctionValue(element)) return false;
      const fn = toFiniteFunction(element);
      return (
        fn.domain.length === set.names.length &&
        set.names.every((name, index) => {
          const position = findIndex(fn.domain, name);
          return position !== -1 && isElementOf(fn.range[position], set.sets[index]);
        })
      );
    }
    case "ProductSet": {
      const elements = getSequenceElements(element);
      return (
        elements !== undefined &&
        elements.length === set.factors.length &&
        elements.every((item, index) => isElementOf(item, set.factors[index]))
      );
    }
    case "SequenceSet": {
      const elements = getSequenceElements(element);
      return elements !== undefined && elements.every((item) => isElementOf(item, set.base));
    }
    default:
      throw new TlaEvaluationError(`Expected a set but found ${formatValue(set)}`);
  }
};

export const toFiniteFunction = (value: Value): FunctionValue => {
  if (typeof value === "object" && value.kind === "Function") return value;
  if (typeof value === "object" && value.kind === "LazyFunction") {
    const domain = toFiniteSet(value.domain).elements;
    return createSortedFunction(
      domain,
      domain.map((key) => value.apply(key)),
    );
  }
  throw new TlaEvaluationError(`Expected a function but found ${formatValue(value)}`);
};

export const applyFunction = (fn: Value, argument: Value): Value => {
  if (typeof fn === "object" && fn.kind === "LazyFunction") {
    if (!isElementOf(argument, fn.domain)) {
      throw new TlaEvaluationError(
        `Attempted to apply a function to ${formatValue(argument)}, which is not in its domain`,
      );
    }
    return fn.apply(argument);
  }
  if (typeof fn !== "object" || fn.kind !== "Function") {
    throw new TlaEvaluationError(`Attempted to apply ${formatValue(fn)}, which is not a function`);
  }
  const domain = fn.domain;
  if (typeof argument === "number" && domain[argument - 1] === argument && domain[0] === 1) {
    return fn.range[argument - 1];
  }
  if (domain.length <= 8) {
    for (let index = 0; index < domain.length; index++)
      if (domain[index] === argument) return fn.range[index];
  }
  const position = findIndex(domain, argument);
  if (position === -1) {
    throw new TlaEvaluationError(
      `Attempted to apply function ${formatValue(fn)} to ${formatValue(argument)}, which is not in its domain`,
    );
  }
  return fn.range[position];
};

export const getDomain = (fn: Value): Value => {
  if (typeof fn === "object" && fn.kind === "LazyFunction") return fn.domain;
  return createSortedSet(toFiniteFunction(fn).domain);
};

export const updateFunction = (
  fn: Value,
  argument: Value,
  update: (previous: Value) => Value,
): Value => {
  const finite = toFiniteFunction(fn);
  const position = findIndex(finite.domain, argument);
  if (position === -1) return finite;
  const range = [...finite.range];
  range[position] = update(finite.range[position]);
  return createSortedFunction(finite.domain, range);
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

const computeValueHash = (value: ObjectValue): number => {
  if (value.kind === "ModelValue") return finalizeHash(combineHash(hashString(value.name), 0x6d));
  if (isSetValue(value)) {
    if (!isEnumerable(value)) return hashString(getValueKey(value));
    const elements = toFiniteSet(value).elements;
    let hash = combineHash(HASH_SEED, 0x73);
    for (let index = 0; index < elements.length; index++)
      hash = combineHash(hash, getValueHash(elements[index]));
    return finalizeHash(hash);
  }
  const fn = toFiniteFunction(value);
  let hash = combineHash(HASH_SEED, 0x66);
  for (let index = 0; index < fn.domain.length; index++) {
    hash = combineHash(
      combineHash(hash, getValueHash(fn.domain[index])),
      getValueHash(fn.range[index]),
    );
  }
  return finalizeHash(hash);
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

const computeValueKey = (value: ObjectValue): string => {
  if (value.kind === "ModelValue") return `@${value.name}`;
  if (value.kind === "InfiniteSet") return `<${value.name}>`;
  if (value.kind === "SequenceSet") return `<Seq ${getValueKey(value.base)}>`;
  if (isSetValue(value)) {
    if (!isEnumerable(value)) return `<${value.kind} ${formatValue(value)}>`;
    return `{${toFiniteSet(value).elements.map(getValueKey).join(",")}}`;
  }
  const fn = toFiniteFunction(value);
  return `(${fn.domain.map((key, index) => `${getValueKey(key)}:${getValueKey(fn.range[index])}`).join(",")})`;
};

const formatString = (value: string) =>
  `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\t/g, "\\t")}"`;

export const formatValue = (value: Value): string => {
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return formatString(value);
  switch (value.kind) {
    case "ModelValue":
      return value.name;
    case "Set":
      return `{${value.elements.map(formatValue).join(", ")}}`;
    case "Interval":
      return `${value.low}..${value.high}`;
    case "InfiniteSet":
      return value.name;
    case "Subset":
      return `SUBSET ${formatValue(value.base)}`;
    case "FunctionSet":
      return `[${formatValue(value.domain)} -> ${formatValue(value.range)}]`;
    case "RecordSet":
      return `[${value.names.map((name, index) => `${name} : ${formatValue(value.sets[index])}`).join(", ")}]`;
    case "ProductSet":
      return value.factors.map(formatValue).join(" \\X ");
    case "SequenceSet":
      return `Seq(${formatValue(value.base)})`;
    case "Function":
    case "LazyFunction": {
      if (value.kind === "LazyFunction" && !isEnumerable(value.domain)) return "<function>";
      const fn = toFiniteFunction(value);
      if (fn.domain.every((key, index) => key === index + 1)) {
        return `<<${fn.range.map(formatValue).join(", ")}>>`;
      }
      if (fn.domain.every((key) => typeof key === "string" && key.length > 0)) {
        return `[${fn.domain.map((key, index) => `${String(key)} |-> ${formatValue(fn.range[index])}`).join(", ")}]`;
      }
      return `(${fn.domain.map((key, index) => `${formatValue(key)} :> ${formatValue(fn.range[index])}`).join(" @@ ")})`;
    }
  }
};
