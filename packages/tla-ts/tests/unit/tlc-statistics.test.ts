import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vite-plus/test";
import { check, formatValue } from "../../src";
import { simulate } from "../../src/simulate";
import { checkFixture } from "./check-harness";

const DIRECTORY = join(import.meta.dirname, "../fixtures/tlc-statistics");

it("counts states for TLCGet while it generates them, as TLC does", async () => {
  const printed: string[] = [];
  const result = await checkFixture("tlc-statistics", "Statistics", "Statistics", {
    onPrint: (text) => printed.push(text),
  });
  expect(result.status).toBe("success");
  expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([15, 5, 3]);
  expect(printed).toEqual(
    readFileSync(join(DIRECTORY, "Statistics.out"), "utf8").trim().split("\n"),
  );
});

it("stops generating successors at the first violation", async () => {
  const printed: string[] = [];
  const result = await check({
    source:
      "---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x' \\in {1, 2, 3} /\\ PrintT(<<x', TLCGet(\"generated\")>>)\nInv == x # 2\n====",
    config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    onPrint: (text) => printed.push(text),
  });
  expect(result.status).toBe("invariant-violation");
  expect(printed).toEqual(["<<1, 1>>", "<<2, 2>>"]);
  expect([result.generatedStates, result.distinctStates]).toEqual([3, 3]);
});

// Deviation from TLC: TLC finds no step for the trace once the statistics forbid it, and prints "Failed to recover the initial state from its fingerprint." with a TLC bug(4), or a bug(2) before the trace.
it.each([
  ["3", "2", [0, 1, 2]],
  ["4", "3", [0, 1, 2, 3]],
])(
  'prints the trace of an action that reads TLCGet("stats") with the action\'s name once the statistics forbid the step (distinct < %s)',
  async (bound, limit, expected) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x < ${bound} /\\ TLCGet("stats").distinct < ${bound} /\\ x' = x + 1\nInv == x < ${limit}\n====`,
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    });
    expect(result.violation?.trace.map((step) => [step.state.x, step.action, step.label])).toEqual(
      expected.map((value) => [value, value === 0 ? undefined : "Next", undefined]),
    );
  },
);

it('prints the trace of a sub-action of \\E that reads TLCGet("stats") with the sub-action\'s name once the statistics forbid the step', async () => {
  const result = await check({
    source:
      '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nA(i) == x < 3 /\\ TLCGet("stats").distinct < 3 /\\ x\' = x + i\nNext == \\E i \\in {1} : A(i)\nInv == x < 2\n====',
    config: "INIT Init\nNEXT Next\nINVARIANT Inv",
  });
  expect(result.violation?.trace.map((step) => [step.state.x, step.action, step.label])).toEqual([
    [0, undefined, undefined],
    [1, "A", undefined],
    [2, "A", undefined],
  ]);
});

it.each([
  ['{TLCGet("level")}', ['<<"A", 1>>'], "A(1) line 6, col 9 to line 6, col 49 of module M"],
  [
    '{TLCGet("stats").distinct}',
    ['<<"A", 1>>'],
    "Next line 7, col 9 to line 7, col 50 of module M",
  ],
  ['{TLCGet("all")}', ['<<"A", <<<<7>>>>>>'], "Next line 7, col 9 to line 7, col 39 of module M"],
  ["{TLCSet(2, 5)}", ['<<"A", TRUE>>'], "Next line 7, col 9 to line 7, col 38 of module M"],
])(
  "splits Next over %s as TLC's Tool does before the checker exists, at level 1 and without statistics or registers",
  async (domain, expectedPrinted, label) => {
    const printed: string[] = [];
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nASSUME TLCSet(1, 7)\nInit == x = 0\nA(p) == x < 1 /\\ x' = x + 1 /\\ PrintT(<<"A", p>>)\nNext == \\E p \\in ${domain} : A(p)\nInv == x < 1\n====`,
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      onPrint: (text) => printed.push(text),
    });
    expect([printed, result.violation?.trace.map((step) => step.label)]).toEqual([
      expectedPrinted,
      [undefined, label],
    ]);
  },
);

