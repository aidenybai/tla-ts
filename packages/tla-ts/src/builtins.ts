import { TlaEvaluationError, TlaModuleError } from "./errors";
import type { Builtin, BuiltinArgument, Context, OperatorValue } from "./evaluate";
import {
  formatValue,
  getSequenceElements,
  isEnumerable,
  isFunctionValue,
  isSetValue,
  toFiniteFunction,
  MAXIMUM_INTEGER,
  MINIMUM_INTEGER,
  toFiniteSet,
  type Value,
} from "./values";

// TLC evaluates these operators in its core, or its Java code for them takes integers, so a wrong
// argument is an evaluation failure. Every other standard-module operator checks its arguments in
// Java and raises an EvalException.
const CORE_OPERATOR_NAMES = new Set([
  "=",
  "#",
  "~",
  "<=>",
  "/\\",
  "\\/",
  "=>",
  "\\in",
  "\\notin",
  "\\subseteq",
  "\\cup",
  "\\cap",
  "\\",
  "SUBSET",
  "UNION",
  "DOMAIN",
  "+",
  "-",
  "*",
  "^",
  "\\div",
  "%",
  "..",
  "Seq",
  "IsFiniteSet",
  "RandomElement",
]);

const createArgumentError = (name: string, message: string) =>
  CORE_OPERATOR_NAMES.has(name) ? new TlaEvaluationError(message) : new TlaModuleError(message);

export const isOperatorValue = (argument: BuiltinArgument): argument is OperatorValue =>
  typeof argument === "object" && argument.kind === "Operator";

export const getValue = (args: BuiltinArgument[], index: number, name: string): Value => {
  const argument = args[index];
  if (argument === undefined || isOperatorValue(argument)) {
    throw createArgumentError(name, `${name} expects a value as argument ${index + 1}`);
  }
  return argument;
};

export const getNumber = (args: BuiltinArgument[], index: number, name: string) => {
  const value = getValue(args, index, name);
  if (typeof value !== "number") {
    throw createArgumentError(
      name,
      `${name} expects an integer but received ${formatValue(value)}`,
    );
  }
  return value;
};

export const getBoolean = (args: BuiltinArgument[], index: number, name: string) => {
  const value = getValue(args, index, name);
  if (typeof value !== "boolean") {
    throw createArgumentError(name, `${name} expects a boolean but received ${formatValue(value)}`);
  }
  return value;
};

export const getSet = (args: BuiltinArgument[], index: number, name: string) => {
  const value = getValue(args, index, name);
  if (!isSetValue(value))
    throw createArgumentError(name, `${name} expects a set but received ${formatValue(value)}`);
  return value;
};

export const getEnumerableSet = (args: BuiltinArgument[], index: number, name: string) => {
  const set = getSet(args, index, name);
  if (!isEnumerable(set)) {
    throw createArgumentError(
      name,
      `${name} cannot enumerate the non-enumerable set ${formatValue(set)}`,
    );
  }
  return set;
};

export const getFiniteSet = (args: BuiltinArgument[], index: number, name: string) =>
  toFiniteSet(getEnumerableSet(args, index, name));

export const getElements = (args: BuiltinArgument[], index: number, name: string) =>
  getFiniteSet(args, index, name).elements;

export const getSequence = (args: BuiltinArgument[], index: number, name: string) => {
  const value = getValue(args, index, name);
  const elements = getSequenceElements(value);
  if (!elements)
    throw createArgumentError(
      name,
      `${name} expects a sequence but received ${formatValue(value)}`,
    );
  return elements;
};

export const getFunction = (args: BuiltinArgument[], index: number, name: string) => {
  const value = getValue(args, index, name);
  if (!isFunctionValue(value)) {
    throw createArgumentError(
      name,
      `${name} expects a function but received ${formatValue(value)}`,
    );
  }
  return toFiniteFunction(value);
};

export const getOperator = (args: BuiltinArgument[], index: number, name: string) => {
  const argument = args[index];
  if (argument === undefined || !isOperatorValue(argument)) {
    throw createArgumentError(name, `${name} expects an operator as argument ${index + 1}`);
  }
  return argument;
};

export const defineConstant = (name: string, value: Value): Builtin => ({
  kind: "Builtin",
  name,
  arity: 0,
  evaluate: () => value,
  evaluateUnary: undefined,
  evaluateBinary: undefined,
});

