import {
  createModelValue,
  createSortedFunction,
  createSortedSet,
  type FunctionClass,
  getDomainInterval,
  getFunctionClass,
  getFunctionDomain,
  setFunctionClass,
  type Value,
} from "./values";

const FALSE_TAG = 0;
const TRUE_TAG = 1;
const INTEGER_TAG = 2;
const STRING_TAG = 3;
const MODEL_VALUE_TAG = 4;
const SET_TAG = 5;
const FUNCTION_TAG = 6;
const INTERVAL_FUNCTION_TAG = 7;

// A function's TLC class follows its tag, so a worker words errors about it as TLC does.
const FUNCTION_CLASSES: (FunctionClass | undefined)[] = [undefined, "lambda", "tuple", "record"];

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
  const pushWord = (word: number) => {
    if (buffer.length === buffer.words.length) {
      const words = new Int32Array(buffer.words.length * 2);
      words.set(buffer.words);
      buffer.words = words;
    }
    buffer.words[buffer.length++] = word;
  };
  const pushString = (value: string) => {
    const known = stringIndexes.get(value);
    if (known !== undefined) return pushWord(known);
    stringIndexes.set(value, strings.length);
    pushWord(strings.length);
    strings.push(value);
  };
  const encodeValue = (value: Value): boolean => {
    if (typeof value === "boolean") {
      pushWord(value ? TRUE_TAG : FALSE_TAG);
      return true;
    }
    if (typeof value === "number") {
      if ((value | 0) !== value) return false;
      pushWord(INTEGER_TAG);
      pushWord(value);
      return true;
    }
    if (typeof value === "string") {
      pushWord(STRING_TAG);
      pushString(value);
      return true;
    }
    if (value.kind === "ModelValue") {
      pushWord(MODEL_VALUE_TAG);
      pushString(value.name);
      return true;
    }
    if (value.kind === "Set") {
      pushWord(SET_TAG);
      pushWord(value.elements.length);
      return value.elements.every(encodeValue);
    }
    if (value.kind === "Function") {
      const interval = getDomainInterval(value.domain);
      if (interval) {
        pushWord(INTERVAL_FUNCTION_TAG);
        pushWord(FUNCTION_CLASSES.indexOf(getFunctionClass(value)));
        pushWord(interval.low);
        pushWord(value.range.length);
        return value.range.every(encodeValue);
      }
      pushWord(FUNCTION_TAG);
      pushWord(FUNCTION_CLASSES.indexOf(getFunctionClass(value)));
      pushWord(value.domain.length);
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

export const createStateDecoder =
  (width: number) =>
  (encoded: EncodedStates): Value[][] => {
    const words = encoded.words;
    const cursor = { index: 0 };
    const decodeElements = (length: number) => Array.from({ length }, () => decodeValue());
    const decodeValue = (): Value => {
      const tag = words[cursor.index++];
      if (tag === FALSE_TAG) return false;
      if (tag === TRUE_TAG) return true;
      if (tag === INTEGER_TAG) return words[cursor.index++];
      if (tag === STRING_TAG) return encoded.strings[words[cursor.index++]];
      if (tag === MODEL_VALUE_TAG) return createModelValue(encoded.strings[words[cursor.index++]]);
      if (tag === SET_TAG) return createSortedSet(decodeElements(words[cursor.index++]));
      const functionClass = FUNCTION_CLASSES[words[cursor.index++]];
      if (tag === INTERVAL_FUNCTION_TAG) {
        const low = words[cursor.index++];
        const length = words[cursor.index++];
        const domain = getFunctionDomain({ kind: "Interval", low, high: low + length - 1 });
        return setFunctionClass(
          createSortedFunction(domain, decodeElements(length)),
          functionClass,
        );
      }
      const length = words[cursor.index++];
      const domain = decodeElements(length);
      return setFunctionClass(createSortedFunction(domain, decodeElements(length)), functionClass);
    };
    return Array.from({ length: encoded.count }, () =>
      Array.from({ length: width }, () => decodeValue()),
    );
  };
