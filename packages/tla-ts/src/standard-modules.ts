import { TlaEvaluationError, TlaModuleError } from "./errors";
import {
  defineArithmetic,
  defineBinary,
  defineComparison,
  defineConstant,
  defineHigherOrderOperator,
  defineOperator,
  getBoolean,
  getElements,
  getNumber,
  getOperator,
  getSequence,
  getSet,
  getValue,
} from "./builtins";
import type { Builtin, BuiltinArgument } from "./evaluate";
import type { CheckerRuntime } from "./runtime";
import { BAGS_OPERATORS } from "./bags";
import { createJsonOperators, type FileSystem } from "./json";
import { createRandomizationOperators } from "./randomization";
import { createPossibleOperators, createTlcExtOperators } from "./tlc-ext";
import { createTlcOperators } from "./tlc-module";
import {
  checkInteger,
  createSet,
  createSortedSet,
  createTuple,
  differenceSorted,
  formatValue,
  getCardinality,
  getDomain,
  intersectSorted,
  isElementOf,
  isEmptySet,
  isEnumerable,
  isFunctionValue,
  isSetValue,
  toFiniteSet,
  unionSorted,
  valuesEqual,
  type SetOperationValue,
  type SetValue,
  type Value,
} from "./values";

interface StandardModule {
  extends: string[];
  operators: Builtin[];
}

const isSubsetOf = (left: Value[], right: Value) =>
  left.every((element) => isElementOf(element, right));

const BOOLEAN_SET = createSet([false, true]);
const EMPTY_SET = createSortedSet([]);
const MERGED_UNION_LIMIT = 8;

const SET_OPERATORS: SetOperationValue["operator"][] = ["\\cup", "\\cap", "\\"];

export const CORE_OPERATORS: Builtin[] = [
  defineConstant("TRUE", true),
  defineConstant("FALSE", false),
  defineConstant("BOOLEAN", BOOLEAN_SET),
  defineConstant("STRING", { kind: "InfiniteSet", name: "STRING" }),
  defineBinary("=", valuesEqual),
  defineBinary("#", (left, right) => !valuesEqual(left, right)),
  defineOperator("~", 1, (args) => !getBoolean(args, 0, "~")),
  defineOperator("<=>", 2, (args) => getBoolean(args, 0, "<=>") === getBoolean(args, 1, "<=>")),
  defineOperator("/\\", 2, (args) => getBoolean(args, 0, "/\\") && getBoolean(args, 1, "/\\")),
  defineOperator("\\/", 2, (args) => getBoolean(args, 0, "\\/") || getBoolean(args, 1, "\\/")),
  defineOperator("=>", 2, (args) => !getBoolean(args, 0, "=>") || getBoolean(args, 1, "=>")),
  defineOperator("\\in", 2, (args) =>
    isElementOf(getValue(args, 0, "\\in"), getSet(args, 1, "\\in")),
  ),
  defineOperator(
    "\\notin",
    2,
    (args) => !isElementOf(getValue(args, 0, "\\notin"), getSet(args, 1, "\\notin")),
  ),
  defineOperator("\\subseteq", 2, (args) => {
    const left = getSet(args, 0, "\\subseteq");
    const right = getSet(args, 1, "\\subseteq");
    const isPowerSets =
      typeof left === "object" &&
      left.kind === "Subset" &&
      typeof right === "object" &&
      right.kind === "Subset" &&
      isEnumerable(left.base);
    if (isPowerSets) return isSubsetOf(toFiniteSet(left.base).elements, right.base);
    return isSubsetOf(getElements(args, 0, "\\subseteq"), right);
  }),
  ...SET_OPERATORS.map((operator) =>
    defineOperator(operator, 2, (args) => {
      const left = getSet(args, 0, operator);
      const right = getSet(args, 1, operator);
      if (isEnumerable(left) && isEnumerable(right)) {
        const merge =
          operator === "\\cup"
            ? unionSorted
            : operator === "\\cap"
              ? intersectSorted
              : differenceSorted;
        return merge(toFiniteSet(left), toFiniteSet(right));
      }
      const isReducible = (value: Value) =>
        typeof value === "object" && (value.kind === "Set" || value.kind === "Interval");
      const isSwapped = operator === "\\cup" && !isReducible(left) && isReducible(right);
      const set: Value = isSwapped
        ? { kind: "SetOperation", operator, left: right, right: left }
        : { kind: "SetOperation", operator, left, right };
      return isEnumerable(set) ? toFiniteSet(set) : set;
    }),
  ),
  defineOperator("SUBSET", 1, (args) => ({ kind: "Subset", base: getSet(args, 0, "SUBSET") })),
  defineOperator("UNION", 1, (args) => {
    const sets = getElements(args, 0, "UNION");
    sets.forEach((element) => {
      if (!isSetValue(element)) {
        throw new TlaEvaluationError(
          `UNION expects a set of sets but found ${formatValue(element)}`,
        );
      }
    });
    if (sets.every((element) => typeof element === "object" && element.kind === "Set")) {
      if (sets.length > MERGED_UNION_LIMIT) {
        return createSet(sets.flatMap((element) => toFiniteSet(element).elements));
      }
      return sets.reduce<SetValue>(
        (union, element) => unionSorted(union, toFiniteSet(element)),
        EMPTY_SET,
      );
    }
    return sets.reduce((left, right) => ({ kind: "SetOperation", operator: "\\cup", left, right }));
  }),
  defineOperator("DOMAIN", 1, (args) => {
    const value = getValue(args, 0, "DOMAIN");
    if (!isFunctionValue(value)) {
      throw new TlaEvaluationError(`DOMAIN expects a function but received ${formatValue(value)}`);
    }
    return getDomain(value);
  }),
];

