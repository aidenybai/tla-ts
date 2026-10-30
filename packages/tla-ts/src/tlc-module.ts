import { TlaModuleError } from "./errors";
import { EXIT_STATUS } from "./exit-codes";
import type { Builtin, Context } from "./evaluate";
import { prettyPrint } from "./pretty-print";
import {
  defineConstant,
  defineHigherOrderOperator,
  defineLazyOperator,
  defineOperator,
  defineStateOperator,
  getElements,
  getEnumerableSet,
  getFunction,
  getOperator,
  getSequence,
  getThunk,
  getValue,
  overrideWithJava,
} from "./builtins";
import { getNamedRegisters, NAMED_REGISTER_PREFIX, type CheckerRuntime } from "./runtime";
import { createActionRecord, setTlcValue } from "./tlc-ext";
import { getRandomElement } from "./tlc-random";
import {
  ANY_SET,
  createFunction,
  createRecord,
  createSet,
  createTuple,
  createWrittenFunction,
  formatValue,
  getWrittenPairs,
  toFiniteSet,
  type Value,
  rankString,
} from "./values";

const padTime = (value: number) => String(value).padStart(2, "0");

const formatCalendarVersion = (date: Date) =>
  `${date.getUTCFullYear()}.${padTime(date.getUTCMonth() + 1)}.${padTime(date.getUTCDate())}.${padTime(date.getUTCHours())}${padTime(date.getUTCMinutes())}${padTime(date.getUTCSeconds())}`;

const getRegisterFunction = <Key extends Value>(registers: Map<Key, Value>) =>
  createFunction([...registers].map(([key, value]): [Value, Value] => [key, createTuple([value])]));

// TLC creates its model checker after it processes the spec, so these are undefined before then.
const CHECKER_KEYS = new Set(["diameter", "generated", "distinct", "queue", "stats", "config"]);
// The keys of TLC 1.7.4's TLCGet, and those it can't read before it creates its model checker.
const TLC_174_KEYS = new Set(["diameter", "distinct", "queue", "duration", "level"]);
const CHECKER_KEYS_174 = new Set(["diameter", "distinct", "queue", "level"]);

const getRuntimeValue = (
  runtime: CheckerRuntime,
  key: string,
  state: (Value | undefined)[] | undefined,
) => {
  const is174 = runtime.version === "1.7.4";
  const isUndefined = is174
    ? !TLC_174_KEYS.has(key) || (!runtime.isStarted && CHECKER_KEYS_174.has(key))
    : !runtime.isStarted && CHECKER_KEYS.has(key);
  if (isUndefined) throw new TlaModuleError(`TLCGet(${key}) was undefined.`);
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
        ["seed", String(runtime.seed)],
        ["fingerprint", "0"],
        ["install", "unknown"],
      ]);
    case "revision": {
      const now = new Date();
      return createRecord([
        ["count", 0],
        ["timestamp", Math.floor(now.getTime() / 1000)],
        ["date", rankString(`${now.toISOString().slice(0, 19)}.${now.getUTCMilliseconds()}Z`)],
        ["tag", "development"],
        ["calver", rankString(formatCalendarVersion(new Date(runtime.startedAt)))],
      ]);
    }
    case "spec":
      return runtime.getSpecification();
    case "action":
      return createActionRecord(undefined);
    case "all":
      return getRegisterFunction(runtime.registers);
    case "all:named":
      return getRegisterFunction(getNamedRegisters(runtime));
  }
  if (key.startsWith(NAMED_REGISTER_PREFIX)) {
    const value = getNamedRegisters(runtime).get(key);
    if (value === undefined) throw new TlaModuleError(`TLCGet(${key}) was undefined.`);
    return value;
  }
  if (key.startsWith("-D")) return rankString(runtime.properties.get(key.slice(2)) ?? key);
  throw new TlaModuleError(`TLCGet(${key}) was undefined.`);
};

