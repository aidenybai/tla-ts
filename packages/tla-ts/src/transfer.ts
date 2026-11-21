import {
  applyFunction,
  createModelValue,
  createSortedFunction,
  createSortedSet,
  type FunctionValue,
  getDomain,
  getDomainInterval,
  getFunctionDomain,
  isLazyValueExpanded,
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
const LAZY_FUNCTION_TAG = 8;

const FUNCTION_CLASSES: FunctionValue["functionClass"][] = [undefined, "tuple", "record"];

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
  let words = new Int32Array(1024);
  let length = 0;
  let count = 0;
  const strings: string[] = [];
  const stringIndexes = new Map<string, number>();
  const pushWord = (word: number) => {
    if (length === words.length) {
      const grown = new Int32Array(words.length * 2);
      grown.set(words);
      words = grown;
    }
    words[length++] = word;
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
    if (value.kind === "Function") return encodeFunction(value);
    if (
      value.kind === "LazyFunction" &&
      value.enumerated !== undefined &&
      (value.source === undefined || isLazyValueExpanded())
    ) {
      const lengths = value.boundTupleLengths;
      pushWord(LAZY_FUNCTION_TAG);
      pushWord(lengths === undefined ? -1 : lengths.length);
      if (lengths !== undefined) {
        for (let index = 0; index < lengths.length; index++) pushWord(lengths[index] ?? -1);
      }
      return encodeFunction(value.enumerated);
    }
    return false;
  };
  const encodeFunction = (value: FunctionValue) => {
    const interval = getDomainInterval(value.domain);
    if (interval) {
      pushWord(INTERVAL_FUNCTION_TAG);
      pushWord(FUNCTION_CLASSES.indexOf(value.functionClass));
      pushWord(interval.low);
      pushWord(value.range.length);
      return value.range.every(encodeValue);
    }
    pushWord(FUNCTION_TAG);
    pushWord(FUNCTION_CLASSES.indexOf(value.functionClass));
    pushWord(value.domain.length);
    return value.domain.every(encodeValue) && value.range.every(encodeValue);
  };
  return {
    encode: (state) => {
      const start = length;
      if (state.every(encodeValue)) {
        count++;
        return true;
      }
      length = start;
      return false;
    },
    finish: () => ({ words: words.slice(0, length), strings, count }),
  };
};

export const createStateDecoder =
  (width: number) =>
  (encoded: EncodedStates): Value[][] => {
    const words = encoded.words;
    let cursor = 0;
    const decodeElements = (length: number) => Array.from({ length }, () => decodeValue());
    const decodeValue = (): Value => {
      const tag = words[cursor++];
      if (tag === FALSE_TAG) return false;
      if (tag === TRUE_TAG) return true;
      if (tag === INTEGER_TAG) return words[cursor++];
      if (tag === STRING_TAG) return encoded.strings[words[cursor++]];
      if (tag === MODEL_VALUE_TAG) return createModelValue(encoded.strings[words[cursor++]]);
      if (tag === SET_TAG) return createSortedSet(decodeElements(words[cursor++]));
      if (tag !== LAZY_FUNCTION_TAG) return decodeFunction(tag);
      const count = words[cursor++];
      const boundTupleLengths =
        count === -1
          ? undefined
          : Array.from({ length: count }, () => {
              const length = words[cursor++];
              return length === -1 ? undefined : length;
            });
      const enumerated = decodeFunction(words[cursor++]);
      return {
        kind: "LazyFunction",
        domain: getDomain(enumerated),
        source: undefined,
        boundTupleLengths,
        isApplicationObserved: false,
        apply: (argument) => applyFunction(enumerated, argument),
        enumerated,
      };
    };
    const decodeFunction = (tag: number) => {
      const functionClass = FUNCTION_CLASSES[words[cursor++]];
      if (tag === INTERVAL_FUNCTION_TAG) {
        const low = words[cursor++];
        const length = words[cursor++];
        const domain = getFunctionDomain({ kind: "Interval", low, high: low + length - 1 });
        return setFunctionClass(
          createSortedFunction(domain, decodeElements(length)),
          functionClass,
        );
      }
      const length = words[cursor++];
      const domain = decodeElements(length);
      return setFunctionClass(createSortedFunction(domain, decodeElements(length)), functionClass);
    };
    return Array.from({ length: encoded.count }, () =>
      Array.from({ length: width }, () => decodeValue()),
    );
  };
