import {
  defineLazyOperator,
  defineOperator,
  defineStateOperator,
  getKindString,
  getOperator,
  getThunk,
  getValue,
} from "../builtins";
import {
  TlaEvaluationError,
  TlaModuleError,
  TlaNullPointerError,
  TlaUnsupportedError,
} from "../errors";
import { getTlcFingerprint } from "./fingerprint";
import { formatNestedMessage } from "./messages";
import {
  describeRange,
  evaluate,
  getDefinition,
  type Builtin,
  type Environment,
} from "../evaluate";
import { getChildren, isLocallyResolved, type Definition, type Expression } from "../ast";
import { ACTION_LEVEL, CONSTANT_LEVEL, VARIABLE_LEVEL } from "../levels";
import {
  getNamedRegisters,
  getPossibleCounts,
  NAMED_REGISTER_PREFIX,
  type CheckerRuntime,
} from "../runtime";
import {
  applyFunction,
  createModelValue,
  createRecord,
  createSet,
  createTuple,
  formatValue,
  getFingerprintError,
  getSequenceElements,
  getValueKey,
  toFiniteSet,
  type Value,
} from "../values";

export const createActionRecord = (action: string | undefined) =>
  createRecord([
    ["name", action ?? "UnnamedAction"],
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

// TLC's CounterExample is its own class, so ToTrace refuses a record that only looks like one.
const counterExamples = new WeakSet<Value & object>();

const createCounterExampleRecord = (action: Value[], states: Value[]) => {
  const counterExample = createRecord([
    ["action", createSet(action)],
    ["state", createSet(states)],
  ]);
  counterExamples.add(counterExample);
  return counterExample;
};

export const createCounterExample = (
  stateRecords: Record<string, Value>[],
  actions: Value[],
  loop: { start: number; action: Value } | undefined,
) => {
  const states = stateRecords.map((state, index) =>
    createTuple([index + 1, createRecord(Object.entries(state))]),
  );
  const steps = states
    .slice(1)
    .map((state, index) => createTuple([states[index], actions[index], state]));
  const closing = loop
    ? [createTuple([states[states.length - 1], loop.action, states[loop.start]])]
    : [];
  return createCounterExampleRecord([...steps, ...closing], states);
};

const getRegister = (runtime: CheckerRuntime, key: Value) => {
  if (typeof key === "number") return runtime.registers.get(key);
  if (typeof key === "string" && key.startsWith(NAMED_REGISTER_PREFIX)) {
    return getNamedRegisters(runtime).get(key);
  }
  return undefined;
};

export const setTlcValue = (
  runtime: CheckerRuntime,
  print: (text: string) => void,
  key: Value,
  value: Value,
) => {
  if (typeof key === "number" && key >= 0) {
    runtime.registers.set(key, value);
    return;
  }
  if (key === "exit") {
    if (value === true) runtime.isStopped = true;
    return;
  }
  if (key === "pause") {
    if (value !== true || !runtime.pause) return;
    print("Press enter to resume model checking.");
    runtime.pause();
    return;
  }
  if (typeof key === "string" && key.startsWith(NAMED_REGISTER_PREFIX)) {
    runtime.namedRegisters.set(key, value);
    return;
  }
  if (typeof key === "string" && key.startsWith("-D")) {
    runtime.properties.set(key.slice(2), formatValue(value));
    return;
  }
  throw new TlaModuleError(
    `The first argument of TLCSet should be a nonnegative integer, but instead it is:\n${formatValue(key)}`,
  );
};

const describeNode = (expression: Expression) =>
  expression.kind === "Number"
    ? (expression.text ?? String(expression.value))
    : expression.kind === "Decimal"
      ? expression.text
      : describeRange(expression);

const isCompleteState = (state: (Value | undefined)[]): state is Value[] =>
  state.every((value) => value !== undefined);

const toStateRecord = (state: Value[], environment: Environment) =>
  createRecord(environment.variables.map((name, index): [string, Value] => [name, state[index]]));

const getMentionedLevel = (
  expression: Expression,
  environment: Environment,
  visited: Set<Definition>,
): number => {
  if (expression.kind === "Prime" || expression.kind === "Unchanged") return ACTION_LEVEL;
  const name =
    expression.kind === "Identifier"
      ? expression.name
      : expression.kind === "Apply"
        ? expression.operator
        : undefined;
  const isGlobal = name !== undefined && !isLocallyResolved(expression);
  if (isGlobal && environment.variableIndex.has(name)) return VARIABLE_LEVEL;
  const levels = getChildren(expression).map((child) =>
    getMentionedLevel(child, environment, visited),
  );
  const definition = isGlobal ? getDefinition(name, environment) : undefined;
  if (definition && !visited.has(definition)) {
    visited.add(definition);
    levels.push(getMentionedLevel(definition.body, environment, visited));
  }
  return Math.max(CONSTANT_LEVEL, ...levels);
};

export const createTlcExtOperators = (runtime: CheckerRuntime): Builtin[] => {
  const globalCaches = new Map<Expression, Map<string, Value>>();
  const stateCaches = new WeakMap<(Value | undefined)[], Map<Expression, Map<string, Value>>>();
  const getStateCaches = (state: (Value | undefined)[]) => {
    const caches = stateCaches.get(state) ?? new Map<Expression, Map<string, Value>>();
    stateCaches.set(state, caches);
    return caches;
  };
  return [
    defineLazyOperator("AssertError", 2, (args) => {
      const message = getOperator(args, 0, "AssertError").expression;
      if (message && message.kind !== "String") {
        throw new TlaEvaluationError(
          `In computing AssertError, a non-string expression (${describeNode(message)}) was used as the err of an AssertError(err, exp).`,
        );
      }
      const expected = getThunk(args, 0, "AssertError")();
      try {
        getThunk(args, 1, "AssertError")();
      } catch (error) {
        if (error instanceof TlaEvaluationError) {
          return formatNestedMessage(error.message, runtime.isTool) === expected;
        }
        throw error;
      }
      return false;
    }),
    defineStateOperator("TLCGetOrDefault", 2, (args) => {
      const key = getValue(args, 0, "TLCGetOrDefault");
      return getRegister(runtime, key) ?? getValue(args, 1, "TLCGetOrDefault");
    }),
    defineStateOperator("Trace", 0, (_, context) => {
      const variables = context?.environment.variables ?? [];
      // TLC evaluates an assumption in an empty state, which assigns none of the variables.
      const state = context?.state ?? variables.map(() => undefined);
      if (!context || !isCompleteState(state)) {
        const unassigned = variables.filter((_, index) => state[index] === undefined);
        throw new TlaEvaluationError(
          `In evaluating TLCExt!Trace, the state is not completely specified yet (variable${unassigned.length > 1 ? "s" : ""} ${unassigned.join(", ")} undefined).`,
        );
      }
      if (!context.state) return createTuple([createRecord([])]);
      return createTuple(
        runtime.getBehavior(state).map((step) => toStateRecord(step, context.environment)),
      );
    }),
    defineStateOperator(
      "CounterExample",
      0,
      () => runtime.counterExample ?? createCounterExampleRecord([], []),
    ),
    defineOperator("ToTrace", 1, (args) => {
      const counterExample = getValue(args, 0, "ToTrace");
      if (typeof counterExample !== "object" || !counterExamples.has(counterExample)) {
        throw new TlaModuleError(
          `The argument of ToTrace should be a CounterExample, but instead it is:\n${formatValue(counterExample)}`,
        );
      }
      const states = toFiniteSet(applyFunction(counterExample, "state")).elements.map(
        (pair) => getSequenceElements(pair) ?? [],
      );
      return createTuple(
        states.sort((left, right) => Number(left[0]) - Number(right[0])).map((pair) => pair[1]),
      );
    }),
    defineOperator("TLCModelValue", 1, (args) => {
      const name = getValue(args, 0, "TLCModelValue");
      if (typeof name !== "string") {
        throw new TlaModuleError(
          `The argument of ModelValue should be a string, but instead it is:\n${formatValue(name)}`,
        );
      }
      return createModelValue(name);
    }),
    // TLC runs the deferred expression only in simulation, when it extends a behavior.
    defineLazyOperator("TLCDefer", 1, () => true),
    defineOperator("TLCNoOp", 1, (args) => getValue(args, 0, "TLCNoOp")),
    defineLazyOperator("PickSuccessor", 1, (args, context) => {
      // Outside an action, TLC's successor is an empty state, which assigns none of the variables.
      const next = context?.next ?? (context?.environment.variables ?? []).map(() => undefined);
      if (!isCompleteState(next)) {
        throw new TlaNullPointerError(
          'Cannot invoke "tlc2.value.IValue.fingerPrint(long)" because "minVals[i]" is null',
        );
      }
      if (context?.next && runtime.isSeen(next)) return true;
      const guard = getOperator(args, 0, "PickSuccessor");
      const isPicked = guard.call([]);
      if (typeof isPicked !== "boolean") {
        throw new TlaEvaluationError(
          `In evaluating TLCExt!PickSuccessor, a non-boolean expression (${getKindString(isPicked)}) was used as the condition of an IF.\n${guard.expression ? describeNode(guard.expression) : ""}`,
        );
      }
      if (isPicked || !context?.next) return true;
      throw new TlaUnsupportedError(
        "PickSuccessor needs interactive input to extend the behavior with a new state",
      );
    }),
    defineLazyOperator("TLCCache", 2, (args, context) => {
      const expression = getOperator(args, 0, "TLCCache");
      const closure = getValueKey(getThunk(args, 1, "TLCCache")());
      const source = expression.expression;
      if (!source || !context) return expression.call([]);
      const level = getMentionedLevel(source, context.environment, new Set());
      if (level === ACTION_LEVEL) return expression.call([]);
      const isStateLevel = level === VARIABLE_LEVEL;
      // TLC's model checker keeps no cache in a state, so its TLA+ definition evaluates it again.
      if (isStateLevel && context.state && runtime.getSimulationValue === undefined) {
        expression.call([]);
        return expression.call([]);
      }
      const caches = isStateLevel && context.state ? getStateCaches(context.state) : globalCaches;
      const cache = caches.get(source) ?? new Map<string, Value>();
      caches.set(source, cache);
      const cached = cache.get(closure);
      if (cached !== undefined) return cached;
      const value = expression.call([]);
      cache.set(closure, value);
      return value;
    }),
    defineOperator("TLCFP", 1, (args) => {
      const value = getValue(args, 0, "TLCFP");
      const error = getFingerprintError(value);
      if (error) throw error;
      return Number(BigInt.asIntN(32, getTlcFingerprint([value])));
    }),
    defineLazyOperator("TLCEvalDefinition", 1, (args, context) => {
      const name = getThunk(args, 0, "TLCEvalDefinition")();
      if (typeof name !== "string") {
        throw new TlaModuleError(
          `The argument of TLCEvalDefinition should be a string, but instead it is:\n${formatValue(name)}`,
        );
      }
      const definition = context ? getDefinition(name, context.environment) : undefined;
      if (!definition || !context) {
        throw new TlaModuleError(
          `The argument of TLCEvalDefinition should be a name of a definition reachable from the root module, but instead it is:\n${formatValue(name)}`,
        );
      }
      if (definition.kind === "Operator" && definition.params.length > 0) {
        const parameters = definition.params.map((param) =>
          param.arity === 0
            ? param.name
            : `${param.name}(${Array.from({ length: param.arity }, () => "_").join(",")})`,
        );
        // TLC's message template puts another "a" before the expected kind.
        throw new TlaModuleError(
          `The argument of TLCEvalDefinition should be a a zero-arity definition, but instead it is:\n${name}(${parameters.join(", ")})`,
        );
      }
      return definition.kind === "Operator"
        ? evaluate(definition.body, context)
        : evaluate({ kind: "Identifier", name, location: definition.location }, context);
    }),
  ];
};

export const createPossibleOperators = (
  print: (text: string) => void,
  runtime: CheckerRuntime,
): Builtin[] => [
  defineStateOperator("_Track", 2, (args) => {
    const name = String(getValue(args, 1, "_Track"));
    const count = runtime.possibleCounts.get(name) ?? 0;
    runtime.possibleCounts.set(name, getValue(args, 0, "_Track") === true ? count + 1 : count);
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
