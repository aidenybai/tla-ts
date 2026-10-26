import { defineStateOperator, getValue } from "./builtins";
import { TlaEvaluationError, TlaModuleError } from "./errors";
import type { Builtin } from "./evaluate";
import {
  checkInteger,
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

type JsonValue = boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const toArray = (value: Value): JsonValue[] => {
  if (isSetValue(value)) return toFiniteSet(value).elements.map(toJson);
  const elements = getSequenceElements(value);
  if (elements) return elements.map(toJson);
  return Object.values(toObject(value));
};

const toObject = (value: Value): { [key: string]: JsonValue } => {
  if (!isFunctionValue(value)) {
    throw new TlaEvaluationError(`Cannot convert ${formatValue(value)} to a JSON object`);
  }
  const fn = toFiniteFunction(value);
  return Object.fromEntries(
    fn.domain.map((key, index): [string, JsonValue] => [
      typeof key === "string" ? key : formatValue(key),
      toJson(fn.range[index]),
    ]),
  );
};

const toJson = (value: Value): JsonValue => {
  if (typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return value;
  }
  if (value.kind === "ModelValue") return value.name;
  if (isSetValue(value)) return toArray(value);
  if (getSequenceElements(value)) return toArray(value);
  return toObject(value);
};

const serialize = (json: JsonValue) =>
  JSON.stringify(json).replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");

const fromJson = (json: unknown): Value => {
  if (typeof json === "boolean" || typeof json === "string") return json;
  if (typeof json === "number") return checkInteger(Math.trunc(json));
  if (Array.isArray(json)) return createTuple(json.map(fromJson));
  if (json !== null && typeof json === "object") {
    return createRecord(
      Object.entries(json).map(([key, field]): [string, Value] => [key, fromJson(field)]),
    );
  }
  throw new TlaEvaluationError(`Cannot convert value: unsupported JSON value ${String(json)}`);
};

const getPath = (value: Value, name: string) => {
  if (typeof value !== "string") {
    throw new TlaEvaluationError(`${name} expects a file name but received ${formatValue(value)}`);
  }
  return value;
};

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new TlaEvaluationError(`Cannot parse JSON: ${text}`, error);
  }
};

const readText = (files: FileSystem, path: string) => {
  const text = files.readFile?.(path);
  if (text === undefined) throw new TlaEvaluationError(`Cannot read the file ${path}`);
  return text;
};

export const createJsonOperators = (files: FileSystem): Builtin[] => [
  defineStateOperator("ToJson", 1, (args) => serialize(toJson(getValue(args, 0, "ToJson")))),
  defineStateOperator("ToJsonArray", 1, (args) =>
    serialize(toArray(getValue(args, 0, "ToJsonArray"))),
  ),
  defineStateOperator("ToJsonObject", 1, (args) => {
    const value = getValue(args, 0, "ToJsonObject");
    return serialize(getSequenceElements(value) ? toArray(value) : toObject(value));
  }),
  defineStateOperator("JsonSerialize", 2, (args) => {
    files.writeFile?.(
      getPath(getValue(args, 0, "JsonSerialize"), "JsonSerialize"),
      serialize(toJson(getValue(args, 1, "JsonSerialize"))),
    );
    return true;
  }),
  defineStateOperator("ndJsonSerialize", 2, (args) => {
    const value = getValue(args, 1, "ndJsonSerialize");
    const elements = getSequenceElements(value);
    if (!elements) {
      throw new TlaModuleError(
        `The second argument of ndJsonSerialize should be a sequence, but instead it is:\n${formatValue(value)}`,
      );
    }
    files.writeFile?.(
      getPath(getValue(args, 0, "ndJsonSerialize"), "ndJsonSerialize"),
      elements.map((element) => `${serialize(toJson(element))}\n`).join(""),
    );
    return true;
  }),
  defineStateOperator("JsonDeserialize", 1, (args) =>
    fromJson(
      parseJson(readText(files, getPath(getValue(args, 0, "JsonDeserialize"), "JsonDeserialize"))),
    ),
  ),
  defineStateOperator("ndJsonDeserialize", 1, (args) =>
    createTuple(
      readText(files, getPath(getValue(args, 0, "ndJsonDeserialize"), "ndJsonDeserialize"))
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "")
        .map((line) => fromJson(parseJson(line))),
    ),
  ),
];
