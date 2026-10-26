import {
  defineConstant,
  defineHigherOrderOperator,
  defineOperator,
  getOperator,
  getValue,
  toNumber,
} from "./builtins";
import { TlaEvaluationError } from "./errors";
import type { Builtin, BuiltinArgument } from "./evaluate";
import {
  createFunction,
  createSet,
  createSortedFunction,
  createSortedSet,
  formatValue,
  isEnumerable,
  isFunctionValue,
  isSetValue,
  toFiniteFunction,
  toFiniteSet,
  valuesEqual,
  type FunctionValue,
  type Value,
} from "./values";

const describeWrongValue = (name: string, expected: string, value: Value) =>
  new TlaEvaluationError(
    `Applying ${name} to the following value,\nwhich is not ${expected}:\n${formatValue(value)}`,
  );

const describeWrongArgument = (position: string, name: string, expected: string, value: Value) =>
  new TlaEvaluationError(
    `The ${position} argument of ${name} should be a ${expected}, but instead it is:\n${formatValue(value)}`,
  );

const toFunction = (value: Value) => (isFunctionValue(value) ? toFiniteFunction(value) : undefined);

const getFunction = (args: BuiltinArgument[], index: number, name: string) => {
  const value = getValue(args, index, name);
  const fn = toFunction(value);
  if (!fn) throw describeWrongValue(name, "a function with a finite domain", value);
  return fn;
};

const getBagArgument = (args: BuiltinArgument[], index: number, name: string) => {
  const value = getValue(args, index, name);
  const fn = toFunction(value);
  if (!fn) throw describeWrongArgument(index === 0 ? "first" : "second", name, "bag", value);
  return fn;
};

const getFiniteElements = (set: Value, describeError: () => TlaEvaluationError) => {
  if (!isSetValue(set) || !isEnumerable(set)) throw describeError();
  return toFiniteSet(set).elements;
};

const isBag = (fn: FunctionValue) =>
  fn.range.every((count) => typeof count === "number" && count > 0);

const getCount = (value: Value, name: string, bag: Value) => {
  if (typeof value !== "number") throw describeWrongValue(name, "a bag", bag);
  return value;
};

const findCount = (fn: FunctionValue, element: Value) => {
  const position = fn.domain.findIndex((key) => valuesEqual(key, element));
  return position === -1 ? undefined : fn.range[position];
};

const addCounts = (left: Value, right: Value, name: string) => {
  const sum = toNumber(left, name) + toNumber(right, name);
  if (sum !== (sum | 0)) throw new TlaEvaluationError(`Overflow when computing ${left}+${right}`);
  return sum;
};

// TLC subtracts counts as Java ints, which wrap on overflow.
const subtractCounts = (fn: FunctionValue, index: number, other: FunctionValue, name: string) => {
  const removed = findCount(other, fn.domain[index]);
  const count = toNumber(fn.range[index], name);
  return removed === undefined ? count : (count - toNumber(removed, name)) | 0;
};

const mergeBags = (bags: FunctionValue[], name: string) =>
  createFunction(
    bags.reduce<[Value, Value][]>((pairs, bag) => {
      bag.domain.forEach((key, index) => {
        const existing = pairs.find((pair) => valuesEqual(pair[0], key));
        if (existing) {
          existing[1] = addCounts(existing[1], bag.range[index], name);
          return;
        }
        pairs.push([key, bag.range[index]]);
      });
      return pairs;
    }, []),
  );

const EMPTY_BAG = createSortedFunction([], []);

