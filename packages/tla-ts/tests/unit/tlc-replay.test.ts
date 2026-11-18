import { describe, expect, it } from "vite-plus/test";
import { check, formatValue } from "../../src";
import type { Expression } from "../../src/ast";
import type { TlcVersion } from "../../src/tlc/version";

const HEADER = [
  "EXTENDS Naturals, Sequences, TLC, FiniteSets",
  "VARIABLE x",
  'Name == <<"zero", "one">>',
  "Rec == [a |-> 1, b |-> 2]",
  'Map == 1 :> "a" @@ 2 :> "b"',
  "Op(i) == Name[i]",
].join("\n");

const formatCallStack = (expressions: Expression[] | undefined) =>
  expressions?.flatMap((expression, index) => {
    const range = expression.location.range;
    return range && expression !== expressions[index - 1]
      ? [`${range.start.line}.${range.start.column}-${range.end.line}.${range.end.column}`]
      : [];
  });

const checkSpec = (definitions: string, config: string, version?: TlcVersion) =>
  check({
    source: `---- MODULE M ----\n${HEADER}\n${definitions}\n====`,
    config,
    version,
    onPrint: () => {},
  });

const getFailure = async (
  definitions: string,
  config = "INIT Init\nNEXT Next",
  version?: TlcVersion,
) => {
  const result = await checkSpec(definitions, config, version);
  return {
    callStack: formatCallStack(result.failure?.callStack),
    exitCode: result.failure?.exitCode,
  };
};

