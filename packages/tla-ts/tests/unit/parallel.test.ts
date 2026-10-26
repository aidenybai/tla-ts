import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";

const FIXTURES = join(import.meta.dirname, "../fixtures");
const DIST = join(import.meta.dirname, "../../dist/index.js");

const loadPackage = (): Promise<typeof import("../../src")> => import(DIST);

const checkFixtureInParallel = async (directory: string, name: string, workers: number) => {
  const tlaTs = await loadPackage();
  return tlaTs.check({
    source: readFileSync(join(FIXTURES, directory, `${name}.tla`), "utf8"),
    config: readFileSync(join(FIXTURES, directory, `${name}.cfg`), "utf8"),
    workers,
  });
};

const getCounts = (result: { generatedStates: number; distinctStates: number; depth: number }) => [
  result.generatedStates,
  result.distinctStates,
  result.depth,
];

describe("check with workers matches TLC", () => {
  it.each([2, 3, 4])("explores the commit protocol with %i workers", async (workers) => {
    const result = await checkFixtureInParallel("commit", "Commit", workers);
    expect(result.status).toBe("success");
    expect(getCounts(result)).toEqual([890, 251, 11]);
  });

  it("explores a queue that only grows to its bound", async () => {
    const result = await checkFixtureInParallel("queue", "Queue", 3);
    expect(result.status).toBe("success");
    expect(getCounts(result)).toEqual([181, 105, 9]);
  });

  it("reduces states under a symmetry set", async () => {
    const result = await checkFixtureInParallel("symmetry", "Symmetry", 2);
    expect(result.status).toBe("success");
    expect(getCounts(result)).toEqual([42, 10, 7]);
  });

  it("reports the shortest invariant violation trace like one worker", async () => {
    const result = await checkFixtureInParallel("water-jugs", "WaterJugs", 4);
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.name).toBe("GoalNotReached");
    expect(result.violation?.trace).toHaveLength(7);
    expect(getCounts(result)).toEqual([73, 14, 7]);
  });

  it("reports deadlock with its trace like one worker", async () => {
    const result = await checkFixtureInParallel("counter", "Counter", 2);
    expect(result.status).toBe("deadlock");
    expect(result.violation?.trace.map((step) => step.action)).toEqual([
      undefined,
      "Increment",
      "Increment",
      "Increment",
    ]);
    expect(getCounts(result)).toEqual([4, 4, 4]);
  });
});
