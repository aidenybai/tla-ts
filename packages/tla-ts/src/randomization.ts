import { createModuleArgumentError, defineOperator, getValue, overrideWithJava } from "./builtins";
import { TlaEvaluationError } from "./errors";
import type { Builtin, BuiltinArgument } from "./evaluate";
import { parseJavaDouble } from "./java-string";
import type { CheckerRuntime } from "./runtime";
import { getEnumeratedFactors, getRandomSubset, type JavaRandom } from "./tlc/random";
import {
  createSet,
  getCardinality,
  isTlcEnumerable,
  isEnumerable,
  isFiniteSet,
  isOverriddenSet,
  isSetValue,
  getMaximumSetSize,
  getSetBoundMessage,
  toFiniteSet,
  type Value,
} from "./values";

const RANDOM_SUBSET_SIGNATURE =
  "public static tlc2.value.impl.Value tlc2.module.Randomization.RandomSubset(tlc2.value.impl.Value,tlc2.value.impl.Value)";

const getCount = (value: Value, position: string, name: string) => {
  if (typeof value !== "number" || value < 0) {
    throw createModuleArgumentError(position, name, "nonnegative integer", value);
  }
  return value;
};

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

// TLC's Java class names the operator RandomSubsetSetProbability in its errors.
export const createRandomSubsetSet = (runtime: CheckerRuntime) =>
  defineOperator("RandomSubsetSet", 3, (args) => {
    const name = "RandomSubsetSetProbability";
    const picks = getCount(getValue(args, 0, name), "first", name);
    const text = getValue(args, 1, name);
    if (typeof text !== "string") {
      throw createModuleArgumentError(
        "second",
        name,
        "string literal representing a probability",
        text,
      );
    }
    const probability = parseJavaDouble(text);
    if (probability === undefined || probability < 0 || probability > 1) {
      throw createModuleArgumentError(
        "second",
        name,
        "string literal does not represent a parsable probability",
        text,
      );
    }
    const set = getValue(args, 2, name);
    if (!isSetValue(set) || isOverriddenSet(set) || !isFiniteSet(set)) {
      throw createModuleArgumentError("third", name, "finite set", set);
    }
    const size = getCardinality(set);
    if (32 - Math.clz32(picks) > size && picks > 1 << size) {
      throw createModuleArgumentError(
        "first",
        name,
        `nonnegative integer that is smaller than the subset's size of 2^${size}`,
        picks,
      );
    }
    return tossSubsets(toFiniteSet(set).elements, picks, probability, runtime.getRandom());
  });

export const createRandomizationOperators = (runtime: CheckerRuntime): Builtin[] => [
  overrideWithJava(
    defineOperator("RandomSubset", 2, (args) => {
      // Deviation from TLC: Randomization#RandomSubset passes a negative count to new ValueVec, which throws a NegativeArraySizeException.
      const count = getCount(getValue(args, 0, "RandomSubset"), "first", "RandomSubset");
      const set = getValue(args, 1, "RandomSubset");
      if (!isTlcEnumerable(set) || !isFiniteSet(set)) {
        throw createModuleArgumentError("second", "RandomSubset", "a finite set", set);
      }
      const factors = getEnumeratedFactors(set, runtime.version);
      if (factors) {
        const size = factors.reduce<number>(
          (total, factor) => total * toFiniteSet(factor).elements.length,
          1,
        );
        if (size > getMaximumSetSize()) {
          throw new TlaEvaluationError(getSetBoundMessage());
        }
      }
      return createSet(getRandomSubset(count, set, runtime.getRandom(), runtime.version));
    }),
    RANDOM_SUBSET_SIGNATURE,
  ),
  defineOperator("RandomSetOfSubsets", 3, (args) => getRandomSetOfSubsets(args, runtime)),
];
