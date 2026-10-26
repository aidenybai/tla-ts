import { TlaEvaluationError, TlaUnsupportedError } from "./errors";
import type { Builtin, BuiltinArgument, OperatorValue } from "./evaluate";
import {
  checkInteger,
  createFunction,
  createSet,
  createTuple,
  formatValue,
  getCardinality,
  getDomain,
  getSequenceElements,
  isElementOf,
  isEnumerable,
  isFunctionValue,
  isSetValue,
  toFiniteFunction,
  toFiniteSet,
  unionSorted,
  valuesEqual,
  type SetOperationValue,
  type Value,
} from "./values";

interface StandardModule {
  extends: string[];
  operators: Builtin[];
}

const isOperatorValue = (argument: BuiltinArgument): argument is OperatorValue =>
  typeof argument === "object" && argument.kind === "Operator";

const getValue = (args: BuiltinArgument[], index: number, name: string): Value => {
  const argument = args[index];
  if (argument === undefined || isOperatorValue(argument)) {
    throw new TlaEvaluationError(`${name} expects a value as argument ${index + 1}`);
  }
  return argument;
};

const getNumber = (args: BuiltinArgument[], index: number, name: string) => {
  const value = getValue(args, index, name);
  if (typeof value !== "number") {
    throw new TlaEvaluationError(`${name} expects an integer but received ${formatValue(value)}`);
  }
  return value;
};

const getBoolean = (args: BuiltinArgument[], index: number, name: string) => {
  const value = getValue(args, index, name);
  if (typeof value !== "boolean") {
    throw new TlaEvaluationError(`${name} expects a boolean but received ${formatValue(value)}`);
  }
  return value;
};

const getSet = (args: BuiltinArgument[], index: number, name: string) => {
  const value = getValue(args, index, name);
  if (!isSetValue(value))
    throw new TlaEvaluationError(`${name} expects a set but received ${formatValue(value)}`);
  return value;
};

const getFiniteSet = (args: BuiltinArgument[], index: number, name: string) => {
  const set = getSet(args, index, name);
  if (!isEnumerable(set)) {
    throw new TlaEvaluationError(
      `${name} cannot enumerate the non-enumerable set ${formatValue(set)}`,
    );
  }
  return toFiniteSet(set);
};

const getElements = (args: BuiltinArgument[], index: number, name: string) =>
  getFiniteSet(args, index, name).elements;

const getSequence = (args: BuiltinArgument[], index: number, name: string) => {
  const value = getValue(args, index, name);
  const elements = getSequenceElements(value);
  if (!elements)
    throw new TlaEvaluationError(`${name} expects a sequence but received ${formatValue(value)}`);
  return elements;
};

const getOperator = (args: BuiltinArgument[], index: number, name: string) => {
  const argument = args[index];
  if (argument === undefined || !isOperatorValue(argument)) {
    throw new TlaEvaluationError(`${name} expects an operator as argument ${index + 1}`);
  }
  return argument;
};

const defineConstant = (name: string, value: Value): Builtin => ({
  kind: "Builtin",
  name,
  arity: 0,
  evaluate: () => value,
  evaluateUnary: undefined,
  evaluateBinary: undefined,
});

const defineOperator = (
  name: string,
  arity: number,
  evaluate: (args: BuiltinArgument[]) => Value,
): Builtin => ({
  kind: "Builtin",
  name,
  arity,
  evaluate,
  evaluateUnary: arity === 1 ? (value) => evaluate([value]) : undefined,
  evaluateBinary: arity === 2 ? (left, right) => evaluate([left, right]) : undefined,
});

const defineHigherOrderOperator = (
  name: string,
  arity: number,
  evaluate: (args: BuiltinArgument[]) => Value,
): Builtin => ({
  kind: "Builtin",
  name,
  arity,
  evaluate,
  evaluateUnary: undefined,
  evaluateBinary: undefined,
});

const toNumber = (value: Value, name: string) => {
  if (typeof value !== "number") {
    throw new TlaEvaluationError(`${name} expects an integer but received ${formatValue(value)}`);
  }
  return value;
};

const defineBinary = (name: string, compute: (left: Value, right: Value) => Value): Builtin => ({
  kind: "Builtin",
  name,
  arity: 2,
  evaluate: (args) => compute(getValue(args, 0, name), getValue(args, 1, name)),
  evaluateUnary: undefined,
  evaluateBinary: compute,
});

const defineArithmetic = (name: string, compute: (left: number, right: number) => number) =>
  defineBinary(name, (left, right) =>
    checkInteger(compute(toNumber(left, name), toNumber(right, name))),
  );

const defineComparison = (name: string, compare: (left: number, right: number) => boolean) =>
  defineBinary(name, (left, right) => compare(toNumber(left, name), toNumber(right, name)));

const isSubsetOf = (left: Value[], right: Value) =>
  left.every((element) => isElementOf(element, right));

