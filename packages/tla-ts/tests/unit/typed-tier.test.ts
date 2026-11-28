import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { check, type CheckProgress, formatValue } from "../../src";
import type { SearchStatistics } from "../../src/check";
import { getActualProbability } from "../../src/tlc/summary";
import { formatCallStackLines } from "./check-harness";

const FIXTURES = join(import.meta.dirname, "../fixtures/typed-tier");

// TLC's default set bound, given explicitly, keeps the search on the interpreter.
const INTERPRETED_SET_SIZE = 1_000_000;

const checkFixture = (
  name: string,
  isWarningEnabled: boolean,
  isTyped = true,
  maxSetSize = isTyped ? undefined : INTERPRETED_SET_SIZE,
) =>
  check({
    source: readFileSync(join(FIXTURES, `${name}.tla`), "utf8"),
    config: readFileSync(join(FIXTURES, `${name}.cfg`), "utf8"),
    loadModule: (module) => {
      const path = join(FIXTURES, `${module}.tla`);
      return existsSync(path) ? readFileSync(path, "utf8") : undefined;
    },
    isWarningEnabled,
    maxSetSize,
  });

afterEach(() => {
  vi.restoreAllMocks();
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
    ["SubsetUnions", 1033],
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
    ["RecordFieldOrder", 11],
    ["RecordSetValues", 43],
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
    ["SparseConstructions", 11],
    ["RecursiveOperators", 441],
    ["GameOfLife", 1024],
    ["LoopArguments", 31],
    ["AsymmetricViews", 11],
    ["SubSeqPrefixes", 1149],
    ["SingletonSets", 29],
    ["MappedDuplicates", 22],
    ["ScrambledImages", 21],
    ["SparseBags", 13],
    ["PartialSteps", 4],
    ["FairProcesses", 55],
    ["PermutedSchedules", 85],
    ["InfiniteDifference", 8],
    ["HeterogeneousTuples", 52],
    ["SymmetricTuples", 289],
    ["FiniteChecks", 4],
    ["ProductSets", 1159],
    ["RecordMerge", 15],
    ["GuessedFunctions", 29],
    ["ValueOverride", 9],
    ["NestedFolds", 233],
    ["DomainFunctions", 41],
    ["SubsetDifference", 14],
    ["EmptyResponses", 19],
    ["MissingSegments", 145],
    ["SymmetricOrbits", 9361],
    ["SymmetricRotations", 2971],
    ["LetFunctionWays", 235],
    ["RecursiveMessages", 481],
    ["SymmetricMessages", 91],
    ["ConstantFunctions", 20001],
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
    ["TupleWidening", "error", undefined],
    ["UnassignedSubscript", "error", undefined],
    ["OperatorDomains", "error", undefined],
    ["SubSeqRanges", "error", undefined],
    ["MissingFields", "error", undefined],
    ["MissingSegmentRead", "error", undefined],
  ])("reports the property %s violates, as TLC does", async (name, status, property) => {
    const result = await checkFixture(name, true);
    expect([result.status, result.violation?.name]).toEqual([status, property]);
  });

  it.each([
    "DeadlockedCounters",
    "SymmetricDeadlock",
    "ShallowDeadlock",
    "ConstrainedDeadlock",
    "ProjectedDeadlock",
  ])("reports the deadlock in %s as the interpreter does", async (name) => {
    const [typed, interpreted] = await Promise.all([
      checkFixture(name, true),
      checkFixture(name, true, false),
    ]);
    expect(typed).toEqual(interpreted);
  });

  it.each([
    ["ViolatedCounters", "invariant-violation", "Bounded", [36, 16, 2, 6, 6]],
    ["ConstrainedViolation", "invariant-violation", "Low", [13, 9, 3, 4, 4]],
    ["LiveViolation", "invariant-violation", "Short", [21, 12, 1, 6, 6]],
    ["SymmetricViolation", "invariant-violation", "Few", [20, 9, 1, 6, 6]],
    ["ViolatedStep", "liveness-violation", "Monotone", [37, 23, 3, 8, 8]],
    ["SubsetUnionViolation", "invariant-violation", "Small", [13, 13, 10, 3, 3]],
  ])(
    "reports where %s breaks a property as TLC does, as the interpreter does",
    async (name, status, property, counts) => {
      const [typed, interpreted] = await Promise.all([
        checkFixture(name, true),
        checkFixture(name, true, false),
      ]);
      expect([
        typed.status,
        typed.violation?.name,
        [
          typed.generatedStates,
          typed.distinctStates,
          typed.queuedStates,
          typed.depth,
          typed.violation?.trace.length,
        ],
      ]).toEqual([status, property, counts]);
      expect(typed).toEqual(interpreted);
    },
  );

  it.each([
    "FairProcesses",
    "StarvedProcesses",
    "PartialStepsReached",
    "LiveComparers",
    "EnabledInstance",
    "LetFunctionEquality",
    "LiveDeadlock",
    "LiveDeadlockMissed",
    "LiveDeadlockViolated",
    "PartialEnabled",
    "PartialEnabledStarved",
    "SymmetricLiveness",
    "SymmetricStarvation",
    "UnchangedInstance",
    "PrimedAliases",
    "UnchangedFunctions",
    "ActionFails",
    "InitialFails",
    "PrimedShrinks",
    "LateCycle",
  ])("checks %s as the interpreter does", async (name) => {
    const [typed, interpreted] = await Promise.all([
      checkFixture(name, true),
      checkFixture(name, true, false),
    ]);
    expect(typed).toEqual(interpreted);
  });

  it.each([
    ["FunctionDefinitions", "success", [5533, 919, 0, 11, undefined]],
    ["SymmetricOrbits", "success", [9361, 780, 0, 17, undefined]],
    ["FairProcesses", "success", [55, 27, 0, 7, undefined]],
    ["ViolatedCounters", "invariant-violation", [36, 16, 2, 6, 6]],
    ["ViolatedStep", "liveness-violation", [37, 23, 3, 8, 8]],
    ["DeadlockedCounters", "deadlock", [17, 11, 0, 5, 5]],
    ["ActionFails", "liveness-violation", [4, 3, 1, 2, 2]],
  ])(
    "reports %s as TLC does when it writes a trace spec, as the interpreter does",
    async (name, status, counts) => {
      const [typed, interpreted] = await Promise.all(
        [undefined, INTERPRETED_SET_SIZE].map(async (maxSetSize) => {
          const written = new Map<string, string | Uint8Array>();
          const result = await check({
            source: readFileSync(join(FIXTURES, `${name}.tla`), "utf8"),
            config: readFileSync(join(FIXTURES, `${name}.cfg`), "utf8"),
            isWarningEnabled: true,
            maxSetSize,
            writeFile: (path, content) => written.set(path, content),
            traceSpec: { module: `${name}_TTrace`, traceFile: `${name}_TTrace.bin` },
          });
          return {
            ...result,
            traceSpec: result.traceSpec?.replace(/\\\* Generated on .*/, ""),
            written,
          };
        }),
      );
      expect([
        typed.status,
        [
          typed.generatedStates,
          typed.distinctStates,
          typed.queuedStates,
          typed.depth,
          typed.violation?.trace.length,
        ],
      ]).toEqual([status, counts]);
      expect(typed).toEqual(interpreted);
    },
  );

  it.each(["default", "final", "off"] as const)(
    "reports a deadlock past a stuttering violation with the %s liveness check, as the interpreter does",
    async (livenessCheck) => {
      const [typed, interpreted] = await Promise.all(
        [undefined, INTERPRETED_SET_SIZE].map((maxSetSize) =>
          check({
            source: readFileSync(join(FIXTURES, "LateDeadlock.tla"), "utf8"),
            config: readFileSync(join(FIXTURES, "LateDeadlock.cfg"), "utf8"),
            maxSetSize,
            livenessCheck,
          }),
        ),
      );
      expect([typed.status, typed.distinctStates]).toEqual(["deadlock", 2001]);
      expect(typed).toEqual(interpreted);
    },
  );

  it.each(["default", "final", "off"] as const)(
    "reports the progress of the %s liveness check, as the interpreter does",
    async (livenessCheck) => {
      const getKinds = async (maxSetSize: number | undefined) => {
        const kinds: string[] = [];
        await check({
          source: readFileSync(join(FIXTURES, "FairProcesses.tla"), "utf8"),
          config: readFileSync(join(FIXTURES, "FairProcesses.cfg"), "utf8"),
          maxSetSize,
          livenessCheck,
          onProgress: (progress) => kinds.push(progress.kind),
        });
        return kinds;
      };
      expect(await getKinds(undefined)).toEqual(await getKinds(INTERPRETED_SET_SIZE));
    },
  );

  it("reports TLC's error where a set outgrows maxSetSize, as the interpreter does", async () => {
    const [typed, interpreted] = await Promise.all([
      checkFixture("GrowingSet", false, true, 20),
      checkFixture("GrowingSet", false, false, 20),
    ]);
    expect(typed.failure?.message).toContain("too many elements (>20)");
    expect(typed).toEqual(interpreted);
  });

  const getIntervalSizeMessage = (interval: string) =>
    `TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: Size of interval value exceeds the maximum representable size (32bits): ${interval}.`;

  it.each([
    [
      "(CHOOSE n \\in 0..2147483647 : TRUE) = x",
      "0..2147483647",
      [
        "Line 5, column 9 to line 5, column 70 in M",
        "Line 5, column 9 to line 5, column 27 in M",
        "Line 5, column 9 to line 5, column 13 in M",
        "Line 5, column 18 to line 5, column 27 in M",
        "Line 5, column 32 to line 5, column 70 in M",
        "Line 5, column 33 to line 5, column 65 in M",
      ],
    ],
    [
      "\\E n \\in 0..2147483647 : n = x",
      "0..2147483647",
      [
        "Line 5, column 9 to line 5, column 61 in M",
        "Line 5, column 9 to line 5, column 27 in M",
        "Line 5, column 9 to line 5, column 13 in M",
        "Line 5, column 18 to line 5, column 27 in M",
        "Line 5, column 32 to line 5, column 61 in M",
      ],
    ],
    [
      "\\A n \\in 0..2147483647 : n >= 0",
      "0..2147483647",
      [
        "Line 5, column 9 to line 5, column 62 in M",
        "Line 5, column 9 to line 5, column 27 in M",
        "Line 5, column 9 to line 5, column 13 in M",
        "Line 5, column 18 to line 5, column 27 in M",
        "Line 5, column 32 to line 5, column 62 in M",
      ],
    ],
    [
      "\\E a \\in 0..1, b \\in 0..2147483647 : a = b",
      "0..2147483647",
      [
        "Line 5, column 9 to line 5, column 73 in M",
        "Line 5, column 9 to line 5, column 27 in M",
        "Line 5, column 9 to line 5, column 13 in M",
        "Line 5, column 18 to line 5, column 27 in M",
        "Line 5, column 32 to line 5, column 73 in M",
      ],
    ],
    [
      "(CHOOSE n \\in (x - 1)..2147483647 : TRUE) = x",
      "-1..2147483647",
      [
        "Line 5, column 9 to line 5, column 76 in M",
        "Line 5, column 9 to line 5, column 27 in M",
        "Line 5, column 9 to line 5, column 13 in M",
        "Line 5, column 18 to line 5, column 27 in M",
        "Line 5, column 32 to line 5, column 76 in M",
        "Line 5, column 33 to line 5, column 71 in M",
      ],
    ],
    [
      "\\E n \\in (x - 1)..2147483647 : n = x",
      "-1..2147483647",
      [
        "Line 5, column 9 to line 5, column 67 in M",
        "Line 5, column 9 to line 5, column 27 in M",
        "Line 5, column 9 to line 5, column 13 in M",
        "Line 5, column 18 to line 5, column 27 in M",
        "Line 5, column 32 to line 5, column 67 in M",
      ],
    ],
    [
      "\\A n \\in (x - 1)..2147483647 : n >= 0",
      "-1..2147483647",
      [
        "Line 5, column 9 to line 5, column 68 in M",
        "Line 5, column 9 to line 5, column 27 in M",
        "Line 5, column 9 to line 5, column 13 in M",
        "Line 5, column 18 to line 5, column 27 in M",
        "Line 5, column 32 to line 5, column 68 in M",
      ],
    ],
  ])(
    "sizes the interval bound of %s before it enumerates it, as TLC's toSetEnum does",
    async (conjunct, interval, callStack) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1 /\\ ${conjunct}\n====`,
        config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      });
      expect([
        result.failure?.message,
        result.failure?.trace.map((step) => formatValue(step.state.x)),
        formatCallStackLines(result),
        [result.generatedStates, result.distinctStates, result.queuedStates, result.depth],
        result.failure?.exitCode,
      ]).toEqual([getIntervalSizeMessage(interval), ["0"], callStack, [1, 1, 0, 1], 75]);
    },
  );

  it("reports the behavior up to a disabled action whose CHOOSE sizes an interval past 32 bits, which the tier took for a deadlock", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLES x, y\nA1 == (x < 4) /\\ (x' = x + 1) /\\ ((CHOOSE n \\in 0..2147483647 : TRUE) = (x - 2)) /\\ (y' = ((-7) \\div (-1)))\nA2 == x >= 4 /\\ UNCHANGED <<x, y>>\nNext == A1 \\/ A2\nInit == x = 0 /\\ y = ((-7) \\div 7)\nInv1 == (y # ((-x) * x))\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv1",
    });
    expect([
      result.failure?.message,
      result.failure?.trace.map((step) => [formatValue(step.state.x), formatValue(step.state.y)]),
      formatCallStackLines(result),
      [result.generatedStates, result.distinctStates, result.queuedStates, result.depth],
      result.failure?.exitCode,
    ]).toEqual([
      getIntervalSizeMessage("0..2147483647"),
      [["0", "-1"]],
      [
        "Line 4, column 7 to line 4, column 107 in M",
        "Line 4, column 7 to line 4, column 80 in M",
        "Line 4, column 7 to line 4, column 29 in M",
        "Line 4, column 8 to line 4, column 12 in M",
        "Line 4, column 19 to line 4, column 28 in M",
        "Line 4, column 35 to line 4, column 79 in M",
        "Line 4, column 36 to line 4, column 68 in M",
      ],
      [1, 1, 0, 1],
      75,
    ]);
  });

  it.each([
    ["", "x < 0 /\\ x' = Len([i \\in 1..2147483647 |-> i])"],
    ["", "x < 0 /\\ x' = [i \\in 1..2147483647 |-> i][1]"],
    ["", "x < 0 /\\ <<x>> \\in [1..2147483647 -> Int] /\\ x' = 1"],
    ["S == 1..2147483647", "x < 0 /\\ x' = Cardinality(S \\cup {x})"],
    ["S == SUBSET (1..30)", "x < 0 /\\ x' = Cardinality(S \\cup {{x}})"],
  ])(
    "compiles no constant set too large to enumerate, which TLC never enumerates in a disabled action: %s Next == %s",
    async (definition, next) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers, Sequences, FiniteSets\nVARIABLE x\n${definition}\nInit == x = 0\nNext == ${next}\n====`,
        config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      });
      expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
        "success",
        1,
        1,
      ]);
    },
  );

  it.each([
    ["Torus", 90153, 45076, 2.8e-13],
    ["SymmetricTorus", 98404, 32801, 1e-12],
    ["ProjectedTorus", 90153, 45076, 5.4e-13],
    ["SymmetricProjection", 98404, 32801, 2.9e-13],
    ["MaskedCounters", 114245, 28561, 2.9e-13],
  ])(
    "finds the fingerprint distance TLC reports in %s, as the interpreter does",
    async (name, generatedStates, distinctStates, probability) => {
      const [typed, interpreted] = await Promise.all([
        checkFixture(name, false),
        checkFixture(name, false, false),
      ]);
      expect([typed.generatedStates, typed.distinctStates]).toEqual([
        generatedStates,
        distinctStates,
      ]);
      expect(typed.fingerprintDistance).toBeDefined();
      expect(typed.fingerprintDistance).toBe(interpreted.fingerprintDistance);
      expect(getActualProbability(typed.fingerprintDistance ?? 0n)).toBe(probability);
    },
  );

  it("reports the initial states computed so far, as the interpreter does", async () => {
    const getCounts = async (isTyped: boolean) => {
      const counts: number[] = [];
      await check({
        source: readFileSync(join(FIXTURES, "GameOfLife.tla"), "utf8"),
        config: readFileSync(join(FIXTURES, "GameOfLife.cfg"), "utf8"),
        isWarningEnabled: false,
        maxSetSize: isTyped ? undefined : INTERPRETED_SET_SIZE,
        onProgress: (progress) => {
          if (progress.kind === "initial-states-progress") counts.push(progress.count);
        },
      });
      return counts;
    };
    const expected = [2, 4, 8, 16, 32, 64, 128, 256];
    expect(await getCounts(true)).toEqual(expected);
    expect(await getCounts(false)).toEqual(expected);
  });

  const checkCounter = async (init: string, next: string, isTyped: boolean) => {
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => (now += 1000));
    const reported: (CheckProgress["kind"] | SearchStatistics)[] = [];
    const result = await check({
      source: `---- MODULE Counter ----\nEXTENDS Integers\nVARIABLE x\nInit == ${init}\nNext == x < 1000 /\\ x' = ${next}\n====`,
      config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      maxSetSize: isTyped ? undefined : INTERPRETED_SET_SIZE,
      onProgress: (progress) =>
        reported.push(progress.kind === "progress" ? progress.statistics : progress.kind),
    });
    return { status: result.status, reported };
  };

  it.each([true, false])(
    "reports its progress every minute after the initial states when isTyped is %s, as TLC does",
    async (isTyped) => {
      const checked = await checkCounter("x = 0", "x + 1", isTyped);
      const progress = checked.reported.filter((entry) => typeof entry !== "string");
      expect(checked.reported.slice(0, 3)).toEqual([
        "parsed",
        "initial-states-started",
        "initial-states-computed",
      ]);
      expect(progress.length).toBeGreaterThan(0);
      progress.forEach((statistics) =>
        expect([statistics.distinctStates, statistics.depth, statistics.queuedStates]).toEqual([
          statistics.generatedStates,
          statistics.generatedStates,
          0,
        ]),
      );
    },
  );

  it.each([true, false])(
    "leaves the state it expands off the queue it reports when isTyped is %s, as TLC's worker does",
    async (isTyped) => {
      const checked = await checkCounter("x \\in 0..9", "x + 10", isTyped);
      const progress = checked.reported.filter((entry) => typeof entry !== "string");
      const searched = progress.filter((statistics) => statistics.generatedStates < 1010);
      expect(searched.length).toBeGreaterThan(0);
      searched.forEach((statistics) => expect(statistics.queuedStates).toBe(9));
    },
  );

  it("checks the temporal properties on the graph so far before its first progress report, as TLC's periodic work does after it expands x = 63", async () => {
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => (now += 4000));
    const reported: string[] = [];
    const result = await check({
      source:
        "---- MODULE Slow ----\nEXTENDS Naturals\nVARIABLE x\nNext == x < 200 /\\ x' = x + 1\nSpec == x = 0 /\\ [][Next]_x /\\ WF_x(Next)\nProp == <>(x = 200)\n====",
      config: "SPECIFICATION Spec\nPROPERTY Prop\nCHECK_DEADLOCK FALSE",
      onProgress: (progress) => {
        if (progress.kind === "liveness-started") {
          reported.push(`${progress.isComplete ? "complete" : "current"} ${progress.states}`);
        }
        if (progress.kind === "liveness-finished" || progress.kind === "progress") {
          reported.push(progress.kind);
        }
      },
    });
    expect([result.status, reported]).toEqual([
      "success",
      ["current 65", "liveness-finished", "progress", "complete 201", "liveness-finished"],
    ]);
  });

  it("leaves a violation its periodic check finds to the interpreter", async () => {
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => (now += 4000));
    const result = await check({
      source:
        "---- MODULE Cycle ----\nEXTENDS Naturals\nVARIABLE x\nNext == IF x < 30 THEN x' \\in {(x + 1) % 30, x + 100} ELSE x < 400 /\\ x' = x + 1\nSpec == x = 0 /\\ [][Next]_x /\\ WF_x(Next)\nProp == []<>(x >= 100)\n====",
      config: "SPECIFICATION Spec\nPROPERTY Prop\nCHECK_DEADLOCK FALSE",
      onProgress: () => {},
    });
    expect([result.status, result.violation?.name]).toEqual(["liveness-violation", "Prop"]);
  });

  it("rebuilds the paths to a long lasso's states, as TLC prints them", async () => {
    const result = await check({
      source:
        "---- MODULE Fa ----\nEXTENDS Naturals\nCONSTANT K\nVARIABLES x, b\nNext == (x < K /\\ x' = x + 1 /\\ UNCHANGED b) \\/ (x = K /\\ b' = ~b /\\ UNCHANGED x)\nSpec == x = 0 /\\ b = FALSE /\\ [][Next]_<<x, b>> /\\ WF_<<x, b>>(Next)\nReturns == []<>(x = 0)\n====",
      config: "SPECIFICATION Spec\nCONSTANT K = 6000\nPROPERTY Returns",
    });
    expect([
      result.status,
      result.violation?.properties,
      result.violation?.trace.length,
      result.violation?.loopStart,
    ]).toEqual(["liveness-violation", ["Returns"], 6002, 6000]);
  });

  it("reports no progress below the last report when the interpreter checks again what the tier searched, as TLC's counts never go back", async () => {
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => (now += 1000));
    const reported: SearchStatistics[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x, r\nInit == x = 0 /\\ r = [i \\in 1..3 |-> i]\nNext == x < 1000 /\\ x' = x + 1 /\\ r' = IF x = 900 THEN [r EXCEPT ![x] = 0] ELSE r\n====",
      config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      onProgress: (progress) => {
        if (progress.kind === "progress") reported.push(progress.statistics);
      },
    });
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([
      1001, 1001, 1001,
    ]);
    expect(reported.length).toBeGreaterThan(1);
    reported.forEach((statistics, index) => {
      const previous = reported[index - 1] ?? statistics;
      expect([
        statistics.generatedStates >= previous.generatedStates,
        statistics.distinctStates >= previous.distinctStates,
      ]).toEqual([true, true]);
    });
  });

  it("reports the initial states once when the interpreter checks again what the tier searched", async () => {
    const checked = await checkCounter("x = 0", "x + 1 + 0 \\div (500 - x)", true);
    expect([
      checked.status,
      checked.reported.filter((entry) => entry === "initial-states-computed").length,
      checked.reported.some((entry) => typeof entry !== "string"),
    ]).toEqual(["error", 1, true]);
  });

  it.each([
    [
      "the same EXCEPT",
      "F(s) == [s EXCEPT !.b = 1]\nInit == x = 0 /\\ r = F([a |-> 0])\nNext == x < 20 /\\ x' = x + 1 /\\ r' = IF x % 5 = 0 THEN F(r) ELSE r",
      4,
    ],
    [
      "different EXCEPTs",
      "Init == x = 0 /\\ r = [[a |-> 0] EXCEPT !.b = 1]\nNext == x < 3 /\\ x' = x + 1 /\\ r' = [r EXCEPT !.c = x]",
      3,
    ],
  ])(
    "raises a warning in Init once when Init and Next warn through %s, as TLC does",
    async (_name, body, nextWarnings) => {
      const reported: string[] = [];
      await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x, r\n${body}\n====`,
        config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
        onProgress: (progress) => {
          if (progress.kind === "warning" || progress.kind === "initial-states-computed") {
            reported.push(progress.kind);
          }
        },
      });
      expect(reported).toEqual([
        "warning",
        "initial-states-computed",
        ...Array.from({ length: nextWarnings }, () => "warning"),
      ]);
    },
  );

  it.each([
    ["c < 3 /\\ c' = c + 1", 4],
    ["c' \\in {1, 2} /\\ c' > 1", 5],
  ])(
    "takes ENABLED %s through an instance that keeps its variable for the instancing module's, as TLC does",
    async (action, states) => {
      const results = await Promise.all(
        [undefined, INTERPRETED_SET_SIZE].map((maxSetSize) =>
          check({
            source:
              "---- MODULE G ----\nEXTENDS Integers\nVARIABLE c\nINSTANCE Hi\nInit == c = 0\nNext == Can /\\ c < 4 /\\ c' = c + 1\n====",
            config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
            maxSetSize,
            loadModule: (name) =>
              name === "Hi"
                ? `---- MODULE Hi ----\nEXTENDS Integers\nVARIABLES c\nA == ${action}\nCan == ENABLED A\n====`
                : undefined,
          }),
        ),
      );
      expect(
        results.map((result) => [result.status, result.generatedStates, result.distinctStates]),
      ).toEqual([
        ["success", states, states],
        ["success", states, states],
      ]);
    },
  );

  it("checks a spec that has no initial state to give a record its fields, as TLC does", async () => {
    const result = await check({
      source:
        "---- MODULE E ----\nEXTENDS Integers\nVARIABLES x, z\nInit == x = 0 /\\ z = [a |-> 0] /\\ x /= 0\nNext == x' = x /\\ z' = [z EXCEPT !.a = 1]\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "success",
      0,
      0,
    ]);
  });

  it("draws a random constant definition once, as TLC run with -fp 0 -seed 4 does", async () => {
    const results = await Promise.all(
      [undefined, INTERPRETED_SET_SIZE].map((maxSetSize) =>
        check({
          source: readFileSync(join(FIXTURES, "RandomEdges.tla"), "utf8"),
          config: readFileSync(join(FIXTURES, "RandomEdges.cfg"), "utf8"),
          maxSetSize,
          seed: 4n,
        }),
      ),
    );
    expect(results.map((result) => result.generatedStates)).toEqual([5724, 5724]);
  });

  it("prints a constant definition once, as TLC does as it starts", async () => {
    const getLines = async (isTyped: boolean) => {
      const lines: string[] = [];
      await check({
        source: readFileSync(join(FIXTURES, "PrintedConstants.tla"), "utf8"),
        config: readFileSync(join(FIXTURES, "PrintedConstants.cfg"), "utf8"),
        isWarningEnabled: false,
        maxSetSize: isTyped ? undefined : INTERPRETED_SET_SIZE,
        onPrint: (line) => lines.push(String(line)),
      });
      return lines;
    };
    const expected = ['"hello"', '"unused"'];
    expect(await getLines(true)).toEqual(expected);
    expect(await getLines(false)).toEqual(expected);
  });

  it("prints a constant definition once with a replaced TLC module, as TLC does as it starts", async () => {
    const directory = join(FIXTURES, "bound-print");
    const getLines = async (isTyped: boolean) => {
      const lines: string[] = [];
      await check({
        source: readFileSync(join(directory, "BoundPrint.tla"), "utf8"),
        config: readFileSync(join(directory, "BoundPrint.cfg"), "utf8"),
        maxSetSize: isTyped ? undefined : INTERPRETED_SET_SIZE,
        loadModule: (name) =>
          name === "TLC" ? readFileSync(join(directory, "TLC.tla"), "utf8") : undefined,
        onPrint: (line) => lines.push(String(line)),
      });
      return lines;
    };
    expect(await getLines(true)).toEqual(['"x"  TRUE']);
    expect(await getLines(false)).toEqual(['"x"  TRUE']);
  });

  it("tries each disjunct of a step ENABLED needs once every variable is assigned, as TLC's Tool#enabled does", async () => {
    const results = await Promise.all(
      [undefined, INTERPRETED_SET_SIZE].map((maxSetSize) =>
        check({
          source:
            '---- MODULE E ----\nEXTENDS Integers, TLC\nVARIABLE x\nA == UNCHANGED x /\\ (x < 2 \\/ Assert(x < 0, "bound"))\nSpec == x = 0 /\\ [][A]_x /\\ WF_x(A)\nProp == []<>(x < 3)\n====',
          config: "SPECIFICATION Spec\nPROPERTY Prop",
          maxSetSize,
        }),
      ),
    );
    expect(results.map((result) => [result.failure?.message, result.failure?.exitCode])).toEqual(
      Array.from({ length: 2 }, () => [
        'The first argument of Assert evaluated to FALSE; the second argument was:\n"bound"',
        14,
      ]),
    );
  });

  it.each([
    ["before", "y' = 1 /\\ UNCHANGED y /\\ x' = x", "line 5, col 29 to line 5, col 29 of module M"],
    ["after", "y' = 1 /\\ x' = x /\\ UNCHANGED y", "line 5, col 39 to line 5, col 39 of module M"],
  ])(
    "warns about a variable UNCHANGED keeps that the step changes %s it assigns every variable, as the interpreter does",
    async (_title, next, location) => {
      const getWarnings = async (maxSetSize: number | undefined) => {
        const warnings: string[] = [];
        await check({
          source: `---- MODULE M ----\nEXTENDS Integers\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == ${next}\n====`,
          config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
          maxSetSize,
          onProgress: (progress) => {
            if (progress.kind === "warning") warnings.push(progress.text);
          },
        });
        return warnings;
      };
      const expected = [
        `The variable y was changed while it is specified as UNCHANGED at\n${location}`,
      ];
      expect(await getWarnings(undefined)).toEqual(expected);
      expect(await getWarnings(INTERPRETED_SET_SIZE)).toEqual(expected);
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
