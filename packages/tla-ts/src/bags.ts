import {
  createModuleArgumentError,
  createOverflowError,
  defineConstant,
  defineHigherOrderOperator,
  defineOperator,
  getJavaClassName,
  getOperator,
  getValue,
  isOutOfRange,
} from "./builtins";
import { TlaEvaluationError, TlaModuleError, TlaNullPointerError } from "./errors";
import type { Builtin, BuiltinArgument } from "./evaluate";
import {
  createFunction,
  createSet,
  createSortedFunction,
  formatValue,
  getDomain,
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
    `Applying ${name} to the following value,\nwhich is not ${expected}:\n${formatValue(value)}`,
  );

const toFunction = (value: Value) => (isFunctionValue(value) ? toFiniteFunction(value) : undefined);

const FINITE_FUNCTION = "a function with a finite domain";

const getFunction = (args: BuiltinArgument[], index: number, name: string) => {
  const value = getValue(args, index, name);
  const functionValue = toFunction(value);
  if (!functionValue) throw createWrongValueError(name, FINITE_FUNCTION, value);
  return functionValue;
};

// Bags.java reads the count of BagIn and CopiesIn without checking that it has a function.
const getCount = (args: BuiltinArgument[], name: string) => {
  const bag = getValue(args, 1, name);
  const functionValue = toFunction(bag);
  if (!functionValue)
    throw new TlaNullPointerError('Cannot read field "values" because "fcn" is null');
  const count = findCount(functionValue, getValue(args, 0, name));
  if (count !== undefined && typeof count !== "number") {
    throw createModuleArgumentError("second", name, "bag", bag);
  }
  return count;
};

