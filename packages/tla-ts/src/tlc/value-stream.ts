import { defineStateOperator, getValue, overrideWithJava } from "../builtins";
import type { Builtin } from "../evaluate";
import { getPath, type FileSystem } from "../json";
import {
  getFunctionClass,
  getModelValues,
  isSetValue,
  toFiniteFunction,
  toFiniteSet,
  type Value,
} from "../values";

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

const serializeValue = (value: Value) => {
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
    writeInt(-1);
    writeInt(text.length);
    text.split("").forEach((unit) => writeByte(unit.charCodeAt(0)));
  };
  const writeHandle = (index: number) => {
    writeByte(TAGS.handle);
    writeNat(index);
  };
  const write = (inner: Value): void => {
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
      elements.forEach(write);
      return;
    }
    const functionValue = toFiniteFunction(inner);
    const functionClass = getFunctionClass(inner);
    if (functionClass === "tuple") {
      writeByte(TAGS.tuple);
      writeNat(functionValue.range.length);
      functionValue.range.forEach(write);
      return;
    }
    if (functionClass === "record") {
      writeByte(TAGS.record);
      writeInt(functionValue.domain.length);
      functionValue.domain.forEach((name, index) => {
        const fieldName = String(name);
        const nameHandle = nameHandles.get(fieldName);
        if (nameHandle === undefined) {
          nameHandles.set(fieldName, handleCount++);
          writeString(fieldName);
        } else {
          writeHandle(nameHandle);
        }
        write(functionValue.range[index]);
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
  return process.getBuiltinModule("node:zlib").gzipSync(Uint8Array.from(bytes));
};

export const createTlcTraceOperators = (files: FileSystem): Builtin[] => [
  overrideWithJava(
    defineStateOperator("_TLCTraceSerialize", 2, (args) => {
      const path = getPath(getValue(args, 1, "_TLCTraceSerialize"));
      files.writeFile?.(path, serializeValue(getValue(args, 0, "_TLCTraceSerialize")));
      return true;
    }),
    "public static final tlc2.value.IValue tlc2.module._TLCTrace.ioSerialize(tlc2.value.IValue,tlc2.value.impl.StringValue) throws java.io.IOException",
  ),
];
