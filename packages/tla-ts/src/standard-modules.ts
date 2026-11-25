import { TlaEvaluationError, TlaModuleError, TlaSetBoundError } from "./errors";
import {
  checkJavaArity,
  createModuleArgumentError,
  createOverflowError,
  defineArithmetic,
  defineBinary,
  defineComparison,
  defineConstant,
  defineHigherOrderOperator,
  defineOperator,
  getBoolean,
  getOperator,
  getThunk,
  getJavaSignature,
  getJavaInteger,
  getValue,
  isOutOfRange,
  overrideWithJava,
} from "./builtins";
import type { Builtin, Context } from "./evaluate";
import { prettyPrint } from "./pretty-print";
import type { CheckerRuntime } from "./runtime";
import { BAGS_OPERATORS } from "./bags";
import { createIoUtilsOperators, createJsonOperators, type FileSystem } from "./json";
import { createTlcTraceOperators } from "./tlc/value-stream";
import { createRandomizationOperators, createRandomSubsetSet } from "./randomization";
import {
  createPossibleOperators,
  createTlcExtOperators,
  createTraceStateOperator,
} from "./tlc/tlcext-operators";
import { createTlcOperators } from "./tlc/tlc-operators";
import { TLC_JAVA_METHODS } from "./tlc/jar-data";
import {
  addBoundedElement,
  ANY_SET,
  createUnsortedCopy,
  forEachElement,
  isBeyondSetBound,
  createSet,
  createSortedSet,
  compareValues,
  createTuple,
  getSortedDifference,
  formatValue,
  getCardinality,
  getDomain,
  getFunctionClass,
  getSortedIntersection,
  hasTypedModelValues,
  someStreamedElement,
  isElementOf,
  getSequenceElements,
  isEmptySet,
  isEnumerable,
  isFiniteSet,
  isFunctionValue,
  isOverriddenSet,
  computeLikeTlcOnFailure,
  isReducibleSet,
  markNormalized,
  markStreamedSet,
  isSetValue,
  setCostModel,
  toFiniteSet,
  getSortedUnion,
  getTupleCostModel,
  getValueKey,
  getWrittenElements,
  isNormalizedSet,
  isEqualLikeTlc,
  createEnumeratedSet,
  createNormalizedSet,
  createSetOperation,
  createUnion,
  EMPTY_SET,
  isEnumeratedSet,
  type IntervalValue,
  type MixedSetValue,
  type SetOperationValue,
  type SetValue,
  type Value,
  rankString,
  getMaximumSetSize,
  getSetBoundMessage,
} from "./values";
import type { TlcVersion } from "./tlc/version";
import { getSanyStandardModules } from "./sany/modules";

const BOOLEAN_SET = createSet([false, true]);
markNormalized(BOOLEAN_SET);

const getBalancedUnion = (sets: SetValue[], start: number, end: number): SetValue => {
  if (end - start === 1) return sets[start];
  const middle = (start + end) >> 1;
  return getSortedUnion(getBalancedUnion(sets, start, middle), getBalancedUnion(sets, middle, end));
};

const SET_OPERATORS: SetOperationValue["operator"][] = ["\\cup", "\\cap", "\\"];

type ReducibleSet = SetValue | MixedSetValue | IntervalValue;

const isMixedSet = (value: Value) => typeof value === "object" && value.kind === "MixedSet";

const isNormalizedReducible = (set: ReducibleSet) =>
  set.kind === "Interval" || isNormalizedSet(set);

const combineReducible = (
  operator: SetOperationValue["operator"],
  set: ReducibleSet,
  other: Value,
): Value => {
  if (set.kind === "Interval") getCardinality(set);
  const elements = set.kind === "Interval" ? set : getWrittenElements(set);
  if (operator !== "\\cup") {
    const isKept = operator === "\\cap";
    const kept: Value[] = [];
    forEachElement(elements, (element) => {
      if (isElementOf(element, other) === isKept) addBoundedElement(kept, element);
    });
    return isNormalizedReducible(set) ? createNormalizedSet(kept) : createEnumeratedSet(kept);
  }
  if (isEmptySet(set)) return other;
  if (!isReducibleSet(other)) {
    return markStreamedSet(createSetOperation(operator, set, other, undefined));
  }
  const union: Value[] = [];
  forEachElement(elements, (element) => addBoundedElement(union, element));
  forEachElement(other.kind === "Interval" ? other : toFiniteSet(other).elements, (element) => {
    if (!isElementOf(element, set)) addBoundedElement(union, element);
  });
  return createEnumeratedSet(union);
};

