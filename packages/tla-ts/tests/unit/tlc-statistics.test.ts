import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check, formatValue } from "../../src";
import { getUnexpectedException } from "../../src/errors";
import { printCheckProgress, type Timing } from "../../src/cli/tlc-output";
import { simulate } from "../../src/simulate";
import { MESSAGE_LEVEL, type MessagePrinter } from "../../src/tlc/messages";
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

it.each([1, 2, 3])(
  'gives -workers %i as TLCGet("config").worker when one thread checks the spec, as TLC\'s AbstractChecker#createConfig does',
  async (workers) => {
    const printed: string[] = [];
    const result = await check({
      source:
        '---- MODULE W ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0 /\\ PrintT(<<"init", TLCGet("config").worker>>)\nNext == x < 1 /\\ x\' = x + 1 /\\ PrintT(<<"next", TLCGet("config").worker>>)\nPost == PrintT(<<"post", TLCGet("config").worker>>)\n====',
      config: "INIT Init\nNEXT Next\nPOSTCONDITION Post\nCHECK_DEADLOCK FALSE",
      workers,
      onPrint: (text) => printed.push(text),
    });
    expect([result.status, printed]).toEqual([
      "success",
      [`<<"init", ${workers}>>`, `<<"next", ${workers}>>`, `<<"post", ${workers}>>`],
    ]);
  },
);

const REGISTERS_SOURCE =
  '---- MODULE A ----\nEXTENDS Naturals, TLC\nVARIABLE x\nASSUME TLCSet(1, 0) /\\ TLCSet("s:n", 0) /\\ PrintT(TLCGet("all"))\nInit == x = 0\nNext == x < 3 /\\ x\' = x + 1\nCount == TLCSet(1, TLCGet(1) + 1) /\\ TLCSet("s:n", TLCGet("s:n") + 1)\nQ == x = 2\nSet == TLCSet(2, 9)\nPost == PrintT(TLCGet("all")) /\\ PrintT(TLCGet("all:named"))\nMark == x = 1 => TLCSet(3, 7)\nMarked == PrintT(TLCGet("all"))\n====';

it.each([
  [1, ["<<<<0>>>>", "<<<<4>>, <<9>>>>", '("s:n" :> <<4>> @@ "s:_possible" :> <<[Q |-> 1]>>)']],
  [
    2,
    [
      "<<<<0, 0>>>>",
      "<<<<4, 1>>, <<9, 9>>>>",
      '("s:n" :> <<4, 1>> @@ "s:_possible" :> <<[Q |-> 1], [Q |-> 0]>>)',
    ],
  ],
  [
    3,
    [
      "<<<<0, 0, 0>>>>",
      "<<<<4, 1, 1>>, <<9, 9, 9>>>>",
      '("s:n" :> <<4, 1, 1>> @@ "s:_possible" :> <<[Q |-> 1], [Q |-> 0], [Q |-> 0]>>)',
    ],
  ],
])(
  'gives each register a value per worker in TLCGet("all") and TLCGet("all:named") with -workers %i, as TLC does when its first worker takes every state',
  async (workers, expected) => {
    const printed: string[] = [];
    const result = await check({
      source: REGISTERS_SOURCE,
      config:
        "INIT Init\nNEXT Next\nINVARIANT Count\n_POSSIBLE Q\nPOSTCONDITION Set\nPOSTCONDITION Post\nCHECK_DEADLOCK FALSE",
      workers,
      onPrint: (text) => printed.push(text),
    });
    expect([result.status, printed]).toEqual(["success", expected]);
  },
);

