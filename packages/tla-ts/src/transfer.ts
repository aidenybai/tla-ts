import { createModelValue, createSortedFunction, createSortedSet, type Value } from "./values";

const FALSE = 0;
const TRUE = 1;
const INTEGER = 2;
const STRING = 3;
const MODEL_VALUE = 4;
const SET = 5;
const FUNCTION = 6;

export interface EncodedStates {
  words: Int32Array;
  strings: string[];
  count: number;
}

interface StateEncoder {
  encode: (state: Value[]) => boolean;
  finish: () => EncodedStates;
}

export const createStateEncoder = (): StateEncoder => {
  const buffer = { words: new Int32Array(1024), length: 0, count: 0 };
  const strings: string[] = [];
  const stringIndexes = new Map<string, number>();
  const push = (word: number) => {
    if (buffer.length === buffer.words.length) {
      const words = new Int32Array(buffer.words.length * 2);
      words.set(buffer.words);
      buffer.words = words;
    }
    buffer.words[buffer.length++] = word;
  };
  const pushString = (value: string) => {
    const known = stringIndexes.get(value);
    if (known !== undefined) return push(known);
    stringIndexes.set(value, strings.length);
    push(strings.length);
    strings.push(value);
  };
  const encodeValue = (value: Value): boolean => {
    if (typeof value === "boolean") {
      push(value ? TRUE : FALSE);
      return true;
    }
    if (typeof value === "number") {
      if ((value | 0) !== value) return false;
      push(INTEGER);
      push(value);
      return true;
    }
    if (typeof value === "string") {
      push(STRING);
      pushString(value);
      return true;
    }
    if (value.kind === "ModelValue") {
      push(MODEL_VALUE);
      pushString(value.name);
      return true;
    }
    if (value.kind === "Set") {
      push(SET);
      push(value.elements.length);
      return value.elements.every(encodeValue);
    }
    if (value.kind === "Function") {
      push(FUNCTION);
      push(value.domain.length);
      return value.domain.every(encodeValue) && value.range.every(encodeValue);
    }
    return false;
  };
  return {
    encode: (state) => {
      const start = buffer.length;
      if (state.every(encodeValue)) {
        buffer.count++;
        return true;
      }
      buffer.length = start;
      return false;
    },
    finish: () => ({
      words: buffer.words.slice(0, buffer.length),
      strings,
      count: buffer.count,
    }),
  };
};

export const createStateDecoder = (width: number) => {
  return (encoded: EncodedStates): Value[][] => {
    const words = encoded.words;
    const cursor = { index: 0 };
    const decodeElements = (length: number) => Array.from({ length }, () => decodeValue());
    const decodeValue = (): Value => {
      const tag = words[cursor.index++];
      if (tag === FALSE) return false;
      if (tag === TRUE) return true;
      if (tag === INTEGER) return words[cursor.index++];
      if (tag === STRING) return encoded.strings[words[cursor.index++]];
      if (tag === MODEL_VALUE) return createModelValue(encoded.strings[words[cursor.index++]]);
      const length = words[cursor.index++];
      if (tag === SET) return createSortedSet(decodeElements(length));
      const domain = decodeElements(length);
      return createSortedFunction(domain, decodeElements(length));
    };
    return Array.from({ length: encoded.count }, () =>
      Array.from({ length: width }, () => decodeValue()),
    );
  };
};
