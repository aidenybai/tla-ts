import {
  createModuleArgumentError,
  defineStateOperator,
  getJavaClassName,
  getValue,
  isOutOfRange,
  overrideWithJava,
} from "./builtins";
import { TlaEvaluationError } from "./errors";
import type { Builtin } from "./evaluate";
import { readJson, type JsonElement } from "./json-reader";
import {
  createRecord,
  createTuple,
  formatValue,
  getSequenceElements,
  isFunctionValue,
  isTlcEnumerable,
  toFiniteFunction,
  toFiniteSet,
  type FunctionValue,
  type Value,
  rankString,
} from "./values";

export interface FileSystem {
  readFile: ((path: string) => string | undefined) | undefined;
  writeFile: ((path: string, content: string) => void) | undefined;
}

// Value#toRcd: a function whose domain holds only strings.
const toRecord = (value: Value) => {
  if (!isFunctionValue(value)) return undefined;
  const functionValue = toFiniteFunction(value);
  const fields = functionValue.domain.flatMap((key, index): [string, Value][] =>
    typeof key === "string" ? [[key, functionValue.range[index]]] : [],
  );
  return fields.length === functionValue.domain.length ? createRecord(fields) : undefined;
};

const createUnsupportedError = (value: Value) =>
  new TlaEvaluationError(
    `Cannot convert value: unsupported value type tlc2.value.impl.${getJavaClassName(value)}`,
  );

const toJsonString = (text: string) =>
  JSON.stringify(text).replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");

const toArrayJson = (elements: Value[]) => `[${elements.map(toJson).join(",")}]`;

const toObjectJson = (functionValue: FunctionValue) =>
  `{${functionValue.domain
    .map(
      (key, index) =>
        `${toJsonString(typeof key === "string" ? key : formatValue(key))}:${toJson(functionValue.range[index])}`,
    )
    .join(",")}}`;

// TLC writes a function other than a tuple or a record as an array when it is a sequence.
const toFunctionJson = (value: Value) => {
  const functionValue = toFiniteFunction(value);
  const elements = getSequenceElements(functionValue);
  return elements ? toArrayJson(elements) : toObjectJson(functionValue);
};

const isFunctionClass = (className: string) =>
  className === "FcnRcdValue" || className === "FcnLambdaValue";

const toJson = (value: Value): string => {
  if (typeof value === "string") return toJsonString(value);
  if (typeof value !== "object") return String(value);
  if (value.kind === "ModelValue") return toJsonString(value.name);
  const className = getJavaClassName(value);
  if (className === "RecordValue") return toObjectJson(toFiniteFunction(value));
  if (className === "TupleValue") return toArrayJson(toFiniteFunction(value).range);
  if (isFunctionClass(className)) return toFunctionJson(value);
  if (isTlcEnumerable(value)) return toArrayJson(toFiniteSet(value).elements);
  throw createUnsupportedError(value);
};

const toJsonArray = (value: Value) => {
  const className = getJavaClassName(value);
  if (className === "TupleValue") return toArrayJson(toFiniteFunction(value).range);
  if (isFunctionClass(className)) return toFunctionJson(value);
  if (isTlcEnumerable(value)) return toArrayJson(toFiniteSet(value).elements);
  throw createUnsupportedError(value);
};

const toJsonObject = (value: Value) => {
  const className = getJavaClassName(value);
  if (className === "RecordValue") return toObjectJson(toFiniteFunction(value));
  if (className === "TupleValue") {
    return `{${toFiniteFunction(value)
      .range.map((element, index) => `"${index}":${toJson(element)}`)
      .join(",")}}`;
  }
  if (isFunctionClass(className)) return toFunctionJson(value);
  throw createUnsupportedError(value);
};

const fromJson = (element: JsonElement): Value => {
  if (element === null) {
    throw new TlaEvaluationError("Cannot convert value: unsupported JSON value null");
  }
  if (typeof element === "boolean") return element;
  if (typeof element === "string") return rankString(element);
  if (Array.isArray(element)) return createTuple(element.map(fromJson));
  if (element instanceof Map) {
    return createRecord(
      [...element].map((member): [string, Value] => [rankString(member[0]), fromJson(member[1])]),
    );
  }
  const value = Number(element.literal);
  if (!/^-?\d+$/.test(element.literal) || isOutOfRange(value)) {
    throw new TlaEvaluationError(
      `Cannot convert value: expected a 32-bit integer JSON number, but found ${element.literal}`,
    );
  }
  return value || 0;
};

const getPath = (value: Value) => {
  if (typeof value !== "string") {
    throw new TlaEvaluationError(
      `Cannot cast tlc2.value.impl.${getJavaClassName(value)} to tlc2.value.impl.StringValue`,
    );
  }
  return value;
};

const readText = (files: FileSystem, path: string) => {
  const text = files.readFile?.(path);
  if (text === undefined) throw new TlaEvaluationError(`${path} (No such file or directory)`);
  return text;
};

export const createJsonOperators = (files: FileSystem): Builtin[] => [
  overrideWithJava(
    defineStateOperator("ToJson", 1, (args) => rankString(toJson(getValue(args, 0, "ToJson")))),
    "public static tlc2.value.impl.StringValue tlc2.module.Json.toJson(tlc2.value.IValue) throws java.io.IOException",
  ),
  overrideWithJava(
    defineStateOperator("ToJsonArray", 1, (args) =>
      rankString(toJsonArray(getValue(args, 0, "ToJsonArray"))),
    ),
    "public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonArray(tlc2.value.IValue) throws java.io.IOException",
  ),
  overrideWithJava(
    defineStateOperator("ToJsonObject", 1, (args) =>
      rankString(toJsonObject(getValue(args, 0, "ToJsonObject"))),
    ),
    "public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonObject(tlc2.value.IValue) throws java.io.IOException",
  ),
  overrideWithJava(
    defineStateOperator("JsonSerialize", 2, (args) => {
      const path = getPath(getValue(args, 0, "JsonSerialize"));
      const value = getValue(args, 1, "JsonSerialize");
      if (!getSequenceElements(value) && !toRecord(value)) {
        throw createModuleArgumentError("second", "JsonSerialize", "sequence or record", value);
      }
      files.writeFile?.(path, toJson(value));
      return true;
    }),
    "public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.serialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException",
  ),
  overrideWithJava(
    defineStateOperator("ndJsonSerialize", 2, (args) => {
      const path = getPath(getValue(args, 0, "ndJsonSerialize"));
      const value = getValue(args, 1, "ndJsonSerialize");
      const elements = getSequenceElements(value);
      if (!elements) {
        throw createModuleArgumentError("second", "ndJsonSerialize", "sequence", value);
      }
      files.writeFile?.(path, elements.map((element) => `${toJson(element)}\n`).join(""));
      return true;
    }),
    "public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.ndSerialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException",
  ),
  overrideWithJava(
    defineStateOperator("JsonDeserialize", 1, (args) =>
      fromJson(readJson(readText(files, getPath(getValue(args, 0, "JsonDeserialize"))))),
    ),
    "public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException",
  ),
  overrideWithJava(
    defineStateOperator("ndJsonDeserialize", 1, (args) =>
      createTuple(
        readText(files, getPath(getValue(args, 0, "ndJsonDeserialize")))
          .split(/\r\n|\r|\n/)
          // Java's String#trim strips every character up to the space.
          .map((line) => line.replace(/^[^!-\uffff]+|[^!-\uffff]+$/g, ""))
          .filter((line) => line !== "")
          .map((line) => fromJson(readJson(line))),
      ),
    ),
    "public static tlc2.value.IValue tlc2.module.Json.ndDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException",
  ),
];
