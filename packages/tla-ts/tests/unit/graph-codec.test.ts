import { describe, expect, it } from "vite-plus/test";
import { parseModule } from "../../src";
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

  it("read back a deferred value as its property is first read, sharing what the rest holds", () => {
    const shared = { line: 1 };
    const inner = { shared, list: [shared] };
    const first = { name: "a", body: { inner, own: [inner] } };
    const second = { name: "b", body: { shared, nested: { name: "c", body: [shared] } } };
    const graph = { first, second, kept: shared };
    const isDeferred = (_holder: object, key: string) => key === "body";
    const encoded = JSON.parse(JSON.stringify(encodeGraph(graph, isDeferred)));
    expect(encoded.tables[3]).toHaveLength(3);
    const decoded = decodeGraph(encoded) as typeof graph;
    expect(decoded).toStrictEqual(graph);
    expect(decoded.first.body.inner.shared).toBe(decoded.kept);
    expect(decoded.first.body.own[0]).toBe(decoded.first.body.inner);
    expect(decoded.second.body.nested.body[0]).toBe(decoded.kept);
    expect(decoded.first.body).toBe(decoded.first.body);
    decoded.second.body = { shared, nested: { name: "d", body: [] } };
    expect(decoded.second.body.nested.name).toBe("d");
  });

  it("read back a module's locations, with the module's positions once", () => {
    const module = parseModule("---- MODULE M ----\nA == 1 + 2\nB == <<A, A>>\n====\n");
    const encoded = encodeGraph(module);
    const read = decodeGraph(JSON.parse(JSON.stringify(encoded))) as typeof module;
    const getPlace = (location: (typeof module)["location"]) => [
      location.line,
      location.column,
      location.range,
    ];
    module.definitions.forEach((definition, index) => {
      const readDefinition = read.definitions[index];
      expect(getPlace(readDefinition.location)).toEqual(getPlace(definition.location));
      if (definition.kind === "Operator" && readDefinition.kind === "Operator") {
        expect(getPlace(readDefinition.body.location)).toEqual(getPlace(definition.body.location));
      }
    });
    expect(encoded.tables[1].filter((keys) => keys.includes("endColumns"))).toHaveLength(1);
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
