import type { Expression } from "./ast";
import type { Substitution } from "./config";
import { TlaConfigError, TlaEvaluationError, UNEXPECTED_EXCEPTION } from "./errors";
import { EXIT_STATUS, setExitCode } from "./exit-codes";
import { MESSAGE_CODE } from "./tlc/messages";
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
  type Value,
} from "./values";

type Images = Map<string, ModelValue>;

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

const getExpressionImage = (expression: Expression): string => {
  if (expression.kind === "Identifier") return expression.name;
  if (expression.kind !== "Apply") return "";
  const args = expression.args.map(getExpressionImage);
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
): Images[] | undefined => {
  const definition = environment.definitions.get(name);
  if (definition === undefined && !environment.constants.has(name)) {
    throw new TlaConfigError(
      `The symmetry function ${name} specified in the configuration file\nis not defined in the specification.`,
    );
  }
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
  const permutedSets = definition.body.kind === "Apply" ? definition.body.args : [];
  const configNames = new Map(
    substitutions
      .filter((substitution) => substitution.module === undefined)
      .map((substitution) => [substitution.target, substitution.name]),
  );
  const warnSmallSets = (offenders: Expression[]) => {
    if (offenders.length === 0) return;
    const names = offenders.map((offender) => {
      const image = getExpressionImage(isPermutations(offender) ? offender.args[0] : offender);
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
    return undefined;
  }
  const group = new Map<string, Images>();
  permutations.forEach((permutation) => {
    if (permutation.size > 0) group.set(getPermutationKey(permutation), permutation);
  });
  const generators = [...group.values()];
  let frontierStart = 0;
  while (frontierStart < group.size) {
    const members = [...group.values()];
    const end = members.length;
    generators.forEach((generator) =>
      members.slice(frontierStart, end).forEach((member) => {
        const composed = composePermutations(generator, member);
        const key = getPermutationKey(composed);
        if (composed.size > 0 && !group.has(key)) group.set(key, composed);
      }),
    );
    frontierStart = end;
  }
  const movedNames = new Set(
    [...group.values()].flatMap((images) => [...images.values()].map((image) => image.name)),
  );
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
  if (group.size === 0) return undefined;
  return [...group.values()];
};

const permuteElements = (elements: Value[], images: Images) => {
  for (let index = 0; index < elements.length; index++) {
    const element = elements[index];
    const permuted = permuteValue(element, images);
    if (permuted === element) continue;
    const result = elements.slice(0, index);
    result.push(permuted);
    for (let rest = index + 1; rest < elements.length; rest++) {
      result.push(permuteValue(elements[rest], images));
    }
    return result;
  }
  return undefined;
};

const permuteSortedElements = (elements: Value[], images: Images) => {
  const kept: Value[] = [];
  const moved: Value[] = [];
  for (const element of elements) {
    const permuted = permuteValue(element, images);
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

const permuteValue = (value: Value, images: Images): Value => {
  if (typeof value !== "object") return value;
  const kind = value.kind;
  if (kind === "ModelValue") return images.get(value.name) ?? value;
  if (kind === "Set") {
    const elements = permuteSortedElements(value.elements, images);
    return elements ? createSortedSet(elements) : value;
  }
  if (kind === "Function" || (kind === "LazyFunction" && isEnumerable(value.domain))) {
    const functionValue = toFiniteFunction(value);
    const domain = permuteElements(functionValue.domain, images);
    const range = permuteElements(functionValue.range, images) ?? functionValue.range;
    if (domain) {
      const permuted = createFunction(
        domain.map((key, index): [Value, Value] => [key, range[index]]),
      );
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
  const elements = permuteElements(set.elements, images);
  return elements ? createSet(elements) : set;
};

export const getRepresentative = (
  state: Value[],
  permutations: Images[],
  order: number[],
): Value[] => {
  let smallest = state;
  for (const images of permutations) {
    const permuted = state.slice();
    let comparison = 0;
    for (const index of order) {
      permuted[index] = permuteValue(state[index], images);
      if (comparison === 0) comparison = compareValues(permuted[index], smallest[index]);
      if (comparison > 0) break;
    }
    if (comparison < 0) smallest = permuted;
  }
  return smallest;
};
