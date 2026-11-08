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
  getCardinality,
  isEmptySet,
  isEnumerable,
  isFiniteSet,
  isOverriddenSet,
  isSetValue,
  SET_BOUND,
  SET_BOUND_MESSAGE,
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

const JAVA_DECIMAL = /^[+-]?(?:NaN|Infinity|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?[fFdD]?)$/;
const JAVA_HEXADECIMAL = /^([+-]?)0[xX]([0-9a-fA-F]*)(?:\.([0-9a-fA-F]*))?[pP]([+-]?\d+)[fFdD]?$/;

const parseJavaDouble = (text: string) => {
  const trimmed = text.replace(/^[^!-\uffff]+|[^!-\uffff]+$/g, "");
  if (JAVA_DECIMAL.test(trimmed)) return Number(trimmed.replace(/[fFdD]$/, ""));
  const hexadecimal = JAVA_HEXADECIMAL.exec(trimmed);
  if (!hexadecimal) return undefined;
  const fraction = hexadecimal[3] ?? "";
  const digits = `${hexadecimal[2]}${fraction}`;
  if (digits === "") return undefined;
  const magnitude =
    Number.parseInt(digits, 16) * 2 ** (Number(hexadecimal[4]) - 4 * fraction.length);
  return hexadecimal[1] === "-" ? -magnitude : magnitude;
};

// TLC's Java class names the operator RandomSubsetSetProbability in its errors.
export const createRandomSubsetSet = (runtime: CheckerRuntime) =>
  defineStateOperator("RandomSubsetSet", 3, (args) => {
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
      if (size > SET_BOUND) {
        throw createJavaOverrideError(RANDOM_SUBSET_SIGNATURE, SET_BOUND_MESSAGE);
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