it.each([
  ["2", "TLCGet(2) was undefined."],
  ['"s:q"', "TLCGet(s:q) was undefined."],
])(
  "keeps no register %s that TLCSet writes as TLC's Tool splits Next before the checker exists",
  async (key, message) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0 /\\ TLCGet(${key}) = 5\nNext == \\E p \\in {TLCSet(${key}, 5)} : x' = x\n====`,
      config: "INIT Init\nNEXT Next",
    });
    expect(result.failure?.message).toBe(
      `Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.Value tlc2.module.TLCGetSet.TLCGetEval(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),\nbut it produced the following error:\n${message}`,
    );
  },
);

it.each([
  ['A(TLCGet("level"))', "A(1) line 6, col 9 to line 6, col 49 of module M"],
  [
    'LET D(q) == TLCGet("level") + q IN A(D(1))',
    "A(2) line 6, col 9 to line 6, col 49 of module M",
  ],
  ['\\E q \\in {2} : A(q + TLCGet("level"))', "A(3) line 6, col 9 to line 6, col 49 of module M"],
  ['A(TLCSet("exit", TRUE))', "A(TRUE) line 6, col 9 to line 6, col 49 of module M"],
  ["A(TLCGet(1))", "A line 7, col 9 to line 7, col 20 of module M"],
  ["A(TLCSet(1, 5))", "A line 7, col 9 to line 7, col 23 of module M"],
  ["A(Trace)", "A line 7, col 9 to line 7, col 16 of module M"],
  ["LET D == FALSE /\\ x = 0 IN A(D)", "A line 7, col 36 to line 7, col 39 of module M"],
  ["A(x)", "A line 7, col 9 to line 7, col 12 of module M"],
])(
  "splits Next == %s by the level SANY gives the arguments, as TLC's Tool does before the checker exists",
  async (next, label) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals, TLC, TLCExt\nVARIABLE x\nASSUME TLCSet(1, 7)\nInit == x = 0\nA(p) == x < 1 /\\ x' = x + 1 /\\ PrintT(<<"A", p>>)\nNext == ${next}\nInv == x < 1\n====`,
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      onPrint: () => {},
    });
    expect(result.violation?.trace.map((step) => step.label)).toEqual([undefined, label]);
  },
);

it.each([
  ["Def", "CONSTANT C = 0\nCONSTANT Def <- Alt", "A line 10, col 9 to line 10, col 14 of module M"],
  ["C", "CONSTANT C <- Lit", "A(1) line 9, col 9 to line 9, col 49 of module M"],
])(
  "splits Next == A(%s) by the level SANY gives the declaration the model replaces, as TLC's Tool does",
  async (arg, constants, label) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nCONSTANT C\nVARIABLE x\nInit == x = 0\nDef == x\nAlt == 1\nLit == IF FALSE THEN x ELSE 1\nA(p) == x < 1 /\\ x' = x + 1 /\\ PrintT(<<"A", p>>)\nNext == A(${arg})\nInv == x < 1\n====`,
      config: `${constants}\nINIT Init\nNEXT Next\nINVARIANT Inv`,
      onPrint: () => {},
    });
    expect(result.violation?.trace.map((step) => step.label)).toEqual([undefined, label]);
  },
);

it('reads TLCGet("level") as 0 in the initial predicate as it rebuilds an initial state for a trace, as TLC does', async () => {
  const printed: string[] = [];
  const result = await check({
    source:
      '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x \\in {0, 1} /\\ PrintT(<<"init", x, TLCGet("level")>>)\nNext == x\' = x + 1\nInv == x < 3\n====',
    config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    onPrint: (text) => printed.push(text),
  });
  const initial = ['<<"init", 0, 0>>', '<<"init", 1, 0>>'];
  expect([
    printed,
    result.violation?.trace.map((step) => step.output ?? []),
    result.violation?.traceOutput,
  ]).toEqual([initial, [initial, [], []], initial]);
});

