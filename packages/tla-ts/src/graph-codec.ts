// Writes a graph of plain objects, arrays, maps, sets, and primitives as JSON-ready tables and a
// stream, and reads it back with the same keys in the same order and the same objects shared, so
// that a build can prepare a structure once that each process reads rather than computes.

// The stream is a string of variable-length integers, five bits to a character with a sixth that
// marks one more character. A value is a tag, or a small integer stored as itself plus SMALL_START.
// SHARED comes before an object the graph holds more than once, which REFERENCE then names by the
// order in which such objects come. A typed array is its class's tag, its length, and its elements
// as numbers.
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
const SHARED = 12;
const INT32_ARRAY = 13;
const UINT32_ARRAY = 14;
const UINT8_ARRAY = 15;
const SMALL_START = 16;
const SMALL_END = 1 << 28;

// The characters of the stream, none of which JSON or a JavaScript string escapes, and each one's
// digit.
const DIGITS = Array.from({ length: 65 }, (_value, index) => String.fromCharCode(35 + index))
  .filter((character) => character !== "\\")
  .join("");
const DIGIT_VALUES = new Int8Array(128).fill(-1);
for (let digit = 0; digit < 64; digit++) DIGIT_VALUES[DIGITS.charCodeAt(digit)] = digit;

// The tables of a graph, and the stream that reads them.
export interface EncodedGraph {
  tables: [strings: string[], shapes: string[][], numbers: number[]];
  stream: string;
}

const getChildren = (value: object): unknown[] =>
  Array.isArray(value)
    ? value
    : value instanceof Map
      ? [...value].flat()
      : value instanceof Set
        ? [...value]
        : Object.values(value);

export const encodeGraph = (root: unknown): EncodedGraph => {
  const strings: string[] = [];
  const stringIds = new Map<string, number>();
  const shapes: string[][] = [];
  const shapeIds = new Map<string, number>();
  const numbers: number[] = [];
  const stream: number[] = [];
  // How many times the graph holds each object.
  const counts = new Map<object, number>();
  const pending: unknown[] = [root];
  while (pending.length > 0) {
    const value = pending.pop();
    if (typeof value !== "object" || value === null) continue;
    const seen = counts.get(value) ?? 0;
    counts.set(value, seen + 1);
    if (seen > 0) continue;
    for (const child of getChildren(value)) pending.push(child);
  }
  const sharedIds = new Map<object, number>();
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
    const known = sharedIds.get(value);
    if (known !== undefined) {
      stream.push(REFERENCE, known);
      return;
    }
    if ((counts.get(value) ?? 0) > 1) {
      sharedIds.set(value, sharedIds.size);
      stream.push(SHARED);
    }
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
    if (
      value instanceof Int32Array ||
      value instanceof Uint32Array ||
      value instanceof Uint8Array
    ) {
      stream.push(
        value instanceof Int32Array
          ? INT32_ARRAY
          : value instanceof Uint32Array
            ? UINT32_ARRAY
            : UINT8_ARRAY,
        value.length,
      );
      for (let index = 0; index < value.length; index++) write(value[index]);
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
  return { tables: [strings, shapes, numbers], stream: digits.join("") };
};

export const decodeGraph = (encoded: EncodedGraph): unknown => {
  const [strings, shapes, numbers] = encoded.tables;
  const digits = encoded.stream;
  // An object of each shape for the objects of that shape to copy, which JSON gives room for its
  // keys, so that each copy holds its values in itself.
  const templates = shapes.map((keys): object =>
    JSON.parse(`{${keys.map((key) => `${JSON.stringify(key)}:0`).join(",")}}`),
  );
  // A function of each shape that makes an object that no other object shares, reading its values
  // in its keys' order, which a literal makes with its keys in place, faster than a copy of the
  // template that each key then fills.
  const makers = shapes.map(
    (keys) =>
      new Function(
        "read",
        `return {${keys.map((key) => `[${JSON.stringify(key)}]: read()`).join(", ")}};`,
      ) as (read: () => unknown) => object,
  );
  const shared: unknown[] = [];
  let position = 0;
  const next = () => {
    let digit = DIGIT_VALUES[digits.charCodeAt(position++)];
    if (digit < 32) return digit;
    let value = digit & 31;
    for (let scale = 32; ; scale *= 32) {
      digit = DIGIT_VALUES[digits.charCodeAt(position++)];
      value += (digit & 31) * scale;
      if (digit < 32) return value;
    }
  };
  const read = (isShared = false): unknown => {
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
        return shared[next()];
      case SHARED:
        return read(true);
      case ARRAY: {
        const length = next();
        const array: unknown[] = [];
        if (isShared) shared.push(array);
        for (let index = 0; index < length; index++) array.push(read());
        return array;
      }
      case MAP: {
        const size = next();
        const map = new Map<unknown, unknown>();
        if (isShared) shared.push(map);
        for (let index = 0; index < size; index++) {
          const key = read();
          map.set(key, read());
        }
        return map;
      }
      case SET: {
        const size = next();
        const set = new Set<unknown>();
        if (isShared) shared.push(set);
        for (let index = 0; index < size; index++) set.add(read());
        return set;
      }
      case INT32_ARRAY:
      case UINT32_ARRAY:
      case UINT8_ARRAY: {
        const length = next();
        const array =
          tag === INT32_ARRAY
            ? new Int32Array(length)
            : tag === UINT32_ARRAY
              ? new Uint32Array(length)
              : new Uint8Array(length);
        if (isShared) shared.push(array);
        for (let index = 0; index < length; index++) array[index] = Number(read());
        return array;
      }
      case OBJECT: {
        const shape = next();
        if (!isShared) return makers[shape](read);
        const keys = shapes[shape];
        const object: Record<string, unknown> = { ...templates[shape] };
        shared.push(object);
        for (const key of keys) object[key] = read();
        return object;
      }
      default:
        throw new TypeError(`A graph has no tag ${tag}`);
    }
  };
  return read();
};
