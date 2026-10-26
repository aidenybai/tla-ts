import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/instances");

const checkInstances = (configName: string, moduleName = "Instances") =>
  check({
    source: readFileSync(join(DIRECTORY, `${moduleName}.tla`), "utf8"),
    config: readFileSync(join(DIRECTORY, configName), "utf8"),
    loadModule: (name) => readFileSync(join(DIRECTORY, `${name}.tla`), "utf8"),
  });

describe("INSTANCE matches TLC", () => {
  it("substitutes constants and variables in named, parameterized, and unnamed instances", () => {
    const result = checkInstances("Instances.cfg");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([244, 27, 4]);
  });

  it("reports violations through instantiated operators", () => {
    const result = checkInstances("Violation.cfg");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.name).toBe("Different");
    expect(result.violation?.trace).toHaveLength(4);
  });

  it("scopes LOCAL instances per module and overrides definitions shared by instances", () => {
    const result = checkInstances("Scoping.cfg", "Scoping");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([4, 4, 4]);
  });
});
