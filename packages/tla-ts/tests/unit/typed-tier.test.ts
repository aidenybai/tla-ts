import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";
import { getActualProbability } from "../../src/tlc/summary";

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

  it.each([
    ["Torus", 90153, 45076, 2.8e-13],
    ["SymmetricTorus", 191254, 63751, 1.1e-12],
    ["ProjectedTorus", 90153, 45076, 5.4e-13],
    ["SymmetricProjection", 191254, 63751, 2e-12],
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
