import { TlaEvaluationError } from "./errors";
import type { Builtin } from "./evaluate";
import {
  defineConstant,
  defineHigherOrderOperator,
  defineOperator,
  defineStateOperator,
  getElements,
  getOperator,
  getSequence,
  getValue,
} from "./builtins";
import { getNamedRegisters, NAMED_REGISTER_PREFIX, type CheckerRuntime } from "./runtime";
import {
  ANY_SET,
  createFunction,
  createRecord,
  createSet,
  createTuple,
  formatValue,
  toFiniteFunction,
  type Value,
} from "./values";

const createLocationRecord = () =>
  createRecord([
    ["beginLine", 0],
    ["beginColumn", 0],
    ["endLine", 0],
    ["endColumn", 0],
    ["module", "--unknown--"],
  ]);

const getRegisterFunction = <Key extends Value>(registers: Map<Key, Value>) =>
  createFunction([...registers].map(([key, value]): [Value, Value] => [key, createTuple([value])]));

const getRuntimeValue = (
  runtime: CheckerRuntime,
  key: string,
  state: (Value | undefined)[] | undefined,
): Value => {
  const duration = Math.floor((Date.now() - runtime.startedAt) / 1000);
  switch (key) {
    case "level":
      return state === undefined ? 0 : runtime.getLevel(state);
    case "diameter":
      return runtime.diameter;
    case "generated":
      return runtime.generatedStates;
    case "distinct":
      return runtime.distinctStates;
    case "queue":
      return runtime.queueSize;
    case "duration":
      return duration;
    case "stats":
      return createRecord([
        ["queue", runtime.queueSize],
        ["distinct", runtime.distinctStates],
        ["initial", runtime.initialStates],
        ["generated", runtime.generatedStates],
        ["diameter", runtime.diameter],
        ["duration", duration],
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
    case "revision":
      return createRecord([
        ["count", 0],
        ["timestamp", 0],
        ["date", "1970-01-01T00:00:00.0Z"],
        ["tag", "tla-ts"],
        ["calver", "0"],
      ]);
    case "action":
      return createRecord([
        ["name", "UnnamedAction"],
        ["location", createLocationRecord()],
      ]);
    case "all":
      return getRegisterFunction(runtime.registers);
    case "all:named":
      return getRegisterFunction(getNamedRegisters(runtime));
  }
  if (key.startsWith(NAMED_REGISTER_PREFIX)) {
    const value = getNamedRegisters(runtime).get(key);
    if (value === undefined) throw new TlaEvaluationError(`TLCGet(${key}) was undefined.`);
    return value;
  }
  if (key.startsWith("-D")) return runtime.properties.get(key.slice(2)) ?? key;
  throw new TlaEvaluationError(`TLCGet(${key}) was undefined.`);
};

const getPermutations = (elements: Value[]): Value[][] =>
  elements.length === 0
    ? [[]]
    : elements.flatMap((element, index) =>
        getPermutations([...elements.slice(0, index), ...elements.slice(index + 1)]).map((rest) => [
          element,
          ...rest,
        ]),
      );

export const createTlcOperators = (
  print: (text: string) => void,
  runtime: CheckerRuntime,
): Builtin[] => [
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
        `The first argument of Assert evaluated to FALSE; the second argument was:\n${formatValue(getValue(args, 1, "Assert"))}`,
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
  defineStateOperator("TLCGet", 1, (args, context) => {
    const key = getValue(args, 0, "TLCGet");
    if (typeof key === "number" && key >= 0) {
      const value = runtime.registers.get(key);
      if (value === undefined) throw new TlaEvaluationError(`TLCGet(${key}) was undefined.`);
      return value;
    }
    if (typeof key !== "string") {
      throw new TlaEvaluationError(
        `The argument of TLCGet should be a nonnegative integer, but instead it is:\n${formatValue(key)}`,
      );
    }
    return getRuntimeValue(runtime, key, context?.state);
  }),
  defineStateOperator("TLCSet", 2, (args) => {
    const key = getValue(args, 0, "TLCSet");
    const value = getValue(args, 1, "TLCSet");
    if (typeof key === "number" && key >= 0) {
      runtime.registers.set(key, value);
      return true;
    }
    if (key === "exit") {
      if (value === true) runtime.isStopped = true;
      return true;
    }
    if (key === "pause") return true;
    if (typeof key === "string" && key.startsWith(NAMED_REGISTER_PREFIX)) {
      runtime.namedRegisters.set(key, value);
      return true;
    }
    if (typeof key === "string" && key.startsWith("-D")) {
      runtime.properties.set(key.slice(2), formatValue(value));
      return true;
    }
    throw new TlaEvaluationError(
      `The first argument of TLCSet should be a nonnegative integer, but instead it is:\n${formatValue(key)}`,
    );
  }),
  defineConstant("Any", ANY_SET),
  defineOperator("RandomElement", 1, (args) => {
    const elements = getElements(args, 0, "RandomElement");
    if (elements.length === 0) throw new TlaEvaluationError("RandomElement of the empty set");
    return elements[Math.floor(runtime.random() * elements.length)];
  }),
];