// Deviation from TLC: TLC's PrintT throws 'Cannot invoke "tlc2.value.impl.Value.deepCopy()" because "this.elems[i]" is null'.
it('fails on a register that only the first worker set in TLCGet("all") with -workers 2, where TLC puts null in the other worker\'s tuple', async () => {
  const result = await check({
    source: REGISTERS_SOURCE,
    config: "INIT Init\nNEXT Next\nINVARIANT Mark\nPOSTCONDITION Marked\nCHECK_DEADLOCK FALSE",
    workers: 2,
  });
  expect([result.status, result.violation?.message?.split("\n").at(-1)]).toEqual([
    "postcondition-violation",
    "TLCGet(3) was undefined.",
  ]);
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

const getStartupSource = (definitions: string) =>
  `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE y\nInit == y = 0\nNext == y' = (y + 1) % 2\n${definitions}\n====`;

it.each([
  ['G(Op(_)) == Op("level")\nC == PrintT(<<"C", G(TLCGet)>>)', "", ['<<"C", 1>>']],
  ['D == LET K == INSTANCE TLC IN PrintT(<<"D", K!TLCGet("level")>>)', "", ['<<"D", 1>>']],
  ['ASSUME LET K == INSTANCE TLC IN PrintT(<<"A", K!TLCGet("level")>>)', "", ['<<"A", 0>>']],
  ['ASSUME PrintT(<<"A", TLCGet("level")>>)', "", ['<<"A", 0>>']],
  ['G(Op(_, _)) == Op(1, 2)\nC == PrintT(<<"C", G(TLCSet)>>)', "", []],
  ['D == LET K == INSTANCE TLC IN PrintT(<<"D", K!TLCSet(1, 2)>>)', "", []],
  [
    'G(Op(_, _)) == Op(1, 2)\nC == PrintT(<<"C", G(TLCSet)>>)\nInv == C',
    "\nINVARIANT Inv",
    ['<<"C", TRUE>>', '<<"C", TRUE>>'],
  ],
])(
  "evaluates %j as TLC's processConstantDefns does, in TLCState.Empty before the checker exists",
  async (definitions, properties, expected) => {
    const printed: string[] = [];
    const result = await check({
      source: getStartupSource(definitions),
      config: `INIT Init\nNEXT Next${properties}`,
      onPrint: (text) => printed.push(text),
    });
    expect([printed, result.distinctStates]).toEqual([expected, 2]);
  },
);

it("reads TLC.tla's level as 0 in Init, as TLC's TLCGetEval does", async () => {
  const printed: string[] = [];
  await check({
    source: getStartupSource('I == PrintT(<<"I", TLCGet("level")>>) /\\ y = 0'),
    config: "INIT I\nNEXT Next",
    onPrint: (text) => printed.push(text),
  });
  expect(printed).toEqual(['<<"I", 0>>']);
});

const TLCSET_FORMS = [
  [
    "a literal key",
    (key: string, value: string) => `D == PrintT(<<"D", TLCSet(${key}, ${value})>>)`,
  ],
  [
    "a computed key",
    (key: string, value: string) =>
      `D == PrintT(<<"D", TLCSet(CHOOSE k \\in {${key}} : TRUE, ${value})>>)`,
  ],
  [
    "a parameter",
    (key: string, value: string) =>
      `Set(k) == TLCSet(k, ${value})\nD == PrintT(<<"D", Set(${key})>>)`,
  ],
  [
    "a LET definition",
    (key: string, value: string) => `D == LET k == ${key} IN PrintT(<<"D", TLCSet(k, ${value})>>)`,
  ],
  [
    "an instance of TLC",
    (key: string, value: string) =>
      `S == INSTANCE TLC\nD == PrintT(<<"D", S!TLCSet(${key}, ${value})>>)`,
  ],
  [
    "a LET instance of TLC",
    (key: string, value: string) =>
      `D == LET K == INSTANCE TLC IN PrintT(<<"D", K!TLCSet(${key}, ${value})>>)`,
  ],
  [
    "an operator argument",
    (key: string, value: string) =>
      `G(Op(_, _)) == Op(${key}, ${value})\nD == PrintT(<<"D", G(TLCSet)>>)`,
  ],
  [
    "an instance's key",
    (key: string, value: string) =>
      `---- MODULE KM ----\nKey == ${key}\n====\nJ == INSTANCE KM\nD == PrintT(<<"D", TLCSet(J!Key, ${value})>>)`,
  ],
] as const;

it.each(TLCSET_FORMS)(
  "sets a numbered register through %s where the constant definition is used, once its write fails as TLC starts",
  async (_form, getDefinition) => {
    const printed: string[] = [];
    const result = await check({
      source: getStartupSource(`${getDefinition("1", "2")}\nInv == D /\\ TLCGet(1) = 2`),
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      onPrint: (text) => printed.push(text),
    });
    expect([printed, result.status, result.distinctStates]).toEqual([
      ['<<"D", TRUE>>', '<<"D", TRUE>>'],
      "success",
      2,
    ]);
  },
);

it.each(
  TLCSET_FORMS.flatMap((form) =>
    ['"exit"', '"pause"'].map((key) => [key, form[0], form[1]] as const),
  ),
)(
  "evaluates a constant definition that sets %s to FALSE through %s only as TLC starts, since TLC drops no write there",
  async (key, _form, getDefinition) => {
    const printed: string[] = [];
    const result = await check({
      source: getStartupSource(`${getDefinition(key, "FALSE")}\nInv == D`),
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      onPrint: (text) => printed.push(text),
      onPause: () => printed.push("paused"),
    });
    expect([printed, result.status, result.distinctStates]).toEqual([
      ['<<"D", TRUE>>'],
      "success",
      2,
    ]);
  },
);

const getSplitSource = (next: string, invariant: string) =>
  `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nA(p) == x < 3 /\\ x' = x + 1 /\\ PrintT(<<"A", p>>)\nNext == ${next}\nInv == ${invariant}\n====`;

it.each([
  ["\\E p \\in {TLCSet(2, 5)} : x < 2 /\\ x' = x + 1", "x = 0 \\/ TLCGet(2) = 5", [], 3],
  ["A(TLCSet(1, 5))", "TRUE", ['<<"A", TRUE>>', '<<"A", TRUE>>', '<<"A", TRUE>>'], 4],
])(
  "evaluates Next == %s at each state once the split's write to a numbered register fails, as TLC does",
  async (next, invariant, expected, distinctStates) => {
    const printed: string[] = [];
    const result = await check({
      source: getSplitSource(next, invariant),
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
      onPrint: (text) => printed.push(text),
    });
    expect([printed, result.status, result.distinctStates]).toEqual([
      expected,
      "success",
      distinctStates,
    ]);
  },
);

const getPropertySource = (property: string) =>
  `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 3\nSpec == Init /\\ [][Next]_x /\\ WF_x(Next)\n${property}\n====`;

// Deviation from TLC: TLCGetSet#TLCSet drops a named register's write and the exit before any checker exists, so TLC finds the register undefined or never stops.
describe("TLCSet writes that TLC drops before any checker exists", () => {
  it.each(TLCSET_FORMS)(
    "sets a named register through %s where the constant definition is used, as for a numbered register",
    async (_form, getDefinition) => {
      const printed: string[] = [];
      const result = await check({
        source: getStartupSource(`${getDefinition('"s:x"', "2")}\nInv == D /\\ TLCGet("s:x") = 2`),
        config: "INIT Init\nNEXT Next\nINVARIANT Inv",
        onPrint: (text) => printed.push(text),
      });
      expect([printed, result.status, result.distinctStates]).toEqual([
        ['<<"D", TRUE>>', '<<"D", TRUE>>'],
        "success",
        2,
      ]);
    },
  );

  it.each(TLCSET_FORMS)(
    "stops checking through %s where the constant definition is used",
    async (_form, getDefinition) => {
      const printed: string[] = [];
      const result = await check({
        source: getStartupSource(`${getDefinition('"exit"', "TRUE")}\nInv == D`),
        config: "INIT Init\nNEXT Next\nINVARIANT Inv",
        onPrint: (text) => printed.push(text),
      });
      expect([printed, result.status, result.distinctStates]).toEqual([
        ['<<"D", TRUE>>'],
        "success",
        1,
      ]);
    },
  );

  it("sets a named register at each state where Next's split would write it, as for a numbered register", async () => {
    const result = await check({
      source: getSplitSource(
        '\\E p \\in {TLCSet("s:q", 5)} : x < 2 /\\ x\' = x + 1',
        'x = 0 \\/ TLCGet("s:q") = 5',
      ),
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
    });
    expect([result.status, result.distinctStates]).toEqual(["success", 3]);
  });

  it("stops checking where Next's split would set the exit", async () => {
    const printed: string[] = [];
    const result = await check({
      source: getSplitSource('A(TLCSet("exit", TRUE))', "TRUE"),
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
      onPrint: (text) => printed.push(text),
    });
    expect([printed, result.status, result.distinctStates]).toEqual([
      ['<<"A", TRUE>>'],
      "success",
      2,
    ]);
  });

  it("fails where the liveness tableau would set the exit", async () => {
    const result = check({
      source: getPropertySource('Prop == <>(~(x < 10 \\/ TLCSet("exit", TRUE)))'),
      config: "SPECIFICATION Spec\nPROPERTY Prop",
    });
    await expect(result).rejects.toThrow(
      `${getUnexpectedException("tlc2.tool.EvalException")}TLCSet can't set "exit" before model checking starts.`,
    );
  });

  it('labels Next == A(TLCSet("exit", TRUE)) by its call, as for a numbered register', async () => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals, TLC, TLCExt\nVARIABLE x\nASSUME TLCSet(1, 7)\nInit == x = 0\nA(p) == x < 1 /\\ x' = x + 1 /\\ PrintT(<<"A", p>>)\nNext == A(TLCSet("exit", TRUE))\nInv == x < 1\n====`,
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      onPrint: () => {},
    });
    expect(result.violation?.trace.map((step) => step.label)).toEqual([
      undefined,
      "A line 7, col 9 to line 7, col 31 of module M",
    ]);
  });
});

