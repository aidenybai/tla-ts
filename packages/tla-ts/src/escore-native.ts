import type { Builtin, BuiltinArgument, Context, OperatorValue } from "./evaluate";
import {
  compareValues,
  createSortedFunction,
  createTuple,
  getSequenceElements,
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
  updateFunction(object, "vals", (values) => updateFunction(values, key, () => value));

// IsStrictlyEqual of two primitives, or undefined for Numbers other than "int" ones.
const isStrictlyEqual = (left: Value, right: Value) => {
  const leftType = getType(left);
  if (leftType !== getType(right)) return false;
  if (leftType !== "number") return valuesEqual(left, right);
  const leftInt = getInt(left);
  const rightInt = getInt(right);
  return leftInt === undefined || rightInt === undefined ? undefined : leftInt === rightInt;
};

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

export const createEscoreNativeOperators = (callReplaced: CallReplaced): Builtin[] => {
  const define = (
    name: string,
    arity: number,
    evaluate: (args: BuiltinArgument[]) => Value | undefined,
  ): Builtin => ({
    kind: "Builtin",
    name,
    arity,
    evaluate: (args, context) => evaluate(args) ?? callReplaced(name, args, context),
    evaluateUnary: undefined,
    evaluateBinary: undefined,
  });
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
          ? updateFunction(args[0], "elems", (inner) =>
              updateFunction(inner, int + 1, () => args[2]),
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
