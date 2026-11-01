import { TlaEvaluationError, TlaModuleError } from "./errors";
import {
  createOverflowError,
  defineArithmetic,
  defineBinary,
  defineComparison,
  defineConstant,
  defineHigherOrderOperator,
  defineOperator,
  getBoolean,
  getNumber,
  getOperator,
  getSet,
  getJavaSignature,
  getJavaInteger,
  getValue,
  isOutOfRange,
  overrideWithJava,
} from "./builtins";
import type { Builtin, BuiltinArgument } from "./evaluate";
import type { CheckerRuntime } from "./runtime";
import { createBagsOperators } from "./bags";
import { createJsonOperators, type FileSystem } from "./json";
import { createRandomizationOperators } from "./randomization";
import { createPossibleOperators, createTlcExtOperators } from "./tlc-ext";
import { createTlcOperators } from "./tlc-module";
import { TLC_JAVA_METHODS } from "./tlc-modules";
import {
  createSet,
  describeKind,
  createTuple,
  differenceSorted,
  formatValue,
  getCardinality,
  getDomain,
  intersectSorted,
  isElementOf,
  getSequenceElements,
  isEmptySet,
  isEnumerable,
  isFiniteSet,
  isFunctionValue,
  computeLikeTlcOnFailure,
  isReducibleSet,
  markStreamedSet,
  isSetValue,
  toFiniteSet,
  unionSorted,
  isEqualLikeTlc,
  createEnumeratedSet,
  EMPTY_SET,
  isEnumeratedSet,
  type IntervalValue,
  type MixedSetValue,
  type SetOperationValue,
  type SetValue,
  type Value,
  rankString,
} from "./values";
import type { TlcVersion } from "./tlc-version";

interface StandardModule {
  extends: string[];
  operators: Builtin[];
}

const isSubsetOf = (left: Value[], right: Value) =>
  left.every((element) => isElementOf(element, right));

const BOOLEAN_SET = createSet([false, true]);

// Merging the sets pairwise in a balanced tree compares each element about log2 of their count
// times.
const unionInTree = (sets: SetValue[], start: number, end: number): SetValue => {
  if (end - start === 1) return sets[start];
  const middle = (start + end) >> 1;
  return unionSorted(unionInTree(sets, start, middle), unionInTree(sets, middle, end));
};

const SET_OPERATORS: SetOperationValue["operator"][] = ["\\cup", "\\cap", "\\"];

type ReducibleSet = SetValue | MixedSetValue | IntervalValue;

const isMixedSet = (value: Value) => typeof value === "object" && value.kind === "MixedSet";

const getReducibleElements = (set: ReducibleSet) =>
  set.kind === "Interval" ? toFiniteSet(set).elements : set.elements;

// TLC combines a set enumeration or an interval with another set element by element, testing each
// element for membership in the other set.
const combineReducible = (
  operator: SetOperationValue["operator"],
  set: ReducibleSet,
  other: Value,
): Value => {
  const elements = getReducibleElements(set);
  if (operator !== "\\cup") {
    const isKept = operator === "\\cap";
    return createEnumeratedSet(
      elements.filter((element) => isElementOf(element, other) === isKept),
    );
  }
  if (elements.length === 0) return other;
  if (!isReducibleSet(other)) {
    return markStreamedSet({ kind: "SetOperation", operator, left: set, right: other });
  }
  const added = toFiniteSet(other).elements.filter((element) => !isElementOf(element, set));
  return createEnumeratedSet([...elements, ...added]);
};

