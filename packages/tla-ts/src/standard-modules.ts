import { TlaEvaluationError, TlaUnsupportedError } from "./errors";
import type { Builtin, BuiltinArgument, Context, OperatorValue, State } from "./evaluate";
import {
  checkInteger,
  compareValues,
  createFunction,
  createRecord,
  createSet,
  createSortedFunction,
  createSortedSet,
  createTuple,
  findIndex,
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
  differenceSorted,
  intersectSorted,
  unionSorted,
  valuesEqual,
  type FunctionValue,
  type SetOperationValue,
  type SetValue,
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
const EMPTY_SET = createSortedSet([]);

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
  defineOperator("\\in", 2, (args) =>
    isElementOf(getValue(args, 0, "\\in"), getSet(args, 1, "\\in")),
  ),
  defineOperator(
    "\\notin",
    2,
    (args) => !isElementOf(getValue(args, 0, "\\notin"), getSet(args, 1, "\\notin")),
  ),
  defineOperator("\\subseteq", 2, (args) =>
    isSubsetOf(getElements(args, 0, "\\subseteq"), getSet(args, 1, "\\subseteq")),
  ),
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
      const set: Value = { kind: "SetOperation", operator, left, right };
      return isEnumerable(set) ? toFiniteSet(set) : set;
    }),
  ),
  defineOperator("SUBSET", 1, (args) => ({ kind: "Subset", base: getSet(args, 0, "SUBSET") })),
  defineOperator("UNION", 1, (args) =>
    getElements(args, 0, "UNION").reduce<SetValue>((union, element) => {
      if (!isSetValue(element)) {
        throw new TlaEvaluationError(
          `UNION expects a set of sets but found ${formatValue(element)}`,
        );
      }
      return unionSorted(union, toFiniteSet(element));
    }, EMPTY_SET),
  ),
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

const describeWrongValue = (name: string, expected: string, value: Value) =>
  `Applying ${name} to the following value, which is not ${expected}: ${formatValue(value)}`;

const describeWrongArgument = (position: string, name: string, expected: string, value: Value) =>
  `The ${position} argument of ${name} should be a ${expected}, but instead it is: ${formatValue(value)}`;

const toBag = (value: Value) => (isFunctionValue(value) ? toFiniteFunction(value) : undefined);

const getBag = (value: Value, message: string) => {
  const bag = toBag(value);
  if (!bag) throw new TlaEvaluationError(message);
  return bag;
};

const isBag = (bag: FunctionValue | undefined): bag is FunctionValue =>
  bag !== undefined && bag.range.every((count) => typeof count === "number" && count > 0);

const getEntries = (fn: FunctionValue) =>
  fn.domain.map((key, index): [Value, Value] => [key, fn.range[index]]);

const findCount = (element: Value, bag: FunctionValue) => {
  const index = findIndex(bag.domain, element);
  return index === -1 ? undefined : bag.range[index];
};

const addCounts = (left: Value, right: Value, name: string) => {
  const sum = toNumber(left, name) + toNumber(right, name);
  if (sum !== (sum | 0)) {
    throw new TlaEvaluationError(
      `Overflow when computing ${formatValue(left)}+${formatValue(right)}`,
    );
  }
  return sum;
};

const sumCounts = (entries: [Value, Value][], name: string) => {
  const sorted = [...entries].sort((left, right) => compareValues(left[0], right[0]));
  const domain: Value[] = [];
  const range: Value[] = [];
  sorted.forEach((entry) => {
    const last = domain.length - 1;
    if (last >= 0 && compareValues(domain[last], entry[0]) === 0) {
      range[last] = addCounts(range[last], entry[1], name);
      return;
    }
    domain.push(entry[0]);
    range.push(entry[1]);
  });
  return createSortedFunction(domain, range);
};

// TLC subtracts counts as Java ints, which wrap on overflow.
const subtractCounts = (count: Value, key: Value, bag: FunctionValue, name: string) => {
  const removed = findCount(key, bag);
  return removed === undefined
    ? toNumber(count, name)
    : (toNumber(count, name) - toNumber(removed, name)) | 0;
};

const EMPTY_BAG = createTuple([]);

