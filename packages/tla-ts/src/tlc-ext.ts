import {
  defineConstant,
  defineHigherOrderOperator,
  defineLazyOperator,
  defineOperator,
  defineStateOperator,
  getOperator,
  getThunk,
  getValue,
} from "./builtins";
import { TlaEvaluationError } from "./errors";
import { evaluate, getDefinition, type Builtin, type Environment } from "./evaluate";
import {
  getNamedRegisters,
  getPossibleCounts,
  NAMED_REGISTER_PREFIX,
  type CheckerRuntime,
} from "./runtime";
import {
  applyFunction,
  createRecord,
  createSet,
  createTuple,
  formatValue,
  getSequenceElements,
  getValueHash,
  toFiniteSet,
  valuesEqual,
  type Value,
} from "./values";

const EMPTY_COUNTER_EXAMPLE = createRecord([
  ["action", createSet([])],
  ["state", createSet([])],
]);

const getRegister = (runtime: CheckerRuntime, key: Value) => {
  if (typeof key === "number") return runtime.registers.get(key);
  if (typeof key === "string" && key.startsWith(NAMED_REGISTER_PREFIX)) {
    return getNamedRegisters(runtime).get(key);
  }
  return undefined;
};

const setRegister = (runtime: CheckerRuntime, key: Value, value: Value) => {
  if (typeof key === "number" && key >= 0) {
    runtime.registers.set(key, value);
    return;
  }
  if (typeof key === "string" && key.startsWith(NAMED_REGISTER_PREFIX)) {
    runtime.namedRegisters.set(key, value);
    return;
  }
  throw new TlaEvaluationError(
    `The first argument of TLCSet should be a nonnegative integer, but instead it is:\n${formatValue(key)}`,
  );
};

const isCompleteState = (state: (Value | undefined)[]): state is Value[] =>
  state.every((value) => value !== undefined);

const toStateRecord = (state: Value[], environment: Environment) =>
  createRecord(environment.variables.map((name, index): [string, Value] => [name, state[index]]));

export const createTlcExtOperators = (
  print: (text: string) => void,
  runtime: CheckerRuntime,
): Builtin[] => [
  defineOperator("AssertEq", 2, (args) => {
    const left = getValue(args, 0, "AssertEq");
    const right = getValue(args, 1, "AssertEq");
    const isEqual = valuesEqual(left, right);
    if (!isEqual) {
      print("Assertion failed");
      print(formatValue(left, true));
      print(formatValue(right, true));
    }
    return isEqual;
  }),
  defineLazyOperator("AssertError", 2, (args) => {
    const expected = getThunk(args, 0, "AssertError")();
    try {
      getThunk(args, 1, "AssertError")();
    } catch (error) {
      if (error instanceof TlaEvaluationError) return error.message === expected;
      throw error;
    }
    return false;
  }),
  defineStateOperator("TLCGetOrDefault", 2, (args) => {
    const key = getValue(args, 0, "TLCGetOrDefault");
    return getRegister(runtime, key) ?? getValue(args, 1, "TLCGetOrDefault");
  }),
  {
    ...defineHigherOrderOperator("TLCGetAndSet", 4, (args) => {
      const key = getValue(args, 0, "TLCGetAndSet");
      const previous = getRegister(runtime, key) ?? getValue(args, 3, "TLCGetAndSet");
      const update = getOperator(args, 1, "TLCGetAndSet");
      setRegister(runtime, key, update.call([previous, getValue(args, 2, "TLCGetAndSet")]));
      return previous;
    }),
    isStateLevel: true,
  },
  defineStateOperator("Trace", 0, (_, context) => {
    const state = context?.state;
    if (!state || !isCompleteState(state)) {
      throw new TlaEvaluationError(
        "In evaluating TLCExt!Trace, the state is not completely specified yet",
      );
    }
    return createTuple(
      runtime.getBehavior(state).map((step) => toStateRecord(step, context.environment)),
    );
  }),
  defineConstant("CounterExample", EMPTY_COUNTER_EXAMPLE),
  defineOperator("ToTrace", 1, (args) => {
    const counterExample = getValue(args, 0, "ToTrace");
    const states = toFiniteSet(applyFunction(counterExample, "state")).elements.map(
      (pair) => getSequenceElements(pair) ?? [],
    );
    return createTuple(
      [...states].sort((left, right) => Number(left[0]) - Number(right[0])).map((pair) => pair[1]),
    );
  }),
  defineOperator("TLCModelValue", 1, (args) => {
    const name = getValue(args, 0, "TLCModelValue");
    if (typeof name !== "string") {
      throw new TlaEvaluationError(
        `The argument of ModelValue should be a string, but instead it is:\n${formatValue(name)}`,
      );
    }
    return { kind: "ModelValue", name };
  }),
  defineLazyOperator("TLCDefer", 1, (args) => {
    getThunk(args, 0, "TLCDefer")();
    return true;
  }),
  defineOperator("TLCNoOp", 1, (args) => getValue(args, 0, "TLCNoOp")),
  defineLazyOperator("PickSuccessor", 1, (args, context) => {
    if (getThunk(args, 0, "PickSuccessor")() === true) return true;
    const next = context?.next;
    if (!next || !isCompleteState(next)) return true;
    throw new TlaEvaluationError("PickSuccessor needs interactive input to extend the behavior");
  }),
  defineOperator("TLCCache", 2, (args) => getValue(args, 0, "TLCCache")),
  defineOperator("TLCFP", 1, (args) => getValueHash(getValue(args, 0, "TLCFP")) | 0),
  defineStateOperator("TLCEvalDefinition", 1, (args, context) => {
    const name = getValue(args, 0, "TLCEvalDefinition");
    const definition =
      typeof name === "string" && context ? getDefinition(name, context.environment) : undefined;
    if (!definition || typeof name !== "string" || !context) {
      throw new TlaEvaluationError(
        `The argument of TLCEvalDefinition should be a name of a definition reachable from the root module, but instead it is:\n${formatValue(name)}`,
      );
    }
    if (definition.kind === "Operator" && definition.params.length > 0) {
      throw new TlaEvaluationError(
        `The argument of TLCEvalDefinition should be a zero-arity definition, but instead it is:\n${name}`,
      );
    }
    return evaluate({ kind: "Identifier", name, location: definition.location }, context);
  }),
];

export const createPossibleOperators = (
  print: (text: string) => void,
  runtime: CheckerRuntime,
): Builtin[] => [
  defineStateOperator("_Track", 2, (args) => {
    const name = getValue(args, 1, "_Track");
    const count = runtime.possibleCounts.get(String(name)) ?? 0;
    runtime.possibleCounts.set(
      String(name),
      getValue(args, 0, "_Track") === true ? count + 1 : count,
    );
    return true;
  }),
  defineStateOperator("_Counts", 0, () => getPossibleCounts(runtime)),
  defineStateOperator("_CheckName", 1, (args) => {
    const name = String(getValue(args, 0, "_CheckName"));
    if (runtime.possibleCounts.get(name)) return true;
    print(formatValue(getPossibleCounts(runtime), true));
    return false;
  }),
  defineStateOperator("_PrintCounts", 0, () => {
    print(formatValue(getPossibleCounts(runtime), true));
    return true;
  }),
];
