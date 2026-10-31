import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";
import type { Expression } from "../../src/ast";
import type { TlcVersion } from "../../src/tlc-version";

const HEADER = [
  "EXTENDS Naturals, Sequences, TLC, FiniteSets",
  "VARIABLE x",
  'Name == <<"zero", "one">>',
  "Rec == [a |-> 1, b |-> 2]",
  'Map == 1 :> "a" @@ 2 :> "b"',
  "Op(i) == Name[i]",
].join("\n");

// The positions TLC prints for a call stack, which skip a node that repeats the one before it.
const formatCallStack = (expressions: Expression[] | undefined) =>
  expressions
    ?.filter((expression, index) => expression !== expressions[index - 1])
    .map((expression) => {
      const range = expression.location.range;
      return range
        ? `${range.start.line}.${range.start.column}-${range.end.line}.${range.end.column}`
        : "?";
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

// Each call stack is the one TLC 1.8.0 prints for the same spec.
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

  it("checks the constraints of a successor after the action", async () => {
    expect(
      await getFailure(
        'Init == x = 0\nNext == x\' = x + 1\nSmall == Name[x + 1] # "z"',
        "INIT Init\nNEXT Next\nCONSTRAINT Small",
      ),
    ).toEqual({ callStack: ["10.10-10.26", "10.10-10.20"], exitCode: 75 });
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

  // TLC's worker adds a state to the behavior graph even after its next states fail or violate a
  // property, which evaluates ENABLED for the fairness of the spec.
  const FAIRNESS = "Spec == Init /\\ [][Next]_x /\\ WF_x(Fair)\nLive == []<>(x = 0)";

  const LIVE_STACK = ["13.36-13.39", "12.9-12.12", "11.9-11.14", "11.9-11.9"];

  // Without a replay, TLC exits with the code of the error rather than of a failed replay.
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

  const progress = (count: number) => ({ kind: "initial-states-progress", count });

  it("reports its progress again as it generates the initial states", async () => {
    expect(await replayInit("x \\in 1..6", "x < 5 \\/ (CHOOSE y \\in {} : TRUE)")).toEqual([
      5,
      [progress(2), progress(4)],
    ]);
  });

  it("counts every initial state after it fails to fingerprint one", async () => {
    expect(await replayInit("x \\in [a : 0..1, b : BOOLEAN]", "3 \\notin (1 \\cup {1})")).toEqual([
      4,
      [progress(2)],
    ]);
  });
});
