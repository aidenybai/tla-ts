import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/tlc-ext");

const checkFixture = (name: string, configName = name) =>
  check({
    source: readFileSync(join(DIRECTORY, `${name}.tla`), "utf8"),
    config: readFileSync(join(DIRECTORY, `${configName}.cfg`), "utf8"),
  });

describe("TLCExt matches TLC", () => {
  it("checks TLC's TLCExtTrace model with Trace in an invariant and a constraint", () => {
    const result = checkFixture("TLCExtTrace");
    expect(result.status).toBe("deadlock");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([10, 10, 10]);
  });

  it("checks TLC's TLCExtTrace model with an alias", () => {
    const result = checkFixture("TLCExtTrace", "TLCExtTraceAlias");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.trace).toHaveLength(7);
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([7, 7, 7]);
  });

  it("ends Trace in the state that the next-state relation extends", () => {
    const result = checkFixture("TraceNext");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([5, 5, 5]);
  });
});
