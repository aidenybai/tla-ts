import { TlaConfigError } from "./errors";
import { evaluate, type Environment } from "./evaluate";
import {
  compareValues,
  createFunction,
  createSet,
  createSortedFunction,
  createSortedSet,
  isEnumerable,
  isFunctionValue,
  isModelValue,
  isSetValue,
  toFiniteFunction,
  toFiniteSet,
  type ModelValue,
  type ObjectValue,
  type Value,
} from "./values";

type Images = Map<string, ModelValue>;

interface Permutation {
  images: Images;
  cache: WeakMap<ObjectValue, Value>;
  cacheSize: number;
  cacheLimit: number;
}

const getPermutationKey = (permutation: Images) =>
  [...permutation]
    .map(([name, image]) => `${name}>${image.name}`)
    .sort()
    .join(",");

const composePermutations = (first: Images, second: Images): Images => {
  const composed: Images = new Map();
  const names = new Set([...first.keys(), ...second.keys()]);
  names.forEach((name) => {
    const image = first.get(name);
    const result = image ? (second.get(image.name) ?? image) : second.get(name);
    if (result && result.name !== name) composed.set(name, result);
  });
  return composed;
};

const toImages = (value: Value, name: string): Images => {
  if (!isFunctionValue(value)) {
    throw new TlaConfigError(`The symmetry values of ${name} must be functions`);
  }
  const fn = toFiniteFunction(value);
  const permutation: Images = new Map();
  fn.domain.forEach((key, index) => {
    const image = fn.range[index];
    if (!isModelValue(key) || !isModelValue(image)) {
      throw new TlaConfigError("Symmetry function must have model values as domain and range");
    }
    if (key.name !== image.name) permutation.set(key.name, image);
  });
  return permutation;
};

export const getSymmetryGroup = (name: string, environment: Environment): Permutation[] => {
  const definition = environment.definitions.get(name);
  if (definition?.kind !== "Operator" || definition.params.length > 0) {
    throw new TlaConfigError(`The symmetry function ${name} must specify a set of permutations`);
  }
  const value = evaluate(definition.body, {
    environment,
    scope: undefined,
    state: undefined,
    next: undefined,
  });
  if (!isSetValue(value) || !isEnumerable(value)) {
    throw new TlaConfigError("The symmetry operator must specify a set of functions");
  }
  const permutations = toFiniteSet(value).elements.map((element) => toImages(element, name));
  const isDisabled =
    definition.body.kind === "Apply" && definition.body.args.length >= permutations.length;
  if (isDisabled) return [];
  const group = new Map<string, Images>();
  permutations.forEach((permutation) => {
    if (permutation.size > 0) group.set(getPermutationKey(permutation), permutation);
  });
  const generators = [...group.values()];
  const frontier = { start: 0 };
  while (frontier.start < group.size) {
    const members = [...group.values()];
    const end = members.length;
    generators.forEach((generator) =>
      members.slice(frontier.start, end).forEach((member) => {
        const composed = composePermutations(generator, member);
        const key = getPermutationKey(composed);
        if (composed.size > 0 && !group.has(key)) group.set(key, composed);
      }),
    );
    frontier.start = end;
  }
  const cacheLimit = Math.max(256, Math.floor(CACHE_LIMIT / group.size));
  return [...group.values()].map((images) => ({
    images,
    cache: new WeakMap<ObjectValue, Value>(),
    cacheSize: 0,
    cacheLimit,
  }));
};

const permuteElements = (elements: Value[], permutation: Permutation): Value[] | undefined => {
  for (let index = 0; index < elements.length; index++) {
    const element = elements[index];
    const permuted = permuteValue(element, permutation);
    if (permuted === element) continue;
    const result = elements.slice(0, index);
    result.push(permuted);
    for (let rest = index + 1; rest < elements.length; rest++) {
      result.push(permuteValue(elements[rest], permutation));
    }
    return result;
  }
  return undefined;
};

