import type { Expression } from "./ast";
import type { Substitution } from "./config";
import { TlaEvaluationError, UNEXPECTED_EXCEPTION } from "./errors";
import { EXIT_STATUS, setExitCode } from "./exit-codes";
import { MESSAGE_CODE } from "./tlc-messages";
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

// Tool#getSymmetryPerms fails with a RuntimeException as TLC starts, which TLC reports as one it
// did not expect.
const createSymmetryError = (message: string) =>
  setExitCode(new TlaEvaluationError(`${UNEXPECTED_EXCEPTION}${message}`), EXIT_STATUS.error);

const toImages = (value: Value) => {
  const functionValue = toFiniteFunction(value);
  const permutation: Images = new Map();
  functionValue.domain.forEach((key, index) => {
    const image = functionValue.range[index];
    if (!isModelValue(key) || !isModelValue(image)) {
      throw createSymmetryError("Symmetry function must have model values as domain and range.");
    }
    if (key.name !== image.name) permutation.set(key.name, image);
  });
  return permutation;
};

// SyntaxTreeNode.getHumanReadableImage, which joins the tokens of an expression without spaces.
const getImage = (expression: Expression): string => {
  if (expression.kind === "Identifier") return expression.name;
  if (expression.kind !== "Apply") return "";
  const args = expression.args.map(getImage);
  return /^[A-Za-z_]/.test(expression.operator)
    ? `${expression.operator}(${args.join(",")})`
    : args.join(expression.operator);
};

const isPermutations = (
  expression: Expression,
): expression is Expression & { kind: "Apply"; args: [Expression] } =>
  expression.kind === "Apply" &&
  expression.operator === "Permutations" &&
  expression.args.length === 1;

export const getSymmetryGroup = (
  name: string,
  environment: Environment,
  substitutions: Substitution[],
): Permutation[] => {
  const definition = environment.definitions.get(name);
  if (definition?.kind !== "Operator" || definition.params.length > 0) {
    throw createSymmetryError(`The symmetry function ${name} must specify a set of permutations.`);
  }
  const evaluateConstant = (expression: Expression) =>
    evaluate(expression, { environment, scope: undefined, state: undefined, next: undefined });
  const value = evaluateConstant(definition.body);
  if (!isSetValue(value) || !isEnumerable(value)) {
    throw createSymmetryError("The symmetry operator must specify a set of functions.");
  }
  const elements = toFiniteSet(value).elements;
  if (!elements.every(isFunctionValue)) {
    throw createSymmetryError("The symmetry values must be function records.");
  }
  const permutations = elements.map(toImages);
  // Tool#getSymmetryPerms warns about each permuted set with fewer than two elements, by the name
  // the config substitutes for it. As many permuted sets as permutations means none has two.
  const permutedSets = definition.body.kind === "Apply" ? definition.body.args : [];
  const configNames = new Map(
    substitutions
      .filter((substitution) => substitution.module === undefined)
      .map((substitution) => [substitution.target, substitution.name]),
  );
  const warnSmallSets = (offenders: Expression[]) => {
    if (offenders.length === 0) return;
    const names = offenders.map((offender) => {
      const image = getImage(isPermutations(offender) ? offender.args[0] : offender);
      return configNames.get(image) ?? image;
    });
    const isPlural = offenders.length > 1;
    environment.runtime.warn(
      MESSAGE_CODE.symmetrySetTooSmall,
      `The set${isPlural ? "s" : ""} ${names.join(", and ")} ${isPlural ? "have" : "has"} been defined to be a symmetry set but contain${isPlural ? "" : "s"} less than two elements.`,
    );
  };
  if (permutedSets.length >= elements.length) {
    warnSmallSets(permutedSets);
    return [];
  }
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
  const movedNames = new Set(
    [...group.values()].flatMap((images) => [...images.values()].map((image) => image.name)),
  );
  // Only a permutation of a constant that TLC holds as an enumerated set is checked. TLC binds a
  // constant the config substitutes with <- to the definition, which it skips.
  const substitutedNames = new Set(substitutions.map((substitution) => substitution.name));
  warnSmallSets(
    permutedSets.filter((node) => {
      if (!isPermutations(node)) return false;
      const operand = node.args[0];
      if (operand.kind !== "Identifier" || substitutedNames.has(operand.name)) return false;
      const set = evaluateConstant(operand);
      return (
        typeof set === "object" &&
        set.kind === "Set" &&
        !set.elements.some((element) => isModelValue(element) && movedNames.has(element.name))
      );
    }),
  );
  const cacheLimit = Math.max(256, Math.floor(CACHE_LIMIT / group.size));
  return [...group.values()].map((images) => ({
    images,
    cache: new WeakMap<ObjectValue, Value>(),
    cacheSize: 0,
    cacheLimit,
  }));
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
