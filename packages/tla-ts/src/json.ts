import {
  createClassCastError,
  createModuleArgumentError,
  defineLazyOperator,
  defineOperator,
  getJavaClassName,
  getThunk,
  getValue,
  isOutOfRange,
  overrideWithJava,
} from "./builtins";
import { TlaEvaluationError, TlaFileError, TlaSetBoundError, TlaUnsupportedError } from "./errors";
import type { Builtin, BuiltinArgument, Context } from "./evaluate";
import { decodeJavaUtf8, trimJava } from "./java-string";
import { readJson, type JsonElement } from "./json-reader";
import { isEvalException } from "./tlc/messages";
import {
  applyFunction,
  createRecord,
  createTuple,
  formatValue,
  getSequenceElements,
  getPrintedPairs,
  isFunctionValue,
  isTlcEnumerable,
  toFiniteFunction,
  toFiniteSet,
  type FunctionValue,
  type Value,
  rankString,
} from "./values";

export interface FileSystem {
  readFile: ((path: string) => Uint8Array | undefined) | undefined;
  writeFile: ((path: string, content: string | Uint8Array) => void) | undefined;
  makeDirectory: ((path: string) => void) | undefined;
}

const OPEN_OPTIONS = new Set([
  "READ",
  "WRITE",
  "APPEND",
  "TRUNCATE_EXISTING",
  "CREATE",
  "CREATE_NEW",
  "DELETE_ON_CLOSE",
  "SPARSE",
  "SYNC",
  "DSYNC",
]);

const UTF_8_NAMES = new Set(["utf-8", "utf8", "unicode-1-1-utf-8"]);

const STANDARD_CHARSETS = new Set(["us-ascii", "iso-8859-1", "utf-16", "utf-16be", "utf-16le"]);

const toRecord = (value: Value) => {
  if (!isFunctionValue(value)) return undefined;
  const functionValue = toFiniteFunction(value);
  const fields = functionValue.domain.flatMap((key, index): [string, Value][] =>
    typeof key === "string" ? [[key, functionValue.range[index]]] : [],
  );
  return fields.length === functionValue.domain.length ? createRecord(fields) : undefined;
};

const createValueCastError = (value: Value, javaClass: string) =>
  createClassCastError(
    `tlc2.value.impl.${getJavaClassName(value)}`,
    `tlc2.value.impl.${javaClass}`,
  );

const createUnsupportedError = (value: Value) =>
  new TlaEvaluationError(
    `Cannot convert value: unsupported value type tlc2.value.impl.${getJavaClassName(value)}`,
  );

const toJsonString = (text: string) =>
  JSON.stringify(text).replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");

const toArrayJson = (elements: Value[]) => `[${elements.map(toJson).join(",")}]`;

const toObjectJson = (functionValue: FunctionValue) =>
  `{${getPrintedPairs(functionValue)
    .map(
      (pair) =>
        `${toJsonString(typeof pair[0] === "string" ? pair[0] : formatValue(pair[0]))}:${toJson(pair[1])}`,
    )
    .join(",")}}`;

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
  return getJavaClassName(value) === "RecordValue"
    ? toObjectJson(toFiniteFunction(value))
    : toJsonArray(value);
};

const toJsonArray = (value: Value) => {
  const className = getJavaClassName(value);
  if (className === "TupleValue") return toArrayJson(toFiniteFunction(value).range);
  if (isFunctionClass(className)) return toFunctionJson(value);
  if (isTlcEnumerable(value)) return toArrayJson(toFiniteSet(value).elements);
  throw createUnsupportedError(value);
};

const toNdJsonLine = (element: Value) => `${toJson(element)}\n`;