describe("the call stack of a replayed failure matches TLC", () => {
  it("walks the conjuncts and quantifiers of the next-state relation", async () => {
    expect(
      await getFailure("Init == x = 0\nNext == \\E i \\in {1, 2} : x' = x + Op(x + i)"),
    ).toEqual({ callStack: ["9.27-9.44", "9.32-9.44"], exitCode: 75 });
  });

  it("enters the definition that an action applies", async () => {
    expect(
      await getFailure("Step(n) == x' = n + Name[n + 2]\nInit == x = 0\nNext == Step(x)"),
    ).toEqual({ callStack: ["10.9-10.15", "8.12-8.31", "8.17-8.31"], exitCode: 75 });
  });

  it("walks the body of a function that an action applies", async () => {
    expect(await getFailure("Init == x = 0\nNext == [p \\in {1} |-> 0][1] /\\ x' = x")).toEqual({
      callStack: ["9.9-9.38", "9.9-9.28", "9.24-9.24"],
      exitCode: 75,
    });
  });

  it("keeps the conjuncts of a bulleted list that held", async () => {
    expect(
      await getFailure('Init == x = 0\nNext == /\\ Name[x + 1] # "z"\n        /\\ x\' = x + 1'),
    ).toEqual({ callStack: ["9.9-10.21", "9.12-9.28", "9.12-9.22"], exitCode: 75 });
  });

  it("ends each prefix of an infix conjunction after the parentheses of its last operand", async () => {
    expect(
      await getFailure(
        "Init == x = 0\nNext == (x < 3) /\\ (x' = x + 1) /\\ TRUE /\\ (x' # Name[3])",
      ),
    ).toEqual({
      callStack: [
        "9.9-9.57",
        "9.9-9.39",
        "9.9-9.31",
        "9.10-9.14",
        "9.21-9.30",
        "9.45-9.56",
        "9.50-9.56",
      ],
      exitCode: 75,
    });
  });

  it("checks an initial state inside the initial predicate", async () => {
    expect(
      await getFailure(
        "Init == x = 0\nNext == x' = x + 1\nInv == Name[x + 1] = Name[x]",
        "INIT Init\nNEXT Next\nINVARIANT Inv",
      ),
    ).toEqual({ callStack: ["8.9-8.13", "10.8-10.28", "10.22-10.28"], exitCode: 75 });
  });

  it("finds an action enabled that leaves a variable unassigned", async () => {
    expect(
      await getFailure(
        "VARIABLE y\nInit == x \\in 0..1 /\\ y = TRUE\nA0 == x' = IF x < 1 THEN x + 1 ELSE x /\\ UNCHANGED y\nNext == A0\nInv == ENABLED A0",
        "INIT Init\nNEXT Next\nINVARIANT Inv",
      ),
    ).toEqual({
      callStack: [
        "9.9-9.30",
        "9.9-9.18",
        "9.23-9.30",
        "12.8-12.17",
        "12.16-12.17",
        "10.7-10.52",
        "10.12-10.52",
        "10.37-10.52",
      ],
      exitCode: 75,
    });
  });

  it("checks the constraints of a successor after the action", async () => {
    expect(
      await getFailure(
        'Init == x = 0\nNext == x\' = x + 1\nSmall == Name[x + 1] # "z"',
        "INIT Init\nNEXT Next\nCONSTRAINT Small",
      ),
    ).toEqual({ callStack: ["10.10-10.26", "10.10-10.20"], exitCode: 75 });
  });

  it("evaluates a selection under UNCHANGED, in which TLC finds no variable", async () => {
    const result = await checkSpec(
      "VARIABLE y\nPair == <<x, y>>\nInit == x = 0 /\\ y = 0\nNext == x' = 1 /\\ UNCHANGED Pair!2",
      "INIT Init\nNEXT Next",
    );
    expect([
      result.generatedStates,
      result.distinctStates,
      formatCallStack(result.failure?.callStack)?.at(-1),
    ]).toEqual([1, 1, "9.14-9.14"]);
  });

  it.each([
    [
      "VARIABLE y\nPair == <<x, y>>\nInit == x = 0 /\\ y = 0\nNext == x' = 1 /\\ UNCHANGED Pair!2",
      ["11.9-11.34", "11.9-11.14", "11.19-11.34", "11.29-11.34", "9.14-9.14"],
    ],
    [
      'Pair == {Name[x + 3], 1}\nInit == x = 0\nNext == x\' = 1 /\\ Pair!1 = "a"',
      ["10.9-10.30", "10.9-10.14", "10.19-10.30", "10.19-10.24", "8.10-8.20"],
    ],
    [
      'Sel == LET k == 3 IN {Name[k], 1}\nInit == x = 0\nNext == x\' = 1 /\\ Sel!1!1 = "a"',
      ["10.9-10.31", "10.9-10.14", "10.19-10.31", "10.19-10.25", "8.23-8.29"],
    ],
    [
      'Sel(k) == {Name[k], 1}\nInit == x = 0\nNext == x\' = 1 /\\ Sel(3)!1 = "a"',
      ["10.9-10.32", "10.9-10.14", "10.19-10.32", "10.19-10.26", "8.12-8.18"],
    ],
    [
      'Sel == \\A k \\in {1} : Name[k + 2] = "a"\nInit == x = 0\nNext == x\' = 1 /\\ Sel!(1)',
      ["10.9-10.25", "10.9-10.14", "10.19-10.25", "8.23-8.39", "8.23-8.33"],
    ],
  ])("enters a selection where SANY's $Nop or LAMBDA is in %j", async (definitions, callStack) => {
    expect(await getFailure(definitions)).toEqual({ callStack, exitCode: 75 });
  });

  it("stops at a failure of the next-state relation under -continue, where TLC goes on to report a deadlock", async () => {
    const result = await check({
      source: `---- MODULE M ----\n${HEADER}\nInit == x = 0\nNext == x' = (x /\\ TRUE)\n====`,
      config: "INIT Init\nNEXT Next",
      isContinued: true,
      onPrint: () => {},
    });
    expect([
      result.status,
      result.failure?.exitCode,
      formatCallStack(result.failure?.callStack),
    ]).toEqual(["error", 75, ["9.9-9.24", "9.15-9.23"]]);
  });

  it("reports a failed invariant once under -continue, where TLC reports it again with the code of its error", async () => {
    const result = await check({
      source: `---- MODULE M ----\n${HEADER}\nInit == x = 0\nNext == x' = x + 1\nInv == x < 2 \\/ Assert(FALSE, "bound")\n====`,
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      isContinued: true,
    });
    expect([result.failure?.code, result.failure?.exitCode, result.failure?.trace.length]).toEqual([
      2111, 76, 3,
    ]);
  });

  it("exits with the code of a standard module's failure in an action property", async () => {
    const failure = await getFailure(
      "Init == x = 0\nNext == x < 3 /\\ x' = x + 1\nSpec == Init /\\ [][Next]_x\nProp == [][1 \\div (1 - x) = 1]_x",
      "SPECIFICATION Spec\nPROPERTY Prop",
    );
    expect(failure).toEqual({
      callStack: ["11.11-11.32", "11.12-11.29", "11.12-11.25"],
      exitCode: 255,
    });
  });

  const FAIRNESS = "Spec == Init /\\ [][Next]_x /\\ WF_x(Fair)\nLive == []<>(x = 0)";

  const LIVE_STACK = ["13.36-13.39", "12.9-12.12", "11.9-11.14", "11.9-11.9"];

  it.each([
    [undefined, "1 \\div x", [...LIVE_STACK, "9.6-9.18", "9.11-9.18"], 255],
    ["1.7.4" as const, "1 \\div x", ["9.6-9.18", "9.11-9.18"], 255],
    [undefined, "CHOOSE y \\in {} : TRUE", [...LIVE_STACK, "9.6-9.32", "9.11-9.32"], 255],
    ["1.7.4" as const, "CHOOSE y \\in {} : TRUE", ["9.6-9.32", "9.11-9.32"], 75],
  ])(
    "prints where adding a state whose next states fail to the behavior graph fails (TLC %s, %s)",
    async (version, value, callStack, exitCode) => {
      expect(
        await getFailure(
          `Init == x = 0\nA == x' = ${value}\nB == x' = x\nNext == A \\/ B\nFair == Next\n${FAIRNESS}`,
          "SPECIFICATION Spec\nPROPERTY Live",
          version,
        ),
      ).toEqual({ callStack, exitCode });
    },
  );

  it("walks the conjuncts of a fair action after it assigns every variable", async () => {
    expect(
      await getFailure(
        "Init == x = 0\nA == x' = x /\\ (IF x = 0 THEN 3 ELSE TRUE)\nSpec == Init /\\ [][x' = x]_x /\\ WF_x(A)\nP == <>(x = 0)",
        "SPECIFICATION Spec\nPROPERTY P",
      ),
    ).toEqual({
      callStack: ["10.38-10.38", "9.6-9.42", "9.6-9.11", "9.17-9.41", "9.31-9.31"],
      exitCode: 255,
    });
  });

  it.each([
    [undefined, "deadlock", ["12.36-12.39", "9.9-9.27", "9.14-9.27"]],
    [undefined, "invariant-violation", ["12.36-12.39", "9.9-9.27", "9.14-9.27"]],
    ["1.7.4" as const, "invariant-violation", undefined],
  ])(
    "prints where adding a state to the behavior graph fails after a violation (TLC %s, %s)",
    async (version, status, callStack) => {
      const result = await checkSpec(
        `Init == x = 0\nFair == x' = 1 \\div (x - 1)\nNext == x < ${status === "deadlock" ? 1 : 3} /\\ x' = x + 1\nInv == x < 2\n${FAIRNESS}`,
        "SPECIFICATION Spec\nPROPERTY Live\nINVARIANT Inv",
        version,
      );
      expect([result.status, formatCallStack(result.liveCallStack)]).toEqual([status, callStack]);
    },
  );

  it("enters the prefix of a chain of conjuncts below the temporal level as one formula, as TLC does", async () => {
    expect(
      await getFailure(
        'Init == x \\in [{1, 2} -> 0..1]\nNext == UNCHANGED x\nProp == <>(x[1] = 0 /\\ (x[2] > 5 \\/ Assert(x[2] > 5, "bound")) /\\ [](x[1] = 0))',
        "INIT Init\nNEXT Next\nPROPERTY Prop",
      ),
    ).toEqual({
      callStack: ["8.9-8.30", "10.12-10.62", "10.25-10.61", "10.37-10.61"],
      exitCode: 75,
    });
  });

  const BAD = "x = 1 /\\ CHOOSE y \\in {} : y = x";

  it.each([
    ["<>(x = 2)", `[]<>(${BAD})`, "1 - x", "Safe\nPROPERTY Bad", undefined],
    ["<>(x = 2)", `[]<>(${BAD})`, "1 - x", "Bad\nPROPERTY Safe", ["11.13-11.44", "11.22-11.44"]],
    ["<>(x < 2)", `[]<>(${BAD})`, "1 - x", "Safe\nPROPERTY Bad", ["11.13-11.44", "11.22-11.44"]],
    ["[]<>(x = 0)", `<>(x = 2) \\/ []<>(${BAD})`, "1 - x", "Safe\nPROPERTY Bad", undefined],
    [
      "[]<>(x = 0)",
      `<>(x = 2) \\/ []<>(${BAD})`,
      "(x + 1) % 3",
      "Safe\nPROPERTY Bad",
      ["11.26-11.57", "11.35-11.57"],
    ],
  ])(
    "prints no call stack where TLC's rerun first fails on a branch that already holds the state (Safe == %s, Bad == %s, Next == x' = %s)",
    async (safe, bad, next, properties, callStack) => {
      expect(
        await getFailure(
          `Init == x = 0\nNext == x' = ${next}\nSafe == ${safe}\nBad == ${bad}`,
          `INIT Init\nNEXT Next\nPROPERTY ${properties}`,
        ),
      ).toEqual({ callStack, exitCode: 255 });
    },
  );

  it.each([
    [undefined, [1, 1]],
    ["1.7.4" as const, [0, 1]],
  ])(
    "counts a deadlocked state it fails to add to the behavior graph as expanded (TLC %s)",
    async (version, outDegrees) => {
      const result = await checkSpec(
        `Init == x = 0\nFair == x' = 1 \\div (x - 1)\nNext == x < 1 /\\ x' = x + 1\n${FAIRNESS}`,
        "SPECIFICATION Spec\nPROPERTY Live",
        version,
      );
      expect(result.violationOutDegrees?.slice(0, 2)).toEqual(outDegrees);
    },
  );
});

