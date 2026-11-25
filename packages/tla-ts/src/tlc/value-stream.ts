import { constants, crc32, gzipSync, inflateRawSync } from "node:zlib";
import {
  createClassCastError,
  defineOperator,
  defineStateOperator,
  getJavaClassName,
  getValue,
  overrideWithJava,
} from "../builtins";
import { TlaCorruptTraceError, TlaEvaluationError } from "../errors";
import type { Builtin } from "../evaluate";
import { getPath, type FileSystem } from "../json";
import {
  compareValues,
  createFunction,
  createRecord,
  createSet,
  createTuple,
  createUnfingerprintableError,
  formatValue,
  getFunctionClass,
  getModelValues,
  isSetValue,
  rankString,
  toFiniteFunction,
  toFiniteSet,
  type Value,
} from "../values";

interface GzipHeader {
  kind: "Header";
  end: number;
}

interface MalformedHeader {
  kind: "Malformed";
  message: string;
}

interface CutShortHeader {
  kind: "CutShort";
}

interface InflatedMember {
  buffer: Uint8Array;
  engine: { bytesWritten: number };
}

interface CompleteMember {
  kind: "Complete";
  output: Uint8Array;
  end: number;
}

interface FailedMember {
  kind: "Failed";
  output: Uint8Array;
  failure: TlaEvaluationError;
}

interface NameHandle {
  kind: "Name";
  name: string;
}

interface ValueHandle {
  kind: "Value";
  value: Value;
}

type Handle = NameHandle | ValueHandle;

interface CompositeFrame {
  index: number;
  length: number;
  values: Value[];
}

interface RecordFrame extends CompositeFrame {
  kind: "Record";
  names: string[];
}

interface FunctionFrame extends CompositeFrame {
  kind: "Function";
  domain: Value[];
}

interface IntervalFrame extends CompositeFrame {
  kind: "Interval";
  low: number;
  high: number;
}

interface ElementFrame extends CompositeFrame {
  kind: "Set" | "Tuple";
}

type Frame = RecordFrame | FunctionFrame | IntervalFrame | ElementFrame;

const GZIP_MAGIC = 0x8b1f;

const GZIP_FLAGS = { headerCrc: 2, extra: 4, name: 8, comment: 16 };

const GZIP_BUFFER_SIZE = 512;

const STREAM_BUFFER_SIZE = 8192;

const HANDLE_TABLE_SIZE = 16;

const TAGS = {
  boolean: 0,
  integer: 1,
  string: 3,
  record: 4,
  set: 5,
  tuple: 7,
  function: 9,
  modelValue: 21,
  interval: 23,
  handle: 26,
};

const serializeValue = (value: Value, variableNames: string[]) => {
  const bytes: number[] = [];
  const objectHandles = new Map<object, number>();
  const nameHandles = new Map<string, number>();
  let handleCount = 0;
  const modelValues = getModelValues();
  const writeByte = (byte: number) => bytes.push(byte & 0xff);
  const writeShort = (short: number) => {
    writeByte(short >> 8);
    writeByte(short);
  };
  const writeInt = (int: number) => {
    writeShort(int >> 16);
    writeShort(int);
  };
  const writeNat = (nat: number) => (nat > 0x7fff ? writeInt(-nat) : writeShort(nat));
  const writeString = (text: string) => {
    writeByte(TAGS.string);
    writeInt(0);
    // UniqueString#getVarLoc gives the index of a root module variable's name, and -1 for any other string.
    writeInt(variableNames.indexOf(text));
    writeInt(text.length);
    text.split("").forEach((unit) => writeByte(unit.charCodeAt(0)));
  };
  const writeHandle = (index: number) => {
    writeByte(TAGS.handle);
    writeNat(index);
  };
  const write = (inner: Value, isContext = false): void => {
    if (typeof inner === "boolean") {
      writeByte(TAGS.boolean);
      writeByte(inner ? 1 : 0);
      return;
    }
    if (typeof inner === "number") {
      writeByte(TAGS.integer);
      writeInt(inner);
      return;
    }
    if (typeof inner === "string") {
      handleCount++;
      writeString(inner);
      return;
    }
    if (inner.kind === "ModelValue") {
      writeByte(TAGS.modelValue);
      writeShort(modelValues.indexOf(inner));
      return;
    }
    if (inner.kind === "Interval") {
      writeByte(TAGS.interval);
      writeInt(inner.low);
      writeInt(inner.high);
      return;
    }
    if (inner.kind === "InfiniteSet" || inner.kind === "SequenceSet") {
      throw createUnfingerprintableError(inner);
    }
    if (inner.kind === "Operator") throw createUnfingerprintableError(inner);
    const handle = objectHandles.get(inner);
    if (handle !== undefined) {
      writeHandle(handle);
      return;
    }
    objectHandles.set(inner, handleCount++);
    if (isSetValue(inner)) {
      const elements = toFiniteSet(inner).elements;
      writeByte(TAGS.set);
      writeInt(elements.length);
      elements.forEach((element) => write(element));
      return;
    }
    const functionValue = toFiniteFunction(inner);
    const functionClass = getFunctionClass(inner);
    if (functionClass === "tuple") {
      writeByte(TAGS.tuple);
      writeNat(functionValue.range.length);
      functionValue.range.forEach((element) => write(element));
      return;
    }
    if (functionClass === "record") {
      // Deviation from TLC: _TLCTrace#ioSerialize can't fingerprint an operator a split action binds in its context, so TLC fails _TLCTraceSilent and leaves the trace file empty.
      const fields = functionValue.domain.flatMap((_name, index) => {
        const field = functionValue.range[index];
        return isContext && typeof field === "object" && field.kind === "Operator" ? [] : [index];
      });
      writeByte(TAGS.record);
      writeInt(fields.length);
      fields.forEach((index) => {
        const fieldName = String(functionValue.domain[index]);
        const nameHandle = nameHandles.get(fieldName);
        if (nameHandle === undefined) {
          nameHandles.set(fieldName, handleCount++);
          writeString(fieldName);
        } else {
          writeHandle(nameHandle);
        }
        write(functionValue.range[index], fieldName === "context");
      });
      return;
    }
    writeByte(TAGS.function);
    writeNat(functionValue.domain.length);
    writeByte(1);
    functionValue.domain.forEach((key, index) => {
      write(key);
      write(functionValue.range[index]);
    });
  };
  write(value);
  return gzipSync(Uint8Array.from(bytes));
};

