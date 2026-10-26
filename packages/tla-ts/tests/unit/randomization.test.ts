import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check, formatValue } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/randomization");

const checkWithSeed = (name: string, seed: bigint) =>
  check({
    source: readFileSync(join(DIRECTORY, `${name}.tla`), "utf8"),
    config: readFileSync(join(DIRECTORY, `${name}.cfg`), "utf8"),
    seed,
  });

const getSummary = async (name: string, seed: bigint) => {
  const result = await checkWithSeed(name, seed);
  return [result.status, result.generatedStates, result.distinctStates];
};

// TLC's tests run these specs with -fp 0 and -seed 1 unless they pass another seed.
describe("random choices match TLC run with -fp 0 and the same -seed", () => {
  it("picks RandomElement in the next-state relation from the predecessor's fingerprint", async () => {
    const result = await checkWithSeed("RandomElementXandY", 8006642976694192746n);
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "invariant-violation",
      3,
      3,
    ]);
    expect(result.violation?.trace.map((step) => [step.state.x, step.state.y])).toEqual([
      [0, 0],
      [1, 1],
      [0, 1],
    ]);
    expect(await getSummary("RandomElementXandY", 2n)).toEqual(["success", 3, 2]);
  });

  it("checks the RandomElement spec from TLC's RandomElementTest", async () => {
    const result = await checkWithSeed("RandomElement", 8006803340504660123n);
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "invariant-violation",
      932,
      855,
    ]);
    expect(result.violation?.trace.map((step) => step.state.x)).toEqual([
      843, 920, 483, 173, 590, 104, 785, 463, 443, 151, 767,
    ]);
  });

  it("checks the RandomSubsetNext spec from TLC's RandomSubsetNextTest", async () => {
    const result = await checkWithSeed("RandomSubsetNext", 15041980n);
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "invariant-violation",
      67291,
      7729,
    ]);
    expect(result.violation?.trace.map((step) => step.state.x)).toEqual([
      23, 26, 18, 29, 189, 19, 92, 250, 41, 52, 78,
    ]);
  });

  it.each([
    [15041980n, 129202, 100000008, [113, 155, 35], [2708, 3048, 3471]],
    [918347981374n, 604, 100000000, [15, 152, 5], [86, 170, 1612]],
  ])(
    "draws the RandomSubsetATest and RandomSubsetBTest values for seed %s",
    async (seed, x, y, p, q) => {
      const result = await checkWithSeed("RandomSubset", seed);
      expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
        "invariant-violation",
        8009,
        8009,
      ]);
      const initial = result.violation?.trace[0].state;
      expect([initial?.x, initial?.y]).toEqual([x, y]);
      expect(
        [initial?.p, initial?.q].map((tuple) =>
          typeof tuple === "object" && tuple.kind === "Function" ? tuple.range : undefined,
        ),
      ).toEqual([p, q]);
    },
  );

  it("checks the specs of TLC's RandomSubsetNextTuplesTest and RandomSubsetSetOfFcnsTest", async () => {
    expect(await getSummary("RandomSubsetNextTuples", 1n)).toEqual([
      "invariant-violation",
      5461,
      5461,
    ]);
    expect(await getSummary("RandomSubsetSetOfFcns", 1n)).toEqual(["success", 2000, 1000]);
  });

  it("evaluates a random constant definition once, as Github648 expects", async () => {
    expect(
      await Promise.all(
        [1n, -2252017213236477395n, 8006642976694192746n].map((seed) =>
          getSummary("Github648", seed),
        ),
      ),
    ).toEqual([
      ["success", 1332, 36],
      ["success", 4160, 64],
      ["success", 90, 9],
    ]);
  });

  it("reseeds from the tokens TLC interns model values with", async () => {
    const result = await checkWithSeed("RandomModelValue", 1n);
    expect(result.violation?.trace.map((step) => formatValue(step.state.owner))).toEqual([
      "p1",
      "p3",
      "p2",
      "p1",
      "p1",
      "p2",
      "p3",
    ]);
  });

  it('reports the seed in TLCGet("config")', async () => {
    const result = await check({
      source:
        '---- MODULE M ----\nEXTENDS TLC\nVARIABLE x\nInit == x = 0\nNext == UNCHANGED x\nASSUME TLCGet("config").seed = "-42"\n====',
      config: "INIT Init\nNEXT Next",
      seed: -42n,
    });
    expect(result.status).toBe("success");
  });
});