export const CORE_OPERATORS: Builtin[] = [
  defineConstant("TRUE", true),
  defineConstant("FALSE", false),
  defineConstant("BOOLEAN", BOOLEAN_SET),
  defineConstant("STRING", { kind: "InfiniteSet", name: "STRING" }),
  defineBinary("=", isEqualLikeTlc),
  defineBinary("#", (left, right) => !isEqualLikeTlc(left, right)),
  defineOperator("~", 1, (args) => !getBoolean(args, 0, "~")),
  defineOperator("<=>", 2, (args) => getBoolean(args, 0, "<=>") === getBoolean(args, 1, "<=>")),
  defineOperator("/\\", 2, (args) => getBoolean(args, 0, "/\\") && getBoolean(args, 1, "/\\")),
  defineOperator("\\/", 2, (args) => getBoolean(args, 0, "\\/") || getBoolean(args, 1, "\\/")),
  defineOperator("=>", 2, (args) => !getBoolean(args, 0, "=>") || getBoolean(args, 1, "=>")),
  defineOperator("\\in", 2, (args) =>
    isElementOf(getValue(args, 0, "\\in"), getValue(args, 1, "\\in")),
  ),
  defineOperator(
    "\\notin",
    2,
    (args) => !isElementOf(getValue(args, 0, "\\notin"), getValue(args, 1, "\\notin")),
  ),
  defineOperator("\\subseteq", 2, (args) => {
    const left = getSet(args, 0, "\\subseteq");
    // TLC tests each element of the left set for membership in the right value.
    const right = getValue(args, 1, "\\subseteq");
    const isPowerSets =
      typeof left === "object" &&
      left.kind === "Subset" &&
      typeof right === "object" &&
      right.kind === "Subset" &&
      isEnumerable(left.base);
    if (isPowerSets) return isSubsetOf(toFiniteSet(left.base).elements, right.base);
    return isSubsetOf(toFiniteSet(left).elements, right);
  }),
  // TLC defers the set operations of values that aren't sets to the enumeration or the membership
  // tests of the result.
  ...SET_OPERATORS.map((operator) =>
    defineOperator(operator, 2, (args) => {
      const left = getValue(args, 0, operator);
      const right = getValue(args, 1, operator);
      if (
        isReducibleSet(left) &&
        isReducibleSet(right) &&
        !isMixedSet(left) &&
        !isMixedSet(right)
      ) {
        if (operator === "\\cup" && isEmptySet(left)) return right;
        const merge =
          operator === "\\cup"
            ? unionSorted
            : operator === "\\cap"
              ? intersectSorted
              : differenceSorted;
        // The merge compares the elements, which TLC tests for membership one by one instead.
        return computeLikeTlcOnFailure(
          () => merge(toFiniteSet(left), toFiniteSet(right)),
          () => combineReducible(operator, left, right),
        );
      }
      if (isReducibleSet(left)) return combineReducible(operator, left, right);
      if (operator !== "\\" && isReducibleSet(right))
        return combineReducible(operator, right, left);
      return markStreamedSet({ kind: "SetOperation", operator, left, right });
    }),
  ),
  defineOperator("SUBSET", 1, (args) => ({ kind: "Subset", base: getValue(args, 0, "SUBSET") })),
  defineOperator("UNION", 1, (args) => {
    const outer = getSet(args, 0, "UNION");
    const sets = isEnumeratedSet(outer) ? outer.elements.filter(isEnumeratedSet) : [];
    if (!isEnumeratedSet(outer) || sets.length !== outer.elements.length) {
      return markStreamedSet({ kind: "Union", base: outer });
    }
    if (isMixedSet(outer) || sets.some(isMixedSet)) {
      const union: MixedSetValue = { kind: "MixedSet", elements: [] };
      sets.forEach((set) =>
        set.elements.forEach((member) => {
          if (!isElementOf(member, union)) union.elements.push(member);
        }),
      );
      return createEnumeratedSet(union.elements);
    }
    return sets.length === 0 ? EMPTY_SET : unionInTree(sets.map(toFiniteSet), 0, sets.length);
  }),
  defineOperator("DOMAIN", 1, (args) => {
    const value = getValue(args, 0, "DOMAIN");
    if (!isFunctionValue(value)) {
      throw new TlaEvaluationError(`DOMAIN expects a function but received ${formatValue(value)}`);
    }
    return getDomain(value);
  }),
];