// A permutation maps distinct elements to distinct elements and keeps the elements it doesn't move
// in order, so it sorts only the moved ones and merges them back.
const permuteSortedElements = (
  elements: Value[],
  permutation: Permutation,
): Value[] | undefined => {
  const kept: Value[] = [];
  const moved: Value[] = [];
  for (const element of elements) {
    const permuted = permuteValue(element, permutation);
    if (permuted === element) kept.push(element);
    else moved.push(permuted);
  }
  if (moved.length === 0) return undefined;
  moved.sort(compareValues);
  const merged: Value[] = [];
  let keptIndex = 0;
  let movedIndex = 0;
  while (keptIndex < kept.length && movedIndex < moved.length) {
    merged.push(
      compareValues(kept[keptIndex], moved[movedIndex]) < 0
        ? kept[keptIndex++]
        : moved[movedIndex++],
    );
  }
  while (keptIndex < kept.length) merged.push(kept[keptIndex++]);
  while (movedIndex < moved.length) merged.push(moved[movedIndex++]);
  return merged;
};

const CACHE_LIMIT = 1 << 22;
const CACHED_SIZE_LIMIT = 16;

const getSize = (value: ObjectValue) =>
  value.kind === "Set"
    ? value.elements.length
    : value.kind === "Function"
      ? value.domain.length
      : 0;

const permuteValue = (value: Value, permutation: Permutation): Value => {
  if (typeof value !== "object") return value;
  if (value.kind === "ModelValue") return permutation.images.get(value.name) ?? value;
  const size = getSize(value);
  if (size === 0 || size > CACHED_SIZE_LIMIT) return computePermutedValue(value, permutation);
  const cached = permutation.cache.get(value);
  if (cached !== undefined) return cached;
  const permuted = computePermutedValue(value, permutation);
  if (permutation.cacheSize >= permutation.cacheLimit) {
    permutation.cache = new WeakMap();
    permutation.cacheSize = 0;
  }
  permutation.cache.set(value, permuted);
  permutation.cacheSize++;
  return permuted;
};

const computePermutedValue = (value: ObjectValue, permutation: Permutation): Value => {
  const kind = value.kind;
  if (kind === "Set") {
    const elements = permuteSortedElements(value.elements, permutation);
    return elements ? createSortedSet(elements) : value;
  }
  if (kind === "Function" || (kind === "LazyFunction" && isEnumerable(value.domain))) {
    const fn = toFiniteFunction(value);
    const domain = permuteElements(fn.domain, permutation);
    const range = permuteElements(fn.range, permutation) ?? fn.range;
    if (domain) {
      return createFunction(domain.map((key, index): [Value, Value] => [key, range[index]]));
    }
    return range === fn.range ? fn : createSortedFunction(fn.domain, range);
  }
  if (kind === "Interval" || !isSetValue(value) || !isEnumerable(value)) return value;
  const set = toFiniteSet(value);
  const elements = permuteElements(set.elements, permutation);
  return elements ? createSet(elements) : set;
};

const permuteRemaining = (state: Value[], permuted: Value[], permutation: Permutation) => {
  for (let index = permuted.length; index < state.length; index++) {
    permuted.push(permuteValue(state[index], permutation));
  }
  return permuted;
};

const getSmallerPermutation = (
  state: Value[],
  minimum: Value[],
  permutation: Permutation,
  order: number[] | undefined,
) => {
  const permuted: Value[] = [];
  for (let position = 0; position < state.length; position++) {
    const index = order ? order[position] : position;
    const value = permuteValue(state[index], permutation);
    const comparison = compareValues(value, minimum[index]);
    if (comparison > 0) return undefined;
    if (!order) permuted.push(value);
    if (comparison < 0) {
      return order
        ? state.map((item) => permuteValue(item, permutation))
        : permuteRemaining(state, permuted, permutation);
    }
  }
  return undefined;
};

export const getRepresentative = (
  state: Value[],
  group: Permutation[],
  order?: number[],
): Value[] =>
  group.reduce(
    (minimum, permutation) => getSmallerPermutation(state, minimum, permutation, order) ?? minimum,
    state,
  );
