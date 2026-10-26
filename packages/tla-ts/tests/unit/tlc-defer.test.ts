import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/tlc-ext");

describe("TLCDefer matches TLC", () => {
  it("never evaluates its argument in breadth-first search", () => {
    const printed: string[] = [];
    const result = check({
      source: readFileSync(join(DIRECTORY, "Defer.tla"), "utf8"),
      config: readFileSync(join(DIRECTORY, "Defer.cfg"), "utf8"),
      onPrint: (text) => printed.push(text),
    });
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([3, 3, 3]);
    expect(printed).toEqual([]);
  });
});