const getTlcValue = (runtime: CheckerRuntime, key: Value, context: Context | undefined) => {
  if (typeof key === "number" && key >= 0) {
    const value = runtime.registers.get(key);
    if (value === undefined) throw new TlaModuleError(`TLCGet(${key}) was undefined.`);
    return value;
  }
  if (typeof key !== "string") {
    throw new TlaModuleError(
      `The argument of TLCGet should be a nonnegative integer, but instead it is:\n${formatValue(key)}`,
    );
  }
  return getRuntimeValue(runtime, key, context?.state);
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

// TLC sorts the value of a TLCEval argument that it caches, with every value inside it.
const normalizeDeeply = (value: Value): void => {
  if (typeof value !== "object") return;
  if (value.kind === "Set" || value.kind === "MixedSet") {
    toFiniteSet(value).elements.forEach(normalizeDeeply);
  }
  if (value.kind === "Function") value.range.forEach(normalizeDeeply);
};

export const createTlcOperators = (
  print: (text: string) => void,
  runtime: CheckerRuntime,
): Builtin[] => [
  defineOperator("Print", 2, (args) => {
    print(
      `${prettyPrint(formatValue(getValue(args, 0, "Print"), true, true))}  ${prettyPrint(formatValue(getValue(args, 1, "Print"), true, true))}`,
    );
    return getValue(args, 1, "Print");
  }),
  defineOperator("PrintT", 1, (args) => {
    print(prettyPrint(formatValue(getValue(args, 0, "PrintT"), true, true)));
    return true;
  }),
  defineOperator("Assert", 2, (args) => {
    if (getValue(args, 0, "Assert") !== true) {
      throw new TlaModuleError(
        `The first argument of Assert evaluated to FALSE; the second argument was:\n${prettyPrint(formatValue(getValue(args, 1, "Assert")))}`,
        EXIT_STATUS.assertViolation,
      );
    }
    return true;
  }),
  defineOperator("JavaTime", 0, () => Math.floor(Date.now() / 1000) & 0x7fffffff),
  defineOperator(":>", 2, (args) =>
    createFunction([[getValue(args, 0, ":>"), getValue(args, 1, ":>")]]),
  ),
  defineOperator("@@", 2, (args) => {
    const left = getFunction(args, 0, "@@");
    const right = getFunction(args, 1, "@@");
    return createWrittenFunction([...getWrittenPairs(left), ...getWrittenPairs(right)]);
  }),
  defineOperator("ToString", 1, (args) =>
    rankString(formatValue(getValue(args, 0, "ToString"), true)),
  ),
  defineOperator("TLCEval", 1, (args) => {
    const value = getValue(args, 0, "TLCEval");
    normalizeDeeply(value);
    return value;
  }),
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
  // TLC evaluates TLCGet with its argument in TLCGetSet.TLCGetEval, so it reports any failure,
  // the argument's too, as a failure of that method. TLC 1.7.4 calls TLC.TLCGet with the value of
  // its argument.
  runtime.version === "1.7.4"
    ? overrideWithJava(
        {
          ...defineStateOperator("TLCGet", 1, (args, context) =>
            getTlcValue(runtime, getValue(args, 0, "TLCGet"), context),
          ),
          // Unlike TLCGetSet.TLCGetEval, TLC.TLCGet declares no minimum level.
          isLevelConstant: true,
        },
        "public static tlc2.value.impl.Value tlc2.module.TLC.TLCGet(tlc2.value.impl.Value)",
      )
    : overrideWithJava(
        defineLazyOperator("TLCGet", 1, (args, context) =>
          getTlcValue(runtime, getThunk(args, 0, "TLCGet")(), context),
        ),
        "public static tlc2.value.impl.Value tlc2.module.TLCGetSet.TLCGetEval(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel)",
      ),
  defineStateOperator("TLCSet", 2, (args) => {
    const key = getValue(args, 0, "TLCSet");
    setTlcValue(runtime, print, key, getValue(args, 1, "TLCSet"));
    return true;
  }),
  defineConstant("Any", ANY_SET),
  defineOperator("RandomElement", 1, (args) =>
    getRandomElement(getEnumerableSet(args, 0, "RandomElement"), runtime.getRandom()),
  ),
];
