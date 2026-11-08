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
  sortWrittenOrder,
  type ModelValue,
  type Value,
} from "./values";
import { createStateImages, type StateImages } from "./symmetry-images";

// The image of each model value a permutation moves, by rank.
type Images = Map<number, ModelValue>;

// The image of each model value by rank, or nothing for one the permutation doesn't move.
export type ImageTable = (ModelValue | undefined)[];

export interface SymmetryGroup {
  images: ImageTable[];
  // Tries the group on integers, unless comparing images can fail on the types of model values.
  stateImages: StateImages | undefined;
}

const getPermutationKey = (permutation: Images) =>
  [...permutation]
    .map(([rank, image]) => `${rank}>${image.rank}`)
    .sort()
    .join(",");

const composePermutations = (first: Images, second: Images) => {
  const composed: Images = new Map();
  const ranks = new Set([...first.keys(), ...second.keys()]);
  ranks.forEach((rank) => {
    const image = first.get(rank);
    const result = image ? (second.get(image.rank) ?? image) : second.get(rank);
    if (result && result.rank !== rank) composed.set(rank, result);
  });
  return composed;
};

const toImageTable = (images: Images) => {
  const table: ImageTable = Array.from({ length: Math.max(...images.keys()) + 1 });
  images.forEach((image, rank) => {
    table[rank] = image;
  });
  return table;
};

const toRankTable = (table: ImageTable) =>
  Int32Array.from(table, (image, rank) => image?.rank ?? rank);

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
    if (key.rank !== image.rank) permutation.set(key.rank, image);
  });
  return permutation;
};

// SyntaxTreeNode.getHumanReadableImage, which joins the tokens of an expression without spaces.
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
  const movedRanks = new Set(
    [...group.values()].flatMap((images) => [...images.values()].map((image) => image.rank)),
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
        !set.elements.some((element) => isModelValue(element) && movedRanks.has(element.rank))
      );
    }),
  );
  if (group.size === 0) return undefined;
  const images = [...group.values()].map(toImageTable);
  const isUntyped = images.every((table) => table.every((image) => image?.type === undefined));
  return {
    images,
    stateImages: isUntyped ? createStateImages(images.map(toRankTable)) : undefined,
  };
};

const permuteElements = (elements: Value[], images: ImageTable) => {
  for (let index = 0; index < elements.length; index++) {
    const element = elements[index];
    const permuted = permuteValue(element, images);
    if (permuted === element) continue;
    const result = elements.slice();
    result[index] = permuted;
    for (let rest = index + 1; rest < elements.length; rest++) {
      result[rest] = permuteValue(elements[rest], images);
    }
    return result;
  }
  return undefined;
};

// A permutation maps distinct elements to distinct elements and keeps the elements it doesn't move
// in order, so it sorts only the moved ones and merges them back.
const permuteSortedElements = (elements: Value[], images: ImageTable) => {
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

// A permutation often maps a function's domain of model values to itself, as with a function over
// the symmetric set. Then each value moves to where its key's image is, without sorting. The domain
// is sorted by rank, and undefined means the images aren't that same domain.
const permuteRangeOverDomain = (domain: Value[], images: Value[], range: Value[]) => {
  const permuted = range.slice();
  for (let index = 0; index < images.length; index++) {
    const image = images[index];
    if (!isModelValue(image)) return undefined;
    let low = 0;
    let high = domain.length - 1;
    while (low < high) {
      const middle = (low + high) >> 1;
      const key = domain[middle];
      if (!isModelValue(key)) return undefined;
      if (key.rank < image.rank) low = middle + 1;
      else high = middle;
    }
    if (domain[low] !== image) return undefined;
    permuted[low] = range[index];
  }
  return permuted;
};

// Value#permute: the value with each model value replaced by its image. A value the permutation
// doesn't move is returned itself, so that comparing it with itself stops at identity.
export const permuteValue = (value: Value, images: ImageTable): Value => {
  if (typeof value !== "object") return value;
  const kind = value.kind;
  if (kind === "ModelValue") return images[value.rank] ?? value;
  if (kind === "Set") {
    const elements = permuteSortedElements(value.elements, images);
    return elements ? createSortedSet(elements) : value;
  }
  if (kind === "Function" || (kind === "LazyFunction" && isEnumerable(value.domain))) {
    const functionValue = toFiniteFunction(value);
    const domain = permuteElements(functionValue.domain, images);
    const range = permuteElements(functionValue.range, images) ?? functionValue.range;
    if (domain) {
      const permutedRange = permuteRangeOverDomain(functionValue.domain, domain, range);
      // Sharing the original domain array lets comparisons with other images skip the domain.
      if (permutedRange) return createSortedFunction(functionValue.domain, permutedRange);
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

// TLCStateMut#fingerPrint: the smallest image of the state under the group in TLC's variable
// order. TLC permutes the state under each permutation, variable by variable, and moves on to the
// next permutation as soon as a variable's image is larger than the smallest state's.
const getRepresentativeOfValues = (state: Value[], group: SymmetryGroup, order: number[]) => {
  const smallest = { state, images: undefined as ImageTable | undefined, end: order.length };
  const permuteSmallest = (position: number) => {
    if (smallest.images === undefined) return;
    smallest.state[order[position]] = permuteValue(state[order[position]], smallest.images);
    smallest.end = position + 1;
  };
  for (const images of group.images) {
    const permuted = state.slice();
    for (let position = 0; position < order.length; position++) {
      const index = order[position];
      if (position >= smallest.end) permuteSmallest(position);
      permuted[index] = permuteValue(state[index], images);
      const comparison = compareValues(permuted[index], smallest.state[index]);
      if (comparison > 0) break;
      if (comparison === 0) continue;
      smallest.state = permuted;
      smallest.images = images;
      smallest.end = position + 1;
      // TLC permutes the rest of a smaller image, and sorts it only if it compares or fingerprints it.
      for (let rest = position + 1; rest < order.length; rest++) {
        sortWrittenOrder(state[order[rest]]);
      }
      break;
    }
  }
  for (let position = smallest.end; position < order.length; position++) permuteSmallest(position);
  return smallest.state;
};

export const getRepresentative = (
  state: Value[],
  group: SymmetryGroup,
  order: number[],
): Value[] => {
  const stateImages = group.stateImages;
  const smallest = stateImages?.findSmallest(state, order, sortWrittenOrder);
  if (stateImages === undefined || smallest === undefined) {
    return getRepresentativeOfValues(state, group, order);
  }
  if (smallest === -1) return state;
  return state.map((value, variable) =>
    stateImages.isVariableMoved(variable, smallest)
      ? permuteValue(value, group.images[smallest])
      : value,
  );
};
