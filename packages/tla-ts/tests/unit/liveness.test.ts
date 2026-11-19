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

  it("finds the level of a spec whose initial predicate calls a recursive LET operator", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == LET RECURSIVE Loop(_)\n            Loop(i) == IF i < 1 THEN Loop(i + 1) ELSE i\n        IN  x = Loop(0)\nSpec == Init /\\ [][x' = x]_x\n====",
      config: "SPECIFICATION Spec",
    });
    expect([result.status, result.distinctStates]).toEqual(["success", 1]);
  });

  it("finds the level of a spec whose initial predicate uses a recursive LET constant", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nVARIABLE x\nInit == LET RECURSIVE Loop\n            Loop == IF FALSE THEN Loop ELSE <<>>\n        IN  \\E loop \\in {Loop} : x = 1\nSpec == Init /\\ [][x' = x]_x\n====",
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

  it("levels a property's conjunct by the bound TLC finds through the operators it calls", async () => {
    // TLCExt.tla defines PickSuccessor at the constant level, and its Java override at the action
    // level, which TLC's getLevelBound reads through Test.
    const getCheck = (property: string) =>
      check({
        source: [
          "---- MODULE M ----",
          "EXTENDS TLCExt",
          "VARIABLE x",
          "Test == PickSuccessor(TRUE)",
          "Spec == x = TRUE /\\ [][UNCHANGED x]_x",
          `Prop == ${property}`,
          "====",
        ].join("\n"),
        config: "SPECIFICATION Spec\nPROPERTY Prop",
      });
    await expect(getCheck("[](x /\\ Test)")).rejects.toThrow(
      "Temporal formulas containing actions must be of forms <>[]A or []<>A.",
    );
    expect((await getCheck("[](x /\\ TRUE)")).status).toBe("success");
  });

  it("finds the level of a call from the levels SANY gives its operator, not by expanding it", async () => {
    // Expanding each call to find its level would read each argument once for each place that
    // names it, which doubles the work at each of the operators here.
    const operators = Array.from(
      { length: 14 },
      (_, index) => `Op${index + 1}(n) == Op${index}(IF n = 0 THEN n ELSE n)`,
    );
    const getStatus = async (fairness: string) =>
      (
        await check({
          source: [
            "---- MODULE M ----",
            "EXTENDS Naturals",
            "VARIABLE x",
            "Op0(n) == n = 0",
            ...operators,
            "Next == x' = 1 - x",
            `Spec == x = 0 /\\ [][Next]_x${fairness}`,
            "Live == []<>Op14(x)",
            "====",
          ].join("\n"),
          config: "SPECIFICATION Spec\nPROPERTY Live",
        })
      ).status;
    expect(await getStatus(" /\\ WF_x(Next)")).toBe("success");
    expect(await getStatus("")).toBe("liveness-violation");
  });
});
