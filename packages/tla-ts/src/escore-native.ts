import {
  evaluate,
  toKeepLazyContext,
  type Builtin,
  type BuiltinArgument,
  type Context,
  type OperatorValue,
} from "./evaluate";
import {
  applyFunction,
  compareValues,
  createSortedFunction,
  createTuple,
  getDomain,
  getSequenceElements,
  isElementOf,
  isEqualLikeTlc,
  isModelValue,
  isNormalizedSet,
  setFunctionClass,
  type FunctionValue,
  updateFunction,
  type Value,
  valuesEqual,
} from "./values";

// ESNative's operators on a lowered model's values (see typescript/spec/native.ts), which tla-ts
// runs natively where their operands are the common ones, and through the module's TLA+ otherwise,
// while TLC always runs the TLA+. Each native case gives the value the TLA+ gives: Numbers are
// ESNumber's records, of which only integers of kind "int" run natively, strings are sequences of
// code units, and a native case that meets anything it doesn't know falls back.

type CallReplaced = (name: string, args: BuiltinArgument[], context: Context | undefined) => Value;

const isFunction = (value: Value | undefined): value is FunctionValue =>
  typeof value === "object" && value.kind === "Function";

// A record's field, or undefined where the value isn't a record that has it.
const getField = (value: Value | undefined, field: string) => {
  if (!isFunction(value)) return undefined;
  const index = value.domain.indexOf(field);
  return index === -1 ? undefined : value.range[index];
};

const getType = (value: Value | undefined) => {
  const type = getField(value, "type");
  return typeof type === "string" ? type : undefined;
};

const getList = (value: Value | undefined) =>
  value === undefined ? undefined : getSequenceElements(value);

// A finite function's elements as a tuple, or undefined for any other value, so that a lazy
// function falls back to the TLA+ rather than being applied here.
const getTuple = (value: Value | undefined) =>
  isFunction(value) ? getSequenceElements(value) : undefined;

// The records of one literal, with the fields in the order TLA+ writes them, which tla-ts keeps.
const createShape = (written: string[]) => {
  let names: string[] | undefined;
  let order: number[] | undefined;
  return (values: Value[]) => {
    order ??= written
      .map((_, index) => index)
      .sort((left, right) => compareValues(written[left], written[right]));
    names ??= order.map((index) => written[index]);
    const record = setFunctionClass(
      createSortedFunction(
        names,
        order.map((index) => values[index]),
      ),
      "record",
    );
    if (names.some((name, index) => name !== written[index])) record.writtenKeys = written;
    return record;
  };
};

const numberShape = createShape(["k", "neg", "i", "m", "e"]);
const valueShape = createShape(["type", "value"]);
const typeShape = createShape(["type"]);
const arrayShape = createShape(["type", "elems"]);

// ESNumber's IntLimit: a Number of kind "int" is an integer strictly within it.
const INT_LIMIT = 1073741824;

const createNumber = (number: Value) => valueShape(["number", number]);
const createInt = (int: number) =>
  createNumber(numberShape(["int", int < 0, int, createTuple([]), 0]));
const createNegativeZero = () => createNumber(numberShape(["nzero", true, 0, createTuple([]), 0]));
const createBool = (isTrue: boolean) => valueShape(["boolean", isTrue]);
const createBail = () => typeShape(["bail"]);
// LArray of a list of lowered values, or undefined where one isn't a lowered value.
const createArray = (elements: Value[]) =>
  elements.some((element) => getType(element) === undefined)
    ? undefined
    : elements.some((element) => getType(element) === "bail")
      ? createBail()
      : arrayShape(["larray", createTuple(elements)]);

// IntV(n) for an integer n, where it's an "int" Number, or undefined.
const toInt = (int: number) => (-INT_LIMIT < int && int < INT_LIMIT ? createInt(int) : undefined);

// The integer of a Number of kind "int", or undefined for any other value.
const getInt = (value: Value | undefined) => {
  if (getType(value) !== "number") return undefined;
  const number = getField(value, "value");
  if (getField(number, "k") !== "int") return undefined;
  const int = getField(number, "i");
  return typeof int === "number" ? int : undefined;
};

const COMPOSITES = new Set(["lobject", "larray", "lset", "lmap"]);
const PRIMITIVES = new Set(["undefined", "null", "boolean", "number", "string"]);

const getUnits = (text: string) =>
  createTuple(Array.from({ length: text.length }, (_, index) => text.charCodeAt(index)));
let lengthUnits: Value | undefined;
let sizeUnits: Value | undefined;

