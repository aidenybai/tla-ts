import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check, TlaConfigError } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/modules");

const checkNested = (configName: string, moduleName = "Nested") =>
  check({
    source: readFileSync(join(DIRECTORY, `${moduleName}.tla`), "utf8"),
    config: readFileSync(join(DIRECTORY, configName), "utf8"),
  });

describe("nested and trailing modules match TLC", () => {
  it("instantiates a nested module that uses the enclosing module's definitions", async () => {
    const result = await checkNested("Nested.cfg");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([5, 4, 4]);
  });

  it("reports violations through a nested module's actions", async () => {
    const result = await checkNested("Violation.cfg");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.name).toBe("TooSmall");
    expect(result.violation?.trace).toHaveLength(4);
  });

  it("overrides definitions of other modules but not of the root module for scoped overrides", async () => {
    const results = await Promise.all(
      ["Scoped.cfg", "ScopedRoot.cfg"].map((configName) => checkNested(configName, "Scoped")),
    );
    results.forEach((result) => {
      expect(result.status).toBe("invariant-violation");
      expect(result.violation?.trace).toHaveLength(5);
      expect([result.generatedStates, result.distinctStates]).toEqual([5, 5]);
    });
  });

  it("does not assign constants through scoped values", async () => {
    await expect(
      check({
        source: readFileSync(join(DIRECTORY, "Nested.tla"), "utf8"),
        config: "CONSTANT Limit = [Nested]3\nSPECIFICATION Spec\n",
      }),
    ).rejects.toThrow(TlaConfigError);
  });
});
