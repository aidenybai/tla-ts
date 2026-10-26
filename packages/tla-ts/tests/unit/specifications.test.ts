import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check, TlaConfigError, TlaError } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/specifications");

const checkSpecification = (config: string, moduleName = "Specifications", values = "{a, b}") =>
  check({
    source: readFileSync(join(DIRECTORY, `${moduleName}.tla`), "utf8"),
    config: moduleName === "Specifications" ? `CONSTANT P = ${values}\n${config}` : config,
    loadModule: (name) => readFileSync(join(DIRECTORY, `${name}.tla`), "utf8"),
  });

const getSummary = (config: string, moduleName?: string) => {
  const result = checkSpecification(config, moduleName);
  return [result.status, result.generatedStates, result.distinctStates, result.depth];
};

describe("SPECIFICATION matches TLC", () => {
  it.each(["Argument", "Twice", "Instance", "Local"])(
    "takes the initial predicate and next-state relation of %s from operator arguments",
    (name) => {
      expect(getSummary(`SPECIFICATION ${name}\nINVARIANT Inv`)).toEqual(["success", 6, 2, 1]);
    },
  );

  it("keeps fairness under a bounded universal quantifier as one temporal formula", () => {
    expect(getSummary("SPECIFICATION ForallFair\nPROPERTY Visits")).toEqual(["success", 6, 2, 1]);
    expect(getSummary("SPECIFICATION Argument\nPROPERTY Visits")[0]).toBe("liveness-violation");
  });

  it.each(["InsideForall", "InsideExists", "ForallInit", "ForallNext"])(
    "takes no initial predicate or next-state relation from inside the quantifier of %s",
    (name) => {
      expect(() => checkSpecification(`SPECIFICATION ${name}`, "Specifications", "{1}")).toThrow(
        TlaError,
      );
    },
  );

  it.each(["TemporalExists", "TemporalForall"])("rejects the temporal quantifier of %s", (name) => {
    expect(() => checkSpecification(`SPECIFICATION ${name}`)).toThrow(
      new TlaConfigError(
        "TLC does not support temporal existential, nor universal, quantification over state variables",
      ),
    );
  });

  it.each(["Spec", "SpecNext", "SpecAction"])(
    "passes the formulas of %s through operator parameters",
    (name) => {
      expect(getSummary(`SPECIFICATION ${name}`, "Github1244")).toEqual(["success", 3, 2, 2]);
    },
  );
});
