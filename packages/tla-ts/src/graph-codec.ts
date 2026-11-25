import { TokenLocation, type PositionTable } from "./source-location";

// Writes a graph of plain objects, arrays, maps, sets, and primitives as JSON-ready tables and a
// stream, and reads it back with the same keys in the same order and the same objects shared, so
// that a build can prepare a structure once that each process reads rather than computes.

// The stream is a string of variable-length integers, five bits to a character with a sixth that
// marks one more character. A value is a tag, or a small integer stored as itself plus SMALL_START.
// SHARED comes before an object the graph holds more than once, which REFERENCE then names by the
// order in which such objects come. A typed array is its class's tag, its length, and its elements
// as numbers. A node's location is its line, its column, its module's table of positions, and the
// tokens of its range, each one past its index, as a location without a range has none.
//
// A deferred value, which a graph holds once, is DEFERRED and the index of a segment that the
// stream holds after the graph, which a read of the value's property first decodes. The objects
// that two segments, or a segment and the rest, both hold come first, in a pool, so that each
// segment's REFERENCE names an object of the rest, and LOCAL names one of its own.
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
const DEFERRED = 16;
const LOCAL = 17;
const LOCATION = 18;
const SMALL_START = 19;
const SMALL_END = 1 << 28;

// The characters of the stream, none of which JSON or a JavaScript string escapes, and each one's
// digit.
const DIGITS = Array.from({ length: 65 }, (_value, index) => String.fromCharCode(35 + index))
  .filter((character) => character !== "\\")
  .join("");
const DIGIT_VALUES = new Int8Array(128).fill(-1);
for (let digit = 0; digit < 64; digit++) DIGIT_VALUES[DIGITS.charCodeAt(digit)] = digit;

// The tables of a graph, and the stream that reads them: where each segment starts in it, and the
// shapes whose objects hold a deferred value.
export interface EncodedGraph {
  tables: [
    strings: string[],
    shapes: string[][],
    numbers: number[],
    segments?: number[],
    deferredShapes?: number[],
  ];
  stream: string;
}

// Whether a property of an object holds a value that a graph decodes where it's first read.
type IsDeferred = (holder: object, key: string) => boolean;

const getChildren = (value: object): unknown[] =>
  value instanceof TokenLocation
    ? [value.table]
    : Array.isArray(value)
      ? value
      : value instanceof Map
        ? [...value].flat()
        : value instanceof Set
          ? [...value]
          : Object.values(value);

export const encodeGraph = (root: unknown, isDeferred: IsDeferred = () => false): EncodedGraph => {
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
  // Whether an object's property holds a value that the graph defers.
  const isDeferredValue = (holder: object, key: string, value: unknown) =>
    typeof value === "object" &&
    value !== null &&
    counts.get(value) === 1 &&
    Object.getPrototypeOf(holder) === Object.prototype &&
    isDeferred(holder, key);
  // The segment that holds each object, by the deferred value that starts it, or root for the rest;
  // an object that two hold goes in the pool.
  const owners = new Map<object, unknown>();
  const pool: object[] = [];
  const pooled = new Set<object>();
  const owned: [value: unknown, owner: unknown][] = [[root, root]];
  while (owned.length > 0) {
    const [value, owner] = owned.pop() as [unknown, unknown];
    if (typeof value !== "object" || value === null) continue;
    const known = owners.get(value);
    if (known !== undefined) {
      if (known !== owner && !pooled.has(value)) {
        pooled.add(value);
        pool.push(value);
      }
      continue;
    }
    owners.set(value, owner);
    if (Object.getPrototypeOf(value) === Object.prototype) {
      for (const key of Object.keys(value)) {
        const child = Reflect.get(value, key);
        owned.push([child, isDeferredValue(value, key, child) ? child : owner]);
      }
    } else {
      for (const child of getChildren(value)) owned.push([child, owner]);
    }
  }
  const segments: unknown[] = [];
  const segmentStarts: number[] = [];
  const deferredShapes = new Set<number>();
  // The shared objects of the rest, and of the segment being written.
  const sharedIds = new Map<object, number>();
  let localIds = new Map<object, number>();
  let isSegment = false;
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
    const local = localIds.get(value);
    if (local !== undefined) {
      stream.push(LOCAL, local);
      return;
    }
    if ((counts.get(value) ?? 0) > 1) {
      if (isSegment && !pooled.has(value)) localIds.set(value, localIds.size);
      else sharedIds.set(value, sharedIds.size);
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
    if (value instanceof TokenLocation) {
      stream.push(LOCATION);
      write(value.line);
      write(value.column);
      write(value.table);
      write(value.startToken + 1);
      write(value.endToken + 1);
      return;
    }
    if (prototype !== Object.prototype) throw new TypeError("A graph holds only plain objects");
    const keys = Object.keys(value);
    const shape = getShapeId(keys);
    stream.push(OBJECT, shape);
    for (const key of keys) {
      const child = Reflect.get(value, key);
      if (isDeferredValue(value, key, child)) {
        deferredShapes.add(shape);
        stream.push(DEFERRED, segments.push(child) - 1);
      } else {
        write(child);
      }
    }
  };
  stream.push(pool.length);
  pool.forEach(write);
  write(root);
  isSegment = true;
  for (let segment = 0; segment < segments.length; segment++) {
    localIds = new Map();
    segmentStarts.push(stream.length);
    write(segments[segment]);
  }
  const digits: string[] = [];
  // Where each segment starts among the digits.
  const starts: number[] = [];
  stream.forEach((value, index) => {
    if (index === segmentStarts[starts.length]) starts.push(digits.length);
    for (let rest = value; ; rest = Math.floor(rest / 32)) {
      const isLast = rest < 32;
      digits.push(DIGITS[(rest % 32) + (isLast ? 0 : 32)]);
      if (isLast) break;
    }
  });
  return {
    tables:
      segments.length === 0
        ? [strings, shapes, numbers]
        : [strings, shapes, numbers, starts, [...deferredShapes]],
    stream: digits.join(""),
  };
};

