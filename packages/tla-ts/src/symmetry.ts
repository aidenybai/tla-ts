import { TlaConfigError, TlaEvaluationError, UNEXPECTED_EXCEPTION } from "./errors";
import { evaluate, type Environment } from "./evaluate";
import { EXIT_STATUS, setExitCode } from "./exit-codes";
import {
  compareValues,
  createFunction,
  createSet,
  createSortedFunction,
  createSortedSet,
  isEnumerable,
  isFunctionValue,
  isModelValue,
  isSameValue,
  isSetValue,
  toFiniteFunction,
  toFiniteSet,
  type ModelValue,
  type ObjectValue,
  type Value,
} from "./values";

type Images = Map<string, ModelValue>;

const CACHE_LIMIT = 1 << 22;
const CACHED_SIZE_LIMIT = 64;

interface Permutation {
  images: Images;
  cache: WeakMap<ObjectValue, Value>;
  cacheSize: number;
  cacheLimit: number;
}

// The images of one value under every permutation, the identity first, and how each image compares
// with the image of each permutation the search has held as the smallest.
interface Orbit {
  images: Value[];
  comparisons: (Int8Array | undefined)[];
}

interface SymmetryGroup {
  permutations: Permutation[];
  orbits: WeakMap<ObjectValue, Orbit>;
  orbitCount: number;
  orbitLimit: number;
}

const getPermutationKey = (permutation: Images) =>
  [...permutation]
    .map(([name, image]) => `${name}>${image.name}`)
    .sort()
    .join(",");

const composePermutations = (first: Images, second: Images) => {
  const composed: Images = new Map();
  const names = new Set([...first.keys(), ...second.keys()]);
  names.forEach((name) => {
    const image = first.get(name);
    const result = image ? (second.get(image.name) ?? image) : second.get(name);
    if (result && result.name !== name) composed.set(name, result);
  });
  return composed;
};

// TLC checks the symmetry set outside any phase that reports an error itself.
const createSymmetryError = (message: string) =>
  setExitCode(new TlaEvaluationError(`${UNEXPECTED_EXCEPTION}${message}`), EXIT_STATUS.error);

const toImages = (value: Value) => {
  if (!isFunctionValue(value)) {
    throw createSymmetryError("The symmetry values must be function records.");
  }
  const functionValue = toFiniteFunction(value);
  const permutation: Images = new Map();
  functionValue.domain.forEach((key, index) => {
    const image = functionValue.range[index];
    if (!isModelValue(key) || !isModelValue(image)) {
      throw new TlaConfigError("Symmetry function must have model values as domain and range");
    }
    if (key.name !== image.name) permutation.set(key.name, image);
  });
  return permutation;
};

export const getSymmetryGroup = (
  name: string,
  environment: Environment,
): SymmetryGroup | undefined => {
  const definition = environment.definitions.get(name);
  if (definition === undefined && !environment.constants.has(name)) {
    throw new TlaConfigError(
      `The symmetry function ${name} specified in the configuration file\nis not defined in the specification.`,
    );
  }
  if (definition?.kind !== "Operator" || definition.params.length > 0) {
    throw createSymmetryError(`The symmetry function ${name} must specify a set of permutations.`);
  }
  const value = evaluate(definition.body, {
    environment,
    scope: undefined,
    state: undefined,
    next: undefined,
  });
  if (!isSetValue(value) || !isEnumerable(value)) {
    throw createSymmetryError("The symmetry operator must specify a set of functions.");
  }
  const permutations = toFiniteSet(value).elements.map(toImages);
  const isDisabled =
    definition.body.kind === "Apply" && definition.body.args.length >= permutations.length;
  if (isDisabled) return undefined;
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
  if (group.size === 0) return undefined;
  const cacheLimit = Math.max(256, Math.floor(CACHE_LIMIT / group.size));
  return {
    permutations: [...group.values()].map((images) => ({
      images,
      cache: new WeakMap<ObjectValue, Value>(),
      cacheSize: 0,
      cacheLimit,
    })),
    orbits: new WeakMap(),
    orbitCount: 0,
    orbitLimit: cacheLimit,
  };
};

