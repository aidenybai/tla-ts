import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";
import { getUnexpectedException } from "../../src/errors";
import type { TlcVersion } from "../../src/tlc/version";
import { checkFixture } from "./check-harness";

const DIRECTORY = join(import.meta.dirname, "../fixtures/liveness");

const SOURCE = readFileSync(join(DIRECTORY, "Liveness.tla"), "utf8");

const checkGithub710 = (configName: string, version?: TlcVersion) =>
  checkFixture("github710", "Github710d", configName, { version });

const TLC_VERDICTS: [string, string][] = [
  ["Unfair-ReachesLimit", "liveness-violation"],
  ["Unfair-StaysAtLimit", "liveness-violation"],
  ["Unfair-Served", "liveness-violation"],
  ["Unfair-TokenMoves", "liveness-violation"],
  ["Unfair-NeverCritical", "liveness-violation"],
  ["Fair-ReachesLimit", "success"],
  ["Fair-StaysAtLimit", "success"],
  ["Fair-Served", "success"],
  ["Fair-TokenMoves", "success"],
  ["Fair-NeverCritical", "liveness-violation"],
  ["Strong-ReachesLimit", "success"],
  ["Strong-StaysAtLimit", "success"],
  ["Strong-Served", "success"],
  ["Strong-TokenMoves", "success"],
  ["Strong-NeverCritical", "liveness-violation"],
];