// The segment of a deferred value, which read gives in its place, until its object takes it.
class Deferred {
  readonly segment: number;
  constructor(segment: number) {
    this.segment = segment;
  }
}

export const decodeGraph = (encoded: EncodedGraph): unknown => {
  const [strings, shapes, numbers, segmentStarts = [], deferredShapes = []] = encoded.tables;
  const isDeferredShape = new Uint8Array(shapes.length);
  for (const shape of deferredShapes) isDeferredShape[shape] = 1;
  // Each segment's value, in its own slot, once a read of its property decoded it.
  const segmentValues: unknown[] = Array.from({ length: segmentStarts.length });
  const isDecoded = new Uint8Array(segmentStarts.length);
  const digits = encoded.stream;
  // An object of each shape for the objects of that shape to copy, which JSON gives room for its
  // keys, so that each copy holds its values in itself.
  const templates = shapes.map((keys): object =>
    JSON.parse(`{${keys.map((key) => `${JSON.stringify(key)}:0`).join(",")}}`),
  );
  // A function of each shape that makes an object that no other object shares, reading its values
  // in its keys' order, which a literal makes with its keys in place, faster than a copy of the
  // template that each key then fills. V8 gives a literal whose keys are written, not computed, the
  // hidden class of the source's literals with those keys, so the checker's reads of a decoded
  // value stay monomorphic. A written __proto__ would set the prototype, so it stays computed.
  const makers = shapes.map(
    (keys) =>
      new Function(
        "read",
        `return {${keys.map((key) => `${key === "__proto__" ? `["__proto__"]` : JSON.stringify(key)}: read()`).join(", ")}};`,
      ) as (read: () => unknown) => object,
  );
  const shared: unknown[] = [];
  let local: unknown[] = shared;
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
      case LOCAL:
        return local[next()];
      case DEFERRED:
        return new Deferred(next());
      case SHARED:
        return read(true);
      case ARRAY: {
        const length = next();
        const array: unknown[] = [];
        if (isShared) local.push(array);
        for (let index = 0; index < length; index++) array.push(read());
        return array;
      }
      case MAP: {
        const size = next();
        const map = new Map<unknown, unknown>();
        if (isShared) local.push(map);
        for (let index = 0; index < size; index++) {
          const key = read();
          map.set(key, read());
        }
        return map;
      }
      case SET: {
        const size = next();
        const set = new Set<unknown>();
        if (isShared) local.push(set);
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
        if (isShared) local.push(array);
        // An element is almost always a small integer, which the loop reads as itself.
        for (let index = 0; index < length; index++) {
          const element = next();
          array[index] = element >= SMALL_START ? element - SMALL_START : numbers[next()];
        }
        return array;
      }
      case LOCATION: {
        // A location's table, which it reads, comes after it in the order of shared objects.
        const slots = local;
        const slot = slots.length;
        if (isShared) slots.push(undefined);
        const line = Number(read());
        const column = Number(read());
        const table = read() as PositionTable;
        const location = new TokenLocation(line, column, table);
        const startToken = Number(read()) - 1;
        location.setRange(startToken, Number(read()) - 1);
        if (isShared) slots[slot] = location;
        return location;
      }
      case OBJECT: {
        const shape = next();
        if (!isShared && isDeferredShape[shape] === 0) return makers[shape](read);
        const keys = shapes[shape];
        const object: Record<string, unknown> = { ...templates[shape] };
        if (isShared) local.push(object);
        for (const key of keys) {
          const value = read();
          if (value instanceof Deferred) defer(object, key, value.segment);
          else object[key] = value;
        }
        return object;
      }
      default:
        throw new TypeError(`A graph has no tag ${tag}`);
    }
  };
  // A property whose value a read first decodes from its segment, after which it holds the value.
  const defer = (object: Record<string, unknown>, key: string, segment: number) =>
    Object.defineProperty(object, key, {
      get: () => {
        if (isDecoded[segment] === 0) {
          const outerPosition = position;
          const outerLocal = local;
          position = segmentStarts[segment];
          local = [];
          segmentValues[segment] = read();
          isDecoded[segment] = 1;
          position = outerPosition;
          local = outerLocal;
        }
        return segmentValues[segment];
      },
      set: (value: unknown) => {
        Object.defineProperty(object, key, {
          value,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      },
      enumerable: true,
      configurable: true,
    });
  const poolSize = next();
  for (let index = 0; index < poolSize; index++) read();
  return read();
};