const permuteElements = (elements: Value[], permutation: Permutation) => {
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
const permuteSortedElements = (elements: Value[], permutation: Permutation) => {
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
  const computed = computePermutedValue(value, permutation);
  // A permutation often maps a value to an equal one. Keeping the original lets the comparison
  // with the smallest state so far stop at identity.
  const permuted = computed !== value && isSameValue(computed, value) ? value : computed;
  if (permutation.cacheSize >= permutation.cacheLimit) {
    permutation.cache = new WeakMap();
    permutation.cacheSize = 0;
  }
  permutation.cache.set(value, permuted);
  permutation.cacheSize++;
  return permuted;
};

const computePermutedValue = (value: ObjectValue, permutation: Permutation) => {
  const kind = value.kind;
  if (kind === "Set") {
    const elements = permuteSortedElements(value.elements, permutation);
    return elements ? createSortedSet(elements) : value;
  }
  if (kind === "Function" || (kind === "LazyFunction" && isEnumerable(value.domain))) {
    const functionValue = toFiniteFunction(value);
    const domain = permuteElements(functionValue.domain, permutation);
    const range = permuteElements(functionValue.range, permutation) ?? functionValue.range;
    if (domain) {
      const permuted = createFunction(
        domain.map((key, index): [Value, Value] => [key, range[index]]),
      );
      // A permutation often maps the domain to itself, such as a function over the symmetric set.
      // Sharing the original domain array lets comparisons with other images skip the domain.
      const isSameDomain = permuted.domain.every(
        (key, index) => key === functionValue.domain[index],
      );
      return isSameDomain ? createSortedFunction(functionValue.domain, permuted.range) : permuted;
    }
    return range === functionValue.range
      ? functionValue
      : createSortedFunction(functionValue.domain, range);
  }
  if (kind === "Interval" || !isSetValue(value) || !isEnumerable(value)) return value;
  const set = toFiniteSet(value);
  const elements = permuteElements(set.elements, permutation);
  return elements ? createSet(elements) : set;
};

const getOrbit = (value: ObjectValue, group: SymmetryGroup) => {
  const cached = group.orbits.get(value);
  if (cached !== undefined) return cached;
  if (group.orbitCount >= group.orbitLimit) {
    group.orbits = new WeakMap();
    group.orbitCount = 0;
  }
  const orbit: Orbit = { images: [value], comparisons: [] };
  group.orbits.set(value, orbit);
  group.orbitCount++;
  return orbit;
};

const getImage = (orbit: Orbit, permutation: number, group: SymmetryGroup) =>
  (orbit.images[permutation] ??= permuteValue(
    orbit.images[0],
    group.permutations[permutation - 1],
  ));

// Two images of a value compare the same way every time, and comparing them again changes nothing,
// so an orbit compares each pair once.
const compareImages = (
  value: ObjectValue,
  permutation: number,
  minimum: number,
  group: SymmetryGroup,
) => {
  const orbit = getOrbit(value, group);
  const comparisons = (orbit.comparisons[minimum] ??= new Int8Array(group.permutations.length + 1));
  if (comparisons[permutation] === 0) {
    const comparison = compareValues(
      getImage(orbit, permutation, group),
      getImage(orbit, minimum, group),
    );
    comparisons[permutation] = Math.sign(comparison) + 2;
  }
  return comparisons[permutation] - 2;
};

const isSmallerImage = (
  state: Value[],
  permutation: number,
  minimum: number,
  group: SymmetryGroup,
  order: number[],
) => {
  for (const index of order) {
    const value = state[index];
    const comparison =
      typeof value === "object" ? compareImages(value, permutation, minimum, group) : 0;
    if (comparison !== 0) return comparison < 0;
  }
  return false;
};

// TLC keeps the smallest image of the state in its variable order, replacing it only with a
// strictly smaller one.
export const getRepresentative = (
  state: Value[],
  group: SymmetryGroup,
  order: number[],
): Value[] => {
  const minimum = group.permutations.reduce(
    (smallest, _, index) =>
      isSmallerImage(state, index + 1, smallest, group, order) ? index + 1 : smallest,
    0,
  );
  return minimum === 0
    ? state
    : state.map((value) =>
        typeof value === "object" ? getImage(getOrbit(value, group), minimum, group) : value,
      );
};