// ToBooleanValue of a value of a type other than bigint, or undefined.
const getTruth = (value: Value) => {
  const type = getType(value);
  if (type === "undefined" || type === "null") return false;
  const inner = getField(value, "value");
  if (type === "boolean") return typeof inner === "boolean" ? inner : undefined;
  if (type === "string") {
    const units = getList(inner);
    return units === undefined ? undefined : units.length !== 0;
  }
  if (type !== "number") return undefined;
  const kind = getField(inner, "k");
  return kind === "int"
    ? getField(inner, "i") !== 0
    : kind === "nzero" || kind === "nan"
      ? false
      : kind === "inf" || kind === "fin"
        ? true
        : undefined;
};

// LTruthy, or undefined where ToBooleanValue would look further.
const getTruthy = (value: Value) => (COMPOSITES.has(getType(value) ?? "") ? true : getTruth(value));

// The value of a key of a lowered object's vals, or LBail.
const getProperty = (object: Value, key: Value) => {
  const values = getField(object, "vals");
  if (!isFunction(values)) return undefined;
  const index = values.domain.findIndex((inner) => valuesEqual(inner, key));
  return index === -1 ? createBail() : values.range[index];
};

// [o EXCEPT !.vals[k] = v] for a key that o's vals has.
const setProperty = (object: Value, key: Value, value: Value) =>
  updateFunction(
    object,
    "vals",
    (values) => updateFunction(values, key, () => value, false),
    false,
  );

// IsStrictlyEqual of two primitives, or undefined for Numbers other than "int" ones.
const isStrictlyEqual = (left: Value, right: Value) => {
  const leftType = getType(left);
  if (leftType !== getType(right)) return false;
  if (leftType !== "number") return valuesEqual(left, right);
  const leftInt = getInt(left);
  const rightInt = getInt(right);
  return leftInt === undefined || rightInt === undefined ? undefined : leftInt === rightInt;
};

// Whether a list of primitives has an element SameValueZero to another, which for primitives is
// IsStrictlyEqual but on NaN and -0, or undefined where a Number other than an "int" one decides.
const hasElement = (list: Value[], element: Value) => {
  const sames = list.map((inner) => isStrictlyEqual(inner, element));
  return sames.includes(true) ? true : sames.includes(undefined) ? undefined : false;
};

// The elements of a list that test keeps, or undefined where test can't tell for one.
const keepElements = (list: Value[], test: (element: Value) => boolean | undefined) => {
  const tests = list.map(test);
  return tests.includes(undefined) ? undefined : list.filter((_, index) => tests[index]);
};

const createSet = (elements: Value[] | undefined) =>
  elements && arrayShape(["lset", createTuple(elements)]);

// NumberOperation of two "int" Numbers, where its result is an "int" Number or -0.
const getArithmetic = (operator: Value, left: number, right: number) => {
  if (operator === "+") return toInt(left + right);
  if (operator === "-") return toInt(left - right);
  if (operator === "*") {
    if (left <= -32768 || left >= 32768 || right <= -32768 || right >= 32768) return undefined;
    const product = left * right;
    return product === 0 && (left < 0 || right < 0) ? createNegativeZero() : createInt(product);
  }
  if (operator === "%") {
    if (right === 0) return undefined;
    if (left === 0) return createInt(0);
    const remainder = Math.abs(left) % Math.abs(right);
    return left > 0
      ? createInt(remainder)
      : remainder === 0
        ? createNegativeZero()
        : createInt(-remainder);
  }
  return undefined;
};

const getRelation = (operator: Value, left: number, right: number) =>
  operator === "<"
    ? left < right
    : operator === ">"
      ? left > right
      : operator === "<="
        ? left <= right
        : operator === ">="
          ? left >= right
          : undefined;

// The results of a callback on a list's elements and their indices, in order.
const getResults = (elements: Value[], callback: OperatorValue) =>
  elements.map((element, index) => callback.call([element, createInt(index)]));

// The index of the first result that bails or fails test, or -1; undefined where test can't tell.
const findStop = (results: Value[], test: (truth: boolean) => boolean) => {
  for (let index = 0; index < results.length; index++) {
    if (getType(results[index]) === "bail") return index;
    const truth = getTruthy(results[index]);
    if (truth === undefined) return undefined;
    if (!test(truth)) return index;
  }
  return -1;
};

// LRelative: an index of slice, or -1 where it isn't an "int" Number or undefined.
const getRelative = (value: Value, length: number, fallback: number) => {
  const type = getType(value);
  if (type === "undefined") return fallback;
  const int = getInt(value);
  if (int === undefined) return type === undefined || type === "number" ? undefined : -1;
  return int < 0 ? Math.max(length + int, 0) : Math.min(int, length);
};

const isOperator = (value: BuiltinArgument): value is OperatorValue =>
  typeof value === "object" && value.kind === "Operator";

// An argument's value, or undefined for an operator.
const getValue = (arg: BuiltinArgument) => (isOperator(arg) ? undefined : arg);

