import { defineStateOperator, getValue } from "./builtins";
import { TlaEvaluationError } from "./errors";
import type { Builtin, BuiltinArgument } from "./evaluate";
import type { CheckerRuntime } from "./runtime";
import { getRandomSubset, type JavaRandom } from "./tlc-random";
import {
  createSet,
  createTuple,
  formatValue,
  isEmptySet,
  isEnumerable,
  isSetValue,
  toFiniteSet,
  type Value,
} from "./values";

const describeArgument = (position: string, name: string, expected: string, value: string) =>
  new TlaEvaluationError(
    `The ${position} argument of ${name} should be a ${expected}, but instead it is:\n${value}`,
  );

const getCount = (value: Value, position: string, name: string) => {
  if (typeof value !== "number" || value < 0) {
    throw describeArgument(position, name, "nonnegative integer", formatValue(value));
  }
  return value;
};

const getFiniteElements = (value: Value, position: string, name: string, expected: string) => {
  if (!isSetValue(value) || !isEnumerable(value)) {
    throw describeArgument(position, name, expected, formatValue(value));
  }
  return toFiniteSet(value).elements;
};

// SubsetValue.CoinTossingSubsetEnumerator: each pick keeps each element with the probability.
const tossSubsets = (elements: Value[], picks: number, probability: number, random: JavaRandom) =>
  createSet(
    Array.from({ length: picks }, () =>
      createSet(elements.filter(() => random.nextDouble() < probability)),
    ),
  );

const checkPicks = (picks: number, size: number, name: string) => {
  if (size < 31 && picks > 2 ** size) {
    throw describeArgument(
      "first",
      name,
      `nonnegative integer that is smaller than the subset's size of 2^${size}`,
      String(picks),
    );
  }
};

const getRandomSetOfSubsets = (args: BuiltinArgument[], runtime: CheckerRuntime) => {
  const name = "RandomSetOfSubsets";
  const picks = getCount(getValue(args, 0, name), "first", name);
  const size = getCount(getValue(args, 1, name), "second", name);
  const elements = getFiniteElements(getValue(args, 2, name), "third", name, "finite set");
  checkPicks(picks, elements.length, name);
  if (elements.length < size) {
    throw describeArgument(
      "second",
      name,
      "nonnegative integer in range 0..Cardinality(S)",
      String(size),
    );
  }
  return tossSubsets(
    elements,
    picks,
    elements.length === 0 ? 0 : size / elements.length,
    runtime.getRandom(),
  );
};

export const createRandomizationOperators = (runtime: CheckerRuntime): Builtin[] => [
  defineStateOperator("RandomSubset", 2, (args) => {
    const count = getValue(args, 0, "RandomSubset");
    if (typeof count !== "number") {
      throw describeArgument("first", "RandomSubset", "nonnegative integer", formatValue(count));
    }
    if (count < 0) {
      throw new TlaEvaluationError(
        `Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.Value tlc2.module.Randomization.RandomSubset(tlc2.value.impl.Value,tlc2.value.impl.Value),\nbut it produced the following error:\n${count}`,
      );
    }
    const set = getValue(args, 1, "RandomSubset");
    if (!isSetValue(set) || (!isEmptySet(set) && !isEnumerable(set))) {
      throw describeArgument("second", "RandomSubset", "a finite set", formatValue(set));
    }
    return createSet(getRandomSubset(count, set, runtime.getRandom()));
  }),
  defineStateOperator("RandomSetOfSubsets", 3, (args) => getRandomSetOfSubsets(args, runtime)),
  defineStateOperator("TestRandomSetOfSubsets", 3, (args) =>
    createTuple(
      Array.from(
        { length: 5 },
        () => toFiniteSet(getRandomSetOfSubsets(args, runtime)).elements.length,
      ),
    ),
  ),
];
