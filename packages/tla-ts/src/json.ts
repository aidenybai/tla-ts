import { defineStateOperator, describeJavaOverride, getValue } from "./builtins";
import { TlaEvaluationError } from "./errors";
import type { Builtin } from "./evaluate";
import {
  createRecord,
  createTuple,
  formatValue,
  getSequenceElements,
  isFunctionValue,
  isSetValue,
  toFiniteFunction,
  toFiniteSet,
  type Value,
} from "./values";

export interface FileSystem {
  readFile: ((path: string) => string | undefined) | undefined;
  writeFile: ((path: string, content: string) => void) | undefined;
}

interface ParseContext {
  source?: string;
}

const TO_JSON =
  "public static tlc2.value.impl.StringValue tlc2.module.Json.toJson(tlc2.value.IValue) throws java.io.IOException";
const TO_JSON_ARRAY =
  "public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonArray(tlc2.value.IValue) throws java.io.IOException";
const TO_JSON_OBJECT =
  "public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonObject(tlc2.value.IValue) throws java.io.IOException";
const SERIALIZE =
  "public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.serialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException";
const ND_SERIALIZE =
  "public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.ndSerialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException";
const DESERIALIZE =
  "public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException";
const ND_DESERIALIZE =
  "public static tlc2.value.IValue tlc2.module.Json.ndDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException";

const isRecord = (value: Value) => {
  if (!isFunctionValue(value)) return false;
  const domain = toFiniteFunction(value).domain;
  return domain.length > 0 && domain.every((key) => typeof key === "string");
};

const getJavaClass = (value: Value) => {
  if (typeof value === "number") return "IntValue";
  if (typeof value === "boolean") return "BoolValue";
  if (typeof value === "string") return "StringValue";
  switch (value.kind) {
    case "ModelValue":
      return "ModelValue";
    case "Set":
      return "SetEnumValue";
    case "Interval":
      return "IntervalValue";
    case "InfiniteSet":
    case "SequenceSet":
      return "UserValue";
    case "Subset":
      return "SubsetValue";
    case "FunctionSet":
      return "SetOfFcnsValue";
    case "RecordSet":
      return "SetOfRcdsValue";
    case "ProductSet":
      return "SetOfTuplesValue";
    case "SetOperation":
      return value.operator === "\\cup"
        ? "SetCupValue"
        : value.operator === "\\cap"
          ? "SetCapValue"
          : "SetDiffValue";
    case "FilteredSet":
      return "SetPredValue";
    case "LazyFunction":
      return "FcnLambdaValue";
    case "Function":
      return isRecord(value)
        ? "RecordValue"
        : getSequenceElements(value)
          ? "TupleValue"
          : "FcnRcdValue";
  }
};

const createUnsupportedError = (method: string, value: Value) =>
  new TlaEvaluationError(
    describeJavaOverride(
      method,
      `Cannot convert value: unsupported value type tlc2.value.impl.${getJavaClass(value)}`,
    ),
  );

const createCastError = (method: string, value: Value) =>
  new TlaEvaluationError(
    describeJavaOverride(
      method,
      `Cannot cast tlc2.value.impl.${getJavaClass(value)} to tlc2.value.impl.StringValue`,
    ),
  );

const toJsonString = (text: string) =>
  JSON.stringify(text).replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");

const toSetJson = (value: Value, method: string) => {
  if (typeof value === "object" && (value.kind === "InfiniteSet" || value.kind === "SequenceSet")) {
    throw createUnsupportedError(method, value);
  }
  return `[${toFiniteSet(value)
    .elements.map((element) => toJson(element, method))
    .join(",")}]`;
};

const toFunctionJson = (value: Value, method: string) => {
  const fn = toFiniteFunction(value);
  const elements = getSequenceElements(fn);
  if (elements) return `[${elements.map((element) => toJson(element, method)).join(",")}]`;
  return `{${fn.domain
    .map(
      (key, index) =>
        `${toJsonString(typeof key === "string" ? key : formatValue(key))}:${toJson(fn.range[index], method)}`,
    )
    .join(",")}}`;
};

const toJson = (value: Value, method: string): string => {
  if (typeof value === "string") return toJsonString(value);
  if (typeof value !== "object") return String(value);
  if (value.kind === "ModelValue") return toJsonString(value.name);
  if (isSetValue(value)) return toSetJson(value, method);
  return toFunctionJson(value, method);
};

const toJsonArray = (value: Value) => {
  if (isSetValue(value)) return toSetJson(value, TO_JSON_ARRAY);
  if (!isFunctionValue(value) || isRecord(value))
    throw createUnsupportedError(TO_JSON_ARRAY, value);
  return toFunctionJson(value, TO_JSON_ARRAY);
};

