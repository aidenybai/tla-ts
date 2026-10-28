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

  it("reports an invariant that fails to evaluate on an initial state like one worker", async () => {
    const tlaTs = await loadPackage();
    const result = await tlaTs.check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nInit == x \\in 0..1\nNext == UNCHANGED x\nInv == 1 \\div x = 0\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      workers: 2,
    });
    expect(result.failure?.message).toBe("The second argument of \\div is 0.");
    expect(result.failure?.exitCode).toBe(75);
  });

  it("summarizes the outdegrees and the fingerprints of every worker like one worker", async () => {
    const tlaTs = await loadPackage();
    const directory = join(import.meta.dirname, "../../benchmarks/queue");
    const options = {
      source: readFileSync(join(directory, "Queue.tla"), "utf8"),
      config: readFileSync(join(directory, "Queue.cfg"), "utf8"),
    };
    const [sequential, parallel] = await Promise.all([
      tlaTs.check(options),
      tlaTs.check({ ...options, workers: 3 }),
    ]);
    expect(parallel.fingerprintDistance).toBe(sequential.fingerprintDistance);
    expect(parallel.fingerprintDistance).toBeDefined();
    const getTotals = (outDegrees: number[] | undefined = []) => [
      outDegrees.reduce((sum, count) => sum + count, 0),
      outDegrees.reduce((sum, count, degree) => sum + count * degree, 0),
    ];
    expect(getTotals(parallel.outDegrees)).toEqual(getTotals(sequential.outDegrees));
  });

  it("reports an invariant that a successor outside the action constraint violates", async () => {
    const tlaTs = await loadPackage();
    const result = await tlaTs.check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x \\in 0..1\nNext == x < 5 /\\ x' = x + 1\nInv == x # 3\nSkip == x' # 3\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nACTION_CONSTRAINT Skip\nCHECK_DEADLOCK FALSE",
      workers: 2,
    });
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.name).toBe("Inv");
    expect(result.violation?.trace).toHaveLength(3);
  });

  it("prints what assumptions print once when it checks on the calling thread", async () => {
    const tlaTs = await loadPackage();
    const printed: string[] = [];
    const result = await tlaTs.check({
      source:
        '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nASSUME PrintT("start")\nInit == x = 0\nNext == x\' = (x + 1) % 3\nSpec == Init /\\ [][Next]_x /\\ WF_x(Next)\nLive == <>(x = 2)\n====',
      config: "SPECIFICATION Spec\nPROPERTY Live",
      workers: 2,
      onPrint: (text) => printed.push(text),
    });
    expect(result.status).toBe("success");
    expect(printed).toEqual(['"start"']);
  });

  it("grows the fingerprint table that workers share while they expand a level", async () => {
    const tlaTs = await loadPackage();
    const result = await tlaTs.check({
      source:
        "---- MODULE Grid ----\nEXTENDS Naturals\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == \\/ x < 99 /\\ x' = x + 1 /\\ y' = y\n        \\/ y < 99 /\\ y' = y + 1 /\\ x' = x\n====",
      config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      workers: 4,
    });
    expect(result.status).toBe("success");
    expect(getCounts(result)).toEqual([19801, 10000, 199]);
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

  it.each([2, 3])("orders sets of strings like TLC with %i workers", async (workers) => {
    const result = await checkFixtureInParallel("strings", "StringSets", workers);
    expect(result.status).toBe("success");
    expect(getCounts(result)).toEqual([76, 31, 5]);
  });

  it("checks specs that create strings while checking like one worker", async () => {
    const result = await checkFixtureInParallel("strings", "RuntimeStrings", 2);
    expect(result.status).toBe("success");
    expect(getCounts(result)).toEqual([115, 97, 6]);
  });
});