export const BAGS_OPERATORS: Builtin[] = [
  defineConstant("EmptyBag", EMPTY_BAG),
  defineOperator("IsABag", 1, (args) => {
    const fn = toFunction(getValue(args, 0, "IsABag"));
    return fn !== undefined && isBag(fn);
  }),
  defineOperator("BagCardinality", 1, (args) => {
    const bag = getValue(args, 0, "BagCardinality");
    const fn = getFunction(args, 0, "BagCardinality");
    return fn.range.reduce<number>((total, count) => {
      const copies = getCount(count, "BagCardinality", bag);
      if (copies <= 0) throw describeWrongValue("BagCardinality", "a bag", bag);
      return addCounts(total, copies, "BagCardinality");
    }, 0);
  }),
  defineOperator("BagIn", 2, (args) => {
    const bag = getValue(args, 1, "BagIn");
    const count = findCount(getFunction(args, 1, "BagIn"), getValue(args, 0, "BagIn"));
    if (count === undefined) return false;
    if (typeof count !== "number") throw describeWrongArgument("second", "BagIn", "bag", bag);
    return count > 0;
  }),
  defineOperator("CopiesIn", 2, (args) => {
    const bag = getValue(args, 1, "CopiesIn");
    const count = findCount(getFunction(args, 1, "CopiesIn"), getValue(args, 0, "CopiesIn"));
    if (count === undefined) return 0;
    if (typeof count !== "number") throw describeWrongArgument("second", "CopiesIn", "bag", bag);
    return count;
  }),
  defineOperator("\\oplus", 2, (args) => {
    const bags = [0, 1].map((index) => {
      const fn = getBagArgument(args, index, "(+)");
      if (!isBag(fn)) {
        throw describeWrongArgument(
          index === 0 ? "first" : "second",
          "(+)",
          "bag",
          getValue(args, index, "(+)"),
        );
      }
      return fn;
    });
    return mergeBags(bags, "(+)");
  }),
  defineOperator("\\ominus", 2, (args) => {
    const left = getBagArgument(args, 0, "(-)");
    const right = getBagArgument(args, 1, "(-)");
    return createFunction(
      left.domain.flatMap((key, index): [Value, Value][] => {
        const count = subtractCounts(left, index, right, "(-)");
        return count > 0 ? [[key, count]] : [];
      }),
    );
  }),
  defineOperator("BagUnion", 1, (args) => {
    const set = getValue(args, 0, "BagUnion");
    const elements = getFiniteElements(set, () =>
      describeWrongValue("BagUnion", "a finite enumerable set", set),
    );
    if (elements.length < 2) return elements[0] ?? EMPTY_BAG;
    const bags = elements.map((element) => {
      const fn = toFunction(element);
      if (!fn) {
        throw new TlaEvaluationError(
          `Attempted to apply BagUnion to the following set, whose\nelement is not a bag:\n${formatValue(set)}`,
        );
      }
      return fn;
    });
    return mergeBags(bags, "BagUnion");
  }),
  defineOperator("\\sqsubseteq", 2, (args) => {
    const left = getFunction(args, 0, "\\sqsubseteq");
    const right = getFunction(args, 1, "\\sqsubseteq");
    return left.domain.every((_, index) => subtractCounts(left, index, right, "\\sqsubseteq") <= 0);
  }),
  defineHigherOrderOperator("BagOfAll", 2, (args) => {
    const operator = getOperator(args, 0, "BagOfAll");
    // TLC passes an operator whose body is a number or string literal to Bags.java as that literal.
    if (operator.literalBody !== undefined) {
      throw new TlaEvaluationError(
        `The first argument of BagOfAll should be an operator, but instead it is:\n${formatValue(operator.literalBody)}`,
      );
    }
    const value = getValue(args, 1, "BagOfAll");
    const fn = toFunction(value);
    if (!fn) {
      throw describeWrongArgument("second", "BagOfAll", "function with a finite domain", value);
    }
    return mergeBags(
      fn.domain.map((key, index) =>
        createSortedFunction([operator.call([key])], [fn.range[index]]),
      ),
      "BagOfAll",
    );
  }),
  defineOperator("SubBag", 1, (args) => {
    const value = getValue(args, 0, "SubBag");
    if (!isFunctionValue(value)) {
      throw new TlaEvaluationError(`DOMAIN expects a function but received ${formatValue(value)}`);
    }
    const fn = toFiniteFunction(value);
    const range = createSet(fn.range).elements;
    const invalid = range.find((count) => typeof count !== "number");
    if (invalid !== undefined) {
      const isFirst = typeof range[0] !== "number";
      throw new TlaEvaluationError(
        `The ${isFirst ? "first" : "second"} argument of >= should be an integer, but instead it is:\n${formatValue(isFirst ? range[0] : invalid)}`,
      );
    }
    const counts = fn.range.map((count) => toNumber(count, "SubBag"));
    if (counts.some((count) => count < 1)) {
      throw new TlaEvaluationError(
        `Attempted to apply a function to ${formatValue(fn)}, which is not in its domain`,
      );
    }
    return createSet(
      fn.domain
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
  defineOperator("BagToSet", 1, (args) => createSortedSet(getFunction(args, 0, "BagToSet").domain)),
  defineOperator("SetToBag", 1, (args) => {
    const set = getValue(args, 0, "SetToBag");
    const elements = getFiniteElements(set, () =>
      describeWrongValue("BagToSet", "a function with a finite domain", set),
    );
    return createSortedFunction(
      elements,
      elements.map(() => 1),
    );
  }),
];