// BagCup checks each argument with IsABag, which fails on a value that isn't a function.
const getAddedBag = (
  args: BuiltinArgument[],
  functions: (FunctionValue | undefined)[],
  index: number,
) => {
  const functionValue = functions[index];
  if (!functionValue) {
    throw new TlaNullPointerError(
      'Cannot invoke "tlc2.value.impl.Value.toFcnRcd()" because "b" is null',
    );
  }
  if (!isBag(functionValue)) {
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

// Bags.java casts each count to IntValue, so a count that isn't an integer fails with a
// ClassCastException.
const toCount = (value: Value) => {
  if (typeof value === "number") return value;
  const javaClass = `tlc2.value.impl.${getJavaClassName(value)}`;
  throw new TlaEvaluationError(
    `class ${javaClass} cannot be cast to class tlc2.value.impl.IntValue (${javaClass} and tlc2.value.impl.IntValue are in unnamed module of loader 'app')`,
  );
};

const addCounts = (left: Value, right: Value) => {
  const sum = toCount(left) + toCount(right);
  if (isOutOfRange(sum)) throw createOverflowError(`${left}+${right}`);
  return sum;
};

// TLC subtracts counts as Java ints, which wrap on overflow.
const subtractCounts = (functionValue: FunctionValue, index: number, other: FunctionValue) => {
  const count = toCount(functionValue.range[index]);
  const removed = findCount(other, functionValue.domain[index]);
  return removed === undefined ? count : (count - toCount(removed)) | 0;
};

// BagCup looks up a key of its second bag only among the keys of its first.
const addToBag = (pairs: [Value, Value][], key: Value, count: Value, end = pairs.length) => {
  const existing = pairs.slice(0, end).find((pair) => isEqualLikeTlc(key, pair[0]));
  if (existing) existing[1] = addCounts(existing[1], count);
  else pairs.push([key, count]);
};

const getPairs = (functionValue: FunctionValue) =>
  functionValue.domain.map((key, index): [Value, Value] => [key, functionValue.range[index]]);

const EMPTY_BAG = createSortedFunction([], []);

// SubBag compares the counts with the >= of Naturals, which Integers replaces when TLC loads it.
export const createBagsOperators = (builtins: ReadonlyMap<string, Builtin>): Builtin[] => [
  defineConstant("EmptyBag", EMPTY_BAG),
  defineOperator("IsABag", 1, (args) => {
    const functionValue = toFunction(getValue(args, 0, "IsABag"));
    return functionValue !== undefined && isBag(functionValue);
  }),
  defineOperator("BagCardinality", 1, (args) => {
    const bag = getValue(args, 0, "BagCardinality");
    const functionValue = getFunction(args, 0, "BagCardinality");
    return functionValue.range.reduce<number>((total, count) => {
      if (typeof count !== "number" || count <= 0) {
        throw createWrongValueError("BagCardinality", "a bag", bag);
      }
      return addCounts(total, count);
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
    const pairs = getPairs(left);
    right.domain.forEach((key, index) =>
      addToBag(pairs, key, right.range[index], left.domain.length),
    );
    return createFunction(pairs);
  }),
  defineOperator("\\ominus", 2, (args) => {
    const leftValue = getValue(args, 0, "(-)");
    const rightValue = getValue(args, 1, "(-)");
    const left = toFunction(leftValue);
    const right = toFunction(rightValue);
    if (!left) throw createModuleArgumentError("first", "(-)", "bag", leftValue);
    if (!right) throw createModuleArgumentError("second", "(-)", "bag", rightValue);
    return createFunction(
      left.domain.flatMap((key, index): [Value, Value][] => {
        const count = subtractCounts(left, index, right);
        return count > 0 ? [[key, count]] : [];
      }),
    );
  }),
  defineOperator("BagUnion", 1, (args) => {
    const set = getValue(args, 0, "BagUnion");
    const elements = getFiniteElements(set, () =>
      createWrongValueError("BagUnion", "a finite enumerable set", set),
    );
    if (elements.length < 2) return elements[0] ?? EMPTY_BAG;
    const getBag = (element: Value) => {
      const functionValue = toFunction(element);
      if (!functionValue) {
        throw new TlaModuleError(
          `Attempted to apply BagUnion to the following set, whose\nelement is not a bag:\n${formatValue(set)}`,
        );
      }
      return functionValue;
    };
    const pairs = getPairs(getBag(elements[0]));
    elements.slice(1).forEach((element) => {
      const functionValue = getBag(element);
      functionValue.domain.forEach((key, index) =>
        addToBag(pairs, key, functionValue.range[index]),
      );
    });
    return createFunction(pairs);
  }),
  defineOperator("\\sqsubseteq", 2, (args) => {
    const leftValue = getValue(args, 0, "\\sqsubseteq");
    const rightValue = getValue(args, 1, "\\sqsubseteq");
    const left = toFunction(leftValue);
    const right = toFunction(rightValue);
    if (!left) throw createWrongValueError("\\sqsubseteq", FINITE_FUNCTION, leftValue);
    if (!right) throw createWrongValueError("\\sqsubseteq", FINITE_FUNCTION, rightValue);
    return left.domain.every((_, index) => subtractCounts(left, index, right) <= 0);
  }),
  defineHigherOrderOperator("BagOfAll", 2, (args) => {
    const operator = getOperator(args, 0, "BagOfAll");
    // TLC passes an operator whose body is a number or string literal to Bags.java as that literal.
    if (operator.literalBody !== undefined) {
      throw new TlaModuleError(
        `The first argument of BagOfAll should be an operator, but instead it is:\n${formatValue(operator.literalBody)}`,
      );
    }
    const value = getValue(args, 1, "BagOfAll");
    const functionValue = toFunction(value);
    if (!functionValue) {
      throw createModuleArgumentError("second", "BagOfAll", "function with a finite domain", value);
    }
    const pairs: [Value, Value][] = [];
    functionValue.domain.forEach((key, index) =>
      addToBag(pairs, operator.call([key]), functionValue.range[index]),
    );
    return createFunction(pairs);
  }),
  defineOperator("SubBag", 1, (args) => {
    const value = getValue(args, 0, "SubBag");
    if (!isFunctionValue(value)) {
      throw new TlaEvaluationError(`DOMAIN expects a function but received ${formatValue(value)}`);
    }
    const functionValue = toFiniteFunction(value);
    const range = createSet(functionValue.range).elements;
    const invalid = range.find((count) => typeof count !== "number");
    // A count that isn't an integer fails the comparison.
    if (invalid !== undefined) builtins.get(">=")?.evaluateBinary?.(range[0], invalid);
    const counts = functionValue.range.filter((count) => typeof count === "number");
    if (counts.some((count) => count < 1)) {
      throw new TlaEvaluationError(
        `Attempted to apply a function to ${formatValue(functionValue)}, which is not in its domain`,
      );
    }
    return createSet(
      functionValue.domain
        .reduce<[Value, Value][][]>(
          (subBags, key, index) =>
            subBags.flatMap((entries) => [
              entries,
              ...Array.from({ length: counts[index] }, (_, copies): [Value, Value][] => [
                ...entries,
                [key, copies + 1],
              ]),
            ]),
          [[]],
        )
        .map((entries) =>
          createSortedFunction(
            entries.map((entry) => entry[0]),
            entries.map((entry) => entry[1]),
          ),
        ),
    );
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