const BAGS_OPERATORS: Builtin[] = [
  defineConstant("EmptyBag", EMPTY_BAG),
  defineOperator("IsABag", 1, (args) => isBag(toBag(getValue(args, 0, "IsABag")))),
  defineOperator("BagToSet", 1, (args) => {
    const value = getValue(args, 0, "BagToSet");
    return createSortedSet(
      getBag(value, describeWrongValue("BagToSet", "a function with a finite domain", value))
        .domain,
    );
  }),
  defineOperator("SetToBag", 1, (args) => {
    const set = getValue(args, 0, "SetToBag");
    if (!isSetValue(set) || !isEnumerable(set)) {
      throw new TlaEvaluationError(
        describeWrongValue("BagToSet", "a function with a finite domain", set),
      );
    }
    const elements = toFiniteSet(set).elements;
    return createSortedFunction(
      elements,
      elements.map(() => 1),
    );
  }),
  ...["BagIn", "CopiesIn"].map((name) =>
    defineOperator(name, 2, (args) => {
      const value = getValue(args, 1, name);
      const count = findCount(
        getValue(args, 0, name),
        getBag(value, describeWrongArgument("second", name, "bag", value)),
      );
      if (count === undefined) return name === "BagIn" ? false : 0;
      if (typeof count !== "number") {
        throw new TlaEvaluationError(describeWrongArgument("second", name, "bag", value));
      }
      return name === "BagIn" ? count > 0 : count;
    }),
  ),
  defineOperator("\\oplus", 2, (args) => {
    const left = getValue(args, 0, "(+)");
    const right = getValue(args, 1, "(+)");
    const leftBag = toBag(left);
    const rightBag = toBag(right);
    if (!isBag(leftBag)) {
      throw new TlaEvaluationError(describeWrongArgument("first", "(+)", "bag", left));
    }
    if (!isBag(rightBag)) {
      throw new TlaEvaluationError(describeWrongArgument("second", "(+)", "bag", right));
    }
    return sumCounts([...getEntries(leftBag), ...getEntries(rightBag)], "(+)");
  }),
  defineOperator("\\ominus", 2, (args) => {
    const left = getValue(args, 0, "(-)");
    const right = getValue(args, 1, "(-)");
    const leftBag = getBag(left, describeWrongArgument("first", "(-)", "bag", left));
    const rightBag = getBag(right, describeWrongArgument("second", "(-)", "bag", right));
    const remaining = getEntries(leftBag)
      .map((entry): [Value, number] => [
        entry[0],
        subtractCounts(entry[1], entry[0], rightBag, "(-)"),
      ])
      .filter((entry) => entry[1] > 0);
    return createSortedFunction(
      remaining.map((entry) => entry[0]),
      remaining.map((entry) => entry[1]),
    );
  }),
  defineOperator("BagUnion", 1, (args) => {
    const set = getValue(args, 0, "BagUnion");
    if (!isSetValue(set) || !isEnumerable(set)) {
      throw new TlaEvaluationError(describeWrongValue("BagUnion", "a finite enumerable set", set));
    }
    const elements = toFiniteSet(set).elements;
    if (elements.length < 2) return elements[0] ?? EMPTY_BAG;
    const bags = elements.map((element) =>
      getBag(
        element,
        `Attempted to apply BagUnion to the following set, whose element is not a bag: ${formatValue(set)}`,
      ),
    );
    return sumCounts(bags.flatMap(getEntries), "BagUnion");
  }),
  defineOperator("\\sqsubseteq", 2, (args) => {
    const left = getValue(args, 0, "\\sqsubseteq");
    const right = getValue(args, 1, "\\sqsubseteq");
    const leftBag = getBag(
      left,
      describeWrongValue("\\sqsubseteq", "a function with a finite domain", left),
    );
    const rightBag = getBag(
      right,
      describeWrongValue("\\sqsubseteq", "a function with a finite domain", right),
    );
    return getEntries(leftBag).every(
      (entry) => subtractCounts(entry[1], entry[0], rightBag, "\\sqsubseteq") <= 0,
    );
  }),
  defineOperator("SubBag", 1, (args) => {
    const value = getValue(args, 0, "SubBag");
    if (!isFunctionValue(value)) {
      throw new TlaEvaluationError(`DOMAIN expects a function but received ${formatValue(value)}`);
    }
    const bag = toFiniteFunction(value);
    const counts = bag.range.map((count) => toNumber(count, ">="));
    if (counts.some((count) => count < 1)) {
      throw new TlaEvaluationError(
        `Attempted to apply a function to ${formatValue(bag)}, which is not in its domain`,
      );
    }
    return createSet(
      bag.domain
        .reduce<[Value, Value][][]>(
          (subBags, key, index) =>
            subBags.flatMap((entries) => [
              entries,
              ...Array.from({ length: counts[index] }, (_, copies): [Value, Value][] => [
                ...entries,
                [key, copies + 1],
              ]),
            ]),
          [[]],
        )
        .map((entries) =>
          createSortedFunction(
            entries.map((entry) => entry[0]),
            entries.map((entry) => entry[1]),
          ),
        ),
    );
  }),
  defineHigherOrderOperator("BagOfAll", 2, (args) => {
    const operator = getOperator(args, 0, "BagOfAll");
    const value = getValue(args, 1, "BagOfAll");
    const bag = getBag(
      value,
      describeWrongArgument("second", "BagOfAll", "function with a finite domain", value),
    );
    return sumCounts(
      getEntries(bag).map((entry): [Value, Value] => [operator.call([entry[0]]), entry[1]]),
      "BagOfAll",
    );
  }),
  defineOperator("BagCardinality", 1, (args) => {
    const value = getValue(args, 0, "BagCardinality");
    return getBag(
      value,
      describeWrongValue("BagCardinality", "a function with a finite domain", value),
    ).range.reduce<number>((total, count) => {
      if (typeof count !== "number" || count <= 0) {
        throw new TlaEvaluationError(describeWrongValue("BagCardinality", "a bag", value));
      }
      return addCounts(total, count, "BagCardinality");
    }, 0);
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

export interface TlcStatistics {
  queue: number;
  distinct: number;
  initial: number;
  generated: number;
  diameter: number;
}

export interface TlcRuntime {
  print: (text: string) => void;
  checkDeadlock: boolean;
  getLevel: (state: State | undefined) => number;
  getStatistics: () => TlcStatistics;
  exit: () => void;
}

const UNKNOWN_ACTION = createRecord([
  ["name", "UnnamedAction"],
  [
    "location",
    createRecord([
      ["beginLine", 0],
      ["beginColumn", 0],
      ["endLine", 0],
      ["endColumn", 0],
      ["module", "--TLA+ BUILTINS--"],
    ]),
  ],
]);

const NAMED_REGISTER_PREFIX = "s:";

const PROPERTY_PREFIX = "-D";

const getRegisterValues = (registers: Map<Value, Value>) =>
  createFunction([...registers].map(([key, value]): [Value, Value] => [key, createTuple([value])]));

const createTlcGetSet = (runtime: TlcRuntime): Builtin[] => {
  const registers = new Map<Value, Value>();
  const namedRegisters = new Map<Value, Value>();
  const properties = new Map<string, string>();
  const startTime = Date.now();
  const getDuration = () => Math.floor((Date.now() - startTime) / 1000);
  const getNamedValue = (name: string, context: Context): Value => {
    switch (name) {
      case "diameter":
      case "generated":
      case "distinct":
      case "queue":
        return runtime.getStatistics()[name];
      case "duration":
        return getDuration();
      case "stats":
        return createRecord([
          ...Object.entries(runtime.getStatistics()),
          ["duration", getDuration()],
          ["worker", 0],
        ]);
      case "config":
        return createRecord([
          ["mode", "bfs"],
          ["deadlock", runtime.checkDeadlock],
          ["worker", 1],
          ["seed", "0"],
          ["fingerprint", "0"],
          ["install", ""],
        ]);
      case "level":
        return runtime.getLevel(context.state);
      case "action":
        return UNKNOWN_ACTION;
      case "all":
        return getRegisterValues(registers);
      case "all:named":
        return getRegisterValues(namedRegisters);
      case "spec":
      case "revision":
        throw new TlaUnsupportedError(`TLCGet("${name}") is not supported yet`);
    }
    const named = namedRegisters.get(name);
    if (named !== undefined) return named;
    if (name.startsWith(PROPERTY_PREFIX)) return properties.get(name) ?? name;
    throw new TlaEvaluationError(`TLCGet(${name}) was undefined.`);
  };
  return [
    {
      kind: "Builtin",
      name: "TLCGet",
      arity: 1,
      evaluate: (args, context) => {
        const key = getValue(args, 0, "TLCGet");
        if (typeof key === "string") return getNamedValue(key, context);
        if (typeof key !== "number" || key < 0) {
          throw new TlaEvaluationError(
            `The argument of TLCGet should be a nonnegative integer, but instead it is:\n${formatValue(key)}`,
          );
        }
        const value = registers.get(key);
        if (value === undefined) throw new TlaEvaluationError(`TLCGet(${key}) was undefined.`);
        return value;
      },
      evaluateUnary: undefined,
      evaluateBinary: undefined,
      isStateLevel: true,
    },
    {
      ...defineOperator("TLCSet", 2, (args) => {
        const key = getValue(args, 0, "TLCSet");
        const value = getValue(args, 1, "TLCSet");
        if (typeof key === "number" && key >= 0) {
          registers.set(key, value);
          return true;
        }
        if (key === "exit" && value === true) runtime.exit();
        if (key === "pause" && value === true) {
          throw new TlaUnsupportedError('TLCSet("pause", TRUE) is not supported');
        }
        if (key === "exit" || key === "pause") return true;
        if (typeof key === "string" && key.startsWith(NAMED_REGISTER_PREFIX)) {
          namedRegisters.set(key, value);
          return true;
        }
        if (typeof key === "string" && key.startsWith(PROPERTY_PREFIX)) {
          properties.set(key, formatValue(value));
          return true;
        }
        throw new TlaEvaluationError(
          `The first argument of TLCSet should be a nonnegative integer, but instead it is:\n${formatValue(key)}`,
        );
      }),
      isStateLevel: true,
    },
  ];
};

export const createTlcOperators = (runtime: TlcRuntime): Builtin[] => [
  defineOperator("Print", 2, (args) => {
    runtime.print(
      `${formatValue(getValue(args, 0, "Print"))}  ${formatValue(getValue(args, 1, "Print"))}`,
    );
    return getValue(args, 1, "Print");
  }),
  defineOperator("PrintT", 1, (args) => {
    runtime.print(formatValue(getValue(args, 0, "PrintT")));
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
  ...createTlcGetSet(runtime),
  defineOperator("Any", 0, () => {
    throw new TlaUnsupportedError("Any is not supported yet");
  }),
  defineOperator("RandomElement", 1, (args) => {
    const elements = getElements(args, 0, "RandomElement");
    if (elements.length === 0) throw new TlaEvaluationError("RandomElement of the empty set");
    return elements[0];
  }),
];

// TLC evaluates these TLA+ definitions rather than implementing real numbers. The text is TLC's
// Reals.tla, verbatim, so errors inside it point at the same lines as TLC's.
export const REALS_SOURCE = String.raw`-------------------------------- MODULE Reals -------------------------------
(***************************************************************************)
(* This module provides dummy definitions of the operators that are        *)
(* defined by the real Reals module.  It is expected that any tool that    *)
(* handles specifications that use real numbers will provide its own       *)
(* implementations of these operators.  TLC currently does not handle real *)
(* numbers and produces an error if a specification requires TLC to        *)
(* evaluate the operators defined here or to evaluate any operator defined *)
(* in the Integers module that is applied to non-integer real numbers.     *)
(*                                                                         *)
(* See the book "Specifying Systems" for the real Reals module.            *)
(***************************************************************************)
EXTENDS Integers

Real  == "Reals"
a / b == CHOOSE m \in Real : m * b = a
Infinity == CHOOSE i : (i \notin Real) /\ (\A r \in Real : i > r)
=============================================================================`;

export const getStandardModule = (
  name: string,
  tlcOperators: Builtin[],
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
    case "Bags":
      return { extends: [], operators: BAGS_OPERATORS };
    case "TLC":
      return { extends: [], operators: tlcOperators };
    default:
      return undefined;
  }
};