const NEG_SIGNATURE = getJavaSignature("Integers", "Neg", "IntValue", 1);

// TLC overrides the arithmetic of Naturals with the Java methods of tlc2.module.Naturals, or with
// those of tlc2.module.Integers when the spec loads Integers, and names the method in an error.
const createArithmeticOperators = (module: string) => {
  const dotDotSignature = getJavaSignature(module, "DotDot", "IntervalValue", 2);
  return [
    defineArithmetic(module, "+", "Plus", (left, right) => left + right),
    defineArithmetic(module, "-", "Minus", (left, right) => left - right),
    defineArithmetic(module, "*", "Times", (left, right) => left * right),
    defineArithmetic(module, "^", "Expt", (base, exponent) => {
      if (exponent < 0) {
        throw new TlaModuleError(
          `The second argument of ^ should be a natural number, but instead it is:\n${exponent}`,
        );
      }
      if (base === 0 && exponent === 0) throw new TlaModuleError("0^0 is undefined.");
      return base ** exponent;
    }),
    defineArithmetic(module, "\\div", "Divide", (left, right) => {
      if (right === 0) throw new TlaModuleError("The second argument of \\div is 0.");
      // tlc2.module.Naturals#Divide floors only a quotient Java truncates below 0, and lets
      // -2147483648 \div -1 overflow.
      if (module === "Naturals") {
        const truncated = Math.trunc(left / right) | 0;
        return truncated < 0 && Math.imul(truncated, right) !== left ? truncated - 1 : truncated;
      }
      const quotient = Math.floor(left / right);
      if (isOutOfRange(quotient)) throw createOverflowError(`${left} \\div ${right}`);
      return quotient;
    }),
    defineArithmetic(module, "%", "Mod", (left, right) => {
      if (right <= 0) {
        throw new TlaModuleError(
          `The second argument of % should be a positive number, but instead it is:\n${right}`,
        );
      }
      return ((left % right) + right) % right;
    }),
    defineOperator("..", 2, (args) => ({
      kind: "Interval",
      low: getJavaInteger(getValue(args, 0, ".."), dotDotSignature),
      high: getJavaInteger(getValue(args, 1, ".."), dotDotSignature),
    })),
  ];
};

const NATURALS_ARITHMETIC = createArithmeticOperators("Naturals");

const INTEGERS_ARITHMETIC = createArithmeticOperators("Integers");

// The operators of Naturals that TLC overrides with the methods of tlc2.module.Integers when it
// loads Integers for its trace exploration spec, by the operator each replaces.
export const getTraceSpecArithmetic = (builtin: Builtin) => {
  const index = NATURALS_ARITHMETIC.indexOf(builtin);
  return index === -1 ? undefined : INTEGERS_ARITHMETIC[index];
};

const NATURALS_OPERATORS = [
  defineConstant("Nat", { kind: "InfiniteSet", name: "Nat" }),
  ...NATURALS_ARITHMETIC,
  defineComparison("<", (left, right) => left < right),
  defineComparison(">", (left, right) => left > right),
  defineComparison("<=", (left, right) => left <= right),
  // tlc2.module.Naturals#GEQ names itself > in its errors. Only a spec that extends Integers gets
  // the GEQ of tlc2.module.Integers, not one that loads Integers for its trace exploration spec.
  defineComparison(">=", (left, right) => left >= right, ">"),
];

const INTEGERS_OPERATORS = [
  defineConstant("Int", { kind: "InfiniteSet", name: "Int" }),
  ...INTEGERS_ARITHMETIC,
  defineComparison(">=", (left, right) => left >= right),
  defineOperator("-.", 1, (args) => {
    const value = getJavaInteger(getValue(args, 0, "-"), NEG_SIGNATURE);
    if (isOutOfRange(-value)) throw createOverflowError(`-${value}`);
    return -value;
  }),
];