const toJsonObject = (value: Value) => {
  if (!isFunctionValue(value)) throw createUnsupportedError(TO_JSON_OBJECT, value);
  return toFunctionJson(value, TO_JSON_OBJECT);
};

// TLC reads a JSON number with Gson's intValue, which truncates the exact decimal toward zero and
// keeps its low 32 bits, so 3000000000 becomes -1294967296 and 1.5 becomes 1.
const toInteger = (source: string) => {
  const [, sign, whole = "0", fraction = "", exponent = "0"] =
    /^(-?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(source) ?? [];
  const digits = BigInt(whole + fraction);
  const shift = Number(exponent) - fraction.length;
  const magnitude = shift >= 0 ? digits * 10n ** BigInt(shift) : digits / 10n ** BigInt(-shift);
  return Number(BigInt.asIntN(32, sign === "-" ? -magnitude : magnitude));
};

const fromJson = (json: unknown, method: string): Value => {
  if (typeof json === "boolean" || typeof json === "string" || typeof json === "number") {
    return json;
  }
  if (Array.isArray(json)) return createTuple(json.map((element) => fromJson(element, method)));
  if (json !== null && typeof json === "object") {
    return createRecord(
      Object.entries(json).map(([key, field]): [string, Value] => [key, fromJson(field, method)]),
    );
  }
  throw new TlaEvaluationError(
    describeJavaOverride(method, `Cannot convert value: unsupported JSON value ${String(json)}`),
  );
};

const parseJson = (text: string, method: string): Value => {
  if (text.trim() === "") return fromJson(null, method);
  try {
    return fromJson(
      JSON.parse(text, (_, value: unknown, context?: ParseContext) =>
        typeof value === "number" ? toInteger(context?.source ?? String(value)) : value,
      ),
      method,
    );
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    throw new TlaEvaluationError(describeJavaOverride(method, error.message), error);
  }
};

const getPath = (value: Value, method: string) => {
  if (typeof value !== "string") throw createCastError(method, value);
  return value;
};

const readText = (files: FileSystem, path: string, method: string) => {
  const text = files.readFile?.(path);
  if (text === undefined) {
    throw new TlaEvaluationError(
      describeJavaOverride(method, `${path} (No such file or directory)`),
    );
  }
  return text;
};

export const createJsonOperators = (files: FileSystem): Builtin[] => [
  defineStateOperator("ToJson", 1, (args) => toJson(getValue(args, 0, "ToJson"), TO_JSON)),
  defineStateOperator("ToJsonArray", 1, (args) => toJsonArray(getValue(args, 0, "ToJsonArray"))),
  defineStateOperator("ToJsonObject", 1, (args) => toJsonObject(getValue(args, 0, "ToJsonObject"))),
  defineStateOperator("JsonSerialize", 2, (args) => {
    const path = getPath(getValue(args, 0, "JsonSerialize"), SERIALIZE);
    const value = getValue(args, 1, "JsonSerialize");
    if (!getSequenceElements(value) && !isRecord(value)) {
      throw new TlaEvaluationError(
        `The second argument of JsonSerialize should be a sequence or record, but instead it is:\n${formatValue(value)}`,
      );
    }
    files.writeFile?.(path, toJson(value, SERIALIZE));
    return true;
  }),
  defineStateOperator("ndJsonSerialize", 2, (args) => {
    const path = getPath(getValue(args, 0, "ndJsonSerialize"), ND_SERIALIZE);
    const value = getValue(args, 1, "ndJsonSerialize");
    const elements = getSequenceElements(value);
    if (!elements) {
      throw new TlaEvaluationError(
        `The second argument of ndJsonSerialize should be a sequence, but instead it is:\n${formatValue(value)}`,
      );
    }
    files.writeFile?.(
      path,
      elements.map((element) => `${toJson(element, ND_SERIALIZE)}\n`).join(""),
    );
    return true;
  }),
  defineStateOperator("JsonDeserialize", 1, (args) => {
    const path = getPath(getValue(args, 0, "JsonDeserialize"), DESERIALIZE);
    return parseJson(readText(files, path, DESERIALIZE), DESERIALIZE);
  }),
  defineStateOperator("ndJsonDeserialize", 1, (args) => {
    const path = getPath(getValue(args, 0, "ndJsonDeserialize"), ND_DESERIALIZE);
    return createTuple(
      readText(files, path, ND_DESERIALIZE)
        .split(/\r\n|\r|\n/)
        .map((line) => line.trim())
        .filter((line) => line !== "")
        .map((line) => parseJson(line, ND_DESERIALIZE)),
    );
  }),
];
