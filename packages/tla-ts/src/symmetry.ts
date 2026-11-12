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

interface SymmetryGroup {
  permutations: RankedImages[];
  // The orbit of each model value some permutation moves, by rank. Each orbit is usually one of
  // the sets the symmetry permutes.
  orbitOfRank: (number | undefined)[];
  orbitCount: number;
  // Which of its orbit's distinct restrictions each permutation has, by orbit then permutation.
  // Permutations with the same restrictions on the orbits a value holds give it the same image.
  restrictions: Int32Array;
  restrictionCounts: number[];
  // Permuting a value once per restriction needs more candidates than this.
  fewestRestrictions: number;
}

// Masks of orbits fit in a 32-bit integer.
const MAX_ORBIT_COUNT = 30;

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
  const parents = new Map<number, number>();
  const findRoot = (rank: number): number => {
    const parent = parents.get(rank) ?? rank;
    return parent === rank ? rank : findRoot(parent);
  };
  const permutations = [...group.values()].map((images) => {
    const ranked: (ModelValue | undefined)[] = [];
    images.forEach((image, name) => {
      const rank = createModelValue(name).rank;
      ranked[rank] = image;
      parents.set(findRoot(rank), findRoot(image.rank));
    });
    return ranked;
  });
  const roots = [...new Set([...parents.keys()].map(findRoot))];
  const orbitCount = roots.length > MAX_ORBIT_COUNT ? 1 : roots.length;
  const orbitRanks: number[][] = Array.from({ length: orbitCount }, () => []);
  const orbitOfRank: (number | undefined)[] = [];
  [...parents.keys()].forEach((rank) => {
    const orbit = orbitCount === 1 ? 0 : roots.indexOf(findRoot(rank));
    orbitOfRank[rank] = orbit;
    orbitRanks[orbit].push(rank);
  });
  const restrictions = new Int32Array(orbitCount * permutations.length);
  const restrictionCounts = orbitRanks.map((ranks, orbit) => {
    const ids = new Map<string, number>();
    permutations.forEach((images, permutation) => {
      const key = ranks.map((rank) => images[rank]?.rank ?? rank).join(",");
      const id = ids.get(key) ?? ids.size;
      ids.set(key, id);
      restrictions[orbit * permutations.length + permutation] = id;
    });
    return ids.size;
  });
  return {
    permutations,
    orbitOfRank,
    orbitCount,
    restrictions,
    restrictionCounts,
    fewestRestrictions: Math.min(...restrictionCounts),
  };
};

// The orbits of the model values a value may hold, as a mask, stopping once it holds every orbit.
// A value that holds none is its own image under every permutation.
const getOrbitMask = (value: Value, group: SymmetryGroup, allOrbits: number): number => {
  if (typeof value !== "object") return 0;
  if (value.kind === "ModelValue") {
    const orbit = group.orbitOfRank[value.rank];
    return orbit === undefined ? 0 : 1 << orbit;
  }
  if (value.kind === "Set") return getElementsOrbitMask(value.elements, group, allOrbits, 0);
  if (value.kind === "Function") {
    const mask = getElementsOrbitMask(value.domain, group, allOrbits, 0);
    return mask === allOrbits ? mask : getElementsOrbitMask(value.range, group, allOrbits, mask);
  }
  return value.kind === "Interval" ? 0 : allOrbits;
};

const getElementsOrbitMask = (
  values: Value[],
  group: SymmetryGroup,
  allOrbits: number,
  initial: number,
) => {
  let mask = initial;
  for (const value of values) {
    mask |= getOrbitMask(value, group, allOrbits);
    if (mask === allOrbits) return mask;
  }
  return mask;
};

