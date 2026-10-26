import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check, formatValue } from "../../src";

const FIXTURES = join(import.meta.dirname, "../fixtures");

const checkFixture = (directory: string, name: string) =>
  check({
    source: readFileSync(join(FIXTURES, directory, `${name}.tla`), "utf8"),
    config: readFileSync(join(FIXTURES, directory, `${name}.cfg`), "utf8"),
  });

describe("check matches TLC", () => {
  it("evaluates every assumption in the semantics fixture", () => {
    const result = checkFixture("semantics", "Semantics");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([2, 1, 1]);
  });

  it("explores the mutex state space", () => {
    const result = checkFixture("mutex", "Mutex");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([18, 10, 4]);
  });

  it("explores a commit protocol over model values", () => {
    const result = checkFixture("commit", "Commit");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([890, 251, 11]);
  });

  it("stops exploring states that fail a constraint", () => {
    const result = checkFixture("queue", "Queue");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([181, 105, 9]);
  });

  it("reports the shortest trace to an invariant violation", () => {
    const result = checkFixture("water-jugs", "WaterJugs");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.name).toBe("GoalNotReached");
    const trace = result.violation?.trace ?? [];
    expect(trace).toHaveLength(7);
    expect(trace[0].action).toBeUndefined();
    expect(formatValue(trace[6].state.large)).toBe("4");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([73, 14, 7]);
  });

  it("reports deadlock with the trace that reaches it", () => {
    const result = checkFixture("counter", "Counter");
    expect(result.status).toBe("deadlock");
    expect(result.violation?.trace.map((step) => step.action)).toEqual([
      undefined,
      "Increment",
      "Increment",
      "Increment",
    ]);
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([4, 4, 4]);
  });
});