const isIntervalInSortedSet = (interval: IntervalValue, set: SetValue) => {
  const elements = set.elements;
  let low = 0;
  let high = elements.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    const probe = elements[middle];
    if (typeof probe !== "number") return undefined;
    if (probe < interval.low) low = middle + 1;
    else high = middle;
  }
  for (let element = interval.low; element <= interval.high; element++, low++) {
    if (low === elements.length) return false;
    const probe = elements[low];
    if (probe !== element) return typeof probe === "number" ? false : undefined;
  }
  return true;
};

const isIntervalSubset = (left: IntervalValue, right: Value) => {
  const isWithin =
    typeof right === "object" &&
    right.kind === "Interval" &&
    right.low <= left.low &&
    right.high >= left.high;
  if (isWithin) return true;
  const isContained =
    typeof right === "object" && right.kind === "Set"
      ? isIntervalInSortedSet(left, right)
      : undefined;
  if (isContained !== undefined) return isContained;
  for (let element = left.low; element <= left.high; element++) {
    if (!isElementOf(element, right)) return false;
  }
  return true;
};

const defineShortCircuit = (
  name: string,
  compute: (left: boolean, right: () => boolean) => boolean,
): Builtin => {
  const getArgument = (args: Value[], index: number) =>
    getBoolean([getThunk(args, index, name)()], 0, name);
  return {
    ...defineOperator(name, 2, (args) => compute(getArgument(args, 0), () => getArgument(args, 1))),
    evaluateBinary: undefined,
    isLazy: true,
  };
};