// An operator that runs natively, or through its TLA+ where evaluate gives undefined.
const createDefine =
  (callReplaced: CallReplaced) =>
  (
    name: string,
    arity: number,
    evaluate: (args: BuiltinArgument[], context: Context | undefined) => Value | undefined,
  ): Builtin => ({
    kind: "Builtin",
    name,
    arity,
    evaluate: (args, context) => evaluate(args, context) ?? callReplaced(name, args, context),
    evaluateUnary: undefined,
    evaluateBinary: undefined,
  });

// The code units that StringUnits gives the characters a TLA+ string can hold.
const isStringCharacter = (code: number) =>
  (code >= 32 && code <= 126) || code === 9 || code === 10 || code === 12 || code === 13;

// The operators of an ESCore program's module that convert TLA+ values to ESCore's: StringUnits,
// a string's code units, and a model's SetToSeq, a set's elements in the order CHOOSE takes them,
// which for a normalized set is the order it holds them in.
export const createEscoreProgramOperators = (callReplaced: CallReplaced): Builtin[] => {
  const define = createDefine(callReplaced);
  return [
    define("StringUnits", 1, (args) => {
      const text = args[0];
      if (typeof text !== "string") return undefined;
      const codes = [...text].map((character) => character.charCodeAt(0));
      return codes.every(isStringCharacter) ? createTuple(codes) : undefined;
    }),
    define("SetToSeq", 1, (args) => {
      const set = args[0];
      return typeof set === "object" && set.kind === "Set" && isNormalizedSet(set)
        ? createTuple(set.elements)
        : undefined;
    }),
  ];
};

