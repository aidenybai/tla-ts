import { defineStateOperator, getValue } from "./builtins";
import { TlaEvaluationError } from "./errors";
import type { Builtin, BuiltinArgument } from "./evaluate";
import type { CheckerRuntime } from "./runtime";
import {
  createRecord,
  createSet,
  createSortedFunction,
  createTuple,
  formatValue,
  getCardinality,
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

const getMixedRadixElement = (sets: Value[], index: number) => {
  const lists = sets.map((set) => toFiniteSet(set).elements);
  return lists.reduceRight<{ remaining: number; elements: Value[] }>(
    (current, list) => ({
      remaining: Math.floor(current.remaining / list.length),
      elements: [list[current.remaining % list.length], ...current.elements],
    }),
    { remaining: index, elements: [] },
  ).elements;
};

const getElementAt = (set: Value, index: number): Value => {
  if (typeof set === "object" && set.kind === "Interval") return set.low + index;
  if (typeof set === "object" && set.kind === "ProductSet") {
    return createTuple(getMixedRadixElement(set.factors, index));
  }
  if (typeof set === "object" && set.kind === "RecordSet") {
    const values = getMixedRadixElement(set.sets, index);
    return createRecord(
      set.names.map((name, position): [string, Value] => [name, values[position]]),
    );
  }
  if (typeof set === "object" && set.kind === "FunctionSet") {
    const domain = toFiniteSet(set.domain).elements;
    return createSortedFunction(
      domain,
      getMixedRadixElement(
        domain.map(() => set.range),
        index,
      ),
    );
  }
  return toFiniteSet(set).elements[index];
};

const getSampleSize = (set: Value): number => {
  if (isEmptySet(set)) return 0;
  if (typeof set === "object" && set.kind === "ProductSet") {
    return set.factors.reduce<number>((size, factor) => size * getSampleSize(factor), 1);
  }
  if (typeof set === "object" && set.kind === "RecordSet") {
    return set.sets.reduce<number>((size, factor) => size * getSampleSize(factor), 1);
  }
  if (typeof set === "object" && set.kind === "FunctionSet") {
    return getSampleSize(set.range) ** getCardinality(set.domain);
  }
  return getCardinality(set);
};

const pickSubset = (set: Value, count: number, random: () => number) => {
  const size = getSampleSize(set);
  const indices = new Set<number>();
  while (indices.size < Math.min(count, size)) indices.add(Math.floor(random() * size));
  return [...indices].map((index) => getElementAt(set, index));
};

const tossSubsets = (elements: Value[], picks: number, probability: number, random: () => number) =>
  createSet(
    Array.from({ length: picks }, () => createSet(elements.filter(() => random() < probability))),
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
    runtime.random,
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
    return createSet(pickSubset(set, count, runtime.random));
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
  defineStateOperator("RandomSubsetSet", 3, (args) => {
    const name = "RandomSubsetSetProbability";
    const picks = getCount(getValue(args, 0, "RandomSubsetSet"), "first", name);
    const text = getValue(args, 1, "RandomSubsetSet");
    if (typeof text !== "string") {
      throw describeArgument(
        "second",
        name,
        "string literal representing a probability",
        formatValue(text),
      );
    }
    const probability = Number(text);
    if (text.trim() === "" || Number.isNaN(probability) || probability < 0 || probability > 1) {
      throw describeArgument(
        "second",
        name,
        "string literal does not represent a parsable probability",
        formatValue(text),
      );
    }
    const elements = getFiniteElements(
      getValue(args, 2, "RandomSubsetSet"),
      "third",
      name,
      "finite set",
    );
    checkPicks(picks, elements.length, name);
    return tossSubsets(elements, picks, probability, runtime.random);
  }),
];
