import {
  createJavaOverrideError,
  createModuleArgumentError,
  defineStateOperator,
  getValue,
} from "./builtins";
import type { Builtin, BuiltinArgument } from "./evaluate";
import type { CheckerRuntime } from "./runtime";
import { getEnumeratedFactors, getRandomSubset, type JavaRandom } from "./tlc/random";
import {
  createSet,
  createTuple,
  isEmptySet,
  isEnumerable,
  isSetValue,
  toFiniteSet,
  type Value,
} from "./values";

const RANDOM_SUBSET_SIGNATURE =
  "public static tlc2.value.impl.Value tlc2.module.Randomization.RandomSubset(tlc2.value.impl.Value,tlc2.value.impl.Value)";

// TLCGlobals.setBound: TLC 1.7.4's ValueVec holds at most this many elements of a set.
const SET_BOUND_174 = 1000000;

const getCount = (value: Value, position: string, name: string) => {
  if (typeof value !== "number" || value < 0) {
    throw createModuleArgumentError(position, name, "nonnegative integer", value);
  }
  return value;
};

// SubsetValue.CoinTossingSubsetEnumerator: each pick keeps each element with the probability.
const tossSubsets = (elements: Value[], picks: number, probability: number, random: JavaRandom) =>
  createSet(
    Array.from({ length: picks }, () =>
      createSet(elements.filter(() => random.nextDouble() < probability)),
    ),
  );

const getRandomSetOfSubsets = (args: BuiltinArgument[], runtime: CheckerRuntime) => {
  const name = "RandomSetOfSubsets";
  const picks = getCount(getValue(args, 0, name), "first", name);
  const size = getCount(getValue(args, 1, name), "second", name);
  const set = getValue(args, 2, name);
  if (!isSetValue(set) || !isEnumerable(set)) {
    throw createModuleArgumentError("third", name, "finite set", set);
  }
  const elements = toFiniteSet(set).elements;
  if (elements.length < 31 && picks > 2 ** elements.length) {
    throw createModuleArgumentError(
      "first",
      name,
      `nonnegative integer that is smaller than the subset's size of 2^${elements.length}`,
      picks,
    );
  }
  if (elements.length < size) {
    throw createModuleArgumentError(
      "second",
      name,
      "nonnegative integer in range 0..Cardinality(S)",
      size,
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
      throw createModuleArgumentError("first", "RandomSubset", "nonnegative integer", count);
    }
    if (count < 0) {
      throw createJavaOverrideError(RANDOM_SUBSET_SIGNATURE, String(count));
    }
    const set = getValue(args, 1, "RandomSubset");
    if (!isSetValue(set) || (!isEmptySet(set) && !isEnumerable(set))) {
      throw createModuleArgumentError("second", "RandomSubset", "a finite set", set);
    }
    const factors = getEnumeratedFactors(set, runtime.version);
    if (factors) {
      const size = factors.reduce<number>(
        (total, factor) => total * toFiniteSet(factor).elements.length,
        1,
      );
      if (size > SET_BOUND_174) {
        throw createJavaOverrideError(
          RANDOM_SUBSET_SIGNATURE,
          `Attempted to construct a set with too many elements (>${SET_BOUND_174}).`,
        );
      }
    }
    return createSet(getRandomSubset(count, set, runtime.getRandom(), runtime.version));
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
