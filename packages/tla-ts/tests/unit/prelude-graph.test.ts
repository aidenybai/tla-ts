import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { decodeGraph, encodeGraph } from "../../src/graph-codec";
import { getPreludeGraph, prepareJavaScriptModule } from "../../src/typescript/javascript";

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

  it("reject what JSON can't hold", () => {
    expect(() => encodeGraph({ value: Number.NaN })).toThrow(TypeError);
    expect(() => encodeGraph({ value: new Date(0) })).toThrow(TypeError);
  });
});

describe("the prepared JavaScript module", () => {
  const graph = getPreludeGraph(prepareJavaScriptModule());

  it("is in the built bundle as a fresh preparation writes it", () => {
    const literal = JSON.stringify(JSON.stringify(graph));
    const dist = join(import.meta.dirname, "../../dist");
    const bundles = readdirSync(dist)
      .filter((name) => name.endsWith(".js"))
      .map((name) => readFileSync(join(dist, name), "utf8"));
    expect(bundles.some((text) => text.includes(literal))).toBe(true);
  });

  it("reads back as the graph it was written from", () => {
    expect(encodeGraph(decodeGraph(JSON.parse(JSON.stringify(graph))))).toEqual(graph);
  });
});
