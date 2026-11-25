import {
  createModuleArgumentError,
  createOverflowError,
  defineConstant,
  defineHigherOrderOperator,
  defineOperator,
  getOperator,
  getValue,
  isOutOfRange,
} from "./builtins";
import { TlaModuleError } from "./errors";
import type { Builtin } from "./evaluate";
import { prettyPrint } from "./pretty-print";
import {
  createSortedFunction,
  createSortedPairsFunction,
  createWrittenFunction,
  formatValue,
  getDomain,
  getWrittenPairs,
  isEnumerable,
  isEqualLikeTlc,
  isFunctionValue,
  isSetValue,
  toFiniteFunction,
  toFiniteSet,
  type FunctionValue,
  type Value,
} from "./values";

const createWrongValueError = (name: string, expected: string, value: Value) =>
  new TlaModuleError(
    `Applying ${name} to the following value,\nwhich is not ${expected}:\n${prettyPrint(formatValue(value))}`,
  );

const toFunction = (value: Value) => (isFunctionValue(value) ? toFiniteFunction(value) : undefined);

const FINITE_FUNCTION = "a function with a finite domain";

const getFunction = (args: Value[], index: number, name: string) => {
  const value = getValue(args, index, name);
  const functionValue = toFunction(value);
  if (!functionValue) throw createWrongValueError(name, FINITE_FUNCTION, value);
  return functionValue;
};

// Deviation from TLC: Bags#BagIn and Bags#CopiesIn read the null that toFcnRcd gives for a value that isn't a function and leak a NullPointerException, where tla-ts reports the argument as not a bag.
const getCount = (args: Value[], name: string) => {
  const bag = getValue(args, 1, name);
  const functionValue = toFunction(bag);
  const count = functionValue && findCount(functionValue, getValue(args, 0, name));
  if (!functionValue || (count !== undefined && typeof count !== "number")) {
    throw createModuleArgumentError("second", name, "bag", bag);
  }
  return count;
};

// Deviation from TLC: Bags#BagCup passes the null that toFcnRcd gives for a value that isn't a function to IsABag and leaks a NullPointerException, where tla-ts reports the argument as not a bag.
const getAddedBag = (args: Value[], functions: (FunctionValue | undefined)[], index: number) => {
  const functionValue = functions[index];
  if (!functionValue || !isBag(functionValue)) {
    throw createModuleArgumentError(
      index === 0 ? "first" : "second",
      "(+)",
      "bag",
      getValue(args, index, "(+)"),
    );
  }
  return functionValue;
};

const getFiniteElements = (set: Value, describeError: () => TlaModuleError) => {
  if (!isSetValue(set) || !isEnumerable(set)) throw describeError();
  return toFiniteSet(set).elements;
};

const isBag = (functionValue: FunctionValue) =>
  functionValue.range.every((count) => typeof count === "number" && count > 0);

const findCount = (functionValue: FunctionValue, element: Value) => {
  const position = functionValue.domain.findIndex((key) => isEqualLikeTlc(element, key));
  return position === -1 ? undefined : functionValue.range[position];
};

// Deviation from TLC: Bags.java casts a count to IntValue and leaks the ClassCastException, where tla-ts reports the argument as not a bag.
const toCount = (value: Value, createError: () => TlaModuleError) => {
  if (typeof value === "number") return value;
  throw createError();
};

const addCounts = (left: Value, right: Value, createError: () => TlaModuleError) => {
  const sum = toCount(left, createError) + toCount(right, createError);
  if (isOutOfRange(sum)) throw createOverflowError(`${left}+${right}`);
  return sum;
};

// Deviation from TLC: Bags#BagDiff subtracts counts as Java ints that wrap, where tla-ts reports the overflow as - does.
const subtractCounts = (
  pair: [Value, Value],
  other: FunctionValue,
  createLeftError: () => TlaModuleError,
  createRightError: () => TlaModuleError,
) => {
  const count = toCount(pair[1], createLeftError);
  const removed = findCount(other, pair[0]);
  if (removed === undefined) return count;
  const difference = count - toCount(removed, createRightError);
  if (isOutOfRange(difference)) throw createOverflowError(`${count}-${removed}`);
  return difference;
};

// BagCup looks up a key of its second bag only among the keys of its first.
const addToBag = (
  pairs: [Value, Value][],
  key: Value,
  count: Value,
  createError: () => TlaModuleError,
  end = pairs.length,
) => {
  const existing = pairs.slice(0, end).find((pair) => isEqualLikeTlc(key, pair[0]));
  if (existing) existing[1] = addCounts(existing[1], count, createError);
  else pairs.push([key, count]);
};

const EMPTY_BAG = createSortedFunction([], []);