describe("the replay of a failed initial state matches TLC", () => {
  const replayInit = async (init: string, inv: string) => {
    const result = await checkSpec(
      `Init == ${init}\nNext == x' = x\nInv == ${inv}`,
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    );
    return [result.generatedStates, result.failure?.traceOutput];
  };

  const getProgress = (count: number) => ({ kind: "initial-states-progress", count });

  it("reports its progress again as it generates the initial states", async () => {
    expect(await replayInit("x \\in 1..6", "x < 5 \\/ (CHOOSE y \\in {} : TRUE)")).toEqual([
      5,
      [getProgress(2), getProgress(4)],
    ]);
  });

  it("counts an illegal initial state before it reports it", async () => {
    const counts: number[] = [];
    await check({
      source: `---- MODULE M ----\n${HEADER}\nInit == \\E i \\in 1..3 : i < 3 => x = i\nNext == x' = x\n====`,
      config: "INIT Init\nNEXT Next",
      onPrint: () => {},
      onProgress: (event) => {
        if (event.kind === "initial-states-progress") counts.push(event.count);
      },
    });
    expect(counts).toEqual([2]);
  });

  it("reports each violated invariant again under -continue until it fails", async () => {
    const result = await check({
      source: `---- MODULE M ----\n${HEADER}\nInit == x \\in 1..3\nNext == x' = x\nInv0 == x > 5\nInv1 == x # 2 \\/ CHOOSE e \\in {} : TRUE\n====`,
      config: "INIT Init\nNEXT Next\nINVARIANT Inv0\nINVARIANT Inv1",
      isContinued: true,
      onPrint: () => {},
    });
    expect([
      result.generatedStates,
      result.failure?.traceOutput?.map((line) =>
        typeof line !== "string" && line.kind === "initial-state-violation"
          ? `${line.name} ${formatValue(line.state.x)}`
          : line,
      ),
      formatCallStack(result.failure?.callStack),
    ]).toEqual([2, ["Inv0 1", "Inv0 2"], ["8.9-8.18", "11.9-11.39", "11.18-11.39"]]);
  });

  it("counts every initial state after it fails to fingerprint one", async () => {
    expect(await replayInit("x \\in [a : 0..1, b : BOOLEAN]", "3 \\notin (1 \\cup {1})")).toEqual([
      4,
      [getProgress(2)],
    ]);
  });
});

