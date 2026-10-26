import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/modules");

const checkNested = (configName: string) =>
  check({
    source: readFileSync(join(DIRECTORY, "Nested.tla"), "utf8"),
    config: readFileSync(join(DIRECTORY, configName), "utf8"),
  });

describe("nested and trailing modules match TLC", () => {
  it("instantiates a nested module that uses the enclosing module's definitions", () => {
    const result = checkNested("Nested.cfg");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([5, 4, 4]);
  });

  it("reports violations through a nested module's actions", () => {
    const result = checkNested("Violation.cfg");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.name).toBe("TooSmall");
    expect(result.violation?.trace).toHaveLength(4);
  });
});