export const createEscoreNativeOperators = (callReplaced: CallReplaced): Builtin[] => {
  const define = createDefine(callReplaced);
  // An operator of values, which falls back where an argument is an operator.
  const defineValues = (
    name: string,
    arity: number,
    evaluate: (args: Value[]) => Value | undefined,
  ) =>
    define(name, arity, (args) =>
      args.some(isOperator)
        ? undefined
        : evaluate(args.filter((arg): arg is Value => !isOperator(arg))),
    );
  // Every and some, which stop at the first result that bails or fails test.
  const defineStop = (name: string, test: (truth: boolean) => boolean, isAll: boolean) =>
    define(name, 2, (args) => {
      const callback = args[1];
      if (isOperator(args[0]) || !isOperator(callback)) return undefined;
      if (getType(args[0]) !== "larray")
        return getType(args[0]) === undefined ? undefined : createBail();
      const elements = getList(getField(args[0], "elems"));
      if (elements === undefined) return undefined;
      const results = getResults(elements, callback);
      const stop = findStop(results, test);
      return stop === undefined
        ? undefined
        : stop === -1
          ? createBool(isAll)
          : getType(results[stop]) === "bail"
            ? createBail()
            : createBool(!isAll);
    });
  return [
    defineValues("IsLComposite", 1, (args) => {
      const type = getType(args[0]);
      return type === undefined ? undefined : COMPOSITES.has(type);
    }),
    defineValues("LIsPrimitive", 1, (args) => {
      const type = getType(args[0]);
      return type === undefined ? undefined : PRIMITIVES.has(type);
    }),
    defineValues("LNumber", 1, (args) => {
      const type = getType(args[0]);
      return type === undefined ? undefined : type === "number";
    }),
    defineValues("LOwn", 1, (args) => {
      const type = getType(args[0]);
      return type === undefined ? undefined : COMPOSITES.has(type) ? createBail() : args[0];
    }),
    defineValues("LTruthy", 1, (args) => getTruthy(args[0])),
    defineValues("LNot", 1, (args) => {
      if (getType(args[0]) === "bail") return args[0];
      const truth = getTruthy(args[0]);
      return truth === undefined ? undefined : createBool(!truth);
    }),
    defineValues("LValue", 1, (args) => {
      const type = getType(args[0]);
      return type === "bail" ? args[0] : type === undefined ? undefined : getField(args[0], "v");
    }),
    defineValues("LGet", 2, (args) => {
      const type = getType(args[0]);
      if (type === undefined) return undefined;
      if (type === "lobject") return getProperty(args[0], args[1]);
      lengthUnits ??= getUnits("length");
      sizeUnits ??= getUnits("size");
      const length =
        type === "larray" && valuesEqual(args[1], lengthUnits)
          ? getList(getField(args[0], "elems"))?.length
          : type === "lset" && valuesEqual(args[1], sizeUnits)
            ? getList(getField(args[0], "elems"))?.length
            : type === "lmap" && valuesEqual(args[1], sizeUnits)
              ? getList(getField(args[0], "keys"))?.length
              : -1;
      return length === undefined ? undefined : length === -1 ? createBail() : toInt(length);
    }),
    defineValues("LIsIndex", 3, (args) => {
      if (getType(args[1]) !== "number") return getType(args[1]) === undefined ? undefined : false;
      const number = getField(args[1], "value");
      const kind = getField(number, "k");
      if (kind !== "int") return kind === undefined ? undefined : false;
      const int = getField(number, "i");
      return typeof int === "number" && typeof args[2] === "number"
        ? int >= 0 && int < args[2]
        : undefined;
    }),
    defineValues("LIndex", 2, (args) => {
      const type = getType(args[0]);
      if (type === "larray") {
        const elements = getList(getField(args[0], "elems"));
        const int = getInt(args[1]);
        if (elements !== undefined && int !== undefined && int >= 0 && int < elements.length) {
          return elements[int];
        }
        return getType(args[1]) === undefined || elements === undefined ? undefined : createBail();
      }
      if (type === "lobject" && getType(args[1]) === "string") {
        const key = getField(args[1], "value");
        return key === undefined ? undefined : getProperty(args[0], key);
      }
      return type === undefined || getType(args[1]) === undefined ? undefined : createBail();
    }),
    defineValues("LArith", 3, (args) => {
      const left = getInt(args[1]);
      const right = getInt(args[2]);
      if (left !== undefined && right !== undefined) return getArithmetic(args[0], left, right);
      const leftType = getType(args[1]);
      const rightType = getType(args[2]);
      if (leftType === undefined || rightType === undefined) return undefined;
      if (leftType === "number" && rightType === "number") return undefined;
      return args[0] === "+" && leftType === "string" && rightType === "string"
        ? undefined
        : createBail();
    }),
    defineValues("LRelation", 3, (args) => {
      const left = getInt(args[1]);
      const right = getInt(args[2]);
      if (left !== undefined && right !== undefined) {
        const relation = getRelation(args[0], left, right);
        return relation === undefined ? undefined : createBool(relation);
      }
      const leftType = getType(args[1]);
      const rightType = getType(args[2]);
      if (leftType === undefined || rightType === undefined) return undefined;
      return leftType === "number" && rightType === "number" ? undefined : createBail();
    }),
    defineValues("LStrict", 2, (args) => {
      const leftType = getType(args[0]);
      const rightType = getType(args[1]);
      if (leftType === undefined || rightType === undefined) return undefined;
      if (PRIMITIVES.has(leftType) && PRIMITIVES.has(rightType)) {
        const isEqual = isStrictlyEqual(args[0], args[1]);
        return isEqual === undefined ? undefined : createBool(isEqual);
      }
      return (PRIMITIVES.has(leftType) && COMPOSITES.has(rightType)) ||
        (COMPOSITES.has(leftType) && PRIMITIVES.has(rightType))
        ? createBool(false)
        : createBail();
    }),
    defineValues("LPut", 3, (args) => {
      if (getType(args[0]) !== "lobject" || getType(args[2]) === undefined) return undefined;
      if (getType(args[2]) === "bail") return createBail();
      const values = getField(args[0], "vals");
      return isFunction(values) && values.domain.some((key) => valuesEqual(key, args[1]))
        ? setProperty(args[0], args[1], args[2])
        : undefined;
    }),
    defineValues("LAssign", 3, (args) => {
      const valueType = getType(args[2]);
      if (valueType === undefined) return undefined;
      if (valueType === "bail") return createBail();
      const type = getType(args[0]);
      if (type === "lobject" && getType(args[1]) === "string") {
        const key = getField(args[1], "value");
        const values = getField(args[0], "vals");
        return key !== undefined &&
          isFunction(values) &&
          values.domain.some((inner) => valuesEqual(inner, key))
          ? setProperty(args[0], key, args[2])
          : undefined;
      }
      if (type === "larray") {
        const elements = getList(getField(args[0], "elems"));
        const int = getInt(args[1]);
        return elements !== undefined && int !== undefined && int >= 0 && int < elements.length
          ? updateFunction(
              args[0],
              "elems",
              (inner) => updateFunction(inner, int + 1, () => args[2], false),
              false,
            )
          : undefined;
      }
      return undefined;
    }),
    defineValues("LArray", 1, (args) => {
      const elements = getList(args[0]);
      if (elements === undefined || elements.some((element) => getType(element) === undefined)) {
        return undefined;
      }
      return elements.some((element) => getType(element) === "bail")
        ? createBail()
        : arrayShape(["larray", args[0]]);
    }),
    defineValues("LSlice", 3, (args) => {
      if (getType(args[0]) !== "larray")
        return getType(args[0]) === undefined ? undefined : createBail();
      const elements = getList(getField(args[0], "elems"));
      if (elements === undefined) return undefined;
      const start = getRelative(args[1], elements.length, 0);
      const end = getRelative(args[2], elements.length, elements.length);
      if (start === undefined || end === undefined) return undefined;
      return start < 0 || end < 0
        ? createBail()
        : createArray(elements.slice(start, Math.max(end, start)));
    }),
    define("LResults", 2, (args) => {
      const elements = isOperator(args[0]) ? undefined : getList(args[0]);
      return elements === undefined || !isOperator(args[1])
        ? undefined
        : createTuple(getResults(elements, args[1]));
    }),
    defineStop("LEvery", (truth) => truth, true),
    defineStop("LSome", (truth) => !truth, false),
    define("LMap", 2, (args) => {
      const callback = args[1];
      if (isOperator(args[0]) || !isOperator(callback)) return undefined;
      if (getType(args[0]) !== "larray")
        return getType(args[0]) === undefined ? undefined : createBail();
      const elements = getList(getField(args[0], "elems"));
      if (elements === undefined) return undefined;
      return createArray(getResults(elements, callback));
    }),
    defineValues("LSetMethod", 3, (args) => {
      const receiverType = getType(args[0]);
      const otherType = getType(args[2]);
      if (receiverType === undefined || otherType === undefined) return undefined;
      if (receiverType !== "lset" || otherType !== "lset") return createBail();
      const left = getList(getField(args[0], "elems"));
      const right = getList(getField(args[2], "elems"));
      if (left === undefined || right === undefined) return undefined;
      const types = [...left, ...right].map(getType);
      if (types.includes(undefined)) return undefined;
      if (types.some((type) => COMPOSITES.has(type ?? ""))) return createBail();
      const isIn = (list: Value[]) => (element: Value) => hasElement(list, element);
      const isOut = (list: Value[]) => (element: Value) => {
        const has = hasElement(list, element);
        return has === undefined ? undefined : !has;
      };
      const isEvery = (list: Value[], other: Value[]) => {
        const hases = list.map(isIn(other));
        return hases.includes(false) ? false : hases.includes(undefined) ? undefined : true;
      };
      const isNone = (list: Value[], other: Value[]) => {
        const hases = list.map(isIn(other));
        return hases.includes(true) ? false : hases.includes(undefined) ? undefined : true;
      };
      const toBool = (truth: boolean | undefined) =>
        truth === undefined ? undefined : createBool(truth);
      switch (args[1]) {
        case "union": {
          const kept = keepElements(right, isOut(left));
          return createSet(kept && [...left, ...kept]);
        }
        case "intersection":
          return createSet(
            left.length <= right.length
              ? keepElements(left, isIn(right))
              : keepElements(right, isIn(left)),
          );
        case "difference":
          return createSet(keepElements(left, isOut(right)));
        case "symmetricDifference": {
          const leftKept = keepElements(left, isOut(right));
          const rightKept = keepElements(right, isOut(left));
          return createSet(leftKept && rightKept && [...leftKept, ...rightKept]);
        }
        case "isSubsetOf":
          return toBool(left.length <= right.length ? isEvery(left, right) : false);
        case "isSupersetOf":
          return toBool(left.length >= right.length ? isEvery(right, left) : false);
        case "isDisjointFrom":
          return toBool(isNone(left, right));
        default:
          return createBail();
      }
    }),
    define("LFilter", 2, (args) => {
      const callback = args[1];
      if (isOperator(args[0]) || !isOperator(callback)) return undefined;
      if (getType(args[0]) !== "larray")
        return getType(args[0]) === undefined ? undefined : createBail();
      const elements = getList(getField(args[0], "elems"));
      if (elements === undefined) return undefined;
      const results = getResults(elements, callback);
      if (results.some((result) => getType(result) === "bail")) return createBail();
      const truths = results.map(getTruthy);
      return truths.some((truth) => truth === undefined)
        ? undefined
        : createArray(elements.filter((_, index) => truths[index]));
    }),
  ];
};