export const BAGS_OPERATORS: Builtin[] = [
  defineConstant("EmptyBag", EMPTY_BAG),
  defineOperator("IsABag", 1, (args) => {
    const functionValue = toFunction(getValue(args, 0, "IsABag"));
    return functionValue !== undefined && isBag(functionValue);
  }),
  defineOperator("BagCardinality", 1, (args) => {
    const bag = getValue(args, 0, "BagCardinality");
    const functionValue = getFunction(args, 0, "BagCardinality");
    const createError = () => createWrongValueError("BagCardinality", "a bag", bag);
    return functionValue.range.reduce<number>((total, count) => {
      if (typeof count !== "number" || count <= 0) throw createError();
      return addCounts(total, count, createError);
    }, 0);
  }),
  defineOperator("BagIn", 2, (args) => {
    const count = getCount(args, "BagIn");
    return count !== undefined && count > 0;
  }),
  defineOperator("CopiesIn", 2, (args) => getCount(args, "CopiesIn") ?? 0),
  defineOperator("\\oplus", 2, (args) => {
    const functions = [0, 1].map((index) => toFunction(getValue(args, index, "(+)")));
    const left = getAddedBag(args, functions, 0);
    const right = getAddedBag(args, functions, 1);
    const pairs = getWrittenPairs(left);
    const rightPairs = getWrittenPairs(right);
    const createError = () =>
      createModuleArgumentError("second", "(+)", "bag", getValue(args, 1, "(+)"));
    for (let index = 0; index < rightPairs.length; index++) {
      addToBag(pairs, rightPairs[index][0], rightPairs[index][1], createError, left.domain.length);
    }
    return createWrittenFunction(pairs);
  }),
  defineOperator("\\ominus", 2, (args) => {
    const leftValue = getValue(args, 0, "(-)");
    const rightValue = getValue(args, 1, "(-)");
    const left = toFunction(leftValue);
    const right = toFunction(rightValue);
    if (!left) throw createModuleArgumentError("first", "(-)", "bag", leftValue);
    if (!right) throw createModuleArgumentError("second", "(-)", "bag", rightValue);
    const createLeftError = () => createModuleArgumentError("first", "(-)", "bag", leftValue);
    const createRightError = () => createModuleArgumentError("second", "(-)", "bag", rightValue);
    const leftPairs = getWrittenPairs(left);
    const pairs: [Value, Value][] = [];
    for (let index = 0; index < leftPairs.length; index++) {
      const pair = leftPairs[index];
      const count = subtractCounts(pair, right, createLeftError, createRightError);
      if (count > 0) {
        pair[1] = count;
        pairs.push(pair);
      }
    }
    // Bags#BagDiff builds the difference normalized when the first bag is.
    return left.writtenKeys === undefined
      ? createSortedPairsFunction(pairs)
      : createWrittenFunction(pairs);
  }),
  defineOperator("BagUnion", 1, (args) => {
    const set = getValue(args, 0, "BagUnion");
    const elements = getFiniteElements(set, () =>
      createWrongValueError("BagUnion", "a finite enumerable set", set),
    );
    if (elements.length < 2) return elements[0] ?? EMPTY_BAG;
    const createUnionError = () =>
      new TlaModuleError(
        `Attempted to apply BagUnion to the following set, whose\nelement is not a bag:\n${prettyPrint(formatValue(set))}`,
      );
    const getBag = (element: Value) => {
      const functionValue = toFunction(element);
      if (!functionValue) throw createUnionError();
      return functionValue;
    };
    const pairs = getWrittenPairs(getBag(elements[0]));
    for (let index = 1; index < elements.length; index++) {
      const bagPairs = getWrittenPairs(getBag(elements[index]));
      for (let pairIndex = 0; pairIndex < bagPairs.length; pairIndex++) {
        addToBag(pairs, bagPairs[pairIndex][0], bagPairs[pairIndex][1], createUnionError);
      }
    }
    return createWrittenFunction(pairs);
  }),
  defineOperator("\\sqsubseteq", 2, (args) => {
    const leftValue = getValue(args, 0, "\\sqsubseteq");
    const rightValue = getValue(args, 1, "\\sqsubseteq");
    const left = toFunction(leftValue);
    const right = toFunction(rightValue);
    if (!left) throw createWrongValueError("\\sqsubseteq", FINITE_FUNCTION, leftValue);
    if (!right) throw createWrongValueError("\\sqsubseteq", FINITE_FUNCTION, rightValue);
    const createLeftError = () => createWrongValueError("\\sqsubseteq", "a bag", leftValue);
    const createRightError = () => createWrongValueError("\\sqsubseteq", "a bag", rightValue);
    return left.domain.every((key, index) => {
      const count = findCount(right, key);
      return (
        toCount(left.range[index], createLeftError) <=
        (count === undefined ? 0 : toCount(count, createRightError))
      );
    });
  }),
  defineHigherOrderOperator("BagOfAll", 2, (args) => {
    const operator = getOperator(args, 0, "BagOfAll");
    const value = getValue(args, 1, "BagOfAll");
    const functionValue = toFunction(value);
    if (!functionValue) {
      throw createModuleArgumentError("second", "BagOfAll", "function with a finite domain", value);
    }
    const pairs: [Value, Value][] = [];
    const createError = () => createModuleArgumentError("second", "BagOfAll", "bag", value);
    const writtenPairs = getWrittenPairs(functionValue);
    for (let index = 0; index < writtenPairs.length; index++) {
      addToBag(pairs, operator.call([writtenPairs[index][0]]), writtenPairs[index][1], createError);
    }
    return createWrittenFunction(pairs);
  }),
  defineOperator("BagToSet", 1, (args) => getDomain(getFunction(args, 0, "BagToSet"))),
  defineOperator("SetToBag", 1, (args) => {
    const set = getValue(args, 0, "SetToBag");
    const elements = getFiniteElements(set, () =>
      createWrongValueError("BagToSet", FINITE_FUNCTION, set),
    );
    return createSortedFunction(
      [...elements],
      elements.map(() => 1),
    );
  }),
];
