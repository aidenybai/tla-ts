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
  formatRange,
  getUnexpectedException,
  TlaEndOfInputError,
  TlaEvaluationError,
  TlaModuleError,
  TlaUnsupportedError,
} from "../errors";
import { getTlcFingerprint } from "./fingerprint";
import { prettyPrint, prettyPrintT } from "../pretty-print";
import { formatNestedMessage, MESSAGE_CODE } from "./messages";
import {
  describeRange,
  evaluate,
  getDefinition,
  getRootKey,
  type Builtin,
  type Environment,
} from "../evaluate";
import { getChildren, isLocallyResolved, type Definition, type Expression } from "../ast";
import { ACTION_LEVEL, CONSTANT_LEVEL, VARIABLE_LEVEL } from "../levels";
import {
  EMPTY_STATE,
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
  createWrittenFunction,
  formatState,
  formatValue,
  getFingerprintError,
  getSequenceElements,
  getValueKey,
  rankString,
  setFunctionClass,
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

const counterExamples = new WeakSet<Value & object>();

export const createTlcRecord = (fields: [string, Value][]) =>
  setFunctionClass(createWrittenFunction(fields), "record");

const createCounterExampleRecord = (action: Value[], states: Value[], isConsole = true) => {
  // TLC's CounterExample interns its field names as the class loads, which orders them as strings.
  ["state", "action", "console"].forEach(rankString);
  const fields: [string, Value][] = [
    ["action", createSet(action)],
    ["state", createSet(states)],
  ];
  const counterExample = createTlcRecord(isConsole ? fields : [...fields, ["console", false]]);
  counterExamples.add(counterExample);
  return counterExample;
};

export interface CounterExampleLoop {
  start: number;
  action: Value;
}

export const createCounterExample = (
  stateRecords: Record<string, Value>[],
  actions: Value[],
  loop: CounterExampleLoop | undefined,
  isConsole = true,
) => {
  const states = stateRecords.map((state, index) =>
    createTuple([index + 1, createTlcRecord(Object.entries(state))]),
  );
  const steps = states
    .slice(1)
    .map((state, index) => createTuple([states[index], actions[index], state]));
  const closing = loop
    ? [createTuple([states[states.length - 1], loop.action, states[loop.start]])]
    : [];
  return createCounterExampleRecord([...steps, ...closing], states, isConsole);
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
  key: Value,
  value: Value,
  state: (Value | undefined)[] | undefined,
) => {
  // TLC splits Next before its checker exists, so TLCSet there throws on a numbered register and drops the other writes.
  const isSplit = state === EMPTY_STATE;
  if (typeof key === "number" && key >= 0) {
    if (isSplit)
      throw new TlaEvaluationError(getUnexpectedException("java.lang.NullPointerException"));
    runtime.registers.set(key, value);
    return;
  }
  if (key === "exit") {
    if (value === true && !isSplit) runtime.isStopped = true;
    return;
  }
  if (key === "pause") {
    if (value !== true || !runtime.pause || isSplit) return;
    runtime.printPrompt("Press enter to resume model checking.");
    runtime.pause();
    return;
  }
  if (typeof key === "string" && key.startsWith(NAMED_REGISTER_PREFIX)) {
    if (!isSplit) runtime.namedRegisters.set(key, value);
    return;
  }
  if (typeof key === "string" && key.startsWith("-D")) {
    runtime.properties.set(key.slice(2), formatValue(value));
    return;
  }
  throw new TlaModuleError(
    `The first argument of TLCSet should be a nonnegative integer, but instead it is:\n${prettyPrint(formatValue(key))}`,
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
    {
      ...defineLazyOperator("AssertError", 2, (args) => {
        const message = getOperator(args, 0, "AssertError").expression;
        if (message && message.kind !== "String") {
          throw new TlaEvaluationError(
            `In computing AssertError, a non-string expression (${describeNode(message)}) was used as the err of an AssertError(err, exp).`,
          );
        }
        try {
          getThunk(args, 1, "AssertError")();
        } catch (error) {
          if (!(error instanceof TlaEvaluationError)) throw error;
          return (
            formatNestedMessage(error.message, runtime.isTool) ===
            getThunk(args, 0, "AssertError")()
          );
        }
        return false;
      }),
      isStateLevel: false,
    },
    // Deviation from TLC: TLCExt#tlcGetOrDefault lacks TLCGet's minLevel = 1, so TLC evaluates a constant definition that calls it as it starts and keeps the default.
    defineStateOperator(
      "TLCGetOrDefault",
      2,
      (args) =>
        getRegister(runtime, getValue(args, 0, "TLCGetOrDefault")) ??
        getValue(args, 1, "TLCGetOrDefault"),
    ),
    defineStateOperator("Trace", 0, (_args, context) => {
      const variables = context?.environment.variables ?? [];
      const state = context?.state ?? variables.map(() => undefined);
      if (!context || state.length < variables.length || !isCompleteState(state)) {
        const unassigned = variables.filter((_name, index) => state[index] === undefined);
        throw new TlaEvaluationError(
          `In evaluating TLCExt!Trace, the state is not completely specified yet (variable${unassigned.length > 1 ? "s" : ""} ${unassigned.join(", ")} undefined).`,
        );
      }
      if (!context.state) return createTuple([createRecord([])]);
      return createTuple(
        runtime.getBehavior(state).map((step) => {
          const fields = Object.entries(runtime.toRecord(step));
          const action = runtime.getSimulationValue?.("action", step);
          return createTlcRecord(action === undefined ? fields : [["_action", action], ...fields]);
        }),
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
          `The argument of ToTrace should be a CounterExample, but instead it is:\n${prettyPrint(formatValue(counterExample))}`,
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
          `The argument of ModelValue should be a string, but instead it is:\n${prettyPrint(formatValue(name))}`,
        );
      }
      return createModelValue(name);
    }),
    {
      ...defineLazyOperator("TLCDefer", 1, (args, context) => {
        const expression = getOperator(args, 0, "TLCDefer").expression;
        if (context && expression) {
          runtime.deferred = (next) => {
            evaluate(expression, { ...context, next });
          };
        }
        return true;
      }),
      isStateLevel: false,
    },
    defineOperator("TLCNoOp", 1, (args) => getValue(args, 0, "TLCNoOp")),
    {
      ...defineLazyOperator("PickSuccessor", 1, (args, context) => {
        const next = context?.next ?? (context?.environment.variables ?? []).map(() => undefined);
        // A simulation remembers no states, so TLC evaluates the guard before it looks at the successor.
        if (runtime.getSimulationValue === undefined) {
          // Deviation from TLC: TLCExt#pickSuccessor fingerprints a partial successor and fails, where TLCExt.tla promises TRUE.
          if (!isCompleteState(next)) return true;
          if (context?.next && runtime.isSeen(next)) return true;
        }
        const guard = getOperator(args, 0, "PickSuccessor");
        const isPicked = guard.call([]);
        if (typeof isPicked !== "boolean") {
          throw new TlaEvaluationError(
            `In evaluating TLCExt!PickSuccessor, a non-boolean expression (${getKindString(isPicked)}) was used as the condition of an IF.\n${guard.expression ? describeNode(guard.expression) : ""}`,
          );
        }
        if (
          isPicked ||
          !context?.next ||
          !isCompleteState(next) ||
          !context.state ||
          !isCompleteState(context.state)
        ) {
          return true;
        }
        const state = context.state;
        const action = runtime.getSuccessorAction(state, next);
        const printOverride = (text: string) =>
          runtime.printPrompt(text, MESSAGE_CODE.moduleOverrideStdout);
        while (true) {
          printOverride(
            `Extend behavior of length ${runtime.getLevel(state)} with a "${action?.name}" step [<Action ${action?.location.range && formatRange(action.location.range)}>]? (Yes/no/explored/states/diff):`,
          );
          const answer = runtime.readLine?.();
          // Deviation from TLC: at the end of standard input, TLC's Scanner leaks a NoSuchElementException.
          if (answer === undefined) throw new TlaEndOfInputError();
          if (/^[\0-\x20]*$/.test(answer) || answer.toLowerCase().startsWith("y")) return true;
          if (answer[0] === "s") {
            printOverride(
              `${formatState(runtime.toRecord(state)).trimEnd()}\n~>\n${formatState(runtime.toRecord(next)).trimEnd()}`,
            );
          } else if (answer[0] === "d") {
            printOverride(formatState(runtime.toRecord(next), runtime.toRecord(state)));
          } else if (answer[0] === "e") {
            if (runtime.markExplored) {
              runtime.markExplored(next);
              return true;
            }
            if (runtime.getSimulationValue === undefined) {
              throw new TlaUnsupportedError(
                "tla-ts can't mark a state explored while it searches depth first.",
              );
            }
            printOverride(
              "Marking a state explored is unsupported by the current TLC mode. Is TLC running in simulation mode?",
            );
          } else if (answer[0] === "n") return false;
        }
      }),
      isActionLevel: true,
    },
    {
      ...defineLazyOperator("TLCCache", 2, (args, context) => {
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
      isStateLevel: false,
    },
    defineOperator("TLCFP", 1, (args) => {
      const value = getValue(args, 0, "TLCFP");
      const error = getFingerprintError(value);
      if (error) throw error;
      return Number(BigInt.asIntN(32, getTlcFingerprint([value])));
    }),
    // Deviation from TLC: TLCExt#tlcDefByName lacks a minLevel, so TLC evaluates a constant definition with it as it starts, running the argument before a null getSpecProcessor() fails.
    defineLazyOperator("TLCEvalDefinition", 1, (args, context) => {
      const name = getThunk(args, 0, "TLCEvalDefinition")();
      if (typeof name !== "string") {
        throw new TlaModuleError(
          `The argument of TLCEvalDefinition should be a string, but instead it is:\n${prettyPrint(formatValue(name))}`,
        );
      }
      const key = context ? getRootKey(name, context.environment) : name;
      const definition = context ? getDefinition(key, context.environment) : undefined;
      const builtin = definition ? undefined : context?.environment.builtins.get(key);
      if (builtin?.arity === 0) return builtin.evaluate([], context);
      if (!definition || !context) {
        throw new TlaModuleError(
          `The argument of TLCEvalDefinition should be a name of a definition reachable from the root module, but instead it is:\n${prettyPrint(formatValue(name))}`,
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
        : evaluate({ kind: "Identifier", name: key, location: definition.location }, context);
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
    print(prettyPrintT(formatValue(getPossibleCounts(runtime), true), runtime.hasUserFile));
    return false;
  }),
  defineStateOperator("_PrintCounts", 0, () => {
    print(prettyPrintT(formatValue(getPossibleCounts(runtime), true), runtime.hasUserFile));
    return true;
  }),
];