const permuteElements = (elements: Value[], images: RankedImages) => {
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

// The builtin sort's callback overhead outweighs its fewer comparisons on short arrays.
const MAXIMUM_INSERTION_SORT_LENGTH = 32;

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
  if (moved.length > MAXIMUM_INSERTION_SORT_LENGTH) moved.sort(compareValues);
  else {
    for (let index = 1; index < moved.length; index++) {
      const value = moved[index];
      let position = index;
      for (; position > 0 && compareValues(moved[position - 1], value) > 0; position--) {
        moved[position] = moved[position - 1];
      }
      moved[position] = value;
    }
  }
  const merged = elements.slice();
  let keptIndex = 0;
  let movedIndex = 0;
  for (let index = 0; index < merged.length; index++) {
    const isKept =
      movedIndex === moved.length ||
      (keptIndex < kept.length && compareValues(kept[keptIndex], moved[movedIndex]) < 0);
    merged[index] = isKept ? kept[keptIndex++] : moved[movedIndex++];
  }
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
      // A domain of model values with consecutive ranks that the permutation maps onto itself,
      // such as the symmetric set, stays in place: each value moves to its key's image.
      const original = functionValue.domain;
      const first = original[0];
      const firstRank = typeof first === "object" && first.kind === "ModelValue" ? first.rank : -1;
      let isInPlace = firstRank !== -1;
      for (let index = 0; isInPlace && index < domain.length; index++) {
        const key = original[index];
        const image = domain[index];
        isInPlace =
          typeof key === "object" &&
          key.kind === "ModelValue" &&
          key.rank === firstRank + index &&
          typeof image === "object" &&
          image.kind === "ModelValue" &&
          image.rank >= firstRank &&
          image.rank < firstRank + domain.length;
      }
      if (isInPlace) {
        const placed = range.slice();
        for (let index = 0; index < domain.length; index++) {
          const image = domain[index];
          if (typeof image === "object" && image.kind === "ModelValue") {
            placed[image.rank - firstRank] = range[index];
          }
        }
        return createSortedFunction(original, placed);
      }
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
  group: SymmetryGroup,
  order: number[],
): Value[] => {
  // Narrows the permutations one variable at a time to those whose images tie for the smallest so
  // far, so each variable is permuted only by permutations that can still give the smallest state.
  // The state itself stays a candidate until a permutation makes a variable smaller.
  const permutations = group.permutations;
  const permutationCount = permutations.length;
  const candidates: number[] = [];
  for (let permutation = 0; permutation < permutationCount; permutation++) {
    candidates.push(permutation);
  }
  let candidateCount = permutationCount;
  let isStateSmallest = true;
  const smallest = state.slice();
  const allOrbits = 2 ** group.orbitCount - 1;
  for (const index of order) {
    if (candidateCount === 0) break;
    const value = state[index];
    const mask =
      group.orbitCount > 1 && candidateCount > group.fewestRestrictions
        ? getOrbitMask(value, group, allOrbits)
        : allOrbits;
    if (mask === 0) continue;
    // A value that holds only some orbits has one image per distinct restriction to them, so each
    // restriction is permuted once.
    let restrictionCount = 1;
    for (let orbit = 0, bits = mask; mask !== allOrbits && bits !== 0; orbit++, bits >>= 1) {
      if (bits & 1) restrictionCount *= group.restrictionCounts[orbit];
    }
    if (mask !== allOrbits && restrictionCount < candidateCount) {
      const keys: number[] = [];
      const imageOfKey: (Value | undefined)[] = [];
      let minimum = isStateSmallest ? value : undefined;
      let isMinimumState = isStateSmallest;
      for (let candidate = 0; candidate < candidateCount; candidate++) {
        const permutation = candidates[candidate];
        let key = 0;
        let stride = 1;
        for (let orbit = 0, bits = mask; bits !== 0; orbit++, bits >>= 1) {
          if ((bits & 1) === 0) continue;
          key += group.restrictions[orbit * permutationCount + permutation] * stride;
          stride *= group.restrictionCounts[orbit];
        }
        keys.push(key);
        if (imageOfKey[key] !== undefined) continue;
        const permuted = permuteValue(value, permutations[permutation]);
        imageOfKey[key] = permuted;
        if (minimum === undefined || compareValues(permuted, minimum) < 0) {
          minimum = permuted;
          isMinimumState = false;
        }
      }
      const isTiedKey: (boolean | undefined)[] = [];
      let kept = 0;
      for (let candidate = 0; candidate < candidateCount; candidate++) {
        const key = keys[candidate];
        let isTied = isTiedKey[key];
        if (isTied === undefined) {
          const image = imageOfKey[key];
          isTied =
            image === minimum ||
            (image !== undefined && minimum !== undefined && compareValues(image, minimum) === 0);
          isTiedKey[key] = isTied;
        }
        if (isTied) candidates[kept++] = candidates[candidate];
      }
      if (!isMinimumState && minimum !== undefined) {
        smallest[index] = minimum;
        isStateSmallest = false;
      }
      candidateCount = kept;
      continue;
    }
    let kept = 0;
    for (let candidate = 0; candidate < candidateCount; candidate++) {
      const permutation = candidates[candidate];
      const permuted = permuteValue(value, permutations[permutation]);
      // A value the first permutation fixes may hold no model value the group moves, and then every
      // permutation fixes it. A value the first permutation moves needs no such walk.
      if (candidate === 0 && permuted === value && getOrbitMask(value, group, allOrbits) === 0) {
        kept = candidateCount;
        break;
      }
      const comparison =
        kept === 0 && !isStateSmallest ? -1 : compareValues(permuted, smallest[index]);
      if (comparison < 0) {
        smallest[index] = permuted;
        isStateSmallest = false;
        kept = 0;
      }
      if (comparison <= 0) candidates[kept++] = permutation;
    }
    candidateCount = kept;
  }
  return isStateSmallest ? state : smallest;
};
