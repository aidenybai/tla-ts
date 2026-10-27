import {
  createJavaOverrideError,
  defineConstant,
  defineHigherOrderOperator,
  defineOperator,
  getJavaClassName,
  getOperator,
  getValue,
} from "./builtins";
import { TlaEvaluationError, TlaModuleError } from "./errors";
import type { Builtin, BuiltinArgument } from "./evaluate";
import {
  createFunction,
  createSet,
  createSortedFunction,
  formatValue,
  getDomain,
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
  new TlaModuleError(
    `Applying ${name} to the following value,\nwhich is not ${expected}:\n${formatValue(value)}`,
  );

const describeWrongArgument = (position: string, name: string, expected: string, value: Value) =>
  new TlaModuleError(
    `The ${position} argument of ${name} should be a ${expected}, but instead it is:\n${formatValue(value)}`,
  );

const toFunction = (value: Value) => (isFunctionValue(value) ? toFiniteFunction(value) : undefined);

const getFunction = (args: BuiltinArgument[], index: number, name: string) => {
  const value = getValue(args, index, name);
  const functionValue = toFunction(value);
  if (!functionValue) throw describeWrongValue(name, "a function with a finite domain", value);
  return functionValue;
};

const getBagArgument = (args: BuiltinArgument[], index: number, name: string) => {
  const value = getValue(args, index, name);
  const functionValue = toFunction(value);
  if (!functionValue)
    throw describeWrongArgument(index === 0 ? "first" : "second", name, "bag", value);
  return functionValue;
};

const getFiniteElements = (set: Value, describeError: () => TlaModuleError) => {
  if (!isSetValue(set) || !isEnumerable(set)) throw describeError();
  return toFiniteSet(set).elements;
};

const isBag = (functionValue: FunctionValue) =>
  functionValue.range.every((count) => typeof count === "number" && count > 0);

const getCount = (value: Value, name: string, bag: Value) => {
  if (typeof value !== "number") throw describeWrongValue(name, "a bag", bag);
  return value;
};

const findCount = (functionValue: FunctionValue, element: Value) => {
  const position = functionValue.domain.findIndex((key) => valuesEqual(key, element));
  return position === -1 ? undefined : functionValue.range[position];
};

const getMethod = (name: string, result: string, arity: number) =>
  `public static ${result} tlc2.module.Bags.${name}(${Array.from({ length: arity }, () => "tlc2.value.impl.Value").join(",")})`;

const BAG_DIFF = getMethod("BagDiff", "tlc2.value.impl.Value", 2);
const SQ_SUBSETEQ = getMethod("SqSubseteq", "tlc2.value.IBoolValue", 2);
const BAG_UNION = getMethod("BagUnion", "tlc2.value.impl.Value", 1);
const BAG_OF_ALL = getMethod("BagOfAll", "tlc2.value.impl.Value", 2);
const BAG_ADD = getMethod("BagCup", "tlc2.value.impl.Value", 2);
const BAG_CARDINALITY = getMethod("BagCardinality", "tlc2.value.impl.IntValue", 1);

// Bags.java casts each count to IntValue, so a count that isn't an integer fails with Java's
// ClassCastException.
const toCount = (value: Value, method: string) => {
  if (typeof value === "number") return value;
  const javaClass = `tlc2.value.impl.${getJavaClassName(value)}`;
  throw createJavaOverrideError(
    method,
    `class ${javaClass} cannot be cast to class tlc2.value.impl.IntValue (${javaClass} and tlc2.value.impl.IntValue are in unnamed module of loader 'app')`,
  );
};

const addCounts = (left: Value, right: Value, method: string) => {
  const sum = toCount(left, method) + toCount(right, method);
  if (sum !== (sum | 0)) throw new TlaModuleError(`Overflow when computing ${left}+${right}`);
  return sum;
};

// TLC subtracts counts as Java ints, which wrap on overflow.
const subtractCounts = (
  functionValue: FunctionValue,
  index: number,
  other: FunctionValue,
  method: string,
) => {
  const removed = findCount(other, functionValue.domain[index]);
  const count = toCount(functionValue.range[index], method);
  return removed === undefined ? count : (count - toCount(removed, method)) | 0;
};

const mergeBags = (bags: FunctionValue[], method: string) =>
  createFunction(
    bags.reduce<[Value, Value][]>((pairs, bag) => {
      bag.domain.forEach((key, index) => {
        const existing = pairs.find((pair) => valuesEqual(pair[0], key));
        if (existing) {
          existing[1] = addCounts(existing[1], bag.range[index], method);
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
    const functionValue = toFunction(getValue(args, 0, "IsABag"));
    return functionValue !== undefined && isBag(functionValue);
  }),
  defineOperator("BagCardinality", 1, (args) => {
    const bag = getValue(args, 0, "BagCardinality");
    const functionValue = getFunction(args, 0, "BagCardinality");
    return functionValue.range.reduce<number>((total, count) => {
      const copies = getCount(count, "BagCardinality", bag);
      if (copies <= 0) throw describeWrongValue("BagCardinality", "a bag", bag);
      return addCounts(total, copies, BAG_CARDINALITY);
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
      const functionValue = getBagArgument(args, index, "(+)");
      if (!isBag(functionValue)) {
        throw describeWrongArgument(
          index === 0 ? "first" : "second",
          "(+)",
          "bag",
          getValue(args, index, "(+)"),
        );
      }
      return functionValue;
    });
    return mergeBags(bags, BAG_ADD);
  }),
  defineOperator("\\ominus", 2, (args) => {
    const left = getBagArgument(args, 0, "(-)");
    const right = getBagArgument(args, 1, "(-)");
    return createFunction(
      left.domain.flatMap((key, index): [Value, Value][] => {
        const count = subtractCounts(left, index, right, BAG_DIFF);
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
      const functionValue = toFunction(element);
      if (!functionValue) {
        throw new TlaModuleError(
          `Attempted to apply BagUnion to the following set, whose\nelement is not a bag:\n${formatValue(set)}`,
        );
      }
      return functionValue;
    });
    return mergeBags(bags, BAG_UNION);
  }),
  defineOperator("\\sqsubseteq", 2, (args) => {
    const left = getFunction(args, 0, "\\sqsubseteq");
    const right = getFunction(args, 1, "\\sqsubseteq");
    return left.domain.every((_, index) => subtractCounts(left, index, right, SQ_SUBSETEQ) <= 0);
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
      throw describeWrongArgument("second", "BagOfAll", "function with a finite domain", value);
    }
    return mergeBags(
      functionValue.domain.map((key, index) =>
        createSortedFunction([operator.call([key])], [functionValue.range[index]]),
      ),
      BAG_OF_ALL,
    );
  }),
  defineOperator("SubBag", 1, (args) => {
    const value = getValue(args, 0, "SubBag");
    if (!isFunctionValue(value)) {
      throw new TlaEvaluationError(`DOMAIN expects a function but received ${formatValue(value)}`);
    }
    const functionValue = toFiniteFunction(value);
    const range = createSet(functionValue.range).elements;
    const invalid = range.find((count) => typeof count !== "number");
    if (invalid !== undefined) {
      const isFirst = typeof range[0] !== "number";
      throw new TlaEvaluationError(
        `The ${isFirst ? "first" : "second"} argument of >= should be an integer, but instead it is:\n${formatValue(isFirst ? range[0] : invalid)}`,
      );
    }
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
      describeWrongValue("BagToSet", "a function with a finite domain", set),
    );
    return createSortedFunction(
      [...elements],
      elements.map(() => 1),
    );
  }),
];