export const defineOperator = (
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

export const defineHigherOrderOperator = (
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

export const defineStateOperator = (
  name: string,
  arity: number,
  evaluate: (args: BuiltinArgument[], context: Context | undefined) => Value,
): Builtin => ({
  kind: "Builtin",
  name,
  arity,
  evaluate,
  evaluateUnary: undefined,
  evaluateBinary: undefined,
  isStateLevel: true,
});

export const defineBinary = (
  name: string,
  compute: (left: Value, right: Value) => Value,
): Builtin => ({
  kind: "Builtin",
  name,
  arity: 2,
  evaluate: (args) => compute(getValue(args, 0, name), getValue(args, 1, name)),
  evaluateUnary: undefined,
  evaluateBinary: compute,
});

export const isOutOfRange = (value: number) => value > MAXIMUM_INTEGER || value < MINIMUM_INTEGER;

export const createOverflowError = (computation: string) =>
  new TlaModuleError(`Overflow when computing ${computation}`);

const JAVA_CLASSES: Record<string, string> = {
  ModelValue: "ModelValue",
  Set: "SetEnumValue",
  Interval: "IntervalValue",
  InfiniteSet: "UserValue",
  SequenceSet: "UserValue",
  Subset: "SubsetValue",
  FunctionSet: "SetOfFcnsValue",
  RecordSet: "SetOfRcdsValue",
  ProductSet: "SetOfTuplesValue",
  FilteredSet: "SetPredValue",
  LazyFunction: "FcnLambdaValue",
};

const SET_OPERATION_CLASSES = {
  "\\cup": "SetCupValue",
  "\\cap": "SetCapValue",
  "\\": "SetDiffValue",
};

// TLC stores a function as a TupleValue or a RecordValue when it has that shape, so the
// shape stands in for how TLC built the value.
const getJavaClass = (value: Value) => {
  if (typeof value === "number") return "tlc2.value.impl.IntValue";
  if (typeof value === "string") return "tlc2.value.impl.StringValue";
  if (typeof value === "boolean") return "tlc2.value.impl.BoolValue";
  if (value.kind === "SetOperation") {
    return `tlc2.value.impl.${SET_OPERATION_CLASSES[value.operator]}`;
  }
  if (value.kind !== "Function") return `tlc2.value.impl.${JAVA_CLASSES[value.kind]}`;
  const domain = value.domain;
  if (domain.every((key, index) => key === index + 1)) return "tlc2.value.impl.TupleValue";
  return domain.every((key) => typeof key === "string")
    ? "tlc2.value.impl.RecordValue"
    : "tlc2.value.impl.FcnRcdValue";
};

export const createJavaOverrideError = (signature: string, message: string) =>
  new TlaEvaluationError(
    `Attempted to apply the operator overridden by the Java method\n${signature},\nbut it produced the following error:\n${message}`,
  );

export const getJavaInteger = (value: Value, signature: string) => {
  if (typeof value !== "number") {
    throw createJavaOverrideError(
      signature,
      `Cannot cast ${getJavaClass(value)} to tlc2.value.impl.IntValue`,
    );
  }
  return value;
};

export const getIntegersSignature = (method: string, result: string, arity: number) =>
  `public static tlc2.value.impl.${result} tlc2.module.Integers.${method}(${Array.from({ length: arity }, () => "tlc2.value.impl.IntValue").join(",")})`;

export const defineArithmetic = (
  name: string,
  method: string,
  compute: (left: number, right: number) => number,
) => {
  const signature = getIntegersSignature(method, "IntValue", 2);
  return defineBinary(name, (left, right) => {
    const leftNumber = getJavaInteger(left, signature);
    const rightNumber = getJavaInteger(right, signature);
    const result = compute(leftNumber, rightNumber);
    if (isOutOfRange(result)) throw createOverflowError(`${leftNumber}${name}${rightNumber}`);
    return result;
  });
};

const getIntegerArgument = (value: Value, position: string, name: string) => {
  if (typeof value !== "number") {
    throw new TlaModuleError(
      `The ${position} argument of ${name} should be an integer, but instead it is:\n${formatValue(value)}`,
    );
  }
  return value;
};

export const defineComparison = (name: string, compare: (left: number, right: number) => boolean) =>
  defineBinary(name, (left, right) =>
    compare(getIntegerArgument(left, "first", name), getIntegerArgument(right, "second", name)),
  );

export const defineLazyOperator = (
  name: string,
  arity: number,
  evaluate: (args: BuiltinArgument[], context: Context | undefined) => Value,
): Builtin => ({ ...defineStateOperator(name, arity, evaluate), isLazy: true });

export const getThunk = (args: BuiltinArgument[], index: number, name: string) => {
  const argument = getOperator(args, index, name);
  return () => argument.call([]);
};