// Deviation from TLC: TLCGetSet#TLCSet throws a NullPointerException on a numbered register before any checker exists.
it("fails where the liveness tableau would set a numbered register", async () => {
  const result = check({
    source: getPropertySource("Prop == <>(~(x < 10 \\/ TLCSet(1, 2)))"),
    config: "SPECIFICATION Spec\nPROPERTY Prop",
  });
  await expect(result).rejects.toThrow(
    `${getUnexpectedException("tlc2.tool.EvalException")}TLCSet can't set 1 before model checking starts.`,
  );
});

it("checks a property operator at each state once the tableau fails to set the exit in its body, as TLC does", async () => {
  const result = await check({
    source: getPropertySource('P == x < 10 \\/ TLCSet("exit", TRUE)\nProp == <>(~P)'),
    config: "SPECIFICATION Spec\nPROPERTY Prop",
  });
  expect([result.status, result.distinctStates]).toEqual(["liveness-violation", 3]);
});

it.each([
  ['A(TLCGet("level"))', "A(1) line 6, col 9 to line 6, col 49 of module M"],
  [
    'LET D(q) == TLCGet("level") + q IN A(D(1))',
    "A(2) line 6, col 9 to line 6, col 49 of module M",
  ],
  ['\\E q \\in {2} : A(q + TLCGet("level"))', "A(3) line 6, col 9 to line 6, col 49 of module M"],
  ["A(TLCGet(1))", "A line 7, col 9 to line 7, col 20 of module M"],
  ["A(TLCSet(1, 5))", "A line 7, col 9 to line 7, col 23 of module M"],
  ['A(TLCSet("exit", FALSE))', "A(TRUE) line 6, col 9 to line 6, col 49 of module M"],
  ['A(TLCSet("pause", FALSE))', "A(TRUE) line 6, col 9 to line 6, col 49 of module M"],
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

it('reads TLCGet("generated") from 0 again as it replays the initial predicate for an error, as TLC\'s ModelChecker does', async () => {
  const result = await check({
    source:
      '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = TLCGet("generated")\nNext == x\' = x + 1\nInv == x = 0 => TLCGet(5) = 0\n====',
    config: "INIT Init\nNEXT Next\nINVARIANT Inv",
  });
  expect([result.failure?.exitCode, result.generatedStates, result.distinctStates]).toEqual([
    75, 1, 1,
  ]);
});

it('reads TLCGet("level") as 1 in the invariant of an initial state it replays for an error, as TLC does', async () => {
  const result = await check({
    source:
      '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x\' = x + 1\nInv == TLCGet("level") = 1 /\\ TLCGet(3) = 0\n====',
    config: "INIT Init\nNEXT Next\nINVARIANT Inv",
  });
  expect([result.failure?.exitCode, result.generatedStates, result.distinctStates]).toEqual([
    75, 1, 1,
  ]);
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
      if (output.kind === "message" && output.level === MESSAGE_LEVEL.error)
        messages.push(output.message);
    },
  });
  expect(messages[0]).toBe(
    'Evaluating invariant Inv failed.\nAttempted to select nonexistent field "diameter" from the record\n[ traces |-> 1,\n  duration |-> 0,\n  generated |-> 6,\n  behavior |-> [actions |-> [Gamma |-> 2, Alpha |-> 2, Beta |-> 1], id |-> 1],\n  worker |-> 0,\n  distinct |-> -1,\n  distinctvalues |-> -1,\n  retries |-> -1,\n  actions |-> [],\n  levelmean |-> 0,\n  levelvariance |-> 0 ]\nline 10, col 18 to line 10, col 41 of module M',
  );
});

