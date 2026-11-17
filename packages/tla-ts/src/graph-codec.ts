// Writes a graph of plain objects, arrays, maps, sets, and primitives as JSON-ready arrays, and reads
// it back with the same keys in the same order and the same objects shared, so that a build can
// prepare a structure once that each process reads rather than computes.

// The stream is a string of variable-length integers, five bits to a character with a sixth that
// marks one more character. A value is a tag, or a small integer stored as itself plus SMALL_START.
const UNDEFINED = 0;
const NULL = 1;
const FALSE = 2;
const TRUE = 3;
const NUMBER = 4;
const STRING = 5;
const REFERENCE = 6;
const OBJECT = 7;
const ARRAY = 8;
const MAP = 9;
const SET = 10;
const BIGINT = 11;
const SMALL_START = 16;
const SMALL_END = 1 << 28;

// The characters of the stream, none of which JSON escapes, and each one's digit.
const DIGITS = Array.from({ length: 65 }, (_value, index) => String.fromCharCode(35 + index))
  .filter((character) => character !== "\\")
  .join("");
const DIGIT_VALUES = new Int8Array(128).fill(-1);
for (let digit = 0; digit < 64; digit++) DIGIT_VALUES[DIGITS.charCodeAt(digit)] = digit;

export type EncodedGraph = [
  strings: string[],
  shapes: string[][],
  numbers: number[],
  stream: string,
];

export const encodeGraph = (root: unknown): EncodedGraph => {
  const strings: string[] = [];
  const stringIds = new Map<string, number>();
  const shapes: string[][] = [];
  const shapeIds = new Map<string, number>();
  const objectIds = new Map<object, number>();
  const numbers: number[] = [];
  const stream: number[] = [];
  const getStringId = (text: string) => {
    const known = stringIds.get(text);
    if (known !== undefined) return known;
    stringIds.set(text, strings.length);
    strings.push(text);
    return strings.length - 1;
  };
  const getShapeId = (keys: string[]) => {
    const key = keys.join("\u0000");
    const known = shapeIds.get(key);
    if (known !== undefined) return known;
    shapeIds.set(key, shapes.length);
    shapes.push(keys);
    return shapes.length - 1;
  };
  const write = (value: unknown): void => {
    switch (typeof value) {
      case "undefined":
        stream.push(UNDEFINED);
        return;
      case "boolean":
        stream.push(value ? TRUE : FALSE);
        return;
      case "number":
        if (Number.isInteger(value) && value >= 0 && value < SMALL_END - SMALL_START) {
          stream.push(value + SMALL_START);
          return;
        }
        if (!Number.isFinite(value) || Object.is(value, -0)) {
          throw new TypeError(`A graph can't hold the number ${value}`);
        }
        stream.push(NUMBER, numbers.push(value) - 1);
        return;
      case "string":
        stream.push(STRING, getStringId(value));
        return;
      case "bigint":
        stream.push(BIGINT, getStringId(String(value)));
        return;
      case "object":
        break;
      default:
        throw new TypeError(`A graph can't hold a ${typeof value}`);
    }
    if (value === null) {
      stream.push(NULL);
      return;
    }
    const known = objectIds.get(value);
    if (known !== undefined) {
      stream.push(REFERENCE, known);
      return;
    }
    objectIds.set(value, objectIds.size);
    const prototype = Object.getPrototypeOf(value);
    if (prototype === Array.prototype && Array.isArray(value)) {
      stream.push(ARRAY, value.length);
      for (let index = 0; index < value.length; index++) write(value[index]);
      return;
    }
    if (prototype === Map.prototype && value instanceof Map) {
      stream.push(MAP, value.size);
      value.forEach((item, key) => {
        write(key);
        write(item);
      });
      return;
    }
    if (prototype === Set.prototype && value instanceof Set) {
      stream.push(SET, value.size);
      value.forEach(write);
      return;
    }
    if (prototype !== Object.prototype) throw new TypeError("A graph holds only plain objects");
    const keys = Object.keys(value);
    stream.push(OBJECT, getShapeId(keys));
    for (const key of keys) write(Reflect.get(value, key));
  };
  write(root);
  const digits: string[] = [];
  for (const value of stream) {
    for (let rest = value; ; rest = Math.floor(rest / 32)) {
      const isLast = rest < 32;
      digits.push(DIGITS[(rest % 32) + (isLast ? 0 : 32)]);
      if (isLast) break;
    }
  }
  return [strings, shapes, numbers, digits.join("")];
};

export const decodeGraph = (encoded: EncodedGraph): unknown => {
  const [strings, shapes, numbers, digits] = encoded;
  // The values of the stream, read from its characters in one pass.
  const stream = new Int32Array(digits.length);
  let length = 0;
  for (let index = 0, value = 0, scale = 1; index < digits.length; index++) {
    const digit = DIGIT_VALUES[digits.charCodeAt(index)];
    value += (digit & 31) * scale;
    if (digit < 32) {
      stream[length++] = value;
      value = 0;
      scale = 1;
    } else {
      scale *= 32;
    }
  }
  const objects: unknown[] = [];
  let position = 0;
  const next = () => stream[position++];
  const read = (): unknown => {
    const tag = next();
    if (tag >= SMALL_START) return tag - SMALL_START;
    switch (tag) {
      case UNDEFINED:
        return undefined;
      case NULL:
        return null;
      case FALSE:
        return false;
      case TRUE:
        return true;
      case NUMBER:
        return numbers[next()];
      case STRING:
        return strings[next()];
      case BIGINT:
        return BigInt(strings[next()]);
      case REFERENCE:
        return objects[next()];
      case ARRAY: {
        const length = next();
        const array: unknown[] = [];
        objects.push(array);
        for (let index = 0; index < length; index++) array.push(read());
        return array;
      }
      case MAP: {
        const size = next();
        const map = new Map<unknown, unknown>();
        objects.push(map);
        for (let index = 0; index < size; index++) {
          const key = read();
          map.set(key, read());
        }
        return map;
      }
      case SET: {
        const size = next();
        const set = new Set<unknown>();
        objects.push(set);
        for (let index = 0; index < size; index++) set.add(read());
        return set;
      }
      case OBJECT: {
        const keys = shapes[next()];
        const object: Record<string, unknown> = {};
        objects.push(object);
        for (const key of keys) object[key] = read();
        return object;
      }
      default:
        throw new TypeError(`A graph has no tag ${tag}`);
    }
  };
  return read();
};