const BOOLEAN_SET = createSet([false, true]);

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
      if (operator === "\\cup" && isEnumerable(left) && isEnumerable(right)) {
        return unionSorted(toFiniteSet(left), toFiniteSet(right));
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
      return createSet(sets.flatMap((element) => toFiniteSet(element).elements));
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
      throw new TlaEvaluationError(`${base}^${exponent} is undefined`);
    }
    return base ** exponent;
  }),
  defineArithmetic("\\div", (left, right) => {
    if (right === 0) throw new TlaEvaluationError(`Division by zero in ${left} \\div 0`);
    return Math.floor(left / right);
  }),
  defineArithmetic("%", (left, right) => {
    if (right <= 0)
      throw new TlaEvaluationError(`The second argument of % must be positive, but was ${right}`);
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
      throw new TlaEvaluationError("\\o cannot concatenate a string with a sequence");
    }
    return createTuple([...left, ...right]);
  }),
  defineOperator("Append", 2, (args) =>
    createTuple([...getSequence(args, 0, "Append"), getValue(args, 1, "Append")]),
  ),
  defineOperator("Head", 1, (args) => {
    const elements = getSequence(args, 0, "Head");
    if (elements.length === 0)
      throw new TlaEvaluationError("Attempted to apply Head to the empty sequence");
    return elements[0];
  }),
  defineOperator("Tail", 1, (args) => {
    const sequence = getSequenceOrString(args, 0, "Tail");
    if (sequence.length === 0)
      throw new TlaEvaluationError("Attempted to apply Tail to the empty sequence");
    return typeof sequence === "string" ? sequence.slice(1) : createTuple(sequence.slice(1));
  }),
  defineOperator("SubSeq", 3, (args) => {
    const sequence = getSequenceOrString(args, 0, "SubSeq");
    const start = getNumber(args, 1, "SubSeq");
    const end = getNumber(args, 2, "SubSeq");
    if (start > end) return typeof sequence === "string" ? "" : createTuple([]);
    if (start < 1 || end > sequence.length) {
      throw new TlaEvaluationError(
        `SubSeq bounds ${start}..${end} are outside 1..${sequence.length}`,
      );
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
          throw new TlaEvaluationError("The test of SelectSeq must return a boolean");
        return result;
      }),
    );
  }),
];

const FINITE_SETS_OPERATORS: Builtin[] = [
  defineOperator("IsFiniteSet", 1, (args) => isEnumerable(getSet(args, 0, "IsFiniteSet"))),
  defineOperator("Cardinality", 1, (args) => {
    const set = getSet(args, 0, "Cardinality");
    if (!isEnumerable(set))
      throw new TlaEvaluationError(`Cardinality of the infinite set ${formatValue(set)}`);
    return getCardinality(set);
  }),
];

const getPermutations = (elements: Value[]): Value[][] =>
  elements.length === 0
    ? [[]]
    : elements.flatMap((element, index) =>
        getPermutations([...elements.slice(0, index), ...elements.slice(index + 1)]).map((rest) => [
          element,
          ...rest,
        ]),
      );

export const createTlcOperators = (print: (text: string) => void): Builtin[] => [
  defineOperator("Print", 2, (args) => {
    print(
      `${formatValue(getValue(args, 0, "Print"), true)}  ${formatValue(getValue(args, 1, "Print"), true)}`,
    );
    return getValue(args, 1, "Print");
  }),
  defineOperator("PrintT", 1, (args) => {
    print(formatValue(getValue(args, 0, "PrintT"), true));
    return true;
  }),
  defineOperator("Assert", 2, (args) => {
    if (getValue(args, 0, "Assert") !== true) {
      throw new TlaEvaluationError(
        `The first argument of Assert evaluated to FALSE; the second argument was: ${formatValue(getValue(args, 1, "Assert"))}`,
      );
    }
    return true;
  }),
  defineOperator("JavaTime", 0, () => Math.floor(Date.now() / 1000) & 0x7fffffff),
  defineOperator(":>", 2, (args) =>
    createFunction([[getValue(args, 0, ":>"), getValue(args, 1, ":>")]]),
  ),
  defineOperator("@@", 2, (args) => {
    const left = toFiniteFunction(getValue(args, 0, "@@"));
    const right = toFiniteFunction(getValue(args, 1, "@@"));
    return createFunction([
      ...left.domain.map((key, index): [Value, Value] => [key, left.range[index]]),
      ...right.domain.map((key, index): [Value, Value] => [key, right.range[index]]),
    ]);
  }),
  defineOperator("ToString", 1, (args) => formatValue(getValue(args, 0, "ToString"))),
  defineOperator("TLCEval", 1, (args) => getValue(args, 0, "TLCEval")),
  defineOperator("Permutations", 1, (args) => {
    const elements = getElements(args, 0, "Permutations");
    return createSet(
      getPermutations(elements).map((permutation) =>
        createFunction(
          elements.map((element, index): [Value, Value] => [element, permutation[index]]),
        ),
      ),
    );
  }),
  defineHigherOrderOperator("SortSeq", 2, (args) => {
    const precedes = getOperator(args, 1, "SortSeq");
    return createTuple(
      getSequence(args, 0, "SortSeq").reduce<Value[]>((sorted, element) => {
        const position = sorted.findIndex(
          (existing) => precedes.call([element, existing]) === true,
        );
        return position === -1
          ? [...sorted, element]
          : [...sorted.slice(0, position), element, ...sorted.slice(position)];
      }, []),
    );
  }),
  ...[
    { name: "TLCGet", arity: 1 },
    { name: "TLCSet", arity: 2 },
    { name: "Any", arity: 0 },
  ].map((operator): Builtin => ({
    ...defineOperator(operator.name, operator.arity, () => {
      throw new TlaUnsupportedError(`${operator.name} is not supported yet`);
    }),
    isStateLevel: operator.name !== "Any",
  })),
  defineOperator("RandomElement", 1, (args) => {
    const elements = getElements(args, 0, "RandomElement");
    if (elements.length === 0) throw new TlaEvaluationError("RandomElement of the empty set");
    return elements[0];
  }),
];

export const getStandardModule = (
  name: string,
  print: (text: string) => void,
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
      return { extends: [], operators: createTlcOperators(print) };
    default:
      return undefined;
  }
};
