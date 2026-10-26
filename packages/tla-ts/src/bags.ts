import {
  defineConstant,
  defineHigherOrderOperator,
  defineOperator,
  getElements,
  getOperator,
  getValue,
} from "./builtins";
import { TlaEvaluationError } from "./errors";
import type { Builtin, BuiltinArgument } from "./evaluate";
import {
  checkInteger,
  createFunction,
  createSortedFunction,
  getDomain,
  formatValue,
  isEnumerable,
  isFunctionValue,
  toFiniteFunction,
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

const toFunction = (value: Value): FunctionValue | undefined =>
  isFunctionValue(value) && (value.kind === "Function" || isEnumerable(value.domain))
    ? toFiniteFunction(value)
    : undefined;

const getFunction = (args: BuiltinArgument[], index: number, name: string) => {
  const value = getValue(args, index, name);
  const fn = toFunction(value);
  if (!fn) throw describeWrongValue(name, "a function with a finite domain", value);
  return fn;
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

const addCounts = (left: number, right: number) => {
  const sum = left + right;
  if (sum > 2147483647) throw new TlaEvaluationError(`Overflow when computing ${left}+${right}`);
  return sum;
};

const mergeBags = (bags: FunctionValue[]) =>
  createFunction(
    bags.reduce<[Value, Value][]>((pairs, bag) => {
      bag.domain.forEach((key, index) => {
        const existing = pairs.find((pair) => valuesEqual(pair[0], key));
        if (existing) {
          existing[1] = addCounts(Number(existing[1]), Number(bag.range[index]));
          return;
        }
        pairs.push([key, bag.range[index]]);
      });
      return pairs;
    }, []),
  );

export const BAGS_OPERATORS: Builtin[] = [
  defineConstant("EmptyBag", createSortedFunction([], [])),
  defineOperator("IsABag", 1, (args) => {
    const fn = toFunction(getValue(args, 0, "IsABag"));
    return fn !== undefined && isBag(fn);
  }),
  defineOperator("BagCardinality", 1, (args) => {
    const bag = getValue(args, 0, "BagCardinality");
    const fn = getFunction(args, 0, "BagCardinality");
    return checkInteger(
      fn.range.reduce<number>((total, count) => {
        const copies = getCount(count, "BagCardinality", bag);
        if (copies <= 0) throw describeWrongValue("BagCardinality", "a bag", bag);
        return addCounts(total, copies);
      }, 0),
    );
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
      const fn = getFunction(args, index, "(+)");
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
    return mergeBags(bags);
  }),
  defineOperator("\\ominus", 2, (args) => {
    const left = getFunction(args, 0, "(-)");
    const right = getFunction(args, 1, "(-)");
    return createFunction(
      left.domain.flatMap((key, index): [Value, Value][] => {
        const removed = findCount(right, key);
        const count = Number(left.range[index]) - (removed === undefined ? 0 : Number(removed));
        return count > 0 ? [[key, count]] : [];
      }),
    );
  }),
  defineOperator("BagUnion", 1, (args) => {
    const set = getValue(args, 0, "BagUnion");
    const bags = getElements(args, 0, "BagUnion").map((element) => {
      const fn = toFunction(element);
      if (!fn) {
        throw new TlaEvaluationError(
          `Attempted to apply BagUnion to the following set, whose\nelement is not a bag:\n${formatValue(set)}`,
        );
      }
      return fn;
    });
    if (bags.length === 1) return bags[0];
    return mergeBags(bags);
  }),
  defineOperator("\\sqsubseteq", 2, (args) => {
    const left = getFunction(args, 0, "\\sqsubseteq");
    const right = getFunction(args, 1, "\\sqsubseteq");
    return left.domain.every((key, index) => {
      const count = findCount(right, key);
      return Number(left.range[index]) - (count === undefined ? 0 : Number(count)) <= 0;
    });
  }),
  defineHigherOrderOperator("BagOfAll", 2, (args) => {
    const operator = getOperator(args, 0, "BagOfAll");
    const value = getValue(args, 1, "BagOfAll");
    const fn = toFunction(value);
    if (!fn) {
      throw describeWrongArgument("second", "BagOfAll", "function with a finite domain", value);
    }
    return mergeBags(
      fn.domain.map((key, index) =>
        createSortedFunction([operator.call([key])], [fn.range[index]]),
      ),
    );
  }),
  defineOperator("SubBag", 1, (args) => {
    getFunction(args, 0, "SubBag");
    throw new TlaEvaluationError("SubBag is not implemented.");
  }),
  defineOperator("BagToSet", 1, (args) => getDomain(getFunction(args, 0, "BagToSet"))),
  defineOperator("SetToBag", 1, (args) => {
    const elements = getElements(args, 0, "SetToBag");
    return createSortedFunction(
      [...elements],
      elements.map(() => 1),
    );
  }),
];