const PLUS = 43;
const MINUS = 45;

// ESNumber's operators that tla-ts runs natively, while TLC runs the module's TLA+. StrToNum reads
// a string of an optional sign and decimal digits whose nonzero value is below 2^30 as
// NumIntNum(value), the record StringToNumber builds for it, and falls back for any other string.
// A zero falls back because StringToNumber gives the constant PosZero or NegZero, which TLC
// normalizes, so it prints its fields in another order.
export const createEsNumberOperators = (callReplaced: CallReplaced): Builtin[] => {
  const define = createDefine(callReplaced);
  return [
    define("StrToNum", 1, (args) => {
      const units = getTuple(getValue(args[0]));
      if (units === undefined || units.length === 0 || units.length > 11) return undefined;
      const sign = units[0] === PLUS || units[0] === MINUS ? units[0] : undefined;
      const digits = sign === undefined ? units : units.slice(1);
      if (digits.length === 0 || digits.length > 10) return undefined;
      let value = 0;
      for (const digit of digits) {
        if (typeof digit !== "number" || digit < 48 || digit > 57) return undefined;
        value = value * 10 + (digit - 48);
      }
      if (value === 0 || value >= INT_LIMIT) return undefined;
      const integer = sign === MINUS ? -value : value;
      return numberShape(["int", integer < 0, integer, createTuple([]), 0]);
    }),
  ];
};