describe("liveness matches TLC", () => {
  it.each(TLC_VERDICTS)("%s is %s", async (name, status) => {
    const result = await check({
      source: SOURCE,
      config: readFileSync(join(DIRECTORY, `${name}.cfg`), "utf8"),
    });
    expect(result.status).toBe(status);
    expect([result.generatedStates, result.distinctStates]).toEqual([92, 36]);
  });

  it("evaluates a fairness check that prints on each step, as TLC does", async () => {
    const printed: string[] = [];
    await check({
      source: readFileSync(join(DIRECTORY, "PrintedFairness.tla"), "utf8"),
      config: readFileSync(join(DIRECTORY, "PrintedFairness.cfg"), "utf8"),
      onPrint: (text) => printed.push(String(text)),
    });
    expect(printed).toEqual(Array(9).fill('"a"'));
  });

  it("checks the steps of each action before it generates the next action's steps for a state it reaches again in the tableau, as TLC does", async () => {
    const printed: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS TLC\nVARIABLE x\nA0 == PrintT(<<"A0", x>>) /\\ x\' = ~x\nA1 == PrintT(<<"A1", x>>) /\\ UNCHANGED x\nSpec == x = FALSE /\\ [][A0 \\/ A1]_x /\\ WF_<<x>>(A0) /\\ WF_x(A1)\nProp == x ~> ~x\n====',
      config: "SPECIFICATION Spec\nPROPERTY Prop",
      onPrint: (text) => printed.push(String(text).replace(/<<"(A\d)", (\w)\w*>>/, "$1$2")),
    });
    expect(printed.join(" ")).toBe(
      "A0F A1F A0F A1F A0F A0F A1F A0T A1T A0T A0T A1T A0T A1T A0T A1T A0T A0T A0T A1T A1T A0T A1T",
    );
  });

  it("finds a lasso in the part of the graph that TLC's periodic check sees", async () => {
    const result = await check({
      source:
        "---- MODULE Tree ----\nEXTENDS Naturals\nVARIABLE x\nNext == x < 4000000 /\\ x' \\in {2 * x + 1, 2 * x + 2}\nSpec == x = 0 /\\ [][Next]_x\nProperty == TRUE ~> FALSE\n====",
      config: "SPECIFICATION Spec\nPROPERTY Property",
    });
    expect(result.status).toBe("liveness-violation");
  }, 60_000);

  it("reports a lasso whose cycle returns to an earlier state", async () => {
    const result = await check({
      source: SOURCE,
      config: readFileSync(join(DIRECTORY, "Unfair-ReachesLimit.cfg"), "utf8"),
    });
    const violation = result.violation;
    expect(violation?.loopStart).toBeDefined();
    expect(violation?.loopStart).toBeLessThan(violation?.trace.length ?? 0);
  });

  it("follows a step from a state a VIEW merges to a state the search stores later, as TLC does", async () => {
    const result = await check({
      source: [
        "---- MODULE ViewLate ----",
        "EXTENDS Naturals",
        "VARIABLES x, y",
        "vars == <<x, y>>",
        "Init == x = 0 /\\ y = 0",
        "Next ==",
        "  \\/ x = 0 /\\ x' = 1 /\\ y' = 0",
        "  \\/ x = 0 /\\ x' = 2 /\\ y' = 1",
        "  \\/ x = 0 /\\ x' = 4 /\\ y' = 0",
        "  \\/ x = 2 /\\ x' = 1 /\\ y' = y",
        "  \\/ x = 1 /\\ y = 0 /\\ x' = 5 /\\ y' = y",
        "  \\/ x = 1 /\\ y = 1 /\\ x' = 3 /\\ y' = y",
        "  \\/ x = 4 /\\ x' = 3 /\\ y' = y",
        "Spec == Init /\\ [][Next]_vars /\\ WF_vars(Next)",
        "Prop == (x = 2) ~> (x = 5)",
        "View == x",
        "====",
      ].join("\n"),
      config: "SPECIFICATION Spec\nPROPERTY Prop\nVIEW View\nCHECK_DEADLOCK FALSE",
    });
    expect(result.status).toBe("liveness-violation");
    expect(result.violation?.trace.map((step) => [step.label, step.state])).toEqual([
      [undefined, { x: 0, y: 0 }],
      ["Next line 8, col 6 to line 8, col 30 of module ViewLate", { x: 2, y: 1 }],
      ["Next line 10, col 6 to line 10, col 30 of module ViewLate", { x: 1, y: 1 }],
      ["Next line 12, col 6 to line 12, col 39 of module ViewLate", { x: 3, y: 1 }],
    ]);
  });

  it.each([
    ["ViewMerged", []],
    ["ViewMergedOnward", ["  \\/ x = 3 /\\ x' = 6 /\\ y' = y"]],
  ])(
    "counts the states of the behavior graph for the temporal check of %s like TLC",
    async (name, steps) => {
      const counts: number[] = [];
      const result = await check({
        source: [
          `---- MODULE ${name} ----`,
          "EXTENDS Naturals",
          "VARIABLES x, y",
          "vars == <<x, y>>",
          "Init == x = 0 /\\ y = 0",
          "Next ==",
          "  \\/ x = 0 /\\ x' = 1 /\\ y' = 0",
          "  \\/ x = 0 /\\ x' = 2 /\\ y' = 1",
          "  \\/ x = 2 /\\ x' = 1 /\\ y' = y",
          "  \\/ x = 1 /\\ y = 0 /\\ x' = 5 /\\ y' = y",
          "  \\/ x = 1 /\\ y = 1 /\\ x' = 3 /\\ y' = y",
          ...steps,
          "Spec == Init /\\ [][Next]_vars /\\ WF_vars(Next)",
          "Prop == (x = 2) ~> (x = 5)",
          "View == x",
          "====",
        ].join("\n"),
        config: "SPECIFICATION Spec\nPROPERTY Prop\nVIEW View\nCHECK_DEADLOCK FALSE",
        onProgress: (progress) => {
          if (progress.kind === "liveness-started") counts.push(progress.states);
        },
      });
      expect(result.status).toBe("success");
      expect([result.generatedStates, result.distinctStates]).toEqual([5, 4]);
      expect(counts).toEqual([5]);
    },
  );

  it("reports the deadlock before the temporal property that fails in the same state", async () => {
    const checkConfig = async (name: string) => {
      const result = await checkGithub710(name);
      return [
        result.status,
        result.violation?.name,
        result.violation?.trace.map((step) => step.state.x),
      ];
    };
    expect(await checkConfig("Github710d")).toEqual(["deadlock", "deadlock", [0, 1, 2, 3]]);
    expect(await checkConfig("Github710dNoDeadlock")).toEqual([
      "property-violation",
      "NeverThree",
      [0, 1, 2, 3],
    ]);
  });

  it("reports a temporal property that fails as TLC adds the state that violates an action property to the behavior graph", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nVARIABLE x\nSpec == x \\in {0, 1} /\\ [][x' = IF x = 0 THEN 1 ELSE 0]_x\nAct == [][x' = 1]_x\nProp == [](x = 1 => [](x = 1))\n====",
      config: "SPECIFICATION Spec\nPROPERTY Act\nPROPERTY Prop",
    });
    expect([
      result.violation?.name,
      result.violation?.trace.map((step) => step.state.x),
      result.additionalViolation?.name,
      result.additionalViolation?.trace.map((step) => step.state.x),
    ]).toEqual(["Act", [1, 0], "Prop", [1, 0]]);
  });

  // Deviation from TLC: under -continue, TLC also reports an InvariantViolatedException and exits with 255.
  it("stops at a temporal property that fails as its state joins the behavior graph under -continue", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nVARIABLE x\nSpec == x \\in {0, 1} /\\ [][x' = IF x = 0 THEN 1 ELSE 0]_x\nProp == [](x = 1 => [](x = 1))\n====",
      config: "SPECIFICATION Spec\nPROPERTY Prop",
      isContinued: true,
    });
    expect([
      result.status,
      result.violation?.name,
      result.violation?.trace.map((step) => step.state.x),
      result.failure,
    ]).toEqual(["property-violation", "Prop", [1, 0], undefined]);
  });

  it("finds a violation of a safety-like property early unless TLC is 1.7.4", async () => {
    const master = await checkGithub710("Github710d", "master");
    expect(master.additionalViolation?.name).toBe("NeverThree");
    const release = await checkGithub710("Github710d", "1.7.4");
    expect(release.additionalViolation?.name).toBeUndefined();
  });

  it.each(["master", "1.7.4"] satisfies TlcVersion[])(
    "evaluates a constant conjunct of a temporal property in TLC %s",
    async (version) => {
      const result = check({
        source:
          "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = 1 - x\nSpec == Init /\\ [][Next]_x\nP == <>[](x = 1 /\\ (1 \\div 0) > 0)\n====",
        config: "SPECIFICATION Spec\nPROPERTY P",
        version,
      });
      await expect(result).rejects.toThrow(
        `${getUnexpectedException("tlc2.tool.EvalException")}The second argument of \\div is 0.`,
      );
    },
  );

  it("evaluates in each state a call whose definition ignores its variable argument, as TLC's level bound counts the argument", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, Sequences\nVARIABLE x\nG(v) == Head(<<>>) = 1\nInit == x = 0\nNext == x < 4 /\\ x' = x + 1\nProp == <>(x = 3 /\\ G(x))\n====",
      config: "INIT Init\nNEXT Next\nPROPERTY Prop",
    });
    expect([
      result.status,
      result.failure?.message,
      result.failure?.trace?.map((step) => step.state.x),
      result.failure?.callStack
        ?.filter((expression, index, stack) => expression !== stack[index - 1])
        .map((expression) => {
          const range = expression.location.range;
          return `${range?.start.line}.${range?.start.column}-${range?.end.line}.${range?.end.column}`;
        }),
    ]).toEqual([
      "error",
      "Attempted to apply Head to the empty sequence.",
      [0, 1, 2],
      ["7.12-7.24", "7.21-7.24", "4.9-4.22", "4.9-4.18"],
    ]);
  });

  it("finds the level of a spec whose initial predicate calls a recursive LET operator", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == LET RECURSIVE Loop(_)\n            Loop(i) == IF i < 1 THEN Loop(i + 1) ELSE i\n        IN  x = Loop(0)\nSpec == Init /\\ [][x' = x]_x\n====",
      config: "SPECIFICATION Spec",
    });
    expect([result.status, result.distinctStates]).toEqual(["success", 1]);
  });

  it("checks a property that calls a recursive LET operator", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 3\nSpec == Init /\\ [][Next]_x /\\ WF_x(Next)\nLive == LET RECURSIVE G(_)\n            G(n) == IF n = 0 THEN x ELSE G(n - 1)\n        IN  []<>(G(2) = 2)\n====",
      config: "SPECIFICATION Spec\nPROPERTY Live",
    });
    expect([result.status, result.distinctStates]).toEqual(["success", 3]);
  });
});
