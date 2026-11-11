import {
  TlaEndOfInputError,
  TlaEvaluationError,
  TlaModuleError,
  TlaNullPointerError,
} from "./errors";
import type { Builtin, BuiltinArgument, Context, OperatorValue } from "./evaluate";
import {
  formatValue,
  getFunctionClass,
  isFingerprintedSince,
  isOverriddenSet,
  isSetValue,
  MAXIMUM_INTEGER,
  MINIMUM_INTEGER,
  setTrace,
  toFiniteSet,
  type Value,
} from "./values";

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
]);

const createArgumentError = (name: string, message: string) =>
  CORE_OPERATOR_NAMES.has(name) ? new TlaEvaluationError(message) : new TlaModuleError(message);

export const createModuleArgumentError = (
  position: string,
  name: string,
  expected: string,
  value: Value,
) =>
  new TlaModuleError(
    `The ${position} argument of ${name} should be a ${expected}, but instead it is:\n${formatValue(value)}`,
  );

export const toEnumeratedSet = (value: Value, name: string, reported = value) => {
  if (!isSetValue(value) || isOverriddenSet(value)) {
    throw new TlaModuleError(
      `Applying ${name} to the following value,\nwhich is not a finite set:\n${formatValue(reported)}`,
    );
  }
  return toFiniteSet(value);
};

const isOperatorValue = (argument: BuiltinArgument): argument is OperatorValue =>
  typeof argument === "object" && argument.kind === "Operator";

export const getValue = (args: BuiltinArgument[], index: number, name: string): Value => {
  const argument = args[index];
  if (argument === undefined || isOperatorValue(argument)) {
    throw createArgumentError(name, `${name} expects a value as argument ${index + 1}`);
  }
  return argument;
};

export const getBoolean = (args: BuiltinArgument[], index: number, name: string) => {
  const value = getValue(args, index, name);
  if (typeof value !== "boolean") {
    throw createArgumentError(name, `${name} expects a boolean but received ${formatValue(value)}`);
  }
  return value;
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
  Union: "UnionValue",
  MixedSet: "SetEnumValue",
};

const SET_OPERATION_CLASSES = {
  "\\cup": "SetCupValue",
  "\\cap": "SetCapValue",
  "\\": "SetDiffValue",
};

const KIND_STRINGS: Record<string, string> = {
  BoolValue: "a Boolean value",
  IntValue: "an integer",
  StringValue: "a string",
  RecordValue: "a record",
  SetEnumValue: "a set of the form {e1, ... ,eN}",
  SetPredValue: "a set of the form {x \\in S : expr}",
  TupleValue: "a tuple",
  FcnLambdaValue: "a function of the form  [x \\in S |-> expr]",
  FcnRcdValue: "a function  of the form (d1 :> e1 @@ ... @@ dN :> eN)",
  SetOfFcnsValue: "a set of the form [S -> T]",
  SetOfRcdsValue: "a set of the form [d1 : S1, ... , dN : SN]",
  SetOfTuplesValue: "a cartesian product",
  SubsetValue: "a set of the form SUBSET S",
  SetDiffValue: "a set of the form S \\ T",
  SetCapValue: "a set of the form S \\cap T",
  SetCupValue: "a set of the form S \\cup T",
  ModelValue: "a model value",
  UserValue: "a special set constant",
  IntervalValue: "a set of the form i..j",
  UnionValue: "a set of the form UNION  S",
};

const FUNCTION_CLASSES = {
  lambda: "FcnLambdaValue",
  tuple: "TupleValue",
  record: "RecordValue",
};

export const getJavaClassName = (value: Value) => {
  if (typeof value === "number") return "IntValue";
  if (typeof value === "string") return "StringValue";
  if (typeof value === "boolean") return "BoolValue";
  if (value.kind === "SetOperation") return SET_OPERATION_CLASSES[value.operator];
  if (value.kind !== "Function") return JAVA_CLASSES[value.kind];
  const functionClass = getFunctionClass(value);
  return functionClass === undefined ? "FcnRcdValue" : FUNCTION_CLASSES[functionClass];
};

export const getKindString = (value: Value) => KIND_STRINGS[getJavaClassName(value)];

const getJavaOverrideMessage = (signature: string, message: string) =>
  `Attempted to apply the operator overridden by the Java method\n${signature},\nbut it produced the following error:\n${message}`;

const createJavaOverrideError = (signature: string, message: string) =>
  new TlaEvaluationError(getJavaOverrideMessage(signature, message));

export const overrideWithJava = (builtin: Builtin, signature: string): Builtin => {
  const reportAsJavaFailure =
    <Arguments extends unknown[]>(compute: (...args: Arguments) => Value) =>
    (...args: Arguments) => {
      const depth = setTrace.sets?.length ?? 0;
      try {
        return compute(...args);
      } catch (error) {
        if (!(error instanceof TlaEvaluationError) || error instanceof TlaEndOfInputError) {
          throw error;
        }
        const isFingerprinted = isFingerprintedSince(depth);
        if (setTrace.sets) setTrace.sets.length = depth;
        const isWrapped =
          builtin.isLazy === true || !(error instanceof TlaModuleError) || isFingerprinted;
        if (!isWrapped) throw error;
        if (builtin.isLazy !== true && error instanceof TlaNullPointerError) {
          throw new TlaModuleError(getJavaOverrideMessage(signature, error.message));
        }
        throw createJavaOverrideError(signature, error.message);
      }
    };
  const evaluate = reportAsJavaFailure(builtin.evaluate);
  return {
    ...builtin,
    evaluate: (args, context) => {
      if (args.length !== builtin.arity) {
        throw createJavaOverrideError(signature, `array is not of length ${builtin.arity}`);
      }
      return evaluate(args, context);
    },
    evaluateUnary: builtin.evaluateUnary && reportAsJavaFailure(builtin.evaluateUnary),
    evaluateBinary: builtin.evaluateBinary && reportAsJavaFailure(builtin.evaluateBinary),
  };
};

export const getJavaInteger = (value: Value, signature: string) => {
  if (typeof value !== "number") {
    throw createJavaOverrideError(
      signature,
      `Cannot cast tlc2.value.impl.${getJavaClassName(value)} to tlc2.value.impl.IntValue`,
    );
  }
  return value;
};

export const getJavaSignature = (module: string, method: string, result: string, arity: number) =>
  `public static tlc2.value.impl.${result} tlc2.module.${module}.${method}(${Array.from({ length: arity }, () => "tlc2.value.impl.IntValue").join(",")})`;

export const defineArithmetic = (
  module: string,
  name: string,
  method: string,
  compute: (left: number, right: number) => number,
) => {
  const signature = getJavaSignature(module, method, "IntValue", 2);
  return defineBinary(name, (left, right) => {
    // TLC's MethodHandle casts the last argument first.
    const rightNumber = getJavaInteger(right, signature);
    const leftNumber = getJavaInteger(left, signature);
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

export const defineComparison = (
  name: string,
  compare: (left: number, right: number) => boolean,
  errorName = name,
) =>
  defineBinary(name, (left, right) =>
    compare(
      getIntegerArgument(left, "first", errorName),
      getIntegerArgument(right, "second", errorName),
    ),
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
