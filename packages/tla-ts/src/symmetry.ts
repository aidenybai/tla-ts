import { TlaConfigError } from "./errors";
import { evaluate, type Environment } from "./evaluate";
import {
  compareValues,
  createFunction,
  createSet,
  isEnumerable,
  isFunctionValue,
  isModelValue,
  isSetValue,
  toFiniteFunction,
  toFiniteSet,
  type ModelValue,
  type Value,
} from "./values";

type Permutation = Map<string, ModelValue>;

const getPermutationKey = (permutation: Permutation) =>
  [...permutation]
    .map(([name, image]) => `${name}>${image.name}`)
    .sort()
    .join(",");

const composePermutations = (first: Permutation, second: Permutation): Permutation => {
  const composed: Permutation = new Map();
  const names = new Set([...first.keys(), ...second.keys()]);
  names.forEach((name) => {
    const image = first.get(name);
    const result = image ? (second.get(image.name) ?? image) : second.get(name);
    if (result && result.name !== name) composed.set(name, result);
  });
  return composed;
};

const toPermutation = (value: Value, name: string): Permutation => {
  if (!isFunctionValue(value)) {
    throw new TlaConfigError(`The symmetry values of ${name} must be functions`);
  }
  const fn = toFiniteFunction(value);
  const permutation: Permutation = new Map();
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
  const permutations = toFiniteSet(value).elements.map((element) => toPermutation(element, name));
  const isDisabled =
    definition.body.kind === "Apply" && definition.body.args.length >= permutations.length;
  if (isDisabled) return [];
  const group = new Map<string, Permutation>();
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
  return [...group.values()];
};

const permuteValue = (value: Value, permutation: Permutation): Value => {
  if (typeof value !== "object") return value;
  if (value.kind === "ModelValue") return permutation.get(value.name) ?? value;
  if (value.kind === "Function" || (value.kind === "LazyFunction" && isEnumerable(value.domain))) {
    const fn = toFiniteFunction(value);
    return createFunction(
      fn.domain.map((key, index): [Value, Value] => [
        permuteValue(key, permutation),
        permuteValue(fn.range[index], permutation),
      ]),
    );
  }
  if (value.kind === "Interval" || !isSetValue(value) || !isEnumerable(value)) return value;
  return createSet(
    toFiniteSet(value).elements.map((element) => permuteValue(element, permutation)),
  );
};

const compareStates = (left: Value[], right: Value[]) => {
  for (let index = 0; index < left.length; index++) {
    const comparison = compareValues(left[index], right[index]);
    if (comparison !== 0) return comparison;
  }
  return 0;
};

export const getRepresentative = (state: Value[], group: Permutation[]): Value[] =>
  group.reduce((minimum, permutation) => {
    const permuted = state.map((value) => permuteValue(value, permutation));
    return compareStates(permuted, minimum) < 0 ? permuted : minimum;
  }, state);
