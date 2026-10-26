import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/subexpressions");

const SOURCE = readFileSync(join(DIRECTORY, "Subexpressions.tla"), "utf8");

const checkSubexpressions = (source: string, configName: string) =>
  check({
    source,
    config: readFileSync(join(DIRECTORY, configName), "utf8"),
    loadModule: (name) => readFileSync(join(DIRECTORY, `${name}.tla`), "utf8"),
  });

describe("subexpression references match TLC", () => {
  it("selects operands, bound bodies, labels, LET definitions, and instance operators", async () => {
    const result = await checkSubexpressions(SOURCE, "Subexpressions.cfg");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([5, 4, 4]);
  });

  it("reports violations of labeled subexpressions", async () => {
    const result = await checkSubexpressions(SOURCE, "Violation.cfg");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.name).toBe("Broken");
    expect(result.violation?.trace).toHaveLength(4);
  });

  it("rejects an assumption whose selected operand differs", async () => {
    const source = SOURCE.replace("ASSUME A!Double(4)!1!<< = 4", "ASSUME A!Double(4)!1!<< = 8");
    expect((await checkSubexpressions(source, "Subexpressions.cfg")).status).toBe(
      "assumption-violation",
    );
  });
});
