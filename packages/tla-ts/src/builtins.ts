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

export const toNumber = (value: Value, name: string) => {
  if (typeof value !== "number") {
    throw createArgumentError(
      name,
      `${name} expects an integer but received ${formatValue(value)}`,
    );
  }
  return value;
};

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

export const defineArithmetic = (name: string, compute: (left: number, right: number) => number) =>
  defineBinary(name, (left, right) => {
    const leftNumber = toNumber(left, name);
    const rightNumber = toNumber(right, name);
    const result = compute(leftNumber, rightNumber);
    if (isOutOfRange(result)) throw createOverflowError(`${leftNumber}${name}${rightNumber}`);
    return result;
  });

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