export const CORE_OPERATORS: Builtin[] = [
  defineConstant("TRUE", true),
  defineConstant("FALSE", false),
  defineConstant("BOOLEAN", BOOLEAN_SET),
  overrideWithJava(
    defineConstant("STRING", { kind: "InfiniteSet", name: "STRING" }),
    "public static tlc2.value.impl.Value tlc2.module.Strings.STRING()",
  ),
  defineBinary("=", isEqualLikeTlc),
  defineBinary("#", (left, right) => !isEqualLikeTlc(left, right)),
  defineOperator("~", 1, (args) => !getBoolean(args, 0, "~")),
  defineOperator("<=>", 2, (args) => getBoolean(args, 0, "<=>") === getBoolean(args, 1, "<=>")),
  defineShortCircuit("/\\", (left, right) => left && right()),
  defineShortCircuit("\\/", (left, right) => left || right()),
  defineShortCircuit("=>", (left, right) => !left || right()),
  defineOperator("\\in", 2, (args) =>
    isElementOf(getValue(args, 0, "\\in"), getValue(args, 1, "\\in")),
  ),
  defineOperator(
    "\\notin",
    2,
    (args) => !isElementOf(getValue(args, 0, "\\notin"), getValue(args, 1, "\\notin")),
  ),
  defineBinary("\\subseteq", (left, right) => {
    if (typeof left === "object" && left.kind === "Interval") return isIntervalSubset(left, right);
    if (!isSetValue(left)) {
      throw new TlaEvaluationError(`\\subseteq expects a set but received ${formatValue(left)}`);
    }
    const isPowerSets =
      typeof left === "object" &&
      left.kind === "Subset" &&
      typeof right === "object" &&
      right.kind === "Subset" &&
      isEnumerable(left.base);
    const streamed = isPowerSets ? left.base : left;
    const superset = isPowerSets ? right.base : right;
    return !someStreamedElement(streamed, (element) => !isElementOf(element, superset));
  }),
  ...SET_OPERATORS.map((operator) =>
    defineOperator(operator, 2, (args) => {
      const left = getValue(args, 0, operator);
      const right = getValue(args, 1, operator);
      const isFilteredByInterval =
        operator !== "\\cup" &&
        typeof right === "object" &&
        right.kind === "Interval" &&
        typeof left === "object" &&
        left.kind !== "Interval";
      if (
        isReducibleSet(left) &&
        isReducibleSet(right) &&
        !isMixedSet(left) &&
        !isMixedSet(right) &&
        !isFilteredByInterval &&
        (operator === "\\cup" || !hasTypedModelValues()) &&
        !isBeyondSetBound(left) &&
        !isBeyondSetBound(right)
      ) {
        if (operator === "\\cup" && isEmptySet(left)) return right;
        const merge =
          operator === "\\cup"
            ? getSortedUnion
            : operator === "\\cap"
              ? getSortedIntersection
              : getSortedDifference;
        return computeLikeTlcOnFailure(
          (finiteLeft, finiteRight) => {
            const leftSet = toFiniteSet(finiteLeft);
            const rightSet = toFiniteSet(finiteRight);
            const merged = merge(leftSet, rightSet);
            if (operator === "\\cup") {
              const written = getWrittenElements(leftSet);
              const added = getSortedDifference(rightSet, leftSet).elements;
              const isSorted =
                written === leftSet.elements &&
                (added.length === 0 || compareValues(written[written.length - 1], added[0]) < 0);
              if (written.length + added.length > getMaximumSetSize()) {
                throw new TlaSetBoundError(getSetBoundMessage());
              }
              if (isSorted && !leftSet.isNormalized) return merged;
              const union = merged === leftSet ? createSortedSet(merged.elements) : merged;
              if (!isSorted) union.writtenElements = [...written, ...added];
              return union;
            }
            if (merged === finiteLeft) return merged;
            merged.isNormalized = isNormalizedReducible(finiteLeft);
            if (leftSet.writtenElements && !leftSet.isNormalized) {
              merged.writtenElements = leftSet.writtenElements.filter((element) =>
                isElementOf(element, merged),
              );
            }
            return merged;
          },
          (reducibleLeft, reducibleRight) =>
            combineReducible(operator, reducibleLeft, reducibleRight),
          left,
          right,
        );
      }
      if (isReducibleSet(left)) return combineReducible(operator, left, right);
      if (operator !== "\\" && isReducibleSet(right))
        return combineReducible(operator, right, left);
      return markStreamedSet(createSetOperation(operator, left, right, undefined));
    }),
  ),
  defineOperator("SUBSET", 1, (args) => ({
    kind: "Subset",
    base: getValue(args, 0, "SUBSET"),
    cost: undefined,
  })),
  defineOperator("UNION", 1, (args) => {
    const outer = getValue(args, 0, "UNION");
    const written = isEnumeratedSet(outer) ? getWrittenElements(outer) : [];
    const sets = written.filter(isEnumeratedSet);
    if (!isEnumeratedSet(outer) || sets.length !== written.length) {
      return markStreamedSet(createUnion(outer, undefined));
    }
    const added = sets.flatMap(getWrittenElements);
    const getUnionLikeTlc = () => {
      const union: MixedSetValue = { kind: "MixedSet", elements: [] };
      added.forEach((member) => {
        if (!isElementOf(member, union)) addBoundedElement(union.elements, member);
      });
      return createEnumeratedSet(union.elements);
    };
    if (isMixedSet(outer) || sets.some(isMixedSet)) return getUnionLikeTlc();
    if (sets.length === 0) return EMPTY_SET;
    // eslint-disable-next-line unicorn/no-new-array
    const convertedSets = new Array<SetValue>(sets.length);
    for (let index = 0; index < sets.length; index++)
      convertedSets[index] = toFiniteSet(sets[index]);
    return computeLikeTlcOnFailure(
      (finiteSets: SetValue[]) =>
        createUnsortedCopy(getBalancedUnion(finiteSets, 0, finiteSets.length), added),
      getUnionLikeTlc,
      convertedSets,
      undefined,
    );
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
    checkJavaArity(
      defineBinary("..", (low, high) => {
        // TLC's MethodHandle casts the last argument first.
        const highNumber = getJavaInteger(high, dotDotSignature);
        return { kind: "Interval", low: getJavaInteger(low, dotDotSignature), high: highNumber };
      }),
      dotDotSignature,
    ),
  ];
};

const NATURALS_ARITHMETIC = createArithmeticOperators("Naturals");

const INTEGERS_ARITHMETIC = createArithmeticOperators("Integers");

export const getTraceSpecArithmetic = (builtin: Builtin) => {
  const index = NATURALS_ARITHMETIC.indexOf(builtin);
  return index === -1 ? undefined : INTEGERS_ARITHMETIC[index];
};

// Naturals#GEQ names itself > in its errors, and Integers#GT returns a BoolValue.
const createComparisonOperators = (module: string) => {
  const getSignature = (method: string, result = "tlc2.value.IBoolValue") =>
    `public static ${result} tlc2.module.${module}.${method}(tlc2.value.impl.Value,tlc2.value.impl.Value)`;
  const isIntegers = module === "Integers";
  return [
    overrideWithJava(
      defineComparison("<", (left, right) => left < right),
      getSignature("LT"),
    ),
    overrideWithJava(
      defineComparison(">", (left, right) => left > right),
      isIntegers ? getSignature("GT", "tlc2.value.impl.BoolValue") : getSignature("GT"),
    ),
    overrideWithJava(
      defineComparison("<=", (left, right) => left <= right),
      getSignature("LE"),
    ),
    overrideWithJava(
      defineComparison(">=", (left, right) => left >= right, isIntegers ? ">=" : ">"),
      getSignature("GEQ"),
    ),
  ];
};

const NAT = { kind: "InfiniteSet", name: "Nat" } as const;

const NATURALS_OPERATORS = [
  overrideWithJava(defineConstant("Nat", NAT), getJavaSignature("Naturals", "Nat", "Value", 0)),
  ...NATURALS_ARITHMETIC,
  ...createComparisonOperators("Naturals"),
];

const INTEGERS_OPERATORS = [
  overrideWithJava(defineConstant("Nat", NAT), getJavaSignature("Integers", "Nat", "Value", 0)),
  overrideWithJava(
    defineConstant("Int", { kind: "InfiniteSet", name: "Int" }),
    getJavaSignature("Integers", "Int", "Value", 0),
  ),
  ...INTEGERS_ARITHMETIC,
  ...createComparisonOperators("Integers"),
  checkJavaArity(
    defineOperator("-.", 1, (args) => {
      const value = getJavaInteger(getValue(args, 0, "-"), NEG_SIGNATURE);
      if (isOutOfRange(-value)) throw createOverflowError(`-${value}`);
      return -value;
    }),
    NEG_SIGNATURE,
  ),
];

const getSequenceArgument = (args: Value[], index: number, message: string) => {
  const value = getValue(args, index, message);
  const elements = getSequenceElements(value);
  if (!elements) throw new TlaModuleError(`${message}\n${prettyPrint(formatValue(value))}`);
  return elements;
};

const getSequenceOrString = (args: Value[], index: number, message: string) => {
  const value = getValue(args, index, message);
  return typeof value === "string" ? value : getSequenceArgument(args, index, message);
};

const getSubSeqIndex = (args: Value[], index: number, position: string) => {
  const value = getValue(args, index, "SubSeq");
  if (typeof value !== "number") {
    throw createModuleArgumentError(position, "SubSeq", "natural number", value);
  }
  return value;
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
        const kept =
          left.length === 0
            ? getValue(args, 1, "\\o")
            : right.length === 0
              ? getValue(args, 0, "\\o")
              : undefined;
        if (kept !== undefined && getFunctionClass(kept) === "tuple") return kept;
        return setCostModel(createTuple([...left, ...right]), getTupleCostModel(kept));
      }
      const right = getValue(args, 1, "\\o");
      if (typeof right !== "string") {
        throw new TlaModuleError(
          `${getEvaluatingMessage("t \\o s", "string")}\n${prettyPrint(formatValue(right))}`,
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
      const start = getSubSeqIndex(args, 1, "second");
      const end = getSubSeqIndex(args, 2, "third");
      if (start > end) return sliceSequence(sequence, 0, 0);
      const outOfDomain =
        start < 1 || start > sequence.length
          ? { position: "second", value: start }
          : end > sequence.length
            ? { position: "third", value: end }
            : undefined;
      if (outOfDomain) {
        throw new TlaModuleError(
          `The ${outOfDomain.position} argument of SubSeq must be in the domain of its first argument:\n${prettyPrint(formatValue(getValue(args, 0, "SubSeq")))}\n, but instead it is\n${outOfDomain.value}`,
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
                `The second argument of SelectSeq should be a boolean-valued operator, but instead it is:\n<Operator ${test.name}>`,
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
    defineOperator("IsFiniteSet", 1, (args) => isFiniteSet(getValue(args, 0, "IsFiniteSet"))),
    defineOperator("Cardinality", 1, (args) => {
      const set = getValue(args, 0, "Cardinality");
      if (
        !isSetValue(set) ||
        (typeof set === "object" && (set.kind === "InfiniteSet" || set.kind === "SequenceSet"))
      ) {
        throw new TlaModuleError(
          `Attempted to compute cardinality of the value\n${prettyPrint(formatValue(set))}`,
        );
      }
      return getCardinality(set, version);
    }),
  ]);

const TRANSITIVE_CLOSURE_OPERATORS = [
  overrideWithJava(
    defineOperator("Warshall", 1, (args) => {
      const relation = getValue(args, 0, "Warshall");
      if (!isSetValue(relation) || isOverriddenSet(relation)) {
        throw new TlaModuleError(
          `Applying TransitiveClosure to the following value,\nwhich is not an enumerable set:\n${prettyPrint(formatValue(relation))}`,
        );
      }
      // TLC sizes the relation, which normalizes it.
      getCardinality(relation);
      const nodes: Value[] = [];
      const nodeIndices = new Map<string, number>();
      const getNodeIndex = (node: Value) => {
        const key = getValueKey(node);
        const index = nodeIndices.get(key) ?? nodes.length;
        if (index === nodes.length) {
          nodeIndices.set(key, index);
          nodes.push(node);
        }
        return index;
      };
      const edges = toFiniteSet(relation).elements.map((edge) => {
        const ends = getSequenceElements(edge);
        if (ends?.length !== 2) {
          throw new TlaModuleError(
            `Attempted to apply TransitiveClosure to a set containing\nthe following value:\n${prettyPrint(formatValue(edge))}`,
          );
        }
        return [getNodeIndex(ends[0]), getNodeIndex(ends[1])];
      });
      const matrix = nodes.map(() => nodes.map(() => false));
      edges.forEach((edge) => {
        matrix[edge[0]][edge[1]] = true;
      });
      for (let middle = 0; middle < nodes.length; middle++) {
        for (let from = 0; from < nodes.length; from++) {
          if (!matrix[from][middle]) continue;
          for (let to = 0; to < nodes.length; to++) {
            if (matrix[middle][to]) matrix[from][to] = true;
          }
        }
      }
      return createEnumeratedSet(
        nodes.flatMap((from, fromIndex) =>
          nodes.flatMap((to, toIndex) =>
            matrix[fromIndex][toIndex] ? [createTuple([from, to])] : [],
          ),
        ),
      );
    }),
    "public static tlc2.value.impl.Value tlc2.module.TransitiveClosure.Warshall(tlc2.value.impl.Value)",
  ),
];

export const getJavaOverrides = (
  name: string,
  print: (text: string) => void,
  runtime: CheckerRuntime,
  files: FileSystem,
  evaluateReplaced: (name: string, args: Value[], context: Context | undefined) => Value,
  getVariableNames: () => string[],
) => {
  if (name === "TransitiveClosure") return TRANSITIVE_CLOSURE_OPERATORS;
  if (name === "AnySet") {
    return [
      overrideWithJava(
        defineConstant("ANY", ANY_SET),
        "public static tlc2.value.impl.Value tlc2.module.AnySet.ANY()",
      ),
    ];
  }
  if (name === "IOUtils") return createIoUtilsOperators(files, evaluateReplaced);
  if (name === "_TLCTrace") {
    return [...createTlcTraceOperators(files, getVariableNames), createTraceStateOperator(runtime)];
  }
  if (name === "_JsonTrace") return [createTraceStateOperator(runtime)];
  if (!getSanyStandardModules(runtime.version).has(name)) return undefined;
  const operators = getStandardOperators(name, print, runtime, files);
  return name === "Randomization" && operators
    ? [...operators, createRandomSubsetSet(runtime)]
    : operators;
};

export const STANDARD_DEPENDENCIES = new Map([
  ["Integers", ["Naturals"]],
  ["Sequences", ["Naturals"]],
  ["FiniteSets", ["Naturals", "Sequences"]],
  ["TLC", ["Naturals", "Sequences", "FiniteSets"]],
  ["_Possible", ["TLC", "TLCExt", "Naturals", "Sequences", "FiniteSets", "Integers"]],
  ["Json", ["Sequences", "FiniteSets", "TLC", "Naturals"]],
  ["TLCExt", ["TLC", "Integers", "Naturals", "Sequences", "FiniteSets"]],
]);

export const STANDARD_EXTENDS = new Map([["Integers", ["Naturals"]]]);

export const getStandardOperators = (
  name: string,
  print: (text: string) => void,
  runtime: CheckerRuntime,
  files: FileSystem,
): Builtin[] | undefined => {
  switch (name) {
    case "Naturals":
      return NATURALS_OPERATORS;
    case "Integers":
      return INTEGERS_OPERATORS;
    case "Sequences":
      return createSequencesOperators(runtime.version);
    case "FiniteSets":
      return createFiniteSetsOperators(runtime.version);
    case "TLC":
      return withJavaMethods("TLC", createTlcOperators(print, runtime));
    case "Randomization":
      return createRandomizationOperators(runtime);
    case "_Possible":
      return createPossibleOperators(print, runtime);
    case "Json":
      return createJsonOperators(files);
    case "Bags":
      return withJavaMethods("Bags", BAGS_OPERATORS);
    case "TLCExt":
      return withJavaMethods("TLCExt", createTlcExtOperators(runtime));
    default:
      return undefined;
  }
};