const NATURALS_OPERATORS: Builtin[] = [
  defineConstant("Nat", { kind: "InfiniteSet", name: "Nat" }),
  defineArithmetic("+", (left, right) => left + right),
  defineArithmetic("-", (left, right) => left - right),
  defineArithmetic("*", (left, right) => left * right),
  defineArithmetic("^", (base, exponent) => {
    if (exponent < 0 || (base === 0 && exponent === 0)) {
      throw new TlaModuleError(`${base}^${exponent} is undefined`);
    }
    return base ** exponent;
  }),
  defineArithmetic("\\div", (left, right) => {
    if (right === 0) throw new TlaModuleError(`Division by zero in ${left} \\div 0`);
    return Math.floor(left / right);
  }),
  defineArithmetic("%", (left, right) => {
    if (right <= 0)
      throw new TlaModuleError(`The second argument of % must be positive, but was ${right}`);
    return ((left % right) + right) % right;
  }),
  defineComparison("<", (left, right) => left < right),
  defineComparison(">", (left, right) => left > right),
  defineComparison("<=", (left, right) => left <= right),
  defineComparison(">=", (left, right) => left >= right),
  defineOperator("..", 2, (args) => ({
    kind: "Interval",
    low: getNumber(args, 0, ".."),
    high: getNumber(args, 1, ".."),
  })),
];

const INTEGERS_OPERATORS: Builtin[] = [
  defineConstant("Int", { kind: "InfiniteSet", name: "Int" }),
  defineOperator("-.", 1, (args) => checkInteger(-getNumber(args, 0, "-"))),
];

const getSequenceOrString = (args: BuiltinArgument[], index: number, name: string) => {
  const value = getValue(args, index, name);
  return typeof value === "string" ? value : getSequence(args, index, name);
};