// Deviation from TLC: GZIPInputStream and BufferedDataInputStream throw an EOFException without a message, so TLC prints its stack trace.
const createCutShortError = (path: string) =>
  new TlaCorruptTraceError(`The trace file ${path} is cut short.`);

// FcnRcdValue#sort and RecordValue#sort insertion-sort the keys and report the one at the position where they find a key twice.
const getRepeatedKey = (written: Value[]) => {
  const keys = [...written];
  for (let index = 1; index < keys.length; index++) {
    const comparison = compareValues(keys[0], keys[index]);
    if (comparison === 0) return keys[index];
    if (comparison > 0) {
      const first = keys[0];
      keys[0] = keys[index];
      keys[index] = first;
    }
  }
  for (let index = 2; index < keys.length; index++) {
    const key = keys[index];
    let position = index;
    let comparison = -1;
    while (position > 0 && (comparison = compareValues(key, keys[position - 1])) < 0) {
      keys[position] = keys[position - 1];
      position--;
    }
    if (comparison === 0) return keys[index];
    keys[position] = key;
  }
  return undefined;
};

const readUShort = (bytes: Uint8Array, position: number) =>
  bytes[position] | (bytes[position + 1] << 8);

const readUInt = (bytes: Uint8Array, position: number) =>
  (readUShort(bytes, position) | (readUShort(bytes, position + 2) << 16)) >>> 0;

const readGzipHeader = (
  bytes: Uint8Array,
  start: number,
): GzipHeader | MalformedHeader | CutShortHeader => {
  const cutShort: CutShortHeader = { kind: "CutShort" };
  if (start + 2 > bytes.length) return cutShort;
  if (readUShort(bytes, start) !== GZIP_MAGIC) {
    return { kind: "Malformed", message: "Not in GZIP format" };
  }
  if (start + 3 > bytes.length) return cutShort;
  if (bytes[start + 2] !== 8) {
    return { kind: "Malformed", message: "Unsupported compression method" };
  }
  if (start + 10 > bytes.length) return cutShort;
  const flags = bytes[start + 3];
  let end = start + 10;
  if (flags & GZIP_FLAGS.extra) {
    if (end + 2 > bytes.length) return cutShort;
    end += 2 + readUShort(bytes, end);
    if (end > bytes.length) return cutShort;
  }
  for (const flag of [GZIP_FLAGS.name, GZIP_FLAGS.comment]) {
    if (flags & flag) {
      const terminator = bytes.indexOf(0, end);
      if (terminator === -1) return cutShort;
      end = terminator + 1;
    }
  }
  if (flags & GZIP_FLAGS.headerCrc) {
    if (end + 2 > bytes.length) return cutShort;
    if (readUShort(bytes, end) !== (crc32(bytes.subarray(start, end)) & 0xffff)) {
      return { kind: "Malformed", message: "Corrupt GZIP header" };
    }
    end += 2;
  }
  return { kind: "Header", end };
};

