import { describe, expect, it } from "vite-plus/test";
import { check, formatValue } from "../../src";
import type { OutputLine } from "../../src/check";
import { checkFixture, checkInitAndNext } from "./check-harness";

const checkWithSeed = (name: string, seed: bigint) =>
  checkFixture("randomization", name, name, { seed });

const getSummary = async (name: string, seed: bigint) => {
  const result = await checkWithSeed(name, seed);
  return [result.status, result.generatedStates, result.distinctStates];
};

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
    async (seed, expectedX, expectedY, expectedP, expectedQ) => {
      const result = await checkWithSeed("RandomSubset", seed);
      expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
        "invariant-violation",
        8009,
        8009,
      ]);
      const initial = result.violation?.trace[0].state;
      expect([initial?.x, initial?.y]).toEqual([expectedX, expectedY]);
      expect(
        [initial?.p, initial?.q].map((tuple) =>
          typeof tuple === "object" && tuple.kind === "Function" ? tuple.range : undefined,
        ),
      ).toEqual([expectedP, expectedQ]);
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

  it.each([
    [1n, ["success", 1332, 36]],
    [-2252017213236477395n, ["success", 4160, 64]],
    [8006642976694192746n, ["success", 90, 9]],
  ])(
    "evaluates a random constant definition once with seed %s, as Github648 expects",
    async (seed, summary) => {
      expect(await getSummary("Github648", seed)).toEqual(summary);
    },
  );

  const drawingChecks =
    "---- MODULE M ----\nEXTENDS Naturals, FiniteSets, Randomization, TLC\nVARIABLE x, y, n\nInit == x = 0 /\\ y = 0 /\\ n = 0\n";

  it.each([
    [4n, 5, [0, 3]],
    [7n, 3, [0, 1]],
    [11n, 6, [0, 0, 0]],
  ])(
    "draws for an invariant at a state that keeps the variables it reads with seed %s, as TLC does",
    async (seed, generated, trace) => {
      const result = await check({
        source: `${drawingChecks}Next == n < 8 /\\ n' = n + 1 /\\ x' \\in 0..3 /\\ y' = y\nInv == x \\in RandomSubset(3, 0..3)\n====`,
        config: "INIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
        seed,
      });
      expect([result.generatedStates, result.violation?.trace.map((step) => step.state.x)]).toEqual(
        [generated, trace],
      );
    },
  );

  it("draws for a constraint at a state that keeps the variables it reads, as TLC does", async () => {
    const result = await check({
      source: `${drawingChecks}Next == n < 6 /\\ n' = n + 1 /\\ x' \\in 0..3 /\\ y' \\in 0..1\nC == x \\in RandomSubset(2, 0..3)\n====`,
      config: "INIT Init\nNEXT Next\nCONSTRAINT C\nCHECK_DEADLOCK FALSE",
      seed: 11n,
    });
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([273, 42, 7]);
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

  it("draws again each time an operator with parameters calls RandomElement", async () => {
    const result = await checkWithSeed("RandomOperator", 1n);
    expect(result.violation?.trace.map((step) => step.state.alpha)).toEqual([
      0, 80, 94, 100, 32, 12, 34,
    ]);
  });

  it("draws again at each reference to a LET definition in an action", async () => {
    const result = await checkWithSeed("RandomLet", 1n);
    expect(result.violation?.trace.map((step) => step.state.alpha)).toEqual([
      0, 100, 77, 50, 66, 68, 12,
    ]);
  });

  it("draws again at each reference to a LET definition of an initial predicate that TLC takes from the spec", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLES x, y\nInit == LET r == RandomElement(1..1000) IN x = r /\\ y = r\nSpec == Init /\\ [][UNCHANGED <<x, y>>]_<<x, y>>\nInv == x = 0\n====",
      config: "SPECIFICATION Spec\nINVARIANT Inv",
      seed: 4n,
    });
    expect(result.violation?.trace.map((step) => [step.state.x, step.state.y])).toEqual([
      [731, 919],
    ]);
  });

  it("draws again at each reference to a LET definition of an action as it rebuilds a trace", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLES x, n\nInit == x = 0 /\\ n = 0\nA == LET r == RandomElement(1..1000) IN n' = n + 1 /\\ x' = r + r\nNext == A\nInv == n < 2\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      seed: 4n,
    });
    expect(result.violation?.trace.map((step) => [step.label, step.state.x])).toEqual([
      [undefined, 0],
      ["A line 5, col 41 to line 5, col 64 of module M", 1655],
      ["A line 5, col 41 to line 5, col 64 of module M", 763],
    ]);
  });

  // Deviation from TLC: TLC draws on from where the search stopped, finds no step and throws a NullPointerException.
  it("draws again from the seed of the state it found the error in as it rebuilds the step", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == x = 0\nA == x' = RandomElement(1..1000)\nB == x' = RandomElement(1..1000)\nNext == A \\/ B\nInv == x = 0\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      seed: 4n,
    });
    expect(result.violation?.trace.map((step) => [step.label, step.state.x])).toEqual([
      [undefined, 0],
      ["A line 5, col 6 to line 5, col 32 of module M", 773],
    ]);
  });

  it("draws on from where the search stopped as it rebuilds a step from an initial state, as TLC's TLCStateRandom does", async () => {
    const outputs: string[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == x = 0\nA == PrintT(RandomElement(1..1000)) /\\ x' = 1\nNext == A\nInv == x = 0\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      seed: 4n,
      onPrint: (line) => outputs.push(line),
    });
    expect([
      outputs,
      result.violation?.trace.map((step) => step.output ?? []),
      result.violation?.traceOutput,
    ]).toEqual([["773"], [[], ["379"]], ["273"]]);
  });

  // Deviation from TLC: TLC draws on from where printing the trace stopped, misses the last step, evaluates B and skips the postcondition.
  it("draws again from the seed of the state it found the error in once the rebuild for the postcondition misses the step", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC, TLCExt\nVARIABLES x, n\nInit == x = 0 /\\ n = 0\nA == n' = n + 1 /\\ x' = RandomElement(1..1000)\nB == PrintT(<<\"B\", n>>) /\\ FALSE\nNext == A \\/ B\nInv == n < 2\nPost == PrintT(Cardinality(CounterExample.state))\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nPOSTCONDITION Post",
      seed: 4n,
      onPrint: () => {},
    });
    expect([result.violation?.traceOutput, result.violation?.postconditionOutput]).toEqual([
      ['<<"B", 1>>'],
      ["3"],
    ]);
  });

  // Deviation from TLC: TLC misses the initial state, skips the rest of the rebuild and skips the postcondition.
  it("rebuilds the trace and checks the postcondition once the rebuild for it draws a different random initial state", async () => {
    const result = await check({
      source:
        '---- MODULE M ----\nEXTENDS Naturals, TLC, TLCExt\nVARIABLE x\nInit == x = RandomElement(1..1000) /\\ PrintT(x)\nNext == x\' = x + 1 /\\ PrintT(<<"next", x>>)\nInv == x < 734\nPost == PrintT(DOMAIN CounterExample)\n====',
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nPOSTCONDITION Post",
      seed: 4n,
      onPrint: () => {},
    });
    expect([result.violation?.traceOutput, result.violation?.postconditionOutput]).toEqual([
      ["493", '<<"next", 731>>', '<<"next", 732>>', '<<"next", 733>>'],
      ['{"action", "state"}'],
    ]);
  });

  it.each([
    [
      "an invariant",
      "Next == x' = x + 1\nInv == x < 734",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
      "invariant-violation",
      ["493"],
    ],
    [
      "an invariant with a VIEW",
      "Next == x' = x + 1\nInv == x < 734\nV == x",
      "INIT Init\nNEXT Next\nINVARIANT Inv\nVIEW V",
      "invariant-violation",
      ["493"],
    ],
    [
      "an action property",
      "Next == x' = x + 1\nAct == [][x' < 734]_x",
      "INIT Init\nNEXT Next\nPROPERTY Act",
      "liveness-violation",
      ["493"],
    ],
    ["a deadlock", "Next == x < 734 /\\ x' = x + 1", "INIT Init\nNEXT Next", "deadlock", ["493"]],
    [
      "a deadlock with an ALIAS",
      "Next == x < 734 /\\ x' = x + 1\nA == [x |-> x]",
      "INIT Init\nNEXT Next\nALIAS A",
      "deadlock",
      ["984"],
    ],
    [
      "a temporal property",
      "Next == x < 734 /\\ x' = x + 1\nSpec == Init /\\ [][Next]_x\nProp == <>(x > 2000)",
      "SPECIFICATION Spec\nPROPERTY Prop\nCHECK_DEADLOCK FALSE",
      "liveness-violation",
      [],
    ],
  ])(
    "draws for a random initial state with no state current as it prints the trace of %s, then from the state it last rebuilt or aliased, as TLC does",
    async (_title, definitions, config, status, traceOutput) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = RandomElement(1..1000) /\\ PrintT(x)\n${definitions}\n====`,
        config,
        seed: 4n,
        onPrint: () => {},
      });
      expect([
        result.status,
        result.violation?.trace[0].output,
        result.violation?.traceOutput,
      ]).toEqual([status, ["731"], traceOutput]);
    },
  );

  it.each([
    ["FALSE", "731"],
    ["RandomElement(1..2) = 3", "882"],
  ])(
    "draws for a random initial state that deadlocks on from the worker's random as it rebuilds the state for the postcondition, as TLC does after Next == %s",
    async (condition, traceOutput) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = RandomElement(1..1000) /\\ PrintT(x)\nNext == ${condition} /\\ x' = x\n====`,
        config: "INIT Init\nNEXT Next",
        seed: 4n,
        onPrint: () => {},
      });
      expect([result.status, result.violation?.traceOutput]).toEqual(["deadlock", [traceOutput]]);
    },
  );

  it("draws for a random initial state from the state it expands as it prints the trace under -continue, as TLC does", async () => {
    const outputs: OutputLine[][] = [];
    await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = RandomElement(1..1000) /\\ PrintT(x)\nNext == x < 736 /\\ x' = x + 1\nInv == x < 734\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
      seed: 4n,
      isContinued: true,
      onPrint: () => {},
      onProgress: (progress) => {
        if (progress.kind === "violation") outputs.push(progress.violation.trace[0].output ?? []);
      },
    });
    expect(outputs[0]).toEqual(["493"]);
  });

  it("draws once for a constant TLCEval in the next-state relation", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x, n\nInit == x = 0 /\\ n = 0\nNext == n < 3 /\\ n' = n + 1 /\\ x' = TLCEval(RandomElement(1..1000))\n====",
      config: "INIT Init\nNEXT Next",
      seed: 4n,
    });
    expect(result.violation?.trace.map((step) => step.state.x)).toEqual([0, 794, 794, 794]);
  });

  it.each([
    [
      "Next == \\E v \\in RandomSubset(1, 10..19) : y' = v % 4 /\\ PrintT(<<y, v>>)",
      ["<<0, 19>>", "<<1, 19>>", "<<2, 19>>", "<<3, 19>>"],
    ],
    [
      "A(v) == y' = v % 4 /\\ PrintT(<<y, v>>)\nNext == A(RandomElement(10..19))",
      ["<<0, 17>>", "<<1, 17>>", "<<2, 17>>", "<<3, 17>>"],
    ],
    ['Next == \\E v \\in (IF PrintT("domain") THEN 0..1 ELSE {}) : y\' = v', ['"domain"']],
  ])(
    "evaluates the bound or argument TLC splits the next-state relation on once: %s",
    async (next, outputs) => {
      const printed: string[] = [];
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals, TLC, Randomization\nVARIABLE y\nInit == y \\in 0..3\n${next}\n====`,
        config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
        seed: 4n,
        onPrint: (line) => printed.push(line),
      });
      expect([result.status, printed]).toEqual(["success", outputs]);
    },
  );

  it("draws again from the seed of each state it rebuilds for a lasso, as TLC does", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, TLC\nCONSTANTS Proc\nVARIABLES y\nA0(p) == y' = RandomElement(0..2)\nNext == \\E p \\in Proc : A0(p)\nSpec == y = 0 /\\ [][Next]_y\nProp == <>(y = 5)\n====",
      config: "CONSTANT Proc = {p1, p2}\nSPECIFICATION Spec\nPROPERTY Prop",
      seed: 4n,
    });
    expect([
      result.status,
      result.violation?.trace.map((step) => [step.label, step.state.y]),
      result.violation?.loopStart,
    ]).toEqual([
      "liveness-violation",
      [
        [undefined, 0],
        ["A0(p2) line 5, col 10 to line 5, col 33 of module M", 1],
      ],
      1,
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

describe("random choices match TLC 1.7.4", () => {
  it("draws RandomSubset as TLC 1.7.4 does, and refuses to enumerate a large set of tuples", async () => {
    const result = await checkFixture("randomization", "RandomSubsetNext", "RandomSubsetNext", {
      seed: 4n,
      version: "1.7.4",
    });
    expect(result.failure?.trace.map((step) => step.state.x)).toEqual([39]);
    expect(result.failure?.message).toMatch(
      /RandomSubset\(tlc2\.value\.impl\.Value,tlc2\.value\.impl\.Value\),\nbut it produced the following error:\nAttempted to construct a set with too many elements \(>1000000\)\.$/,
    );
  });
});

describe("Randomization checks its set argument as TLC does", () => {
  const FINITE_REASON =
    "Attempted to check if expression of form {x \\in S : p(x)} is a finite set, but cannot check if S:\nNat\nis finite.";
  const DOMAIN_REASON =
    "Attempted to enumerate a set of the form [D -> R],but the domain D:\nNat\ncannot be enumerated.";

  const getJavaFailures = (method: string, reason: string) => {
    const message = `Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.Value tlc2.module.Randomization.${method},\nbut it produced the following error:\n${reason}`;
    return [
      message,
      75,
      0,
      `TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: ${message}`,
      75,
      1,
    ];
  };

  it.each([
    ["RandomSetOfSubsets(1, 1, {n \\in Nat : n < 3})", FINITE_REASON],
    ["TestRandomSetOfSubsets(1, 1, {n \\in Nat : n < 3})", FINITE_REASON],
    ["RandomSetOfSubsets(1, 1, [Nat -> {1}])", DOMAIN_REASON],
  ])(
    "reports the error of checking the set in %s from inside the Java override, in Init and in Next",
    async (expression, reason) => {
      expect(await checkInitAndNext("Integers, TLC, Randomization", expression)).toEqual(
        getJavaFailures(
          "RandomSetOfSubsets(tlc2.value.impl.Value,tlc2.value.impl.Value,tlc2.value.impl.Value)",
          reason,
        ),
      );
    },
  );

  // Deviation from TLC: RandomSubset normalizes the null that toSetEnum gives for the domain Nat and throws a NullPointerException.
  it("reports the domain of [Nat -> {1}] that RandomSubset can't enumerate as TLC's enumeration of [D -> R] does, in Init and in Next", async () => {
    expect(
      await checkInitAndNext("Integers, TLC, Randomization", "RandomSubset(1, [Nat -> {1}])"),
    ).toEqual(
      getJavaFailures("RandomSubset(tlc2.value.impl.Value,tlc2.value.impl.Value)", DOMAIN_REASON),
    );
  });

  it("draws <<>> from [{} -> Nat] without enumerating Nat, as TLC does", async () => {
    const outputs: string[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, TLC, Randomization\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1 /\\ PrintT(RandomSubset(1, [{} -> Nat]))\n====",
      config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      onPrint: (line) => outputs.push(line),
    });
    expect([result.status, result.generatedStates, outputs]).toEqual([
      "success",
      3,
      ["{<<>>}", "{<<>>}"],
    ]);
  });
});
