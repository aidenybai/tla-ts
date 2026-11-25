import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { check, TlaError } from "../../src";
import { getErrorExitCode, getUnexpectedException, STACK_OVERFLOW_MESSAGE } from "../../src/errors";
import type { TlcVersion } from "../../src/tlc/version";
import { checkFixture, formatCallStackLines } from "./check-harness";

const DIRECTORY = join(import.meta.dirname, "../fixtures/liveness");

const SOURCE = readFileSync(join(DIRECTORY, "Liveness.tla"), "utf8");

const checkGithub710 = (configName: string, version?: TlcVersion) =>
  checkFixture("github710", "Github710d", configName, { version });

afterEach(() => {
  vi.restoreAllMocks();
});

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
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => (now += 1));
    const result = await check({
      source:
        "---- MODULE Tree ----\nEXTENDS Naturals\nVARIABLE x\nNext == x < 4000000 /\\ x' \\in {2 * x + 1, 2 * x + 2}\nSpec == x = 0 /\\ [][Next]_x\nProperty == TRUE ~> FALSE\n====",
      config: "SPECIFICATION Spec\nPROPERTY Property",
    });
    expect(result.status).toBe("liveness-violation");
  });

  it.each([
    [0, 500, [3000, 63_500, 124_000, 184_500, 245_000]],
    [0, 750, [3000]],
    [0, 2000, [3000, 125_000, 187_000, 249_000]],
    [0, 20_000, [3000, 203_000, 283_000]],
    [10_000, 2000, [13_000, 75_000, 137_000, 199_000, 261_000]],
  ])(
    "checks the partial graph each minute only while the runtime ratio TLC last recorded is below 0.2, when the initial states take %i ms and a check takes %i ms",
    async (initialDuration, checkDuration, expected) => {
      let now = 0;
      vi.spyOn(performance, "now").mockImplementation(() => now);
      const checkedAt: number[] = [];
      const result = await check({
        source:
          "---- MODULE Ticks ----\nEXTENDS Naturals, TLC\nVARIABLE x\nNext == x < 2500 /\\ PrintT(x) /\\ x' = x + 1\nSpec == x = 0 /\\ [][Next]_x\nProp == <>(x >= 0)\n====",
        config: "SPECIFICATION Spec\nPROPERTY Prop\nCHECK_DEADLOCK FALSE",
        onPrint: () => {
          now += 100;
        },
        onProgress: (progress) => {
          if (progress.kind === "initial-states-computed") now += initialDuration;
          if (progress.kind !== "liveness-started" || progress.isComplete) return;
          checkedAt.push(now);
          now += checkDuration;
        },
      });
      expect([result.status, checkedAt]).toEqual(["success", expected]);
    },
  );

  it("reports a lasso whose cycle returns to an earlier state", async () => {
    const result = await check({
      source: SOURCE,
      config: readFileSync(join(DIRECTORY, "Unfair-ReachesLimit.cfg"), "utf8"),
    });
    const violation = result.violation;
    expect(violation?.loopStart).toBeDefined();
    expect(violation?.loopStart).toBeLessThan(violation?.trace.length ?? 0);
  });

  it("reports a cycle that steps back to its first state between tableau nodes as a loop, where TLC prints stuttering", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nNext == (x < 2 /\\ x' = x + 1) \\/ (x = 2 /\\ x' = 0)\nSpec == x = 0 /\\ [][Next]_x /\\ WF_x(Next)\nProp == ~((x = 1) ~> (x = 0))\n====",
      config: "SPECIFICATION Spec\nPROPERTY Prop",
    });
    expect([
      result.violation?.trace.map((step) => [step.label, step.state.x]),
      result.violation?.loopStart,
    ]).toEqual([
      [
        [undefined, 0],
        ["Next line 4, col 10 to line 4, col 28 of module M", 1],
        ["Next line 4, col 10 to line 4, col 28 of module M", 2],
        ["Next line 4, col 35 to line 4, col 49 of module M", 0],
      ],
      0,
    ]);
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

  it.each([
    [
      "Bad == x < 3 /\\ 1 \\div (x - x) = 0",
      "The second argument of \\div is 0.",
      [
        "Line 4, column 8 to line 4, column 34 in M",
        "Line 4, column 17 to line 4, column 34 in M",
        "Line 4, column 17 to line 4, column 30 in M",
      ],
    ],
    [
      "Bad == CHOOSE v \\in {} : TRUE",
      "Attempted to compute the value of an expression of form\nCHOOSE x \\in S: P, but no element of S satisfied P.\nline 4, col 8 to line 4, col 29 of module M",
      ["Line 4, column 8 to line 4, column 29 in M"],
    ],
  ])(
    "keeps the reference in [] of %s as TLC's implied invariant does",
    async (definition, message, frames) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\n${definition}\nProp == []Bad\nInit == x = 0\nNext == x' = (x + 1) % 3\n====`,
        config: "INIT Init\nNEXT Next\nPROPERTY Prop",
      });
      expect([result.failure?.message, formatCallStackLines(result)]).toEqual([
        message,
        [
          "Line 6, column 9 to line 6, column 13 in M",
          "Line 5, column 11 to line 5, column 13 in M",
          ...frames,
        ],
      ]);
    },
  );

  it("evaluates a constant part of a definition a temporal property calls at startup, as TLC expands the call", async () => {
    const printed: string[] = [];
    const result = await check({
      source:
        '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nS(v) == v < 0 /\\ PrintT("s")\nInit == x = 0\nNext == x < 4 /\\ x\' = x + 1\nProp == <>[]~S(x)\n====',
      config: "INIT Init\nNEXT Next\nPROPERTY Prop\nCHECK_DEADLOCK FALSE",
      onPrint: (text) => printed.push(String(text)),
    });
    expect([result.status, printed]).toEqual(["success", ['"s"']]);
  });

  it("finds the level of a spec whose initial predicate calls a recursive LET operator", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == LET RECURSIVE Loop(_)\n            Loop(i) == IF i < 1 THEN Loop(i + 1) ELSE i\n        IN  x = Loop(0)\nSpec == Init /\\ [][x' = x]_x\n====",
      config: "SPECIFICATION Spec",
    });
    expect([result.status, result.distinctStates]).toEqual(["success", 1]);
  });

  it("leaves a recursive operator a temporal property calls through an operator argument unexpanded, as TLC does", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE s\nRECURSIVE RecOp(_)\nRecOp(n) == IF n = 0 THEN TRUE ELSE RecOp(n - 1)\nA == INSTANCE Abstract\nInit == s = 0\nNext == s' = (s + 1) % 3\nProp == A!Double(RecOp, s)\nLive == LET RECURSIVE L(_)\n            L(n) == IF n = 0 THEN TRUE ELSE L(n - 1)\n        IN  A!Double(L, s)\n====",
      config: "INIT Init\nNEXT Next\nPROPERTY Prop Live",
      loadModule: (name) =>
        name === "Abstract"
          ? "---- MODULE Abstract ----\nVARIABLE s\nAlways(ns(_), a) == [](ns(a))\nDouble(ns(_), a) == Always(ns, a)\n===="
          : undefined,
    });
    expect([result.status, result.distinctStates]).toEqual(["success", 3]);
  });

  it("evaluates a constant part of a violated temporal property again as it names the property, as TLC translates the property again", async () => {
    const printed: string[] = [];
    const result = await check({
      source:
        '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nS(v) == v < 0 /\\ PrintT("s")\nInit == x = 0\nNext == x < 4 /\\ x\' = x + 1\nProp == <>S(x)\n====',
      config: "INIT Init\nNEXT Next\nPROPERTY Prop\nCHECK_DEADLOCK FALSE",
      onPrint: (text) => printed.push(String(text)),
    });
    expect([result.status, result.violation?.name, printed]).toEqual([
      "liveness-violation",
      "Prop",
      ['"s"', '"s"'],
    ]);
  });

  it("checks a property that calls a recursive operator with a variable", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE s\nRECURSIVE RecOp(_)\nRecOp(n) == IF n = 0 THEN TRUE ELSE RecOp(n - 1)\nInit == s = 0\nNext == s' = (s + 1) % 3\nProp == []RecOp(s)\n====",
      config: "INIT Init\nNEXT Next\nPROPERTY Prop",
    });
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "success",
      4,
      3,
    ]);
  });

  it("checks a property that calls a recursive LET operator", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 3\nSpec == Init /\\ [][Next]_x /\\ WF_x(Next)\nLive == LET RECURSIVE G(_)\n            G(n) == IF n = 0 THEN x ELSE G(n - 1)\n        IN  []<>(G(2) = 2)\n====",
      config: "SPECIFICATION Spec\nPROPERTY Live",
    });
    expect([result.status, result.distinctStates]).toEqual(["success", 3]);
  });

  it.each([
    ["a property's conjunction", "Spec", "Prop == LET RECURSIVE F F == F /\\ <>(x = 1) IN F"],
    ["a property's IF", "Spec", "Prop == LET RECURSIVE F F == IF x = 0 THEN <>(x = 1) ELSE F IN F"],
    ["a property's []", "Spec", "Prop == LET RECURSIVE F F == <>(x = 1) /\\ []F IN F"],
    [
      "the specification's fairness",
      "Fair",
      "Fair == LET RECURSIVE F F == F /\\ WF_x(Next) IN Init /\\ [][Next]_x /\\ F\nProp == <>(x = 1)",
    ],
  ])(
    "reports a stack overflow for a zero-argument recursive LET definition in %s as TLC does",
    async (_title, specification, definitions) => {
      const error = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 3\nSpec == Init /\\ [][Next]_x /\\ WF_x(Next)\n${definitions}\n====`,
        config: `SPECIFICATION ${specification}\nPROPERTY Prop`,
      }).catch((caught: unknown) => caught);
      expect(error instanceof TlaError && [error.message, getErrorExitCode(error)]).toEqual([
        STACK_OVERFLOW_MESSAGE,
        255,
      ]);
    },
  );

  it.each([
    ["[][x' >= x]_vars", 1],
    ['[][x\' >= x \\/ TLCGet("level") < 0]_vars', undefined],
  ])(
    "checks LET H == %s IN H as the action property H under coverage %j, as TLC's SpecProcessor expands the LET",
    async (box, coverage) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLES x, y\nvars == <<x, y>>\nInc == x < 3 /\\ x' = x + 1 /\\ y' = y\nDec == x > 0 /\\ x' = x - 1 /\\ y' = y\nInit == x = 0 /\\ y \\in {0, 1}\nSpec == Init /\\ [][Inc \\/ Dec]_vars\nProp == LET H == ${box} IN H\n====`,
        config: "SPECIFICATION Spec\nPROPERTY Prop\nCHECK_DEADLOCK FALSE",
        coverage,
      });
      expect([
        result.status,
        result.violation?.name,
        result.violation?.trace.length,
        result.generatedStates,
        result.distinctStates,
      ]).toEqual(["liveness-violation", "H", 3, 6, 5]);
    },
  );

  it("takes the next-state relation of Spec == LET N == [][Inc \\/ Dec]_vars IN Init /\\ N under coverage, as TLC's SpecProcessor expands the LET", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLES x, y\nvars == <<x, y>>\nInc == x < 3 /\\ x' = x + 1 /\\ y' = y\nDec == x > 0 /\\ x' = x - 1 /\\ y' = y\nInit == x = 0 /\\ y \\in {0, 1}\nSpec == LET N == [][Inc \\/ Dec]_vars IN Init /\\ N\nInv == x < 3\n====",
      config: "SPECIFICATION Spec\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
      coverage: 1,
    });
    expect([
      result.status,
      result.violation?.trace.length,
      result.generatedStates,
      result.distinctStates,
    ]).toEqual(["invariant-violation", 4, 9, 7]);
  });

  it.each([
    [
      "---- MODULE A ----\nVARIABLE x\nINSTANCE Inner\n====",
      "line 3, col 1 to line 3, col 14 of module A",
    ],
    ["---- MODULE B ----\nEXTENDS Mid\n====", "line 4, col 1 to line 4, col 14 of module Mid"],
    [
      "---- MODULE C ----\nVARIABLE y\n  INSTANCE Mid\n    WITH x <- y\n====",
      "line 3, col 3 to line 4, col 15 of module C",
    ],
    [
      "---- MODULE D ----\nVARIABLE x\nLOCAL INSTANCE Inner\n====",
      "line 3, col 1 to line 3, col 20 of module D",
    ],
  ])(
    "locates the unfair Spec that %j instantiates at the INSTANCE that substitutes into it, as SANY builds the OpDefNode TLC names there",
    async (source, location) => {
      const result = await check({
        source,
        config: "SPECIFICATION Spec\nPROPERTY Live\nCHECK_DEADLOCK FALSE",
        loadModule: (name) =>
          name === "Inner"
            ? "---- MODULE Inner ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x = 0 /\\ x' = 1\nSpec == Init /\\ [][Next]_x\nLive == <>[](x = 0)\n===="
            : name === "Mid"
              ? "---- MODULE Mid ----\nVARIABLE x\n\nINSTANCE Inner\n===="
              : undefined,
      });
      expect(result.violation?.warning?.text).toBe(
        `The stuttering counterexample above may be caused by the absence of a fairness constraint in the behavior specification Spec defined at ${location}. To rule out such counterexamples, conjoin a suitable fairness constraint to Spec (compare Chapter 8, page 87ff of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html).`,
      );
    },
  );
});
