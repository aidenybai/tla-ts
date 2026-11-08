import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";

const FIXTURES = join(import.meta.dirname, "../fixtures/typed-tier");

const checkFixture = (name: string, isWarningEnabled: boolean) =>
  check({
    source: readFileSync(join(FIXTURES, `${name}.tla`), "utf8"),
    config: readFileSync(join(FIXTURES, `${name}.cfg`), "utf8"),
    isFingerprintDistanceSkipped: true,
    isWarningEnabled,
  });

describe("typed tier matches TLC", () => {
  it.each([
    ["ForallBranches", 10],
    ["LetBranches", 6],
    ["ArgumentBranches", 6],
    ["Arithmetic", 269],
    ["MixedValues", 109],
    ["SequenceOperators", 15],
    ["SubsetBounds", 881],
    ["RefinedBounds", 158],
    ["RepeatedActions", 547],
    ["FunctionDefinitions", 5533],
    ["SortedSequences", 3637],
    ["SymmetricProcesses", 553],
    ["SymmetricFunctions", 1361],
    ["SymmetricCounters", 1102],
    ["SubsetOrder", 20],
    ["ActionProperties", 34],
    ["RecordMembership", 18],
    ["MaskGroups", 97],
    ["UnionSets", 1417],
    ["UnionMembership", 161],
    ["SubsetMembership", 161],
    ["InitialComparers", 4],
    ["LateFields", 45],
    ["FilteredMembership", 280],
  ])("counts each successor TLC generates in %s", async (name, generatedStates) => {
    const results = await Promise.all([checkFixture(name, false), checkFixture(name, true)]);
    expect(results.map((result) => result.generatedStates)).toEqual([
      generatedStates,
      generatedStates,
    ]);
  });

  it.each([
    ["ActionFails", "liveness-violation", "Falls"],
    ["InitialFails", "liveness-violation", "StartsLow"],
    ["UnionOutside", "invariant-violation", "TypeOK"],
    ["SubsetOutside", "invariant-violation", "TypeOK"],
  ])("reports the property %s violates, as TLC does", async (name, status, property) => {
    const result = await checkFixture(name, true);
    expect([result.status, result.violation?.name]).toEqual([status, property]);
  });

  it("branches on the right side of => only with warnings off, like TLC", async () => {
    const results = await Promise.all([
      checkFixture("ImpliesBranches", false),
      checkFixture("ImpliesBranches", true),
    ]);
    expect(results.map((result) => [result.generatedStates, result.distinctStates])).toEqual([
      [6, 4],
      [4, 4],
    ]);
  });
});
