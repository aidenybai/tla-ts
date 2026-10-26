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

  it("substitutes operator parameters with LAMBDA expressions without capturing bound names", () => {
    const result = checkInstances("Operators.cfg", "Operators");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([113, 28, 7]);
  });

  it("reports violations through LAMBDA substitutions", () => {
    const result = checkInstances("OperatorsViolation.cfg", "Operators");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.trace).toHaveLength(4);
    expect([result.generatedStates, result.distinctStates]).toEqual([37, 16]);
  });

  it("instantiates modules inside LET with substitutions that use local names", () => {
    const result = checkInstances("LetInstances.cfg", "LetInstances");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([193, 96, 19]);
  });

  it("reports violations through instances defined inside LET", () => {
    const result = checkInstances("LetInstancesViolation.cfg", "LetInstances");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.trace).toHaveLength(5);
    expect(result.distinctStates).toBe(11);
  });

  it("checks a specification taken from a parameterized instance", () => {
    const result = checkInstances("ParameterizedSpec.cfg", "ParameterizedSpec");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([4, 4, 4]);
  });

  it("reports violations of a specification taken from a parameterized instance", () => {
    const result = checkInstances("ParameterizedSpecViolation.cfg", "ParameterizedSpec");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.trace).toHaveLength(4);
    expect([result.generatedStates, result.distinctStates]).toEqual([4, 4]);
  });

  it("keeps instance parameters apart from names bound inside the instance", () => {
    const result = checkInstances("Capture.cfg", "Capture");
    expect([result.status, result.generatedStates, result.distinctStates, result.depth]).toEqual([
      "success",
      3,
      2,
      2,
    ]);
  });

  it("instantiates parameterized modules inside LET", () => {
    const result = checkInstances("LetParameters.cfg", "LetParameters");
    expect([result.status, result.violation?.trace.length, result.distinctStates]).toEqual([
      "invariant-violation",
      4,
      4,
    ]);
  });
});
