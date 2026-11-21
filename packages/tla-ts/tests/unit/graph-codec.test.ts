import { describe, expect, it } from "vite-plus/test";
import { decodeGraph, encodeGraph } from "../../src/graph-codec";
import {
  createTuple,
  createWrittenFunction,
  formatValue,
  getDomainInterval,
  getPlainValues,
  readPlainValues,
  toFiniteFunction,
  valuesEqual,
  type Value,
} from "../../src/values";

describe("graphs", () => {
  it("read back with their keys in order, their objects shared, and their collections", () => {
    const shared = { line: 1, column: 2 };
    const graph = {
      first: shared,
      second: [shared, undefined, null, -1.5, 2 ** 40, "text", true, 10n],
      absent: undefined,
      map: new Map<unknown, unknown>([[shared, new Set(["a", 3])]]),
    };
    const decoded = decodeGraph(JSON.parse(JSON.stringify(encodeGraph(graph))));
    expect(decoded).toStrictEqual(graph);
    expect(Object.keys(decoded as object)).toEqual(["first", "second", "absent", "map"]);
    const read = decoded as typeof graph;
    expect(read.second[0]).toBe(read.first);
    expect([...read.map.keys()][0]).toBe(read.first);
  });

  it("read back an object's own keys that name special properties", () => {
    const graph = [JSON.parse('{"__proto__": 1, "constructor": 2}'), { "a b": [3] }];
    const decoded = decodeGraph(JSON.parse(JSON.stringify(encodeGraph(graph)))) as object[];
    expect(decoded).toStrictEqual(graph);
    expect(Object.getPrototypeOf(decoded[0])).toBe(Object.prototype);
    expect(Object.keys(decoded[0])).toEqual(["__proto__", "constructor"]);
  });

  it("read back typed arrays", () => {
    const graph = [Int32Array.of(-1, 2), Uint32Array.of(2 ** 32 - 1), Uint8Array.of(0, 255)];
    expect(decodeGraph(JSON.parse(JSON.stringify(encodeGraph(graph))))).toStrictEqual(graph);
  });

  it("reject what JSON can't hold", () => {
    expect(() => encodeGraph({ value: Number.NaN })).toThrow(TypeError);
    expect(() => encodeGraph({ value: new Date(0) })).toThrow(TypeError);
  });
});

describe("values in a graph", () => {
  const tuple = createTuple([1, 2, 3]);
  const values: Value[] = [
    tuple,
    createWrittenFunction([
      ["b", tuple],
      ["a", 1],
    ]),
    "text",
    true,
  ];
  const read = readPlainValues(
    decodeGraph(JSON.parse(JSON.stringify(encodeGraph(getPlainValues(values))))) as unknown[],
  );

  it("read back equal, printed alike, and shared", () => {
    read.forEach((value, index) => {
      expect(valuesEqual(value, values[index])).toBe(true);
      expect(formatValue(value)).toBe(formatValue(values[index]));
    });
    expect(toFiniteFunction(read[1]).range[1]).toBe(read[0]);
  });

  it("keep the domain 1..n of a tuple as an interval", () => {
    expect(getDomainInterval(toFiniteFunction(read[0]).domain)).toEqual(
      getDomainInterval(tuple.domain),
    );
  });
});
