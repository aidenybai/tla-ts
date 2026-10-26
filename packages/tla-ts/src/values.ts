import { TlaEvaluationError } from "./errors";

export interface ModelValue {
  kind: "ModelValue";
  name: string;
}

export interface SetValue {
  kind: "Set";
  elements: Value[];
  hash: number;
  fingerprint: number;
}

export interface FunctionValue {
  kind: "Function";
  domain: Value[];
  range: Value[];
  hash: number;
  fingerprint: number;
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

export interface FilteredSetValue {
  kind: "FilteredSet";
  base: Value;
  test: (element: Value) => boolean;
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
  | SetOperationValue
  | FilteredSetValue
  | LazyFunctionValue;

export type ObjectValue = Exclude<Value, boolean | number | string>;

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

const getModelValueType = (value: Value) =>
  isModelValue(value) && value.name.length > 2 && value.name[1] === "_" ? value.name[0] : undefined;

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

export const compareValues = (left: Value, right: Value): number => {
  if (left === right) return 0;
  if (typeof left === "object" && typeof right === "object") {
    const leftKind = left.kind;
    const rightKind = right.kind;
    if (leftKind === "Function" && rightKind === "Function") return compareFunctions(left, right);
    if (leftKind === "Set" && rightKind === "Set") return compareSets(left, right);
    if (leftKind === "ModelValue" || rightKind === "ModelValue") {
      checkModelValueTypes(left, right, false);
      if (leftKind === "ModelValue" && rightKind === "ModelValue") {
        return left.name < right.name ? -1 : left.name > right.name ? 1 : 0;
      }
      return leftKind === "ModelValue" ? -1 : 1;
    }
    const isAny = (value: ObjectValue) => value.kind === "InfiniteSet" && value.name === "Any";
    if (isAny(left) || isAny(right)) {
      throw new TlaEvaluationError(
        `Attempted to compare ANY with ${formatValue(isAny(left) ? right : left)}`,
      );
    }
    if (leftKind === "InfiniteSet" && rightKind === "InfiniteSet") {
      if (left.name === right.name) return 0;
      if (left.name !== "STRING" && right.name !== "STRING") return left.name === "Nat" ? -1 : 1;
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
  checkModelValueTypes(left, right, false);
  if (isModelValue(left)) return -1;
  if (isModelValue(right)) return 1;
  throw new TlaEvaluationError(
    `Attempted to compare ${describeKind(left)} ${formatValue(left)} with ${describeKind(right)} ${formatValue(right)}`,
  );
};

const modelValues = new Map<string, ModelValue>();

export const createModelValue = (name: string): ModelValue => {
  const known = modelValues.get(name);
  if (known) return known;
  const value: ModelValue = { kind: "ModelValue", name };
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
});

export const valuesEqual = (left: Value, right: Value): boolean => {
  if (left === right) return true;
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
  if (isInfiniteComparison) {
    if (!isOverriddenSet(left)) {
      const elements = toFiniteSet(left);
      if (!isOverriddenSet(right)) return compareSets(elements, toFiniteSet(right)) === 0;
    }
    return getValueKey(left) === getValueKey(right);
  }
  return compareValues(left, right) === 0;
};

const areSameValues = (left: Value[], right: Value[]) =>
  left === right ||
  (left.length === right.length &&
    left.every((element, index) => isSameValue(element, right[index])));

export const isSameValue = (left: Value, right: Value): boolean => {
  if (left === right) return true;
  if (typeof left !== "object" || typeof right !== "object") return false;
  if (left.kind === "Set" && right.kind === "Set")
    return (
      (left.hash === 0 || right.hash === 0 || left.hash === right.hash) &&
      areSameValues(left.elements, right.elements)
    );
  if (left.kind === "Function" && right.kind === "Function")
    return (
      (left.hash === 0 || right.hash === 0 || left.hash === right.hash) &&
      areSameValues(left.domain, right.domain) &&
      areSameValues(left.range, right.range)
    );
  return getValueKey(left) === getValueKey(right);
};

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
  if (left.hash !== 0) {
    let hash = left.hash;
    for (let index = 0; index < added.length; index++) {
      hash = (hash + getElementContribution(added[index])) | 0;
    }
    union.hash = hash;
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
      return isEnumerable(value) ? toFiniteSet(value).elements.length === 0 : undefined;
    default:
      return undefined;
  }
};

const isOverriddenSet = (value: Value) =>
  typeof value === "object" && (value.kind === "InfiniteSet" || value.kind === "SequenceSet");

const getCartesianProduct = (lists: Value[][]): Value[][] => {
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

const getSortedSubsets = (base: Value[]): Value[] => {
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
    case "Interval":
      return Array.from({ length: getCardinality(value) }, (_, index) => value.low + index);
    case "Subset": {
      const base = toFiniteSet(value.base).elements;
      if (base.length > MAXIMUM_ENUMERATED_SUBSET_BASE) {
        throw new TlaEvaluationError(
          `SUBSET of a set with ${base.length} elements is too large to enumerate`,
        );
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
      const domain = toFiniteSet(value.domain).elements;
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
      if (isOverriddenSet(value.base)) {
        throw new TlaEvaluationError(
          `Attempted to enumerate { x \\in S : p(x) } when S:\n${formatValue(value.base)}\nis not enumerable`,
        );
      }
      return toFiniteSet(value.base).elements.filter(value.test);
    case "SetOperation": {
      const left = formatValue(value.left);
      const right = formatValue(value.right);
      if (
        value.operator === "\\cup" &&
        (isOverriddenSet(value.left) || isOverriddenSet(value.right))
      ) {
        throw new TlaEvaluationError(
          `Attempted to enumerate S \\cup T when S:\n${left}\nand T:\n${right}\nare not both enumerable`,
        );
      }
      if (
        value.operator === "\\cap" &&
        isOverriddenSet(value.left) &&
        isOverriddenSet(value.right)
      ) {
        throw new TlaEvaluationError(
          `Attempted to enumerate S \\cap T when neither S:\n${left}\nnor T:\n${right}\nis enumerable`,
        );
      }
      if (value.operator === "\\" && isOverriddenSet(value.left)) {
        throw new TlaEvaluationError(
          `Attempted to enumerate S \\ T when S:\n${left}\nis not enumerable.`,
        );
      }
      if (value.operator === "\\cup")
        return unionSorted(toFiniteSet(value.left), toFiniteSet(value.right)).elements;
      const isLeftEnumerated = value.operator === "\\" || isEnumerable(value.left);
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
  const cached = typeof value === "object" ? finiteSets.get(value) : undefined;
  if (cached) return cached;
  const elements = enumerateSet(value);
  const isSorted =
    typeof value === "object" &&
    (value.kind === "Interval" ||
      value.kind === "SetOperation" ||
      value.kind === "FilteredSet" ||
      value.kind === "ProductSet" ||
      value.kind === "FunctionSet" ||
      value.kind === "Subset");
  const set = isSorted ? createSortedSet(elements) : createSet(elements);
  if (typeof value === "object") finiteSets.set(value, set);
  return set;
};

export const isEmptySet = (value: Value): boolean => {
  if (typeof value !== "object" || !isSetValue(value)) {
    throw new TlaEvaluationError(`Shouldn't call isEmpty() on value ${formatValue(value)}`);
  }
  switch (value.kind) {
    case "Set":
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
    default:
      return toFiniteSet(value).elements.length === 0;
  }
};

const getProductCardinality = (sets: Value[], describe: () => string) =>
  sets.reduce<number>((product, set) => {
    const size = product * getCardinality(set);
    if (size > MAXIMUM_INTEGER) throw new TlaEvaluationError(describe());
    return size;
  }, 1);

const describeOverflow = (value: Value) =>
  `Overflow when computing the number of elements in:\n${formatValue(value)}`;

export const getCardinality = (value: Value): number => {
  if (typeof value !== "object") return toFiniteSet(value).elements.length;
  switch (value.kind) {
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
      const size = getCardinality(value.base);
      if (size >= 31) throw new TlaEvaluationError(describeOverflow(value));
      return 2 ** size;
    }
    case "FunctionSet": {
      if (isEmptySet(value.domain)) return 1;
      if (isEmptySet(value.range)) return 0;
      const rangeSize = getCardinality(value.range);
      if (rangeSize === 1) return 1;
      const domainSize = getCardinality(value.domain);
      const size = { value: 1 };
      for (let index = 0; index < domainSize; index++) {
        size.value *= rangeSize;
        if (size.value > MAXIMUM_INTEGER) throw new TlaEvaluationError(describeOverflow(value));
      }
      return size.value;
    }
    case "RecordSet":
      if (isEmptySet(value)) return 0;
      return getProductCardinality(value.sets, () => describeOverflow(value));
    case "ProductSet":
      if (isEmptySet(value)) return 0;
      return getProductCardinality(
        value.factors,
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

const describeMembership = (element: Value, set: Value) =>
  `Attempted to check if the value ${formatValue(element)} is an element of ${formatValue(set)}`;

export const isElementOf = (element: Value, set: Value): boolean => {
  if (typeof set !== "object")
    throw new TlaEvaluationError(`Expected a set but found ${formatValue(set)}`);
  switch (set.kind) {
    case "Set":
      return findIndex(set.elements, element) !== -1;
    case "Interval":
      if (typeof element === "number") return element >= set.low && element <= set.high;
      if (set.low <= set.high && !isModelValue(element))
        throw new TlaEvaluationError(describeMembership(element, set));
      return false;
    case "InfiniteSet": {
      if (set.name === "Any") return true;
      if (isModelValue(element)) return false;
      const isMemberType =
        set.name === "STRING" ? typeof element === "string" : typeof element === "number";
      if (!isMemberType) throw new TlaEvaluationError(describeMembership(element, set));
      return set.name !== "Nat" || (typeof element === "number" && element >= 0);
    }
    case "Subset":
      if (!isSetValue(element)) throw new TlaEvaluationError(describeMembership(element, set));
      return toFiniteSet(element).elements.every((item) => isElementOf(item, set.base));
    case "FunctionSet": {
      if (!isFunctionValue(element)) {
        if (isModelValue(element)) return false;
        throw new TlaEvaluationError(describeMembership(element, set));
      }
      const fn = toFiniteFunction(element);
      return (
        valuesEqual(createSortedSet(fn.domain), set.domain) &&
        fn.range.every((item) => isElementOf(item, set.range))
      );
    }
    case "RecordSet": {
      if (!isFunctionValue(element)) {
        if (isModelValue(element)) return false;
        throw new TlaEvaluationError(describeMembership(element, set));
      }
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
      if (!isFunctionValue(element)) {
        if (isModelValue(element)) return false;
        throw new TlaEvaluationError(describeMembership(element, set));
      }
      const elements = getSequenceElements(element);
      return (
        elements !== undefined &&
        elements.length === set.factors.length &&
        elements.every((item, index) => isElementOf(item, set.factors[index]))
      );
    }
    case "FilteredSet":
      return isElementOf(element, set.base) && set.test(element);
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
        throw new TlaEvaluationError(describeMembership(element, set));
      }
      return elements.every((item) => isElementOf(item, set.base));
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
  const first = domain[0];
  if (typeof argument === "number" && typeof first === "number") {
    const offset = argument - first;
    if (domain[offset] === argument) return fn.range[offset];
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
  if (typeof fn === "object" && fn.kind === "LazyFunction" && !isEnumerable(fn.domain)) {
    if (!isElementOf(argument, fn.domain)) return fn;
    const updated = update(fn.apply(argument));
    return {
      kind: "LazyFunction",
      domain: fn.domain,
      apply: (key) => (valuesEqual(key, argument) ? updated : fn.apply(key)),
    };
  }
  const finite = toFiniteFunction(fn);
  const position = findIndex(finite.domain, argument);
  if (position === -1) return finite;
  const range = [...finite.range];
  const previous = finite.range[position];
  const next = update(previous);
  range[position] = next;
  const updated = createSortedFunction(finite.domain, range);
  if (finite.hash !== 0) {
    const key = finite.domain[position];
    updated.hash =
      previous === next
        ? finite.hash
        : (finite.hash - getEntryContribution(key, previous) + getEntryContribution(key, next)) | 0;
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

const getElementContribution = (element: Value) =>
  finalizeHash((getValueHash(element) + 0x9e3779b9) | 0);

const getEntryContribution = (key: Value, value: Value) =>
  finalizeHash((Math.imul(getValueHash(key), 0x27d4eb2d) + getValueHash(value)) | 0);

const computeValueHash = (value: ObjectValue): number => {
  if (value.kind === "ModelValue") return finalizeHash(combineHash(hashString(value.name), 0x6d));
  if (isSetValue(value)) {
    if (!isEnumerable(value)) return hashString(getValueKey(value));
    const elements = toFiniteSet(value).elements;
    let hash = SET_HASH_SEED;
    for (let index = 0; index < elements.length; index++) {
      hash = (hash + getElementContribution(elements[index])) | 0;
    }
    return hash;
  }
  const fn = toFiniteFunction(value);
  let hash = FUNCTION_HASH_SEED;
  for (let index = 0; index < fn.domain.length; index++) {
    hash = (hash + getEntryContribution(fn.domain[index], fn.range[index])) | 0;
  }
  return hash;
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

const computeValueFingerprint = (value: ObjectValue): number => {
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
  const fn = toFiniteFunction(value);
  let fingerprint = 0x4cf5ad43;
  for (let index = 0; index < fn.domain.length; index++) {
    fingerprint = (fingerprint + getEntryFingerprint(fn.domain[index], fn.range[index])) | 0;
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

const computeValueKey = (value: ObjectValue): string => {
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
  const fn = toFiniteFunction(value);
  return `(${fn.domain.map((key, index) => `${getValueKey(key)}:${getValueKey(fn.range[index])}`).join(",")})`;
};

const formatString = (value: string) =>
  `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\t/g, "\\t")}"`;

const formatLazySet = (
  value:
    | SubsetValue
    | FunctionSetValue
    | RecordSetValue
    | ProductSetValue
    | SetOperationValue
    | FilteredSetValue,
  isExpanded: boolean,
): string => {
  const format = (inner: Value) => formatValue(inner, isExpanded);
  switch (value.kind) {
    case "Subset":
      return `SUBSET ${format(value.base)}`;
    case "FunctionSet":
      return `[${format(value.domain)} -> ${format(value.range)}]`;
    case "RecordSet":
      return `[${value.names.map((name, index) => `${name} : ${format(value.sets[index])}`).join(", ")}]`;
    case "ProductSet":
      return value.factors.map(format).join(" \\X ");
    case "SetOperation":
      return `${format(value.left)} ${value.operator} ${format(value.right)}`;
    case "FilteredSet":
      return `{x \\in ${format(value.base)} : ...}`;
  }
};

export const formatValue = (value: Value, isExpanded = false): string => {
  const format = (inner: Value) => formatValue(inner, isExpanded);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return formatString(value);
  switch (value.kind) {
    case "ModelValue":
      return value.name;
    case "Set":
      return `{${value.elements.map(format).join(", ")}}`;
    case "Interval":
      return `${value.low}..${value.high}`;
    case "InfiniteSet":
      return value.name === "Any" ? "ANY" : value.name;
    case "Subset":
    case "FunctionSet":
    case "RecordSet":
    case "ProductSet":
    case "SetOperation":
    case "FilteredSet":
      return isExpanded && isEnumerable(value)
        ? format(toFiniteSet(value))
        : formatLazySet(value, isExpanded);

    case "SequenceSet":
      return `Seq(${format(value.base)})`;
    case "Function":
    case "LazyFunction": {
      if (value.kind === "LazyFunction" && !isEnumerable(value.domain)) return "<function>";
      const fn = toFiniteFunction(value);
      if (fn.domain.every((key, index) => key === index + 1)) {
        return `<<${fn.range.map(format).join(", ")}>>`;
      }
      if (fn.domain.every((key) => typeof key === "string" && key.length > 0)) {
        return `[${fn.domain.map((key, index) => `${String(key)} |-> ${format(fn.range[index])}`).join(", ")}]`;
      }
      return `(${fn.domain.map((key, index) => `${format(key)} :> ${format(fn.range[index])}`).join(" @@ ")})`;
    }
  }
};