// The value of a lazy builtin's argument as TLA+ reads it where it applies the argument as a
// function, which keeps the functions the argument builds lazy, or undefined where the argument
// isn't an expression to evaluate.
const getKeepLazyValue = (arg: BuiltinArgument, context: Context | undefined) =>
  isOperator(arg) && arg.expression !== undefined && context !== undefined
    ? evaluate(arg.expression, toKeepLazyContext(context))
    : undefined;

const isLazyFunction = (value: Value) => typeof value === "object" && value.kind === "LazyFunction";

// ESCore's HeapPageSize and NamedBucket.
const HEAP_PAGE_SIZE = 256;
const NAMED_BUCKET = -1;
// The units of "4294967295", 2^32 - 1, the least integer that isn't an array index.
const INDEX_LIMIT = [52, 50, 57, 52, 57, 54, 55, 50, 57, 53];

// Whether units of digits are below INDEX_LIMIT, as DigitsBelow orders them.
const isBelowIndexLimit = (units: number[]) => {
  if (units.length !== INDEX_LIMIT.length) return units.length < INDEX_LIMIT.length;
  const index = units.findIndex((unit, position) => unit !== INDEX_LIMIT[position]);
  return index !== -1 && units[index] < INDEX_LIMIT[index];
};

const isIntegers = (values: Value[]): values is number[] =>
  values.every((value) => typeof value === "number");

// The units of a key that IsArrayIndex holds for, an empty list for a key it doesn't hold for,
// or undefined where the key isn't a record with a type or a string's units aren't all integers.
const getIndexUnits = (key: Value | undefined) => {
  const type = getType(key);
  if (type === undefined) return undefined;
  if (type !== "string") return [];
  const units = getTuple(getField(key, "value"));
  if (units === undefined || !isIntegers(units)) return undefined;
  return units.length > 0 &&
    units.every((unit) => unit >= 48 && unit <= 57) &&
    (units.length === 1 || units[0] !== 48) &&
    isBelowIndexLimit(units)
    ? units
    : [];
};

// The code units of the strings NumToString gives: decimal digits, "+", "-", ".", "e", and the
// letters of "NaN" and "Infinity".
const NUMBER_STRING_UNITS = new Set([
  ...Array.from({ length: 10 }, (_, index) => 48 + index),
  43,
  45,
  46,
  101,
  78,
  97,
  73,
  110,
  102,
  105,
  116,
  121,
]);

// The integer that units spell where they are NumToString's form of an integer below 2^30 other
// than 0, or undefined.
const getCanonicalInteger = (units: number[]) => {
  const isNegative = units[0] === MINUS;
  const digits = isNegative ? units.slice(1) : units;
  if (digits.length === 0 || digits.length > 10 || digits[0] === 48) return undefined;
  if (!digits.every((unit) => unit >= 48 && unit <= 57)) return undefined;
  const value = digits.reduce((total, unit) => total * 10 + unit - 48, 0);
  if (value >= INT_LIMIT) return undefined;
  return isNegative ? -value : value;
};

// The bucket of an object's props that PropBucket gives a key of these units.
const getBucket = (units: number[]) =>
  units.length === 0
    ? NAMED_BUCKET
    : units.length <= 2
      ? 0
      : units.slice(0, -2).reduce((value, unit) => value * 10 + unit - 48, 0);

// The value of one of the runtime's CONSTANTS as its TLA+ reads it, which the check keys by the
// name and the module that declares it, or undefined where the configuration binds it to an
// expression rather than a value. An INSTANCE copies the TLA+ of the runtime's operators instead.
const getConstant = (context: Context | undefined, name: string) =>
  context?.environment.constants.get(`${name}@ESRuntime`);

// The record of a heap's pages at an index, HeapGet(h, i), or undefined.
const getHeapEntry = (pages: Value | undefined, index: Value) =>
  typeof index === "number" && Number.isInteger(index) && index >= 1
    ? getTuple(getTuple(pages)?.[Math.floor((index - 1) / HEAP_PAGE_SIZE)])?.[
        (index - 1) % HEAP_PAGE_SIZE
      ]
    : undefined;