it("rates each periodic report by the states since the last one, as TLC does", () => {
  const printed: string[] = [];
  const printer: MessagePrinter = {
    isTool: false,
    isDiffTrace: false,
    version: "master",
    print: (_code, _level, text) => printed.push(text.replace(/ at [^:]+:\d\d:\d\d:/, " at _:")),
    printOutput: () => {},
  };
  const timing: Timing = {
    startTime: Date.now(),
    isParsed: true,
    livenessStartTime: undefined,
    lastProgress: undefined,
  };
  [8133, 179_596, 382_442].forEach((count) =>
    printCheckProgress(
      printer,
      {
        kind: "progress",
        statistics: {
          generatedStates: count,
          distinctStates: count,
          queuedStates: 0,
          depth: count,
        },
      },
      timing,
      ".",
    ),
  );
  expect(printed).toEqual([
    "Progress(8133) at _: 8,133 states generated (8,133 s/min), 8,133 distinct states found (8,133 ds/min), 0 states left on queue.",
    "Progress(179596) at _: 179,596 states generated (171,463 s/min), 179,596 distinct states found (171,463 ds/min), 0 states left on queue.",
    "Progress(382442) at _: 382,442 states generated (202,846 s/min), 382,442 distinct states found (202,846 ds/min), 0 states left on queue.",
  ]);
});
