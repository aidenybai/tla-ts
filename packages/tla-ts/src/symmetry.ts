import type { BoundPattern, Expression } from "./ast";
import type { Substitution } from "./config";
import { TlaConfigError, TlaEvaluationError, UNEXPECTED_EXCEPTION } from "./errors";
import { EXIT_STATUS, setExitCode } from "./exit-codes";
import { MESSAGE_CODE } from "./tlc/messages";
import { evaluate, type Environment } from "./evaluate";
import {
  compareValues,
  createModelValue,
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
// The same images by the rank of each model value, which permuting a value looks up.
type RankedImages = (ModelValue | undefined)[];

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
const getBoundImage = (pattern: BoundPattern, set: Expression | undefined) => {
  const names = pattern.kind === "Name" ? pattern.name : `<<${pattern.names.join(",")}>>`;
  return set ? `${names}\\in${getExpressionImage(set)}` : names;
};

const getExpressionImage = (expression: Expression): string => {
  if (expression.kind === "Identifier") return expression.name;
  if (expression.kind === "Number") return expression.text ?? String(expression.value);
  if (expression.kind === "SetEnumeration") {
    return `{${expression.elements.map(getExpressionImage).join(",")}}`;
  }
  if (expression.kind === "Choose") {
    return `CHOOSE${getBoundImage(expression.pattern, expression.set)}:${getExpressionImage(expression.body)}`;
  }
  if (expression.kind === "Tuple")
    return `<<${expression.elements.map(getExpressionImage).join(",")}>>`;
  if (expression.kind === "Record") {
    const fields = expression.fields.map(
      (field) => `${field.name}|->${getExpressionImage(field.value)}`,
    );
    return `[${fields.join(",")}]`;
  }
  if (expression.kind === "FunctionConstruction") {
    const bounds = expression.bounds.map((bound) => getBoundImage(bound.pattern, bound.set));
    return `[${bounds.join(",")}|->${getExpressionImage(expression.body)}]`;
  }
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
): RankedImages[] | undefined => {
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
  // Tool#getSymmetryPerms warns about each permuted set with fewer than two elements, by the name
  // the config substitutes for it. As many permuted sets as permutations means none has two.
  const body = definition.body;
  const permutedSets =
    body.kind === "Apply" ? body.args : body.kind === "SetEnumeration" ? body.elements : [];
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
  elements.map(toImages).forEach((permutation) => {
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
  if (group.size === 0) return undefined;
  return [...group.values()].map((images) => {
    const ranked: (ModelValue | undefined)[] = [];
    images.forEach((image, name) => {
      ranked[createModelValue(name).rank] = image;
    });
    return ranked;
  });
};

const permuteElements = (elements: Value[], images: RankedImages) => {
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

// A permutation maps distinct elements to distinct elements and keeps the elements it doesn't move
// in order, so it sorts only the moved ones and merges them back.
const permuteSortedElements = (elements: Value[], images: RankedImages) => {
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

// Value#permute: the value with each model value replaced by its image. A value the permutation
// doesn't move is returned itself, so that comparing it with itself stops at identity.
const permuteValue = (value: Value, images: RankedImages): Value => {
  if (typeof value !== "object") return value;
  const kind = value.kind;
  if (kind === "ModelValue") return images[value.rank] ?? value;
  if (kind === "Set") {
    const elements = permuteSortedElements(value.elements, images);
    return elements ? createSortedSet(elements) : value;
  }
  if (kind === "Function" || (kind === "LazyFunction" && isEnumerable(value.domain))) {
    const functionValue = toFiniteFunction(value);
    // A record's field names are strings, which no permutation moves.
    const domain =
      functionValue.functionClass === "record"
        ? undefined
        : permuteElements(functionValue.domain, images);
    const range = permuteElements(functionValue.range, images) ?? functionValue.range;
    if (domain) {
      // Sorts the keys and their values together by binary insertion, since a permuted domain is
      // usually a few model values.
      const values = range === functionValue.range ? range.slice() : range;
      for (let index = 1; index < domain.length; index++) {
        const key = domain[index];
        const keyValue = values[index];
        let low = 0;
        let high = index;
        while (low < high) {
          const middle = (low + high) >>> 1;
          if (compareValues(domain[middle], key) < 0) low = middle + 1;
          else high = middle;
        }
        for (let position = index; position > low; position--) {
          domain[position] = domain[position - 1];
          values[position] = values[position - 1];
        }
        domain[low] = key;
        values[low] = keyValue;
      }
      // A permutation often maps the domain to itself, such as a function over the symmetric set.
      // Sharing the original domain array lets comparisons with other images skip the domain.
      const isSameDomain = domain.every((key, index) => key === functionValue.domain[index]);
      return createSortedFunction(isSameDomain ? functionValue.domain : domain, values);
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

// TLC permutes the state under each permutation, variable by variable, and moves on to the next
// permutation as soon as a variable's image is larger than the smallest state's.
export const getRepresentative = (
  state: Value[],
  permutations: RankedImages[],
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