// OrdinaryGetOwnProperty(o, k): the descriptor of k in o's props, or absent, or undefined where o
// or k isn't one the TLA+ reads without failing.
const getOwnDescriptor = (
  object: Value | undefined,
  key: Value | undefined,
  absent: Value | undefined,
) => {
  const units = getIndexUnits(key);
  const props = getField(object, "props");
  if (units === undefined || key === undefined || !isFunction(props)) return undefined;
  const bucket = getBucket(units);
  const keys = isElementOf(bucket, getDomain(props)) ? applyFunction(props, bucket) : undefined;
  if (keys !== undefined && !isFunction(keys)) return undefined;
  return keys !== undefined && isElementOf(key, getDomain(keys))
    ? applyFunction(keys, key)
    : absent;
};

const DECLARATIVE_KINDS = new Set(["declarative", "catch", "function", "module"]);
const okShape = createShape(["s", "c"]);
const completionShape = createShape(["type", "value", "target"]);

// Ok(s, v), whose completion's target is Empty.
const createOk = (state: Value, value: Value, empty: Value) =>
  okShape([state, completionShape(["normal", value, empty])]);

// E(s, e), the environment at an index of a state's envs, or undefined.
const getEnvironment = (state: Value, index: Value) =>
  getHeapEntry(getField(getField(state, "envs"), "pages"), index);

// The descriptor that an object environment's object holds of a name as its own property, where
// the object is ordinary, so that HasProperty and GetV read it through OrdinaryGetOwnProperty, or
// undefined. A proxy or any other exotic object, such as a host's, runs the TLA+.
const getObjectDescriptor = (state: Value, environment: Value, name: Value) => {
  const object = getHeapEntry(
    getField(getField(state, "objs"), "pages"),
    getField(getField(environment, "obj"), "id") ?? 0,
  );
  return getField(object, "class") === "ordinary"
    ? getOwnDescriptor(object, valueShape(["string", name]), undefined)
    : undefined;
};

interface BindingConstants {
  empty: Value;
  absent: Value;
}

// HasBinding(s, e, name) where e is a declarative environment, a global one whose declarative
// part or object holds name, or an object one without a with statement whose object holds it.
const getHasBinding = (
  state: Value,
  environment: Value,
  name: Value,
  constants: BindingConstants,
): Value | undefined => {
  const kind = getField(environment, "kind");
  const bindings = getField(environment, "b");
  if (typeof kind === "string" && DECLARATIVE_KINDS.has(kind)) {
    return isFunction(bindings)
      ? createOk(state, createBool(isElementOf(name, getDomain(bindings))), constants.empty)
      : undefined;
  }
  if (kind === "global") {
    const declarative = getField(getEnvironment(state, getField(environment, "declRec") ?? 0), "b");
    if (!isFunction(declarative)) return undefined;
    if (isElementOf(name, getDomain(declarative))) {
      return createOk(state, createBool(true), constants.empty);
    }
    const objectEnvironment = getEnvironment(state, getField(environment, "objRec") ?? 0);
    return getField(objectEnvironment, "kind") === "object" && objectEnvironment !== undefined
      ? getHasBinding(state, objectEnvironment, name, constants)
      : undefined;
  }
  return kind === "object" &&
    getField(environment, "withEnv") === false &&
    getObjectDescriptor(state, environment, name) !== undefined
    ? createOk(state, createBool(true), constants.empty)
    : undefined;
};

// GetBindingValue(s, e, name, strict) where name is an initialized binding of a declarative
// environment, other than a module's import, or a data property that an object environment's
// object, or a global one's, holds as its own.
const getBindingValue = (
  state: Value,
  environment: Value,
  name: Value,
  constants: BindingConstants,
): Value | undefined => {
  const kind = getField(environment, "kind");
  const bindings = getField(environment, "b");
  if (typeof kind === "string" && DECLARATIVE_KINDS.has(kind)) {
    if (!isFunction(bindings) || !isElementOf(name, getDomain(bindings))) return undefined;
    const binding = applyFunction(bindings, name);
    const value = getField(binding, "value");
    if (value === undefined || getField(binding, "init") !== true) return undefined;
    return kind === "module" && (getType(value) ?? "import") === "import"
      ? undefined
      : createOk(state, value, constants.empty);
  }
  if (kind === "global") {
    const declarativeEnvironment = getEnvironment(state, getField(environment, "declRec") ?? 0);
    const declarative = getField(declarativeEnvironment, "b");
    if (!isFunction(declarative) || declarativeEnvironment === undefined) return undefined;
    const target = isElementOf(name, getDomain(declarative))
      ? declarativeEnvironment
      : getEnvironment(state, getField(environment, "objRec") ?? 0);
    return target === undefined ? undefined : getBindingValue(state, target, name, constants);
  }
  if (kind !== "object") return undefined;
  const descriptor = getObjectDescriptor(state, environment, name);
  const value = getField(descriptor, "value");
  const writable = getField(descriptor, "writable");
  return value !== undefined &&
    writable !== undefined &&
    (!isEqualLikeTlc(value, constants.absent) || !isEqualLikeTlc(writable, constants.absent))
    ? createOk(state, value, constants.empty)
    : undefined;
};