it('reads TLCGet("level") as 1 in the VIEW of an initial state it rebuilds for a trace, as TLC does', async () => {
  const result = await check({
    source:
      '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x \\in {0, 1}\nNext == x\' = x + 1\nInv == x < 3\nView == <<x, TLCGet("level")>>\n====',
    config: "INIT Init\nNEXT Next\nINVARIANT Inv\nVIEW View",
  });
  expect(result.violation?.trace.map((step) => step.state.x)).toEqual([1, 2, 3]);
});

it.each([
  [
    "the postcondition",
    'Inv == PrintT(<<"inv", x, TLCGet("diameter")>>)',
    "",
    [
      '<<"inv", 0, 0>>',
      '<<"inv", 1, 1>>',
      '<<"inv", 2, 1>>',
      '<<"inv", 3, 1>>',
      '<<"inv", 1, 2>>',
      '<<"inv", 2, 2>>',
      '<<"inv", 3, 2>>',
      '<<"post", 0>>',
    ],
    [],
  ],
  [
    "the alias of a printed behavior",
    "Inv == x < 2",
    "\nALIAS Alias",
    ['<<"post", 0>>'],
    [
      ["0", "0"],
      ["1", "0"],
      ["2", "0"],
    ],
  ],
])(
  'reads TLCGet("diameter") as 0 in %s, which TLC\'s Simulator evaluates on its own thread',
  (_label, invariant, alias, expectedPrinted, expectedStates) => {
    const printed: string[] = [];
    const states: string[][] = [];
    simulate({
      source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = x + 1\n${invariant}\nPost == PrintT(<<"post", TLCGet("diameter")>>)\nAlias == [x |-> x, d |-> TLCGet("diameter")]\n====`,
      config: `INIT Init\nNEXT Next\nINVARIANT Inv\nPOSTCONDITION Post${alias}`,
      seed: 4n,
      traceDepth: 3,
      traceCount: 2n,
      aril: 0n,
      isGenerating: false,
      scheduler: "random",
      onPrint: (text) => printed.push(text),
      onSimulation: (output) => {
        if (output.kind !== "behavior") return;
        output.trace.forEach((step) =>
          states.push([formatValue(step.state.x), formatValue(step.state.d)]),
        );
      },
    });
    expect([printed, states]).toEqual([expectedPrinted, expectedStates]);
  },
);

it("prints the statistics of a simulation in the order TLC writes them", () => {
  const messages: string[] = [];
  simulate({
    source:
      "---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nAlpha == x' = x + 1\nBeta == x' = x + 2\nZed == x' = x + 3\nGamma == x' = x + 4\nNext == Alpha \\/ Beta \\/ Zed \\/ Gamma\nInv == x < 12 \\/ TLCGet(\"stats\").diameter = 0\n====",
    config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    seed: 4n,
    traceDepth: 20,
    traceCount: 1n,
    aril: 0n,
    isGenerating: false,
    scheduler: "random",
    onSimulation: (output) => {
      if (output.kind === "message" && output.isError) messages.push(output.message);
    },
  });
  expect(messages[0]).toBe(
    'Evaluating invariant Inv failed.\nAttempted to select nonexistent field "diameter" from the record\n[ traces |-> 1,\n  duration |-> 0,\n  generated |-> 6,\n  behavior |-> [actions |-> [Gamma |-> 2, Alpha |-> 2, Beta |-> 1], id |-> 1],\n  worker |-> 0,\n  distinct |-> -1,\n  distinctvalues |-> -1,\n  retries |-> -1,\n  actions |-> [],\n  levelmean |-> 0,\n  levelvariance |-> 0 ]\nline 10, col 18 to line 10, col 41 of module M',
  );
});