const getSequenceArgument = (args: BuiltinArgument[], index: number, message: string) => {
  const value = getValue(args, index, message);
  const elements = getSequenceElements(value);
  if (!elements) throw new TlaModuleError(`${message}\n${formatValue(value)}`);
  return elements;
};

const getSequenceOrString = (args: BuiltinArgument[], index: number, message: string) => {
  const value = getValue(args, index, message);
  return typeof value === "string" ? value : getSequenceArgument(args, index, message);
};

const sliceSequence = (sequence: string | Value[], start: number, end?: number) =>
  typeof sequence === "string"
    ? rankString(sequence.slice(start, end))
    : createTuple(sequence.slice(start, end));

const getSequenceMessage = (position: string, name: string) =>
  `The ${position}argument of ${name} should be a sequence, but instead it is:`;

const getEvaluatingMessage = (form: string, kind: string) =>
  `Evaluating an expression of the form ${form} when s is not a ${kind}:`;

const withJavaMethods = (module: string, operators: Builtin[]) => {
  const methods = TLC_JAVA_METHODS.get(module);
  if (!methods) return operators;
  return operators.map((operator) => {
    const signature = methods.get(operator.name);
    return signature ? overrideWithJava(operator, signature) : operator;
  });
};

const createSequencesOperators = (version: TlcVersion) =>
  withJavaMethods("Sequences", [
    defineOperator("Seq", 1, (args) => ({ kind: "SequenceSet", base: getValue(args, 0, "Seq") })),
    defineOperator(
      "Len",
      1,
      (args) => getSequenceOrString(args, 0, getSequenceMessage("", "Len")).length,
    ),
    defineOperator("\\o", 2, (args) => {
      const left = getSequenceOrString(args, 0, getEvaluatingMessage("s \\o t", "sequence"));
      if (typeof left !== "string") {
        const right = getSequenceArgument(args, 1, getEvaluatingMessage("t \\o s", "sequence"));
        return createTuple([...left, ...right]);
      }
      const right = getValue(args, 1, "\\o");
      if (typeof right !== "string") {
        throw new TlaModuleError(
          `${getEvaluatingMessage("t \\o s", "string")}\n${formatValue(right)}`,
        );
      }
      return rankString(left + right);
    }),
    defineOperator("Append", 2, (args) =>
      createTuple([
        ...getSequenceArgument(
          args,
          0,
          getEvaluatingMessage(version === "1.7.4" ? "Append(v, s)" : "Append(s, v)", "sequence"),
        ),
        getValue(args, 1, "Append"),
      ]),
    ),
    defineOperator("Head", 1, (args) => {
      const elements = getSequenceArgument(args, 0, getSequenceMessage("", "Head"));
      if (elements.length === 0)
        throw new TlaModuleError("Attempted to apply Head to the empty sequence.");
      return elements[0];
    }),
    defineOperator("Tail", 1, (args) => {
      const sequence = getSequenceOrString(args, 0, getSequenceMessage("", "Tail"));
      if (sequence.length === 0)
        throw new TlaModuleError("Attempted to apply Tail to the empty sequence.");
      return sliceSequence(sequence, 1);
    }),
    defineOperator("SubSeq", 3, (args) => {
      const sequence = getSequenceOrString(args, 0, getSequenceMessage("first ", "SubSeq"));
      const start = getNumber(args, 1, "SubSeq");
      const end = getNumber(args, 2, "SubSeq");
      if (start > end) return sliceSequence(sequence, 0, 0);
      const outOfDomain =
        start < 1 || start > sequence.length
          ? { position: "second", value: start }
          : end > sequence.length
            ? { position: "third", value: end }
            : undefined;
      if (outOfDomain) {
        throw new TlaModuleError(
          `The ${outOfDomain.position} argument of SubSeq must be in the domain of its first argument:\n${formatValue(getValue(args, 0, "SubSeq"))}\n, but instead it is\n${outOfDomain.value}`,
        );
      }
      return sliceSequence(sequence, start - 1, end);
    }),
    defineHigherOrderOperator("SelectSeq", 2, (args) => {
      const test = getOperator(args, 1, "SelectSeq");
      return createTuple(
        getSequenceArgument(args, 0, getSequenceMessage("first ", "SelectSeq")).filter(
          (element) => {
            const result = test.call([element]);
            if (typeof result !== "boolean") {
              throw new TlaModuleError(
                `The second argument of SelectSeq should be a operator, but instead it is:\n${formatValue(result)}`,
              );
            }
            return result;
          },
        ),
      );
    }),
  ]);