// HasBinding or GetBindingValue, which reads its state and environment as E(s, e) reads them, as
// it applies them, then the name, and never strict where it runs natively. Any other case falls
// back with the arguments it has read and the rest as they were.
const createBindingOperator = (
  callReplaced: CallReplaced,
  name: string,
  arity: number,
  getBinding: typeof getHasBinding,
): Builtin => ({
  kind: "Builtin",
  name,
  arity,
  isLazy: true,
  evaluate: (args, context) => {
    const state = getKeepLazyValue(args[0], context);
    const pages = getField(getField(state, "envs"), "pages");
    if (state === undefined || pages === undefined) {
      return callReplaced(name, state === undefined ? args : [state, ...args.slice(1)], context);
    }
    const index = getKeepLazyValue(args[1], context);
    const environment = index === undefined ? undefined : getHeapEntry(pages, index);
    if (index === undefined || environment === undefined) {
      return callReplaced(name, [state, index ?? args[1], ...args.slice(2)], context);
    }
    const nameArgument = args[2];
    const bindingName = isOperator(nameArgument) ? nameArgument.call([]) : nameArgument;
    const empty = getConstant(context, "Empty");
    const absent = getConstant(context, "Absent");
    // The TLA+ compares descriptors with Absent, which can fail only where Absent isn't an untyped
    // model value.
    const result =
      empty === undefined ||
      absent === undefined ||
      !isModelValue(absent) ||
      absent.type !== undefined
        ? undefined
        : getBinding(state, environment, bindingName, { empty, absent });
    return result ?? callReplaced(name, [state, index, bindingName, ...args.slice(3)], context);
  },
  evaluateUnary: undefined,
  evaluateBinary: undefined,
});

// ESCore's operators on its heap and property keys that tla-ts runs natively, while TLC runs the
// runtime's TLA+: HeapGet, a heap's record at an index, IsArrayIndex, PropBucket, the bucket of an
// object's props that holds a key, and CanonicalNumericIndexString, which gives Undefined for a
// string NumToString can't give and a nonzero integer's Number for its canonical string. Each falls
// back where its operands aren't the common ones.
export const createEsRuntimeOperators = (callReplaced: CallReplaced): Builtin[] => {
  const define = createDefine(callReplaced);
  return [
    {
      kind: "Builtin",
      name: "HeapGet",
      arity: 2,
      isLazy: true,
      // HeapGet's TLA+ reads h.pages, then i, as it applies them, which keeps the functions they
      // build lazy, and fails on h.pages before it reads i.
      evaluate: (args, context) => {
        const heap = getKeepLazyValue(args[0], context);
        const pages = getField(heap, "pages");
        if (heap === undefined || (pages === undefined && !isLazyFunction(heap))) {
          return callReplaced("HeapGet", heap === undefined ? args : [heap, args[1]], context);
        }
        const index = getKeepLazyValue(args[1], context);
        if (index === undefined) return callReplaced("HeapGet", [heap, args[1]], context);
        return getHeapEntry(pages, index) ?? callReplaced("HeapGet", [heap, index], context);
      },
      evaluateUnary: undefined,
      evaluateBinary: undefined,
    },
    define("IsArrayIndex", 1, (args) => {
      const units = getIndexUnits(getValue(args[0]));
      return units === undefined ? undefined : units.length > 0;
    }),
    define("CanonicalNumericIndexString", 1, (args) => {
      const units = getTuple(getValue(args[0]));
      if (units === undefined || !isIntegers(units)) return undefined;
      if (units.some((unit) => !NUMBER_STRING_UNITS.has(unit))) return typeShape(["undefined"]);
      const integer = getCanonicalInteger(units);
      return integer === undefined ? undefined : createInt(integer);
    }),
    define("PropBucket", 1, (args) => {
      const units = getIndexUnits(getValue(args[0]));
      return units === undefined ? undefined : getBucket(units);
    }),
    // OrdinaryGetOwnProperty(o, k): the descriptor of k in o's props, or Absent.
    define("OrdinaryGetOwnProperty", 2, (args, context) =>
      getOwnDescriptor(getValue(args[0]), getValue(args[1]), getConstant(context, "Absent")),
    ),
    createBindingOperator(callReplaced, "HasBinding", 3, getHasBinding),
    createBindingOperator(callReplaced, "GetBindingValue", 4, getBindingValue),
  ];
};