const isZlibError = (error: unknown, code: string): error is Error =>
  error instanceof Error && "code" in error && error.code === code;

const inflatePrefix = (bytes: Uint8Array, start: number, end: number) =>
  inflateRawSync(bytes.subarray(start, end), { finishFlush: constants.Z_SYNC_FLUSH });

const hasDataError = (bytes: Uint8Array, start: number, end: number) => {
  try {
    inflatePrefix(bytes, start, end);
    return false;
  } catch (error) {
    if (isZlibError(error, "Z_DATA_ERROR")) return true;
    throw error;
  }
};

// GZIPInputStream inflates 512 input bytes at a time into reads of at most 8192 bytes, and a read that meets bad data returns none of it.
const getOutputBeforeDataError = (bytes: Uint8Array, start: number, bufferStart: number) => {
  let low = start;
  let high = bytes.length;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (hasDataError(bytes, start, middle)) high = middle;
    else low = middle;
  }
  const chunkStart = Math.max(
    start,
    bufferStart + GZIP_BUFFER_SIZE * Math.floor((low - bufferStart) / GZIP_BUFFER_SIZE),
  );
  const chunkOutput = inflatePrefix(bytes, start, chunkStart).length;
  const output = inflatePrefix(bytes, start, low);
  return output.subarray(
    0,
    chunkOutput +
      STREAM_BUFFER_SIZE * Math.floor((output.length - chunkOutput) / STREAM_BUFFER_SIZE),
  );
};

const inflateMember = (
  bytes: Uint8Array,
  start: number,
  bufferStart: number,
): CompleteMember | FailedMember => {
  try {
    const member = inflateRawSync(bytes.subarray(start), {
      info: true,
    }) as unknown as InflatedMember;
    return { kind: "Complete", output: member.buffer, end: start + member.engine.bytesWritten };
  } catch (error) {
    if (isZlibError(error, "Z_BUF_ERROR")) {
      return {
        kind: "Failed",
        output: inflatePrefix(bytes, start, bytes.length),
        failure: new TlaEvaluationError("Unexpected end of ZLIB input stream"),
      };
    }
    if (!isZlibError(error, "Z_DATA_ERROR")) throw error;
    return {
      kind: "Failed",
      output: getOutputBeforeDataError(bytes, start, bufferStart),
      failure: new TlaEvaluationError(error.message),
    };
  }
};

const gunzipLikeJava = (bytes: Uint8Array, path: string) => {
  const header = readGzipHeader(bytes, 0);
  if (header.kind === "CutShort") throw createCutShortError(path);
  if (header.kind === "Malformed") throw new TlaEvaluationError(header.message);
  const members: Uint8Array[] = [];
  const finish = (failure: TlaEvaluationError | undefined) => {
    const data = new Uint8Array(members.reduce((total, member) => total + member.length, 0));
    let offset = 0;
    for (const member of members) {
      data.set(member, offset);
      offset += member.length;
    }
    return { data, failure };
  };
  let start = header.end;
  let bufferStart = header.end;
  while (true) {
    const member = inflateMember(bytes, start, bufferStart);
    members.push(member.output);
    if (member.kind === "Failed") return finish(member.failure);
    const trailer = member.end;
    if (trailer + 4 > bytes.length) return finish(createCutShortError(path));
    if (readUInt(bytes, trailer) !== crc32(member.output)) {
      return finish(new TlaEvaluationError("Corrupt GZIP trailer"));
    }
    if (trailer + 8 > bytes.length) return finish(createCutShortError(path));
    if (readUInt(bytes, trailer + 4) !== member.output.length % 2 ** 32) {
      return finish(new TlaEvaluationError("Corrupt GZIP trailer"));
    }
    const next = readGzipHeader(bytes, trailer + 8);
    if (next.kind !== "Header") return finish(undefined);
    const bufferEnd = Math.min(
      bytes.length,
      bufferStart + GZIP_BUFFER_SIZE * Math.ceil((trailer - bufferStart) / GZIP_BUFFER_SIZE),
    );
    if (bufferEnd <= next.end) bufferStart = next.end;
    start = next.end;
  }
};