describe("the replay of an initial state that fails to join the behavior graph matches TLC", () => {
  it.each([undefined, "1.7.4" as const])(
    "adds a new state to the graph (TLC %s)",
    async (version) => {
      const result = await checkSpec(
        "Init == x \\in {0, 1}\nA == x' = Name[x + 3]\nSpec == Init /\\ [][A]_x\nP == [](ENABLED A => <>(x = 0))",
        "SPECIFICATION Spec\nPROPERTY P",
        version,
      );
      expect([
        formatCallStack(result.failure?.callStack),
        result.generatedStates,
        result.distinctStates,
        result.queuedStates,
      ]).toEqual([["8.9-8.20", "11.9-11.17", "11.17-11.17", "9.6-9.21", "9.11-9.21"], 2, 2, 2]);
    },
  );
});

it("reports a failure of a temporal property where TLC's rerun loses it to a FingerprintException", async () => {
  const result = await checkSpec(
    "Deep(a) == LET t == <<a>> IN t[a + 2]\nInit == x = 2\nNext == UNCHANGED x\nLive == []<>(Deep(x) > 0)",
    "INIT Init\nNEXT Next\nPROPERTY Live",
  );
  expect([
    result.failure?.message,
    formatCallStack(result.failure?.callStack),
    result.failure?.exitCode,
  ]).toEqual([
    "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: Attempted to access index 4 of tuple\n<<2>>\nwhich is out of bounds.",
    ["11.14-11.24", "11.14-11.20", "8.12-8.37", "8.30-8.37", "8.21-8.25"],
    255,
  ]);
});