const createFiniteSetsOperators = (version: TlcVersion) =>
  withJavaMethods("FiniteSets", [
    defineOperator("IsFiniteSet", 1, (args) => {
      const value = getValue(args, 0, "IsFiniteSet");
      if (isSetValue(value)) return isFiniteSet(value);
      if (typeof value === "object" && value.kind === "Function") return true;
      throw new TlaEvaluationError(
        typeof value === "object" && value.kind === "LazyFunction"
          ? `Attempted to check if the function:\n${formatValue(value)}\nis a finite set.`
          : `Attempted to check if the ${describeKind(value)} ${formatValue(value)} is a finite set.`,
      );
    }),
    defineOperator("Cardinality", 1, (args) => {
      const set = getValue(args, 0, "Cardinality");
      if (
        !isSetValue(set) ||
        (typeof set === "object" && (set.kind === "InfiniteSet" || set.kind === "SequenceSet"))
      ) {
        throw new TlaModuleError(
          `Attempted to compute cardinality of the value\n${formatValue(set)}`,
        );
      }
      return getCardinality(set, version);
    }),
  ]);

// The modules that each standard module loads through EXTENDS and LOCAL INSTANCE in TLC.
export const STANDARD_DEPENDENCIES = new Map([
  ["Integers", ["Naturals"]],
  ["Sequences", ["Naturals"]],
  ["FiniteSets", ["Naturals", "Sequences"]],
  ["TLC", ["Naturals", "Sequences", "FiniteSets"]],
  ["Randomization", ["Naturals", "FiniteSets", "Sequences"]],
  ["_Possible", ["TLC", "TLCExt", "Naturals", "Sequences", "FiniteSets", "Integers"]],
  ["Json", ["Sequences", "FiniteSets", "TLC", "Naturals"]],
  ["Bags", ["Naturals"]],
  ["TLCExt", ["TLC", "Integers", "Naturals", "Sequences", "FiniteSets"]],
]);

export const getStandardModule = (
  name: string,
  print: (text: string) => void,
  runtime: CheckerRuntime,
  files: FileSystem,
  builtins: ReadonlyMap<string, Builtin>,
): StandardModule | undefined => {
  switch (name) {
    case "Naturals":
      return { extends: [], operators: NATURALS_OPERATORS };
    case "Integers":
      return { extends: ["Naturals"], operators: INTEGERS_OPERATORS };
    case "Sequences":
      return { extends: [], operators: createSequencesOperators(runtime.version) };
    case "FiniteSets":
      return { extends: [], operators: createFiniteSetsOperators(runtime.version) };
    case "TLC":
      return { extends: [], operators: withJavaMethods("TLC", createTlcOperators(print, runtime)) };
    case "Randomization":
      return { extends: [], operators: createRandomizationOperators(runtime) };
    case "_Possible":
      return { extends: [], operators: createPossibleOperators(print, runtime) };
    case "Json":
      return { extends: [], operators: createJsonOperators(files) };
    case "Bags":
      return { extends: [], operators: createBagsOperators(builtins) };
    case "TLCExt":
      return { extends: [], operators: createTlcExtOperators(print, runtime) };
    default:
      return undefined;
  }
};