const deserializeValue = (bytes: Uint8Array, path: string) => {
  const stream = gunzipLikeJava(bytes, path);
  const data = stream.data;
  const failure = stream.failure;
  // ValueInputStream reads through two BufferedDataInputStreams, which fill 8192 bytes at a time and refill as they read the last.
  const failureEnd =
    STREAM_BUFFER_SIZE * Math.max(0, Math.ceil(data.length / STREAM_BUFFER_SIZE) - 1);
  if (failure !== undefined && failureEnd === 0) throw failure;
  const modelValues = getModelValues();
  const handles: (Handle | undefined)[] = [];
  const frames: Frame[] = [];
  let capacity = HANDLE_TABLE_SIZE;
  let position = 0;
  const readUnsignedByte = () => {
    if (position === data.length) throw createCutShortError(path);
    const byte = data[position++];
    if (failure !== undefined && position === failureEnd) throw failure;
    return byte;
  };
  const readByte = () => (readUnsignedByte() << 24) >> 24;
  const readShort = () => (readByte() << 8) | readUnsignedByte();
  const readInt = () => (readShort() << 16) | (readShort() & 0xffff);
  const readNat = () => {
    const first = readShort();
    return first >= 0 ? first : -((first << 16) | (readShort() & 0xffff)) | 0;
  };
  // Deviation from TLC: createFromExternal allocates an array of the length the file gives before it reads the elements, so a length too large for the heap throws an OutOfMemoryError.
  const checkLength = (length: number) => {
    if (length < 0) throw new TlaEvaluationError(String(length));
    return length;
  };
  const getIndex = () => {
    if (handles.length >= capacity) capacity = handles.length * 2;
    handles.push(undefined);
    return handles.length - 1;
  };
  const getHandle = (index: number) => {
    if (index < 0 || index >= capacity) {
      throw new TlaEvaluationError(`Index ${index} out of bounds for length ${capacity}`);
    }
    const handle = handles[index];
    // Deviation from TLC: HandleTable#getValue gives null for a value it hasn't read, and TLC fails on it later with a NullPointerException.
    if (handle === undefined) {
      throw new TlaCorruptTraceError(
        `The trace file ${path} refers to value ${index} before it defines that value.`,
      );
    }
    return handle;
  };
  const readUniqueString = () => {
    readInt();
    readInt();
    const length = checkLength(readInt());
    let text = "";
    // Deviation from TLC: BufferedDataInputStream#readString sign-extends each byte, so TLC reads a character from U+0080 to U+00FF that its writer kept, such as é, as U+FF80 to U+FFFF.
    for (let index = 0; index < length; index++) text += String.fromCharCode(readUnsignedByte());
    return rankString(text);
  };
  const readFieldName = () => {
    if (readByte() === TAGS.handle) {
      const handle = getHandle(readNat());
      if (handle.kind === "Value") {
        throw createClassCastError(
          `tlc2.value.impl.${getJavaClassName(handle.value)}`,
          "util.UniqueString",
        );
      }
      return handle.name;
    }
    const index = getIndex();
    const name = readUniqueString();
    handles[index] = { kind: "Name", name };
    return name;
  };
  const openValue = (): Value | undefined => {
    const kind = readByte();
    if (kind === TAGS.boolean) return readByte() !== 0;
    if (kind === TAGS.integer) return readInt();
    if (kind === TAGS.string) {
      const text = readUniqueString();
      handles[getIndex()] = { kind: "Value", value: text };
      return text;
    }
    if (kind === TAGS.modelValue) {
      const index = readShort();
      if (index < 0 || index >= modelValues.length) {
        throw new TlaEvaluationError(
          `Index ${index} out of bounds for length ${modelValues.length}`,
        );
      }
      return modelValues[index];
    }
    if (kind === TAGS.interval) return { kind: "Interval", low: readInt(), high: readInt() };
    if (kind === TAGS.record) {
      const index = getIndex();
      const length = checkLength(Math.abs(readInt()) | 0);
      frames.push({ kind: "Record", index, length, names: [], values: [] });
      return undefined;
    }
    if (kind === TAGS.function) {
      const index = getIndex();
      const nat = readNat();
      const isInterval = readByte() === 0;
      const length = checkLength(nat);
      if (!isInterval) {
        frames.push({ kind: "Function", index, length, domain: [], values: [] });
        return undefined;
      }
      const low = readInt();
      const high = readInt();
      frames.push({ kind: "Interval", index, length, low, high, values: [] });
      return undefined;
    }
    if (kind === TAGS.set) {
      const index = getIndex();
      const length = checkLength(Math.abs(readInt()) | 0);
      frames.push({ kind: "Set", index, length, values: [] });
      return undefined;
    }
    if (kind === TAGS.tuple) {
      const index = getIndex();
      const length = checkLength(readNat());
      frames.push({ kind: "Tuple", index, length, values: [] });
      return undefined;
    }
    if (kind === TAGS.handle) {
      const handle = getHandle(readNat());
      if (handle.kind === "Name") {
        throw createClassCastError("util.UniqueString", "tlc2.value.IValue");
      }
      return handle.value;
    }
    throw new TlaEvaluationError(`ValueInputStream: Can not unpickle a value of kind ${kind}`);
  };
  const createComposite = (frame: Frame) => {
    if (frame.kind === "Record") {
      const repeatedName = getRepeatedKey(frame.names);
      // Deviation from TLC: RecordValue#createFromExternal keeps a repeated field, which TLC prints and fails on only where it first sorts the record, such as to fingerprint it.
      if (repeatedName !== undefined) {
        throw new TlaCorruptTraceError(
          `Field name ${repeatedName} occurs multiple times in record.`,
        );
      }
      return createRecord(
        frame.names.map((name, offset): [string, Value] => [name, frame.values[offset]]),
      );
    }
    if (frame.kind === "Function") {
      const repeatedKey = getRepeatedKey(frame.domain);
      // Deviation from TLC: FcnRcdValue#createFromExternal keeps the keys as written, so TLC fails on a repeated key only where it first sorts a function marked unnormalized, and matches no state with a function marked normalized whose keys repeat or are out of order.
      if (repeatedKey !== undefined) {
        throw new TlaCorruptTraceError(
          `The value\n${formatValue(repeatedKey)}\noccurs multiple times in the function domain.`,
        );
      }
      return createFunction(
        frame.domain.map((key, offset): [Value, Value] => [key, frame.values[offset]]),
      );
    }
    if (frame.kind === "Interval") {
      // Deviation from TLC: FcnRcdValue#createFromExternal pairs an interval domain with however many values follow it.
      if (frame.high - frame.low + 1 !== frame.length) {
        throw new TlaCorruptTraceError(
          `The trace file ${path} holds a function from ${frame.low}..${frame.high} with ${frame.length} values.`,
        );
      }
      return createFunction(
        frame.values.map((value, offset): [Value, Value] => [frame.low + offset, value]),
      );
    }
    // Deviation from TLC: SetEnumValue#createFromExternal trusts the order of a set marked normalized, so TLC prints one written out of order or with a repeated element as written and matches no state with it.
    return frame.kind === "Set" ? createSet(frame.values) : createTuple(frame.values);
  };
  const addValue = (frame: Frame, value: Value) => {
    if (frame.kind === "Function" && frame.domain.length === frame.values.length) {
      frame.domain.push(value);
      return;
    }
    frame.values.push(value);
  };
  // Deviation from TLC: ValueInputStream#readExternal recurses into each nested value, so a trace nested 10,000 deep overflows TLC's stack and leaks the StackOverflowError's stack trace.
  const value = openValue();
  if (value !== undefined) return value;
  while (true) {
    const frame = frames[frames.length - 1];
    if (frame.values.length < frame.length) {
      if (frame.kind === "Record") frame.names.push(readFieldName());
      const element = openValue();
      if (element !== undefined) addValue(frame, element);
      continue;
    }
    frames.pop();
    const composite = createComposite(frame);
    handles[frame.index] = { kind: "Value", value: composite };
    if (frames.length === 0) return composite;
    addValue(frames[frames.length - 1], composite);
  }
};

export const createTlcTraceOperators = (
  files: FileSystem,
  getVariableNames: () => string[],
): Builtin[] => [
  overrideWithJava(
    defineOperator("_TLCTraceDeserialize", 1, (args) => {
      const path = getPath(getValue(args, 0, "_TLCTraceDeserialize"));
      const bytes = files.readFile?.(path);
      return bytes === undefined ? createRecord([]) : deserializeValue(bytes, path);
    }),
    "public static final tlc2.value.IValue tlc2.module._TLCTrace.ioDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException",
  ),
  overrideWithJava(
    defineStateOperator("_TLCTraceSerialize", 2, (args) => {
      const path = getPath(getValue(args, 1, "_TLCTraceSerialize"));
      // Deviation from TLC: _TLCTrace#ioSerialize opens the trace file before it fingerprints the value, so a value it can't fingerprint leaves a 20-byte file.
      files.writeFile?.(
        path,
        serializeValue(getValue(args, 0, "_TLCTraceSerialize"), getVariableNames()),
      );
      return true;
    }),
    "public static final tlc2.value.IValue tlc2.module._TLCTrace.ioSerialize(tlc2.value.IValue,tlc2.value.impl.StringValue) throws java.io.IOException",
  ),
];
