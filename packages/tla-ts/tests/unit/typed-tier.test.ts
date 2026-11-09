import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";

const FIXTURES = join(import.meta.dirname, "../fixtures/typed-tier");

const checkFixture = (name: string, isWarningEnabled: boolean, isTyped = true) =>
  check({
    source: readFileSync(join(FIXTURES, `${name}.tla`), "utf8"),
    config: readFileSync(join(FIXTURES, `${name}.cfg`), "utf8"),
    loadModule: (module) => {
      const path = join(FIXTURES, `${module}.tla`);
      return existsSync(path) ? readFileSync(path, "utf8") : undefined;
    },
    isFingerprintDistanceSkipped: isTyped,
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
    ["PrimedDefinitions", 129],
    ["IntervalSequences", 110],
    ["NullableRecords", 121],
    ["CaseArms", 13],
    ["LetInit", 88],
    ["AssertHolds", 46],
    ["SparseLog", 666],
    ["SparseSymmetry", 109],
    ["FlattenChunks", 293],
    ["FilteredMembership", 280],
    ["RecordBounds", 215],
    ["SparseHistory", 79],
    ["StringFields", 97],
    ["PrimedLets", 69],
    ["EmptyReplies", 63],
    ["EnabledGuards", 14],
    ["IntegerUnions", 124],
    ["ProjectedViews", 23],
    ["SymmetricViews", 41],
    ["OptionValues", 35],
    ["SymmetricOptions", 145],
    ["RecordBags", 32],
    ["BoundOrder", 9],
    ["MessageBags", 41],
    ["BagDifferences", 41],
    ["SparseSequences", 1063],
    ["LateSparseSequences", 1063],
    ["RecursiveOperators", 441],
    ["GameOfLife", 1024],
    ["LoopArguments", 31],
    ["AsymmetricViews", 11],
    ["SubSeqPrefixes", 1149],
    ["SingletonSets", 29],
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
    ["PrimedShrinks", "liveness-violation", "Shrinks"],
    ["NullableOutside", "invariant-violation", "Low"],
    ["NullableDomain", "error", undefined],
    ["AssertFails", "error", undefined],
    ["SparseMissing", "error", undefined],
    ["SparseSuffix", "error", undefined],
    ["TupleLengths", "error", undefined],
    ["OperatorDomains", "error", undefined],
    ["SubSeqRanges", "error", undefined],
  ])("reports the property %s violates, as TLC does", async (name, status, property) => {
    const result = await checkFixture(name, true);
    expect([result.status, result.violation?.name]).toEqual([status, property]);
  });

  it.each(["DeadlockedCounters", "SymmetricDeadlock", "ShallowDeadlock", "ConstrainedDeadlock"])(
    "reports the deadlock in %s as the interpreter does",
    async (name) => {
      const [typed, interpreted] = await Promise.all([
        checkFixture(name, true),
        checkFixture(name, true, false),
      ]);
      expect(typed).toEqual(interpreted);
    },
  );

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