const SEQUENCES_OPERATORS: Builtin[] = [
  defineOperator("Seq", 1, (args) => ({ kind: "SequenceSet", base: getSet(args, 0, "Seq") })),
  defineOperator("Len", 1, (args) => getSequenceOrString(args, 0, "Len").length),
  defineOperator("\\o", 2, (args) => {
    const left = getSequenceOrString(args, 0, "\\o");
    const right = getSequenceOrString(args, 1, "\\o");
    if (typeof left === "string" && typeof right === "string") return left + right;
    if (typeof left === "string" || typeof right === "string") {
      throw new TlaModuleError("\\o cannot concatenate a string with a sequence");
    }
    return createTuple([...left, ...right]);
  }),
  defineOperator("Append", 2, (args) =>
    createTuple([...getSequence(args, 0, "Append"), getValue(args, 1, "Append")]),
  ),
  defineOperator("Head", 1, (args) => {
    const elements = getSequence(args, 0, "Head");
    if (elements.length === 0)
      throw new TlaModuleError("Attempted to apply Head to the empty sequence");
    return elements[0];
  }),
  defineOperator("Tail", 1, (args) => {
    const sequence = getSequenceOrString(args, 0, "Tail");
    if (sequence.length === 0)
      throw new TlaModuleError("Attempted to apply Tail to the empty sequence");
    return typeof sequence === "string" ? sequence.slice(1) : createTuple(sequence.slice(1));
  }),
  defineOperator("SubSeq", 3, (args) => {
    const sequence = getSequenceOrString(args, 0, "SubSeq");
    const start = getNumber(args, 1, "SubSeq");
    const end = getNumber(args, 2, "SubSeq");
    if (start > end) return typeof sequence === "string" ? "" : createTuple([]);
    if (start < 1 || end > sequence.length) {
      throw new TlaModuleError(`SubSeq bounds ${start}..${end} are outside 1..${sequence.length}`);
    }
    return typeof sequence === "string"
      ? sequence.slice(start - 1, end)
      : createTuple(sequence.slice(start - 1, end));
  }),
  defineHigherOrderOperator("SelectSeq", 2, (args) => {
    const test = getOperator(args, 1, "SelectSeq");
    return createTuple(
      getSequence(args, 0, "SelectSeq").filter((element) => {
        const result = test.call([element]);
        if (typeof result !== "boolean")
          throw new TlaModuleError("The test of SelectSeq must return a boolean");
        return result;
      }),
    );
  }),
];

const FINITE_SETS_OPERATORS: Builtin[] = [
  defineOperator("IsFiniteSet", 1, (args) => isEnumerable(getSet(args, 0, "IsFiniteSet"))),
  defineOperator("Cardinality", 1, (args) => {
    const set = getSet(args, 0, "Cardinality");
    if (isEmptySet(set)) return 0;
    if (!isEnumerable(set))
      throw new TlaModuleError(`Cardinality of the infinite set ${formatValue(set)}`);
    return getCardinality(set);
  }),
];

export const getStandardModule = (
  name: string,
  print: (text: string) => void,
  runtime: CheckerRuntime,
  files: FileSystem,
): StandardModule | undefined => {
  switch (name) {
    case "Naturals":
      return { extends: [], operators: NATURALS_OPERATORS };
    case "Integers":
      return { extends: ["Naturals"], operators: INTEGERS_OPERATORS };
    case "Sequences":
      return { extends: [], operators: SEQUENCES_OPERATORS };
    case "FiniteSets":
      return { extends: [], operators: FINITE_SETS_OPERATORS };
    case "TLC":
      return { extends: [], operators: createTlcOperators(print, runtime) };
    case "Randomization":
      return { extends: [], operators: createRandomizationOperators(runtime) };
    case "_Possible":
      return { extends: [], operators: createPossibleOperators(print, runtime) };
    case "Json":
      return { extends: [], operators: createJsonOperators(files) };
    case "Bags":
      return { extends: [], operators: BAGS_OPERATORS };
    case "TLCExt":
      return { extends: [], operators: createTlcExtOperators(print, runtime) };
    default:
      return undefined;
  }
};