// TLC opens the file before it converts the value, and closing the writer keeps the lines converted before a failure.
const writeConverted = (
  write: (text: string) => void,
  elements: Value[],
  toText: (element: Value) => string,
  toConversionError = (error: TlaEvaluationError) => error,
) => {
  write("");
  const texts: string[] = [];
  try {
    elements.forEach((element) => texts.push(toText(element)));
  } catch (error) {
    write(texts.join(""));
    throw error instanceof TlaEvaluationError ? toConversionError(error) : error;
  }
  write(texts.join(""));
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

export const getPath = (value: Value) => {
  if (typeof value !== "string") {
    throw new TlaEvaluationError(
      `Cannot cast tlc2.value.impl.${getJavaClassName(value)} to tlc2.value.impl.StringValue`,
    );
  }
  return value;
};

const getStringOption = (options: Value, field: string) => {
  const value = applyFunction(options, field);
  if (typeof value !== "string") throw createValueCastError(value, "StringValue");
  return value;
};

const checkCharset = (charset: string) => {
  if (UTF_8_NAMES.has(charset.toLowerCase())) return;
  if (STANDARD_CHARSETS.has(charset.toLowerCase())) {
    throw new TlaUnsupportedError(`IOUtils!Serialize does not support the charset ${charset}`);
  }
  throw new TlaEvaluationError(
    /^[a-zA-Z\d][\w.:+-]*$/.test(charset)
      ? `java.nio.charset.UnsupportedCharsetException: ${charset}`
      : `java.nio.charset.IllegalCharsetNameException: ${charset}`,
  );
};

const LOCATION_SUFFIX = /\nline \d+, col \d+ to line \d+, col \d+ of module \S+$/;

const getJavaExceptionClass = (error: TlaEvaluationError) => {
  if (error instanceof TlaSetBoundError) return "util.WrongInvocationException";
  if (isEvalException(error)) return "tlc2.tool.EvalException";
  if (error.message.startsWith("Cannot convert value:")) return "java.io.IOException";
  return LOCATION_SUFFIX.test(error.message)
    ? "util.Assert$TLCDetailedRuntimeException"
    : "util.Assert$TLCRuntimeException";
};

const openLikeNio = <Result>(open: () => Result) => {
  try {
    return open();
  } catch (error) {
    if (!(error instanceof TlaFileError)) throw error;
    throw new TlaEvaluationError(
      error.code === "ENOENT"
        ? `java.nio.file.NoSuchFileException: ${error.path}`
        : error.code === "EACCES"
          ? `java.nio.file.AccessDeniedException: ${error.path}`
          : `java.nio.file.FileSystemException: ${error.path}: ${error.reason}`,
    );
  }
};

// Files.newBufferedWriter writes the text over the start of a file that it neither truncates nor appends to.
const serializeWithOptions = (
  files: FileSystem,
  path: string,
  names: string[],
  elements: Value[],
) => {
  const unknown = names.find((name) => !OPEN_OPTIONS.has(name));
  if (unknown !== undefined) {
    throw new TlaEvaluationError(
      `java.lang.IllegalArgumentException: No enum constant java.nio.file.StandardOpenOption.${unknown}`,
    );
  }
  if (names.includes("READ")) {
    throw new TlaEvaluationError("java.lang.IllegalArgumentException: READ not allowed");
  }
  const options = new Set(names.length === 0 ? ["CREATE", "TRUNCATE_EXISTING"] : names);
  if (options.has("APPEND") && options.has("TRUNCATE_EXISTING")) {
    throw new TlaEvaluationError(
      "java.lang.IllegalArgumentException: APPEND + TRUNCATE_EXISTING not allowed",
    );
  }
  if (options.has("DELETE_ON_CLOSE")) {
    throw new TlaUnsupportedError("IOUtils!Serialize does not support DELETE_ON_CLOSE");
  }
  const existing = openLikeNio(() => files.readFile?.(path));
  if (existing === undefined && !options.has("CREATE") && !options.has("CREATE_NEW")) {
    throw new TlaEvaluationError(`java.nio.file.NoSuchFileException: ${path}`);
  }
  if (existing !== undefined && options.has("CREATE_NEW")) {
    throw new TlaEvaluationError(`java.nio.file.FileAlreadyExistsException: ${path}`);
  }
  const kept =
    existing === undefined || options.has("TRUNCATE_EXISTING") ? new Uint8Array() : existing;
  const offset = options.has("APPEND") ? kept.length : 0;
  const write = (text: string) => {
    const bytes = new TextEncoder().encode(text);
    const content = new Uint8Array(Math.max(kept.length, offset + bytes.length));
    content.set(kept);
    content.set(bytes, offset);
    openLikeNio(() => files.writeFile?.(path, content));
  };
  writeConverted(
    write,
    elements,
    toNdJsonLine,
    (error) => new TlaEvaluationError(`${getJavaExceptionClass(error)}: ${error.message}`),
  );
};

const makeParentDirectory = (files: FileSystem, path: string) => {
  const separator = path.lastIndexOf("/");
  if (separator !== -1) files.makeDirectory?.(path.slice(0, Math.max(separator, 1)));
};

const readText = (files: FileSystem, path: string) => {
  const bytes = files.readFile?.(path);
  if (bytes === undefined) throw new TlaEvaluationError(`${path} (No such file or directory)`);
  return decodeJavaUtf8(bytes);
};

export const createJsonOperators = (files: FileSystem): Builtin[] => [
  overrideWithJava(
    defineOperator("ToJson", 1, (args) => rankString(toJson(getValue(args, 0, "ToJson")))),
    "public static tlc2.value.impl.StringValue tlc2.module.Json.toJson(tlc2.value.IValue) throws java.io.IOException",
  ),
  overrideWithJava(
    defineOperator("ToJsonArray", 1, (args) =>
      rankString(toJsonArray(getValue(args, 0, "ToJsonArray"))),
    ),
    "public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonArray(tlc2.value.IValue) throws java.io.IOException",
  ),
  overrideWithJava(
    defineOperator("ToJsonObject", 1, (args) =>
      rankString(toJsonObject(getValue(args, 0, "ToJsonObject"))),
    ),
    "public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonObject(tlc2.value.IValue) throws java.io.IOException",
  ),
  overrideWithJava(
    defineOperator("JsonSerialize", 2, (args) => {
      const path = getPath(getValue(args, 0, "JsonSerialize"));
      const value = getValue(args, 1, "JsonSerialize");
      if (!getSequenceElements(value) && !toRecord(value)) {
        throw createModuleArgumentError("second", "JsonSerialize", "sequence or record", value);
      }
      makeParentDirectory(files, path);
      writeConverted((text) => files.writeFile?.(path, text), [value], toJson);
      return true;
    }),
    "public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.serialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException",
  ),
  overrideWithJava(
    defineOperator("ndJsonSerialize", 2, (args) => {
      const path = getPath(getValue(args, 0, "ndJsonSerialize"));
      const value = getValue(args, 1, "ndJsonSerialize");
      const elements = getSequenceElements(value);
      if (!elements) {
        throw createModuleArgumentError("second", "ndJsonSerialize", "sequence", value);
      }
      makeParentDirectory(files, path);
      writeConverted((text) => files.writeFile?.(path, text), elements, toNdJsonLine);
      return true;
    }),
    "public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.ndSerialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException",
  ),
  overrideWithJava(
    defineOperator("JsonDeserialize", 1, (args) =>
      fromJson(readJson(readText(files, getPath(getValue(args, 0, "JsonDeserialize"))))),
    ),
    "public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException",
  ),
  overrideWithJava(
    defineOperator("ndJsonDeserialize", 1, (args) =>
      createTuple(
        readText(files, getPath(getValue(args, 0, "ndJsonDeserialize")))
          .split(/\r\n|\r|\n/)
          .map(trimJava)
          .filter((line) => line !== "")
          .map((line) => fromJson(readJson(line))),
      ),
    ),
    "public static tlc2.value.IValue tlc2.module.Json.ndDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException",
  ),
];

export const createIoUtilsOperators = (
  files: FileSystem,
  evaluateReplaced: (name: string, args: BuiltinArgument[], context: Context | undefined) => Value,
): Builtin[] => [
  overrideWithJava(
    {
      ...defineLazyOperator("Serialize", 3, (args, context) => {
        const third = getThunk(args, 2, "Serialize")();
        const options = toRecord(third);
        if (!options)
          throw createModuleArgumentError("third", "ndJsonSerialize", "sequence", third);
        if (getStringOption(options, "format") !== "NDJSON") {
          return evaluateReplaced("Serialize", args, context);
        }
        const payload = getThunk(args, 0, "Serialize")();
        const elements = getSequenceElements(payload);
        if (!elements) throw createModuleArgumentError("first", "Serialize", "sequence", payload);
        const path = getThunk(args, 1, "Serialize")();
        if (typeof path !== "string") {
          throw createModuleArgumentError("second", "ndJsonSerialize", "sequence", path);
        }
        const openOptions = applyFunction(options, "openOptions");
        if (getJavaClassName(openOptions) !== "TupleValue") {
          throw createValueCastError(openOptions, "TupleValue");
        }
        const charset = getStringOption(options, "charset");
        const names = toFiniteFunction(openOptions).range.map((option) => {
          if (typeof option !== "string") throw createValueCastError(option, "StringValue");
          return option;
        });
        checkCharset(charset);
        serializeWithOptions(files, path, names, elements);
        return true;
      }),
      isStateLevel: false,
    },
    "public static synchronized tlc2.value.impl.Value tlc2.module.Json.textSerialize(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel)",
  ),
];
