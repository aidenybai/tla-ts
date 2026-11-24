import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import {
  check,
  type CheckOptions,
  type CheckProgress,
  formatValue,
  parseModule,
  TlaConfigError,
  TlaEvaluationError,
  TlaSyntaxError,
} from "../../src";
import type { CheckResult, OutputLine } from "../../src/check";
import { UNEXPECTED_EVAL_EXCEPTION, UNEXPECTED_EXCEPTION } from "../../src/errors";
import type { TlcVersion } from "../../src/tlc/version";
import { formatState } from "../../src/values";
import {
  checkFixture,
  checkModule,
  checkSteps,
  FIXTURES,
  formatCallStackLines,
} from "./check-harness";

const DIST = join(import.meta.dirname, "../../dist/index.js");

const createFileReader = (files: Map<string, string>) => (path: string) => {
  const text = files.get(path);
  return text === undefined ? undefined : new TextEncoder().encode(text);
};

const createFileWriter =
  (files: Map<string, string>) => (path: string, content: string | Uint8Array) =>
    files.set(path, typeof content === "string" ? content : new TextDecoder().decode(content));

const getCoverageCounts = async (definitions: string, config: string) => {
  const result = await check({
    source: `---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\n${definitions}\n====`,
    config,
    coverage: 1,
  });
  return result.coverage?.relations.map((relation) => {
    const counts = relation.expressions.map((expression) => expression.count).join(" ");
    return relation.kind === "invariant" || relation.kind === "implied"
      ? counts
      : `${relation.distinct}:${relation.generated} ${counts}`;
  });
};

const INSTANCED_MODULE =
  "---- MODULE Inner ----\nEXTENDS Naturals\nCONSTANT K\nVARIABLES x, w\nR == x + K > 0\nQ == \\A e \\in {1, 2} : R /\\ x + e + K >= K\nG == IF x > 0 THEN K ELSE 0\nA == /\\ Q\n     /\\ x' = (x + K) % 3\n     /\\ w' = w\nB == x < 2 /\\ x' = x + 1 /\\ UNCHANGED w\n====";

const getInstanceCoverage = (instance: string, next: string, invariant: string) =>
  check({
    source: `---- MODULE E ----\nEXTENDS Naturals\nCONSTANT M\nVARIABLES x, y\n${instance}\nInit == x = 0 /\\ y = 0\nNext == ${next}\nInv == ${invariant}\n====`,
    config: "CONSTANT M = 1\nINIT Init\nNEXT Next\nINVARIANT Inv",
    coverage: 1,
    loadModule: (name) => (name === "Inner" ? INSTANCED_MODULE : undefined),
  });

const formatCoverage = (result: Awaited<ReturnType<typeof check>>) =>
  result.coverage?.relations.map((relation) =>
    relation.expressions.map(
      (expression) =>
        `${"|".repeat(expression.depth)}${expression.location}: ${expression.count}${expression.cost > 0 ? `:${expression.cost}` : ""}`,
    ),
  );

const getCoverageLines = async (source: string, config: string) =>
  formatCoverage(await check({ source, config, coverage: 1 }));

const getNextCoverageLines = async (next: string) =>
  (
    await getCoverageLines(
      `---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nVARIABLE x\nInit == x = 0\nNext == ${next}\nInv == TRUE\n====`,
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    )
  )?.at(-1);

describe("check matches TLC", () => {
  it("evaluates every assumption in the semantics fixture", async () => {
    const result = await checkFixture("semantics", "Semantics");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([2, 1, 1]);
  });

  it.each([
    ["two theorems", "THEOREM Thm == x = 0\nTHEOREM Thm == x = 1"],
    ["an assumption and a theorem", "ASSUME Thm == TRUE\nTHEOREM Thm == x = 1"],
  ])("evaluates the first of %s with the same name as SANY binds it", async (_title, facts) => {
    const result = await checkModule(`${facts}\nInv == Thm`, "INVARIANT Inv");
    expect(result.status).toBe("success");
  });

  it.each([
    ["extends", "EXTENDS Facts\nVARIABLE x", "THEOREM T == x = 1", "success"],
    ["instantiates before it", "VARIABLE x\nINSTANCE Facts", "THEOREM T == x = 1", "success"],
    [
      "instantiates after it",
      "VARIABLE x",
      "THEOREM T == x = 1\nINSTANCE Facts",
      "invariant-violation",
    ],
  ])(
    "binds a fact named as one of a module it %s to the first as SANY does",
    async (_title, header, facts, status) => {
      const result = await check({
        source: `---- MODULE M ----\n${header}\nInit == x = 0\nNext == x' = x\n${facts}\nInv == T\n====`,
        config: "INIT Init\nNEXT Next\nINVARIANT Inv",
        loadModule: (name) =>
          name === "Facts" ? "---- MODULE Facts ----\nTHEOREM T == TRUE\n====" : undefined,
      });
      expect(result.status).toBe(status);
    },
  );

  it.each([
    ["1.7.4", ["1", "3", "0", "1", "2"], 11],
    ["master", ["0", "1", "2", "3"], 9],
  ] as const)(
    "enumerates the bound of a quantifier over a lazy union as TLC %s does",
    async (version, printed, generatedStates) => {
      const prints: string[] = [];
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == (\\E <<a, b>> \\in {1, 3} \\X UNION {0..2, {1, 3}} : TRUE) /\\ x' = x\nASSUME \\A a \\in UNION {{3, 1}, 0..2} : PrintT(a)\nASSUME PrintT(CHOOSE a \\in UNION {{3}, 0..2} : TRUE)\n====`,
        config: "INIT Init\nNEXT Next",
        version,
        onPrint: (text) => prints.push(text),
      });
      expect(prints).toEqual([...printed, "0"]);
      expect(result.generatedStates).toBe(generatedStates);
    },
  );

  it.each([
    ["1.7.4", "[Nat -> {}]", "assumption-violation"],
    ["1.7.4", "[{} -> Nat]", "assumption-violation"],
    ["1.7.4", "[a : {}, b : Nat]", "success"],
    ["master", "[Nat -> {}]", "success"],
    ["master", "[{} -> Nat]", "success"],
  ] as const)("enumerates the sets of %s %s in turn as TLC does", async (version, set, status) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nASSUME \\A y \\in ${set} : TRUE\n====`,
      config: "",
      version,
    });
    expect(result.status).toBe(status);
  });

  it("streams the sets that a set of tuples, records, or functions combines as TLC does", async () => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' \\in [b : UNION {{3, 1}, 0..1}, a : UNION {{2}, 1..2}]\n====`,
      config: "INIT Init\nNEXT Next",
    });
    expect(result.generatedStates).toBe(85);
  });

  it.each([
    [
      "a member of SUBSET S",
      "({t \\in (0..2) \\X {1} : PrintT(t)} \\in SUBSET ((1..2) \\X {1})) \\in BOOLEAN",
      ["<<0, 1>>"],
    ],
    [
      "membership in UNION S",
      "<<1, 1>> \\in UNION {s \\in SUBSET ((0..2) \\X {1}) : PrintT(s)}",
      ["{}", "{<<0, 1>>}", "{<<1, 1>>}"],
    ],
    [
      "SUBSET A \\subseteq SUBSET B",
      "(SUBSET {t \\in (0..2) \\X {1} : PrintT(t)} \\subseteq SUBSET ((1..2) \\X {1})) \\in BOOLEAN",
      ["<<0, 1>>"],
    ],
  ])(
    "streams the set that decides %s only up to the deciding element, as TLC's member does",
    async (_membership, membership, expected) => {
      const prints: string[] = [];
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = 0 /\\ ${membership}\n====`,
        config: "INIT Init\nNEXT Next",
        onPrint: (text) => prints.push(text),
      });
      expect(prints).toEqual(expected);
      expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
        "success",
        2,
        1,
      ]);
    },
  );

  it.each([
    ["![k] = v, applied at k", "0", "[f EXCEPT ![<<1, 1>>] = 5][<<1, 1>>] = 5", ["<<1, 1>>"]],
    [
      "![k] = v twice, applied at k",
      "0",
      "[[f EXCEPT ![<<1, 1>>] = 5] EXCEPT ![<<1, 1>>] = @ + 1][<<1, 1>>] = 6",
      ["<<1, 1>>"],
    ],
    [
      "![k] = v and ![j] = w, applied at k",
      "0",
      "[[f EXCEPT ![<<1, 1>>] = 5] EXCEPT ![<<2, 1>>] = 6][<<1, 1>>] = 5",
      ["<<1, 1>>", "<<2, 1>>"],
    ],
    [
      "![k].c = v and then ![k] = w, applied at k",
      "[c |-> 0]",
      "[[f EXCEPT ![<<1, 1>>].c = 5] EXCEPT ![<<1, 1>>] = [c |-> 6]][<<1, 1>>].c = 6",
      ["<<1, 1>>", "<<1, 1>>"],
    ],
    [
      "![k] = v and then ![k].c = w, applied at k",
      "[c |-> 0]",
      "[[f EXCEPT ![<<1, 1>>] = [c |-> 1]] EXCEPT ![<<1, 1>>].c = 5][<<1, 1>>].c = 5",
      ["<<1, 1>>"],
    ],
  ])(
    "checks a lazy function's domain only where TLC does after EXCEPT %s",
    async (_except, body, application, expected) => {
      const prints: string[] = [];
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = 0 /\\ LET f == [t \\in {u \\in (0..2) \\X {1} : PrintT(u)} |-> ${body}] IN ${application}\n====`,
        config: "INIT Init\nNEXT Next",
        onPrint: (text) => prints.push(text),
      });
      expect(prints).toEqual(expected);
      expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
        "success",
        2,
        1,
      ]);
    },
  );

  const records =
    'f == [t \\in {u \\in (0..2) \\X {1} : TRUE} |-> [c |-> IF PrintT(<<"b", t>>) THEN 0 ELSE 1, d |-> 0]]';
  const functions =
    'g == [t \\in {u \\in 0..2 : TRUE} |-> [v \\in {w \\in 0..3 : PrintT(<<"n", t, w>>)} |-> IF PrintT(<<"b", t, v>>) THEN [e |-> 0] ELSE [e |-> 1]]]';
  const domain = ['<<"n", 1, 0>>', '<<"n", 1, 1>>', '<<"n", 1, 2>>', '<<"n", 1, 3>>'];
  it.each([
    [
      "![k].c = v, applied at k",
      records,
      "[f EXCEPT ![<<1, 1>>].c = 5][<<1, 1>>].c = 5",
      ['<<"b", <<1, 1>>>>', '<<"b", <<1, 1>>>>'],
    ],
    [
      "![k].c = v and then ![k].d = w, applied at k",
      records,
      "[[f EXCEPT ![<<1, 1>>].c = 5] EXCEPT ![<<1, 1>>].d = 6][<<1, 1>>].c = 5",
      ['<<"b", <<1, 1>>>>', '<<"b", <<1, 1>>>>', '<<"b", <<1, 1>>>>'],
    ],
    [
      "![k].c = v and then ![k] = w, applied at k",
      records,
      "[[f EXCEPT ![<<1, 1>>].c = 5] EXCEPT ![<<1, 1>>] = [c |-> 6, d |-> 0]][<<1, 1>>].c = 6",
      ['<<"b", <<1, 1>>>>', '<<"b", <<1, 1>>>>'],
    ],
    [
      "![k] = v and then ![k].c = w, applied at k",
      records,
      "[[f EXCEPT ![<<1, 1>>] = [c |-> 1, d |-> 1]] EXCEPT ![<<1, 1>>].c = 5][<<1, 1>>].c = 5",
      ['<<"b", <<1, 1>>>>'],
    ],
    [
      "![k][j].e = v on lazy functions of lazy functions, applied at k and j",
      functions,
      "[g EXCEPT ![1][2].e = 5][1][2].e = 5",
      [...domain, '<<"b", 1, 2>>', ...domain, '<<"b", 1, 2>>'],
    ],
    [
      "![k][j].e = v on lazy functions of lazy functions, applied at k and printed",
      functions,
      "PrintT([g EXCEPT ![1][2].e = 5][1])",
      [
        ...domain,
        '<<"b", 1, 2>>',
        ...domain,
        '<<"b", 1, 0>>',
        '<<"b", 1, 1>>',
        '<<"b", 1, 2>>',
        '<<"b", 1, 3>>',
        "(0 :> [e |-> 0] @@ 1 :> [e |-> 0] @@ 2 :> [e |-> 5] @@ 3 :> [e |-> 0])",
      ],
    ],
  ])(
    "evaluates a lazy function's body again where TLC does after EXCEPT %s",
    async (_except, definition, application, expected) => {
      const prints: string[] = [];
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = 0 /\\ LET ${definition} IN ${application}\n====`,
        config: "INIT Init\nNEXT Next",
        onPrint: (text) => prints.push(text),
      });
      expect(prints).toEqual(expected);
      expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
        "success",
        2,
        1,
      ]);
    },
  );

  it("selects the path of an EXCEPT through a lazy function without converting a lazy new value, as TLC's Value#select does", async () => {
    const prints: string[] = [];
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE y\nInit == y = [c |-> 0]\nNext == /\\ LET f == [t \\in {u \\in 1..2 : TRUE} |-> y] h == [i \\in {u \\in 1..2 : TRUE} |-> PrintT(i)] IN DOMAIN [f EXCEPT ![1].c = h][2] = {"c"}\n        /\\ y' = y\n====`,
      config: "INIT Init\nNEXT Next",
      onPrint: (text) => prints.push(text),
    });
    expect(prints).toEqual([]);
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "success",
      2,
      1,
    ]);
  });

  const printingLazy = 'h == [i \\in (1..2) \\X {1} |-> PrintT(<<"h", i>>)]';
  it.each([
    [
      "a lazy function in a record",
      "[c |-> 0]",
      `LET ${printingLazy} IN DOMAIN [x EXCEPT !.c = h]["c"] = (1..2) \\X {1} /\\ x' = x`,
      [],
      [2, 1],
    ],
    [
      "a lazy function in a new tuple",
      "[c |-> 0]",
      `LET ${printingLazy} IN DOMAIN [x EXCEPT !.c = <<h>>]["c"][1] = (1..2) \\X {1} /\\ x' = x`,
      [],
      [2, 1],
    ],
    [
      "a lazy function in the sequence @ appends to",
      "[c |-> <<0>>]",
      `LET ${printingLazy} IN DOMAIN [x EXCEPT !.c = Append(@, h)]["c"] = 1..2 /\\ x' = x`,
      [],
      [2, 1],
    ],
    [
      "a lazy function in a function",
      "[k \\in 1..2 |-> 0]",
      `LET ${printingLazy} IN DOMAIN [x EXCEPT ![1] = h][1] = (1..2) \\X {1} /\\ x' = x`,
      [],
      [2, 1],
    ],
    [
      "a lazy filter in a record",
      "[c |-> 0]",
      `LET s == {u \\in (1..2) \\X {1} : PrintT(<<"s", u>>)} IN DOMAIN [x EXCEPT !.c = s] = {"c"} /\\ x' = x`,
      [],
      [2, 1],
    ],
    [
      "a lazy function whose body fails",
      "[c |-> 0]",
      `LET h == [i \\in (1..2) \\X {1} |-> 1 \\div 0] IN DOMAIN [x EXCEPT !.c = h] = {"c"} /\\ x' = x`,
      [],
      [2, 1],
    ],
    [
      "a lazy function applied at one key",
      "[c |-> 0]",
      `LET ${printingLazy} IN [x EXCEPT !.c = h].c[<<1, 1>>] /\\ x' = x`,
      ['<<"h", <<1, 1>>>>'],
      [2, 1],
    ],
    [
      "a lazy function in the next state",
      "[c |-> 0]",
      `LET ${printingLazy} IN x' = [x EXCEPT !.c = h] /\\ PrintT("after")`,
      [
        '"after"',
        '<<"h", <<1, 1>>>>',
        '<<"h", <<2, 1>>>>',
        '"after"',
        '<<"h", <<1, 1>>>>',
        '<<"h", <<2, 1>>>>',
      ],
      [3, 2],
    ],
  ])(
    "evaluates nothing of %s that EXCEPT stores in a fingerprinted value before TLC would",
    async (_value, init, next, expected, states) => {
      const prints: string[] = [];
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers, Sequences, TLC\nVARIABLE x\nInit == x = ${init}\nNext == ${next}\n====`,
        config: "INIT Init\nNEXT Next",
        onPrint: (text) => prints.push(text),
      });
      expect(prints).toEqual(expected);
      expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
        "success",
        ...states,
      ]);
    },
  );

  it.each([
    [
      "a record at a non-string key",
      "[[a |-> 1] EXCEPT ![1][1 \\div 0] = 2] = 0",
      [],
      "The second argument of \\div is 0.",
    ],
    [
      "a function at an argument outside its domain",
      "[[i \\in 1..2 |-> <<1>>] EXCEPT ![5][1 \\div 0] = 2] = 0",
      [],
      "The second argument of \\div is 0.",
    ],
    [
      "a function the typed tier builds, at an argument outside its domain",
      "[[i \\in 1..2 |-> <<x, x>>] EXCEPT ![x + 3][1 \\div x] = 1][1][1] = 0",
      [],
      "The second argument of \\div is 0.",
    ],
    [
      "a record at keys that print",
      '[[a |-> 1] EXCEPT ![PrintT("k1")][PrintT("k2")] = 2] = 0',
      ['"k1"', '"k2"'],
      "Attempted to access record by a non-string argument: TRUE",
    ],
    [
      "a lazy function whose domain prints",
      'LET h == [t \\in {u \\in Nat : PrintT(<<"m", u>>)} |-> [v \\in 0..1 |-> 0]] IN [h EXCEPT ![1][IF PrintT("k2") THEN 1 ELSE 0] = 5][1][1] = 5',
      ['"k2"', '<<"m", 1>>', '<<"m", 1>>'],
      undefined,
    ],
  ])(
    "evaluates the whole path of an EXCEPT on %s before it applies the function, as TLC does",
    async (_value, except, expected, message) => {
      const prints: string[] = [];
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = 0 /\\ ${except}\n====`,
        config: "INIT Init\nNEXT Next",
        onPrint: (text) => prints.push(text),
      });
      expect(prints).toEqual(expected);
      if (message === undefined) expect(result.status).toBe("success");
      else expect(result.failure?.message).toContain(message);
    },
  );

  it.each([
    [
      "a member of SUBSET S",
      "~({t \\in (0..2) \\X {x} : 1 \\div (2 - t[1]) >= 0} \\in SUBSET ((1..2) \\X {x}))",
    ],
    [
      "membership in UNION S",
      "<<0, x>> \\in UNION {s \\in SUBSET ((0..2) \\X {x}) : 1 \\div (3 - Cardinality(s)) >= 0}",
    ],
    [
      "SUBSET A \\subseteq SUBSET B",
      "~(SUBSET {t \\in (0..2) \\X {x} : 1 \\div (2 - t[1]) >= 0} \\subseteq SUBSET ((1..2) \\X {x}))",
    ],
  ])(
    "never evaluates a filter past the element that decides %s, as TLC's member does",
    async (_membership, membership) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers, FiniteSets\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 3 /\\ ${membership}\n====`,
        config: "INIT Init\nNEXT Next",
      });
      expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
        "success",
        4,
        3,
      ]);
    },
  );

  it.each([
    ["a filter of an enumerated set", "1 \\in {t \\in 0..2 : 1 \\div t > 0}"],
    [
      "a union with a filter of an enumerated set",
      "1 \\in {1} \\cup {t \\in 0..2 : 1 \\div t > 0}",
    ],
    ["Nat and a filter of an enumerated set", "1 \\in Nat \\cup {t \\in 0..2 : 1 \\div t > 0}"],
    [
      "a set of records and a filter of an enumerated set",
      "[a |-> 1] \\in [a : {1}] \\cup {t \\in {[a |-> x]} : 1 \\div t.a > 0}",
    ],
    [
      "UNION of a literal with a filter of an enumerated set",
      "1 \\in UNION {{1}, {t \\in 0..2 : 1 \\div t > 0}}",
    ],
    [
      "UNION of a literal of a filter of an enumerated set",
      "1 \\in UNION {{t \\in 0..2 : 1 \\div t > 0}}",
    ],
    ["a filter of an enumerated set less a set", "1 \\in {t \\in 0..2 : 1 \\div t > 0} \\ {5}"],
    [
      "SUBSET of a filter of an enumerated set",
      "{<<1, x>>} \\in SUBSET {t \\in {<<0, x>>, <<1, x>>} : 1 \\div t[1] > 0}",
    ],
    [
      "UNION of a literal with a lazy filter after the set that holds the element",
      "<<1, x>> \\in UNION {{<<1, x>>}, {t \\in (0..2) \\X {x} : 1 \\div t[1] > 0}}",
    ],
    [
      "UNION of a literal with a lazy filter before the set that holds the element",
      "<<1, x>> \\in UNION {{t \\in (0..2) \\X {x} : 1 \\div t[1] > 0}, {<<1, x>>}}",
    ],
    ["a set of records and a set literal", "[a |-> 1] \\in [a : {1}] \\cup {[a |-> 1 \\div x]}"],
    ["UNION of a literal of set literals", "1 \\in UNION {{1}, {1 \\div x}}"],
    ["Nat less a set literal", "-1 \\notin Nat \\ {1 \\div x}"],
  ])("fails as TLC does on a set it builds to test membership in %s", async (_set, membership) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 3 /\\ ${membership}\n====`,
      config: "INIT Init\nNEXT Next",
    });
    expect([
      result.status,
      result.failure?.message,
      result.generatedStates,
      result.distinctStates,
    ]).toEqual(["error", "The second argument of \\div is 0.", 1, 1]);
  });

  it.each([
    [
      "a set of records whose first field misses",
      "[a |-> 1, b |-> 0] \\notin [a : {0}, b : {1 \\div x}]",
    ],
    [
      "a set of records whose first field is Nat",
      "[a |-> -1, b |-> 0] \\notin [a : Nat, b : {1 \\div x}]",
    ],
    [
      "a set of records with a set of records as a field",
      "[a |-> 1, b |-> [c |-> 0]] \\notin [a : {0}, b : [c : {1 \\div x}]]",
    ],
    [
      "a set of records with SUBSET as a field",
      "[a |-> 1, b |-> {}] \\notin [a : {0}, b : SUBSET {1 \\div x}]",
    ],
    [
      "a set of records with Seq as a field",
      "[a |-> 1, b |-> <<>>] \\notin [a : {0}, b : Seq({1 \\div x})]",
    ],
    [
      "a set of records with a filter of a set literal as a field",
      "[a |-> 1, b |-> 0] \\notin [a : {0}, b : {t \\in {1 \\div x} : TRUE}]",
    ],
    [
      "a set of records with a filter of an interval as a field",
      "[a |-> 1, b |-> 0] \\notin [a : {0}, b : {t \\in 0..2 : t # 1 \\div x}]",
    ],
    [
      "a set of records with a set difference as a field",
      "[a |-> 1, b |-> 0] \\notin [a : {0}, b : {0} \\ {1 \\div x}]",
    ],
    [
      "a set of records with DOMAIN as a field",
      "[a |-> 1, b |-> 0] \\notin [a : {0}, b : DOMAIN [t \\in {1 \\div x} |-> 0]]",
    ],
    [
      "a set of records with a set of functions on an interval as a field",
      "[a |-> 1, b |-> <<>>] \\notin [a : {0}, b : [1..(1 \\div x) -> {0}]]",
    ],
    ["a set of functions whose domain misses", "[t \\in {1} |-> 0] \\notin [{2} -> {1 \\div x}]"],
    ["a set of functions on an interval that is empty", "<<>> \\in [1..x -> {1 \\div x}]"],
    [
      "a set of functions with SUBSET of a constant as its range",
      "[t \\in {1} |-> {}] \\notin [{2} -> SUBSET {1 \\div 0}]",
    ],
    [
      "a set of records with SUBSET of a constant as a field",
      "[a |-> 1, b |-> {}] \\notin [a : {0}, b : SUBSET {1 \\div 0}]",
    ],
    ["Seq of a set literal", "<<>> \\in Seq({1 \\div x})"],
    ["Seq of a set of records", "<<[a |-> 1, b |-> 0]>> \\notin Seq([a : {0}, b : {1 \\div x}])"],
    ["SUBSET of a set of records", "{} \\in SUBSET [a : {1 \\div x}]"],
    ["a union of two sets of records", "[a |-> 0] \\in [a : {0}] \\cup [a : {1 \\div x}]"],
    [
      "a union nested in a union",
      "[a |-> 0] \\in {[a |-> 0]} \\cup ({[a |-> 1 \\div x]} \\cup [a : {0}])",
    ],
    ["UNION of a literal of a union", "[a |-> 0] \\in UNION {[a : {0}] \\cup [a : {1 \\div x}]}"],
    [
      "a lazy filter of a set of records",
      "[a |-> 1, b |-> 0] \\notin {r \\in [a : {0}, b : {1 \\div x}] : TRUE}",
    ],
    ["a set of records less a set", "[a |-> 1, b |-> 0] \\notin [a : {0}, b : {1 \\div x}] \\ {}"],
    ["the domain of a tuple", "0 \\notin DOMAIN <<1 \\div x>>"],
    ["the domain of a sequence", "0 \\notin DOMAIN Append(<<>>, 1 \\div x)"],
  ])(
    "fails as TLC does to build the parts of %s before it tests membership in it",
    async (_set, membership) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers, Sequences\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 3 /\\ ${membership}\n====`,
        config: "INIT Init\nNEXT Next",
      });
      expect([
        result.status,
        result.failure?.message,
        result.generatedStates,
        result.distinctStates,
      ]).toEqual(["error", "The second argument of \\div is 0.", 1, 1]);
    },
  );

  it.each([
    ["{0}", "1 \\in UNION {Nat, {x}}"],
    ["{1}", "1 \\in UNION {Nat, {1}}"],
  ])(
    "fails as TLC does to compare Nat with %s as it sorts the sets of UNION of a literal",
    async (set, membership) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 3 /\\ ${membership}\n====`,
        config: "INIT Init\nNEXT Next",
      });
      expect([
        result.status,
        result.failure?.message,
        result.generatedStates,
        result.distinctStates,
      ]).toEqual([
        "error",
        `${UNEXPECTED_EXCEPTION}Attempted to compare the set ${set} with the value:\nNat`,
        1,
        1,
      ]);
    },
  );

  it.each([
    [
      "fails as TLC does to build an enumerated set it filters by a predicate that can't fail",
      "{<<1, 0>>}",
      "{<<1 \\div x, x>>, <<1, x>>}",
      ["error", "The second argument of \\div is 0.", 1, 1],
    ],
    [
      "tests membership in a filter by a predicate that can't fail as TLC does",
      "{<<1, 0>>, <<1, 1>>}",
      "{<<0, x>>, <<1, x>>}",
      ["deadlock", undefined, 3, 3],
    ],
  ])("%s", async (_title, edges, set, expected) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Integers\nVARIABLES x, y\nInit == x = 0 /\\ y = ${edges}\nNext == x' = (x + 1) % 3 /\\ y' = y /\\ <<1, x>> \\in {t \\in ${set} : t \\in y}\n====`,
      config: "INIT Init\nNEXT Next",
    });
    expect([
      result.status,
      result.failure?.message,
      result.generatedStates,
      result.distinctStates,
    ]).toEqual(expected);
  });

  it("fails as TLC does to compare model values of two types in a filter's membership test", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nCONSTANTS a, b, m\nVARIABLES x, y\nInit == x = 0 /\\ y = {b, m}\nNext == x' = (x + 1) % 3 /\\ y' = y /\\ m \\in {t \\in {m, a} : t \\in y}\n====",
      config: "INIT Init\nNEXT Next\nCONSTANTS\na = A_a\nb = B_b\nm = m",
    });
    expect([
      result.status,
      result.failure?.message,
      result.generatedStates,
      result.distinctStates,
    ]).toEqual([
      "error",
      `${UNEXPECTED_EXCEPTION}Attempted to compare the differently-typed model values A_a and B_b`,
      1,
      1,
    ]);
  });

  it("checks a membership in a filter whose predicate nests 19 more as TLC does", async () => {
    let predicate = "t20 \\in y";
    for (let level = 20; level >= 2; level--) {
      predicate = `t${level - 1} \\in {t${level} \\in 0..0 : ${predicate}}`;
    }
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Integers\nVARIABLES x, y\nInit == x = 0 /\\ y = {0, 1, 2}\nNext == x' = x /\\ y' = y /\\ x \\in {t1 \\in 0..0 : ${predicate}}\n====`,
      config: "INIT Init\nNEXT Next",
    });
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "success",
      2,
      1,
    ]);
  });

  it.each([
    [
      "a member of SUBSET S",
      6,
      "({t \\in (0..2) \\X {1} : TLCSet(1, TLCGet(1) + 1)} \\in SUBSET ((1..2) \\X {1})) \\in BOOLEAN",
      7,
    ],
    [
      "membership in UNION S",
      9,
      "<<0, 1>> \\in UNION {s \\in SUBSET ((0..2) \\X {1}) : TLCSet(1, TLCGet(1) + 1)}",
      6,
    ],
  ])(
    "counts the predicate's effects only up to the element that decides %s, as TLC's member does",
    async (_membership, bound, membership, distinctStates) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == x = 0 /\\ TLCSet(1, 0)\nNext == x < ${bound} /\\ ${membership} /\\ x' = TLCGet(1)\n====`,
        config: "INIT Init\nNEXT Next",
      });
      expect([result.status, result.distinctStates]).toEqual(["deadlock", distinctStates]);
    },
  );

  it("decides sets of functions, records, and tuples from an empty argument", async () => {
    const result = await checkFixture("empty-sets", "EmptySets");
    expect(result.violation?.message).toBeUndefined();
    expect(result.status).toBe("success");
  });

  it("passes a string that spells an operator as a string argument", async () => {
    const texts = ["[]", "<>", "SUBSET", "UNION", "DOMAIN", "ENABLED", "UNCHANGED", "'", "^+"];
    const printed: string[] = [];
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS TLC\n${texts.map((text) => `ASSUME PrintT("${text}")`).join("\n")}\n====`,
      config: "",
      onPrint: (text) => printed.push(text),
    });
    expect(result.status).toBe("success");
    expect(printed).toEqual(texts.map((text) => `"${text}"`));
  });

  it("checks invariants before action properties and constrained states", async () => {
    const results = await Promise.all(
      ["InvariantFirst", "ConstrainedInvariant"].map((name) =>
        checkFixture("ordering", "Ordering", name),
      ),
    );
    expect(
      results.map((result) => [
        result.status,
        result.violation?.name,
        result.generatedStates,
        result.distinctStates,
        result.depth,
      ]),
    ).toEqual([
      ["invariant-violation", "Small", 3, 3, 3],
      ["invariant-violation", "Small", 3, 2, 2],
    ]);
  });

  it("checks membership in a union of a non-enumerable set against the enumerable side first", async () => {
    expect((await checkModule('ASSUME 1 \\in Int \\cup {"none"}')).status).toBe(
      "assumption-violation",
    );
    expect((await checkModule("ASSUME 5 \\in UNION {Nat}")).status).toBe("success");
  });

  it("defers a set operation on a value that isn't a set until it enumerates the result", async () => {
    expect((await checkModule("ASSUME ({} \\cup 0) = 0")).status).toBe("success");
    const result = await checkModule("ASSUME Cardinality({1} \\cup 0) = 1");
    expect(result.violation?.message).toContain(
      "Attempted to enumerate S \\cup T when S:\n{1}\nand T:\n0\nare not both enumerable",
    );
  });

  it("compares power sets through their bases", async () => {
    expect((await checkModule("ASSUME SUBSET (1..23) \\subseteq SUBSET (1..42)")).status).toBe(
      "success",
    );
    expect((await checkModule("ASSUME ~(SUBSET (1..42) \\subseteq SUBSET (2..42))")).status).toBe(
      "success",
    );
  });

  it("reads each of SANY's Unicode operators as its ASCII spelling, and ℕ as a name", async () => {
    const result = await checkModule(
      [
        "a \\approx b == <<a, b>>",
        "a \\sqcup b == {a, b}",
        "a (+) b == a + b",
        "a ^+ == a + 1",
        "ℕ ≜ Nat",
        "ASSUME (1 ≈ 2) = ⟨1, 2⟩ ∧ (1 ⊔ 2) = {1, 2} ∧ (1 ⊕ 2) = 3 ∧ 3⁺ = 4",
        "ASSUME 0‥2 = {0, 1, 2} ∧ 7 ÷ 2 = 3 ∧ ⟨1⟩ ∘ ⟨2⟩ = ⟨1, 2⟩ ∧ 3 ∈ ℕ ∧ [n ∈ {1} ↦ n] = ⟨1⟩",
        "Prop ≜ □[x' = x]_x ∧ □(x ∈ ℕ) ∧ (□◇⟨x' ≠ x⟩_x ∨ x = 0)",
      ].join("\n"),
      "PROPERTY Prop",
    );
    expect(result.status).toBe("success");
  });

  it("reports a module that cannot be found as a syntax error", async () => {
    await expect(
      check({
        source: "---- MODULE M ----\nEXTENDS Missing\n====",
        config: "",
        loadModule: () => undefined,
      }),
    ).rejects.toThrow(TlaSyntaxError);
  });

  it.each([
    ["", 0, 0],
    ["\n\n", 2, 1],
    ["x\r\ny\r\n", 2, 3],
    ["garbage\nmore ====", 2, 9],
    ["x\n\tab\t", 2, 16],
    ["----  M ----\nA == 1\n====\n", 3, 5],
  ])(
    "reports a source %j without a module header at SANY's end of file",
    async (source, line, column) => {
      await expect(check({ source, config: "" })).rejects.toMatchObject({
        failure: { line, column },
      });
    },
  );

  it("exposes TLC's level, counters, and registers through TLCGet and TLCSet", async () => {
    const results = await Promise.all(
      ["Runtime", "Distinct", "Generated"].map((name) => checkFixture("runtime", "Runtime", name)),
    );
    expect(
      results.map((result) => [
        result.status,
        result.generatedStates,
        result.distinctStates,
        result.depth,
        result.violation?.trace.map((step) => step.state.x),
      ]),
    ).toEqual([
      ["success", 14, 8, 4, undefined],
      ["invariant-violation", 10, 6, 3, [1, 3, 5]],
      ["invariant-violation", 8, 5, 3, [0, 2, 4]],
    ]);
  });

  it("treats Any as a set containing every value", async () => {
    expect(
      (
        await checkModule(
          'ASSUME <<1, {2}>> \\in Any /\\ [a |-> 1] \\in [a : Any] /\\ ToString(Any) = "ANY"',
        )
      ).status,
    ).toBe("success");
  });

  it("checks _POSSIBLE predicates and postconditions after the search", async () => {
    const results = await Promise.all(
      ["Holds", "Unwitnessed", "False"].map((name) =>
        checkFixture("postconditions", "Postconditions", name, { onPrint: () => {} }),
      ),
    );
    expect(
      results.map((result) => [result.status, result.violation?.name, result.distinctStates]),
    ).toEqual([
      ["success", undefined, 4],
      ["postcondition-violation", "AtTen", 4],
      ["postcondition-violation", "FiveStates", 4],
    ]);
  });

  it("generates no states for a specification without variables", async () => {
    const result = await check({
      source: "---- MODULE M ----\nSpec == [][TRUE]_<<>>\n====",
      config: "SPECIFICATION Spec",
    });
    expect([result.status, result.generatedStates, result.distinctStates, result.depth]).toEqual([
      "success",
      0,
      0,
      0,
    ]);
  });

  it.each([
    [
      "with",
      'VARIABLE x\nInit == x = 0\nNever == \\E i \\in (IF PrintT("split") THEN {} ELSE {1}) : TRUE\nNext == (x < 2 /\\ x\' = x + 1) \\/ Never',
      "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
    ],
    [
      "without",
      'Next == \\E i \\in (IF PrintT("split") THEN {1} ELSE {}) : TRUE\nSpec == [][Next]_<<>>',
      "SPECIFICATION Spec",
    ],
  ])(
    "splits a next-state relation %s variables by the value of a constant definition, as TLC's Tool looks it up",
    async (_kind, definitions, config) => {
      const printed: string[] = [];
      await check({
        source: `---- MODULE M ----\nEXTENDS Naturals, TLC\n${definitions}\n====`,
        config,
        onPrint: (text) => printed.push(text),
      });
      expect(printed).toEqual(['"split"']);
    },
  );

  it("splits the next-state relation of a specification without variables before it checks the assumptions, as TLC's Tool does", async () => {
    const printed: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS TLC\nNext == \\E i \\in {PrintT(<<"split", TLCGet("level")>>)} : TRUE\nSpec == [][Next]_<<>>\nASSUME PrintT("assume")\n====',
      config: "SPECIFICATION Spec",
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toEqual(['<<"split", 1>>', '"assume"']);
  });

  it("runs only the PlusCal actions whose label guard matches, with TLC's counts", async () => {
    const result = await check({
      source: [
        "---- MODULE M ----",
        "EXTENDS Integers",
        "VARIABLES pc, count",
        'A(self) == pc[self] = "a" /\\ count < 3 /\\ pc\' = [pc EXCEPT ![self] = "b"] /\\ count\' = count + 1',
        'B(self) == pc[self] = "b" /\\ pc\' = [pc EXCEPT ![self] = "c"] /\\ UNCHANGED count',
        'C(self) == pc[self] = "c" /\\ pc\' = [pc EXCEPT ![self] = "a"] /\\ UNCHANGED count',
        "Reset(self) == count > 2 /\\ count' = 0 /\\ UNCHANGED pc",
        "Proc(self) == A(self) \\/ B(self) \\/ C(self)",
        'Init == pc = [p \\in {1, 2} |-> "a"] /\\ count = 0',
        "Next == \\E self \\in {1, 2} : Proc(self) \\/ Reset(self)",
        "====",
      ].join("\n"),
      config: "INIT Init\nNEXT Next",
    });
    expect([result.status, result.generatedStates, result.distinctStates, result.depth]).toEqual([
      "success",
      85,
      36,
      12,
    ]);
  });

  it("runs only the actions whose label guard after other guards matches, with TLC's counts", async () => {
    const result = await check({
      source: [
        "---- MODULE M ----",
        "EXTENDS Integers",
        "VARIABLES pc, count, turn",
        'A(self) == turn = self /\\ pc[self] = "a" /\\ count < 3 /\\ pc\' = [pc EXCEPT ![self] = "b"] /\\ count\' = count + 1 /\\ UNCHANGED turn',
        'B(self) == turn = self /\\ pc[self] = "b" /\\ pc\' = [pc EXCEPT ![self] = "c"] /\\ UNCHANGED <<count, turn>>',
        'C(self) == turn = self /\\ pc[self] = "c" /\\ pc\' = [pc EXCEPT ![self] = "a"] /\\ UNCHANGED count /\\ turn\' = 3 - self',
        "Reset(self) == count > 2 /\\ count' = 0 /\\ UNCHANGED <<pc, turn>>",
        "Proc(self) == A(self) \\/ B(self) \\/ C(self)",
        'Init == pc = [p \\in {1, 2} |-> "a"] /\\ count = 0 /\\ turn \\in {1, 2}',
        "Next == \\E self \\in {1, 2} : Proc(self) \\/ Reset(self)",
        "====",
      ].join("\n"),
      config: "INIT Init\nNEXT Next",
    });
    expect([result.status, result.generatedStates, result.distinctStates, result.depth]).toEqual([
      "success",
      36,
      24,
      10,
    ]);
  });

  it("reports an error in a guard before a label that doesn't match like TLC", async () => {
    const result = await check({
      source: [
        "---- MODULE M ----",
        "VARIABLES pc, x",
        'A(self) == x = "s" /\\ pc[self] = "b" /\\ UNCHANGED <<pc, x>>',
        'B(self) == pc[self] = "a" /\\ pc\' = [pc EXCEPT ![self] = "b"] /\\ UNCHANGED x',
        'Init == pc = [p \\in {1} |-> "a"] /\\ x = 0',
        "Next == \\E self \\in {1} : A(self) \\/ B(self)",
        "====",
      ].join("\n"),
      config: "INIT Init\nNEXT Next",
    });
    expect([result.status, result.failure?.message]).toEqual([
      "error",
      `${UNEXPECTED_EXCEPTION}Attempted to check equality of integer 0 with non-integer:\n"s"`,
    ]);
  });

  it("reports a name that is not a boolean before a label that doesn't match like TLC", async () => {
    const result = await check({
      source: [
        "---- MODULE M ----",
        "VARIABLES pc, x",
        'A(self) == x /\\ pc[self] = "z" /\\ UNCHANGED <<pc, x>>',
        'B(self) == pc[self] = "a" /\\ pc\' = [pc EXCEPT ![self] = "b"] /\\ UNCHANGED x',
        'Init == pc = [p \\in {1} |-> "a"] /\\ x = 0',
        "Next == \\E self \\in {1} : A(self) \\/ B(self)",
        "====",
      ].join("\n"),
      config: "INIT Init\nNEXT Next",
    });
    expect([result.status, result.failure?.message]).toEqual([
      "error",
      `${UNEXPECTED_EXCEPTION}In computing next states, TLC expected a boolean expression,\nbut instead found 0.\nline 3, col 12 to line 3, col 12 of module M`,
    ]);
  });

  it("runs every disjunct of an action before a label that doesn't match like TLC", async () => {
    const result = await check({
      source: [
        "---- MODULE M ----",
        "VARIABLES pc, x",
        'Ready == x = 0 \\/ x = "s"',
        'A(self) == Ready /\\ pc[self] = "z" /\\ UNCHANGED <<pc, x>>',
        'B(self) == pc[self] = "a" /\\ pc\' = [pc EXCEPT ![self] = "b"] /\\ UNCHANGED x',
        'Init == pc = [p \\in {1} |-> "a"] /\\ x = 0',
        "Next == \\E self \\in {1} : A(self) \\/ B(self)",
        "====",
      ].join("\n"),
      config: "INIT Init\nNEXT Next",
    });
    expect([result.status, result.failure?.message]).toEqual([
      "error",
      `${UNEXPECTED_EXCEPTION}Attempted to check equality of integer 0 with non-integer:\n"s"`,
    ]);
  });

  it("reports a label that is not a string where the first action compares it like TLC", async () => {
    const result = await check({
      source: [
        "---- MODULE M ----",
        "VARIABLE pc",
        'A(self) == pc[self] = "a" /\\ pc\' = [pc EXCEPT ![self] = 2]',
        'B(self) == pc[self] = "b" /\\ UNCHANGED pc',
        'Init == pc = [p \\in {1} |-> "a"]',
        "Next == \\E self \\in {1} : A(self) \\/ B(self)",
        "====",
      ].join("\n"),
      config: "INIT Init\nNEXT Next",
    });
    expect([result.status, result.failure?.message]).toEqual([
      "error",
      `${UNEXPECTED_EXCEPTION}Attempted to check equality of integer 2 with non-integer:\n"a"`,
    ]);
  });

  it("generates a successor for each witness of an existential under a universal action", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nWitness(i) == \\E j \\in 1..3 : j >= i\nInit == x = 0\nNext == x < 2 /\\ (\\A i \\in {1, 2} : Witness(i)) /\\ x' = x + 1\n====",
      config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
    });
    expect([result.generatedStates, result.distinctStates]).toEqual([13, 3]);
  });

  it("evaluates the conjuncts left once an action assigns every variable, unless warnings are off", async () => {
    const results = await Promise.all(
      [true, false].map((isWarningEnabled) =>
        check({
          source:
            "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nWitness(i) == \\E j \\in 1..3 : j >= i\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1 /\\ \\A i \\in {1, 2} : Witness(i)\n====",
          config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
          isWarningEnabled,
        }),
      ),
    );
    expect(results.map((result) => [result.generatedStates, result.distinctStates])).toEqual([
      [3, 3],
      [13, 3],
    ]);
  });

  it("computes the definitions an INSTANCE adds in the order of SANY's symbol table", async () => {
    const warnings: string[] = [];
    await check({
      source: "---- MODULE R ----\nINSTANCE Cases WITH C <- 1\n====",
      config: "",
      loadModule: (name) =>
        name === "Cases"
          ? [
              "---- MODULE Cases ----",
              "CONSTANT C",
              'F == [x \\in {"a"} |-> C]',
              'FcnExceptMissing == [F EXCEPT !["c"] = 9]',
              "TupleExceptMissing == [<<C>> EXCEPT ![3] = 9]",
              "RecordExceptMissing == [[a |-> C] EXCEPT !.c = 9]",
              "====",
            ].join("\n")
          : undefined,
      onProgress: (progress) => {
        if (progress.kind === "warning") warnings.push(progress.text.split("\n")[1]);
      },
    });
    expect(warnings).toEqual([
      "line 4, col 22 to line 4, col 22 of module Cases",
      "line 6, col 25 to line 6, col 33 of module Cases",
      "line 5, col 24 to line 5, col 28 of module Cases",
    ]);
  });

  it.each([
    ["no EXTENDS", "", ["A1", "Baz", "Cc", "Quux", "Bar", "Qux", "Foo", "dd", "B2", "Zeta"]],
    [
      "EXTENDS TLC",
      "EXTENDS TLC\n",
      ["B2", "A1", "Foo", "dd", "Baz", "Bar", "Cc", "Quux", "Qux", "Zeta"],
    ],
  ])(
    "computes the definitions an INSTANCE of an inner module with %s adds in the order of its symbol table, which SANY starts without the builtins",
    async (_label, extendsLine, expected) => {
      const names = ["Foo", "Bar", "Baz", "Qux", "Quux", "A1", "B2", "Cc", "dd", "Zeta"];
      const prints: string[] = [];
      await check({
        source: `---- MODULE M ----\nEXTENDS TLC\nVARIABLE x\n---- MODULE P ----\n${extendsLine}VARIABLE v\n${names.map((name) => `${name} == PrintT("${name}")`).join("\n")}\n====\nI == INSTANCE P WITH v <- x\nInit == x = 0\nNext == x' = x\n====`,
        config: "INIT Init\nNEXT Next",
        onPrint: (text) => prints.push(text),
      });
      expect(prints).toEqual(expected.map((name) => `"${name}"`));
    },
  );

  it.each([
    ["Naturals", "{} >= 0", ">", "{}"],
    ["Integers", "{} >= 0", ">=", "{}"],
    ["Naturals, TLCExt", "{} >= 0", ">=", "{}"],
    ["Bags", 'SubBag(<<"a">>) = {}', ">", '"a"'],
  ])(
    "names >= in an error as the Java method TLC loads with %s does",
    async (modules, assumption, name, value) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS ${modules}\nASSUME ${assumption}\n====`,
        config: "",
      });
      expect(result.violation?.message).toBe(
        `The first argument of ${name} should be an integer, but instead it is:\n${value}`,
      );
    },
  );

  it("reports a depth of 1 when the constraint excludes every initial state", async () => {
    const results = await Promise.all(
      [1, 2].map((workers) =>
        check({
          source:
            "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 1\nNext == x' = x\nConstraint == x = 0\n====",
          config: "INIT Init\nNEXT Next\nCONSTRAINT Constraint",
          workers,
        }),
      ),
    );
    expect(
      results.map((result) => [result.generatedStates, result.distinctStates, result.depth]),
    ).toEqual([
      [1, 0, 1],
      [1, 0, 1],
    ]);
  });

  it("prints empty intervals and keys that are not field names like TLC", async () => {
    const prints: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nASSUME PrintT(0..-2)\nASSUME PrintT(("<<>>" :> 0) @@ ("a b" :> 1))\nASSUME PrintT(("x1" :> 2) @@ ("y" :> 3))\nASSUME PrintT("x\u00b2" :> 4)\nASSUME PrintT("x\u0663" :> 5)\nInit == x = 0\nNext == UNCHANGED x\n====',
      config: "INIT Init\nNEXT Next",
      onPrint: (text) => prints.push(text),
    });
    expect(prints).toEqual([
      "{}",
      '("<<>>" :> 0 @@ "a b" :> 1)',
      "[x1 |-> 2, y |-> 3]",
      '("x\u00b2" :> 4)',
      "[x\u0663 |-> 5]",
    ]);
  });

  it("orders and compares intervals by size and then low bound like TLC", async () => {
    const prints: string[] = [];
    await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nVARIABLE x\nASSUME PrintT(<<{2..3, 1..3, 3..2, 1..0, 0..1, 5..4}, 1..3 = 1..3, 3..2 = 1..0, 1..2 = 2..3, Cardinality({1..0, 3..2}), [1..2 -> {0}] \\subseteq [1..2 -> {0, 1}]>>)\nInit == x = 0\nNext == UNCHANGED x\n====",
      config: "INIT Init\nNEXT Next",
      onPrint: (text) => prints.push(text),
    });
    expect(prints).toEqual(["<<{{}, 0..1, 2..3, 1..3}, TRUE, TRUE, FALSE, 1, TRUE>>"]);
  });

  it("checks whether an interval is a subset of a set like TLC", async () => {
    const prints: string[] = [];
    await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, TLC\nCONSTANT m\nVARIABLE x\nASSUME PrintT(<<1..3 \\subseteq {1, 2}, 1..2 \\subseteq {0, 1, 2, 5}, 2..1 \\subseteq {}, 1..3 \\subseteq {1, 2, 3}, 3..4 \\subseteq {1, 2, 3}, 1..2 \\subseteq 0..5, 1..2 \\subseteq {m, 1, 2}, 1..3 \\subseteq {m, 1, 2}, 0..1 \\subseteq {m, 1, 2}>>)\nInit == x = 0\nNext == UNCHANGED x\n====",
      config: "CONSTANT m = m\nINIT Init\nNEXT Next",
      onPrint: (text) => prints.push(text),
    });
    expect(prints).toEqual(["<<FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, TRUE, FALSE, FALSE>>"]);
  });

  it("filters a set by a predicate that ignores the element like TLC", async () => {
    const prints: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nASSUME PrintT(<<{e \\in 1..2147483647 : 1..3 \\subseteq {1, 2}}, {e \\in 1..3 : 2 > 1}, {e \\in 1..3 : PrintT("p")}, {e \\in {} : 1}>>)\nInit == x = 0\nNext == UNCHANGED x\n====',
      config: "INIT Init\nNEXT Next",
      onPrint: (text) => prints.push(text),
    });
    expect(prints).toEqual(['"p"', '"p"', '"p"', "<<{}, {1, 2, 3}, {1, 2, 3}, {}>>"]);
  });

  it("filters a set by a predicate that calls an operator from outside it for every element like TLC", async () => {
    const prints: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nApply(F(_), v) == F(v)\nCall(F(_)) == {e \\in 1..3 : ~F("c")}\nPass(F(_)) == {e \\in 1..3 : ~Apply(F, "p")}\nInfix(_ \\prec _) == {e \\in 1..3 : ~(1 \\prec 2)}\nBin(a, b) == PrintT(<<a, b>>)\nASSUME PrintT(<<Call(PrintT), Pass(PrintT), Infix(Bin), LET P(a) == PrintT(a) IN {e \\in 1..3 : ~P("l")}>>)\nInit == x = 0\nNext == UNCHANGED x\n====',
      config: "INIT Init\nNEXT Next",
      onPrint: (text) => prints.push(text),
    });
    expect(prints).toEqual([
      '"c"',
      '"c"',
      '"c"',
      '"p"',
      '"p"',
      '"p"',
      "<<1, 2>>",
      "<<1, 2>>",
      "<<1, 2>>",
      '"l"',
      '"l"',
      '"l"',
      "<<{}, {}, {}, {}>>",
    ]);
  });

  it("filters a set by a predicate that calls a constant substituted with PrintT for every element like TLC", async () => {
    const prints: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS Integers, TLC\nCONSTANT G(_)\nVARIABLE x\nASSUME PrintT({e \\in 1..3 : ~G("g")})\nInit == x = 0\nNext == UNCHANGED x\n====',
      config: "CONSTANT G <- PrintT\nINIT Init\nNEXT Next",
      onPrint: (text) => prints.push(text),
    });
    expect(prints).toEqual(['"g"', '"g"', '"g"', "{}"]);
  });

  it("bundles the Reals module, whose Real is not a set TLC can check", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Reals, Toolbox\nVARIABLE x\nASSUME 1 \\in Real\nInit == x = 0\nNext == x' = x\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect(result.status).toBe("assumption-violation");
  });

  it("fingerprints states by their VIEW and keeps the fair steps it hides", async () => {
    const result = await checkFixture("view", "View");
    expect([result.status, result.generatedStates, result.distinctStates, result.depth]).toEqual([
      "success",
      5,
      4,
      4,
    ]);
  });

  it("labels the successor that violates an action property by its values under a VIEW", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nA1 == x' = x /\\ y' = y\nA2 == x' = x /\\ y' = 1\nSpec == Init /\\ [][A1 \\/ A2]_<<x, y>>\nP == [][y' = y]_<<x, y>>\nView == x\n====",
      config: "SPECIFICATION Spec\nPROPERTY P\nVIEW View",
    });
    expect(result.violation?.trace.map((step) => step.label)).toEqual([
      undefined,
      "A2 line 5, col 7 to line 5, col 22 of module M",
    ]);
  });

  it("sorts the records of each state it fingerprints under a VIEW, as TLC normalizes the state", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLES x, y\nId(a) == a\nInit == x = 0 /\\ y = [b |-> TRUE, a |-> 1]\nNext == x' = x + 1 /\\ y' = [b |-> FALSE, a |-> x]\nInv == x < 2\nView == x\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nVIEW View",
    });
    expect(result.violation?.trace.map((step) => formatValue(step.state.y))).toEqual([
      "[a |-> 1, b |-> TRUE]",
      "[a |-> 0, b |-> FALSE]",
      "[a |-> 1, b |-> FALSE]",
    ]);
  });

  it("evaluates the VIEW only of a state the constraints keep in the model, as TLC fingerprints it", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nInit == x \\in 0..2\nNext == x < 3 /\\ x' = x + 1\nC == x < 2\nView == IF x < 2 THEN x ELSE <<x>>[5]\n====",
      config: "INIT Init\nNEXT Next\nCONSTRAINT C\nVIEW View",
    });
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "success",
      5,
      2,
    ]);
  });

  it("prints the records of an initial state outside the model as written, as TLC doesn't fingerprint it", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nRecord == [a |-> 0, b |-> 0]\nInit == x = [b |-> TRUE, a |-> 1]\nNext == UNCHANGED x\nC == x.a > 5\nInv == x.a = 0\n====",
      config: "INIT Init\nNEXT Next\nCONSTRAINT C\nINVARIANT Inv",
    });
    expect(result.violation?.trace.map((step) => formatValue(step.state.x))).toEqual([
      "[b |-> TRUE, a |-> 1]",
    ]);
  });

  it.each([
    ["<<x, y>>", "/\\ x = 0\n/\\ y = 5\n"],
    ["<<y, x>>", "/\\ x = 0\n/\\ y = 5\n"],
    ["<<x + 1>>", "<<1>>"],
  ])(
    "prints the VIEW %s of a state as a state only when it lists the variables",
    async (view, text) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLES x, y\nInit == x = 0 /\\ y = 5\nNext == x' = x + 1 /\\ y' = y\nInv == x < 1\nView == ${view}\n====`,
        config: "INIT Init\nNEXT Next\nINVARIANT Inv\nVIEW View",
        isViewPrinted: true,
      });
      expect(formatState(result.violation?.trace[0].state ?? {})).toBe(text);
    },
  );

  it("evaluates a VIEW on the symmetry representative TLC picks by its variable order", async () => {
    const result = await checkFixture("view", "ViewSymmetry");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([7, 4, 4]);
  });

  it("orders model values, strings, and record fields like TLC when picking a representative", async () => {
    const result = await checkFixture("view", "ViewSymmetryOrder");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([139, 14, 3]);
  });

  it("ranks a string literal as written where SANY parses it", async () => {
    const printed: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS TLC\nVARIABLE x\nA == "b"\nB == "a"\nASSUME PrintT({ToString("a"), ToString("b")})\nInit == x = 0\nNext == UNCHANGED x\n====',
      config: "INIT Init\nNEXT Next",
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toEqual(['{"\\"b\\"", "\\"a\\""}']);
  });

  it("orders strings, record fields, and model values by when TLC interns them", async () => {
    const printed: string[] = [];
    const result = await checkFixture("strings", "StringOrder", "StringOrder", {
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toEqual([
      '"zzq"',
      '{"zzq", "aaq", "mmq"}',
      "[zz |-> 1, aa |-> 2]",
      "{[zz |-> 1], [aa |-> 1]}",
      "{p2, m, b}",
      "p2",
      '{"7", "3"}',
      '{"zzb", "zza"}',
    ]);
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.trace.map((step) => formatValue(step.state.pick))).toEqual([
      '"zzq"',
      '"aaq"',
    ]);
  });

  it.each(["UnicodeStringFingerprint", "UnicodeRecordFingerprint", "UnicodeFunctionFingerprint"])(
    "merges states whose strings differ only above U+00FF like TLC's fingerprint in %s",
    async (name) => {
      const result = await checkFixture("strings", name);
      expect([result.generatedStates, result.distinctStates]).toEqual([3, 1]);
    },
  );

  it("computes TLCFP with TLC's fingerprint", async () => {
    const result = await check({
      source: `---- MODULE M ----
EXTENDS Integers, TLCExt
CONSTANT a
ASSUME TLCFP(1) = -1504394061
ASSUME TLCFP("m1") = 952772174
ASSUME TLCFP(<<1, "m1", TRUE>>) = -1323233619
ASSUME TLCFP([f |-> {a}]) = 820346972
ASSUME TLCFP(a) = -887695703
====`,
      config: "CONSTANT a = a",
    });
    expect(result.status).toBe("success");
  });

  it("lists a trace's variables in TLC's order", async () => {
    const result = await checkFixture("randomization", "RandomModelValue");
    expect(Object.keys(result.violation?.trace[0].state ?? {})).toEqual(["owner", "zeta"]);
  });

  it("explores states that depend on the order of strings in CHOOSE", async () => {
    const result = await checkFixture("strings", "StringSets");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([76, 31, 5]);
  });

  it("ranks strings created while checking in the order they are created", async () => {
    const result = await checkFixture("strings", "RuntimeStrings");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([115, 97, 6]);
  });

  it("ranks the strings that constant definitions create before those TLC interns as it creates the checker", async () => {
    const printed: string[] = [];
    await check({
      source:
        '---- MODULE R1 ----\nEXTENDS TLC, Sequences\nVARIABLE x\nS == {"st" \\o "ate", "ac" \\o "tion"}\nT == {"lo" \\o "cation", "na" \\o "me"}\nASSUME PrintT(<<S, T>>)\nASSUME PrintT({"tag" \\o "s", "ta" \\o "g", "dur" \\o "ation"})\nInit == x = 0\nNext == UNCHANGED x\n====',
      config: "INIT Init\nNEXT Next",
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toEqual([
      '<<{"state", "action"}, {"location", "name"}>>',
      '{"tag", "duration", "tags"}',
    ]);
  });

  it.each([
    [
      "A(p) == x < 2 /\\ x' = x + 1 /\\ PrintT(p)\nNext == A(CounterExample)",
      ["[state |-> {}, action |-> {}]", "[state |-> {}, action |-> {}]"],
    ],
    [
      'Next == \\E s \\in {"zz" \\o "q"} : x\' = (x + 1) % 3\nASSUME PrintT({"zz" \\o "q", "ac" \\o "tion"})',
      ['{"zzq", "action"}'],
    ],
  ])(
    "ranks the strings that splitting %s creates before those TLC interns as it creates the checker",
    async (definitions, prints) => {
      const printed: string[] = [];
      await check({
        source: `---- MODULE M ----\nEXTENDS Naturals, TLC, TLCExt, Sequences\nVARIABLE x\nInit == x = 0\n${definitions}\n====`,
        config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
        onPrint: (text) => printed.push(text),
      });
      expect(printed).toEqual(prints);
    },
  );

  it("does not carry one check's string order into the next", async () => {
    const earlier = await checkModule(
      'Picked == CHOOSE s \\in {"zzq", "aaq"} : TRUE\nASSUME Picked = "zzq"',
    );
    expect(earlier.status).toBe("success");
    const reversed = await checkModule(
      'ASSUME "aaq" # "zzq"\nASSUME (CHOOSE s \\in {"zzq", "aaq"} : TRUE) = "aaq"',
    );
    expect(reversed.status).toBe("success");
    expect((await checkFixture("strings", "StringSets")).distinctStates).toBe(31);
  });

  it("fails like TLC when a lasso under VIEW cannot be rebuilt from fingerprints", async () => {
    await expect(checkFixture("view", "Recover")).rejects.toThrow(
      new TlaEvaluationError(
        `${UNEXPECTED_EVAL_EXCEPTION}Failed to recover the next state from its fingerprint.`,
      ),
    );
  });

  it("enumerates subsets for x \\subseteq S in the initial predicate and next-state relation", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nVARIABLE x\nInit == x \\subseteq {1, 2}\nNext == x' \\subseteq {1, 2, 3}\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect([result.status, result.generatedStates, result.distinctStates, result.depth]).toEqual([
      "success",
      68,
      8,
      2,
    ]);
  });

  it("assigns operator constants from tables in the configuration", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nCONSTANT F(_)\nVARIABLE x\nInit == x = 0\nNext == x' = F(x)\nInv == x /= 2\n====",
      config: "INIT Init\nNEXT Next\nCONSTANT\n  F(0) = 1\n  F(1) = 2\n  F(2) = 2\nINVARIANT Inv",
    });
    expect([result.status, result.violation?.trace.map((step) => step.state.x)]).toEqual([
      "invariant-violation",
      [0, 1, 2],
    ]);
  });

  it("converts values to JSON like TLC's Json module", async () => {
    const assumptions = [
      'ToJson(<<3, 2, 1>>) = "[3,2,1]"',
      'ToJson({3, 2, 1}) = "[1,2,3]"',
      'ToJsonObject([a |-> TRUE, b |-> FALSE]) = "{\\"a\\":true,\\"b\\":false}"',
      'ToJson(3 :> "c" @@ 2 :> "b" @@ 1 :> "a") = "[\\"a\\",\\"b\\",\\"c\\"]"',
      'ToJson([n \\in {3, 2, 1} |-> 2 * n + 1]) = "[3,5,7]"',
      'ToJsonArray({}) = "[]"',
    ];
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Integers, TLC, Json\nVARIABLE x\n${assumptions.map((assumption) => `ASSUME ${assumption}`).join("\n")}\nInit == x = 0\nNext == x' = x\n====`,
      config: "INIT Init\nNEXT Next",
    });
    expect(result.status).toBe("success");
  });

  it("evaluates a constant definition with a Json operator once as it starts, as TLC does", async () => {
    const printed: string[] = [];
    const files = new Map<string, string>();
    await check({
      source:
        '---- MODULE M ----\nEXTENDS Naturals, TLC, Json\nVARIABLE x\nJ == ToJson(<<PrintT("j")>>)\nA == ToJsonArray(<<PrintT("a")>>)\nO == ToJsonObject([k |-> PrintT("o")])\nS == JsonSerialize("s.json", <<PrintT("s")>>)\nN == ndJsonSerialize("n.json", <<PrintT("n")>>)\nD == JsonDeserialize("s.json")\nE == ndJsonDeserialize("n.json")\nInit == x = 0\nNext == x < 2 /\\ PrintT(<<J, A, O, S, N, D, E>>) /\\ x\' = x + 1\n====',
      config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      onPrint: (text) => printed.push(text),
      readFile: createFileReader(files),
      writeFile: (path, content) => files.set(path, String(content)),
    });
    const tuple = '<<"[true]", "[true]", "{\\"k\\":true}", TRUE, TRUE, <<TRUE>>, <<TRUE>>>>';
    expect(printed).toEqual(['"j"', '"a"', '"o"', '"s"', '"n"', tuple, tuple]);
  });

  it("evaluates a constant definition with IOUtils' Serialize once as it starts, as TLC does", async () => {
    const printed: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS Naturals, TLC, IOUtils\nVARIABLE x\nW == Serialize(<<PrintT("w")>>, "w.json", [format |-> "NDJSON", charset |-> "UTF-8", openOptions |-> <<"WRITE", "CREATE", "APPEND">>])\nInit == x = 0\nNext == x < 2 /\\ PrintT(W) /\\ x\' = x + 1\n====',
      config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      onPrint: (text) => printed.push(text),
      loadModule: (name) =>
        name === "IOUtils"
          ? "---- MODULE IOUtils ----\nLOCAL INSTANCE Integers\nSerialize(value, dest, options) ==\n  CHOOSE r \\in [exitValue : Int, stdout : STRING, stderr : STRING] : TRUE\n===="
          : undefined,
      readFile: () => undefined,
      writeFile: () => {},
    });
    expect(printed).toEqual(['"w"', "TRUE", "TRUE"]);
  });

  it.each([
    [
      "VARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == y < 3 /\\ y' = y + 1 /\\ x' = x\nInv == $S",
      "INVARIANT Inv",
      "abcdefghij\n0\n0\n0\n0\n",
    ],
    [
      "VARIABLE x\nInit == x = 0 /\\ $S\nNext == x < 2 /\\ x' = x + 1 /\\ $S",
      "",
      "abcdefghij\n0\n0\n1\n",
    ],
  ])(
    "appends with IOUtils' Serialize at each evaluation, as TLC does: %s",
    async (definitions, config, content) => {
      const files = new Map([["old.json", "abcdefghij\n"]]);
      await check({
        source: `---- MODULE M ----\nEXTENDS Integers, IOUtils\n${definitions.replaceAll("$S", 'Serialize(<<x>>, "old.json", [format |-> "NDJSON", charset |-> "UTF-8", openOptions |-> <<"APPEND">>])')}\n====`,
        config: `INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE\n${config}`,
        loadModule: (name) =>
          name === "IOUtils"
            ? "---- MODULE IOUtils ----\nLOCAL INSTANCE Integers\nSerialize(value, dest, options) ==\n  CHOOSE r \\in [exitValue : Int, stdout : STRING, stderr : STRING] : TRUE\n===="
            : undefined,
        readFile: createFileReader(files),
        writeFile: createFileWriter(files),
      });
      expect(files.get("old.json")).toBe(content);
    },
  );

  const checkSerialize = (
    payload: string,
    path: string,
    openOptions: string,
    files: Map<string, string>,
    maxSetSize?: number,
  ) =>
    check({
      source: `---- MODULE M ----\nEXTENDS Integers, TLC, IOUtils\nVARIABLE x\nInit == x = 0 /\\ Serialize(<<${payload}>>, "${path}", [format |-> "NDJSON", charset |-> "UTF-8", openOptions |-> <<${openOptions}>>])\nNext == x' = x\n====`,
      config: "INIT Init\nNEXT Next",
      isTool: true,
      maxSetSize,
      loadModule: (name) =>
        name === "IOUtils"
          ? "---- MODULE IOUtils ----\nLOCAL INSTANCE Integers\nSerialize(value, dest, options) ==\n  CHOOSE r \\in [exitValue : Int, stdout : STRING, stderr : STRING] : TRUE\n===="
          : undefined,
      readFile: createFileReader(files),
      writeFile: createFileWriter(files),
    });

  const getSerializeError = (result: CheckResult) => {
    const text = result.failure?.toolMessage ?? "";
    const marker = "but it produced the following error:\n";
    return text.slice(text.indexOf(marker) + marker.length);
  };

  it.each([
    [
      "1, {<<>>, 0}",
      '"CREATE"',
      "util.Assert$TLCRuntimeException: Attempted to compare integer 0 with non-integer:\n<<>>",
    ],
    [
      "Nat",
      '"CREATE"',
      "java.io.IOException: Cannot convert value: unsupported value type tlc2.value.impl.UserValue",
    ],
    [
      "[s \\in SUBSET {1} |-> 1 \\div 0]",
      '"CREATE"',
      "tlc2.tool.EvalException: @!@!@STARTMSG 2179:0 @!@!@\nThe second argument of \\div is 0.\n@!@!@ENDMSG 2179 @!@!@",
    ],
    [
      "[s \\in SUBSET {1} |-> CHOOSE m \\in {} : TRUE]",
      '"CREATE"',
      "util.Assert$TLCDetailedRuntimeException: Attempted to compute the value of an expression of form\nCHOOSE x \\in S: P, but no element of S satisfied P.\nline 4, col 52 to line 4, col 73 of module M",
    ],
    [
      '[s \\in SUBSET {1} |-> 1 .. "a"]',
      '"CREATE"',
      "util.Assert$TLCRuntimeException: @!@!@STARTMSG 2154:0 @!@!@\nAttempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),\nbut it produced the following error:\nCannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue\n@!@!@ENDMSG 2154 @!@!@",
    ],
    [
      "{<<>>, 0}",
      '"BOGUS"',
      "java.lang.IllegalArgumentException: No enum constant java.nio.file.StandardOpenOption.BOGUS",
    ],
    ["{<<>>, 0}", '"WRITE"', "java.nio.file.NoSuchFileException: s.json"],
  ])(
    "opens the file before it converts <<%s>> with <<%s>>, and names the class of what fails, as TLC's textSerialize does",
    async (payload, openOptions, error) => {
      const result = await checkSerialize(payload, "s.json", openOptions, new Map());
      expect(getSerializeError(result)).toBe(`${error}\n@!@!@ENDMSG 2154 @!@!@`);
    },
  );

  it("names the WrongInvocationException of a set past -maxSetSize, as TLC's textSerialize does", async () => {
    const result = await checkSerialize(
      "[{1, 2, 3, 4} -> {1, 2, 3}]",
      "s.json",
      '"CREATE"',
      new Map(),
      10,
    );
    expect(getSerializeError(result)).toBe(
      "util.WrongInvocationException: Attempted to construct a set with too many elements (>10).\n@!@!@ENDMSG 2154 @!@!@",
    );
  });

  it.each([
    ["s.json", '"CREATE"', "1\n"],
    ["old.json", '"WRITE"', "1\ncdefghij\n"],
    ["old.json", '"WRITE", "TRUNCATE_EXISTING"', "1\n"],
    ["old.json", '"APPEND"', "abcdefghij\n1\n1\n"],
  ])(
    "keeps the lines converted before a failure in %s with <<%s>>, as TLC's textSerialize does",
    async (path, openOptions, content) => {
      const files = new Map([["old.json", "abcdefghij\n"]]);
      await checkSerialize("1, {<<>>, 0}", path, openOptions, files);
      expect(files.get(path)).toBe(content);
    },
  );

  it.each([
    ["1", '"WRITE"', "c3a9c3a9c3a9", "310ac3a9c3a9"],
    ["12", '"WRITE"', "c3a9c3a9c3a9", "31320aa9c3a9"],
    ["1, 2", '"WRITE"', "c3a9c3a9c3a9", "310a320ac3a9"],
    ['"abcdefg"', '"WRITE"', "c3a9c3a9c3a9", "2261626364656667220a"],
    ["1", '"APPEND"', "c3a9c3a9c3a9", "c3a9c3a9c3a9310a"],
    ["1", '"APPEND"', "ff", "ff310a"],
    ["1", '"WRITE"', "ffffffff", "310affff"],
    ["1", '"WRITE", "TRUNCATE_EXISTING"', "c3a9c3a9c3a9", "310a"],
  ])(
    "writes the lines of <<%s>> with <<%s>> to a file of bytes %s byte by byte, as TLC's textSerialize does",
    async (payload, openOptions, existing, expected) => {
      let written = "";
      await check({
        source: `---- MODULE M ----\nEXTENDS Integers, TLC, IOUtils\nVARIABLE x\nInit == x = 0 /\\ Serialize(<<${payload}>>, "out.txt", [format |-> "NDJSON", charset |-> "UTF-8", openOptions |-> <<${openOptions}>>])\nNext == x' = x\n====`,
        config: "INIT Init\nNEXT Next",
        loadModule: (name) =>
          name === "IOUtils"
            ? "---- MODULE IOUtils ----\nLOCAL INSTANCE Integers\nSerialize(value, dest, options) ==\n  CHOOSE r \\in [exitValue : Int, stdout : STRING, stderr : STRING] : TRUE\n===="
            : undefined,
        readFile: () => Buffer.from(existing, "hex"),
        writeFile: (_path, content) => {
          written = Buffer.from(content).toString("hex");
        },
      });
      expect(written).toBe(expected);
    },
  );

  it("reads and writes a file again at each reference to a LET definition, as TLC does", async () => {
    const printed: string[] = [];
    const files = new Map<string, string>();
    await check({
      source:
        '---- MODULE M ----\nEXTENDS Naturals, TLC, Json\nVARIABLE x\nInit == x = 0 /\\ JsonSerialize("f.json", <<0>>)\nNext == /\\ x < 2\n        /\\ LET d == JsonDeserialize("f.json")\n               w == JsonSerialize("f.json", <<x>>)\n           IN /\\ w\n              /\\ PrintT(d)\n              /\\ JsonSerialize("f.json", <<99>>)\n              /\\ PrintT(d)\n              /\\ w\n              /\\ PrintT(JsonDeserialize("f.json"))\n        /\\ x\' = x + 1\n====',
      config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      onPrint: (text) => printed.push(text),
      readFile: createFileReader(files),
      writeFile: (path, content) => files.set(path, String(content)),
    });
    expect(printed).toEqual(["<<0>>", "<<99>>", "<<0>>", "<<1>>", "<<99>>", "<<1>>"]);
  });

  it("keeps the value JsonDeserialize read as TLC starts after the file changes, as TLC does", async () => {
    const printed: string[] = [];
    const files = new Map<string, string>();
    await check({
      source:
        '---- MODULE M ----\nEXTENDS Naturals, TLC, Json\nVARIABLE x\nW == JsonSerialize("f.json", <<0>>)\nD == JsonDeserialize("f.json")\nInit == x = 0 /\\ W\nNext == x < 2 /\\ JsonSerialize("f.json", <<x + 10>>) /\\ PrintT(D) /\\ PrintT(JsonDeserialize("f.json")) /\\ x\' = x + 1\n====',
      config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      onPrint: (text) => printed.push(text),
      readFile: createFileReader(files),
      writeFile: (path, content) => files.set(path, String(content)),
    });
    expect(printed).toEqual(["<<0>>", "<<10>>", "<<0>>", "<<11>>"]);
  });

  it("replaces malformed UTF-8 in a Json file as Java's FileReader does", async () => {
    const encoder = new TextEncoder();
    const contents = [
      [0xc3, 0x28],
      [0xe2, 0x82],
      [0xf0, 0x9f, 0x98],
      [0xed, 0xa0, 0x80],
      [0xc0, 0xaf],
      [0xf4, 0x90, 0x80, 0x80],
      [0xff],
      [0x80, 0xbf],
      [0xe0, 0x80, 0xaf],
      [0xf8, 0x88, 0x80, 0x80, 0x80],
      [0xed, 0xa0],
      [0xf0, 0x9f, 0x98, 0x80],
      [0xe2, 0x82, 0xac],
      [0xc3, 0xa9],
    ].map((sequence) => [...encoder.encode('{"k":"<'), ...sequence, ...encoder.encode('>"}')]);
    const files = new Map([
      ...contents.map((content, index): [string, Uint8Array] => [
        `bad${index}.json`,
        Uint8Array.from(content),
      ]),
      ["lines.ndjson", Uint8Array.from(contents.flatMap((content) => [...content, 0x0a]))],
    ]);
    const reads = contents.map((_content, index) => `JsonDeserialize("bad${index}.json").k`);
    const printed: string[] = [];
    await check({
      source: `---- MODULE M ----\nEXTENDS Json, Sequences, TLC\nS == << ${reads.join(",\n  ")} >>\nN == ndJsonDeserialize("lines.ndjson")\nASSUME PrintT(S)\nASSUME PrintT([i \\in DOMAIN S |-> Len(S[i])])\nASSUME PrintT([i \\in DOMAIN N |-> N[i].k = S[i]])\n====\n`,
      config: "",
      onPrint: (text) => printed.push(text),
      readFile: (path) => files.get(path),
    });
    expect(printed).toEqual([
      '<< "<�(>",\n   "<�>",\n   "<�>",\n   "<�>",\n   "<��>",\n   "<����>",\n   "<�>",\n   "<��>",\n   "<���>",\n   "<�����>",\n   "<�>",\n   "<😀>",\n   "<€>",\n   "<é>" >>',
      "<<4, 3, 3, 3, 4, 6, 3, 4, 5, 7, 3, 4, 3, 3>>",
      `<< ${Array(14).fill("TRUE").join(",\n   ")} >>`,
    ]);
  });

  it.each([
    ['JsonSerialize("old.json", <<[s \\in SUBSET {1} |-> 1 \\div 0]>>)', "old.json", ""],
    ['ndJsonSerialize("old.json", <<1, [s \\in SUBSET {1} |-> 1 \\div 0], 2>>)', "old.json", "1\n"],
    ['JsonSerialize("s.json", [a |-> Nat])', "s.json", ""],
    ['ndJsonSerialize("s.json", <<[a |-> 1], {<<>>, 0}>>)', "s.json", '{"a":1}\n'],
  ])(
    "opens the file before %s converts the value, and keeps the lines it converted, as TLC does",
    async (expression, path, contents) => {
      const files = new Map([["old.json", "abcdefghij\n"]]);
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals, TLC, Json\nVARIABLE x\nInit == x = 0 /\\ ${expression}\nNext == x' = x\n====`,
        config: "INIT Init\nNEXT Next",
        readFile: createFileReader(files),
        writeFile: (path, content) => files.set(path, String(content)),
      });
      expect([result.status, files.get(path)]).toEqual(["error", contents]);
    },
  );

  const checkLazyTuple = async (expression: string) => {
    const printed: string[] = [];
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Integers, Sequences, TLC, Json\nVARIABLE x\nInit == x = 0\nNext == x = 0 /\\ x' = 1 /\\ PrintT(${expression})\n====`,
      config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      onPrint: (text) => printed.push(text),
    });
    return { result, printed };
  };

  it.each([
    ["Len([n \\in UNION {1..1, {3}} |-> PrintT(n)])", ["1", "1", "3"]],
    [
      "LET F == [n \\in UNION {1..1, {2}} |-> PrintT(n)] IN Len(F) + Len(F)",
      ["1", "2", "1", "2", "4"],
    ],
    [
      'JsonSerialize("f.json", [n \\in UNION {1..1, {2}} |-> PrintT(n)])',
      ["1", "2", "1", "2", "TRUE"],
    ],
  ])(
    "applies a lazy function at 1, 2, ... to convert it to a tuple, and keeps none of it, as TLC's FcnLambdaValue#toTuple does, in %s",
    async (expression, printed) => {
      expect((await checkLazyTuple(expression)).printed).toEqual(printed);
    },
  );

  it.each([
    ["f == [y \\in SUBSET {1, 2} |-> g[y]]", "f[{1}]"],
    ["F(h) == [y \\in SUBSET {1, 2} |-> h[y]]\nG == F(g)", "G[{1}]"],
  ])(
    "applies %s only at the key %s applies, as TLC keeps a function over SUBSET a FcnLambdaValue",
    async (definitions, application) => {
      const printed: string[] = [];
      await check({
        source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\ng == [s \\in SUBSET {1, 2} |-> PrintT(s)]\n${definitions}\nInit == x = 0\nNext == x = 0 /\\ x' = 1 /\\ PrintT(<<"next", ${application}>>)\n====`,
        config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
        onPrint: (text) => printed.push(text),
      });
      expect(printed).toEqual(["{1}", '<<"next", TRUE>>']);
    },
  );

  it("evaluates the body of a lazy function a state holds once per key of each successor, as TLC's fingerprint converts it and later reads go through the record", async () => {
    const printed: string[] = [];
    await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLES x, y\nInit == x = 0 /\\ y = [s \\in SUBSET {1, 2} |-> 0]\nNext == x < 2 /\\ x' = x + 1 /\\ \\E i \\in {1, 2} : y' = [s \\in SUBSET {1, 2} |-> IF PrintT(<<x, i, s>>) THEN y[s] + 1 ELSE 0]\nInv == \\A s \\in SUBSET {1, 2} : y[s] < 3\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toEqual([
      "<<0, 1, {}>>",
      "<<0, 1, {1}>>",
      "<<0, 1, {2}>>",
      "<<0, 1, {1, 2}>>",
      "<<0, 2, {}>>",
      "<<0, 2, {1}>>",
      "<<0, 2, {2}>>",
      "<<0, 2, {1, 2}>>",
      "<<1, 1, {}>>",
      "<<1, 1, {1}>>",
      "<<1, 1, {2}>>",
      "<<1, 1, {1, 2}>>",
      "<<1, 2, {}>>",
      "<<1, 2, {1}>>",
      "<<1, 2, {2}>>",
      "<<1, 2, {1, 2}>>",
    ]);
  });

  it("converts a lazy function over sets to a tuple without applying it, as TLC's FcnLambdaValue#toTuple does", async () => {
    expect(
      (await checkLazyTuple('ndJsonSerialize("n.json", [s \\in SUBSET {1} |-> 1 \\div x])')).result
        .failure?.message,
    ).toBe(
      "The second argument of ndJsonSerialize should be a sequence, but instead it is:\n[s \\in {{}, {1}} |-> <expression line 5, col 83 to line 5, col 90 of module M>]",
    );
  });

  it.each([
    ["LET F == [n \\in UNION {1..1, {3}} |-> PrintT(n)] IN <<1, 2>> # F", ["1", "1", "3", "TRUE"]],
    [
      "LET F == [n \\in UNION {1..1, {2}} |-> Print(n, n)] IN <<1, 2>> = F /\\ <<1, 2>> = F",
      ["1  1", "2  2", "1  1", "2  2", "TRUE"],
    ],
    [
      "LET F == [n \\in UNION {1..1, {2}} |-> Print(n, n)] IN <<1, 2>> = F /\\ F = <<1, 2>> /\\ <<1, 2>> = F",
      ["1  1", "2  2", "1  1", "2  2", "TRUE"],
    ],
    [
      "LET F == [n \\in UNION {1..1, {2}} |-> Print(n, n)] IN <<1, 3>> # F /\\ <<1, 2>> = F",
      ["1  1", "2  2", "1  1", "2  2", "TRUE"],
    ],
  ])(
    "applies a lazy function again each time a tuple is compared with it, as TLC's TupleValue#equals does, in %s",
    async (expression, printed) => {
      expect((await checkLazyTuple(expression)).printed).toEqual(printed);
    },
  );

  it.each([
    [
      "a LAMBDA argument",
      "LET Tup(P(_)) == [n \\in UNION {1..1, {2}} |-> IF P(n) THEN n ELSE 0] IN LET F == Tup(LAMBDA n : PrintT(n)) IN <<1, 2>> = F /\\ <<1, 2>> = F",
      ["1", "2", "1", "2", "TRUE"],
    ],
    [
      "a LET operator",
      "LET P(n) == PrintT(n) IN LET F == [n \\in UNION {1..1, {2}} |-> IF P(n) THEN n ELSE 0] IN <<1, 2>> = F /\\ <<1, 2>> = F",
      ["1", "2", "1", "2", "TRUE"],
    ],
    [
      "an operator argument",
      "LET Op(h) == [n \\in UNION {1..1, {2}} |-> h[{}] /\\ n = 1] IN LET F == Op([s \\in SUBSET {1} |-> PrintT(s)]) IN <<TRUE, FALSE>> = F /\\ <<TRUE, FALSE>> = F",
      ["{}", "{}", "{}", "{}", "TRUE"],
    ],
    [
      "a LAMBDA argument of a recursive function",
      "LET Op(P(_)) == LET r[n \\in 1..2] == IF n = 1 THEN P(n) ELSE r[n - 1] IN r IN LET F == Op(LAMBDA n : PrintT(n)) IN <<TRUE, TRUE>> = F /\\ <<TRUE, TRUE>> = F",
      ["1", "1", "1", "1", "TRUE"],
    ],
  ])(
    "applies a lazy function again each time a tuple is compared with it, as TLC does, when its body prints through %s",
    async (_name, expression, printed) => {
      expect((await checkLazyTuple(expression)).printed).toEqual(printed);
    },
  );

  it("keeps the tuple of a lazy function whose body names a LET definition when nothing in the spec prints or draws", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, Sequences\nVARIABLE x\nRECURSIVE Nest(_)\nNest(k) == IF k = 0 THEN <<0, 0>> ELSE LET g == Nest(k - 1) f[i \\in 1..2] == IF i = 0 THEN f[i] ELSE Len(g) IN f\nInit == x = Len(Nest(26))\nNext == UNCHANGED x\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect([result.status, result.distinctStates]).toEqual(["success", 1]);
  });

  it("keeps the tuple of a lazy function whose body names a LET definition when the only effects are an unrelated Assert and a TLCGet constraint", async () => {
    const result = await check({
      source:
        '---- MODULE M ----\nEXTENDS Naturals, Sequences, TLC\nVARIABLE x\nRECURSIVE Nest(_)\nNest(k) == IF k = 0 THEN <<0, 0>> ELSE LET g == Nest(k - 1) f[i \\in 1..2] == IF i = 0 THEN f[i] ELSE Len(g) IN f\nInit == x = Len(Nest(26))\nNext == Assert(x = 2, "x is 2") /\\ UNCHANGED x\nDepth == TLCGet("level") < 5\n====',
      config: "INIT Init\nNEXT Next\nCONSTRAINT Depth",
    });
    expect([result.status, result.distinctStates]).toEqual(["success", 1]);
  });

  it("applies a lazy function again each time a tuple is compared with it when a definition that prints is passed to it by name", async () => {
    const printed: string[] = [];
    await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nShow(n) == PrintT(n)\nTup(P(_)) == [n \\in UNION {1..1, {2}} |-> IF P(n) THEN n ELSE 0]\nInit == x = 0 /\\ LET F == Tup(Show) IN <<1, 2>> = F /\\ <<1, 2>> = F\nNext == UNCHANGED x\n====",
      config: "INIT Init\nNEXT Next",
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toEqual(["1", "2", "1", "2"]);
  });

  it("applies a lazy function again each time a tuple is compared with it when its body names a LET definition that holds a lazy function TLC evaluates once", async () => {
    const printed: string[] = [];
    await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nG == [s \\in SUBSET {1} |-> PrintT(s)]\nInit == x = 0 /\\ LET g == G IN LET F == [n \\in UNION {1..1, {2}} |-> g[{}] /\\ n = 1] IN <<TRUE, FALSE>> = F /\\ <<TRUE, FALSE>> = F\nNext == UNCHANGED x\n====",
      config: "INIT Init\nNEXT Next",
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toEqual(["{}", "{}", "{}", "{}"]);
  });

  it("applies a lazy function again each time a tuple is compared with it when only an ASSUME prints, through a LAMBDA argument", async () => {
    const printed: string[] = [];
    await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, TLC\nTup(P(_)) == [n \\in UNION {1..1, {2}} |-> IF P(n) THEN n ELSE 0]\nASSUME LET F == Tup(LAMBDA n : PrintT(n)) IN <<1, 2>> = F /\\ <<1, 2>> = F\nVARIABLE x\nInit == x = 0\nNext == UNCHANGED x\n====",
      config: "INIT Init\nNEXT Next",
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toEqual(["1", "2", "1", "2"]);
  });

  it("applies a lazy function a tuple is compared with again when TLC replays its error", async () => {
    const lazyTuple = await checkLazyTuple(
      "<<1, 2>> # [n \\in UNION {1..1, {3}} |-> PrintT(n) /\\ 1 \\div (n - 3) = 0]",
    );
    expect([lazyTuple.printed, lazyTuple.result.failure?.traceOutput]).toEqual([
      ["1", "1", "3"],
      ["1", "1", "3"],
    ]);
  });

  it.each([
    [
      "<<1, 2>> # [n \\in UNION {1..1, {3}} |-> 1 \\div (n - 1)]",
      "The second argument of \\div is 0.",
    ],
    [
      '<<1, "a">> # [n \\in UNION {1..1, {2}} |-> n]',
      'TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: Attempted to check equality of string "a" with non-string:\n2',
    ],
  ])(
    "fails as TLC does when a tuple is compared with a lazy function whose body has no effect, in %s",
    async (expression, message) => {
      expect((await checkLazyTuple(expression)).result.failure?.message).toBe(message);
    },
  );

  it("counts each application of a recursive function a tuple is compared with, as TLC's TupleValue#equals does", async () => {
    const lines = await getCoverageLines(
      "---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = x /\\ LET g[i \\in 1..2] == IF i = 1 THEN 1 ELSE g[i - 1] + 1 IN <<1, 2>> = g /\\ <<1, 2>> = g\nInv == TRUE\n====",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    );
    expect(lines?.[1]).toEqual([
      "line 5, col 9 to line 5, col 14 of module M: 1",
      "line 5, col 23 to line 5, col 72 of module M: 1:4",
      "|line 5, col 40 to line 5, col 72 of module M: 6",
      "||line 5, col 43 to line 5, col 47 of module M: 6",
      "||line 5, col 61 to line 5, col 72 of module M: 2",
      "|line 5, col 31 to line 5, col 34 of module M: 1",
      "line 5, col 77 to line 5, col 104 of module M: 1",
    ]);
  });

  it.each([
    [
      "LET F == [n \\in UNION {1..1, {3}} |-> Print(n, n)] IN F \\in {<<1, 2>>}",
      ["1  1", "1  1", "3  3", "FALSE"],
    ],
    [
      "LET F == [n \\in UNION {1..1, {3}} |-> Print(n, n)] IN F \\in {<<3>>, <<1, 2>>}",
      ["1  1", "1  1", "3  3", "FALSE"],
    ],
    [
      "LET F == [n \\in UNION {1..1, {2}} |-> Print(n, n)] IN F \\in {<<1, 2>>} /\\ F \\in {<<1, 2>>}",
      ["1  1", "2  2", "1  1", "2  2", "TRUE"],
    ],
    [
      "LET F == [n \\in UNION {1..1, {3}} |-> Print(n, n)] IN F \\notin {<<3>>} \\cup {<<1, 2>>}",
      ["1  1", "1  1", "3  3", "TRUE"],
    ],
  ])(
    "compares each member of an unsorted set with a lazy function, as TLC's ValueVec#search does, in %s",
    async (expression, printed) => {
      expect((await checkLazyTuple(expression)).printed).toEqual(printed);
    },
  );

  it.each([["{<<1, 2>>}"], ["{<<1, 2>>, <<3>>}"]])(
    "compares a lazy function with the members of the sorted set %s, as TLC's ValueVec#search does",
    async (set) => {
      const printed: string[] = [];
      await check({
        source: `---- MODULE M ----\nEXTENDS Integers, Sequences, TLC\nVARIABLE x\nInit == x = ${set}\nNext == x' = x /\\ PrintT(LET F == [n \\in UNION {1..1, {3}} |-> Print(n, n)] IN F \\notin x)\n====`,
        config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
        onPrint: (text) => printed.push(text),
      });
      expect(printed).toEqual(["1  1", "3  3", "TRUE"]);
    },
  );

  it("implements the TLCExt operators", async () => {
    const results = await Promise.all(
      ["Extensions", "ExtensionsShort"].map((name) => checkFixture("runtime", "Extensions", name)),
    );
    expect(
      results.map((result) => [result.status, result.generatedStates, result.distinctStates]),
    ).toEqual([
      ["success", 4, 4],
      ["invariant-violation", 3, 3],
    ]);
  });

  it("rejects comparisons of differently-typed model values", async () => {
    const result = await check({
      source:
        '---- MODULE M ----\nEXTENDS TLCExt\nVARIABLE v\nInit == v = {TLCModelValue("A_a"), TLCModelValue("B_a")}\nNext == UNCHANGED v\n====',
      config: "INIT Init\nNEXT Next",
    });
    expect(result.failure?.message).toContain(
      "Attempted to compare the differently-typed model values B_a and A_a",
    );
  });

  it("explores the mutex state space", async () => {
    const result = await checkFixture("mutex", "Mutex");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([18, 10, 4]);
  });

  it("explores a commit protocol over model values", async () => {
    const result = await checkFixture("commit", "Commit");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([890, 251, 11]);
  });

  it("stops exploring states that fail a constraint", async () => {
    const result = await checkFixture("queue", "Queue");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([181, 105, 9]);
  });

  it("reports the shortest trace to an invariant violation", async () => {
    const result = await checkFixture("water-jugs", "WaterJugs");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.name).toBe("GoalNotReached");
    const trace = result.violation?.trace ?? [];
    expect(trace).toHaveLength(7);
    expect(trace[0].action).toBeUndefined();
    expect(formatValue(trace[6].state.large)).toBe("4");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([73, 14, 7]);
  });

  it("reports a membership invariant that one changed entry violates", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLE f\nInit == f = [p \\in 1..2 |-> [q \\in 1..2 |-> 0]]\nNext == \\E p, q \\in 1..2 : f' = [f EXCEPT ![p][q] = @ + 1]\nTypeOK == f \\in [1..2 -> [1..2 -> 0..2]]\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT TypeOK",
    });
    expect(result.violation?.name).toBe("TypeOK");
    const trace = result.violation?.trace ?? [];
    expect(formatValue(trace[trace.length - 1].state.f)).toBe("<<<<3, 0>>, <<0, 0>>>>");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([22, 16, 4]);
  });

  it("labels each step with the action TLC splits the next-state relation into", async () => {
    const getLabels = async (definitions: string, config = "INIT Init\nNEXT Next") => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == x = 0\n${definitions}\nInv == x < 2\n====`,
        config: `${config}\nINVARIANT Inv`,
      });
      return result.violation?.trace.map((step) => step.label);
    };
    expect(await getLabels("A(i) == x' = x + i\nNext == \\E i \\in {1, 2} : A(i)")).toEqual([
      undefined,
      "A(2) line 5, col 9 to line 5, col 18 of module M",
    ]);
    expect(await getLabels("Next == x' = x + 1 \\/ x' = x + 2")).toEqual([
      undefined,
      "Next line 5, col 23 to line 5, col 32 of module M",
    ]);
    expect(await getLabels("Spec == Init /\\ [][x' = x + 1]_x", "SPECIFICATION Spec")).toEqual([
      undefined,
      "Action line 5, col 20 to line 5, col 29 of module M",
      "Action line 5, col 20 to line 5, col 29 of module M",
    ]);
  });

  it("labels steps after evaluating the initial predicate again like TLC", async () => {
    const result = await checkFixture("tlc-get-non-determinism", "TLCGetNonDeterminism");
    expect(result.violation?.trace.map((step) => step.label)).toEqual([
      undefined,
      ...Array.from(
        { length: 3 },
        () => "Next line 23, col 9 to line 26, col 25 of module TLCGetNonDeterminism",
      ),
    ]);
  });

  it("counts the states left on the queue when a violation stops the search", async () => {
    const result = await checkFixture("water-jugs", "WaterJugs");
    expect(result.queuedStates).toBe(1);
  });

  it("reports deadlock with the trace that reaches it", async () => {
    const result = await checkFixture("counter", "Counter");
    expect(result.status).toBe("deadlock");
    expect(result.violation?.trace.map((step) => step.action)).toEqual([
      undefined,
      "Increment",
      "Increment",
      "Increment",
    ]);
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([4, 4, 4]);
  });

  it("evaluates the prime applied as an operator as TLC does", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ '(x) = x + 1\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect(result.status).toBe("deadlock");
    expect([result.generatedStates, result.distinctStates]).toEqual([3, 3]);
  });

  it("selects a subexpression of an operator symbol's definition as TLC does", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\na ^# == a = 1\na (+) b == <<a, b + 1>>\nVARIABLE x\nInit == x = 0\nNext == x' = x\nASSUME ^#(2)!1 = 2\nASSUME (+)(1, 2)!>> = 3\nASSUME \\oplus(4, 5)!<< = 4\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates]).toEqual([2, 1]);
  });

  it("stops computing ENABLED at the first successor like TLC", async () => {
    const printed: string[] = [];
    const result = await check({
      source:
        '---- MODULE M ----\nEXTENDS TLC\nVARIABLE x\nInit == x = 0\nNext == UNCHANGED x\nInv == ENABLED (x\' = 1 \\/ (PrintT("second") /\\ Assert(FALSE, "boom")))\n====',
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      onPrint: (text) => printed.push(text),
    });
    expect(result.status).toBe("success");
    expect(printed).toEqual([]);
  });

  it("stops branching on initial conjuncts once every variable is assigned", async () => {
    const result = await checkFixture("initial-states", "InitialStates");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([5, 2, 1]);
  });

  it("assigns variables through definitions, parameters, function applications, and <<A>>_v", async () => {
    const result = await checkFixture("assignments", "Assignments");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([98, 24, 5]);
  });

  it("assigns a primed variable passed as an operator argument", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x, y\nSend(p, old, new) == new = p\nInit == x = 0 /\\ y = 0\nNext == \\E p \\in {1, 2} : Send(p, x, x') /\\ y' = y\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "success",
      7,
      3,
    ]);
  });

  it("reduces states under a symmetry set", async () => {
    const result = await checkFixture("symmetry", "Symmetry");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([42, 10, 7]);
  });

  it("reduces a set of records that a permutation partly moves", async () => {
    const result = await checkFixture("symmetry", "SymmetricMessages");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([641, 80, 9]);
  });

  it.each([
    ["EqualStoredRecord", 'Attempted to compare an integer with non-integer:\n"a"'],
    ["EqualStoredNested", 'Attempted to compare an integer with non-integer:\n"a"'],
    ["EqualStoredSet", "Attempted to check equality of the set {1, 2} with the value:\n<<1, 2>>"],
  ])("fails to compare stored values of different types in %s like TLC", async (name, message) => {
    const result = await checkFixture("codegen", name);
    expect(result.status).toBe("error");
    expect(result.failure?.message).toContain(message);
    expect([result.generatedStates, result.distinctStates]).toEqual([1, 1]);
  });

  it("checks liveness on the symmetry-reduced graph", async () => {
    const result = await checkFixture("symmetry", "SymmetricLiveness");
    expect(result.status).toBe("liveness-violation");
    expect(result.violation?.name).toBe("Live");
    expect(result.violation?.trace.map((step) => step.state.x)).toMatchObject([
      { kind: "ModelValue", name: "m1" },
    ]);
  });

  it("rejects a symmetry that names a constant", async () => {
    const result = checkModule("CONSTANT P", "CONSTANT P = {p1, p2}\nSYMMETRY P");
    await expect(result).rejects.toThrow(TlaEvaluationError);
    await expect(result).rejects.toThrow(
      "The symmetry function P must specify a set of permutations.",
    );
  });

  it("rebuilds a step under symmetry from the first action that takes it as TLC does", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, Sequences, TLC\nCONSTANTS p1, p2\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nA1 == y' = 1 /\\ x' = x\nA2 == y' = Head(<<>>) /\\ x' = x\nSpec == Init /\\ [][A1 \\/ A2]_<<x, y>>\nProp == [][x' # x]_<<x, y>>\nSym == Permutations({p1, p2})\n====",
      config: "CONSTANTS p1 = p1 p2 = p2\nSPECIFICATION Spec\nPROPERTY Prop\nSYMMETRY Sym",
    });
    expect(result.status).toBe("liveness-violation");
    expect(result.violation?.trace.map((step) => [step.action, formatValue(step.state.y)])).toEqual(
      [
        [undefined, "0"],
        ["A1", "1"],
      ],
    );
  });

  it.each([
    ["<>(\\E k \\in {} : x = 0) /\\ <>(\\E k \\in {} : x = 0)", 1],
    ["<>(IF TRUE THEN TRUE ELSE x = 0) /\\ <>(IF TRUE THEN TRUE ELSE x = 0)", 1],
    [
      "<>(\\E k \\in {1} : \\E j \\in {} : x = k) /\\ <>(\\E k \\in {1} : \\E j \\in {} : x = k)",
      2,
    ],
  ])("finds the branches of %s like TLC", async (property, branches) => {
    const progress: CheckProgress[] = [];
    await check({
      source: `---- MODULE M ----\nVARIABLE x\nInit == x = 0\nNext == x' = x\nProp == ${property}\n====`,
      config: "INIT Init\nNEXT Next\nPROPERTY Prop",
      onProgress: (event) => {
        if (event.kind === "liveness-prepared") progress.push(event);
      },
    });
    expect(progress).toEqual([{ kind: "liveness-prepared", branches }]);
  });

  it("warns about a permuted set with fewer than two elements", async () => {
    const warnings: CheckProgress[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS TLC\nCONSTANTS S, T\nVARIABLE x\nInit == x = 0\nNext == x' = x\nSym == Permutations(S) \\cup Permutations(T)\n====",
      config: "CONSTANTS S = {s1, s2}\nT = {t1}\nINIT Init\nNEXT Next\nSYMMETRY Sym",
      onProgress: (progress) => {
        if (progress.kind === "warning") warnings.push(progress);
      },
    });
    expect(result.status).toBe("success");
    expect(warnings).toEqual([
      {
        kind: "warning",
        code: 2300,
        text: "The set T has been defined to be a symmetry set but contains less than two elements.",
      },
    ]);
  });

  it("names a permuted set by its configuration name when the spec supplies its own FiniteSets, as TLC does", async () => {
    const warnings: CheckProgress[] = [];
    await check({
      source:
        "---- MODULE M ----\nEXTENDS TLC\nCONSTANTS A, V, a1, v1\nVARIABLE x\nMCA == {a1}\nMCV == {v1}\nSym == Permutations(MCA) \\cup Permutations(MCV)\nInit == x = 0\nNext == x' = x\n====",
      config: "CONSTANTS a1 = a1 v1 = v1 A <- MCA V <- MCV\nINIT Init\nNEXT Next\nSYMMETRY Sym",
      loadModule: (name) =>
        name === "FiniteSets"
          ? "---- MODULE FiniteSets ----\nLOCAL INSTANCE Naturals\nLOCAL INSTANCE Sequences\nIsFiniteSet(S) == \\E seq \\in Seq(S) : \\A s \\in S : \\E n \\in 1..Len(seq) : seq[n] = s\nCardinality(S) == LET CS[T \\in SUBSET S] == IF T = {} THEN 0 ELSE 1 + CS[T \\ {CHOOSE x : x \\in T}] IN CS[S]\n===="
          : undefined,
      onProgress: (progress) => {
        if (progress.kind === "warning") warnings.push(progress);
      },
    });
    expect(warnings).toEqual([
      {
        kind: "warning",
        code: 2300,
        text: "The sets A, and V have been defined to be a symmetry set but contain less than two elements.",
      },
    ]);
  });

  it("names a permuted set with fewer than two elements by its source, with the parentheses of its operands, as TLC does", async () => {
    const warnings: CheckProgress[] = [];
    await check({
      source:
        "---- MODULE M ----\nEXTENDS TLC\nCONSTANTS a, b, c\nVARIABLE x\nInit == x \\in {a, b}\nNext == UNCHANGED x\nSym == ({( a :> b @@ b :> a )}) \\cup Permutations(({c}))\n====",
      config: "CONSTANTS a = a\nb = b\nc = c\nINIT Init\nNEXT Next\nSYMMETRY Sym",
      onProgress: (progress) => {
        if (progress.kind === "warning") warnings.push(progress);
      },
    });
    expect(warnings).toEqual([
      {
        kind: "warning",
        code: 2300,
        text: "The sets {(a:>b@@b:>a)}, and ({c}) have been defined to be a symmetry set but contain less than two elements.",
      },
    ]);
  });

  it("warns about symmetry during liveness checking whenever the configuration declares it, as TLC's Tool#hasSymmetry asks", async () => {
    const progress: CheckProgress[] = [];
    await check({
      source:
        "---- MODULE M ----\nEXTENDS TLC\nCONSTANTS a, b\nVARIABLE x\nInit == x \\in {a, b}\nNext == UNCHANGED x\nSym == Permutations({a})\nLive == <>(x = a)\n====",
      config: "CONSTANTS a = a\nb = b\nINIT Init\nNEXT Next\nSYMMETRY Sym\nPROPERTY Live",
      onProgress: (event) => {
        if (event.kind === "warning" || event.kind === "liveness-initializing")
          progress.push(event);
      },
    });
    expect(progress).toEqual([
      {
        kind: "warning",
        code: 2300,
        text: "The set {a} has been defined to be a symmetry set but contains less than two elements.",
      },
      { kind: "liveness-initializing", isSymmetric: true, isConstrained: false },
    ]);
  });

  it.each([
    ["no permutation", "{}", 2],
    ["one permutation it names by a definition", "Swap", 1],
  ])(
    "checks a symmetry of %s, where TLC throws an IllegalArgumentException",
    async (_title, symmetry, distinctStates) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS TLC\nCONSTANTS a, b\nVARIABLE x\nInit == x \\in {a, b}\nNext == UNCHANGED x\nSwap == {(a :> b @@ b :> a)}\nSym == ${symmetry}\n====`,
        config: "CONSTANTS a = a\nb = b\nINIT Init\nNEXT Next\nSYMMETRY Sym",
      });
      expect([result.status, result.distinctStates]).toEqual(["success", distinctStates]);
    },
  );

  it("rejects substituting a constant with a state-level definition", async () => {
    await expect(checkModule("CONSTANT C\nFoo == x", "CONSTANT C <- Foo")).rejects.toThrow(
      TlaConfigError,
    );
    expect((await checkModule("CONSTANT C\nFoo == 1", "CONSTANT C <- Foo")).status).toBe("success");
    expect(
      (await checkModule('CONSTANT C\nFoo == TLCGet("level")', "CONSTANT C <- Foo")).status,
    ).toBe("success");
    await expect(
      checkModule('CONSTANT C\nFoo == TLCGet("diameter")', "CONSTANT C <- Foo"),
    ).rejects.toThrow(TlaConfigError);
    expect(
      (await checkModule("CONSTANT C\nFoo == RandomElement({1})", "CONSTANT C <- Foo")).status,
    ).toBe("success");
  });

  it("accepts a substitute that a constant-level standard operator defines", async () => {
    const result = await check({
      source:
        '---- MODULE M ----\nEXTENDS Json\nCONSTANT C\nVARIABLE x\nTrace == JsonDeserialize("missing.json")\nInit == x = 0\nNext == x\' = x\n====',
      config: "CONSTANT C <- Trace\nINIT Init\nNEXT Next",
    });
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "success",
      2,
      1,
    ]);
  });

  const getSubstituteSource = (definitions: string) =>
    `---- MODULE M ----\nEXTENDS TLC, Naturals\nCONSTANT N\nVARIABLE y\nInit == y = 0\nNext == y' = (y + 1) % 2\n${definitions}\n====`;

  it.each([
    ['D == PrintT("D")\nASSUME N', "CONSTANT N <- D", ['"D"', '"D"']],
    ['D == PrintT("D")\nASSUME N /\\ N', "CONSTANT N <- D", ['"D"', '"D"', '"D"']],
    ['D == PrintT("D")\nInv == N', "CONSTANT N <- D\nINVARIANT Inv", ['"D"', '"D"']],
    ['D == PrintT("D")\nE == N\nASSUME E /\\ E', "CONSTANT N <- D", ['"D"', '"D"']],
    [
      'D == PrintT("D")\nInv == N /\\ y \\in {0, 1}',
      "CONSTANT N <- D\nINVARIANT Inv",
      ['"D"', '"D"', '"D"'],
    ],
    ['E == PrintT("E")\nD == E\nASSUME N', "CONSTANT N <- D", ['"E"', '"E"']],
    ['D == TLCGet("level")\nASSUME PrintT(<<"D", D, N>>)', "CONSTANT N <- D", ['<<"D", 1, 0>>']],
    [
      'D == TLCGet("level")\nInv == PrintT(<<"I", D, N>>)',
      "CONSTANT N <- D\nINVARIANT Inv",
      ['<<"I", 1, 1>>', '<<"I", 1, 2>>'],
    ],
    [
      'G(Op(_)) == Op("level")\nD == G(TLCGet)\nASSUME PrintT(<<"N", N>>)',
      "CONSTANT N <- D",
      ['<<"N", 0>>'],
    ],
    [
      'CONSTANT K\nD == PrintT("D")\nE == PrintT("E")',
      "CONSTANT N <- D\nCONSTANT K <- E",
      ['"E"', '"D"'],
    ],
    [
      'CONSTANT K\nE == PrintT("E")\nD == K\nASSUME N',
      "CONSTANT N <- D\nCONSTANT K <- E",
      ['"E"', '"E"', '"E"'],
    ],
    ['D == PrintT("D") /\\ CHOOSE v : TRUE', "CONSTANT N <- D", ['"D"', '"D"']],
    ["f[a \\in {1}] == PrintT(a)\nASSUME N[1]", "CONSTANT N <- f", ["1", "1"]],
    ['G(Op(_)) == Op("diameter")\nD == G(TLCGet)\nASSUME PrintT("A")', "CONSTANT N <- D", ['"A"']],
  ])(
    "evaluates the substitute of N in %j as TLC starts and at each reference to N, as SpecProcessor and Tool#evalAppl do",
    async (definitions, substitution, expected) => {
      const printed: string[] = [];
      const result = await check({
        source: getSubstituteSource(definitions),
        config: `INIT Init\nNEXT Next\n${substitution}`,
        onPrint: (text) => printed.push(text),
      });
      expect([printed, result.status, result.distinctStates]).toEqual([expected, "success", 2]);
    },
  );

  it.each([
    ["D == FALSE\nSpec == Init /\\ [][Next]_y /\\ N", "SPECIFICATION Spec"],
    ["D == FALSE\nSpec == Init /\\ [][Next]_y /\\ (N /\\ TRUE)", "SPECIFICATION Spec"],
    ["D == FALSE", "SPECIFICATION N"],
    ["D == FALSE\nSpec == Init /\\ [][Next]_y", "SPECIFICATION Spec\nPROPERTY N"],
    [
      "D == FALSE\nSpec == Init /\\ [][Next]_y\nProp == N /\\ y \\in Nat",
      "SPECIFICATION Spec\nPROPERTY Prop",
    ],
  ])(
    "takes the substitute of N in %j apart under %j, as SpecProcessor looks N up as the definition it names",
    async (definitions, config) => {
      await expect(
        check({ source: getSubstituteSource(definitions), config: `${config}\nCONSTANT N <- D` }),
      ).rejects.toThrow(new TlaConfigError("The spec is trivially false because FALSE is false."));
    },
  );

  it.each([
    ["D == FALSE", "INIT Init\nNEXT Next\nINVARIANT N", ["invariant-violation", "N", 0]],
    ['D == PrintT("D")', "INIT Init\nNEXT Next\nINVARIANT N", ["success", undefined, 3]],
    ["D == FALSE", "INIT Init\nNEXT Next\nCONSTRAINT N", ["success", undefined, 0]],
    ["D == FALSE", "INIT Init\nNEXT Next\nACTION_CONSTRAINT N", ["success", undefined, 0]],
    ["D == FALSE", "INIT N\nNEXT Next", ["success", undefined, 0]],
    ["D == FALSE", "INIT Init\nNEXT N", ["deadlock", "deadlock", 0]],
    [
      "D == 1 = 2\nSpec == Init /\\ [][Next]_y /\\ N",
      "SPECIFICATION Spec",
      ["success", undefined, 0],
    ],
    ["D == 1 = 2", "SPECIFICATION N", ["success", undefined, 0]],
    [
      'D == PrintT("D")\nSpec == Init /\\ [][Next]_y /\\ N',
      "SPECIFICATION Spec",
      ["success", undefined, 2],
    ],
    [
      "D == 1 = 2\nSpec == Init /\\ [][Next]_y",
      "SPECIFICATION Spec\nPROPERTY N",
      ["liveness-violation", "N", 0],
    ],
    [
      "D == 1 = 2\nSpec == Init /\\ [][Next]_y\nProp == N /\\ y \\in Nat",
      "SPECIFICATION Spec\nPROPERTY Prop",
      ["liveness-violation", "N", 0],
    ],
    [
      'D == PrintT("D")\nSpec == Init /\\ [][Next]_y',
      "SPECIFICATION Spec\nPROPERTY N",
      ["success", undefined, 2],
    ],
  ])(
    "checks the substitute of N in %j under %j, as SpecProcessor looks N up as the definition it names",
    async (definitions, config, expected) => {
      const printed: string[] = [];
      const result = await check({
        source: getSubstituteSource(definitions),
        config: `${config}\nCONSTANT N <- D`,
        onPrint: (text) => printed.push(text),
      });
      expect([result.status, result.violation?.name, printed.length]).toEqual(expected);
    },
  );

  it("checks the definition CONSTANT Foo <- Bar gives an operator, as SpecProcessor looks Foo up as Bar", async () => {
    const checkOverride = (bar: string, config: string) =>
      check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE y\nInit == y = 0\nNext == y' = (y + 1) % 2\nFoo == TRUE\nBar == ${bar}\nSpec == Init /\\ [][Next]_y\nProp == Foo /\\ y \\in Nat\n====`,
        config: `${config}\nCONSTANT Foo <- Bar`,
      });
    await expect(checkOverride("FALSE", "SPECIFICATION Spec\nPROPERTY Foo")).rejects.toThrow(
      new TlaConfigError("The spec is trivially false because FALSE is false."),
    );
    const results = await Promise.all([
      checkOverride("FALSE", "SPECIFICATION Spec\nINVARIANT Foo"),
      checkOverride("1 = 2", "SPECIFICATION Spec\nPROPERTY Prop"),
    ]);
    expect(results.map((result) => [result.status, result.violation?.name])).toEqual([
      ["invariant-violation", "Foo"],
      ["liveness-violation", "Foo"],
    ]);
  });

  it("reports the literal body of a constraint a substituted name reaches, where TLC throws a ClassCastException", async () => {
    const result = await check({
      source: getSubstituteSource("D == 1"),
      config: "INIT Init\nNEXT Next\nCONSTRAINT N\nCONSTANT N <- D",
    });
    expect([result.status, result.failure?.message]).toEqual([
      "error",
      "TLC expected a boolean value, but did not find one. 1",
    ]);
  });

  it("evaluates the substitute of a constant an extended module declares as TLC starts each module", async () => {
    const printed: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS TLC, Naturals, P\nVARIABLE y\nInit == y = 0\nNext == y\' = (y + 1) % 2\nD == PrintT("D")\nASSUME N\n====',
      config: "INIT Init\nNEXT Next\nCONSTANT N <- D",
      loadModule: (name) => (name === "P" ? "---- MODULE P ----\nCONSTANT N\n====" : undefined),
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toEqual(['"D"', '"D"', '"D"']);
  });

  // TLCSet's deviation in tlc/tlc-operators.ts makes D state-level, so the NullPointerException that TLC swallows at TLCSet's bound of 0, printing "A", is a config error.
  it("rejects a substitute that sets a numbered register as TLC starts, where TLC swallows the NullPointerException", async () => {
    await expect(
      check({
        source: getSubstituteSource('D == TLCSet(1, 2)\nASSUME PrintT("A")'),
        config: "INIT Init\nNEXT Next\nCONSTANT N <- D",
      }),
    ).rejects.toThrow(
      new TlaConfigError(
        "The configuration file substitutes constant N with non-constant D - specifically: TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.NullPointerException\n: ",
      ),
    );
  });

  it("fails at a reference to N whose substitute failed as TLC started", async () => {
    const printed: string[] = [];
    const result = await check({
      source: getSubstituteSource('D == PrintT("D") /\\ CHOOSE v : TRUE\nASSUME N'),
      config: "INIT Init\nNEXT Next\nCONSTANT N <- D",
      onPrint: (text) => printed.push(text),
    });
    expect([printed, result.status]).toEqual([['"D"', '"D"', '"D"'], "assumption-violation"]);
  });

  it.each([
    ["D == RandomElement(1..100)", "<<74, 92, 92, 68, 74>>"],
    ["D == TLCEval(RandomElement(1..100))", "<<74, 74, 74, 74, 74>>"],
  ])("draws %s again at each reference to N with TLC's -seed 4", async (definition, expected) => {
    const printed: string[] = [];
    await check({
      source: getSubstituteSource(`${definition}\nASSUME PrintT(<<D, N, N, N, D>>)`),
      config: "INIT Init\nNEXT Next\nCONSTANT N <- D",
      seed: 4n,
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toEqual([expected]);
  });

  it("reads at each reference to N the value startup stores for a definition D read before startup stored it", async () => {
    const printed: string[] = [];
    await check({
      source: getSubstituteSource(
        "E == RandomElement(1..100)\nD == E\nASSUME PrintT(<<D, N, N, N, D>>)",
      ),
      config: "INIT Init\nNEXT Next\nCONSTANT N <- D",
      seed: 4n,
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toEqual(["<<74, 92, 92, 92, 74>>"]);
  });

  it("evaluates the substitute again as TLC starts each module while a definition it reads isn't stored", async () => {
    const printed: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS TLC, Naturals, P\nVARIABLE y\nInit == y = 0\nNext == y\' = (y + 1) % 2\nE == PrintT("E")\nD == E\nASSUME N\n====',
      config: "INIT Init\nNEXT Next\nCONSTANT N <- D",
      loadModule: (name) => (name === "P" ? "---- MODULE P ----\nCONSTANT N\n====" : undefined),
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toEqual(['"E"', '"E"', '"E"']);
  });

  it("counts the substitute's body at each reference to N, as TLC's coverage does", async () => {
    const lines = await getCoverageLines(
      "---- MODULE M ----\nEXTENDS TLC, Naturals\nCONSTANT N\nVARIABLE y\nInit == y = 0\nNext == y' \\in N\nD == {1, 2} \\cup {3}\nInv == y \\in N \\/ y = 0\n====",
      "INIT Init\nNEXT Next\nCONSTANT N <- D\nINVARIANT Inv",
    );
    expect(lines?.slice(-2)).toEqual([
      [
        "line 6, col 9 to line 6, col 16 of module M: 12",
        "|line 6, col 16 to line 6, col 16 of module M: 4",
        "||line 7, col 6 to line 7, col 20 of module M: 4",
        "|||line 7, col 6 to line 7, col 11 of module M: 4",
        "|||line 7, col 18 to line 7, col 20 of module M: 4:8",
      ],
      [
        "line 8, col 8 to line 8, col 23 of module M: 4",
        "|line 8, col 8 to line 8, col 14 of module M: 4",
        "||line 8, col 8 to line 8, col 8 of module M: 4",
        "||line 8, col 14 to line 8, col 14 of module M: 4",
        "|||line 7, col 6 to line 7, col 20 of module M: 4",
        "||||line 7, col 6 to line 7, col 11 of module M: 4",
        "||||line 7, col 18 to line 7, col 20 of module M: 4:8",
        "|line 8, col 19 to line 8, col 23 of module M: 1",
      ],
    ]);
  });

  it.each([
    [
      "an assumption",
      "c",
      "I == INSTANCE P WITH z <- y",
      "ASSUME I!Two",
      "y' = (y + 1) % 2",
      "",
      2,
    ],
    [
      "an invariant",
      "c",
      "I == INSTANCE P WITH z <- y",
      "Inv == I!Two",
      "y' = (y + 1) % 2",
      "INVARIANT Inv",
      2,
    ],
    [
      "an action property",
      "c",
      "I == INSTANCE P WITH z <- y",
      "Prop == [][I!Act]_y",
      "y' = (y + 1) % 2",
      "PROPERTY Prop",
      3,
    ],
    [
      "an action property through WITH c <- N",
      "N",
      "I == INSTANCE P WITH c <- N, z <- y",
      "Prop == [][I!Act]_y",
      "y' = (y + 1) % 2",
      "PROPERTY Prop",
      3,
    ],
    [
      "the next-state relation, at each reference",
      "c",
      "I == INSTANCE P WITH z <- y",
      "",
      "I!Flip",
      "",
      6,
    ],
  ])(
    "evaluates an instance's substitution of a substituted constant in %s as TLC's LazyValue does",
    async (_title, constant, instance, definitions, next, checked, count) => {
      const printed: string[] = [];
      await check({
        source: `---- MODULE M ----\nEXTENDS TLC, Naturals\nCONSTANT ${constant}\nVARIABLE y\nD == PrintT("c")\n${instance}\n${definitions}\nInit == y = 0\nNext == ${next}\n====\n`,
        config: `INIT Init\nNEXT Next\nCONSTANT ${constant} <- D\n${checked}`,
        loadModule: (name) =>
          name === "P"
            ? "---- MODULE P ----\nEXTENDS TLC, Naturals\nCONSTANT c\nVARIABLE z\nTwo == c /\\ c\nAct == c /\\ c /\\ z' = z\nFlip == c /\\ c /\\ z' = (z + 1) % 2\nStep == c /\\ z' = (z + 1) % 2 /\\ c\n====\n"
            : undefined,
        onPrint: (text) => printed.push(text),
      });
      expect(printed).toEqual(Array.from({ length: count }, () => '"c"'));
    },
  );

  it("applies an instance's operator parameter that a substituted operator constant replaces, as TLC does", async () => {
    const printed: string[] = [];
    await check({
      source:
        "---- MODULE M ----\nEXTENDS TLC, Naturals\nCONSTANT C(_)\nVARIABLE y\nInc(a) == a + 1\nI == INSTANCE P WITH Op <- C\nASSUME PrintT(<<I!Two, I!Three>>)\nInit == y = 0\nNext == y' = (y + 1) % 2\n====\n",
      config: "INIT Init\nNEXT Next\nCONSTANT C <- Inc\n",
      loadModule: (name) =>
        name === "P"
          ? "---- MODULE P ----\nEXTENDS Naturals\nCONSTANT Op(_)\nAp(F(_), a) == F(a)\nTwo == Ap(Op, 1)\nThree == Op(2)\n====\n"
          : undefined,
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toEqual(["<<2, 3>>"]);
  });

  const getOverrideSource = (definitions: string, next = "y' = (y + 1) % 2", extended = "") =>
    `---- MODULE M ----\nEXTENDS TLC, Naturals${extended}\nVARIABLE y\n${definitions}\nInit == y = 0\nNext == ${next}\n====\n`;

  it.each([
    [
      'Foo == 1\nBar == PrintT("B")\nASSUME Foo /\\ Foo',
      "CONSTANT Foo <- Bar",
      ['"B"', '"B"', '"B"'],
    ],
    [
      'Bar == PrintT("B")\nFoo == 1\nASSUME Foo /\\ Foo',
      "CONSTANT Foo <- Bar",
      ['"B"', '"B"', '"B"', '"B"'],
    ],
    [
      'Foo == 1\nBar == PrintT("B")\nASSUME Bar /\\ Foo /\\ Bar',
      "CONSTANT Foo <- Bar",
      ['"B"', '"B"'],
    ],
    [
      'Foo == 1\nBar == PrintT("B")\nInv == Foo',
      "CONSTANT Foo <- Bar\nINVARIANT Inv",
      ['"B"', '"B"'],
    ],
    [
      'Foo == 1\nBar == PrintT("B")\nInv == y = 0 \\/ Foo',
      "CONSTANT Foo <- Bar\nINVARIANT Inv",
      ['"B"', '"B"'],
    ],
    [
      'Foo == 1\nBar == PrintT("B")\nE == Foo\nASSUME E /\\ E',
      "CONSTANT Foo <- Bar",
      ['"B"', '"B"'],
    ],
    [
      'Foo == 1\nBar == PrintT("B")\nE == Foo\nInv == E /\\ Foo',
      "CONSTANT Foo <- Bar\nINVARIANT Inv",
      ['"B"', '"B"', '"B"'],
    ],
    ['Foo == 1\nBaz == PrintT("Z")\nBar == Baz\nASSUME Foo', "CONSTANT Foo <- Bar", ['"Z"', '"Z"']],
    ['Foo == 1\nBar == PrintT("B") /\\ CHOOSE v : TRUE', "CONSTANT Foo <- Bar", ['"B"', '"B"']],
    [
      'Foo == 1\nG(Op(_)) == Op("level")\nBar == G(TLCGet)\nASSUME PrintT(<<"F", Foo>>)',
      "CONSTANT Foo <- Bar",
      ['<<"F", 0>>'],
    ],
    [
      "Foo == 1\nf[a \\in {1}] == PrintT(a)\nBar == f\nASSUME Foo[1]",
      "CONSTANT Foo <- Bar",
      ["1", "1"],
    ],
    [
      'Foo == 1\nBar == PrintT("B")\nASSUME Foo /\\ Foo',
      "CONSTANT Foo <- [M] Bar",
      ['"B"', '"B"', '"B"'],
    ],
  ])(
    "evaluates the substitute of Foo in %j at Foo's place as TLC starts and at each reference to Foo, for %j",
    async (definitions, override, expected) => {
      const printed: string[] = [];
      const result = await check({
        source: getOverrideSource(definitions),
        config: `INIT Init\nNEXT Next\n${override}\n`,
        onPrint: (text) => printed.push(text),
      });
      expect([printed, result.status, result.distinctStates]).toEqual([expected, "success", 2]);
    },
  );

  it.each([
    ["ASSUME Foo", "CONSTANT Foo <- Bar", 3],
    ["ASSUME Foo /\\ Foo", "CONSTANT Foo <- [P] Bar", 4],
  ])(
    "evaluates the substitute of a definition an extended module holds as TLC starts each module, for %j and %j",
    async (assumption, override, count) => {
      const printed: string[] = [];
      await check({
        source: getOverrideSource(`Bar == PrintT("B")\n${assumption}`, undefined, ", P"),
        config: `INIT Init\nNEXT Next\n${override}\n`,
        loadModule: (name) => (name === "P" ? "---- MODULE P ----\nFoo == 1\n====\n" : undefined),
        onPrint: (text) => printed.push(text),
      });
      expect(printed).toEqual(Array.from({ length: count }, () => '"B"'));
    },
  );

  it("fails at a reference to Foo whose substitute failed as TLC started", async () => {
    const printed: string[] = [];
    const result = await check({
      source: getOverrideSource('Foo == 1\nBar == PrintT("B") /\\ CHOOSE v : TRUE\nASSUME Foo'),
      config: "INIT Init\nNEXT Next\nCONSTANT Foo <- Bar\n",
      onPrint: (text) => printed.push(text),
    });
    expect([printed, result.status]).toEqual([['"B"', '"B"', '"B"'], "assumption-violation"]);
  });

  it.each([
    ["Bar == RandomElement(1..100)", "<<74, 92, 92, 74>>"],
    ["Bar == TLCEval(RandomElement(1..100))", "<<74, 74, 74, 74>>"],
  ])("draws %s again at each reference to Foo with TLC's -seed 4", async (definition, expected) => {
    const printed: string[] = [];
    await check({
      source: getOverrideSource(`Foo == 1\n${definition}\nASSUME PrintT(<<Bar, Foo, Foo, Bar>>)`),
      config: "INIT Init\nNEXT Next\nCONSTANT Foo <- Bar\n",
      seed: 4n,
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toEqual([expected]);
  });

  it("reads at each reference to Foo the value startup stores for a definition Bar read before startup stored it", async () => {
    const printed: string[] = [];
    await check({
      source: getOverrideSource(
        "Foo == 1\nE == RandomElement(1..100)\nBar == E\nASSUME PrintT(<<Bar, Foo, Foo, Bar>>)",
      ),
      config: "INIT Init\nNEXT Next\nCONSTANT Foo <- Bar\n",
      seed: 4n,
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toEqual(["<<74, 92, 92, 74>>"]);
  });

  it("counts the substitute's body at each reference to Foo, as TLC's coverage does", async () => {
    const lines = await getCoverageLines(
      getOverrideSource(
        "Foo == {0}\nBar == {1, 2} \\cup {3}\nInv == y \\in Foo \\/ y = 0",
        "y' \\in Foo",
      ),
      "INIT Init\nNEXT Next\nCONSTANT Foo <- Bar\nINVARIANT Inv\n",
    );
    expect(lines?.slice(-2)).toEqual([
      [
        "line 8, col 9 to line 8, col 18 of module M: 12",
        "|line 8, col 16 to line 8, col 18 of module M: 4",
        "||line 5, col 8 to line 5, col 22 of module M: 4",
        "|||line 5, col 8 to line 5, col 13 of module M: 4",
        "|||line 5, col 20 to line 5, col 22 of module M: 4:8",
      ],
      [
        "line 6, col 8 to line 6, col 25 of module M: 4",
        "|line 6, col 8 to line 6, col 16 of module M: 4",
        "||line 6, col 8 to line 6, col 8 of module M: 4",
        "||line 6, col 14 to line 6, col 16 of module M: 4",
        "|||line 5, col 8 to line 5, col 22 of module M: 4",
        "||||line 5, col 8 to line 5, col 13 of module M: 4",
        "||||line 5, col 20 to line 5, col 22 of module M: 4:8",
        "|line 6, col 21 to line 6, col 25 of module M: 1",
      ],
    ]);
  });

  const INNER_CALLS = [
    "---- MODULE P ----",
    "EXTENDS TLC, Naturals",
    "CONSTANT c",
    "VARIABLE z",
    "InnerS == c /\\ z = z",
    "OuterS == InnerS /\\ InnerS",
    "InnerP(q) == c /\\ q = z",
    "OuterP == \\A q \\in {0, 1} : InnerP(q) \\/ TRUE",
    "InnerA == c /\\ z' = z",
    "OuterA == InnerA /\\ InnerA",
    "InnerF == c /\\ z' = (z + 1) % 2",
    "OuterF == InnerF /\\ InnerF",
    "OuterL == LET v == c IN v /\\ InnerS",
    "====",
    "",
  ].join("\n");
  const OPERATOR_ARGUMENT = [
    "---- MODULE P ----",
    "EXTENDS TLC, Naturals",
    "CONSTANT c",
    "VARIABLE z",
    "InnerOp(q) == c /\\ q \\in {0, 1}",
    "Ap(F(_)) == F(0) /\\ F(1)",
    "OuterHO == Ap(InnerOp) /\\ z = z",
    "====",
    "",
  ].join("\n");
  const NESTED_CALLS = [
    "---- MODULE P ----",
    "EXTENDS TLC, Naturals",
    "CONSTANT c",
    "VARIABLE z",
    "J == INSTANCE Q WITH d <- c, w <- z",
    "Y == J!X /\\ J!X",
    "YErr == J!X /\\ J!XErr",
    'InnerErr == c /\\ z + "a" = 1',
    "YOwn == c /\\ InnerErr",
    "a ++ b == c /\\ a = b",
    "Ap(F(_, _)) == F(0, 0) /\\ F(1, 1)",
    "YInfix == Ap(++) /\\ z = z",
    "====",
    "",
  ].join("\n");
  const NESTED_INSTANCE = [
    "---- MODULE Q ----",
    "EXTENDS TLC, Naturals",
    "CONSTANT d",
    "VARIABLE w",
    "X == d /\\ w = w",
    'XErr == d /\\ w + "a" = 1',
    "====",
    "",
  ].join("\n");
  const EXPLICIT = ["", 'I == INSTANCE P WITH c <- PrintT("c"), z <- y', ""];
  const IMPLICIT = [
    "CONSTANT c\n",
    'D == PrintT("c")\nI == INSTANCE P WITH z <- y',
    "CONSTANT c <- D\n",
  ];
  const PARAMETERIZED = ["", "I(x) == INSTANCE P WITH c <- PrintT(x), z <- y", ""];
  const getInnerCallCheck = (head: string[], invariant: string, child: string) => ({
    source: `---- MODULE M ----\nEXTENDS TLC, Naturals\n${head[0]}VARIABLE y\n${head[1]}\nInv == ${invariant}\nInit == y = 0\nNext == y' = (y + 1) % 2\n====\n`,
    config: `INIT Init\nNEXT Next\n${head[2]}INVARIANT Inv\n`,
    loadModule: (name: string) =>
      name === "P" ? child : name === "Q" ? NESTED_INSTANCE : undefined,
  });

  it.each([
    ["I!OuterS", "WITH c <- PrintT", EXPLICIT, INNER_CALLS, 2],
    ["I!OuterP", "WITH c <- PrintT", EXPLICIT, INNER_CALLS, 2],
    ["I!OuterL", "WITH c <- PrintT", EXPLICIT, INNER_CALLS, 2],
    ["I!InnerS /\\ I!OuterS", "WITH c <- PrintT", EXPLICIT, INNER_CALLS, 4],
    ["I!OuterS", "CONSTANT c <- D", IMPLICIT, INNER_CALLS, 3],
    ["I!OuterP", "CONSTANT c <- D", IMPLICIT, INNER_CALLS, 3],
    ["I!OuterL", "CONSTANT c <- D", IMPLICIT, INNER_CALLS, 3],
    ["I!InnerS /\\ I!OuterS", "CONSTANT c <- D", IMPLICIT, INNER_CALLS, 5],
    ["I!OuterHO", "WITH c <- PrintT", EXPLICIT, OPERATOR_ARGUMENT, 2],
    ["I!Y", "WITH c <- PrintT and a nested instance", EXPLICIT, NESTED_CALLS, 2],
    ["I!YInfix", "WITH c <- PrintT", EXPLICIT, NESTED_CALLS, 2],
    ['I("c")!Y', "I(x) WITH c <- PrintT(x)", PARAMETERIZED, NESTED_CALLS, 2],
    ['I("c")!YInfix', "I(x) WITH c <- PrintT(x)", PARAMETERIZED, NESTED_CALLS, 2],
  ])(
    "evaluates the substitutions %s reaches once per entry into the instance, through %s, as TLC's Tool#evalAppl reads its caller's LazyValue",
    async (invariant, _title, head, child, count) => {
      const printed: string[] = [];
      await check({
        ...getInnerCallCheck(head, invariant, child),
        onPrint: (text) => printed.push(text),
      });
      expect(printed).toEqual(Array.from({ length: count }, () => '"c"'));
    },
  );

  const PRIMED_READS = [
    "---- MODULE Q ----",
    "EXTENDS TLC, Naturals",
    "CONSTANT d",
    "VARIABLE w",
    "Op2 == d = d /\\ w = w",
    "Op1 == Op2 /\\ Op2",
    "A2 == d = d /\\ w' = (w + 1) % 2",
    "A1 == A2 /\\ A2",
    "====",
    "",
  ].join("\n");
  const ACTION_CHECK = "INIT Init\nNEXT Step\nACTION_CONSTRAINT Check\n";
  const INVARIANT_CHECK = "INIT Init\nNEXT Step\nINVARIANT Check\n";
  const NEXT_CHECK = "INIT Init\nNEXT Next\n";
  const LIVE_CHECK = "SPECIFICATION Spec\nPROPERTY Live\n";
  const getPrints = (text: string, count: number) => Array.from({ length: count }, () => text);
  const UNWARNED_COVERAGE = { coverage: 1, isWarningEnabled: false };
  const getLazyReads = async (
    definitions: string,
    config: string,
    options?: typeof UNWARNED_COVERAGE,
  ) => {
    const printed: string[] = [];
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS TLC, Naturals\nVARIABLE y\nJ == INSTANCE Q WITH d <- PrintT("d"), w <- y\nInit == y = 0\nStep == y' = (y + 1) % 2\nSpec == Init /\\ [][Step]_y /\\ WF_y(Step)\n${definitions}\n====\n`,
      config,
      seed: 4n,
      ...options,
      loadModule: (name) => (name === "Q" ? PRIMED_READS : undefined),
      onPrint: (text) => printed.push(text),
    });
    return { printed, lines: formatCoverage(result)?.at(-1) };
  };

  it.each([
    ["Check == (J!Op1)'", ACTION_CHECK, getPrints('"d"', 8)],
    ["Check == J!Op1 /\\ (J!Op1)'", ACTION_CHECK, getPrints('"d"', 10)],
    ["Check == (J!Op1)' /\\ J!Op1", ACTION_CHECK, getPrints('"d"', 10)],
    ["Check == UNCHANGED J!Op1 \\/ TRUE", ACTION_CHECK, getPrints('"d"', 10)],
    ["Ap(a) == a' /\\ a'\nCheck == Ap(J!Op2)", ACTION_CHECK, getPrints('"d"', 8)],
    ["Ap(a) == a /\\ a' /\\ a\nCheck == Ap(J!Op2)", ACTION_CHECK, getPrints('"d"', 6)],
    ["Check == LET t == PrintT(\"t\") IN t' /\\ t'", ACTION_CHECK, getPrints('"t"', 4)],
    ['Check == LET t == PrintT("t") IN t /\\ t\' /\\ t', ACTION_CHECK, getPrints('"t"', 4)],
    [
      'Check == LET t == PrintT("t") /\\ y \\in 0..1 IN (UNCHANGED t \\/ TRUE) /\\ (UNCHANGED t \\/ TRUE)',
      ACTION_CHECK,
      getPrints('"t"', 6),
    ],
    [
      "Check == LET t == PrintT(\"t\") /\\ y \\in 0..1 IN t /\\ ENABLED (y' = y /\\ t') /\\ t",
      INVARIANT_CHECK,
      getPrints('"t"', 4),
    ],
    ["Next == J!A1 /\\ J!Op1'", NEXT_CHECK, getPrints('"d"', 16)],
    ["Next == Step /\\ UNCHANGED (J!Op2 \\/ TRUE)", NEXT_CHECK, getPrints('"d"', 6)],
    ["Live == [][(J!Op2)']_y", LIVE_CHECK, getPrints('"d"', 4)],
    ["Live == []<><<Step>>_<<y, J!Op2>>", LIVE_CHECK, getPrints('"d"', 12)],
    ["Live == []<><<Step>>_<<J!Op2, y>>", LIVE_CHECK, getPrints('"d"', 12)],
    [
      "Check == LET r == RandomElement(1..1000) IN PrintT(<<r', r'>>)",
      ACTION_CHECK,
      ["<<773, 379>>", "<<484, 436>>"],
    ],
    [
      "Check == LET r == RandomElement(1..1000) IN PrintT(<<r, r', r>>)",
      ACTION_CHECK,
      ["<<773, 379, 773>>", "<<484, 436, 484>>"],
    ],
    [
      "Ap(a) == PrintT(<<a, a', a>>)\nCheck == Ap(RandomElement(1..1000))",
      ACTION_CHECK,
      ["<<773, 379, 773>>", "<<484, 436, 484>>"],
    ],
  ])(
    "evaluates a lazy value read under a prime in %j afresh and keeps what it read before, as TLC's Tool#evalAppl does",
    async (definitions, config, expected) => {
      expect((await getLazyReads(definitions, config)).printed).toEqual(expected);
    },
  );

  it.each([
    [
      "Check == LET r == RandomElement(1..1000) IN PrintT(<<r, UNCHANGED r, r>>)",
      ["<<773, FALSE, 379>>", "<<484, FALSE, 436>>"],
    ],
    [
      "Check == LET r == RandomElement(1..1000) IN PrintT(<<r, UNCHANGED <<r, y>>, r>>)",
      ["<<773, FALSE, 379>>", "<<484, FALSE, 436>>"],
    ],
    [
      "Check == LET r == RandomElement(1..1000) IN PrintT(<<r, [r = 0]_r, r>>)",
      ["<<773, FALSE, 379>>", "<<484, FALSE, 436>>"],
    ],
    [
      "Check == LET r == RandomElement(1..1000) IN PrintT(<<r, <<r = 0>>_r, r>>)",
      ["<<773, FALSE, 773>>", "<<484, FALSE, 484>>"],
    ],
    [
      "Check == LET r == RandomElement(1..1000) IN PrintT(<<UNCHANGED r, r, r'>>)",
      ["<<FALSE, 773, 273>>", "<<FALSE, 484, 784>>"],
    ],
    [
      'Check == LET t == PrintT("t") /\\ y \\in 0..1 IN t /\\ UNCHANGED t /\\ t',
      getPrints('"t"', 6),
    ],
    [
      'Check == LET t == PrintT("t") /\\ y \\in 0..1 IN t /\\ (UNCHANGED t \\/ TRUE) /\\ t',
      getPrints('"t"', 6),
    ],
    [
      'Check == LET t == PrintT("t") /\\ y \\in 0..1 IN (UNCHANGED t \\/ TRUE) /\\ t',
      getPrints('"t"', 4),
    ],
    [
      "Ap(a) == PrintT(<<a, UNCHANGED a, a>>)\nCheck == Ap(RandomElement(1..1000))",
      ["<<773, FALSE, 379>>", "<<484, FALSE, 436>>"],
    ],
    [
      'Ap(a) == a /\\ UNCHANGED a /\\ a\nCheck == Ap(PrintT("t") /\\ y \\in 0..1)',
      getPrints('"t"', 6),
    ],
    [
      "Ap(a) == PrintT(<<a, [a = 0]_a, a>>)\nCheck == Ap(RandomElement(1..1000))",
      ["<<773, FALSE, 379>>", "<<484, FALSE, 436>>"],
    ],
  ])(
    "evaluates the first side of UNCHANGED, [A]_e and <<A>>_e in %j without the next state, as TLC passes TLCState.Empty there",
    async (definitions, expected) => {
      expect((await getLazyReads(definitions, ACTION_CHECK)).printed).toEqual(expected);
    },
  );

  it.each([
    [
      "Ap(a) == Step /\\ PrintT(<<a>>) /\\ (UNCHANGED (a + 0) \\/ TRUE) /\\ PrintT(<<a>>)\nNext == Ap(RandomElement(y..1000))",
      [
        "line 8, col 10 to line 8, col 30 of module M: 2",
        "line 8, col 36 to line 8, col 52 of module M: 4",
        "line 8, col 57 to line 8, col 60 of module M: 2",
        "line 8, col 66 to line 8, col 78 of module M: 2",
        "line 9, col 12 to line 9, col 33 of module M: 6",
      ],
    ],
    [
      "Ap(a) == Step /\\ PrintT(<<a>>) /\\ UNCHANGED (a > 0) /\\ PrintT(<<a>>)\nNext == Ap(RandomElement(y..1000))",
      [
        "line 8, col 10 to line 8, col 30 of module M: 2",
        "line 8, col 35 to line 8, col 51 of module M: 6",
        "line 8, col 56 to line 8, col 68 of module M: 2",
        "line 9, col 12 to line 9, col 33 of module M: 6",
      ],
    ],
  ])(
    "evaluates the first side of an action's UNCHANGED in %j without the next state under coverage, as TLC's Tool#processUnchanged passes TLCState.Empty there",
    async (definitions, lines) => {
      expect(await getLazyReads(definitions, NEXT_CHECK, UNWARNED_COVERAGE)).toEqual({
        printed: ["<<773>>", "<<379>>", "<<484>>", "<<436>>"],
        lines,
      });
    },
  );

  it.each([
    ["Next == Step /\\ UNCHANGED (J!Op2 \\/ TRUE)", NEXT_CHECK, '"d"', 6],
    ["Live == []<><<Step>>_<<y, J!Op2>>", LIVE_CHECK, '"d"', 12],
    ["Live == []<><<Step>>_<<J!Op2, y>>", LIVE_CHECK, '"d"', 12],
    [
      "Fair == Init /\\ [][Step]_y /\\ WF_<<y, J!Op2>>(Step)\nLive == <>(y = 1)",
      "SPECIFICATION Fair\nPROPERTY Live\n",
      '"d"',
      24,
    ],
    [
      "Check == LET t == PrintT(\"t\") /\\ y \\in 0..1 IN t /\\ (ENABLED (y' = IF t THEN y ELSE y))' /\\ t",
      ACTION_CHECK,
      '"t"',
      6,
    ],
    [
      "Check == LET t == PrintT(\"t\") /\\ y \\in 0..1 IN (ENABLED (y' = IF t THEN y ELSE y))' /\\ t'",
      ACTION_CHECK,
      '"t"',
      4,
    ],
  ])(
    "reads a lazy value in %j under coverage as TLC does, afresh only where s1 is TLCState.Null",
    async (definitions, config, text, count) => {
      expect((await getLazyReads(definitions, config, UNWARNED_COVERAGE)).printed).toEqual(
        getPrints(text, count),
      );
    },
  );

  it.each([
    [
      "Check == J!Op2 /\\ (ENABLED (y' = IF J!Op2 THEN y ELSE y))'",
      ACTION_CHECK,
      4,
      [
        "line 8, col 10 to line 8, col 58 of module M: 2",
        "|line 8, col 10 to line 8, col 14 of module M: 2",
        "|line 8, col 19 to line 8, col 58 of module M: 2",
        "||line 8, col 20 to line 8, col 56 of module M: 2",
        "|||line 8, col 34 to line 8, col 55 of module M: 2",
        "||||line 8, col 37 to line 8, col 41 of module M: 2",
        "|||||line 4, col 27 to line 4, col 37 of module M: 4",
        "|||||line 4, col 45 to line 4, col 45 of module M: 4",
        "|||||line 5, col 8 to line 5, col 21 of module Q: 2",
        "||||line 8, col 48 to line 8, col 48 of module M: 2",
      ],
    ],
    [
      "Next == Step /\\ UNCHANGED (J!Op2 \\/ TRUE) /\\ J!Op2",
      NEXT_CHECK,
      10,
      [
        "line 8, col 9 to line 8, col 12 of module M: 2",
        "line 8, col 17 to line 8, col 41 of module M: 6",
        "line 4, col 27 to line 4, col 37 of module M: 10",
        "line 4, col 45 to line 4, col 45 of module M: 10",
        "line 5, col 8 to line 5, col 12 of module Q: 4",
        "|line 5, col 8 to line 5, col 8 of module Q: 2",
        "|line 5, col 12 to line 5, col 12 of module Q: 2",
        "line 5, col 17 to line 5, col 21 of module Q: 4",
        "|line 5, col 17 to line 5, col 17 of module Q: 2",
        "|line 5, col 21 to line 5, col 21 of module Q: 2",
      ],
    ],
  ])(
    "counts an instance's substitute in %j at each read where TLC's s1 is TLCState.Null, and not inside ENABLED under a prime",
    async (definitions, config, count, lines) => {
      expect(await getLazyReads(definitions, config, UNWARNED_COVERAGE)).toEqual({
        printed: getPrints('"d"', count),
        lines,
      });
    },
  );

  it.each([
    ["Check == ENABLED J!A1", INVARIANT_CHECK, 8],
    ["Next == Step /\\ ENABLED J!A1", NEXT_CHECK, 8],
    ["Check == ENABLED (J!A2 /\\ J!A2)", INVARIANT_CHECK, 8],
    ["Check == ENABLED J!A1 /\\ ENABLED J!A1", INVARIANT_CHECK, 16],
    ["Check == ENABLED (J!Op1 /\\ y' = y)", INVARIANT_CHECK, 8],
    ["Live == []<>ENABLED J!A1", LIVE_CHECK, 16],
    [
      "Fair == Init /\\ [][Step]_y /\\ WF_y(J!A1)\nLive == <>(y = 1)",
      "SPECIFICATION Fair\nPROPERTY Live\n",
      18,
    ],
    ["Check == J!A1", ACTION_CHECK, 2],
  ])(
    "evaluates an instance's substitute again at each read inside ENABLED in %j, as TLC's Tool#enabled binds it uncachable",
    async (definitions, config, count) => {
      expect((await getLazyReads(definitions, config)).printed).toEqual(getPrints('"d"', count));
    },
  );

  it.each([
    [
      'Check == LET t == PrintT("t") /\\ y \\in 0..1 IN t /\\ ENABLED (y\' = y /\\ UNCHANGED (t \\/ TRUE)) /\\ t',
      getPrints('"t"', 8),
    ],
    [
      "Check == LET t == PrintT(\"t\") /\\ y \\in 0..1 IN t /\\ ENABLED (y' = y /\\ (t \\/ TRUE)' = (t \\/ TRUE)) /\\ t",
      getPrints('"t"', 8),
    ],
    [
      "Ap(a) == PrintT(<<a>>) /\\ ENABLED <<Step>>_<<y, a>> /\\ PrintT(<<a>>)\nCheck == Ap(RandomElement(1..1000))",
      ["<<731>>", "<<680>>", "<<773>>", "<<769>>"],
    ],
    [
      "Ap(a) == PrintT(<<a>>) /\\ ENABLED <<Step>>_<<y, a + 0>> /\\ PrintT(<<a>>)\nCheck == Ap(RandomElement(y..1000))",
      ["<<731>>", "<<680>>", "<<773>>", "<<769>>"],
    ],
    [
      "Ap(a) == PrintT(<<a>>) /\\ ENABLED (Step /\\ UNCHANGED (a > 0)) /\\ PrintT(<<a>>)\nCheck == Ap(RandomElement(y..1000))",
      ["<<731>>", "<<680>>", "<<773>>", "<<769>>"],
    ],
  ])(
    "reads a lazy value in %j afresh across ENABLED, as TLC's LazyValue#getCachedValue serves a value only under the EvalControl it cached it under",
    async (definitions, expected) => {
      expect((await getLazyReads(definitions, INVARIANT_CHECK)).printed).toEqual(expected);
    },
  );

  const ENABLED_UNCHANGED = [
    'Check == LET t == PrintT("t") /\\ y \\in 0..1 IN ENABLED (y\' = y /\\ UNCHANGED (t \\/ TRUE) /\\ UNCHANGED (t \\/ TRUE))',
    "Check == ENABLED (y' = y /\\ UNCHANGED (J!Op2 \\/ TRUE))",
    "Check == J!Op2 /\\ ENABLED (y' = y /\\ UNCHANGED (J!Op2 \\/ TRUE)) /\\ J!Op2",
    "Next == Step /\\ ENABLED (y' = y /\\ UNCHANGED (J!Op2 \\/ TRUE))",
  ];

  it.each([
    [ENABLED_UNCHANGED[0], INVARIANT_CHECK, getPrints('"t"', 8)],
    [ENABLED_UNCHANGED[1], INVARIANT_CHECK, getPrints('"d"', 4)],
    [ENABLED_UNCHANGED[2], INVARIANT_CHECK, getPrints('"d"', 8)],
    [ENABLED_UNCHANGED[3], NEXT_CHECK, getPrints('"d"', 4)],
  ])(
    "reads a lazy value on the second side of UNCHANGED inside ENABLED in %j from its cache, as TLC's Tool#enabledUnchanged evaluates that side in s1 with TLCState.Empty",
    async (definitions, config, expected) => {
      expect((await getLazyReads(definitions, config)).printed).toEqual(expected);
    },
  );

  it.each([
    [
      ENABLED_UNCHANGED[0],
      INVARIANT_CHECK,
      getPrints('"t"', 8),
      [
        "line 8, col 19 to line 8, col 43 of module M: 8",
        "line 8, col 48 to line 8, col 113 of module M: 2",
        "|line 8, col 57 to line 8, col 62 of module M: 2",
        "|line 8, col 67 to line 8, col 87 of module M: 4",
        "|line 8, col 92 to line 8, col 112 of module M: 4",
      ],
    ],
    [
      ENABLED_UNCHANGED[1],
      INVARIANT_CHECK,
      getPrints('"d"', 4),
      [
        "line 8, col 10 to line 8, col 54 of module M: 2",
        "|line 8, col 19 to line 8, col 24 of module M: 2",
        "|line 8, col 29 to line 8, col 53 of module M: 4",
      ],
    ],
    [
      ENABLED_UNCHANGED[2],
      INVARIANT_CHECK,
      getPrints('"d"', 8),
      [
        "line 8, col 10 to line 8, col 72 of module M: 2",
        "|line 8, col 10 to line 8, col 63 of module M: 2",
        "||line 8, col 10 to line 8, col 14 of module M: 2",
        "||line 8, col 19 to line 8, col 63 of module M: 2",
        "|||line 8, col 28 to line 8, col 33 of module M: 2",
        "|||line 8, col 38 to line 8, col 62 of module M: 4",
        "|line 8, col 68 to line 8, col 72 of module M: 2",
        "||line 4, col 27 to line 4, col 37 of module M: 8",
        "||line 4, col 45 to line 4, col 45 of module M: 8",
        "||line 5, col 8 to line 5, col 21 of module Q: 2",
      ],
    ],
    [
      ENABLED_UNCHANGED[3],
      NEXT_CHECK,
      getPrints('"d"', 4),
      [
        "line 8, col 9 to line 8, col 12 of module M: 2",
        "line 8, col 17 to line 8, col 61 of module M: 4",
        "|line 8, col 26 to line 8, col 31 of module M: 2",
        "|line 8, col 36 to line 8, col 60 of module M: 4",
      ],
    ],
  ])(
    "reads a lazy value on the second side of UNCHANGED inside ENABLED in %j from its cache under coverage too",
    async (definitions, config, printed, lines) => {
      expect(await getLazyReads(definitions, config, UNWARNED_COVERAGE)).toEqual({
        printed,
        lines,
      });
    },
  );

  const CHANGED_ITEMS = [
    'Ap(a) == PrintT(<<a>>) /\\ <<Step>>_<<y, a /\\ TRUE>> /\\ PrintT(<<a>>)\nNext == Ap(PrintT("a") /\\ y \\in 0..1)',
    "Ap(a) == PrintT(<<a>>) /\\ <<Step>>_<<y, a + 0>> /\\ PrintT(<<a>>)\nNext == Ap(RandomElement(y..1000))",
    "Next == <<Step>>_<<y, J!Op2>>",
  ];
  const CHANGED_PRINTS = [
    ['"a"', "<<TRUE>>", '"a"', '"a"', "<<TRUE>>", '"a"', "<<TRUE>>", '"a"', '"a"', "<<TRUE>>"],
    ["<<773>>", "<<272>>", "<<484>>", "<<784>>"],
    getPrints('"d"', 4),
  ];

  it.each([
    [CHANGED_ITEMS[0], CHANGED_PRINTS[0]],
    [CHANGED_ITEMS[1], CHANGED_PRINTS[1]],
    [CHANGED_ITEMS[2], CHANGED_PRINTS[2]],
    ["Next == J!Op2 /\\ <<Step>>_<<y, J!Op2>> /\\ J!Op2", getPrints('"d"', 10)],
  ])(
    "reads a lazy value on the second side of <<A>>_e in the next-state relation %j from its cache, as TLC's Tool#getNextStates evaluates that side in s1 with TLCState.Empty",
    async (definitions, expected) => {
      expect((await getLazyReads(definitions, NEXT_CHECK)).printed).toEqual(expected);
    },
  );

  it.each([
    [
      CHANGED_ITEMS[0],
      CHANGED_PRINTS[0],
      [
        "line 8, col 10 to line 8, col 22 of module M: 2",
        "line 8, col 29 to line 8, col 32 of module M: 2",
        "line 8, col 36 to line 8, col 51 of module M: 4",
        "line 8, col 56 to line 8, col 68 of module M: 2",
        "line 9, col 12 to line 9, col 36 of module M: 6",
      ],
    ],
    [
      CHANGED_ITEMS[1],
      CHANGED_PRINTS[1],
      [
        "line 8, col 10 to line 8, col 22 of module M: 2",
        "line 8, col 29 to line 8, col 32 of module M: 2",
        "line 8, col 36 to line 8, col 47 of module M: 4",
        "line 8, col 52 to line 8, col 64 of module M: 2",
        "line 9, col 12 to line 9, col 33 of module M: 6",
      ],
    ],
    [
      CHANGED_ITEMS[2],
      CHANGED_PRINTS[2],
      [
        "line 8, col 11 to line 8, col 14 of module M: 2",
        "line 8, col 18 to line 8, col 29 of module M: 4",
      ],
    ],
  ])(
    "reads a lazy value on the second side of <<A>>_e in the next-state relation %j from its cache under coverage too",
    async (definitions, printed, lines) => {
      expect(
        await getLazyReads(definitions, NEXT_CHECK, { coverage: 1, isWarningEnabled: true }),
      ).toEqual({ printed, lines });
    },
  );

  it("evaluates both sides of <<A>>_e in the next-state relation without the next state under coverage, as TLC's Tool#getNextStates passes TLCState.Empty there", async () => {
    const reads = await getLazyReads(
      "Ap(a) == Step /\\ PrintT(<<a>>) /\\ <<TRUE>>_<<y, a + 0>> /\\ PrintT(<<a>>)\nNext == Ap(RandomElement(y..1000))",
      NEXT_CHECK,
      UNWARNED_COVERAGE,
    );
    expect(reads.printed).toEqual(["<<773>>", "<<768>>", "<<484>>", "<<730>>"]);
  });

  const SUBSCRIPTED_NEXT =
    "VARIABLES y, z\nInit == y = 0 /\\ z = 0\nNext == \\/ /\\ <<y' = (y + 1) % 3>>_<<y, y + 1>>\n           /\\ <<z' = 1 - z>>_z\n        \\/ <<y' = y /\\ z' = z>>_<<y, z>>";
  const SUBSCRIPTED_NEXT_STEPS = [
    "line 7, col 14 to line 7, col 19 of module M: 0",
    "|line 7, col 19 to line 7, col 19 of module M: 6",
    "line 7, col 24 to line 7, col 29 of module M: 0",
    "|line 7, col 29 to line 7, col 29 of module M: 6",
    "line 7, col 33 to line 7, col 40 of module M: 12",
  ];

  it.each([
    [
      "VARIABLE y\nInit == y = 0\nNext == <<y' = (y + 1) % 3>>_y",
      false,
      [
        ["line 4, col 9 to line 4, col 13 of module M: 1"],
        [
          "line 5, col 11 to line 5, col 26 of module M: 3",
          "line 5, col 30 to line 5, col 30 of module M: 9",
        ],
      ],
    ],
    [
      SUBSCRIPTED_NEXT,
      false,
      [
        ["line 4, col 9 to line 4, col 22 of module M: 1"],
        [
          "line 5, col 17 to line 5, col 32 of module M: 6",
          "line 5, col 36 to line 5, col 47 of module M: 18",
          "|line 5, col 38 to line 5, col 38 of module M: 12",
          "|line 5, col 41 to line 5, col 45 of module M: 12",
          "line 6, col 17 to line 6, col 26 of module M: 6",
          "line 6, col 30 to line 6, col 30 of module M: 18",
        ],
        SUBSCRIPTED_NEXT_STEPS,
      ],
    ],
    [
      SUBSCRIPTED_NEXT,
      true,
      [
        ["line 4, col 9 to line 4, col 22 of module M: 1"],
        [
          "line 5, col 17 to line 5, col 32 of module M: 6",
          "line 5, col 36 to line 5, col 47 of module M: 18",
          "|line 5, col 38 to line 5, col 38 of module M: 12",
          "|line 5, col 41 to line 5, col 45 of module M: 12",
          "line 6, col 17 to line 6, col 26 of module M: 6",
          "line 6, col 30 to line 6, col 30 of module M: 12",
        ],
        SUBSCRIPTED_NEXT_STEPS,
      ],
    ],
    [
      "VARIABLE y\nInit == y = 0\nNext == /\\ ENABLED <<y' = (y + 1) % 3>>_<<y, y + 1>>\n        /\\ y' = (y + 1) % 3",
      false,
      [
        ["line 4, col 9 to line 4, col 13 of module M: 1"],
        [
          "line 5, col 12 to line 5, col 52 of module M: 6",
          "|line 5, col 22 to line 5, col 37 of module M: 3",
          "|line 5, col 41 to line 5, col 52 of module M: 6",
          "line 6, col 12 to line 6, col 27 of module M: 3",
        ],
      ],
    ],
  ])(
    "counts e of <<A>>_e in the next-state relation %j with warnings on (%s) at e, for each evaluation and each successor it lets through, as TLC's Tool#getNextStates conses e with its own cost model",
    async (definitions, isWarningEnabled, lines) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\n${definitions}\n====\n`,
        config: "INIT Init\nNEXT Next\n",
        coverage: 1,
        isWarningEnabled,
      });
      expect(formatCoverage(result)).toEqual(lines);
    },
  );

  const INSTANCE_OP2_LINES = [
    "line 5, col 8 to line 5, col 12 of module Q: 4",
    "|line 5, col 8 to line 5, col 8 of module Q: 2",
    "|line 5, col 12 to line 5, col 12 of module Q: 2",
    "line 5, col 17 to line 5, col 21 of module Q: 4",
    "|line 5, col 17 to line 5, col 17 of module Q: 2",
    "|line 5, col 21 to line 5, col 21 of module Q: 2",
  ];
  const INSTANCE_A2_LINES = [
    "line 7, col 7 to line 7, col 11 of module Q: 4",
    "|line 7, col 7 to line 7, col 7 of module Q: 2",
    "|line 7, col 11 to line 7, col 11 of module Q: 2",
    "line 7, col 16 to line 7, col 31 of module Q: 2",
  ];

  it.each([
    [
      "Next == J!Op2 /\\ <<Step>>_<<y, J!Op2>> /\\ J!Op2",
      true,
      10,
      [
        ...INSTANCE_OP2_LINES,
        "line 8, col 20 to line 8, col 23 of module M: 2",
        "line 8, col 27 to line 8, col 38 of module M: 4",
        "line 8, col 43 to line 8, col 47 of module M: 2",
        "|line 4, col 27 to line 4, col 37 of module M: 10",
        "|line 4, col 45 to line 4, col 45 of module M: 10",
        "|line 5, col 8 to line 5, col 21 of module Q: 2",
      ],
    ],
    [
      "Next == J!Op2 /\\ <<Step>>_<<y, J!Op2>> /\\ J!Op2",
      false,
      12,
      [
        ...INSTANCE_OP2_LINES,
        "line 8, col 20 to line 8, col 23 of module M: 2",
        "line 8, col 27 to line 8, col 38 of module M: 6",
        "|line 8, col 29 to line 8, col 29 of module M: 4",
        "|line 8, col 32 to line 8, col 36 of module M: 4",
        "line 4, col 27 to line 4, col 37 of module M: 12",
        "line 4, col 45 to line 4, col 45 of module M: 12",
        ...INSTANCE_OP2_LINES,
      ],
    ],
    [
      "Next == J!Op2 /\\ <<Step>>_<<y, J!Op2>>",
      false,
      8,
      [
        ...INSTANCE_OP2_LINES,
        "line 8, col 20 to line 8, col 23 of module M: 2",
        "line 8, col 27 to line 8, col 38 of module M: 6",
        "|line 8, col 29 to line 8, col 29 of module M: 4",
        "|line 8, col 32 to line 8, col 36 of module M: 4",
        "||line 4, col 27 to line 4, col 37 of module M: 8",
        "||line 4, col 45 to line 4, col 45 of module M: 8",
        "||line 5, col 8 to line 5, col 21 of module Q: 4",
      ],
    ],
    [
      "Next == J!A2 /\\ J!Op2",
      true,
      6,
      [
        ...INSTANCE_A2_LINES,
        "line 8, col 17 to line 8, col 21 of module M: 2",
        "|line 4, col 27 to line 4, col 37 of module M: 6",
        "|line 4, col 45 to line 4, col 45 of module M: 4",
        "|line 5, col 8 to line 5, col 21 of module Q: 2",
      ],
    ],
    [
      "Next == J!A1",
      true,
      8,
      [
        "line 4, col 27 to line 4, col 37 of module M: 8",
        "line 4, col 45 to line 4, col 45 of module M: 6",
        ...INSTANCE_A2_LINES,
        "line 8, col 13 to line 8, col 14 of module Q: 2",
      ],
    ],
  ])(
    "counts J's substitutes in a conjunct of the next-state relation %j with warnings on (%s) as TLC does, which evaluates a conjunct after J!Op2 or J!A2 in the context it was consed with, outside J's substitutions",
    async (definitions, isWarningEnabled, prints, lines) => {
      expect(
        await getLazyReads(definitions, NEXT_CHECK, { coverage: 1, isWarningEnabled }),
      ).toEqual({ printed: getPrints('"d"', prints), lines });
    },
  );

  it("records the nested instance a call from one instanced definition to another enters, as TLC does", async () => {
    const result = await check(getInnerCallCheck(EXPLICIT, "I!YErr", NESTED_CALLS));
    const ranges = result.failure?.callStack?.flatMap((expression, index, expressions) => {
      const range = expression.location.range;
      return range && expression !== expressions[index - 1]
        ? [
            `${range.module} ${range.start.line}:${range.start.column}-${range.end.line}:${range.end.column}`,
          ]
        : [];
    });
    expect(ranges).toEqual([
      "M 6:9-6:13",
      "M 5:8-5:13",
      "M 4:1-4:45",
      "P 7:9-7:21",
      "P 7:16-7:21",
      "P 5:1-5:35",
      "Q 6:9-6:24",
      "Q 6:14-6:24",
      "Q 6:14-6:20",
    ]);
  });

  it("records the INSTANCE of each module between an instance and a definition three instances down, where every level binds its substitutes, as TLC does", async () => {
    const modules = new Map([
      [
        "P",
        '---- MODULE P ----\nEXTENDS TLC\nCONSTANT c\nVARIABLE z\nJ == INSTANCE R WITH b <- PrintT(<<"b", c>>), v <- z\n====\n',
      ],
      [
        "R",
        '---- MODULE R ----\nEXTENDS TLC\nCONSTANT b\nVARIABLE v\nK == INSTANCE Q WITH d <- PrintT(<<"d", b>>), w <- v\n====\n',
      ],
      [
        "Q",
        '---- MODULE Q ----\nEXTENDS TLC, Naturals\nCONSTANT d\nVARIABLE w\nIn == d /\\ w = w\nErr == d /\\ w + "a" = 1\nOutErr == In /\\ Err\n====\n',
      ],
    ]);
    const result = await check({
      source:
        '---- MODULE M ----\nEXTENDS TLC, Naturals\nVARIABLE y\nInit == y = 0\nNext == y\' = (y + 1) % 2\nI == INSTANCE P WITH c <- PrintT("c"), z <- y\nInv == I!J!K!OutErr\n====\n',
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\n",
      loadModule: (name) => modules.get(name),
      onPrint: () => {},
    });
    expect(formatCallStackLines(result)?.filter((line) => line !== "")).toEqual([
      "Line 4, column 9 to line 4, column 13 in M",
      "Line 7, column 8 to line 7, column 19 in M",
      "Line 6, column 1 to line 6, column 45 in M",
      "Line 5, column 1 to line 5, column 52 in P",
      "Line 5, column 1 to line 5, column 52 in R",
      "Line 7, column 11 to line 7, column 19 in Q",
      "Line 7, column 17 to line 7, column 19 in Q",
      "Line 6, column 8 to line 6, column 23 in Q",
      "Line 6, column 13 to line 6, column 23 in Q",
      "Line 6, column 13 to line 6, column 19 in Q",
    ]);
  });

  it.each([
    ['I == INSTANCE P WITH c <- "d", v <- y', "I!J!Op3", "INVARIANT", 3],
    ['I == INSTANCE P WITH c <- "d", v <- y', "I!J!KOp", "INVARIANT", 3],
    ["I(z) == INSTANCE P WITH c <- z, v <- y", 'I("d")!J!Op3', "INVARIANT", 2],
    ['I == INSTANCE P WITH c <- "d", v <- y', "I!J!A1", "ACTION_CONSTRAINT", 2],
    ['I == INSTANCE P WITH c <- "d", v <- y', "I!J!Op5", "INVARIANT", 1],
    ['I == INSTANCE P WITH c <- "d", v <- y', "[](I!J!Op3)", "PROPERTY", 3],
    ['I == INSTANCE P WITH c <- "d", v <- y', "I!POp", "INVARIANT", 3],
    ['J == INSTANCE Q WITH d <- PrintT("d"), w <- y', "J!Op3", "INVARIANT", 3],
  ])(
    "evaluates the printing substitute of an instance once per entry, with %s, into %s under %s, as TLC does",
    async (instance, reached, kind, count) => {
      const modules = new Map([
        [
          "P",
          [
            "---- MODULE P ----",
            "EXTENDS TLC",
            "CONSTANT c",
            "VARIABLE v",
            "J == INSTANCE Q WITH d <- PrintT(c), w <- v",
            "POp == J!Op1 /\\ c = c",
            "====",
            "",
          ].join("\n"),
        ],
        [
          "Q",
          [
            "---- MODULE Q ----",
            "EXTENDS TLC",
            "CONSTANT d",
            "VARIABLE w",
            "Op2 == d = d /\\ w = w",
            "Op1 == Op2 /\\ Op2",
            "Op3 == Op1 /\\ d = d",
            "A2 == d = d /\\ w' = w",
            "A1 == A2 /\\ A2",
            "Ap(Op(_)) == Op(d) /\\ Op(d)",
            "Same(e) == e = d",
            "Op5 == Ap(Same)",
            "K == INSTANCE R WITH e <- d, u <- w",
            "KOp == K!ROp1 /\\ d = d",
            "====",
            "",
          ].join("\n"),
        ],
        [
          "R",
          [
            "---- MODULE R ----",
            "CONSTANT e",
            "VARIABLE u",
            "ROp2 == e = e /\\ u = u",
            "ROp1 == ROp2 /\\ ROp2",
            "====",
            "",
          ].join("\n"),
        ],
      ]);
      const printed: string[] = [];
      await check({
        source: [
          "---- MODULE M ----",
          "EXTENDS TLC, Naturals",
          "VARIABLE y",
          instance,
          "Init == y = 0",
          "Next == y' = (y + 1) % 2",
          "Spec == Init /\\ [][Next]_y",
          `Check == ${reached}`,
          "====",
          "",
        ].join("\n"),
        config:
          kind === "PROPERTY"
            ? "SPECIFICATION Spec\nPROPERTY Check\n"
            : `INIT Init\nNEXT Next\n${kind} Check\n`,
        loadModule: (name) => modules.get(name),
        onPrint: (text) => printed.push(text),
      });
      expect(printed).toEqual(Array.from({ length: count }, () => '"d"'));
    },
  );

  it.each([
    [
      "CONSTANT N <- D",
      '---- MODULE M ----\nEXTENDS TLC, Naturals\nCONSTANT N\nVARIABLE y\nInit == y = 0\nNext == y\' = (y + 1) % 3\nD == PrintT("D")\nI == INSTANCE L WITH c <- N\nInv == I!R(2)\n====\n',
      "CONSTANT N <- D\n",
      2,
    ],
    [
      'WITH c <- PrintT("D")',
      '---- MODULE M ----\nEXTENDS TLC, Naturals\n\nVARIABLE y\nInit == y = 0\nI == INSTANCE L WITH c <- PrintT("D")\nInv == I!R(2)\nNext == y\' = (y + 1) % 3\n====\n',
      "",
      1,
    ],
  ])(
    "evaluates a substitution once per entry into a recursive instanced operator, through %s",
    async (_title, source, substitution, count) => {
      const printed: string[] = [];
      await check({
        source,
        config: `INIT Init\nNEXT Next\n${substitution}INVARIANT Inv\n`,
        loadModule: (name) =>
          name === "L"
            ? "---- MODULE L ----\nEXTENDS TLC, Naturals\nCONSTANT c\nVARIABLE y\nRECURSIVE R(_)\nR(k) == IF k = 0 THEN c ELSE c /\\ R(k - 1)\n====\n"
            : undefined,
        onPrint: (text) => printed.push(text),
      });
      expect(printed).toEqual(Array.from({ length: count }, () => '"D"'));
    },
  );

  it.each([
    ["INVARIANT Inv and VInv", "INVARIANT Inv\nINVARIANT VInv\n", 449],
    [
      "INVARIANT Inv and VInv and PROPERTY VSpec",
      "INVARIANT Inv\nINVARIANT VInv\nPROPERTY VSpec\n",
      961,
    ],
    ["PROPERTY VSpec", "PROPERTY VSpec\n", 897],
  ])(
    "evaluates MCPaxos's Quorum substitute once per entry into its instance of Voting, with %s, as TLC does",
    async (_title, checks, count) => {
      const printed: string[] = [];
      const result = await check({
        source: [
          "---- MODULE M ----",
          "EXTENDS TLC, Naturals",
          "CONSTANT Acceptor, Quorum",
          "VARIABLE msgs",
          "votes == [a \\in Acceptor |-> {m.bal : m \\in {mm \\in msgs : mm.acc = a}}]",
          "V == INSTANCE V",
          'MCQuorum == IF PrintT("Q") THEN {{1, 2}, {2, 3}} ELSE {}',
          "Init == msgs = {}",
          "Send(a, b) == /\\ \\E Q \\in Quorum : a \\in Q",
          "              /\\ msgs' = msgs \\cup {[acc |-> a, bal |-> b]}",
          "Next == \\E a \\in Acceptor, b \\in {0, 1} : Send(a, b)",
          "Spec == Init /\\ [][Next]_msgs",
          "Inv == \\A b \\in {0, 1} : V!ShowsSafeAt({1, 2}, b)",
          "VInv == V!Inv",
          "VSpec == V!Spec",
          "====",
          "",
        ].join("\n"),
        config: `CONSTANT Acceptor = {1, 2, 3}\nCONSTANT Quorum <- MCQuorum\nSPECIFICATION Spec\n${checks}`,
        loadModule: (name) =>
          name === "V"
            ? [
                "---- MODULE V ----",
                "EXTENDS Naturals",
                "CONSTANT Acceptor, Quorum",
                "VARIABLE votes",
                "VotedFor(a, b) == b \\in votes[a]",
                "DidNotVoteAt(a, b) == ~ VotedFor(a, b)",
                "ShowsSafeAt(Q, b) == \\A a \\in Q : VotedFor(a, b) \\/ DidNotVoteAt(a, b)",
                "SafeAt(b) == \\E Q \\in Quorum : ShowsSafeAt(Q, b)",
                "VoteFor(a, b) == /\\ SafeAt(b)",
                "                 /\\ votes' = [votes EXCEPT ![a] = @ \\cup {b}]",
                "Next == \\E a \\in Acceptor, b \\in {0, 1} : VoteFor(a, b)",
                "Init == votes = [a \\in Acceptor |-> {}]",
                "Spec == Init /\\ [][Next]_votes",
                "Inv == \\A b \\in {0, 1} : SafeAt(b)",
                "====",
                "",
              ].join("\n")
            : undefined,
        onPrint: (text) => printed.push(text),
      });
      expect([printed.length, result.distinctStates]).toEqual([count, 64]);
    },
  );

  const PROPERTY_PARTS = [
    "---- MODULE P ----",
    "EXTENDS TLC, Naturals",
    "CONSTANT c",
    "VARIABLE z",
    "InnerS == c = TRUE /\\ z \\in 0..1",
    "Init == InnerS /\\ z = 0",
    "Step == InnerS /\\ InnerS /\\ z' = (z + 1) % 2",
    "Spec == Init /\\ [][Step]_z",
    "SpecInv == [](InnerS /\\ InnerS)",
    "SpecSub == [][InnerS /\\ FALSE]_c",
    "SpecQ == \\A q \\in {0, 1} : [][Step /\\ q \\in {0, 1}]_z",
    "SpecArg(A) == [][A]_z",
    "SpecApp == SpecArg(Step)",
    "SpecArgInv(A) == [](A)",
    "SpecAppInv == SpecArgInv(InnerS)",
    "====",
    "",
  ].join("\n");
  const getPropertyPartCheck = (property: string, head: string[], printed: string[]) => ({
    source: `---- MODULE M ----\nEXTENDS TLC, Naturals\n${head[0]}VARIABLE y\n${head[1]}\nInit == y = 0\nNext == y' = (y + 1) % 2\nSpec == Init /\\ [][Next]_y\nProp == ${property}\n====\n`,
    config: `SPECIFICATION Spec\n${head[2]}PROPERTY Prop\n`,
    loadModule: (name: string) => (name === "P" ? PROPERTY_PARTS : undefined),
    onPrint: (text: string) => printed.push(text),
  });

  it.each([
    ["I!Spec", "WITH c <- PrintT", EXPLICIT, 3],
    ["I!SpecInv", "WITH c <- PrintT", EXPLICIT, 2],
    ["I!SpecSub", "WITH c <- PrintT", EXPLICIT, 6],
    ["I!SpecQ", "WITH c <- PrintT", EXPLICIT, 4],
    ["I!Spec", "CONSTANT c <- D", IMPLICIT, 4],
    ['I("c")!Spec /\\ I("c")!SpecInv', "I(x) WITH c <- PrintT(x)", PARAMETERIZED, 5],
  ])(
    "evaluates the substitutions of each part SpecProcessor#processConfigProps takes out of PROPERTY %s once per evaluation, through %s",
    async (property, _title, head, count) => {
      const printed: string[] = [];
      await check(getPropertyPartCheck(property, head, printed));
      expect(printed).toEqual(Array.from({ length: count }, () => '"c"'));
    },
  );

  it.each([
    ["I!SpecApp", "WITH c <- PrintT", EXPLICIT, 0],
    ["I!SpecApp", "CONSTANT c <- D", IMPLICIT, 1],
    ['I("c")!SpecApp', "I(x) WITH c <- PrintT(x)", PARAMETERIZED, 0],
  ])(
    "rejects the action of the application PROPERTY %s reaches through %s, as SpecProcessor#processConfigProps inlines none under a SubstInNode",
    async (property, _title, head, count) => {
      const printed: string[] = [];
      await expect(check(getPropertyPartCheck(property, head, printed))).rejects.toThrow(
        new TlaEvaluationError(
          "Temporal formulas containing actions must be of forms <>[]A or []<>A.",
        ),
      );
      expect(printed).toEqual(Array.from({ length: count }, () => '"c"'));
    },
  );

  it.each([
    ["I!SpecAppInv", "WITH c <- PrintT", EXPLICIT, 5],
    ["I!SpecAppInv", "CONSTANT c <- D", IMPLICIT, 6],
    ['I("c")!SpecAppInv', "I(x) WITH c <- PrintT(x)", PARAMETERIZED, 5],
  ])(
    "evaluates the argument of the application PROPERTY %s reaches through %s at each liveness check, as Liveness#astToLiveAppl binds it uncachable",
    async (property, _title, head, count) => {
      const printed: string[] = [];
      await check(getPropertyPartCheck(property, head, printed));
      expect(printed).toEqual(Array.from({ length: count }, () => '"c"'));
    },
  );

  it("evaluates the argument of an operator a PROPERTY applies at each liveness check, as SpecProcessor#processConfigProps binds it uncachable", async () => {
    const printed: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS TLC, Naturals\nVARIABLE y\nInit == y = 0\nNext == y\' = (y + 1) % 2\nSpec == Init /\\ [][Next]_y /\\ WF_y(Next)\nLive(A) == <>(A)\nProp == Live(PrintT("c") /\\ y = 1)\n====\n',
      config: "SPECIFICATION Spec\nPROPERTY Prop\n",
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toEqual(['"c"', '"c"', '"c"', '"c"', '"c"']);
  });

  it.each([
    ["Init == /\\ x = 0\n        /\\ G(P(1, x))\nSpec == Init /\\ [][Next]_<<x, y>>", 1],
    ["Init == x = 0\nSpec == Init /\\ G(P(1, x)) /\\ [][Next]_<<x, y>>", 2],
    ["Init == x \\in {0, 1} /\\ G(P(1, x))\nSpec == Init /\\ [][Next]_<<x, y>>", 2],
    ["Init == x = 0\nK(b) == G(b)\nSpec == Init /\\ K(P(1, x)) /\\ [][Next]_<<x, y>>", 2],
    [
      "Init == x = 0\nK(b) == G(b) /\\ x = 0\nBoth == K(P(1, x))\nSpec == Init /\\ Both /\\ [][Next]_<<x, y>>",
      1,
    ],
    [
      "H(b) == b /\\ b\nInit == x = 0 /\\ y = 0 /\\ H(P(1, TRUE))\nSpec == Init /\\ [][Next]_<<x, y>>",
      1,
    ],
  ])(
    "binds an argument under %j cached in a state-level definition, as getInitStates does, and uncached in an application the spec takes apart",
    async (definitions, count) => {
      const printed: string[] = [];
      await check({
        source: `---- MODULE M ----\nEXTENDS Integers, TLC\nP(m, v) == IF PrintT(m) THEN v ELSE v\nVARIABLES x, y\nG(a) == /\\ a = 0\n        /\\ y = 0\n        /\\ a = 0\nNext == UNCHANGED <<x, y>>\n${definitions}\n====\n`,
        config: "SPECIFICATION Spec\n",
        onPrint: (text) => printed.push(text),
      });
      expect(printed).toEqual(Array.from({ length: count }, () => "1"));
    },
  );

  it("evaluates a state-level Init's LET at each read when it rebuilds the trace, as TLC takes Init whole", async () => {
    const printed: string[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLES x, y\nInit == LET a == PrintT(0) IN x = a /\\ y = a /\\ a = a\nNext == x' = (x + 1) % 2 /\\ y' = y\nSpec == Init /\\ [][Next]_<<x, y>>\n====\n",
      config: "SPECIFICATION Spec\n",
      onPrint: (text) => printed.push(text),
    });
    expect([printed, result.failure?.traceOutput]).toEqual([
      ["0", "0", "0", "0"],
      ["0", "0", "0", "0"],
    ]);
  });

  it("reads TLCGet in every state through a constant substituted with it, as TLC's level bound does", async () => {
    const prints: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS Integers, TLC\nCONSTANT G(_)\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x\' = x + 1\nInv == PrintT(G("level"))\n====',
      config: "CONSTANT G <- TLCGet\nINIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
      onPrint: (text) => prints.push(text),
    });
    expect(prints).toEqual(["1", "2", "3"]);
  });

  it("reads the behavior through a constant substituted with Trace, as TLC does", async () => {
    const prints: string[] = [];
    await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, Sequences, TLC, TLCExt\nCONSTANT G\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1\nInv == PrintT(Len(G))\n====",
      config: "CONSTANT G <- Trace\nINIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
      onPrint: (text) => prints.push(text),
    });
    expect(prints).toEqual(["1", "2", "3"]);
  });

  it("overrides definitions and ignores undeclared names assigned by the configuration", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x \\in Nat \\cap {0, 9}\nNext == x' = x\n====",
      config: "CONSTANT Foo = 1\nCONSTANT Nat = {0, 1}\nINIT Init\nNEXT Next",
    });
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "success",
      2,
      1,
    ]);
  });

  it("substitutes infix operator constants", async () => {
    const result = await checkModule(
      "CONSTANT _++_\nPlusPlus(a, b) == <<a, b>>\nASSUME (1 ++ 2) = <<1, 2>>",
      "CONSTANT ++ <- PlusPlus",
    );
    expect(result.status).toBe("success");
  });

  it("follows definition overrides inside the specification", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nVARIABLE x\nInit == x = 0\nMCInit == x = 1\nSpec == Init /\\ [][x' = x]_x\nInv == x = 1\n====",
      config: "CONSTANT Init <- MCInit\nSPECIFICATION Spec\nINVARIANT Inv",
    });
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates]).toEqual([2, 1]);
  });

  it("checks the Github687spec configs from TLC's tests", async () => {
    const checkConfig = (name: string) =>
      checkFixture("github687", "Github687spec", `Github687spec${name}`);
    expect(
      await Promise.all(
        ["A", "B", "C", "InitNext", "Prime"].map(async (name) => {
          const result = await checkConfig(name);
          return [result.status, result.generatedStates, result.distinctStates];
        }),
      ),
    ).toEqual([
      ["success", 21, 7],
      ["success", 14, 7],
      ["success", 21, 7],
      ["success", 21, 7],
      ["liveness-violation", 14, 7],
    ]);
    await expect(checkConfig("D")).rejects.toThrow(
      new TlaConfigError("The spec is trivially false because ModInsanityCheck is false."),
    );
  });

  it("rejects constant conjuncts of the specification and properties that aren't TRUE", async () => {
    const checkSpec = (definitions: string, config: string) =>
      check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nCONSTANT C\nVARIABLE x\nInit == x = 0\nNext == x' = 1 - x\nTrue == 1 < 2\nFalse == 1 > 2\nFive == 5\n${definitions}\n====`,
        config: `CONSTANT C = FALSE\n${config}`,
      });
    const base = "Spec == Init /\\ [][Next]_x";
    expect(
      (await checkSpec(`${base} /\\ TRUE /\\ True`, "SPECIFICATION Spec")).generatedStates,
    ).toBe(3);
    await expect(checkSpec(`${base} /\\ FALSE`, "SPECIFICATION Spec")).rejects.toThrow(
      new TlaConfigError("The spec is trivially false because FALSE is false."),
    );
    await expect(checkSpec(`${base} /\\ C`, "SPECIFICATION Spec")).rejects.toThrow(
      new TlaConfigError("The spec is trivially false because C is false."),
    );
    await expect(checkSpec(`${base} /\\ Five`, "SPECIFICATION Spec")).rejects.toThrow(
      new TlaConfigError("The operator Five, which equals 5,\ncannot be used as a spec"),
    );
    const checkProperty = (property: string) =>
      checkSpec(
        `${base}\nProp == [](x \\in {0, 1}) /\\ ${property}`,
        "SPECIFICATION Spec\nPROPERTY Prop",
      );
    expect((await checkProperty("True")).status).toBe("success");
    await expect(checkProperty("False")).rejects.toThrow(
      new TlaConfigError("The spec is trivially false because False is false."),
    );
    await expect(checkProperty("Five")).rejects.toThrow(
      new TlaConfigError("The operator Five, which equals 5,\ncannot be used as a property"),
    );
  });

  it.each(["x = FALSE /\\ x", "x = 0 /\\ FALSE", "x = 0 /\\ C"])(
    "takes a state-level Init of the specification whole, as TLC does: %s",
    async (init) => {
      const result = await check({
        source: `---- MODULE M ----\nCONSTANT C\nVARIABLE x\nInit == ${init}\nNext == x' = x\nSpec == Init /\\ [][Next]_x\n====`,
        config: "CONSTANT C = FALSE\nSPECIFICATION Spec",
      });
      expect([result.status, result.distinctStates]).toEqual(["success", 0]);
    },
  );

  it.each([
    "Prop == LET E == {x} IN [](\\A e \\in E : e < 1)",
    "Holds(S) == [](\\A e \\in S : e < 1)\nProp == Holds({x})",
  ])("checks a []P property whose LET or argument reads a variable: %s", async (property) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1\nSpec == Init /\\ [][Next]_x\n${property}\n====`,
      config: "SPECIFICATION Spec\nPROPERTY Prop\nCHECK_DEADLOCK FALSE",
    });
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "invariant-violation",
      2,
      2,
    ]);
  });

  it.each([
    [
      "Bad(r) == r \\div 0 = 1\nNext == \\E m \\in {}, r \\in {1} : Bad(r) /\\ x' = m",
      "deadlock",
      1,
      1,
    ],
    [
      "Ok(r) == r # x\nNext == \\E m \\in 1..2, r \\in 0..2 : Ok(r) /\\ x < 3 /\\ x' = (m + r) % 4",
      "success",
      13,
      4,
    ],
  ])(
    "checks the guards of a multi-bound \\E that read only the outer bound: %s",
    async (next, status, generatedStates, distinctStates) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\n${next}\n====`,
        config: `INIT Init\nNEXT Next${status === "success" ? "\nCHECK_DEADLOCK FALSE" : ""}`,
      });
      expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
        status,
        generatedStates,
        distinctStates,
      ]);
    },
  );

  it("names the source of each set whose method failed when it replays a step", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nVARIABLE x\nInit == x = 0\nNext == x' = IF {x} \\subseteq {{}} THEN 1 ELSE 2\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect(formatCallStackLines(result)).toEqual([
      "Line 4, column 9 to line 4, column 48 in M",
      "Line 4, column 14 to line 4, column 48 in M",
      "Line 4, column 17 to line 4, column 34 in M",
      "Line 4, column 17 to line 4, column 19 in M",
      "Line 4, column 31 to line 4, column 34 in M",
      "Line 4, column 32 to line 4, column 33 in M",
    ]);
    expect(result.failure?.fingerprint?.reason).toBe(
      "Attempted to check equality of the set {} with the value:\n0",
    );
  });

  it.each([
    [
      "a function",
      "g[n \\in 0..1] == a + n\nP == g[1] + b >= 0",
      [
        "Line 15, column 9 to line 15, column 22 in M",
        "Line 15, column 9 to line 15, column 13 in M",
        "Line 15, column 18 to line 15, column 22 in M",
        "Line 17, column 8 to line 17, column 12 in M",
        "Line 14, column 1 to line 14, column 44 in M",
        "Line 12, column 1 to line 12, column 39 in M",
        "Line 8, column 6 to line 8, column 18 in M",
        "Line 8, column 6 to line 8, column 13 in M",
        "Line 8, column 6 to line 8, column 9 in M",
        "Line 7, column 18 to line 7, column 22 in M",
        "Line 7, column 18 to line 7, column 18 in M",
        "Line 12, column 31 to line 12, column 31 in M",
        "Line 14, column 29 to line 14, column 36 in M",
      ],
    ],
    [
      "an operator",
      "P == a + b >= 0",
      [
        "Line 14, column 9 to line 14, column 22 in M",
        "Line 14, column 9 to line 14, column 13 in M",
        "Line 14, column 18 to line 14, column 22 in M",
        "Line 16, column 8 to line 16, column 12 in M",
        "Line 13, column 1 to line 13, column 44 in M",
        "Line 11, column 1 to line 11, column 39 in M",
        "Line 7, column 6 to line 7, column 15 in M",
        "Line 7, column 6 to line 7, column 10 in M",
        "Line 7, column 6 to line 7, column 6 in M",
        "Line 11, column 31 to line 11, column 31 in M",
        "Line 13, column 29 to line 13, column 36 in M",
      ],
    ],
  ])(
    "holds each name a replacement stands for through two instances in the call stack of %s, as TLC evaluates each LazyValue",
    async (_title, definitions, lines) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLES x, y\n---- MODULE Inner ----\nEXTENDS Naturals\nVARIABLES a, b\n${definitions}\n====\n---- MODULE Mid ----\nVARIABLES p, q\nJ == INSTANCE Inner WITH a <- p, b <- q\n====\nI == INSTANCE Mid WITH p <- x \\div y, q <- y\nInit == x = 0 /\\ y = 0\nNext == UNCHANGED <<x, y>>\nInv == I!J!P\n====`,
        config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      });
      expect(formatCallStackLines(result)?.filter((line) => line !== "")).toEqual(lines);
    },
  );

  it.each([
    [
      "printing substitutes",
      'I == INSTANCE P WITH c <- PrintT("c"), z <- y\nInv == I!Op',
      'Op == LET K == INSTANCE Q WITH d <- PrintT(<<"d", c>>), w <- z IN K!OutErr /\\ c',
      [
        "Line 4, column 9 to line 4, column 13 in M",
        "Line 8, column 8 to line 8, column 11 in M",
        "Line 7, column 1 to line 7, column 45 in M",
        "Line 5, column 7 to line 5, column 79 in P",
        "Line 5, column 67 to line 5, column 79 in P",
        "Line 5, column 67 to line 5, column 74 in P",
        "Line 5, column 11 to line 5, column 62 in P",
        "Line 7, column 11 to line 7, column 19 in Q",
        "Line 7, column 17 to line 7, column 19 in Q",
        "Line 6, column 8 to line 6, column 23 in Q",
        "Line 6, column 13 to line 6, column 23 in Q",
        "Line 6, column 13 to line 6, column 19 in Q",
      ],
    ],
    [
      "a constant substitute",
      "I == INSTANCE P WITH c <- TRUE, z <- y\nInv == I!Op",
      "Op == LET K == INSTANCE Q WITH d <- c, w <- z IN K!OutErr",
      [
        "Line 4, column 9 to line 4, column 13 in M",
        "Line 8, column 8 to line 8, column 11 in M",
        "Line 7, column 1 to line 7, column 38 in M",
        "Line 5, column 7 to line 5, column 57 in P",
        "Line 5, column 50 to line 5, column 57 in P",
        "Line 5, column 11 to line 5, column 45 in P",
        "Line 7, column 11 to line 7, column 19 in Q",
        "Line 7, column 17 to line 7, column 19 in Q",
        "Line 6, column 8 to line 6, column 23 in Q",
        "Line 6, column 13 to line 6, column 23 in Q",
        "Line 6, column 13 to line 6, column 19 in Q",
      ],
    ],
    [
      "an operator's parameter",
      "I == INSTANCE P WITH c <- TRUE, z <- y\nInv == I!Op(TRUE)",
      "Op(a) == LET K == INSTANCE Q WITH d <- a, w <- z IN K!OutErr",
      [
        "Line 4, column 9 to line 4, column 13 in M",
        "Line 8, column 8 to line 8, column 17 in M",
        "Line 7, column 1 to line 7, column 38 in M",
        "Line 5, column 10 to line 5, column 60 in P",
        "Line 5, column 53 to line 5, column 60 in P",
        "Line 5, column 14 to line 5, column 48 in P",
        "Line 7, column 11 to line 7, column 19 in Q",
        "Line 7, column 17 to line 7, column 19 in Q",
        "Line 6, column 8 to line 6, column 23 in Q",
        "Line 6, column 13 to line 6, column 23 in Q",
        "Line 6, column 13 to line 6, column 19 in Q",
      ],
    ],
    [
      "a module two instances down",
      "I == INSTANCE P WITH c <- TRUE, z <- y\nInv == I!J!Op",
      "J == INSTANCE P2 WITH e <- c, x <- z",
      [
        "Line 4, column 9 to line 4, column 13 in M",
        "Line 8, column 8 to line 8, column 13 in M",
        "Line 7, column 1 to line 7, column 38 in M",
        "Line 5, column 1 to line 5, column 36 in P",
        "Line 5, column 7 to line 5, column 57 in P2",
        "Line 5, column 50 to line 5, column 57 in P2",
        "Line 5, column 11 to line 5, column 45 in P2",
        "Line 7, column 11 to line 7, column 19 in Q",
        "Line 7, column 17 to line 7, column 19 in Q",
        "Line 6, column 8 to line 6, column 23 in Q",
        "Line 6, column 13 to line 6, column 23 in Q",
        "Line 6, column 13 to line 6, column 19 in Q",
      ],
    ],
  ])(
    "records the INSTANCE of a LET INSTANCE in an instanced module, with %s, as TLC does",
    async (_title, definitions, instanced, lines) => {
      const modules = new Map([
        ["P", `---- MODULE P ----\nEXTENDS TLC\nCONSTANT c\nVARIABLE z\n${instanced}\n====\n`],
        [
          "P2",
          "---- MODULE P2 ----\nEXTENDS TLC\nCONSTANT e\nVARIABLE x\nOp == LET K == INSTANCE Q WITH d <- e, w <- x IN K!OutErr\n====\n",
        ],
        [
          "Q",
          '---- MODULE Q ----\nEXTENDS TLC, Naturals\nCONSTANT d\nVARIABLE w\nIn == d = TRUE /\\ w \\in 0..1\nErr == d /\\ w + "a" = 1\nOutErr == In /\\ Err\nArgErr(a) == a /\\ OutErr\nStepErr == In /\\ w\' = w + "a"\n====\n',
        ],
      ]);
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS TLC, Naturals\nVARIABLE y\nInit == y = 0\nNext == y' = (y + 1) % 2\nSpec == Init /\\ [][Next]_y\n${definitions}\n====\n`,
        config: "SPECIFICATION Spec\nINVARIANT Inv\n",
        loadModule: (name) => modules.get(name),
        onPrint: () => {},
      });
      expect(formatCallStackLines(result)?.filter((line) => line !== "")).toEqual(lines);
    },
  );

  const PARAMETERIZED_SPEC_MODULE =
    '---- MODULE N ----\nEXTENDS Integers\nCONSTANT k\nVARIABLES x, y\nG(a) == /\\ a = k\n        /\\ y = 0\n        /\\ a + "s" = 1\nFlag == FALSE\nInit == x = k /\\ G(x)\nFlagInit == x = k /\\ y = 0 /\\ Flag\nNext == UNCHANGED <<x, y>>\nSpec == Init /\\ [][Next]_<<x, y>>\nFlagSpec == FlagInit /\\ [][Next]_<<x, y>>\n====\n';

  const checkParameterizedSpec = (spec: string) =>
    check({
      source: `---- MODULE M ----\nVARIABLES x, y\nI(j) == INSTANCE N WITH k <- j\n${spec}\n====\n`,
      config: "SPECIFICATION Spec\n",
      loadModule: (name) => (name === "N" ? PARAMETERIZED_SPEC_MODULE : undefined),
    });

  it.each([
    [
      "Spec == I(0)!Init /\\ [][I(0)!Next]_<<x, y>>",
      [
        "Line 3, column 1 to line 3, column 30 in M",
        "Line 9, column 9 to line 9, column 13 in N",
        "Line 3, column 1 to line 3, column 30 in M",
        "Line 9, column 18 to line 9, column 21 in N",
        "Line 5, column 9 to line 7, column 22 in N",
        "Line 5, column 12 to line 5, column 16 in N",
        "Line 6, column 12 to line 6, column 16 in N",
        "Line 7, column 12 to line 7, column 22 in N",
        "Line 7, column 12 to line 7, column 18 in N",
      ],
    ],
    [
      "Spec == I(0)!Spec",
      [
        "Line 3, column 1 to line 3, column 30 in M",
        "Line 9, column 9 to line 9, column 21 in N",
        "Line 9, column 9 to line 9, column 13 in N",
        "Line 9, column 18 to line 9, column 21 in N",
        "Line 5, column 9 to line 7, column 22 in N",
        "Line 5, column 12 to line 5, column 16 in N",
        "Line 6, column 12 to line 6, column 16 in N",
        "Line 7, column 12 to line 7, column 22 in N",
        "Line 7, column 12 to line 7, column 18 in N",
      ],
    ],
  ])(
    "takes the initial predicate of a parameterized instance's %j apart as TLC does",
    async (spec, lines) => {
      const result = await checkParameterizedSpec(spec);
      expect(formatCallStackLines(result)?.filter((line) => line !== "")).toEqual(lines);
    },
  );

  it("takes a parameterized instance's state-level Init whole, as TLC does, so a FALSE conjunct inside leaves no initial state", async () => {
    const result = await checkParameterizedSpec("Spec == I(0)!FlagSpec");
    expect([result.status, result.failure?.message, result.distinctStates]).toEqual([
      "success",
      undefined,
      0,
    ]);
  });

  const LITERAL_MODULE =
    '---- MODULE N ----\nCONSTANT k\nVARIABLES x, y\nTwo == 2\nStr == "a"\nNext == UNCHANGED <<x, y>>\nInit == x = k /\\ y = 0 /\\ Two\nSpec == x = k /\\ y = 0 /\\ Str /\\ [][Next]_<<x, y>>\nProp == []<>(x = k) /\\ Two\n====\n';

  it.each([
    [
      "Spec == I(0)!Init /\\ [][I(0)!Next]_<<x, y>>",
      "",
      "The operator Two, which equals 2,\ncannot be used as a spec",
    ],
    ["Spec == I(0)!Spec", "", 'The operator Str, which equals "a",\ncannot be used as a spec'],
    ["Spec == J!Spec", "", 'The operator Str, which equals "a",\ncannot be used as a spec'],
    [
      "Spec == J!Init /\\ [][J!Next]_<<x, y>>\nProp == I(0)!Prop",
      "PROPERTY Prop\n",
      "The operator Two, which equals 2,\ncannot be used as a property",
    ],
    [
      "Spec == LET T == 2 IN J!Init /\\ T /\\ [][J!Next]_<<x, y>>",
      "",
      "The operator T, which equals 2,\ncannot be used as a spec",
    ],
    [
      "Spec == J!Init /\\ J!Two /\\ [][J!Next]_<<x, y>>",
      "",
      "The operator J!Two, which equals 2,\ncannot be used as a spec",
    ],
    [
      "Spec == LET T == FALSE IN J!Init /\\ T /\\ [][J!Next]_<<x, y>>",
      "",
      "The spec is trivially false because FALSE is false.",
    ],
  ])(
    "looks up a definition %j names, where TLC stored no value for it at startup, as its literal body, as TLC does",
    async (spec, property, message) => {
      const checked = check({
        source: `---- MODULE M ----\nVARIABLES x, y\nI(j) == INSTANCE N WITH k <- j\nJ == INSTANCE N WITH k <- 0\n${spec}\n====\n`,
        config: `SPECIFICATION Spec\n${property}`,
        loadModule: (name) => (name === "N" ? LITERAL_MODULE : undefined),
      });
      await expect(checked).rejects.toThrow(new TlaConfigError(message));
    },
  );

  const WHOLE_MODULES = new Map([
    [
      "N",
      '---- MODULE N ----\nEXTENDS Naturals\nCONSTANT k\nVARIABLES x, y\nTwo == 2\nStr == "a"\nSum == 1 + 1\nBad == x + 1\nInit == x = k /\\ y = 0\nInitSum == x = k /\\ y = 0 /\\ (1 + 1)\nInv == [](x + 1)\nInner == INSTANCE O WITH m <- k\nInitIn == x = 0 /\\ y = 0 /\\ Inner!BadM\nInvIn == [](Inner!BadM)\nSpecN == x = k /\\ y = 0 /\\ (1 + 1) /\\ [][UNCHANGED <<x, y>>]_<<x, y>>\n====\n',
    ],
    [
      "O",
      "---- MODULE O ----\nEXTENDS Naturals\nCONSTANT m\nVARIABLES x, y\nBadM == x + m\n====\n",
    ],
  ]);
  const UNCHANGED_STEP = "[][UNCHANGED <<x, y>>]_<<x, y>>";
  const getWholeFailure = async (definitions: string, property: string, coverage?: number) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLES x, y\nI(j) == INSTANCE N WITH k <- j\nJ == INSTANCE N WITH k <- 0\n${definitions}\n====\n`,
      config: `SPECIFICATION Spec\n${property}`,
      loadModule: (name) => WHOLE_MODULES.get(name),
      coverage,
    });
    return result.failure?.message;
  };

  it.each([
    [
      `Spec == I(0)!Init /\\ I(0)!Two /\\ ${UNCHANGED_STEP}`,
      "",
      "In computing initial states, TLC expected a boolean expression,\nbut instead found 2.\nline 6, col 22 to line 6, col 29 of module M",
    ],
    [
      `Spec == I(0)!Init /\\ I(0)!Str /\\ ${UNCHANGED_STEP}`,
      "",
      'In computing initial states, TLC expected a boolean expression,\nbut instead found "a".\nline 6, col 22 to line 6, col 29 of module M',
    ],
    [
      `Two(a) == 2\nSpec == x = 0 /\\ y = 0 /\\ Two(1) /\\ ${UNCHANGED_STEP}`,
      "",
      "In computing initial states, TLC expected a boolean expression,\nbut instead found 2.\nline 7, col 27 to line 7, col 32 of module M",
    ],
    [
      `Spec == LET F(a) == 2 IN x = 0 /\\ y = 0 /\\ F(1) /\\ ${UNCHANGED_STEP}`,
      "",
      "In computing initial states, TLC expected a boolean expression,\nbut instead found 2.\nline 6, col 44 to line 6, col 47 of module M",
    ],
    [
      `Two(a) == 2\nSpec == x = 0 /\\ y = 0 /\\ ${UNCHANGED_STEP}\nProp == []<>(x = 0) /\\ Two(1)`,
      "PROPERTY Prop\n",
      "TLC expected a boolean value, but did not find one. line 8, col 24 to line 8, col 29 of module M",
    ],
  ])(
    "takes an application in %j whole when the definition's body is a literal, with and without coverage, as TLC does",
    async (definitions, property, message) => {
      expect([
        await getWholeFailure(definitions, property),
        await getWholeFailure(definitions, property, 1),
      ]).toEqual([message, message]);
    },
  );

  const INSTANCE_LINE = "line 4, col 1 to line 4, col 30 of module M";
  const UNPARAMETERIZED_LINE = "line 5, col 1 to line 5, col 27 of module M";
  const getWholeMessage = (found: number, location: string) =>
    `In computing initial states, TLC expected a boolean expression,\nbut instead found ${found}.\n${location}`;
  it.each([
    [`Spec == I(0)!Init /\\ I(0)!Sum /\\ ${UNCHANGED_STEP}`, "", getWholeMessage(2, INSTANCE_LINE)],
    [`Spec == I(0)!InitSum /\\ ${UNCHANGED_STEP}`, "", getWholeMessage(2, INSTANCE_LINE)],
    [
      `Bad == x + 1\nSpec == x = 0 /\\ y = 0 /\\ Bad /\\ ${UNCHANGED_STEP}`,
      "",
      getWholeMessage(1, "line 6, col 8 to line 6, col 12 of module M"),
    ],
    [
      `Spec == x = 0 /\\ y = 0 /\\ J!Bad /\\ ${UNCHANGED_STEP}`,
      "",
      getWholeMessage(1, UNPARAMETERIZED_LINE),
    ],
    [
      `Spec == x = 0 /\\ y = 0 /\\ I(0)!Bad /\\ ${UNCHANGED_STEP}`,
      "",
      getWholeMessage(1, INSTANCE_LINE),
    ],
    [
      `Spec == x = 0 /\\ y = 0 /\\ J!Inner!BadM /\\ ${UNCHANGED_STEP}`,
      "",
      getWholeMessage(0, UNPARAMETERIZED_LINE),
    ],
    [
      `Spec == x = 0 /\\ y = 0 /\\ I(0)!Inner!BadM /\\ ${UNCHANGED_STEP}`,
      "",
      getWholeMessage(0, INSTANCE_LINE),
    ],
    [`Spec == I(0)!InitIn /\\ ${UNCHANGED_STEP}`, "", getWholeMessage(0, INSTANCE_LINE)],
    ["Spec == J!SpecN", "", getWholeMessage(2, UNPARAMETERIZED_LINE)],
    [
      `Bad == x + 1\nSpec == LET G == 1 IN x = 0 /\\ y = 0 /\\ Bad /\\ ${UNCHANGED_STEP}`,
      "",
      getWholeMessage(1, "line 6, col 8 to line 6, col 12 of module M"),
    ],
    [
      `Spec == x = 0 /\\ y = 0 /\\ ${UNCHANGED_STEP}\nProp == I(0)!Inv`,
      "PROPERTY Prop\n",
      `TLC expected a boolean value, but did not find one. ${INSTANCE_LINE}`,
    ],
    [
      `Spec == x = 0 /\\ y = 0 /\\ ${UNCHANGED_STEP}\nProp == J!Inv`,
      "PROPERTY Prop\n",
      `TLC expected a boolean value, but did not find one. ${UNPARAMETERIZED_LINE}`,
    ],
    [
      `Spec == x = 0 /\\ y = 0 /\\ ${UNCHANGED_STEP}\nProp == []<>(x = 0) /\\ I(0)!Sum`,
      "PROPERTY Prop\n",
      `TLC expected a boolean value, but did not find one. ${INSTANCE_LINE}`,
    ],
    [
      `Spec == x = 0 /\\ y = 0 /\\ ${UNCHANGED_STEP}\nProp == J!InvIn`,
      "PROPERTY Prop\n",
      `TLC expected a boolean value, but did not find one. ${UNPARAMETERIZED_LINE}`,
    ],
  ])(
    "reports the conjunct TLC evaluates whole in %j at the pred of its Action, the outermost instance or the body of a definition it takes whole, with and without coverage, as TLC does",
    async (definitions, property, message) => {
      expect([
        await getWholeFailure(definitions, property),
        await getWholeFailure(definitions, property, 1),
      ]).toEqual([message, message]);
    },
  );

  it.each([
    [
      `Spec == I(0)!Sum /\\ x = 0 /\\ y = 0 /\\ ${UNCHANGED_STEP}`,
      getWholeMessage(2, "line 7, col 8 to line 7, col 12 of module N"),
    ],
    [
      `Spec == J!InitSum /\\ ${UNCHANGED_STEP}`,
      getWholeMessage(2, "line 10, col 31 to line 10, col 35 of module N"),
    ],
    [
      `Spec == J!InitIn /\\ ${UNCHANGED_STEP}`,
      getWholeMessage(0, "line 13, col 29 to line 13, col 38 of module N"),
    ],
  ])(
    "reports a conjunct TLC walks to in %j at its own location, with and without coverage, as TLC does",
    async (definitions, message) => {
      expect([
        await getWholeFailure(definitions, ""),
        await getWholeFailure(definitions, "", 1),
      ]).toEqual([message, message]);
    },
  );

  const SUBSTITUTED_MODULES = new Map([
    [
      "N",
      "---- MODULE N ----\nEXTENDS Naturals\nCONSTANT k\nVARIABLES x, y\nInitC == x = 0 /\\ y = 0 /\\ k\nInitW == k /\\ x = 0 /\\ y = 0\nNextC == x' = x /\\ y' = y /\\ k\nK == k\nInitK == x = 0 /\\ y = 0 /\\ K\nO == INSTANCE P WITH m <- k, w <- x\nInitO == O!InitP\n====\n",
    ],
    [
      "P",
      "---- MODULE P ----\nEXTENDS Naturals\nCONSTANT m\nVARIABLES x, y, w\nInitP == x = 0 /\\ y = 0 /\\ m\nInitPW == x = 0 /\\ y = 0 /\\ w\n====\n",
    ],
  ]);
  const getSubstitutedFailure = async (instance: string, spec: string, coverage?: number) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLES x, y\n${instance}\n${spec}\n====\n`,
      config: "SPECIFICATION Spec\n",
      loadModule: (name) => SUBSTITUTED_MODULES.get(name),
      coverage,
    });
    return result.failure?.message;
  };
  const getNextMessage = (found: number, location: string) =>
    `${UNEXPECTED_EXCEPTION}In computing next states, TLC expected a boolean expression,\nbut instead found ${found}.\n${location}`;
  const SUBSTITUTED_NEXT = "Spec == x = 0 /\\ y = 0 /\\ [][J!NextC]_<<x, y>>";

  it.each([
    [
      "J == INSTANCE N WITH k <- 0",
      `Spec == J!InitC /\\ ${UNCHANGED_STEP}`,
      getWholeMessage(0, "line 5, col 28 to line 5, col 28 of module N"),
    ],
    [
      'J == INSTANCE N WITH k <- "a"',
      `Spec == J!InitC /\\ ${UNCHANGED_STEP}`,
      'In computing initial states, TLC expected a boolean expression,\nbut instead found "a".\nline 5, col 28 to line 5, col 28 of module N',
    ],
    [
      "J == INSTANCE N WITH k <- 0",
      `Spec == J!InitO /\\ ${UNCHANGED_STEP}`,
      getWholeMessage(0, "line 5, col 28 to line 5, col 28 of module P"),
    ],
    [
      "J == INSTANCE P WITH m <- 0, w <- x",
      `Spec == J!InitPW /\\ ${UNCHANGED_STEP}`,
      getWholeMessage(0, "line 6, col 29 to line 6, col 29 of module P"),
    ],
    [
      "J == INSTANCE N WITH k <- 0",
      SUBSTITUTED_NEXT,
      getNextMessage(0, "line 7, col 30 to line 7, col 30 of module N"),
    ],
    [
      "J == INSTANCE N WITH k <- 1 + 1",
      `Spec == J!InitC /\\ ${UNCHANGED_STEP}`,
      getWholeMessage(2, "line 5, col 28 to line 5, col 28 of module N"),
    ],
    [
      "J == INSTANCE P WITH m <- 0, w <- x + 0",
      `Spec == J!InitPW /\\ ${UNCHANGED_STEP}`,
      getWholeMessage(0, "line 6, col 29 to line 6, col 29 of module P"),
    ],
    [
      "J == INSTANCE N WITH k <- 1 + 1",
      SUBSTITUTED_NEXT,
      getNextMessage(2, "line 7, col 30 to line 7, col 30 of module N"),
    ],
    [
      "J == INSTANCE N WITH k <- 0",
      "Next == x' = x /\\ y' = y /\\ J!K\nSpec == x = 0 /\\ y = 0 /\\ [][Next]_<<x, y>>",
      getNextMessage(0, "line 5, col 29 to line 5, col 31 of module M"),
    ],
  ])(
    "reports a substituted name in %j %j that TLC evaluates once every variable is assigned at the name, with and without coverage, as TLC's ActionItemList holds it",
    async (instance, spec, message) => {
      expect([
        await getSubstitutedFailure(instance, spec),
        await getSubstitutedFailure(instance, spec, 1),
      ]).toEqual([message, message]);
    },
  );

  it.each([
    [
      "J == INSTANCE N WITH k <- 1 + 1",
      getWholeMessage(2, "line 4, col 27 to line 4, col 31 of module M"),
    ],
    ["J == INSTANCE N WITH k <- 0", "The init state relation is not a boolean expression.\n0"],
  ])(
    "reports a substituted name in %j that TLC walks to at its substitute, as TLC does",
    async (instance, message) => {
      expect(await getSubstitutedFailure(instance, `Spec == J!InitW /\\ ${UNCHANGED_STEP}`)).toBe(
        message,
      );
    },
  );

  it("reports a literal that a LET's scope passes to an initial conjunct by its text, as TLC does", async () => {
    expect(
      await getWholeFailure(
        `F(a) == a\nSpec == LET G == 1 IN x = 0 /\\ y = 0 /\\ F(2) /\\ ${UNCHANGED_STEP}`,
        "",
      ),
    ).toBe(getWholeMessage(2, "2"));
  });

  const checkTakenApart = (spec: string, coverage: number | undefined, prints: string[] = []) =>
    check({
      source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLES x, y\n${spec}\n====\n`,
      config: "SPECIFICATION Spec\n",
      coverage,
      onPrint: (text) => prints.push(text),
    });

  it.each([
    [
      `F(a) == a\nSpec == LET G == 1 IN x = 0 /\\ y = 0 /\\ F(2) /\\ ${UNCHANGED_STEP}`,
      getWholeMessage(2, "2"),
    ],
    [`F(a) == a\nSpec == x = 0 /\\ y = 0 /\\ F(2) /\\ ${UNCHANGED_STEP}`, getWholeMessage(2, "2")],
    [
      `F(a) == a\nSpec == x = 0 /\\ y = 0 /\\ F("s") /\\ ${UNCHANGED_STEP}`,
      'In computing initial states, TLC expected a boolean expression,\nbut instead found "s".\nline 5, col 29 to line 5, col 31 of module M',
    ],
    [
      `F(a, b) == a /\\ b\nSpec == x = 0 /\\ y = 0 /\\ F(TRUE, 2) /\\ ${UNCHANGED_STEP}`,
      getWholeMessage(2, "2"),
    ],
  ])(
    "follows a parameter of an application the specification takes apart in %j to its literal argument, with and without coverage, as SpecProcessor#processConfigSpec does",
    async (spec, message) => {
      const failures = [
        (await checkTakenApart(spec, undefined)).failure?.message,
        (await checkTakenApart(spec, 1)).failure?.message,
      ];
      expect(failures).toEqual([message, message]);
    },
  );

  it.each([undefined, 1])(
    "evaluates an argument of an application the specification takes apart at each read with coverage %j, as SpecProcessor#getOpContext binds it as an uncachable LazyValue",
    async (coverage) => {
      const prints: string[] = [];
      await checkTakenApart(
        `F(a) == x = a /\\ y = a\nSpec == F(PrintT(0)) /\\ ${UNCHANGED_STEP}`,
        coverage,
        prints,
      );
      expect(prints).toEqual(["0", "0"]);
    },
  );

  it.each([
    [
      `Spec == x = 0 /\\ y = 0 /\\ 2 /\\ ${UNCHANGED_STEP}`,
      [
        "<Action line 4, col 9 to line 4, col 13 of module M>: 0:0",
        "<Action line 4, col 18 to line 4, col 22 of module M>: 0:0",
        "<Action 2>: 0:0",
        "<Action line 4, col 35 to line 4, col 52 of module M>: 0:0",
      ],
    ],
    [
      `F(a) == a\nSpec == x = 0 /\\ y = 0 /\\ F(2) /\\ ${UNCHANGED_STEP}`,
      [
        "<Action line 5, col 9 to line 5, col 13 of module M>: 0:0",
        "<Action line 5, col 18 to line 5, col 22 of module M>: 0:0",
        "<Action 2>: 0:0",
        "<Action line 5, col 38 to line 5, col 55 of module M>: 0:0",
      ],
    ],
    [
      `Spec == 2 /\\ x = 0 /\\ y = 0 /\\ ${UNCHANGED_STEP}`,
      [
        "<Action 2>: 0:0",
        "<Action line 4, col 14 to line 4, col 18 of module M>: 0:0",
        "<Action line 4, col 23 to line 4, col 27 of module M>: 0:0",
        "<Action line 4, col 35 to line 4, col 52 of module M>: 0:0",
      ],
    ],
    [
      `Spec == x = 0 /\\ y = 0 /\\ "s" /\\ ${UNCHANGED_STEP}`,
      [
        "<Action line 4, col 9 to line 4, col 13 of module M>: 0:0",
        "<Action line 4, col 18 to line 4, col 22 of module M>: 0:0",
        "<Action line 4, col 27 to line 4, col 29 of module M>: 0:0",
        "<Action line 4, col 37 to line 4, col 54 of module M>: 0:0",
      ],
    ],
  ])(
    "names the unnamed actions of %j under coverage as TLC's Action#toString does, a numeral by its text",
    async (spec, labels) => {
      const result = await checkTakenApart(spec, 1);
      expect(
        result.coverage?.relations.map(
          (relation) => `<${relation.label}>: ${relation.distinct}:${relation.generated}`,
        ),
      ).toEqual(labels);
    },
  );

  it('describes an application of a definition whose body is a literal in TLCGet("spec") whole, as TLC does', async () => {
    const prints: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLES x, y\nTwo(a) == 2\nSpec == x = 0 /\\ y = 0 /\\ [][UNCHANGED <<x, y>>]_<<x, y>>\nProp == []<>(x = 0) /\\ Two(1)\nASSUME PrintT({<<i.location.beginColumn, i.location.endColumn>> : i \\in TLCGet("spec").impliedinits})\n====\n',
      config: "SPECIFICATION Spec\nPROPERTY Prop\n",
      onPrint: (text) => prints.push(text),
    });
    expect(prints).toEqual(["{<<24, 29>>}"]);
  });

  it("applies an operator to each value @ takes in the same state", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE f\nInc(n) == n + 1\nBump(g, k) == [g EXCEPT ![k] = Inc(@)]\nInit == f = <<1, 2>>\nNext == f[1] < 3 /\\ f' = Bump(Bump(f, 1), 2)\nInv == f[2] = f[1] + 1\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
    });
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates]).toEqual([3, 3]);
  });

  it("reports a symmetry that isn't a set of permutations like TLC", async () => {
    await expect(checkModule("", "SYMMETRY P")).rejects.toThrow(
      new TlaConfigError(
        "The symmetry function P specified in the configuration file\nis not defined in the specification.",
      ),
    );
    const cases = [
      [
        "CONSTANT P",
        "CONSTANT P = {p1, p2}\nSYMMETRY P",
        "The symmetry function P must specify a set of permutations.",
      ],
      ["P == 1", "SYMMETRY P", "The symmetry operator must specify a set of functions."],
      ["P == {1}", "SYMMETRY P", "The symmetry values must be function records."],
    ];
    for (const item of cases) {
      await expect(checkModule(item[0], item[1])).rejects.toThrow(
        new TlaEvaluationError(`${UNEXPECTED_EXCEPTION}${item[2]}`),
      );
    }
  });

  it("evaluates the definition a <- gives a symmetry, and the body of one with parameters, like TLC", async () => {
    const statuses = await Promise.all(
      [
        [
          "CONSTANTS A, N\nPerms == Permutations(A)",
          "CONSTANT A = {a1, a2} N <- Perms\nSYMMETRY N",
        ],
        [
          "CONSTANT A\nPerms == Permutations(A)\nDef == 3",
          "CONSTANT A = {a1, a2} Def <- Perms\nSYMMETRY Def",
        ],
      ].map(async (item) => (await checkModule(item[0], item[1])).status),
    );
    expect(statuses).toEqual(["success", "success"]);
    await expect(checkModule("P(S) == Permutations(S)", "SYMMETRY P")).rejects.toThrow(
      new TlaEvaluationError(
        "In evaluation, the identifier S is either undefined or not an operator.\nline 6, col 22 to line 6, col 22 of module M",
      ),
    );
  });

  it("evaluates the definition a [Mod] <- gives a symmetry, where TLC throws a ClassCastException", async () => {
    const result = await checkModule(
      "CONSTANT A\nPerms == Permutations(A)\nDef == 3",
      "CONSTANT A = {a1, a2} Def <- [M] Perms\nSYMMETRY Def",
    );
    expect(result.status).toBe("success");
  });

  it("takes the symmetry a [Mod] <- gives, where TLC takes the symmetry's own body", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS TLC\nCONSTANTS A, B\nVARIABLE x\nPerms == Permutations(A)\nDef == Permutations(B)\nInit == x \\in A\nNext == x' = x\n====",
      config:
        "CONSTANT A = {a1, a2}\nCONSTANT B = {b1, b2}\nCONSTANT Def <- [M] Perms\nSYMMETRY Def\nINIT Init\nNEXT Next",
    });
    expect([result.status, result.distinctStates]).toEqual(["success", 1]);
  });

  it.each([
    [
      "{(a :> b)[b]}",
      `${UNEXPECTED_EXCEPTION}Attempted to apply function:\n(a :> b)\nto argument b, which is not in the domain of the function.`,
    ],
    ["{1 \\div 0}", `${UNEXPECTED_EVAL_EXCEPTION}The second argument of \\div is 0.`],
  ])(
    "reports the symmetry %s that fails to evaluate as an unexpected exception, as TLC's Tool does",
    async (symmetry, message) => {
      await expect(
        check({
          source: `---- MODULE M ----\nEXTENDS TLC, Naturals\nCONSTANTS a, b\nVARIABLE x\nInit == x \\in {a, b}\nNext == UNCHANGED x\nSym == ${symmetry}\n====`,
          config: "CONSTANTS a = a\nb = b\nINIT Init\nNEXT Next\nSYMMETRY Sym",
        }),
      ).rejects.toThrow(new TlaEvaluationError(message));
    },
  );

  it.each(["1..2", "SUBSET Permutations({a, b})", "{f \\in SUBSET {a} : TRUE}"])(
    "reports that the symmetry %s, which TLC keeps lazy or as an interval, isn't a set of functions",
    async (symmetry) => {
      await expect(
        check({
          source: `---- MODULE M ----\nEXTENDS TLC, Naturals\nCONSTANTS a, b\nVARIABLE x\nInit == x \\in {a, b}\nNext == UNCHANGED x\nSym == ${symmetry}\n====`,
          config: "CONSTANTS a = a\nb = b\nINIT Init\nNEXT Next\nSYMMETRY Sym",
        }),
      ).rejects.toThrow(
        new TlaEvaluationError(
          `${UNEXPECTED_EXCEPTION}The symmetry operator must specify a set of functions.`,
        ),
      );
    },
  );

  it.each(["[{a, b} -> {a, b}]", "{f \\in [{a, b} -> {a, b}] : f[a] # f[b]}", "Perms"])(
    "rejects the symmetry %s, a set of functions TLC keeps lazy, as Tool#getSymmetryPerms does",
    async (symmetry) => {
      await expect(
        check({
          source: `---- MODULE M ----\nEXTENDS TLC\nCONSTANTS a, b\nVARIABLE x\nInit == x \\in {a, b}\nNext == UNCHANGED x\nPerms == {f \\in [{a, b} -> {a, b}] : f[a] # f[b]}\nSym == ${symmetry}\n====`,
          config: "CONSTANTS a = a\nb = b\nINIT Init\nNEXT Next\nSYMMETRY Sym",
        }),
      ).rejects.toThrow(
        new TlaEvaluationError(
          `${UNEXPECTED_EXCEPTION}The symmetry operator must specify a set of functions.`,
        ),
      );
    },
  );

  // Deviation from TLC: TLC fails each with "The symmetry values must be function records.", since it holds the value as a tuple, a record or a lazy function rather than a FcnRcdValue.
  it.each([
    ["{<<>>}", "<<>>"],
    ["{Append(<<>>, a)}", "Append(<<>>,a)"],
    ["{[f |-> a]}", "[f|->a]"],
    ["{[v \\in Nat |-> v]}", "[v\\inNat|->v]"],
  ])("checks the symmetry %s as a function", async (symmetry, image) => {
    const warnings: CheckProgress[] = [];
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS TLC, Naturals, Sequences\nCONSTANTS a, b\nVARIABLE x\nInit == x \\in {a, b}\nNext == UNCHANGED x\nSym == ${symmetry}\n====`,
      config: "CONSTANTS a = a\nb = b\nINIT Init\nNEXT Next\nSYMMETRY Sym",
      onProgress: (progress) => {
        if (progress.kind === "warning") warnings.push(progress);
      },
    });
    expect(result.status).toBe("success");
    expect(warnings).toEqual([
      {
        kind: "warning",
        code: 2300,
        text: `The set ${image} has been defined to be a symmetry set but contains less than two elements.`,
      },
    ]);
  });

  it("reports a failing constant part of a property while processing the spec like TLC", async () => {
    const properties = [
      "<>(1 = {})",
      "<>[](x = 2 => 1 = {})",
      "<>[](IF x = 1 THEN x = 2 ELSE 1 = {})",
    ];
    for (const property of properties) {
      await expect(
        check({
          source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 3\nSpec == Init /\\ [][Next]_x\nProp == ${property}\n====`,
          config: "SPECIFICATION Spec\nPROPERTY Prop",
        }),
      ).rejects.toThrow(
        new TlaEvaluationError(
          `${UNEXPECTED_EXCEPTION}Attempted to check equality of integer 1 with non-integer:\n{}`,
        ),
      );
    }
  });

  it("reports the unassigned constant TLC finds first", async () => {
    const cases = [
      [
        "CONSTANT TableId\nCONSTANT Snapshot\nCONSTANT BranchId",
        "CONSTANT TableId = 1",
        "BranchId",
      ],
      ["CONSTANTS Zeta, Alpha, Mid, N", "CONSTANT Mid = 1", "Zeta"],
      ["CONSTANTS N, Procs, Values, Acceptors, Quorums", "CONSTANT Procs = 1", "Quorums"],
      ["CONSTANTS N, B\nOp(a) == a\nDef == 3", "CONSTANT N = 1 Op <- Def", "B"],
      ["CONSTANT N", "CONSTANT Nat(1) = [Naturals] 1 Nat(1, 2) = [Naturals] 2", "N"],
    ];
    for (const [body, config, name] of cases) {
      await expect(checkModule(body, config)).rejects.toThrow(
        new TlaConfigError(
          `The constant parameter ${name} is not assigned a value by the configuration file.`,
        ),
      );
    }
  });

  it("looks for a reused <- target only among the same module's <-, as TLC does", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nCONSTANT N\nVARIABLE x\nDef == 3\nOther == 4\nI == INSTANCE Sub\nInit == x = 0\nNext == x' = x\nASSUME N = 3 /\\ I!Def = 4\n====",
      config: "INIT Init\nNEXT Next\nCONSTANT N <- Def Def <- [Sub] Other",
      loadModule: (name) =>
        name === "Sub" ? "---- MODULE Sub ----\nDef == 1\nSubOp(a) == a\n====" : undefined,
    });
    expect(result.status).toBe("success");
  });

  it("accepts only a constant or a definition on the left of <-, as TLC does", async () => {
    const cases = [
      ["Def == 3\nTHEOREM T == TRUE", "T"],
      ["Def == 3", "TRUE"],
      ["Def == 3\nASSUME TRUE", "BOOLEAN"],
    ];
    for (const [body, name] of cases) {
      await expect(checkModule(body, `CONSTANT ${name} <- Def`)).rejects.toThrow(
        new TlaConfigError(
          `In the configuration file, the identifier ${name} does not appear in the specification.`,
        ),
      );
    }
  });

  it("reports the first wrong <- in TLC's order", async () => {
    const cases = [
      [
        "CONSTANT N\nOp == 1",
        "CONSTANT Op <- Nope N <- Nope2",
        "The configuration file substitutes for N with the undefined identifier Nope2.",
      ],
      [
        "Def2 == 1\nDef == 2",
        "CONSTANT Def <- Nope Def2 <- Nope2",
        "The configuration file substitutes for Def2 with the undefined identifier Nope2.",
      ],
      [
        "Def == 1",
        "CONSTANT Q1 <- Def Q2 <- Def Q3 <- Def",
        "In the configuration file, the identifier Q3 does not appear in the specification.",
      ],
      [
        "CONSTANT F(_)\nDef == 3\nOp(a) == a",
        "CONSTANT F <- Def Op <- Nope",
        "The configuration file substitutes for Op with the undefined identifier Nope.",
      ],
      [
        "Def == 1",
        "CONSTANT Def <- [Nope1] Def Def <- [Nope2] Def Def <- [Nope3] Def",
        "In the configuration file, the module name Nope3 is not a module in the specification.",
      ],
    ];
    for (const [body, config, message] of cases) {
      await expect(checkModule(body, config)).rejects.toThrow(new TlaConfigError(message));
    }
  });

  it("counts a function definition as taking no arguments in <-, as TLC does", async () => {
    const cases = [
      ["CONSTANT F(_)\nf[n \\in {1}] == n\nASSUME TRUE", "F"],
      ["Op(a) == a\nf[n \\in {1}] == n\nASSUME TRUE", "Op"],
    ];
    for (const [body, name] of cases) {
      await expect(checkModule(body, `CONSTANT ${name} <- f`)).rejects.toThrow(
        new TlaConfigError(
          `The configuration file substitutes for ${name} with f of different number of arguments.`,
        ),
      );
    }
  });

  it("ignores a value for a name the module doesn't declare, as TLC does", async () => {
    const cases = [
      ["CONSTANT N\nASSUME N = 1", "CONSTANT Foo = 1 N <- Foo", "N"],
      ["CONSTANT F(_)\nASSUME F(1) = 1", "CONSTANT Foo(1) = 1 F <- Foo", "F"],
    ];
    for (const [body, config, name] of cases) {
      await expect(checkModule(body, config)).rejects.toThrow(
        new TlaConfigError(
          `The configuration file substitutes for ${name} with the undefined identifier Foo.`,
        ),
      );
    }
  });

  it("substitutes the value the configuration assigns a definition, with no check of its arity, as TLC does", async () => {
    const statuses = await Promise.all(
      [
        ["CONSTANT F(_)\nDef == 3\nASSUME F(1) = 7", "CONSTANT F <- Def Def = 7"],
        ["Op(a) == a\nDef == 3\nASSUME Op(1) = 7", "CONSTANT Op <- Def Def = 7"],
        ["CONSTANT N\nOp(a) == a\nASSUME N = 7", "CONSTANT N <- Op Op = 7"],
      ].map(async (item) => (await checkModule(item[0], item[1])).status),
    );
    expect(statuses).toEqual(["success", "success", "success"]);
  });

  it("normalizes the value of each constant after the checks of <-, in TLC's order", async () => {
    const getCompareError = (string: string, other: number) =>
      new TlaEvaluationError(
        `${UNEXPECTED_EXCEPTION}Attempted to compare string "${string}" with non-string:\n${other}`,
      );
    const cases = [
      [
        "CONSTANTS N, B",
        'CONSTANT N = {1, "a"} B <- Nope',
        new TlaConfigError(
          "The configuration file substitutes for B with the undefined identifier Nope.",
        ),
      ],
      [
        "CONSTANTS N, B",
        'CONSTANT N = {1, "a"}',
        new TlaConfigError(
          "The constant parameter B is not assigned a value by the configuration file.",
        ),
      ],
      [
        "CONSTANTS N, B\nOp(a) == a",
        'CONSTANT N = {1, "a"} B <- Op',
        new TlaConfigError(
          "The configuration file substitutes for B with Op of different number of arguments.",
        ),
      ],
      ["CONSTANTS N, B\nOp(a) == a", 'CONSTANT B = {1, "a"} N <- Op', getCompareError("a", 1)],
      ["CONSTANTS N, B", 'CONSTANT N = {1, "a"} B = {2, "b"}', getCompareError("b", 2)],
      [
        "CONSTANTS A, B\nDef == 3",
        'CONSTANT Def = {1, "a"} A <- Def B = {2, "b"}',
        getCompareError("a", 1),
      ],
      [
        "CONSTANTS B, A\nDef == 3",
        'CONSTANT Def = {1, "a"} B <- Def A = {2, "b"}',
        getCompareError("b", 2),
      ],
      [
        "CONSTANT N(_)\nDef(a) == a",
        'CONSTANT Def(1) = {1, "a"} N <- Def',
        getCompareError("a", 1),
      ],
      [
        "CONSTANTS B, A(_)\nDef(a) == a",
        'CONSTANT Def(1) = {1, "a"} A <- Def B = {2, "b"}',
        getCompareError("a", 1),
      ],
    ] as const;
    for (const [body, config, error] of cases) {
      await expect(checkModule(body, config)).rejects.toThrow(error);
    }
    const statuses = await Promise.all(
      [
        ["CONSTANT N\nASSUME N = 2", 'CONSTANT N = {1, "a"}\nCONSTANT N = 2'],
        ["CONSTANT N\nDef == 3\nASSUME N = 3", 'CONSTANT N = {1, "a"} N <- Def'],
      ].map(async (item) => (await checkModule(item[0], item[1])).status),
    );
    expect(statuses).toEqual(["success", "success"]);
    await expect(
      check({
        source:
          "---- MODULE M ----\nEXTENDS Zed\nCONSTANT C\nVARIABLE x\nInit == x = 0\nNext == x' = x\n====",
        config: 'INIT Init\nNEXT Next\nCONSTANT C = {1, "a"} Z = {2, "b"}',
        loadModule: (name) =>
          name === "Zed" ? "---- MODULE Zed ----\nCONSTANT Z\n====" : undefined,
      }),
    ).rejects.toThrow(getCompareError("b", 2));
  });

  it("keeps the value the configuration assigns a definition as written, as TLC does", async () => {
    const statuses = await Promise.all(
      [
        ["Def == 3", 'CONSTANT Def = {1, "a"}'],
        ["Op(a) == a", 'CONSTANT Op = {1, "a"}'],
        ["Op(a) == a", 'CONSTANT Op(1) = {1, "a"}'],
        ["Op == 3\nDef == 4", 'CONSTANT Def = {1, "a"} Op <- Def'],
        ["Op(a) == 0\nDef(a) == a", 'CONSTANT Def(1) = {1, "a"} Op <- Def'],
      ].map(async (item) => (await checkModule(item[0], item[1])).status),
    );
    expect(statuses).toEqual(["success", "success", "success", "success", "success"]);
    const messages = await Promise.all(
      [
        ["Def == 3\nASSUME PrintT(Def)", 'CONSTANT Def = {1, "a"}'],
        ["Op(a) == a\nASSUME PrintT(Op(1))", 'CONSTANT Op(1) = {1, "a"}'],
      ].map(async (item) => (await checkModule(item[0], item[1])).violation?.message),
    );
    expect(messages).toEqual(
      Array(2).fill(
        'Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),\nbut it produced the following error:\nAttempted to compare string "a" with non-string:\n1',
      ),
    );
  });

  it("applies a [Mod] value to a definition of the root module, as TLC does", async () => {
    const statuses = await Promise.all(
      [
        ["Def == 3\nASSUME Def = 4", "CONSTANT Def = [M] 4"],
        ["Def == 3 + 0\nASSUME Def = 4", "CONSTANT Def = [M] 4"],
        ["Def(a) == 3\nASSUME Def(1) = 4", "CONSTANT Def = [M] 4"],
        ["CONSTANT N\nDef == 3\nASSUME N = 4", "CONSTANT Def = [M] 4 N <- Def"],
        ['CONSTANT N\nDef == "s"\nASSUME N = 4', "CONSTANT Def = [M] 4 N <- Def"],
      ].map(async (item) => (await checkModule(item[0], item[1])).status),
    );
    expect(statuses).toEqual(Array(5).fill("success"));
  });

  it("gives a <- the [Mod] value of its target whatever the body, where TLC keeps it only for a literal", async () => {
    const result = await checkModule(
      "CONSTANT N\nDef == 3 + 0\nASSUME N = 4",
      "CONSTANT Def = [M] 4 N <- Def",
    );
    expect(result.status).toBe("success");
    const invariant = await checkModule(
      "NonLit == x = 0",
      "CONSTANT NonLit = [M] FALSE\nINVARIANT NonLit",
    );
    expect([invariant.status, invariant.violation?.name]).toEqual([
      "invariant-violation",
      "NonLit",
    ]);
  });

  it("treats a definition with a [Mod] value as a definition under each name of the configuration, as TLC does", async () => {
    const invariants = await Promise.all(
      [
        ["Def == 3", "CONSTANT Def = [M] FALSE\nINVARIANT Def", "Def"],
        ["CONSTANT N\nDef == 3", "CONSTANT Def = [M] FALSE N <- Def\nINVARIANT N", "N"],
      ].map(async (item) => {
        const result = await checkModule(item[0], item[1]);
        return [result.status, result.violation?.name, result.violation?.trace.length];
      }),
    );
    expect(invariants).toEqual([
      ["invariant-violation", "Def", 1],
      ["invariant-violation", "N", 1],
    ]);
    const postcondition = await checkModule(
      "Def == 3",
      "CONSTANT Def = [M] FALSE\nPOSTCONDITION Def",
    );
    expect(postcondition.violation?.postcondition).toEqual({
      name: "Def",
      code: 2404,
      message: "Postcondition Def at 3 is false.",
    });
    expect((await checkModule("Def == 3", "CONSTANT Def = [M] 4\nVIEW Def")).status).toBe(
      "success",
    );
    await expect(checkModule("Def == 3", "CONSTANT Def = [M] 4\nSYMMETRY Def")).rejects.toThrow(
      new TlaEvaluationError(
        `${UNEXPECTED_EXCEPTION}The symmetry operator must specify a set of functions.`,
      ),
    );
    const init = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, Sequences, FiniteSets, TLC\nCONSTANTS A, N\nVARIABLE x\nInit == x = 0\nNext == x' = x\nSpec == Init /\\ [][Next]_x\nPerms == Permutations(A)\nDef == 3\n====",
      config: "CONSTANT A = {a1, a2}\nCONSTANT N = 1\nCONSTANT Def = [M] 4\nINIT Def\nNEXT Next",
    });
    expect([init.failure?.message, formatCallStackLines(init)]).toEqual([
      "The init state relation is not a boolean expression.\n3",
      ["Line 9, column 8 to line 9, column 8 in M"],
    ]);
  });

  it("evaluates at startup a definition that reads one with a [Mod] value, as TLC does", async () => {
    const prints: string[] = [];
    const warned: string[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = x\nDef == x\nInv == PrintT(Def)\n====",
      config: "CONSTANT Def = [M] 4\nINVARIANT Inv\nINIT Init\nNEXT Next",
      onPrint: (text) => prints.push(text),
      onProgress: (event) => {
        if (event.kind === "constant-level-invariant") warned.push(event.name);
      },
    });
    expect([result.status, prints, warned]).toEqual(["success", ["4"], ["Inv"]]);
  });

  it("tests membership in a set definition with a [Mod] value against the value, as TLC does", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nVARIABLE x\nDef == [a : {1, 2}]\nInit == x = [a |-> 1]\nNext == x' = x\nInv == x \\in Def\n====",
      config: "CONSTANT Def = [M] {}\nINVARIANT Inv\nINIT Init\nNEXT Next",
    });
    expect([result.status, result.violation?.name]).toEqual(["invariant-violation", "Inv"]);
  });

  it("evaluates a constraint a [Mod] value gives a literal body, where TLC throws a ClassCastException", async () => {
    const results = await Promise.all(
      [
        "CONSTANT Def = [M] FALSE\nCONSTRAINT Def",
        "CONSTANT Def = [M] FALSE\nACTION_CONSTRAINT Def",
        "CONSTANT Def = [M] FALSE\nINVARIANT Def\nCONSTRAINT Def",
      ].map(async (config) => (await checkModule("Def == 3", config)).status),
    );
    expect(results).toEqual(["success", "success", "invariant-violation"]);
  });

  it("reports a table's set that mixes types as the unexpected exception TLC throws", async () => {
    await expect(checkModule("CONSTANT F(_)", 'CONSTANT F(1) = {1, "a"}')).rejects.toThrow(
      new TlaEvaluationError(
        `${UNEXPECTED_EXCEPTION}Attempted to compare string "a" with non-string:\n1`,
      ),
    );
  });

  it("names why a state-level substitute failed like TLC", async () => {
    await expect(
      checkModule(
        "CONSTANT C\nFoo == IF CHOOSE n \\in {} : TRUE THEN x ELSE x",
        "CONSTANT C <- Foo",
      ),
    ).rejects.toThrow(
      new TlaConfigError(
        "The configuration file substitutes constant C with non-constant Foo - specifically: Attempted to compute the value of an expression of form\nCHOOSE x \\in S: P, but no element of S satisfied P.\nline 7, col 11 to line 7, col 32 of module M",
      ),
    );
    await expect(
      checkModule("CONSTANT C\nFoo == (1 \\div 0) + x", "CONSTANT C <- Foo"),
    ).rejects.toThrow(
      new TlaConfigError("The configuration file substitutes constant C with non-constant Foo"),
    );
  });

  it("counts a CASE guard of the initial predicate at the CASE without TLC's warning that its lookup failed", async () => {
    const warnings: CheckProgress[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == CASE 1 = 2 -> x = 0\nNext == x' = x\n====",
      config: "INIT Init\nNEXT Next",
      coverage: 1,
      onProgress: (progress) => {
        if (progress.kind === "warning") warnings.push(progress);
      },
    });
    expect([formatCoverage(result), warnings]).toEqual([
      [
        ["line 4, col 9 to line 4, col 27 of module M: 2"],
        ["line 5, col 9 to line 5, col 14 of module M: 0"],
      ],
      [],
    ]);
  });

  it("counts the coverage of each invariant it checks in an initial state under -continue", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nVARIABLE x\nInit == x = FALSE\nNext == UNCHANGED x\nInv == ~x\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      isContinued: true,
      coverage: 1,
    });
    expect(
      result.coverage?.relations
        .find((relation) => relation.kind === "invariant")
        ?.expressions.map((expression) => [expression.location, expression.count]),
    ).toEqual([["line 5, col 8 to line 5, col 9 of module M", 1]]);
  });

  it.each([
    ["an invariant", "INVARIANT P", "P == x # 1"],
    ["an action property", "PROPERTY P", "P == [][x' # 1]_x"],
  ])(
    "prints the trace of %s it continues past without rebuilding it, as TLC's Worker does",
    async (_name, config, property) => {
      const outputs: OutputLine[] = [];
      await check({
        source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == x = 0 /\\ PrintT("i")\nNext == PrintT(<<"n", x>>) /\\ x < 2 /\\ x' = x + 1\n${property}\n====`,
        config: `INIT Init\nNEXT Next\n${config}`,
        isContinued: true,
        onProgress: (progress) => {
          if (progress.kind !== "violation") return;
          const violation = progress.violation;
          outputs.push(
            ...violation.trace.flatMap((step) => step.output ?? []),
            ...(violation.traceOutput ?? []),
          );
        },
      });
      expect(outputs).toEqual(['<<"n", 0>>']);
    },
  );

  it("rebuilds the behavior once more for the postcondition after printing it, as TLC's Worker#doPostCondition does", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nASSUME TLCSet(1, 0)\nInit == x = 0\nA == TLCSet(1, TLCGet(1) + 1) /\\ PrintT(TLCGet(1)) /\\ x' = 1\nNext == A\nInv == x = 0\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      onPrint: () => {},
    });
    expect([
      result.violation?.trace.map((step) => step.output ?? []),
      result.violation?.traceOutput,
    ]).toEqual([[[], ["2"]], ["3"]]);
  });

  it("evaluates the body of a constant postcondition from another module again after the search, as TLC's ParameterizedSpecObj does", async () => {
    const printed: string[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1\n====",
      config: "INIT Init\nNEXT Next",
      loadModule: (name) =>
        name === "Extra"
          ? '---- MODULE Extra ----\nEXTENDS TLC\nP == PrintT(<<"zeta", "eta">>)\n===='
          : undefined,
      moduleOperators: [{ kind: "postcondition", module: "Extra", operator: "P" }],
      onPrint: (text) => printed.push(text),
    });
    expect([result.status, printed, result.violation?.postconditionOutput]).toEqual([
      "deadlock",
      ['<<"zeta", "eta">>'],
      ['<<"zeta", "eta">>'],
    ]);
  });

  it("evaluates the function a postcondition from another module defines again after the search, as TLC's ParameterizedSpecObj does", async () => {
    const printed: string[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1\n====",
      config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      loadModule: (name) =>
        name === "Extra"
          ? '---- MODULE Extra ----\nEXTENDS TLC\nP[i \\in {PrintT("dom")}] == TRUE\n===='
          : undefined,
      moduleOperators: [{ kind: "postcondition", module: "Extra", operator: "P" }],
      onPrint: (text) => printed.push(text),
    });
    expect([result.status, printed, result.violation?.message]).toEqual([
      "postcondition-violation",
      ['"dom"', '"dom"'],
      "Evaluating postcondition P at line 3, col 1 to line 3, col 32 of module Extra failed.\nTLC expected a boolean value, but did not find one. line 3, col 1 to line 3, col 32 of module Extra",
    ]);
  });

  it("rebuilds the step to a successor under a VIEW once, as TLC's TLCTrace#printTrace does", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nASSUME TLCSet(1, 0)\nInit == x = 0\nA == TLCSet(1, TLCGet(1) + 1) /\\ PrintT(TLCGet(1)) /\\ x' = 1\nNext == A\nInv == x = 0\nView == x\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nVIEW View",
      onPrint: () => {},
    });
    expect([
      result.violation?.trace.map((step) => step.output ?? []),
      result.violation?.traceOutput,
    ]).toEqual([[[], ["2"]], ["3"]]);
  });

  it("counts the coverage of an action under ENABLED in an invariant", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLES x, z\nInit == x \\in BOOLEAN /\\ z = 0\nA1 == (~x => z = 1) /\\ x' \\in BOOLEAN /\\ UNCHANGED z\nA2 == z < 2 /\\ z' = z + 1 /\\ UNCHANGED x\nNext == A1 \\/ A2\nInv == ENABLED A1 \\/ z < 5\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      coverage: 1,
    });
    expect(
      result.coverage?.relations
        .find((relation) => relation.kind === "invariant")
        ?.expressions.map((expression) => [
          `${"|".repeat(expression.depth)}${expression.location}`,
          expression.count,
        ]),
    ).toEqual([
      ["line 8, col 8 to line 8, col 26 of module M", 6],
      ["|line 8, col 8 to line 8, col 17 of module M", 6],
      ["||line 5, col 8 to line 5, col 9 of module M", 6],
      ["||line 5, col 14 to line 5, col 18 of module M", 3],
      ["||line 5, col 24 to line 5, col 37 of module M", 0],
      ["|||line 5, col 31 to line 5, col 37 of module M", 4],
      ["||line 5, col 42 to line 5, col 52 of module M", 4],
      ["|line 8, col 22 to line 8, col 26 of module M", 2],
    ]);
  });

  it("counts a LET definition under ENABLED at the definition that reaches the LET, as TLC's LazyValue keeps its cost model", async () => {
    const lines = await getCoverageLines(
      "---- MODULE M ----\nEXTENDS Naturals\nVARIABLES x, y\nA == LET t == x + 1 IN t < 4 /\\ x' = t % 4 /\\ UNCHANGED y\nInit == x = 0 /\\ y = 0\nNext == x < 2 /\\ x' = x + 1 /\\ y' = y\nInv == ENABLED A \\/ TRUE\n====",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    );
    expect(lines?.at(-1)).toEqual([
      "line 7, col 8 to line 7, col 24 of module M: 3",
      "|line 7, col 8 to line 7, col 16 of module M: 3",
      "||line 4, col 15 to line 4, col 19 of module M: 3",
      "||line 4, col 24 to line 4, col 42 of module M: 3",
      "||line 4, col 47 to line 4, col 57 of module M: 3",
    ]);
  });

  const ENABLED_CASE_PREFIX = [
    "line 7, col 8 to line 7, col 25 of module M: 3",
    "|line 7, col 15 to line 7, col 24 of module M: 3",
    "||line 7, col 17 to line 7, col 17 of module M: 3",
    "||line 7, col 20 to line 7, col 22 of module M: 3",
    "|||line 4, col 27 to line 4, col 27 of module M: 3",
    "|||line 7, col 6 to line 7, col 14 of module N: 3",
  ];

  it.each([
    [
      "A == y' = y + 1 /\\ CASE y = 1 -> TRUE [] OTHER -> FALSE",
      [
        ...ENABLED_CASE_PREFIX,
        "||||line 6, col 6 to line 6, col 15 of module N: 3",
        "||||line 6, col 20 to line 6, col 55 of module N: 6",
      ],
    ],
    [
      "A == CASE y = 1 -> y' = 2 [] OTHER -> y' = 0",
      [...ENABLED_CASE_PREFIX, "||||line 7, col 14 to line 7, col 14 of module N: 6"],
    ],
    [
      "A == y' = y + 1 /\\ CASE y = 1 -> TRUE [] y # 1 -> FALSE",
      [
        ...ENABLED_CASE_PREFIX,
        "||||line 6, col 6 to line 6, col 15 of module N: 3",
        "||||line 6, col 20 to line 6, col 55 of module N: 10",
      ],
    ],
    [
      "A == y' = y + 1 /\\ CASE y = 1 -> TRUE [] OTHER -> y > 5",
      [
        ...ENABLED_CASE_PREFIX,
        "||||line 6, col 6 to line 6, col 15 of module N: 3",
        "||||line 6, col 20 to line 6, col 55 of module N: 8",
      ],
    ],
    [
      "A == y' = y + 1 /\\ CASE K!G = 2 -> TRUE [] OTHER -> FALSE",
      [
        ...ENABLED_CASE_PREFIX,
        "||||line 6, col 6 to line 6, col 15 of module N: 3",
        "||||line 6, col 20 to line 6, col 57 of module N: 12",
        "|||||line 6, col 25 to line 6, col 39 of module N: 3",
      ],
    ],
    [
      "A == y' = y + 1 /\\ CASE F(y) = 2 -> TRUE [] OTHER -> FALSE",
      [
        ...ENABLED_CASE_PREFIX,
        "||||line 6, col 6 to line 6, col 15 of module N: 3",
        "||||line 6, col 20 to line 6, col 58 of module N: 15",
      ],
    ],
    [
      "A == y' = y + 1 /\\ IF y = 1 THEN TRUE ELSE FALSE",
      ["line 7, col 8 to line 7, col 25 of module M: 3"],
    ],
  ])(
    "counts the guards and arms of %j under ENABLED at the CASE, as TLC's Tool#enabledApplImpl evaluates them in the CASE's cost model and reports their costs there",
    async (action, lines) => {
      const result = await check({
        source:
          "---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nI == INSTANCE N WITH y <- x\nInit == x = 0\nNext == x' = (x + 1) % 3\nInv == PrintT(<<x, I!E>>)\n====\n",
        config: "INIT Init\nNEXT Next\nINVARIANT Inv\n",
        coverage: 1,
        onPrint: () => {},
        loadModule: (name) =>
          name === "N"
            ? `---- MODULE N ----\nEXTENDS Naturals\nVARIABLE y\nF(a) == a + 1\nK == INSTANCE P WITH z <- y\n${action}\nE == ENABLED A\n====\n`
            : name === "P"
              ? "---- MODULE P ----\nEXTENDS Naturals\nVARIABLE z\nG == z + 1\n====\n"
              : undefined,
      });
      expect(formatCoverage(result)?.at(-1)).toEqual(lines);
    },
  );

  it("counts a CASE guard under ENABLED at the CASE without TLC's warnings that its lookups failed", async () => {
    const warnings: CheckProgress[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nI == INSTANCE N WITH y <- x\nInit == x = 0\nNext == x' = (x + 1) % 3\nInv == PrintT(<<x, I!E>>)\n====\n",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\n",
      coverage: 1,
      onPrint: () => {},
      onProgress: (progress) => {
        if (progress.kind === "warning") warnings.push(progress);
      },
      loadModule: (name) =>
        name === "N"
          ? "---- MODULE N ----\nEXTENDS Naturals\nVARIABLE y\nA == y' = y + 1 /\\ CASE y = 1 -> TRUE [] OTHER -> FALSE\nE == ENABLED A\n====\n"
          : undefined,
    });
    expect([formatCoverage(result)?.at(-1), warnings]).toEqual([
      [
        "line 7, col 8 to line 7, col 25 of module M: 3",
        "|line 7, col 15 to line 7, col 24 of module M: 3",
        "||line 7, col 17 to line 7, col 17 of module M: 3",
        "||line 7, col 20 to line 7, col 22 of module M: 3",
        "|||line 4, col 27 to line 4, col 27 of module M: 3",
        "|||line 5, col 6 to line 5, col 14 of module N: 3",
        "||||line 4, col 6 to line 4, col 15 of module N: 3",
        "||||line 4, col 20 to line 4, col 55 of module N: 6",
      ],
      [],
    ]);
  });

  it.each([
    ["t /\\ (ENABLED (t /\\ y' = y))' /\\ t", "ACTION_CONSTRAINT", 4, 67],
    ["t /\\ ENABLED (t /\\ y' = y) /\\ t", "ACTION_CONSTRAINT", 4, 64],
    ["t /\\ ENABLED (t /\\ y' = y)", "INVARIANT", 4, 59],
    ["t /\\ ENABLED (t /\\ y' = y) /\\ t", "INVARIANT", 4, 64],
    ["t /\\ ENABLED (t /\\ y' = y /\\ t)", "INVARIANT", 6, 64],
    ["(ENABLED (t /\\ y' = y))' /\\ t", "ACTION_CONSTRAINT", 4, 62],
  ])(
    "evaluates a LET definition with a value again inside ENABLED in %j as a %s, and counts nothing there, as TLC's Tool#enabledApplImpl does",
    async (body, kind, count, end) => {
      const printed: string[] = [];
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS TLC, Naturals\nVARIABLE y\nInit == y = 0\nStep == y' = (y + 1) % 2\nCheck == LET t == PrintT("t") IN ${body}\n====\n`,
        config: `INIT Init\nNEXT Step\n${kind} Check\n`,
        coverage: 1,
        onPrint: (text) => printed.push(text),
      });
      expect([printed.length, formatCoverage(result)?.at(-1)]).toEqual([
        count,
        [
          "line 6, col 19 to line 6, col 29 of module M: 2",
          `line 6, col 34 to line 6, col ${end} of module M: 2`,
        ],
      ]);
    },
  );

  it.each([
    [
      "read primed",
      "VARIABLES c\nInit == c \\in 0..2\nNext == UNCHANGED c\nA == LET k == c IN k' = k + 1 /\\ k' > k\nInv == ENABLED A",
      [
        "line 7, col 8 to line 7, col 16 of module M: 3",
        "|line 6, col 15 to line 6, col 15 of module M: 6",
        "|line 6, col 20 to line 6, col 39 of module M: 3",
      ],
    ],
    [
      "bound outside it",
      "VARIABLES c\nInit == c = 0\nNext == c < 3 /\\ c' = c + 1\nInv == LET k == c IN k >= 0 /\\ k < 5 /\\ ENABLED (c' = k + 1 /\\ k' > k)",
      [
        "line 6, col 17 to line 6, col 17 of module M: 12",
        "line 6, col 22 to line 6, col 70 of module M: 4",
      ],
    ],
    [
      "read again outside it",
      "VARIABLES c\nInit == c = 0\nNext == c < 3 /\\ c' = c + 1\nInv == LET k == c IN ENABLED (c' = k + 1 /\\ k' > k) /\\ k >= 0 /\\ ENABLED (c' = k + 2) /\\ ENABLED (c' = k + 3)",
      [
        "line 6, col 17 to line 6, col 17 of module M: 16",
        "line 6, col 22 to line 6, col 109 of module M: 4",
      ],
    ],
  ])(
    "counts a LET definition under ENABLED %s as TLC's LazyValue caches it, afresh where primed and only under the EvalControl it cached it under",
    async (_name, definitions, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Integers\n${definitions}\n====`,
        "INIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
      );
      expect(lines?.at(-1)).toEqual(expected);
    },
  );

  it("counts the LET definition that UNCHANGED keeps under ENABLED, as TLC's Tool#enabledUnchanged evaluates the expression", async () => {
    const lines = await getCoverageLines(
      "---- MODULE M ----\nEXTENDS Integers\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == x' = 1 - x /\\ UNCHANGED y\nInv == ENABLED (y' = y /\\ LET w == x IN UNCHANGED w)\n====",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    );
    expect(lines?.at(-1)).toEqual([
      "line 6, col 8 to line 6, col 52 of module M: 2",
      "|line 6, col 17 to line 6, col 22 of module M: 2",
      "|line 6, col 36 to line 6, col 36 of module M: 2",
      "|line 6, col 41 to line 6, col 51 of module M: 2",
    ]);
  });

  it.each([
    [
      "a next-state failure",
      "Init == x = 0\nNext == x < 3 /\\ x' = <<1>>[x + 1]",
      "INIT Init\nNEXT Next",
      ["3:3 3", "1:3 3 5 3 5"],
    ],
    [
      "an initial-state failure",
      "Init == x \\in 0..1 /\\ <<1>>[x + 1] = 1\nNext == UNCHANGED x",
      "INIT Init\nNEXT Next",
      ["2:2 2 4", "0:0 0"],
    ],
    [
      "an initial-state failure after states that hold the invariant",
      "Init == x \\in 0..2 /\\ <<1, 2>>[x + 1] > 0\nNext == UNCHANGED x\nInv == x >= 0",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
      ["4:4 4 2 6", "0:0 0", "4"],
    ],
    [
      "an invariant that fails in an initial state",
      "Init == x \\in 0..2\nNext == UNCHANGED x\nInv == <<1, 2>>[x + 1] > 0",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
      ["6:6 6 2", "0:0 0", "6"],
    ],
  ])("counts the coverage of TLC's replay of %s", async (_name, definitions, config, expected) => {
    expect(await getCoverageCounts(definitions, config)).toEqual(expected);
  });

  it("rebuilds the initial state of a counterexample that stutters there, as TLC's LiveWorker does", async () => {
    const config = "SPECIFICATION Spec\nPROPERTY P\nCHECK_DEADLOCK FALSE";
    const definitions =
      "A0 == 1 \\in x /\\ x' = x \\cup {1}\nA1 == x = {} /\\ x' = x\nNext == A0 \\/ A1\nSpec == Init /\\ [][Next]_x\nP == <>(ENABLED A0)";
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS TLC\nVARIABLE x\nInit == x = {} /\\ PrintT("i")\n${definitions}\n====`,
      config,
    });
    expect(result.violation?.trace[0].output).toEqual(['"i"']);
    expect(await getCoverageCounts(`Init == x = {}\n${definitions}`, config)).toEqual([
      "2:2 2",
      "0:0 1 0",
      "0:1 2 1 1 1",
    ]);
  });

  it("replays the next-state relation after a liveness check fails to evaluate, as TLC does", async () => {
    const config = "INIT Init\nNEXT Next\nPROPERTY P";
    const property = "P == <>((CHOOSE n \\in {1, 2} : n > x) = 1)";
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 4 /\\ PrintT(<<"n", x>>)\n${property}\n====`,
      config,
    });
    expect(result.failure?.traceOutput).toEqual(['<<"n", 1>>']);
    expect(
      await getCoverageCounts(`Init == x = 0\nNext == x' = (x + 1) % 4\n${property}`, config),
    ).toEqual(["2:2 2", "2:4 4"]);
  });

  it("adds a state to the behavior graph after an invariant fails to evaluate in its successor, as TLC's Worker does", async () => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == x = 0\nNext == PrintT(<<"n", x>>) /\\ x' = x + 1\nSpec == Init /\\ [][Next]_x /\\ WF_x(Next)\nInv == x < 1 \\/ CHOOSE e \\in {} : TRUE\nP == <>(x = 5)\n====`,
      config: "SPECIFICATION Spec\nINVARIANT Inv\nPROPERTY P",
    });
    expect(result.failure?.traceOutput).toEqual(Array(4).fill('<<"n", 0>>'));
  });

  it("counts the successors the behavior graph generates again for a deadlocked state, as TLC does", async () => {
    expect(
      await getCoverageCounts(
        "Init == x = 1\nNext == x = 0 /\\ x' = x\nSpec == Init /\\ [][Next]_x /\\ WF_x(Next)\nP == [](x = 1 => [](x = 1))",
        "SPECIFICATION Spec\nPROPERTY P",
      ),
    ).toEqual(["2:2 2", "0:0 2 0"]);
  });

  it.each([
    [
      "as TLC prints the trace",
      "VARIABLE y\nInit == x = 0 /\\ y = 0\nNext == x' = x + 1 /\\ (x < 1 => y' = y)",
      ["2:2 2", "1:4 3 4 1 4 2"],
    ],
    [
      "as another branch of its action fails to print the trace",
      "VARIABLE y\nInit == x = 0 /\\ y = 0\nNext == x' = 1 /\\ (x = 0 \\/ <<x>>[2] = 0)",
      ["1:1 1", "0:1 0 3 2 1"],
    ],
  ])("counts the coverage of an incomplete successor %s", async (_name, definitions, expected) => {
    expect(await getCoverageCounts(definitions, "INIT Init\nNEXT Next")).toEqual(expected);
  });

  it.each([
    [
      "an invariant violation",
      "VARIABLE y\nInit == x = 0 /\\ y \\in 0..1\nNext == x < 3 /\\ x' = x + 1 /\\ UNCHANGED y\nInv == x < 2\nView == <<x, y>>",
      "INIT Init\nNEXT Next\nINVARIANT Inv\nVIEW View",
      ["6:6 6 3", "3:7 6 7 6 7 6", "5"],
    ],
    [
      "a liveness counterexample",
      "VARIABLE y\nvars == <<x, y>>\nInit == x = 0 /\\ y \\in 0..1\nNext == x' = (x + 1) % 3 /\\ UNCHANGED y\nSpec == Init /\\ [][Next]_vars /\\ WF_vars(Next)\nP == <>(x = 5)\nView == <<x, y>>",
      "SPECIFICATION Spec\nPROPERTY P\nVIEW View",
      ["4:4 4 2", "4:9 9 9"],
    ],
  ])(
    "counts the coverage of the trace of %s under a VIEW once per rebuild",
    async (_name, definitions, config, expected) => {
      expect(await getCoverageCounts(definitions, config)).toEqual(expected);
    },
  );

  it("counts the coverage of the step TLC fails to rebuild as it can't fingerprint the successor", async () => {
    expect(
      await getCoverageCounts(
        "Init == x = 0\nNext == x' = IF x = 1 THEN [k \\in SUBSET {1} |-> 1 \\div 0] ELSE x + 1",
        "INIT Init\nNEXT Next",
      ),
    ).toEqual(["2:2 2", "1:5 4 5 5 3 2 3 2"]);
  });

  it.each([
    [
      "an invariant",
      "Init == x = 0\nNext == x < 3 /\\ x' = x + 1\nInv == <<1, 2>>[x + 1] > 0",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
      ["2:2 2", "2:5 4 5 4 5", "3"],
    ],
    [
      "an action property",
      "Init == x = 0\nNext == x < 3 /\\ x' = x + 1\nSpec == Init /\\ [][Next]_x\nP == [][<<1, 2>>[x' + 1] > 0]_x",
      "SPECIFICATION Spec\nPROPERTY P",
      ["2:2 2", "2:5 4 5 4 5", "3"],
    ],
    [
      "a constraint",
      "Init == x = 0\nNext == x < 3 /\\ x' = x + 1\nC == <<1, 2>>[x + 1] > 0\nInv == x >= 0",
      "INIT Init\nNEXT Next\nCONSTRAINT C\nINVARIANT Inv",
      ["2:2 2", "1:5 4 5 4 5", "2", "2:2 4"],
    ],
    [
      "the next-state relation without a deadlock check",
      "Init == x = 0\nNext == x < 3 /\\ x' = <<1>>[x + 1]",
      "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      ["2:2 2", "1:2 2 4 2 4"],
    ],
    [
      "the next-state relation of an initial state without a deadlock check",
      "Init == x \\in 1..2\nNext == x' = <<1>>[x + 1]",
      "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      ["2:2 2 1", "0:0 0 2"],
    ],
  ])(
    "does not rebuild the trace again for the coverage after %s fails to evaluate",
    async (_name, definitions, config, expected) => {
      expect(await getCoverageCounts(definitions, config)).toEqual(expected);
    },
  );

  it.each([
    [
      "\\in",
      "B == x' \\in {1, 2, 3} /\\ IF x' = 1 THEN TRUE ELSE y' = x'",
      [
        "line 6, col 6 to line 6, col 21 of module C: 3",
        "|line 6, col 13 to line 6, col 21 of module C: 2:5",
        "line 6, col 29 to line 6, col 34 of module C: 4",
        "line 6, col 41 to line 6, col 44 of module C: 1",
        "line 6, col 51 to line 6, col 57 of module C: 2",
      ],
    ],
    [
      "\\E",
      "B == x < 5 /\\ \\E e \\in {1, 2, 3}, f \\in {4, 5} : x' = e /\\ IF e = 1 THEN TRUE ELSE y' = f",
      [
        "line 6, col 6 to line 6, col 10 of module C: 1",
        "|line 6, col 6 to line 6, col 6 of module C: 2",
        "line 6, col 50 to line 6, col 55 of module C: 6",
        "|line 6, col 55 to line 6, col 55 of module C: 7",
        "line 6, col 63 to line 6, col 67 of module C: 7",
        "line 6, col 74 to line 6, col 77 of module C: 2",
        "line 6, col 84 to line 6, col 89 of module C: 4",
        "line 6, col 24 to line 6, col 32 of module C: 2:11",
        "line 6, col 41 to line 6, col 46 of module C: 2:4",
      ],
    ],
  ])(
    "charges a set per element the successors draw from it under %s, as TLC's enumerators do",
    async (_name, action, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE C ----\nEXTENDS Naturals\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nA == x < 2 /\\ x' = x + 1 /\\ y' = y\n${action}\nNext == A \\/ B\n====`,
        "INIT Init\nNEXT Next",
      );
      expect(lines?.[2]).toEqual(expected);
    },
  );

  it("charges a set per element a quantifier or CHOOSE draws from it, as TLC's enumerators do", async () => {
    const lines = await getCoverageLines(
      "---- MODULE K ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1\nInv1 == \\E e \\in {0, 1, 2, 3} : e = x\nInv2 == (CHOOSE e \\in {0, 1, 2, 3} : e >= x) >= 0\nInv3 == \\A e, f \\in {0, 1, 2} : e + f # x + 5\n====",
      "INIT Init\nNEXT Next\nINVARIANT Inv1\nINVARIANT Inv2\nINVARIANT Inv3",
    );
    expect(lines?.slice(2)).toEqual([
      [
        "line 6, col 9 to line 6, col 37 of module K: 3",
        "|line 6, col 33 to line 6, col 37 of module K: 6",
        "|line 6, col 18 to line 6, col 29 of module K: 3:9",
      ],
      [
        "line 7, col 9 to line 7, col 49 of module K: 3",
        "|line 7, col 10 to line 7, col 43 of module K: 3",
        "||line 7, col 38 to line 7, col 43 of module K: 6",
        "||line 7, col 23 to line 7, col 34 of module K: 3:6",
      ],
      [
        "line 8, col 9 to line 8, col 45 of module K: 3",
        "|line 8, col 33 to line 8, col 45 of module K: 27",
        "|line 8, col 21 to line 8, col 29 of module K: 3:51",
      ],
    ]);
  });

  it("charges the set a filter or map draws from and the set it builds, as TLC does", async () => {
    const lines = await getCoverageLines(
      "---- MODULE F ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1\nInv1 == {e \\in 0..2 : e >= x} # {7}\nInv2 == \\E e \\in {f \\in {0, 1, 2} : f >= x} : e = 2\nInv3 == \\E e \\in {f + 1 : f \\in {0, 1, 2}} : e = x + 1\n====",
      "INIT Init\nNEXT Next\nINVARIANT Inv1\nINVARIANT Inv2\nINVARIANT Inv3",
    );
    expect(lines?.slice(2)).toEqual([
      [
        "line 6, col 9 to line 6, col 35 of module F: 3",
        "|line 6, col 9 to line 6, col 29 of module F: 3",
        "||line 6, col 23 to line 6, col 28 of module F: 9",
        "||line 6, col 16 to line 6, col 19 of module F: 3",
        "|line 6, col 33 to line 6, col 35 of module F: 3",
      ],
      [
        "line 7, col 9 to line 7, col 51 of module F: 3",
        "|line 7, col 47 to line 7, col 51 of module F: 6",
        "|line 7, col 18 to line 7, col 43 of module F: 3:9",
        "||line 7, col 37 to line 7, col 42 of module F: 9",
        "||line 7, col 25 to line 7, col 33 of module F: 3:12",
      ],
      [
        "line 8, col 9 to line 8, col 54 of module F: 3",
        "|line 8, col 46 to line 8, col 54 of module F: 6",
        "|line 8, col 18 to line 8, col 42 of module F: 3:9",
        "||line 8, col 19 to line 8, col 23 of module F: 9",
        "||line 8, col 33 to line 8, col 41 of module F: 3:12",
      ],
    ]);
  });

  it("charges the sets of \\, \\cap and \\cup as TLC's SetEnumValue does, through a state's value too", async () => {
    const lines = await getCoverageLines(
      "---- MODULE S ----\nEXTENDS Naturals\nVARIABLES x, y\nInit == x = 0 /\\ y = {0, 1}\nNext == x < 2 /\\ x' = x + 1 /\\ y' = y\nInv1 == \\E e \\in {0, 1, 2} \\ {x} : e # x\nInv2 == \\E e \\in y \\cup {x} : e = x\nInv3 == \\E e \\in {x} \\cup y : e = x\n====",
      "INIT Init\nNEXT Next\nINVARIANT Inv1\nINVARIANT Inv2\nINVARIANT Inv3",
    );
    expect([lines?.[0], ...(lines?.slice(2) ?? [])]).toEqual([
      [
        "line 4, col 18 to line 4, col 27 of module S: 3",
        "|line 4, col 22 to line 4, col 27 of module S: 3:9",
      ],
      [
        "line 6, col 9 to line 6, col 40 of module S: 3",
        "|line 6, col 36 to line 6, col 40 of module S: 3",
        "|line 6, col 18 to line 6, col 32 of module S: 3",
        "||line 6, col 18 to line 6, col 26 of module S: 3:6",
        "||line 6, col 30 to line 6, col 32 of module S: 3",
      ],
      [
        "line 7, col 9 to line 7, col 35 of module S: 3",
        "|line 7, col 31 to line 7, col 35 of module S: 6",
        "|line 7, col 18 to line 7, col 27 of module S: 3",
        "||line 7, col 18 to line 7, col 18 of module S: 3",
        "||line 7, col 25 to line 7, col 27 of module S: 3:6",
        "|||line 7, col 26 to line 7, col 26 of module S: 3",
      ],
      [
        "line 8, col 9 to line 8, col 35 of module S: 3",
        "|line 8, col 31 to line 8, col 35 of module S: 6",
        "|line 8, col 18 to line 8, col 27 of module S: 3",
      ],
    ]);
  });

  it("charges a set of functions per function a successor, quantifier or CHOOSE draws, as TLC's SetOfFcnsValue does", async () => {
    const lines = await getCoverageLines(
      "---- MODULE F ----\nEXTENDS Naturals\nVARIABLES x, y\nInit == x \\in [{1, 2} -> BOOLEAN] /\\ y \\in [{1, 2} -> {0, 1}]\nNext == UNCHANGED <<x, y>>\nInv1 == \\E f \\in [{1, 2} -> {0, 1}] : f = y\nInv2 == (CHOOSE f \\in [{1, 2} -> {0, 1}] : f = y) = y\n====",
      "INIT Init\nNEXT Next\nINVARIANT Inv1\nINVARIANT Inv2",
    );
    expect([lines?.[0], ...(lines?.slice(2) ?? [])]).toEqual([
      [
        "line 4, col 15 to line 4, col 33 of module F: 1:8",
        "|line 4, col 16 to line 4, col 21 of module F: 1",
        "|line 4, col 26 to line 4, col 32 of module F: 1",
        "line 4, col 38 to line 4, col 61 of module F: 16",
        "|line 4, col 44 to line 4, col 61 of module F: 4:32",
        "||line 4, col 45 to line 4, col 50 of module F: 4",
        "||line 4, col 55 to line 4, col 60 of module F: 4:40",
      ],
      [
        "line 6, col 9 to line 6, col 43 of module F: 16",
        "|line 6, col 39 to line 6, col 43 of module F: 40",
        "|line 6, col 18 to line 6, col 35 of module F: 16:248",
        "||line 6, col 19 to line 6, col 24 of module F: 16",
        "||line 6, col 29 to line 6, col 34 of module F: 16:160",
      ],
      [
        "line 7, col 9 to line 7, col 53 of module F: 16",
        "|line 7, col 10 to line 7, col 48 of module F: 16",
        "||line 7, col 44 to line 7, col 48 of module F: 40",
        "||line 7, col 23 to line 7, col 40 of module F: 16:232",
        "|||line 7, col 24 to line 7, col 29 of module F: 16",
        "|||line 7, col 34 to line 7, col 39 of module F: 16:160",
        "|line 7, col 53 to line 7, col 53 of module F: 16",
      ],
    ]);
  });

  it("counts the body of a lazy function under its constructor, and not in the rerun for a call stack, as TLC's FcnLambdaValue does", async () => {
    const lines = await getCoverageLines(
      "---- MODULE E ----\nEXTENDS Integers\nVARIABLES x\nInit == x = 2\nNext == x' = 0 /\\ [i \\in {x} |-> <<i>>[4]][x] = 0\n====",
      "INIT Init\nNEXT Next",
    );
    expect(lines?.[1]).toEqual([
      "line 5, col 9 to line 5, col 14 of module E: 0",
      "line 5, col 19 to line 5, col 49 of module E: 2",
      "|line 5, col 19 to line 5, col 45 of module E: 2",
      "||line 5, col 19 to line 5, col 42 of module E: 2",
      "|||line 5, col 34 to line 5, col 41 of module E: 1",
      "|||line 5, col 26 to line 5, col 28 of module E: 2",
      "||line 5, col 44 to line 5, col 44 of module E: 2",
    ]);
  });

  it("counts nothing under a function over SUBSET that Len never applies, as TLC keeps it a FcnLambdaValue", async () => {
    const lines = await getCoverageLines(
      "---- MODULE M ----\nEXTENDS Integers, TLC, FiniteSets, Sequences\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1 /\\ Len(<<[y \\in SUBSET {1, 2} |-> Cardinality(y) + x]>>) = 1\n====",
      "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
    );
    expect(lines?.at(-1)).toEqual([
      "line 5, col 9 to line 5, col 13 of module M: 2",
      "|line 5, col 9 to line 5, col 9 of module M: 3",
      "line 5, col 18 to line 5, col 27 of module M: 2",
      "line 5, col 32 to line 5, col 88 of module M: 2",
    ]);
  });

  it("charges a function constructor its domain and size, as TLC's FcnLambdaValue#toFcnRcd does", async () => {
    const lines = await getCoverageLines(
      "---- MODULE E ----\nEXTENDS Integers\nVARIABLES y, z\nInit == z = 1 /\\ y = [p \\in {1, 2} |-> z]\nNext == z' = 2 /\\ y' = [p \\in {1, 2} |-> z + 1]\nInv == y = [p \\in {1, 2} |-> z] \\/ z = 2\n====",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    );
    expect(lines).toEqual([
      [
        "line 4, col 18 to line 4, col 41 of module E: 1",
        "|line 4, col 22 to line 4, col 41 of module E: 1:2",
        "||line 4, col 40 to line 4, col 40 of module E: 2",
        "||line 4, col 29 to line 4, col 34 of module E: 1:3",
      ],
      [
        "line 5, col 9 to line 5, col 14 of module E: 3",
        "line 5, col 19 to line 5, col 47 of module E: 3",
        "|line 5, col 24 to line 5, col 47 of module E: 3:6",
        "||line 5, col 42 to line 5, col 46 of module E: 6",
        "||line 5, col 31 to line 5, col 36 of module E: 3:9",
      ],
      [
        "line 6, col 8 to line 6, col 40 of module E: 3",
        "|line 6, col 8 to line 6, col 31 of module E: 3",
        "||line 6, col 8 to line 6, col 8 of module E: 3",
        "||line 6, col 12 to line 6, col 31 of module E: 3:6",
        "|||line 6, col 30 to line 6, col 30 of module E: 6",
        "|||line 6, col 19 to line 6, col 24 of module E: 3:9",
        "|line 6, col 36 to line 6, col 40 of module E: 1",
      ],
    ]);
  });

  it("charges a set of records per record a successor or quantifier draws, as TLC's SetOfRcdsValue does", async () => {
    const lines = await getCoverageLines(
      "---- MODULE E ----\nEXTENDS Integers\nVARIABLE x\nInit == x \\in [a : 0..1, b : BOOLEAN]\nNext == \\/ x.a = 0 /\\ x' \\in [a : {x.a, 1}, b : {TRUE}]\n        \\/ x.a = 1 /\\ x' = [a |-> 1 - x.a, b |-> x.b]\n        \\/ \\E r \\in [b : {x.b}, a : 0..1] : x' = r\n====",
      "INIT Init\nNEXT Next",
    );
    expect([lines?.[0], lines?.[1], lines?.[3]]).toEqual([
      [
        "line 4, col 9 to line 4, col 37 of module E: 4",
        "|line 4, col 15 to line 4, col 37 of module E: 1:8",
        "||line 4, col 16 to line 4, col 23 of module E: 1",
        "||line 4, col 26 to line 4, col 36 of module E: 1",
      ],
      [
        "line 5, col 12 to line 5, col 18 of module E: 6",
        "|line 5, col 12 to line 5, col 14 of module E: 4",
        "line 5, col 23 to line 5, col 55 of module E: 4",
        "|line 5, col 30 to line 5, col 55 of module E: 2:8",
        "||line 5, col 35 to line 5, col 42 of module E: 2:6",
        "|||line 5, col 36 to line 5, col 38 of module E: 2",
        "||line 5, col 49 to line 5, col 54 of module E: 2:10",
        "|||line 5, col 50 to line 5, col 53 of module E: 2",
      ],
      [
        "line 7, col 45 to line 7, col 50 of module E: 8",
        "line 7, col 21 to line 7, col 41 of module E: 4:36",
        "|line 7, col 26 to line 7, col 30 of module E: 4:20",
        "||line 7, col 27 to line 7, col 29 of module E: 4",
        "|line 7, col 33 to line 7, col 40 of module E: 4",
      ],
    ]);
  });

  it.each([
    [
      "a quantifier",
      "0",
      "Next == x < 2 /\\ x' = x + 1 /\\ \\E p \\in {1, 2} \\X {3} : p[1] = 2",
      [
        "line 5, col 9 to line 5, col 13 of module M: 2",
        "|line 5, col 9 to line 5, col 9 of module M: 3",
        "line 5, col 18 to line 5, col 27 of module M: 2",
        "line 5, col 32 to line 5, col 64 of module M: 2",
        "|line 5, col 57 to line 5, col 64 of module M: 4",
        "|line 5, col 41 to line 5, col 53 of module M: 2:18",
        "||line 5, col 41 to line 5, col 46 of module M: 2:6",
        "||line 5, col 51 to line 5, col 53 of module M: 2:10",
      ],
    ],
    [
      "a filter",
      "0",
      "Next == x < 2 /\\ x' = x + Cardinality({p \\in {1, 2} \\X {3} : p[1] = 2})",
      [
        "line 5, col 9 to line 5, col 13 of module M: 2",
        "|line 5, col 9 to line 5, col 9 of module M: 3",
        "line 5, col 18 to line 5, col 71 of module M: 2",
        "|line 5, col 23 to line 5, col 71 of module M: 2",
        "||line 5, col 23 to line 5, col 23 of module M: 2",
        "||line 5, col 27 to line 5, col 71 of module M: 2",
        "|||line 5, col 39 to line 5, col 70 of module M: 2:6",
        "||||line 5, col 62 to line 5, col 69 of module M: 4",
        "||||line 5, col 46 to line 5, col 58 of module M: 2:8",
        "|||||line 5, col 46 to line 5, col 51 of module M: 2:6",
        "|||||line 5, col 56 to line 5, col 58 of module M: 2:10",
      ],
    ],
    [
      "a successor",
      "<<1, 3>>",
      "Next == x' \\in {1, 2} \\X {3}",
      [
        "line 5, col 9 to line 5, col 28 of module M: 4",
        "|line 5, col 16 to line 5, col 28 of module M: 2:8",
        "||line 5, col 16 to line 5, col 21 of module M: 2:6",
        "||line 5, col 26 to line 5, col 28 of module M: 2:10",
      ],
    ],
  ])(
    "charges a Cartesian product per tuple %s draws, as TLC's SetOfTuplesValue does",
    async (_title, init, next, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Integers, FiniteSets\nVARIABLE x\nInit == x = ${init}\n${next}\n====`,
        "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      );
      expect(lines?.at(-1)).toEqual(expected);
    },
  );

  it.each([
    [
      "a set of functions",
      "x' \\in [{1} -> {t \\in {3} \\X {4, 5} : PrintT(t) /\\ t[2] > 4}]",
      4,
      [
        "line 5, col 9 to line 5, col 69 of module M: 2",
        "|line 5, col 16 to line 5, col 69 of module M: 2:2",
        "||line 5, col 17 to line 5, col 19 of module M: 2",
        "||line 5, col 24 to line 5, col 68 of module M: 2:8",
        "|||line 5, col 47 to line 5, col 67 of module M: 8",
        "|||line 5, col 31 to line 5, col 43 of module M: 2:16",
        "||||line 5, col 31 to line 5, col 33 of module M: 2:8",
        "||||line 5, col 38 to line 5, col 43 of module M: 2:16",
      ],
    ],
    [
      "a Cartesian product",
      "x' \\in {1} \\X {t \\in {3} \\X {4, 5} : PrintT(t) /\\ t[2] > 4}",
      6,
      [
        "line 5, col 9 to line 5, col 67 of module M: 2",
        "|line 5, col 16 to line 5, col 67 of module M: 2:4",
        "||line 5, col 16 to line 5, col 18 of module M: 2:4",
        "||line 5, col 23 to line 5, col 67 of module M: 2:12",
        "|||line 5, col 46 to line 5, col 66 of module M: 12",
        "|||line 5, col 30 to line 5, col 42 of module M: 2:24",
        "||||line 5, col 30 to line 5, col 32 of module M: 2:12",
        "||||line 5, col 37 to line 5, col 42 of module M: 2:24",
      ],
    ],
  ])(
    "enumerates a filter inside %s a successor draws from only as TLC does under -coverage",
    async (_title, next, passes, expected) => {
      const printed: string[] = [];
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers, TLC, FiniteSets, Sequences\nVARIABLE x\nInit == x = 0\nNext == ${next}\n====`,
        config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
        coverage: 1,
        onPrint: (text) => printed.push(text),
      });
      expect([printed, formatCoverage(result)?.at(-1)]).toEqual([
        Array.from({ length: passes }, () => ["<<3, 4>>", "<<3, 5>>"]).flat(),
        expected,
      ]);
    },
  );

  it.each([
    [
      "an interval and a set of functions",
      "(1..2) \\cup [{1} -> {3, 4}]",
      [
        "line 5, col 9 to line 5, col 42 of module M: 20",
        "|line 5, col 16 to line 5, col 42 of module M: 5",
        "||line 5, col 17 to line 5, col 20 of module M: 5",
        "||line 5, col 28 to line 5, col 42 of module M: 5:10",
        "|||line 5, col 29 to line 5, col 31 of module M: 5",
        "|||line 5, col 36 to line 5, col 41 of module M: 5:15",
      ],
    ],
    [
      "two sets of functions",
      "[{1} -> {3}] \\cup [{2} -> {4, 5}]",
      [
        "line 5, col 9 to line 5, col 48 of module M: 12",
        "|line 5, col 16 to line 5, col 48 of module M: 4:16",
        "||line 5, col 16 to line 5, col 27 of module M: 4:4",
        "|||line 5, col 17 to line 5, col 19 of module M: 4",
        "|||line 5, col 24 to line 5, col 26 of module M: 4:8",
        "||line 5, col 34 to line 5, col 48 of module M: 4:8",
        "|||line 5, col 35 to line 5, col 37 of module M: 4",
        "|||line 5, col 42 to line 5, col 47 of module M: 4:12",
      ],
    ],
    [
      "a set literal that shares an element with a set of functions",
      "{<<3>>} \\cup [{1} -> {3, 4}]",
      [
        "line 5, col 9 to line 5, col 43 of module M: 9",
        "|line 5, col 16 to line 5, col 43 of module M: 3",
        "||line 5, col 16 to line 5, col 22 of module M: 3:24",
        "|||line 5, col 17 to line 5, col 21 of module M: 3",
        "||line 5, col 29 to line 5, col 43 of module M: 3:6",
        "|||line 5, col 30 to line 5, col 32 of module M: 3",
        "|||line 5, col 37 to line 5, col 42 of module M: 3:9",
      ],
    ],
    [
      "a set of functions and a set literal",
      "[{1} -> {3, 4}] \\cup {7, 8}",
      [
        "line 5, col 9 to line 5, col 42 of module M: 20",
        "|line 5, col 16 to line 5, col 42 of module M: 5",
        "||line 5, col 16 to line 5, col 30 of module M: 5:10",
        "|||line 5, col 17 to line 5, col 19 of module M: 5",
        "|||line 5, col 24 to line 5, col 29 of module M: 5:15",
        "||line 5, col 37 to line 5, col 42 of module M: 5:50",
      ],
    ],
  ])(
    "charges the union of %s a successor draws from, as TLC's SetCupValue enumerator does",
    async (_title, union, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Integers, TLC, FiniteSets, Sequences\nVARIABLE x\nInit == x = 0\nNext == x' \\in ${union}\n====`,
        "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      );
      expect(lines?.at(-1)).toEqual(expected);
    },
  );

  it.each([
    [
      "x' \\in draws from the intersection of two sets of functions",
      "x' \\in [{1} -> {3, 4}] \\cap [{1} -> {3}]",
      [
        "line 5, col 9 to line 5, col 48 of module M: 2",
        "|line 5, col 16 to line 5, col 48 of module M: 2",
        "||line 5, col 16 to line 5, col 30 of module M: 2:4",
        "|||line 5, col 17 to line 5, col 19 of module M: 2",
        "|||line 5, col 24 to line 5, col 29 of module M: 2:6",
        "||line 5, col 37 to line 5, col 48 of module M: 2",
      ],
    ],
    [
      "x' \\in draws from the difference of two sets of functions",
      "x' \\in [{1} -> {3, 4}] \\ [{1} -> {3}]",
      [
        "line 5, col 9 to line 5, col 45 of module M: 2",
        "|line 5, col 16 to line 5, col 45 of module M: 2",
        "||line 5, col 16 to line 5, col 30 of module M: 2:4",
        "|||line 5, col 17 to line 5, col 19 of module M: 2",
        "|||line 5, col 24 to line 5, col 29 of module M: 2:6",
        "||line 5, col 34 to line 5, col 45 of module M: 2",
      ],
    ],
    [
      "x' \\in draws from a set of functions less a set literal",
      "x' \\in [{1} -> {3, 4}] \\ {[a \\in {1} |-> 3]}",
      [
        "line 5, col 9 to line 5, col 52 of module M: 2",
        "|line 5, col 16 to line 5, col 52 of module M: 2",
        "||line 5, col 16 to line 5, col 30 of module M: 2:4",
        "|||line 5, col 17 to line 5, col 19 of module M: 2",
        "|||line 5, col 24 to line 5, col 29 of module M: 2:6",
        "||line 5, col 34 to line 5, col 52 of module M: 2",
        "|||line 5, col 35 to line 5, col 51 of module M: 2:2",
        "||||line 5, col 42 to line 5, col 44 of module M: 2:4",
      ],
    ],
    [
      "x' \\in draws from the intersection of two SUBSETs, whose member method draws",
      "x' \\in SUBSET {1, 2} \\cap SUBSET {2, 3}",
      [
        "line 5, col 9 to line 5, col 47 of module M: 6",
        "|line 5, col 16 to line 5, col 47 of module M: 3",
        "||line 5, col 16 to line 5, col 28 of module M: 3:15",
        "|||line 5, col 23 to line 5, col 28 of module M: 3",
        "||line 5, col 35 to line 5, col 47 of module M: 3",
      ],
    ],
    [
      "an \\E that decides early normalizes the difference first",
      "x' = 0 /\\ \\E e \\in [{1} -> {3, 4, 5}] \\ [{1} -> {3}] : e[1] = 4",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 71 of module M: 1",
        "|line 5, col 64 to line 5, col 71 of module M: 1",
        "|line 5, col 28 to line 5, col 60 of module M: 1",
        "||line 5, col 28 to line 5, col 45 of module M: 1:3",
        "|||line 5, col 29 to line 5, col 31 of module M: 1",
        "|||line 5, col 36 to line 5, col 44 of module M: 1:4",
        "||line 5, col 49 to line 5, col 60 of module M: 1",
      ],
    ],
    [
      "Cardinality converts the intersection",
      "x' = Cardinality([{1} -> {3, 4}] \\cap [{1} -> {3}])",
      [
        "line 5, col 9 to line 5, col 59 of module M: 2",
        "|line 5, col 14 to line 5, col 59 of module M: 2",
        "||line 5, col 26 to line 5, col 58 of module M: 2",
        "|||line 5, col 26 to line 5, col 40 of module M: 2:4",
        "||||line 5, col 27 to line 5, col 29 of module M: 2",
        "||||line 5, col 34 to line 5, col 39 of module M: 2:6",
        "|||line 5, col 47 to line 5, col 58 of module M: 2",
      ],
    ],
    [
      "x' \\in draws from a difference of an intersection",
      "x' \\in ([{1} -> {3, 4}] \\cap [{1} -> {3, 4}]) \\ [{1} -> {3}]",
      [
        "line 5, col 9 to line 5, col 68 of module M: 2",
        "|line 5, col 16 to line 5, col 68 of module M: 2",
        "||line 5, col 17 to line 5, col 52 of module M: 2",
        "|||line 5, col 17 to line 5, col 31 of module M: 2:4",
        "||||line 5, col 18 to line 5, col 20 of module M: 2",
        "||||line 5, col 25 to line 5, col 30 of module M: 2:6",
        "|||line 5, col 38 to line 5, col 52 of module M: 2",
        "||line 5, col 57 to line 5, col 68 of module M: 2",
      ],
    ],
    [
      "x' \\in draws from a set of functions less an intersection",
      "x' \\in [{1} -> {3, 4}] \\ ([{1} -> {3}] \\cap [{1} -> {3, 4}])",
      [
        "line 5, col 9 to line 5, col 68 of module M: 2",
        "|line 5, col 16 to line 5, col 68 of module M: 2",
        "||line 5, col 16 to line 5, col 30 of module M: 2:4",
        "|||line 5, col 17 to line 5, col 19 of module M: 2",
        "|||line 5, col 24 to line 5, col 29 of module M: 2:6",
        "||line 5, col 35 to line 5, col 67 of module M: 2",
      ],
    ],
    [
      "x' \\in draws from the intersection of two sets of records",
      "x' \\in [a : {3, 4}] \\cap [a : {3}]",
      [
        "line 5, col 9 to line 5, col 42 of module M: 2",
        "|line 5, col 16 to line 5, col 42 of module M: 2",
        "||line 5, col 16 to line 5, col 27 of module M: 2:4",
        "|||line 5, col 17 to line 5, col 26 of module M: 2:6",
        "||line 5, col 34 to line 5, col 42 of module M: 2",
      ],
    ],
    [
      "x' \\in draws from the difference of two products",
      "x' \\in ({1} \\X {3, 4}) \\ ({1} \\X {3})",
      [
        "line 5, col 9 to line 5, col 45 of module M: 2",
        "|line 5, col 16 to line 5, col 45 of module M: 2",
        "||line 5, col 17 to line 5, col 29 of module M: 2:8",
        "|||line 5, col 17 to line 5, col 19 of module M: 2:4",
        "|||line 5, col 24 to line 5, col 29 of module M: 2:8",
        "||line 5, col 35 to line 5, col 44 of module M: 2",
      ],
    ],
    [
      "x' \\in draws from a SUBSET less a literal TLC can't sort",
      'x\' \\in (SUBSET {}) \\ {{1}, {"a"}}',
      ["line 5, col 9 to line 5, col 41 of module M: 2"],
    ],
    [
      "x' \\in draws from a SUBSET less a SUBSET too large to size",
      "x' \\in (SUBSET {1}) \\ SUBSET (1..40)",
      [
        "line 5, col 9 to line 5, col 44 of module M: 0",
        "|line 5, col 16 to line 5, col 44 of module M: 1",
        "||line 5, col 17 to line 5, col 26 of module M: 1:3",
        "|||line 5, col 24 to line 5, col 26 of module M: 1",
        "||line 5, col 31 to line 5, col 44 of module M: 1",
      ],
    ],
    [
      "x' \\in draws from a union with a difference less a literal TLC can't sort",
      'x\' \\in ((SUBSET {}) \\ {{1}, {"a"}}) \\cup {{2}}',
      [
        "line 5, col 9 to line 5, col 54 of module M: 6",
        "|line 5, col 16 to line 5, col 54 of module M: 3",
        "||line 5, col 17 to line 5, col 42 of module M: 3",
        "||line 5, col 50 to line 5, col 54 of module M: 3:18",
        "|||line 5, col 51 to line 5, col 53 of module M: 3",
      ],
    ],
    [
      "Cardinality converts a difference less a literal TLC can't sort",
      'x\' = Cardinality((SUBSET {}) \\ {{1}, {"a"}})',
      ["line 5, col 9 to line 5, col 52 of module M: 2"],
    ],
  ])(
    "charges what TLC's SetCapValue and SetDiffValue enumerators draw when %s",
    async (_title, next, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Integers, TLC, FiniteSets, Sequences\nVARIABLE x\nInit == x = 0\nNext == ${next}\n====`,
        "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      );
      expect(lines?.at(-1)).toEqual(expected);
    },
  );

  it.each([
    [
      "SUBSET",
      "[s \\in SUBSET {1, 2} |-> Cardinality(s)]",
      [
        "line 4, col 18 to line 4, col 61 of module M: 1",
        "|line 4, col 22 to line 4, col 61 of module M: 1:4",
        "||line 4, col 47 to line 4, col 60 of module M: 4",
        "||line 4, col 29 to line 4, col 41 of module M: 1",
      ],
    ],
    [
      "a filter",
      "[s \\in {t \\in SUBSET {1, 2} : 1 \\in t} |-> Cardinality(s)]",
      [
        "line 4, col 18 to line 4, col 79 of module M: 1",
        "|line 4, col 22 to line 4, col 79 of module M: 1:2",
        "||line 4, col 65 to line 4, col 78 of module M: 2",
        "||line 4, col 29 to line 4, col 59 of module M: 1:9",
        "|||line 4, col 52 to line 4, col 58 of module M: 4",
        "|||line 4, col 36 to line 4, col 48 of module M: 1",
      ],
    ],
    [
      "a set of functions",
      "[g \\in [{1, 2} -> {0, 1}] |-> g[1]]",
      [
        "line 4, col 18 to line 4, col 56 of module M: 1",
        "|line 4, col 22 to line 4, col 56 of module M: 1:4",
        "||line 4, col 52 to line 4, col 55 of module M: 4",
        "||line 4, col 29 to line 4, col 46 of module M: 1:8",
        "|||line 4, col 30 to line 4, col 35 of module M: 1",
        "|||line 4, col 40 to line 4, col 45 of module M: 1:10",
      ],
    ],
    [
      "a set of records",
      "[r \\in [a : {1, 2}, b : {3}] |-> r.a]",
      [
        "line 4, col 18 to line 4, col 58 of module M: 1",
        "|line 4, col 22 to line 4, col 58 of module M: 1:2",
        "||line 4, col 55 to line 4, col 57 of module M: 2",
        "||line 4, col 29 to line 4, col 49 of module M: 1:4",
        "|||line 4, col 30 to line 4, col 39 of module M: 1:3",
        "|||line 4, col 42 to line 4, col 48 of module M: 1:5",
      ],
    ],
    [
      "a Cartesian product",
      "[p \\in {1, 2} \\X {3} |-> p[1]]",
      [
        "line 4, col 18 to line 4, col 51 of module M: 1",
        "|line 4, col 22 to line 4, col 51 of module M: 1:2",
        "||line 4, col 47 to line 4, col 50 of module M: 2",
        "||line 4, col 29 to line 4, col 41 of module M: 1:4",
        "|||line 4, col 29 to line 4, col 34 of module M: 1:3",
        "|||line 4, col 39 to line 4, col 41 of module M: 1:5",
      ],
    ],
    [
      "a Cartesian product with a tuple of parameters",
      "[<<a, b>> \\in {1} \\X SUBSET {1} |-> a]",
      [
        "line 4, col 18 to line 4, col 59 of module M: 1",
        "|line 4, col 22 to line 4, col 59 of module M: 1:2",
        "||line 4, col 58 to line 4, col 58 of module M: 2",
        "||line 4, col 36 to line 4, col 52 of module M: 1:4",
        "|||line 4, col 36 to line 4, col 38 of module M: 1:2",
        "|||line 4, col 43 to line 4, col 52 of module M: 1",
      ],
    ],
    [
      "SUBSET and a set literal",
      "[a \\in SUBSET {1}, b \\in {1, 2} |-> b]",
      [
        "line 4, col 18 to line 4, col 59 of module M: 1",
        "|line 4, col 22 to line 4, col 59 of module M: 1:4",
        "||line 4, col 58 to line 4, col 58 of module M: 4",
        "||line 4, col 29 to line 4, col 38 of module M: 1",
        "||line 4, col 47 to line 4, col 52 of module M: 1:3",
      ],
    ],
    [
      "a set literal and SUBSET",
      "[a \\in {1, 2}, b \\in SUBSET {1} |-> a]",
      [
        "line 4, col 18 to line 4, col 59 of module M: 1",
        "|line 4, col 22 to line 4, col 59 of module M: 1:4",
        "||line 4, col 58 to line 4, col 58 of module M: 4",
        "||line 4, col 29 to line 4, col 34 of module M: 1:7",
        "||line 4, col 43 to line 4, col 52 of module M: 1",
      ],
    ],
  ])(
    "charges the sets a lazy function over %s enumerates when an initial state holds it, as TLC's FcnLambdaValue#toFcnRcd does",
    async (_title, value, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Integers, FiniteSets\nVARIABLES x, y\nInit == x = 0 /\\ y = ${value}\nNext == x < 2 /\\ x' = x + 1 /\\ UNCHANGED y\n====`,
        "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      );
      expect(lines?.[0]).toEqual(expected);
    },
  );

  it.each([
    [
      "a successor holds it",
      "x = 0 /\\ y = 0",
      "Next == x < 2 /\\ x' = x + 1 /\\ y' = [s \\in SUBSET {1, 2} |-> Cardinality(s) + x]",
      [
        "line 5, col 9 to line 5, col 13 of module M: 2",
        "|line 5, col 9 to line 5, col 9 of module M: 3",
        "line 5, col 18 to line 5, col 27 of module M: 2",
        "line 5, col 32 to line 5, col 80 of module M: 2",
        "|line 5, col 37 to line 5, col 80 of module M: 2:8",
        "||line 5, col 62 to line 5, col 79 of module M: 8",
        "||line 5, col 44 to line 5, col 56 of module M: 2",
      ],
    ],
    [
      "ToString converts it",
      "x = 0 /\\ y = 0",
      'Next == x < 2 /\\ x\' = x + 1 /\\ ToString([s \\in SUBSET {1} |-> Cardinality(s)]) # "" /\\ UNCHANGED y',
      [
        "line 5, col 9 to line 5, col 13 of module M: 2",
        "|line 5, col 9 to line 5, col 9 of module M: 3",
        "line 5, col 18 to line 5, col 27 of module M: 2",
        "line 5, col 32 to line 5, col 83 of module M: 4",
        "|line 5, col 32 to line 5, col 78 of module M: 2",
        "||line 5, col 41 to line 5, col 77 of module M: 2:4",
        "|||line 5, col 63 to line 5, col 76 of module M: 4",
        "|||line 5, col 48 to line 5, col 57 of module M: 2",
        "line 5, col 88 to line 5, col 98 of module M: 2",
      ],
    ],
    [
      "a successor holds it, defined recursively over a set literal",
      "x = 0 /\\ y = 0",
      "Next == x < 2 /\\ x' = x + 1 /\\ y' = LET f[n \\in {0, 1, 2}] == IF n = 0 THEN x ELSE f[n - 1] + 1 IN f",
      [
        "line 5, col 9 to line 5, col 13 of module M: 2",
        "|line 5, col 9 to line 5, col 9 of module M: 3",
        "line 5, col 18 to line 5, col 27 of module M: 2",
        "line 5, col 32 to line 5, col 100 of module M: 2",
        "|line 5, col 41 to line 5, col 95 of module M: 2:6",
        "||line 5, col 63 to line 5, col 95 of module M: 12",
        "|||line 5, col 66 to line 5, col 70 of module M: 12",
        "|||line 5, col 77 to line 5, col 77 of module M: 6",
        "|||line 5, col 84 to line 5, col 95 of module M: 6",
        "||line 5, col 49 to line 5, col 57 of module M: 2:8",
        "|line 5, col 100 to line 5, col 100 of module M: 2",
      ],
    ],
  ])(
    "charges the sets a lazy function enumerates when %s, as TLC's FcnLambdaValue#toFcnRcd does",
    async (_title, init, next, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nVARIABLES x, y\nInit == ${init}\n${next}\n====`,
        "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      );
      expect(lines?.at(-1)).toEqual(expected);
    },
  );

  it.each([
    [
      "its body enumerates one",
      "[s \\in SUBSET {1, 2} |-> \\E e \\in s : e > 1]",
      "UNCHANGED y",
      [
        "line 4, col 18 to line 4, col 65 of module M: 1",
        "|line 4, col 22 to line 4, col 65 of module M: 1:4",
        "||line 4, col 47 to line 4, col 64 of module M: 4",
        "||line 4, col 29 to line 4, col 41 of module M: 1:8",
        "|||line 4, col 36 to line 4, col 41 of module M: 1",
      ],
    ],
    [
      "its body chooses from one",
      "[s \\in SUBSET {1, 2} |-> IF s = {} THEN 0 ELSE CHOOSE e \\in s : TRUE]",
      "UNCHANGED y",
      [
        "line 4, col 18 to line 4, col 90 of module M: 1",
        "|line 4, col 22 to line 4, col 90 of module M: 1:4",
        "||line 4, col 47 to line 4, col 89 of module M: 4",
        "|||line 4, col 50 to line 4, col 55 of module M: 4",
        "|||line 4, col 69 to line 4, col 89 of module M: 3",
        "||line 4, col 29 to line 4, col 41 of module M: 1:3",
        "|||line 4, col 36 to line 4, col 41 of module M: 1",
      ],
    ],
    [
      "a successor enumerates its domain",
      "[s \\in SUBSET {1, 2} |-> 0]",
      "UNCHANGED y /\\ \\A s \\in DOMAIN y : \\A e \\in s : e > 0",
      [
        "line 4, col 18 to line 4, col 48 of module M: 1",
        "|line 4, col 22 to line 4, col 48 of module M: 1:4",
        "||line 4, col 29 to line 4, col 41 of module M: 1:16",
        "|||line 4, col 36 to line 4, col 41 of module M: 1",
      ],
    ],
  ])(
    "charges SUBSET for enumerating the subsets a lazy function's conversion draws when %s, as TLC's SubsetValue gives them its cost model",
    async (_title, value, next, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Integers, FiniteSets\nVARIABLES x, y\nInit == x = 0 /\\ y = ${value}\nNext == x < 2 /\\ x' = x + 1 /\\ ${next}\n====`,
        "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      );
      expect(lines?.[0]).toEqual(expected);
    },
  );

  it("charges SUBSET for the subsets a recursive function over it chooses from, as TLC's SubsetValue gives them its cost model", async () => {
    const lines = await getCoverageLines(
      "---- MODULE M ----\nEXTENDS Integers, FiniteSets\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == x < 2 /\\ x' = x + 1 /\\ y' = LET f[s \\in SUBSET {1, 2}] == IF s = {} THEN x ELSE f[s \\ {CHOOSE e \\in s : TRUE}] + 1 IN f\n====",
      "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
    );
    expect(lines?.at(-1)).toEqual([
      "line 5, col 9 to line 5, col 13 of module M: 2",
      "|line 5, col 9 to line 5, col 9 of module M: 3",
      "line 5, col 18 to line 5, col 27 of module M: 2",
      "line 5, col 32 to line 5, col 127 of module M: 2",
      "|line 5, col 41 to line 5, col 122 of module M: 2:8",
      "||line 5, col 67 to line 5, col 122 of module M: 16",
      "|||line 5, col 70 to line 5, col 75 of module M: 16",
      "|||line 5, col 82 to line 5, col 82 of module M: 8",
      "|||line 5, col 89 to line 5, col 122 of module M: 8",
      "||line 5, col 49 to line 5, col 61 of module M: 2:18",
      "|||line 5, col 56 to line 5, col 61 of module M: 2",
      "|line 5, col 127 to line 5, col 127 of module M: 2",
    ]);
  });

  it("counts the body and conversion of the copy of a lazy function PrintT prints, though TLC's FcnLambdaValue#deepCopy drops the cost model", async () => {
    const lines = await getCoverageLines(
      "---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1 /\\ PrintT([s \\in SUBSET {1} |-> Cardinality(s)])\n====",
      "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
    );
    expect(lines?.at(-1)).toEqual([
      "line 5, col 9 to line 5, col 13 of module M: 2",
      "|line 5, col 9 to line 5, col 9 of module M: 3",
      "line 5, col 18 to line 5, col 27 of module M: 2",
      "line 5, col 32 to line 5, col 76 of module M: 2",
      "|line 5, col 39 to line 5, col 75 of module M: 2:4",
      "||line 5, col 61 to line 5, col 74 of module M: 4",
      "||line 5, col 46 to line 5, col 55 of module M: 2",
    ]);
  });

  it("charges nothing for a conversion whose body fails, as FcnLambdaValue#toFcnRcd charges its size last", async () => {
    const lines = await getCoverageLines(
      "---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nInit == x = 0\nNext == x' = IF x = 1 THEN [k \\in SUBSET {1} |-> 1 \\div 0] ELSE x + 1\n====",
      "INIT Init\nNEXT Next",
    );
    expect(lines?.at(-1)).toEqual([
      "line 5, col 9 to line 5, col 69 of module M: 4",
      "|line 5, col 14 to line 5, col 69 of module M: 5",
      "||line 5, col 17 to line 5, col 21 of module M: 5",
      "||line 5, col 28 to line 5, col 58 of module M: 3",
      "|||line 5, col 50 to line 5, col 57 of module M: 2",
      "|||line 5, col 35 to line 5, col 44 of module M: 3",
      "||line 5, col 65 to line 5, col 69 of module M: 2",
    ]);
  });

  it.each([
    [
      "a set literal is checked against SUBSET",
      "VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = IF {1, 3} \\in SUBSET {1, 2, 3} THEN x + 1 ELSE x",
      [
        ["line 4, col 9 to line 4, col 13 of module M: 1"],
        [
          "line 5, col 9 to line 5, col 13 of module M: 2",
          "|line 5, col 9 to line 5, col 9 of module M: 3",
          "line 5, col 18 to line 5, col 70 of module M: 2",
          "|line 5, col 23 to line 5, col 70 of module M: 2",
          "||line 5, col 26 to line 5, col 52 of module M: 2",
          "|||line 5, col 26 to line 5, col 31 of module M: 2:6",
          "|||line 5, col 37 to line 5, col 52 of module M: 2",
          "||line 5, col 59 to line 5, col 63 of module M: 2",
        ],
      ],
    ],
    [
      "a set literal outside SUBSET is checked against it",
      "VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1 /\\ {1, 3} \\notin SUBSET {1, 2}",
      [
        ["line 4, col 9 to line 4, col 13 of module M: 1"],
        [
          "line 5, col 9 to line 5, col 13 of module M: 2",
          "|line 5, col 9 to line 5, col 9 of module M: 3",
          "line 5, col 18 to line 5, col 27 of module M: 2",
          "line 5, col 32 to line 5, col 58 of module M: 2",
          "|line 5, col 32 to line 5, col 37 of module M: 2:4",
          "|line 5, col 46 to line 5, col 58 of module M: 2",
        ],
      ],
    ],
    [
      "a set a state holds is checked against SUBSET",
      "VARIABLES x, y\nInit == x = 0 /\\ y = {1, 2}\nNext == x < 2 /\\ x' = x + 1 /\\ y \\in SUBSET {1, 2, 3} /\\ UNCHANGED y",
      [
        [
          "line 4, col 18 to line 4, col 27 of module M: 1",
          "|line 4, col 22 to line 4, col 27 of module M: 1:6",
        ],
        [
          "line 5, col 9 to line 5, col 13 of module M: 2",
          "|line 5, col 9 to line 5, col 9 of module M: 3",
          "line 5, col 18 to line 5, col 27 of module M: 2",
          "line 5, col 32 to line 5, col 53 of module M: 4",
          "|line 5, col 32 to line 5, col 32 of module M: 2",
          "|line 5, col 38 to line 5, col 53 of module M: 2",
          "line 5, col 58 to line 5, col 68 of module M: 2",
        ],
      ],
    ],
    [
      "a set of sets is checked against SUBSET SUBSET",
      "VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1 /\\ {{1}, {2}} \\in SUBSET SUBSET {1, 2}",
      [
        ["line 4, col 9 to line 4, col 13 of module M: 1"],
        [
          "line 5, col 9 to line 5, col 13 of module M: 2",
          "|line 5, col 9 to line 5, col 9 of module M: 3",
          "line 5, col 18 to line 5, col 27 of module M: 2",
          "line 5, col 32 to line 5, col 66 of module M: 2",
          "|line 5, col 32 to line 5, col 41 of module M: 2:6",
          "||line 5, col 33 to line 5, col 35 of module M: 2:4",
          "||line 5, col 38 to line 5, col 40 of module M: 2:4",
          "|line 5, col 47 to line 5, col 66 of module M: 2",
        ],
      ],
    ],
    [
      "set literals are checked as a subset of SUBSET",
      "VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1 /\\ {{1}, {2, 1}} \\subseteq SUBSET {1, 2}",
      [
        ["line 4, col 9 to line 4, col 13 of module M: 1"],
        [
          "line 5, col 9 to line 5, col 13 of module M: 2",
          "|line 5, col 9 to line 5, col 9 of module M: 3",
          "line 5, col 18 to line 5, col 27 of module M: 2",
          "line 5, col 32 to line 5, col 68 of module M: 2",
          "|line 5, col 32 to line 5, col 44 of module M: 2:6",
          "||line 5, col 33 to line 5, col 35 of module M: 2:4",
          "||line 5, col 38 to line 5, col 43 of module M: 2:6",
          "|line 5, col 56 to line 5, col 68 of module M: 2",
        ],
      ],
    ],
    [
      "a set literal is checked against a filter of SUBSET",
      "VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1 /\\ {1, 2} \\in {t \\in SUBSET {1, 2, 3} : 1 \\in t}",
      [
        ["line 4, col 9 to line 4, col 13 of module M: 1"],
        [
          "line 5, col 9 to line 5, col 13 of module M: 2",
          "|line 5, col 9 to line 5, col 9 of module M: 3",
          "line 5, col 18 to line 5, col 27 of module M: 2",
          "line 5, col 32 to line 5, col 76 of module M: 2",
          "|line 5, col 32 to line 5, col 37 of module M: 2:6",
          "|line 5, col 43 to line 5, col 76 of module M: 2",
        ],
      ],
    ],
    [
      "a function a state holds is checked against a set of functions into SUBSET",
      "VARIABLES x, y\nInit == x = 0 /\\ y = [i \\in {1, 2} |-> {i}]\nNext == x < 2 /\\ x' = x + 1 /\\ y \\in [{1, 2} -> SUBSET {1, 2, 3}] /\\ UNCHANGED y",
      [
        [
          "line 4, col 18 to line 4, col 43 of module M: 1",
          "|line 4, col 22 to line 4, col 43 of module M: 1:2",
          "||line 4, col 40 to line 4, col 42 of module M: 2:8",
          "|||line 4, col 41 to line 4, col 41 of module M: 2",
          "||line 4, col 29 to line 4, col 34 of module M: 1:3",
        ],
        [
          "line 5, col 9 to line 5, col 13 of module M: 2",
          "|line 5, col 9 to line 5, col 9 of module M: 3",
          "line 5, col 18 to line 5, col 27 of module M: 2",
          "line 5, col 32 to line 5, col 65 of module M: 4",
          "|line 5, col 32 to line 5, col 32 of module M: 2",
          "|line 5, col 38 to line 5, col 65 of module M: 2",
          "line 5, col 70 to line 5, col 80 of module M: 2",
        ],
      ],
    ],
    [
      "a tuple is checked against a Cartesian product with SUBSET",
      "VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1 /\\ <<{1}, 2>> \\in (SUBSET {1}) \\X {2}",
      [
        ["line 4, col 9 to line 4, col 13 of module M: 1"],
        [
          "line 5, col 9 to line 5, col 13 of module M: 2",
          "|line 5, col 9 to line 5, col 9 of module M: 3",
          "line 5, col 18 to line 5, col 27 of module M: 2",
          "line 5, col 32 to line 5, col 65 of module M: 2",
          "|line 5, col 32 to line 5, col 41 of module M: 2",
          "||line 5, col 34 to line 5, col 36 of module M: 2:4",
          "|line 5, col 47 to line 5, col 65 of module M: 2",
        ],
      ],
    ],
    [
      "a tuple is checked against a set of sequences over SUBSET",
      "VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1 /\\ <<{1}, {2}>> \\in Seq(SUBSET {1, 2})",
      [
        ["line 4, col 9 to line 4, col 13 of module M: 1"],
        [
          "line 5, col 9 to line 5, col 13 of module M: 2",
          "|line 5, col 9 to line 5, col 9 of module M: 3",
          "line 5, col 18 to line 5, col 27 of module M: 2",
          "line 5, col 32 to line 5, col 66 of module M: 2",
          "|line 5, col 32 to line 5, col 43 of module M: 2",
          "||line 5, col 34 to line 5, col 36 of module M: 2:4",
          "||line 5, col 39 to line 5, col 41 of module M: 2:4",
          "|line 5, col 49 to line 5, col 66 of module M: 2",
        ],
      ],
    ],
    [
      "a set literal is checked against a union of SUBSETs",
      "VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1 /\\ {2} \\in (SUBSET {1}) \\cup (SUBSET {2})",
      [
        ["line 4, col 9 to line 4, col 13 of module M: 1"],
        [
          "line 5, col 9 to line 5, col 13 of module M: 2",
          "|line 5, col 9 to line 5, col 9 of module M: 3",
          "line 5, col 18 to line 5, col 27 of module M: 2",
          "line 5, col 32 to line 5, col 69 of module M: 2",
          "|line 5, col 32 to line 5, col 34 of module M: 2:6",
          "|line 5, col 40 to line 5, col 69 of module M: 2",
        ],
      ],
    ],
    [
      "a set literal is found in the second set of a UNION",
      "VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1 /\\ {2} \\in UNION {SUBSET {1}, SUBSET {2}}",
      [
        ["line 4, col 9 to line 4, col 13 of module M: 1"],
        [
          "line 5, col 9 to line 5, col 13 of module M: 2",
          "|line 5, col 9 to line 5, col 9 of module M: 3",
          "line 5, col 18 to line 5, col 27 of module M: 2",
          "line 5, col 32 to line 5, col 69 of module M: 2",
          "|line 5, col 32 to line 5, col 34 of module M: 2:6",
          "|line 5, col 40 to line 5, col 69 of module M: 2",
          "||line 5, col 46 to line 5, col 69 of module M: 2:4",
          "|||line 5, col 47 to line 5, col 56 of module M: 2",
          "|||line 5, col 59 to line 5, col 68 of module M: 2",
        ],
      ],
    ],
    [
      "a set literal is found in no set of a UNION",
      "VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1 /\\ {3} \\notin UNION {SUBSET {1}, SUBSET {2}}",
      [
        ["line 4, col 9 to line 4, col 13 of module M: 1"],
        [
          "line 5, col 9 to line 5, col 13 of module M: 2",
          "|line 5, col 9 to line 5, col 9 of module M: 3",
          "line 5, col 18 to line 5, col 27 of module M: 2",
          "line 5, col 32 to line 5, col 72 of module M: 2",
          "|line 5, col 32 to line 5, col 34 of module M: 2:4",
          "|line 5, col 43 to line 5, col 72 of module M: 2",
          "||line 5, col 49 to line 5, col 72 of module M: 2:6",
          "|||line 5, col 50 to line 5, col 59 of module M: 2",
          "|||line 5, col 62 to line 5, col 71 of module M: 2",
        ],
      ],
    ],
    [
      "a lazy function over SUBSET is applied",
      "VARIABLE x\nf == [y \\in SUBSET {1, 2} |-> Cardinality(y)]\nInit == x = 0\nNext == x < 2 /\\ x' = x + f[{1}]",
      [
        ["line 5, col 9 to line 5, col 13 of module M: 1"],
        [
          "line 6, col 9 to line 6, col 13 of module M: 2",
          "|line 6, col 9 to line 6, col 9 of module M: 3",
          "line 6, col 18 to line 6, col 32 of module M: 2",
          "|line 6, col 23 to line 6, col 32 of module M: 2",
          "||line 6, col 23 to line 6, col 23 of module M: 2",
          "||line 6, col 27 to line 6, col 32 of module M: 2",
          "|||line 6, col 27 to line 6, col 27 of module M: 2",
          "|||line 6, col 29 to line 6, col 31 of module M: 2:4",
        ],
      ],
    ],
    [
      "a lazy function over SUBSET that prints is applied",
      "VARIABLE x\nf == [y \\in SUBSET {1, 2} |-> IF PrintT(y) THEN Cardinality(y) ELSE 0]\nInit == x = 0\nNext == x < 2 /\\ x' = x + f[{1}]",
      [
        ["line 5, col 9 to line 5, col 13 of module M: 1"],
        [
          "line 6, col 9 to line 6, col 13 of module M: 2",
          "|line 6, col 9 to line 6, col 9 of module M: 3",
          "line 6, col 18 to line 6, col 32 of module M: 2",
          "|line 6, col 23 to line 6, col 32 of module M: 2",
          "||line 6, col 23 to line 6, col 23 of module M: 2",
          "||line 6, col 27 to line 6, col 32 of module M: 2",
          "|||line 6, col 27 to line 6, col 27 of module M: 2",
          "|||line 6, col 29 to line 6, col 31 of module M: 2:4",
        ],
      ],
    ],
    [
      "a lazy function an operator builds is applied",
      "VARIABLE x\nf(z) == [y \\in SUBSET {1, 2} |-> Cardinality(y)]\nInit == x = 0\nNext == x < 2 /\\ x' = x + f(x)[{1}]",
      [
        ["line 5, col 9 to line 5, col 13 of module M: 1"],
        [
          "line 6, col 9 to line 6, col 13 of module M: 2",
          "|line 6, col 9 to line 6, col 9 of module M: 3",
          "line 6, col 18 to line 6, col 35 of module M: 2",
          "|line 6, col 23 to line 6, col 35 of module M: 2",
          "||line 6, col 23 to line 6, col 23 of module M: 2",
          "||line 6, col 27 to line 6, col 35 of module M: 2",
          "|||line 6, col 27 to line 6, col 30 of module M: 2",
          "|||line 6, col 32 to line 6, col 34 of module M: 2:4",
        ],
      ],
    ],
    [
      "a lazy function in a tuple is applied",
      "VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1 /\\ <<[y \\in SUBSET {1, 2} |-> Cardinality(y) + x]>>[1][{1}] = 1 + x",
      [
        ["line 4, col 9 to line 4, col 13 of module M: 1"],
        [
          "line 5, col 9 to line 5, col 13 of module M: 2",
          "|line 5, col 9 to line 5, col 9 of module M: 3",
          "line 5, col 18 to line 5, col 27 of module M: 2",
          "line 5, col 32 to line 5, col 95 of module M: 2",
          "|line 5, col 32 to line 5, col 87 of module M: 2",
          "||line 5, col 32 to line 5, col 82 of module M: 2",
          "||line 5, col 84 to line 5, col 86 of module M: 2:4",
          "|line 5, col 91 to line 5, col 95 of module M: 2",
        ],
      ],
    ],
    [
      "a lazy function a LET defines is applied",
      "VARIABLE x\nInit == x = 0\nNext == x = 0 /\\ x' = LET f == [y \\in SUBSET (1..3) |-> Cardinality(y)] IN f[{1}]",
      [
        ["line 4, col 9 to line 4, col 13 of module M: 1"],
        [
          "line 5, col 9 to line 5, col 13 of module M: 3",
          "|line 5, col 9 to line 5, col 9 of module M: 2",
          "line 5, col 18 to line 5, col 81 of module M: 1",
          "|line 5, col 32 to line 5, col 71 of module M: 1",
          "|line 5, col 76 to line 5, col 81 of module M: 1",
          "||line 5, col 76 to line 5, col 76 of module M: 1",
          "||line 5, col 78 to line 5, col 80 of module M: 1:2",
        ],
      ],
    ],
    [
      "a lazy function over SUBSET is applied at a larger set",
      "VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + [s \\in SUBSET {1, 2, 3} |-> Cardinality(s)][{1, 3}]",
      [
        ["line 4, col 9 to line 4, col 13 of module M: 1"],
        [
          "line 5, col 9 to line 5, col 13 of module M: 1",
          "|line 5, col 9 to line 5, col 9 of module M: 2",
          "line 5, col 18 to line 5, col 77 of module M: 1",
          "|line 5, col 23 to line 5, col 77 of module M: 1",
          "||line 5, col 23 to line 5, col 23 of module M: 1",
          "||line 5, col 27 to line 5, col 77 of module M: 1",
          "|||line 5, col 27 to line 5, col 69 of module M: 1",
          "|||line 5, col 71 to line 5, col 76 of module M: 1:3",
        ],
      ],
    ],
    [
      "a lazy function over SUBSET is applied outside its domain",
      "VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + [s \\in SUBSET {1, 2} |-> Cardinality(s)][{1, 4, 2}]",
      [
        ["line 4, col 9 to line 4, col 13 of module M: 1"],
        [
          "line 5, col 9 to line 5, col 13 of module M: 2",
          "line 5, col 18 to line 5, col 77 of module M: 0",
          "|line 5, col 23 to line 5, col 77 of module M: 2",
          "||line 5, col 23 to line 5, col 23 of module M: 2",
          "||line 5, col 27 to line 5, col 77 of module M: 2",
          "|||line 5, col 27 to line 5, col 66 of module M: 2:4",
          "||||line 5, col 52 to line 5, col 65 of module M: 4",
          "||||line 5, col 34 to line 5, col 46 of module M: 2",
          "|||line 5, col 68 to line 5, col 76 of module M: 2:6",
        ],
      ],
    ],
    [
      "a lazy function over a filter of SUBSET is applied",
      "VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + [s \\in {t \\in SUBSET {1, 2} : 1 \\in t} |-> Cardinality(s)][{1}]",
      [
        ["line 4, col 9 to line 4, col 13 of module M: 1"],
        [
          "line 5, col 9 to line 5, col 13 of module M: 2",
          "|line 5, col 9 to line 5, col 9 of module M: 3",
          "line 5, col 18 to line 5, col 89 of module M: 2",
          "|line 5, col 23 to line 5, col 89 of module M: 2",
          "||line 5, col 23 to line 5, col 23 of module M: 2",
          "||line 5, col 27 to line 5, col 89 of module M: 2",
          "|||line 5, col 27 to line 5, col 84 of module M: 2",
          "|||line 5, col 86 to line 5, col 88 of module M: 2:4",
        ],
      ],
    ],
  ])(
    "charges the sets a membership check enumerates when %s, as TLC's member methods do",
    async (_title, body, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Integers, FiniteSets, Sequences, TLC\n${body}\n====`,
        "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      );
      expect(lines).toEqual(expected);
    },
  );

  it.each([
    [
      "UNION",
      '"a" \\in UNION {{"b"}, 0..x + 2}',
      [
        "line 5, col 9 to line 5, col 13 of module M: 2",
        "line 5, col 18 to line 5, col 27 of module M: 0",
        "|line 5, col 23 to line 5, col 27 of module M: 2",
        "line 5, col 32 to line 5, col 62 of module M: 2",
        "|line 5, col 40 to line 5, col 62 of module M: 2",
        "||line 5, col 46 to line 5, col 62 of module M: 2:4",
        "|||line 5, col 47 to line 5, col 51 of module M: 2",
        "|||line 5, col 54 to line 5, col 61 of module M: 2",
      ],
    ],
    [
      "SUBSET",
      '{{}, {x}} \\in SUBSET (SUBSET {"b"})',
      [
        "line 5, col 9 to line 5, col 13 of module M: 2",
        "line 5, col 18 to line 5, col 27 of module M: 0",
        "|line 5, col 23 to line 5, col 27 of module M: 2",
        "line 5, col 32 to line 5, col 66 of module M: 2",
        "|line 5, col 32 to line 5, col 40 of module M: 2:4",
        "||line 5, col 33 to line 5, col 34 of module M: 2:2",
        "||line 5, col 37 to line 5, col 39 of module M: 2:2",
        "|||line 5, col 38 to line 5, col 38 of module M: 2",
        "|line 5, col 46 to line 5, col 66 of module M: 2",
      ],
    ],
  ])(
    "charges the draws a membership check in %s made before it failed, as TLC's enumerators charge each as they draw it",
    async (_title, condition, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Integers, FiniteSets, Sequences, TLC\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1 /\\ ${condition}\n====`,
        "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      );
      expect(lines?.at(-1)).toEqual(expected);
    },
  );

  it.each([
    [
      "a tuple",
      "VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1 /\\ <<3, x>> \\notin [{1} -> {1}]",
      [
        ["line 4, col 9 to line 4, col 13 of module M: 1"],
        [
          "line 5, col 9 to line 5, col 13 of module M: 2",
          "|line 5, col 9 to line 5, col 9 of module M: 3",
          "line 5, col 18 to line 5, col 27 of module M: 2",
          "line 5, col 32 to line 5, col 59 of module M: 2",
          "|line 5, col 32 to line 5, col 39 of module M: 2:4",
          "||line 5, col 37 to line 5, col 37 of module M: 2",
          "|line 5, col 48 to line 5, col 59 of module M: 2",
        ],
      ],
    ],
    [
      "a record",
      'VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x\' = x + 1 /\\ [a |-> x, b |-> 2] \\in [{"a", "b"} -> Nat]',
      [
        ["line 4, col 9 to line 4, col 13 of module M: 1"],
        [
          "line 5, col 9 to line 5, col 13 of module M: 2",
          "|line 5, col 9 to line 5, col 9 of module M: 3",
          "line 5, col 18 to line 5, col 27 of module M: 2",
          "line 5, col 32 to line 5, col 73 of module M: 2",
          "|line 5, col 32 to line 5, col 49 of module M: 2:4",
          "||line 5, col 33 to line 5, col 39 of module M: 2",
          "|line 5, col 55 to line 5, col 73 of module M: 2",
        ],
      ],
    ],
    [
      "a tuple a state holds",
      "VARIABLE x\nInit == x = <<0, 0>>\nNext == x[1] < 2 /\\ x \\in [1..2 -> Nat] /\\ x' = <<x[1] + 1, 0>>",
      [
        [
          "line 4, col 9 to line 4, col 20 of module M: 1",
          "|line 4, col 13 to line 4, col 20 of module M: 1:2",
        ],
        [
          "line 5, col 9 to line 5, col 16 of module M: 2",
          "|line 5, col 9 to line 5, col 12 of module M: 3",
          "line 5, col 21 to line 5, col 39 of module M: 4",
          "|line 5, col 21 to line 5, col 21 of module M: 2",
          "|line 5, col 27 to line 5, col 39 of module M: 2",
          "line 5, col 44 to line 5, col 63 of module M: 2",
          "|line 5, col 49 to line 5, col 63 of module M: 2:2",
          "||line 5, col 51 to line 5, col 58 of module M: 2",
        ],
      ],
    ],
    [
      "a tuple in the range",
      "VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1 /\\ <<<<x>>>> \\in [1..1 -> [1..1 -> Nat]]",
      [
        ["line 4, col 9 to line 4, col 13 of module M: 1"],
        [
          "line 5, col 9 to line 5, col 13 of module M: 2",
          "|line 5, col 9 to line 5, col 9 of module M: 3",
          "line 5, col 18 to line 5, col 27 of module M: 2",
          "line 5, col 32 to line 5, col 68 of module M: 2",
          "|line 5, col 32 to line 5, col 40 of module M: 2:2",
          "||line 5, col 34 to line 5, col 38 of module M: 2:2",
          "|||line 5, col 36 to line 5, col 36 of module M: 2",
          "|line 5, col 46 to line 5, col 68 of module M: 2",
        ],
      ],
    ],
  ])(
    "charges %s that a set of functions converts, as TLC's SetOfFcnsValue#member calls toFcnRcd",
    async (_title, body, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Integers, FiniteSets, Sequences, TLC\n${body}\n====`,
        "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      );
      expect(lines).toEqual(expected);
    },
  );

  it.each([
    [
      "two sets of functions",
      "Cardinality([{1} -> {3, 4}] \\cup [{2} -> {5}])",
      [
        "line 5, col 9 to line 5, col 59 of module M: 2",
        "|line 5, col 14 to line 5, col 59 of module M: 2",
        "||line 5, col 26 to line 5, col 58 of module M: 2:14",
        "|||line 5, col 26 to line 5, col 40 of module M: 2:4",
        "||||line 5, col 27 to line 5, col 29 of module M: 2",
        "||||line 5, col 34 to line 5, col 39 of module M: 2:6",
        "|||line 5, col 47 to line 5, col 58 of module M: 2:2",
        "||||line 5, col 48 to line 5, col 50 of module M: 2",
        "||||line 5, col 55 to line 5, col 57 of module M: 2:4",
      ],
    ],
    [
      "a set literal and SUBSET S",
      "Cardinality({{1}} \\cup SUBSET {2, 3})",
      [
        "line 5, col 9 to line 5, col 50 of module M: 2",
        "|line 5, col 14 to line 5, col 50 of module M: 2",
        "||line 5, col 26 to line 5, col 49 of module M: 2",
        "|||line 5, col 26 to line 5, col 30 of module M: 2:34",
        "||||line 5, col 27 to line 5, col 29 of module M: 2",
        "|||line 5, col 37 to line 5, col 49 of module M: 2",
      ],
    ],
    [
      "two sets of functions that share an element",
      "Cardinality([{1} -> {3, 4}] \\cup [{1} -> {4, 5}])",
      [
        "line 5, col 9 to line 5, col 62 of module M: 2",
        "|line 5, col 14 to line 5, col 62 of module M: 2",
        "||line 5, col 26 to line 5, col 61 of module M: 2:18",
        "|||line 5, col 26 to line 5, col 40 of module M: 2:4",
        "||||line 5, col 27 to line 5, col 29 of module M: 2",
        "||||line 5, col 34 to line 5, col 39 of module M: 2:6",
        "|||line 5, col 47 to line 5, col 61 of module M: 2:4",
        "||||line 5, col 48 to line 5, col 50 of module M: 2",
        "||||line 5, col 55 to line 5, col 60 of module M: 2:6",
      ],
    ],
    [
      "a union of a union",
      "Cardinality(([{1} -> {3}] \\cup [{2} -> {4}]) \\cup [{3} -> {5}])",
      [
        "line 5, col 9 to line 5, col 76 of module M: 2",
        "|line 5, col 14 to line 5, col 76 of module M: 2",
        "||line 5, col 26 to line 5, col 75 of module M: 2:14",
        "|||line 5, col 27 to line 5, col 56 of module M: 2:8",
        "||||line 5, col 27 to line 5, col 38 of module M: 2:2",
        "|||||line 5, col 28 to line 5, col 30 of module M: 2",
        "|||||line 5, col 35 to line 5, col 37 of module M: 2:4",
        "||||line 5, col 45 to line 5, col 56 of module M: 2:2",
        "|||||line 5, col 46 to line 5, col 48 of module M: 2",
        "|||||line 5, col 53 to line 5, col 55 of module M: 2:4",
        "|||line 5, col 64 to line 5, col 75 of module M: 2:2",
        "||||line 5, col 65 to line 5, col 67 of module M: 2",
        "||||line 5, col 72 to line 5, col 74 of module M: 2:4",
      ],
    ],
    [
      "a union it sizes twice",
      "LET U == [{1} -> {3, 4}] \\cup [{2} -> {5}] IN Cardinality(U) + Cardinality(U)",
      [
        "line 5, col 9 to line 5, col 90 of module M: 2",
        "|line 5, col 23 to line 5, col 55 of module M: 2:14",
        "||line 5, col 23 to line 5, col 37 of module M: 2:4",
        "|||line 5, col 24 to line 5, col 26 of module M: 2",
        "|||line 5, col 31 to line 5, col 36 of module M: 2:6",
        "||line 5, col 44 to line 5, col 55 of module M: 2:2",
        "|||line 5, col 45 to line 5, col 47 of module M: 2",
        "|||line 5, col 52 to line 5, col 54 of module M: 2:4",
        "|line 5, col 60 to line 5, col 90 of module M: 2",
      ],
    ],
    [
      "an interval and a set of functions, which fails to normalize",
      "Cardinality((1..2) \\cup [{1} -> {3, 4}])",
      [
        "line 5, col 9 to line 5, col 53 of module M: 0",
        "|line 5, col 14 to line 5, col 53 of module M: 2",
        "||line 5, col 26 to line 5, col 52 of module M: 2",
        "|||line 5, col 27 to line 5, col 30 of module M: 2",
        "|||line 5, col 38 to line 5, col 52 of module M: 2:4",
        "||||line 5, col 39 to line 5, col 41 of module M: 2",
        "||||line 5, col 46 to line 5, col 51 of module M: 2:6",
      ],
    ],
  ])(
    "charges the conversion Cardinality makes of %s, as TLC's SetCupValue#size enumerates the union and collects it",
    async (_title, size, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = ${size}\n====`,
        "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      );
      expect(lines).toEqual([["line 4, col 9 to line 4, col 13 of module M: 1"], expected]);
    },
  );

  it.each([
    [
      "a set literal sorts it against a filter",
      "{5} \\notin UNION {SUBSET {1}, {n \\in 0..3 : n > 7}}",
      [
        "line 5, col 9 to line 5, col 13 of module M: 2",
        "|line 5, col 9 to line 5, col 9 of module M: 3",
        "line 5, col 18 to line 5, col 27 of module M: 2",
        "line 5, col 32 to line 5, col 82 of module M: 2",
        "|line 5, col 32 to line 5, col 34 of module M: 2:2",
        "|line 5, col 43 to line 5, col 82 of module M: 2",
        "||line 5, col 49 to line 5, col 82 of module M: 2:6",
        "|||line 5, col 50 to line 5, col 59 of module M: 2:4",
        "||||line 5, col 57 to line 5, col 59 of module M: 2",
        "|||line 5, col 62 to line 5, col 81 of module M: 2",
        "||||line 5, col 76 to line 5, col 80 of module M: 8",
        "||||line 5, col 69 to line 5, col 72 of module M: 2",
      ],
    ],
    [
      "it is the left side of =",
      "SUBSET {1} = {{}, {1}}",
      [
        "line 5, col 9 to line 5, col 13 of module M: 2",
        "|line 5, col 9 to line 5, col 9 of module M: 3",
        "line 5, col 18 to line 5, col 27 of module M: 2",
        "line 5, col 32 to line 5, col 53 of module M: 2",
        "|line 5, col 32 to line 5, col 41 of module M: 2:4",
        "||line 5, col 39 to line 5, col 41 of module M: 2",
        "|line 5, col 45 to line 5, col 53 of module M: 2",
      ],
    ],
    [
      "it is the right side of =",
      "{{}, {1}} = SUBSET {1}",
      [
        "line 5, col 9 to line 5, col 13 of module M: 2",
        "|line 5, col 9 to line 5, col 9 of module M: 3",
        "line 5, col 18 to line 5, col 27 of module M: 2",
        "line 5, col 32 to line 5, col 53 of module M: 2",
        "|line 5, col 32 to line 5, col 40 of module M: 2",
        "|line 5, col 44 to line 5, col 53 of module M: 2:4",
        "||line 5, col 51 to line 5, col 53 of module M: 2",
      ],
    ],
    [
      "it is the left side of = twice, which converts it once",
      "LET T == SUBSET {1} IN T = {{}, {1}} /\\ T = {{}, {1}}",
      [
        "line 5, col 9 to line 5, col 13 of module M: 2",
        "|line 5, col 9 to line 5, col 9 of module M: 3",
        "line 5, col 18 to line 5, col 27 of module M: 2",
        "line 5, col 41 to line 5, col 50 of module M: 2:4",
        "|line 5, col 48 to line 5, col 50 of module M: 2",
        "line 5, col 55 to line 5, col 84 of module M: 2",
      ],
    ],
    [
      "it is the right side of = twice, which converts it each time",
      "LET T == SUBSET {1} IN {{}, {1}} = T /\\ {{}, {1}} = T",
      [
        "line 5, col 9 to line 5, col 13 of module M: 2",
        "|line 5, col 9 to line 5, col 9 of module M: 3",
        "line 5, col 18 to line 5, col 27 of module M: 2",
        "line 5, col 41 to line 5, col 50 of module M: 2:8",
        "|line 5, col 48 to line 5, col 50 of module M: 2",
        "line 5, col 55 to line 5, col 84 of module M: 2",
      ],
    ],
    [
      "a set literal sorts it against three sets",
      "LET T == SUBSET {1} IN {T, {{}}, {{1}}, {{}, {1}, {2}}} # {}",
      [
        "line 5, col 9 to line 5, col 13 of module M: 2",
        "|line 5, col 9 to line 5, col 9 of module M: 3",
        "line 5, col 18 to line 5, col 27 of module M: 2",
        "line 5, col 41 to line 5, col 50 of module M: 2:12",
        "|line 5, col 48 to line 5, col 50 of module M: 2",
        "line 5, col 55 to line 5, col 91 of module M: 2",
      ],
    ],
    [
      "a set literal that fails to sort holds it",
      "x \\in {SUBSET {1}, {{}}, 1}",
      [
        "line 5, col 9 to line 5, col 13 of module M: 2",
        "line 5, col 18 to line 5, col 27 of module M: 0",
        "|line 5, col 23 to line 5, col 27 of module M: 2",
        "line 5, col 32 to line 5, col 58 of module M: 2",
        "|line 5, col 32 to line 5, col 32 of module M: 2",
        "|line 5, col 38 to line 5, col 58 of module M: 2",
        "||line 5, col 39 to line 5, col 48 of module M: 2:4",
        "|||line 5, col 46 to line 5, col 48 of module M: 2",
        "||line 5, col 51 to line 5, col 54 of module M: 2",
      ],
    ],
    [
      "membership in an unsorted set literal compares it",
      "SUBSET {1} \\in {SUBSET {2}, {{}}}",
      [
        "line 5, col 9 to line 5, col 13 of module M: 1",
        "line 5, col 18 to line 5, col 27 of module M: 0",
        "|line 5, col 23 to line 5, col 27 of module M: 1",
        "line 5, col 32 to line 5, col 64 of module M: 1",
        "|line 5, col 32 to line 5, col 41 of module M: 1:2",
        "||line 5, col 39 to line 5, col 41 of module M: 1",
        "|line 5, col 47 to line 5, col 64 of module M: 1",
      ],
    ],
    [
      "PrintT prints it",
      "PrintT(SUBSET {1})",
      [
        "line 5, col 9 to line 5, col 13 of module M: 2",
        "|line 5, col 9 to line 5, col 9 of module M: 3",
        "line 5, col 18 to line 5, col 27 of module M: 2",
        "line 5, col 32 to line 5, col 49 of module M: 2",
        "|line 5, col 39 to line 5, col 48 of module M: 2:4",
        "||line 5, col 46 to line 5, col 48 of module M: 2",
      ],
    ],
    [
      "an error message prints it",
      "{{}, {x}} \\in SUBSET (SUBSET (SUBSET {1}))",
      [
        "line 5, col 9 to line 5, col 13 of module M: 2",
        "line 5, col 18 to line 5, col 27 of module M: 0",
        "|line 5, col 23 to line 5, col 27 of module M: 2",
        "line 5, col 32 to line 5, col 73 of module M: 2",
        "|line 5, col 32 to line 5, col 40 of module M: 2:4",
        "||line 5, col 33 to line 5, col 34 of module M: 2:2",
        "||line 5, col 37 to line 5, col 39 of module M: 2:2",
        "|||line 5, col 38 to line 5, col 38 of module M: 2",
        "|line 5, col 46 to line 5, col 73 of module M: 2",
        "||line 5, col 54 to line 5, col 72 of module M: 2",
        "|||line 5, col 62 to line 5, col 71 of module M: 2:4",
        "||||line 5, col 69 to line 5, col 71 of module M: 2",
      ],
    ],
    [
      "a filter only enumerates it",
      "{s \\in SUBSET {1, 2} : Cardinality(s) = 1} = {{1}, {2}}",
      [
        "line 5, col 9 to line 5, col 13 of module M: 2",
        "|line 5, col 9 to line 5, col 9 of module M: 3",
        "line 5, col 18 to line 5, col 27 of module M: 2",
        "line 5, col 32 to line 5, col 86 of module M: 2",
        "|line 5, col 32 to line 5, col 73 of module M: 2:12",
        "||line 5, col 55 to line 5, col 72 of module M: 8",
        "||line 5, col 39 to line 5, col 51 of module M: 2",
        "|line 5, col 77 to line 5, col 86 of module M: 2",
      ],
    ],
  ])(
    "charges the subsets SUBSET S collects when %s, as TLC's SubsetValue#toSetEnum does",
    async (_title, condition, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1 /\\ ${condition}\n====`,
        "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      );
      expect(lines?.at(-1)).toEqual(expected);
    },
  );

  it("charges the subsets SUBSET S collects when a state holds it, as TLC's SubsetValue#fingerPrint converts it", async () => {
    const lines = await getCoverageLines(
      "---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nVARIABLE x, y\nInit == x = 0 /\\ y = {}\nNext == x < 2 /\\ x' = x + 1 /\\ y' = SUBSET {1, 2}\n====",
      "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
    );
    expect(lines?.at(-1)).toEqual([
      "line 5, col 9 to line 5, col 13 of module M: 2",
      "|line 5, col 9 to line 5, col 9 of module M: 3",
      "line 5, col 18 to line 5, col 27 of module M: 2",
      "line 5, col 32 to line 5, col 49 of module M: 2",
      "|line 5, col 37 to line 5, col 49 of module M: 2:8",
      "||line 5, col 44 to line 5, col 49 of module M: 2",
    ]);
  });

  it.each([
    [
      "its body follows one argument",
      "VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ [i \\in 0..2 |-> x' = x + i][IF x = 0 THEN 1 ELSE 2]",
      [
        "line 5, col 9 to line 5, col 13 of module M: 2",
        "|line 5, col 9 to line 5, col 9 of module M: 3",
        "line 5, col 18 to line 5, col 68 of module M: 2",
      ],
    ],
    [
      "it is recursive",
      "VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ (LET g[n \\in 0..2] == IF n = 0 THEN x' = x + 1 ELSE g[n - 1] IN g[x])",
      [
        "line 5, col 9 to line 5, col 13 of module M: 2",
        "|line 5, col 9 to line 5, col 9 of module M: 3",
        "line 5, col 82 to line 5, col 82 of module M: 2",
        "|line 5, col 23 to line 5, col 77 of module M: 2",
        "||line 5, col 43 to line 5, col 47 of module M: 3",
        "||line 5, col 54 to line 5, col 63 of module M: 2",
        "||line 5, col 70 to line 5, col 77 of module M: 1",
        "||line 5, col 31 to line 5, col 34 of module M: 2",
        "line 5, col 84 to line 5, col 84 of module M: 2",
      ],
    ],
    [
      "a definition names it",
      "VARIABLE x\nInit == x = 0\nF == [i \\in 0..2 |-> x' = x + i]\nNext == x < 2 /\\ F[IF x = 0 THEN 1 ELSE 2]",
      [
        "line 6, col 9 to line 6, col 13 of module M: 2",
        "|line 6, col 9 to line 6, col 9 of module M: 3",
        "line 6, col 18 to line 6, col 42 of module M: 2",
      ],
    ],
  ])(
    "counts the body of a lazy function applied as an action when %s at the function's node, as TLC's Tool#getNextStates passes the body its cost model",
    async (_title, body, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Integers\n${body}\n====`,
        "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      );
      expect(lines?.at(-1)).toEqual(expected);
    },
  );

  it.each([
    [
      "the initial predicate applies it, as TLC's Tool#getInitStates does",
      "VARIABLE x\nInit == [n \\in Nat |-> x = n + 1][1]\nNext == x < 3 /\\ x' = x + 1\nInv == TRUE",
      0,
      [
        "line 4, col 9 to line 4, col 36 of module M: 3",
        "|line 4, col 9 to line 4, col 33 of module M: 1",
      ],
    ],
    [
      "ENABLED applies it, as TLC's Tool#enabled does",
      "VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1\nInv == ENABLED [n \\in Nat |-> x' = n + x][1]",
      -1,
      [
        "line 6, col 8 to line 6, col 44 of module M: 3",
        "|line 6, col 16 to line 6, col 44 of module M: 9",
        "||line 6, col 16 to line 6, col 41 of module M: 3",
      ],
    ],
  ])(
    "counts the body of a lazy function at the application's node when %s",
    async (_title, body, relation, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Integers\n${body}\n====`,
        "INIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
      );
      expect(lines?.at(relation)).toEqual(expected);
    },
  );

  it.each([
    [
      "one argument",
      "VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ [s \\in SUBSET {1, 2} |-> x' = x + Cardinality(s)][IF x = 0 THEN {1} ELSE {1, 2}]",
      [
        "line 5, col 9 to line 5, col 13 of module M: 2",
        "|line 5, col 9 to line 5, col 9 of module M: 3",
        "line 5, col 18 to line 5, col 66 of module M: 2",
        "line 5, col 68 to line 5, col 96 of module M: 2",
        "|line 5, col 71 to line 5, col 75 of module M: 2",
        "|line 5, col 82 to line 5, col 84 of module M: 1:2",
        "|line 5, col 91 to line 5, col 96 of module M: 1:3",
      ],
    ],
    [
      "two arguments",
      "VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ [s \\in SUBSET {1, 2}, j \\in 1..2 |-> x' = x + Cardinality(s) + j][{1}, 1]",
      [
        "line 5, col 9 to line 5, col 13 of module M: 1",
        "|line 5, col 9 to line 5, col 9 of module M: 2",
        "line 5, col 18 to line 5, col 82 of module M: 1",
        "line 5, col 18 to line 5, col 90 of module M: 1",
        "|line 5, col 84 to line 5, col 86 of module M: 1:2",
      ],
    ],
  ])(
    "charges the domain check of a lazy function over SUBSET applied as an action to %s, as TLC's Tool#getFcnContext asks the domain's member",
    async (_title, body, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Integers, FiniteSets\n${body}\n====`,
        "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      );
      expect(lines?.at(-1)).toEqual(expected);
    },
  );

  it.each([
    [
      "an IF picks an argument of a lazy function",
      "VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1 + [i \\in 0..2, j \\in 1..2 |-> i][IF x = 0 THEN x ELSE x - 1, 1]",
      [
        "line 5, col 9 to line 5, col 13 of module M: 2",
        "|line 5, col 9 to line 5, col 9 of module M: 3",
        "line 5, col 18 to line 5, col 91 of module M: 2",
        "|line 5, col 23 to line 5, col 91 of module M: 2",
        "||line 5, col 23 to line 5, col 27 of module M: 2",
        "||line 5, col 31 to line 5, col 91 of module M: 2",
        "|||line 5, col 31 to line 5, col 60 of module M: 2",
        "|||line 5, col 31 to line 5, col 91 of module M: 2",
        "||||line 5, col 62 to line 5, col 87 of module M: 2",
        "|||||line 5, col 65 to line 5, col 69 of module M: 2",
        "|||||line 5, col 76 to line 5, col 76 of module M: 1",
        "|||||line 5, col 83 to line 5, col 87 of module M: 1",
      ],
    ],
    [
      "an IF picks an argument of a function a state holds",
      "VARIABLES x, f\nInit == x = 0 /\\ f = [i \\in 0..2, j \\in 1..2 |-> i + j]\nNext == x < 2 /\\ x' = x + f[IF x = 0 THEN x ELSE x - 1, 1] /\\ UNCHANGED f",
      [
        "line 5, col 9 to line 5, col 13 of module M: 2",
        "|line 5, col 9 to line 5, col 9 of module M: 3",
        "line 5, col 18 to line 5, col 58 of module M: 2",
        "|line 5, col 23 to line 5, col 58 of module M: 2",
        "||line 5, col 23 to line 5, col 23 of module M: 2",
        "||line 5, col 27 to line 5, col 58 of module M: 2",
        "|||line 5, col 27 to line 5, col 27 of module M: 2",
        "|||line 5, col 27 to line 5, col 58 of module M: 2",
        "||||line 5, col 29 to line 5, col 54 of module M: 2",
        "|||||line 5, col 32 to line 5, col 36 of module M: 2",
        "|||||line 5, col 43 to line 5, col 43 of module M: 1",
        "|||||line 5, col 50 to line 5, col 54 of module M: 1",
        "line 5, col 63 to line 5, col 73 of module M: 2",
      ],
    ],
    [
      "an argument of a lazy function over SUBSET is charged",
      "VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + [a \\in SUBSET {1, 2}, b \\in {1, 2} |-> Cardinality(a) + b][{1}, 2]",
      [
        "line 5, col 9 to line 5, col 13 of module M: 1",
        "|line 5, col 9 to line 5, col 9 of module M: 2",
        "line 5, col 18 to line 5, col 92 of module M: 1",
        "|line 5, col 23 to line 5, col 92 of module M: 1",
        "||line 5, col 23 to line 5, col 23 of module M: 1",
        "||line 5, col 27 to line 5, col 92 of module M: 1",
        "|||line 5, col 27 to line 5, col 84 of module M: 1",
        "|||line 5, col 27 to line 5, col 92 of module M: 1",
        "||||line 5, col 86 to line 5, col 88 of module M: 1:2",
      ],
    ],
    [
      "an IF picks an argument of a lazy function applied as an action",
      "VARIABLE x\nInit == x = 0\nNext == x < 2 /\\ [i \\in 0..2, j \\in 1..2 |-> x' = x + i][IF x = 0 THEN x + 1 ELSE x, 1]",
      [
        "line 5, col 9 to line 5, col 13 of module M: 2",
        "|line 5, col 9 to line 5, col 9 of module M: 3",
        "line 5, col 18 to line 5, col 56 of module M: 2",
        "line 5, col 18 to line 5, col 87 of module M: 2",
        "|line 5, col 58 to line 5, col 83 of module M: 2",
        "||line 5, col 61 to line 5, col 65 of module M: 2",
        "||line 5, col 72 to line 5, col 76 of module M: 1",
        "||line 5, col 83 to line 5, col 83 of module M: 1",
      ],
    ],
  ])(
    "counts the arguments of an application when %s as a tuple at the application's location, as TLC evaluates SANY's $Tuple",
    async (_title, body, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Integers, FiniteSets\n${body}\n====`,
        "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      );
      expect(lines?.at(-1)).toEqual(expected);
    },
  );

  it("charges a filter of a set of records or functions per element it draws, as TLC's SetPredValue does", async () => {
    const lines = await getCoverageLines(
      "---- MODULE E ----\nEXTENDS Integers\nVARIABLE x\nInit == x \\in {r \\in [a : 0..1, b : BOOLEAN] : r.a = 0}\nNext == x' \\in {r \\in [a : 0..1, b : BOOLEAN] : r.b = ~x.b}\nInv1 == \\E r \\in {s \\in [a : 0..1, b : BOOLEAN] : s.a = x.a} : r = x\nInv2 == (CHOOSE r \\in {s \\in [a : 0..1, b : BOOLEAN] : s.b = x.b} : TRUE).b = x.b\nInv3 == \\A r \\in {s \\in {f \\in [{1} -> {0, 1}] : f[1] >= x.a} : s[1] > 0} : r[1] = 1\n====",
      "INIT Init\nNEXT Next\nINVARIANT Inv1\nINVARIANT Inv2\nINVARIANT Inv3",
    );
    expect(lines).toEqual([
      [
        "line 4, col 9 to line 4, col 55 of module E: 2",
        "|line 4, col 15 to line 4, col 55 of module E: 1:4",
        "||line 4, col 48 to line 4, col 54 of module E: 4",
        "||line 4, col 22 to line 4, col 44 of module E: 1:8",
        "|||line 4, col 23 to line 4, col 30 of module E: 1",
        "|||line 4, col 33 to line 4, col 43 of module E: 1",
      ],
      [
        "line 5, col 9 to line 5, col 59 of module E: 8",
        "|line 5, col 16 to line 5, col 59 of module E: 4:16",
        "||line 5, col 49 to line 5, col 58 of module E: 16",
        "||line 5, col 23 to line 5, col 45 of module E: 4:32",
        "|||line 5, col 24 to line 5, col 31 of module E: 4",
        "|||line 5, col 34 to line 5, col 44 of module E: 4",
      ],
      [
        "line 6, col 9 to line 6, col 68 of module E: 4",
        "|line 6, col 64 to line 6, col 68 of module E: 6",
        "|line 6, col 18 to line 6, col 60 of module E: 4:34",
        "||line 6, col 51 to line 6, col 59 of module E: 16",
        "||line 6, col 25 to line 6, col 47 of module E: 4:32",
        "|||line 6, col 26 to line 6, col 33 of module E: 4",
        "|||line 6, col 36 to line 6, col 46 of module E: 4",
      ],
      [
        "line 7, col 9 to line 7, col 81 of module E: 4",
        "|line 7, col 9 to line 7, col 75 of module E: 4",
        "||line 7, col 10 to line 7, col 72 of module E: 4",
        "|||line 7, col 69 to line 7, col 72 of module E: 4",
        "|||line 7, col 23 to line 7, col 65 of module E: 4:28",
        "||||line 7, col 56 to line 7, col 64 of module E: 16",
        "||||line 7, col 30 to line 7, col 52 of module E: 4:32",
        "|||||line 7, col 31 to line 7, col 38 of module E: 4",
        "|||||line 7, col 41 to line 7, col 51 of module E: 4",
        "|line 7, col 79 to line 7, col 81 of module E: 4",
      ],
      [
        "line 8, col 9 to line 8, col 84 of module E: 4",
        "|line 8, col 77 to line 8, col 84 of module E: 4",
        "|line 8, col 18 to line 8, col 73 of module E: 4:18",
        "||line 8, col 65 to line 8, col 72 of module E: 6",
        "||line 8, col 25 to line 8, col 61 of module E: 4:8",
        "|||line 8, col 50 to line 8, col 60 of module E: 8",
        "|||line 8, col 32 to line 8, col 46 of module E: 4:8",
        "||||line 8, col 33 to line 8, col 35 of module E: 4",
        "||||line 8, col 40 to line 8, col 45 of module E: 4:12",
      ],
    ]);
  });

  it("charges a set on the left of \\subseteq per element it draws until one is missing, as TLC's EnumerableValue#isSubsetEq does", async () => {
    const lines = await getCoverageLines(
      "---- MODULE E ----\nEXTENDS Integers\nVARIABLE x\nInit == x \\in 0..2\nNext == x' = (x + 1) % 3\nInv == {0, 1} \\subseteq {x, 0, 1} /\\ ({0, 2} \\subseteq {x} \\/ TRUE)\n====",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    );
    expect(lines?.[2]).toEqual([
      "line 6, col 8 to line 6, col 67 of module E: 3",
      "|line 6, col 8 to line 6, col 33 of module E: 3",
      "||line 6, col 8 to line 6, col 13 of module E: 3:9",
      "||line 6, col 25 to line 6, col 33 of module E: 3",
      "|line 6, col 39 to line 6, col 66 of module E: 3",
      "||line 6, col 39 to line 6, col 58 of module E: 3",
      "|||line 6, col 39 to line 6, col 44 of module E: 3:4",
      "|||line 6, col 56 to line 6, col 58 of module E: 3",
      "||line 6, col 63 to line 6, col 66 of module E: 3",
    ]);
  });

  it("charges SUBSET for each element drawn from a subset it gives, as TLC's SubsetValue gives each subset its cost model", async () => {
    const lines = await getCoverageLines(
      "---- MODULE E ----\nEXTENDS Naturals, FiniteSets\nVARIABLES x, y\nInit == x = 0 /\\ y \\in SUBSET {1, 2} /\\ \\A e \\in y : e > 1\nNext == UNCHANGED <<x, y>>\nInv == Cardinality({s \\in SUBSET {1, 2} : s \\subseteq y}) > 0\n====",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    );
    expect([lines?.[0], lines?.[2]]).toEqual([
      [
        "line 4, col 18 to line 4, col 36 of module E: 2",
        "|line 4, col 24 to line 4, col 36 of module E: 1:7",
        "||line 4, col 31 to line 4, col 36 of module E: 1",
        "line 4, col 41 to line 4, col 58 of module E: 4",
        "|line 4, col 54 to line 4, col 58 of module E: 3",
        "|line 4, col 50 to line 4, col 50 of module E: 4",
      ],
      [
        "line 6, col 8 to line 6, col 61 of module E: 2",
        "|line 6, col 8 to line 6, col 57 of module E: 2",
        "||line 6, col 20 to line 6, col 56 of module E: 2:11",
        "|||line 6, col 43 to line 6, col 55 of module E: 8",
        "|||line 6, col 27 to line 6, col 39 of module E: 2:9",
        "||||line 6, col 34 to line 6, col 39 of module E: 2",
      ],
    ]);
  });

  it("charges each state's set to the expression that built it, as TLC's states keep their own values", async () => {
    const lines = await getCoverageLines(
      "---- MODULE E ----\nEXTENDS Naturals\nVARIABLES x, n\nInit == x = {1, 2} /\\ n = 0\nNext == n < 3 /\\ \\A e \\in x : e > 0 /\\ x' = {1, 2} /\\ n' = n + 1\n====",
      "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
    );
    expect([
      lines?.[0]?.[0],
      lines?.[1]?.find((line) => line.includes("col 45 to line 5")),
    ]).toEqual([
      "line 4, col 9 to line 4, col 18 of module E: 1:3",
      "|||line 5, col 45 to line 5, col 50 of module E: 6:6",
    ]);
  });

  it("charges x' \\subseteq S for each element drawn from a subset it assigns, as TLC's Tool#getNextStates gives the SUBSET its cost model", async () => {
    const lines = await getCoverageLines(
      "---- MODULE E ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = {}\nNext == x' \\subseteq {1, 2} /\\ \\A e \\in x' : e > 1\n====",
      "INIT Init\nNEXT Next",
    );
    expect(lines?.[1]).toEqual([
      "line 5, col 9 to line 5, col 27 of module E: 4:14",
      "|line 5, col 22 to line 5, col 27 of module E: 2",
      "line 5, col 32 to line 5, col 50 of module E: 8",
      "|line 5, col 46 to line 5, col 50 of module E: 6",
      "|line 5, col 41 to line 5, col 42 of module E: 8",
    ]);
  });

  it("counts a LET definition that an action taken out of the LET refers to, as TLC's cost model follows the reference", async () => {
    const lines = await getCoverageLines(
      "---- MODULE E ----\nEXTENDS Naturals\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == \\/ x < 2 /\\ x' = x + 1 /\\ y' = y\n        \\/ LET D == \\E e \\in {0, 1} : x' = e IN D /\\ y' = y\n====",
      "INIT Init\nNEXT Next",
    );
    expect(lines?.[2]).toEqual([
      "line 6, col 39 to line 6, col 44 of module E: 6",
      "line 6, col 30 to line 6, col 35 of module E: 3:9",
      "line 6, col 54 to line 6, col 59 of module E: 6",
    ]);
  });

  it("counts a function definition as a node over its body and domain, as SANY's $RecursiveFcnSpec and $NonRecursiveFcnSpec are in TLC's cost model", async () => {
    const lines = await getCoverageLines(
      "---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\ng[n \\in 0..x] == IF n = 0 THEN 0 ELSE g[n - 1]\nh[n \\in 0..x] == n + x\nL == LET f[n \\in 0..2] == IF n = 0 THEN 0 ELSE f[n - 1]\n         k[n \\in 0..2] == n + x\n     IN f[2] = 0 /\\ k[1] >= 0 /\\ g[x] = 0 /\\ h[0] = x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1\nInv == L\n====",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    );
    expect(lines?.[2]).toEqual([
      "line 11, col 8 to line 11, col 8 of module M: 3",
      "|line 7, col 10 to line 7, col 31 of module M: 3",
      "|line 6, col 10 to line 6, col 55 of module M: 3",
      "||line 6, col 27 to line 6, col 55 of module M: 9",
      "|||line 6, col 30 to line 6, col 34 of module M: 9",
      "|||line 6, col 48 to line 6, col 55 of module M: 6",
      "||line 6, col 18 to line 6, col 21 of module M: 3",
      "|line 8, col 9 to line 8, col 53 of module M: 3",
      "||line 8, col 9 to line 8, col 41 of module M: 3",
      "|||line 8, col 9 to line 8, col 29 of module M: 3",
      "|||line 8, col 34 to line 8, col 41 of module M: 3",
      "||||line 8, col 34 to line 8, col 37 of module M: 3",
      "|||||line 8, col 34 to line 8, col 34 of module M: 3",
      "||||||line 4, col 1 to line 4, col 46 of module M: 3",
      "|||||||line 4, col 18 to line 4, col 46 of module M: 6",
      "||||||||line 4, col 21 to line 4, col 25 of module M: 6",
      "||||||||line 4, col 39 to line 4, col 46 of module M: 3",
      "|||||||line 4, col 9 to line 4, col 12 of module M: 3",
      "|||||line 8, col 36 to line 8, col 36 of module M: 3",
      "||line 8, col 46 to line 8, col 53 of module M: 3",
    ]);
  });

  it("counts a function a LET of the initial predicate defines at each reference, as TLC evaluates its LazyValue there", async () => {
    const lines = await getCoverageLines(
      "---- MODULE M ----\nEXTENDS Naturals, FiniteSets\nVARIABLE x\nInit == LET f[n \\in 0..2] == n + 1 IN x = Cardinality(DOMAIN f)\nNext == UNCHANGED x\n====",
      "INIT Init\nNEXT Next",
    );
    expect(lines?.[0]).toEqual([
      "line 4, col 39 to line 4, col 63 of module M: 1",
      "|line 4, col 43 to line 4, col 63 of module M: 1",
      "||line 4, col 55 to line 4, col 62 of module M: 1",
      "|||line 4, col 62 to line 4, col 62 of module M: 1",
      "||||line 4, col 13 to line 4, col 34 of module M: 1:3",
      "|||||line 4, col 30 to line 4, col 34 of module M: 3",
      "|||||line 4, col 21 to line 4, col 24 of module M: 1",
    ]);
  });

  it("counts a recursive function a LET of the initial predicate defines at each reference, as TLC builds a FcnLambdaValue there", async () => {
    const lines = await getCoverageLines(
      "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == LET f[n \\in 0..2] == IF n = 0 THEN 0 ELSE f[n - 1] + 1 IN x = f[2] + f[1]\nNext == UNCHANGED x\n====",
      "INIT Init\nNEXT Next",
    );
    expect(lines?.[0]).toEqual([
      "line 4, col 67 to line 4, col 81 of module M: 1",
      "|line 4, col 71 to line 4, col 81 of module M: 1",
      "||line 4, col 71 to line 4, col 74 of module M: 1",
      "|||line 4, col 71 to line 4, col 71 of module M: 1",
      "||||line 4, col 13 to line 4, col 62 of module M: 1",
      "|||||line 4, col 30 to line 4, col 62 of module M: 3",
      "||||||line 4, col 33 to line 4, col 37 of module M: 3",
      "||||||line 4, col 51 to line 4, col 62 of module M: 2",
      "|||||line 4, col 21 to line 4, col 24 of module M: 1",
      "||line 4, col 78 to line 4, col 81 of module M: 1",
      "|||line 4, col 78 to line 4, col 78 of module M: 1",
      "||||line 4, col 13 to line 4, col 62 of module M: 1",
      "|||||line 4, col 30 to line 4, col 62 of module M: 2",
      "||||||line 4, col 33 to line 4, col 37 of module M: 2",
      "||||||line 4, col 51 to line 4, col 62 of module M: 1",
      "|||||line 4, col 21 to line 4, col 24 of module M: 1",
    ]);
  });

  it("counts a definition a LET of the next-state relation makes at each reference, as TLC's getNextStates conses no LazyValue", async () => {
    const lines = await getCoverageLines(
      "---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == LET v == {n * x : n \\in 0..1}\n        IN /\\ x < 2\n           /\\ x' = x + 1\n           /\\ x = 0 => v # {}\n           /\\ v = v\n====",
      "INIT Init\nNEXT Next",
    );
    expect(lines?.[1]).toEqual([
      "line 6, col 15 to line 6, col 19 of module M: 6",
      "|line 6, col 15 to line 6, col 15 of module M: 7",
      "line 7, col 15 to line 7, col 24 of module M: 6",
      "line 8, col 15 to line 8, col 29 of module M: 6",
      "|line 8, col 15 to line 8, col 19 of module M: 6",
      "|line 8, col 24 to line 8, col 29 of module M: 3",
      "||line 8, col 24 to line 8, col 24 of module M: 3",
      "|||line 5, col 18 to line 5, col 37 of module M: 3",
      "||||line 5, col 19 to line 5, col 23 of module M: 6",
      "||||line 5, col 33 to line 5, col 36 of module M: 3",
      "||line 8, col 28 to line 8, col 29 of module M: 3",
      "line 9, col 15 to line 9, col 19 of module M: 6",
      "|line 9, col 15 to line 9, col 15 of module M: 6",
      "||line 5, col 18 to line 5, col 37 of module M: 6",
      "|||line 5, col 19 to line 5, col 23 of module M: 12",
      "|||line 5, col 33 to line 5, col 36 of module M: 6",
      "|line 9, col 19 to line 9, col 19 of module M: 6",
      "||line 5, col 18 to line 5, col 37 of module M: 6",
      "|||line 5, col 19 to line 5, col 23 of module M: 12",
      "|||line 5, col 33 to line 5, col 36 of module M: 6",
    ]);
  });

  it("builds a function a LET of the next-state relation defines at each reference, so TLC fails to fingerprint a set of it", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, FiniteSets\nVARIABLE x\nInit == x = 1\nNext == LET f[n \\in 0..2] == 10 \\div (n * x) IN x' = f[1] + Cardinality({f})\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect(formatCallStackLines(result)).toEqual([
      "Line 5, column 49 to line 5, column 76 in M",
      "Line 5, column 54 to line 5, column 76 in M",
      "Line 5, column 61 to line 5, column 76 in M",
      "Line 5, column 73 to line 5, column 75 in M",
      "Line 5, column 74 to line 5, column 74 in M",
      "Line 5, column 13 to line 5, column 44 in M",
      "Line 5, column 30 to line 5, column 44 in M",
    ]);
    expect(result.failure?.fingerprint?.reason).toBe("The second argument of \\div is 0.");
  });

  it("builds a function a LET definition of the next-state relation without parameters yields at each reference, so TLC fails to fingerprint a set of it", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, FiniteSets\nVARIABLE x\nInit == x = 1\nNext == LET g == [n \\in 0..2 |-> 10 \\div (n * x)] IN x' = g[1] + Cardinality({g})\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect(formatCallStackLines(result)).toEqual([
      "Line 5, column 54 to line 5, column 81 in M",
      "Line 5, column 59 to line 5, column 81 in M",
      "Line 5, column 66 to line 5, column 81 in M",
      "Line 5, column 78 to line 5, column 80 in M",
      "Line 5, column 79 to line 5, column 79 in M",
      "Line 5, column 18 to line 5, column 49 in M",
      "Line 5, column 34 to line 5, column 48 in M",
    ]);
    expect(result.failure?.fingerprint?.reason).toBe("The second argument of \\div is 0.");
  });

  it("builds a function a LET of the initial predicate yields at each reference when it replays the failure, as TLC's CallStackTool does", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, FiniteSets\nVARIABLE x\nInit == LET g == [n \\in 0..2 |-> 10 \\div n] IN x = g[1] + Cardinality({g})\nNext == UNCHANGED x\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect(formatCallStackLines(result)).toEqual([
      "Line 4, column 9 to line 4, column 74 in M",
      "Line 4, column 48 to line 4, column 74 in M",
      "Line 4, column 52 to line 4, column 74 in M",
      "Line 4, column 59 to line 4, column 74 in M",
      "Line 4, column 71 to line 4, column 73 in M",
      "Line 4, column 72 to line 4, column 72 in M",
      "Line 4, column 18 to line 4, column 43 in M",
      "Line 4, column 34 to line 4, column 42 in M",
    ]);
    expect(result.failure?.fingerprint?.reason).toBe("The second argument of \\div is 0.");
  });

  const checkConvertedLazy = async (init: string, next: string) => {
    const lines: string[] = [];
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLES x, f\nInit == ${init}\nNext == ${next}\n====`,
      config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      onPrint: (text) => lines.push(text),
    });
    return [lines, result.failure?.traceOutput];
  };

  it("applies a lazy function an operator argument holds again at each reference when it replays a failure, as TLC's CallStackTool copies each FcnLambdaValue it evaluates", async () => {
    expect(
      await checkConvertedLazy(
        "x = 0 /\\ f = 0",
        `x < 1 /\\ x' = 1 /\\ f' = 0 /\\ LET Op(g) == g = [s \\in {{}, {1}} |-> TRUE] /\\ PrintT(g[{}]) /\\ 1 = "a" IN Op([s \\in SUBSET {1} |-> PrintT(s)])`,
      ),
    ).toEqual([
      ["{}", "{1}", "TRUE"],
      ["{}", "{1}", "{}", "TRUE"],
    ]);
  });

  it.each([
    [
      "a state",
      "x = 0 /\\ f = [s \\in SUBSET {1} |-> PrintT(s)]",
      "x < 1 /\\ x' = 1 /\\ f' = f /\\ PrintT([f EXCEPT ![{1}] = FALSE][{}])",
      ["{}", "{1}", "TRUE"],
      undefined,
    ],
    [
      "an operator argument",
      "x = 0 /\\ f = 0",
      "x < 1 /\\ x' = 1 /\\ f' = 0 /\\ LET Op(h) == h = [s \\in {{}, {1}} |-> TRUE] /\\ PrintT([h EXCEPT ![{1}] = ~@][{1}]) IN Op([s \\in SUBSET {1} |-> PrintT(s)])",
      ["{}", "{1}", "FALSE"],
      undefined,
    ],
    [
      "an operator argument of a failing step",
      "x = 0 /\\ f = 0",
      `x < 1 /\\ x' = 1 /\\ f' = 0 /\\ LET Op(h) == h = [s \\in {{}, {1}} |-> TRUE] /\\ PrintT([h EXCEPT ![{1}] = ~@][{1}]) /\\ 1 = "a" IN Op([s \\in SUBSET {1} |-> PrintT(s)])`,
      ["{}", "{1}", "FALSE"],
      ["{}", "{1}", "{1}", "FALSE"],
    ],
  ])(
    "takes an EXCEPT of the lazy function %s holds on the record its conversion built, as TLC's FcnLambdaValue#takeExcept does",
    async (_holder, init, next, printed, traceOutput) => {
      expect(await checkConvertedLazy(init, next)).toEqual([printed, traceOutput]);
    },
  );

  it.each([
    [
      "an operator argument",
      "x < 1 /\\ f' = 0 /\\ LET Op(g) == g = [s \\in {{}, {1}} |-> s = {}] /\\ g[{}] /\\ x' = 1 IN Op([s \\in SUBSET {1} |-> PrintT(s) /\\ s = {}])",
      undefined,
    ],
    [
      "a bound variable",
      "x < 1 /\\ f' = 0 /\\ \\E g \\in {[s \\in SUBSET {1} |-> PrintT(s) /\\ s = {}]} : g = [s \\in {{}, {1}} |-> s = {}] /\\ g[{}] /\\ x' = 1",
      undefined,
    ],
    [
      "an operator argument of a failing step",
      `x < 1 /\\ f' = 0 /\\ LET Op(g) == g = [s \\in {{}, {1}} |-> s = {}] /\\ g[{}] /\\ x' = 1 /\\ 1 = "a" IN Op([s \\in SUBSET {1} |-> PrintT(s) /\\ s = {}])`,
      ["{}", "{1}", "{}"],
    ],
  ])(
    "applies the record a conversion built of the lazy function %s holds as an action, as TLC's getNextStates does",
    async (_holder, next, traceOutput) => {
      expect(await checkConvertedLazy("x = 0 /\\ f = 0", next)).toEqual([
        ["{}", "{1}"],
        traceOutput,
      ]);
    },
  );

  it.each([
    [
      "a step",
      "x < 1 /\\ f' = 0 /\\ (IF PrintT(\"e\") THEN <<TRUE>> ELSE 0)[1] /\\ x' = 1",
      undefined,
    ],
    [
      "a failing step",
      `x < 1 /\\ f' = 0 /\\ (IF PrintT("e") THEN <<TRUE>> ELSE 0)[1] /\\ x' = 1 /\\ 1 = "a"`,
      ['"e"'],
    ],
  ])(
    "evaluates the function %s applies as an action once, as TLC's getNextStates does",
    async (_step, next, traceOutput) => {
      expect(await checkConvertedLazy("x = 0 /\\ f = 0", next)).toEqual([['"e"'], traceOutput]);
    },
  );

  it.each([
    [
      "a state",
      "x = 0 /\\ f = [s \\in {{}, {1}} |-> s = {}]",
      "x < 1 /\\ f' = f /\\ f[{}] /\\ x' = 1",
      [
        "line 5, col 9 to line 5, col 13 of module M: 1",
        "|line 5, col 9 to line 5, col 9 of module M: 2",
        "line 5, col 18 to line 5, col 23 of module M: 1",
        "line 5, col 28 to line 5, col 32 of module M: 1",
        "line 5, col 37 to line 5, col 42 of module M: 1",
      ],
    ],
    [
      "a bound identifier",
      "x = 0 /\\ f = 0",
      "x < 1 /\\ f' = 0 /\\ \\E g \\in {[s \\in {{}, {1}} |-> s = {}]} : g[{}] /\\ x' = 1",
      [
        "line 5, col 9 to line 5, col 13 of module M: 1",
        "|line 5, col 9 to line 5, col 9 of module M: 2",
        "line 5, col 18 to line 5, col 23 of module M: 1",
        "line 5, col 70 to line 5, col 84 of module M: 1",
        "line 5, col 37 to line 5, col 66 of module M: 1:2",
        "|line 5, col 38 to line 5, col 65 of module M: 1:2",
        "||line 5, col 59 to line 5, col 64 of module M: 2",
        "||line 5, col 45 to line 5, col 53 of module M: 1:3",
        "|||line 5, col 46 to line 5, col 47 of module M: 1",
        "|||line 5, col 50 to line 5, col 52 of module M: 1",
      ],
    ],
  ])(
    "counts the function %s holds and its argument once as an action applies it, as TLC's getNextStates does",
    async (_holder, init, next, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Integers\nVARIABLES x, f\nInit == ${init}\nNext == ${next}\n====`,
        "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      );
      expect(lines?.at(-1)).toEqual(expected);
    },
  );

  it.each([
    [
      "a function compared with a tuple",
      "x = 0 /\\ f = 0",
      "x < 1 /\\ f' = 0 /\\ \\E g \\in {[i \\in 1..2 |-> i = 1]} : g = <<TRUE, FALSE>> /\\ x' = 1",
      [
        "line 5, col 9 to line 5, col 13 of module M: 1",
        "|line 5, col 9 to line 5, col 9 of module M: 2",
        "line 5, col 18 to line 5, col 23 of module M: 1",
        "line 5, col 64 to line 5, col 82 of module M: 2",
        "|line 5, col 64 to line 5, col 64 of module M: 1",
        "|line 5, col 68 to line 5, col 82 of module M: 1:2",
        "||line 5, col 70 to line 5, col 73 of module M: 1",
        "||line 5, col 76 to line 5, col 80 of module M: 1",
        "line 5, col 87 to line 5, col 92 of module M: 1",
        "line 5, col 37 to line 5, col 60 of module M: 1:2",
        "|line 5, col 38 to line 5, col 59 of module M: 1:2",
        "||line 5, col 54 to line 5, col 58 of module M: 2",
        "||line 5, col 45 to line 5, col 48 of module M: 1",
      ],
    ],
    [
      "a function compared with a record",
      "x = 0 /\\ f = 0",
      'x < 1 /\\ f\' = 0 /\\ \\E g \\in {[s \\in {"a", "b"} |-> s = "a"]} : g = [a |-> TRUE, b |-> FALSE] /\\ x\' = 1',
      [
        "line 5, col 9 to line 5, col 13 of module M: 1",
        "|line 5, col 9 to line 5, col 9 of module M: 2",
        "line 5, col 18 to line 5, col 23 of module M: 1",
        "line 5, col 72 to line 5, col 100 of module M: 2",
        "|line 5, col 72 to line 5, col 72 of module M: 1",
        "|line 5, col 76 to line 5, col 100 of module M: 1:2",
        "||line 5, col 77 to line 5, col 86 of module M: 1",
        "||line 5, col 89 to line 5, col 99 of module M: 1",
        "line 5, col 105 to line 5, col 110 of module M: 1",
        "line 5, col 37 to line 5, col 68 of module M: 1:2",
        "|line 5, col 38 to line 5, col 67 of module M: 1:2",
        "||line 5, col 60 to line 5, col 66 of module M: 2",
        "||line 5, col 45 to line 5, col 54 of module M: 1:3",
      ],
    ],
    [
      "a tuple compared with a function over a set other than 1..n",
      "x = 0 /\\ f = 0",
      "x < 1 /\\ f' = 0 /\\ \\E g \\in {<<TRUE>>} : g # [i \\in {2} |-> TRUE] /\\ x' = 1",
      [
        "line 5, col 9 to line 5, col 13 of module M: 1",
        "|line 5, col 9 to line 5, col 9 of module M: 2",
        "line 5, col 18 to line 5, col 23 of module M: 1",
        "line 5, col 50 to line 5, col 73 of module M: 2",
        "|line 5, col 50 to line 5, col 50 of module M: 1",
        "|line 5, col 54 to line 5, col 73 of module M: 1:1",
        "||line 5, col 69 to line 5, col 72 of module M: 1",
        "||line 5, col 61 to line 5, col 63 of module M: 1:2",
        "line 5, col 78 to line 5, col 83 of module M: 1",
        "line 5, col 37 to line 5, col 46 of module M: 1:2",
        "|line 5, col 38 to line 5, col 45 of module M: 1:1",
        "||line 5, col 40 to line 5, col 43 of module M: 1",
      ],
    ],
    [
      "a tuple compared with a function over a set of 1..n",
      "x = 0 /\\ f = 0",
      "x < 1 /\\ f' = 0 /\\ x' = 1 /\\ <<1, 2>> = [i \\in {1, 2} |-> i]",
      [
        "line 5, col 9 to line 5, col 13 of module M: 1",
        "|line 5, col 9 to line 5, col 9 of module M: 2",
        "line 5, col 18 to line 5, col 23 of module M: 1",
        "line 5, col 28 to line 5, col 33 of module M: 1",
        "line 5, col 38 to line 5, col 68 of module M: 1",
        "|line 5, col 38 to line 5, col 45 of module M: 1",
        "|line 5, col 49 to line 5, col 68 of module M: 1:4",
        "||line 5, col 67 to line 5, col 67 of module M: 2",
        "||line 5, col 56 to line 5, col 61 of module M: 1:3",
      ],
    ],
    [
      "a record compared with a function over strings",
      "x = 0 /\\ f = 0",
      'x < 1 /\\ f\' = 0 /\\ x\' = 1 /\\ [a |-> 1] # [s \\in {"a", "b"} |-> 1]',
      [
        "line 5, col 9 to line 5, col 13 of module M: 1",
        "|line 5, col 9 to line 5, col 9 of module M: 2",
        "line 5, col 18 to line 5, col 23 of module M: 1",
        "line 5, col 28 to line 5, col 33 of module M: 1",
        "line 5, col 38 to line 5, col 73 of module M: 1",
        "|line 5, col 38 to line 5, col 46 of module M: 1",
        "|line 5, col 50 to line 5, col 73 of module M: 1:4",
        "||line 5, col 57 to line 5, col 66 of module M: 1:3",
      ],
    ],
    [
      "an assigned variable compared with a tuple",
      "x = 0 /\\ f = 0",
      "x < 1 /\\ f' = [i \\in 1..2 |-> i] /\\ f' = <<1, 2>> /\\ x' = 1",
      [
        "line 5, col 9 to line 5, col 13 of module M: 1",
        "|line 5, col 9 to line 5, col 9 of module M: 2",
        "line 5, col 18 to line 5, col 40 of module M: 1",
        "|line 5, col 23 to line 5, col 40 of module M: 1:2",
        "||line 5, col 39 to line 5, col 39 of module M: 2",
        "||line 5, col 30 to line 5, col 33 of module M: 1",
        "line 5, col 45 to line 5, col 57 of module M: 1",
        "|line 5, col 50 to line 5, col 57 of module M: 1:2",
        "line 5, col 62 to line 5, col 67 of module M: 1",
      ],
    ],
    [
      "an unchanged function compared with its assigned tuple",
      "x = 0 /\\ f = [i \\in 1..2 |-> i]",
      "x < 1 /\\ f' = <<1, 2>> /\\ UNCHANGED f /\\ x' = 1",
      [
        "line 5, col 9 to line 5, col 13 of module M: 1",
        "|line 5, col 9 to line 5, col 9 of module M: 2",
        "line 5, col 18 to line 5, col 30 of module M: 1",
        "|line 5, col 23 to line 5, col 30 of module M: 1:2",
        "line 5, col 35 to line 5, col 45 of module M: 1",
        "line 5, col 50 to line 5, col 55 of module M: 1",
      ],
    ],
  ])(
    "charges what TLC's equals converts its length under -coverage, for %s",
    async (_compared, init, next, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Integers\nVARIABLES x, f\nInit == ${init}\nNext == ${next}\n====`,
        "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      );
      expect(lines?.at(-1)).toEqual(expected);
    },
  );

  it.each([
    [
      "an action's \\E over a set of records",
      "x' = x /\\ \\E r \\in [a : {t \\in (1..2) \\X {0} : TRUE}, b : {t \\in SUBSET {1} : TRUE}] : FALSE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "|line 5, col 14 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 100 of module M: 1",
        "|line 5, col 96 to line 5, col 100 of module M: 4",
        "|line 5, col 28 to line 5, col 92 of module M: 1:17",
        "||line 5, col 33 to line 5, col 60 of module M: 1:3",
        "|||line 5, col 56 to line 5, col 59 of module M: 3",
        "|||line 5, col 40 to line 5, col 52 of module M: 1:6",
        "||||line 5, col 41 to line 5, col 44 of module M: 1",
        "||||line 5, col 50 to line 5, col 52 of module M: 1:8",
        "||line 5, col 67 to line 5, col 91 of module M: 1:6",
        "|||line 5, col 87 to line 5, col 90 of module M: 6",
        "|||line 5, col 74 to line 5, col 83 of module M: 1",
      ],
    ],
    [
      "an action's \\E over a set of pairs",
      "x' = x /\\ \\E p \\in {t \\in (1..2) \\X {0} : TRUE} \\X {t \\in SUBSET {1} : TRUE} : FALSE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "|line 5, col 14 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 92 of module M: 1",
        "|line 5, col 88 to line 5, col 92 of module M: 4",
        "|line 5, col 28 to line 5, col 84 of module M: 1:17",
        "||line 5, col 28 to line 5, col 55 of module M: 1:3",
        "|||line 5, col 51 to line 5, col 54 of module M: 3",
        "|||line 5, col 35 to line 5, col 47 of module M: 1:6",
        "||||line 5, col 36 to line 5, col 39 of module M: 1",
        "||||line 5, col 45 to line 5, col 47 of module M: 1:8",
        "||line 5, col 60 to line 5, col 84 of module M: 1:6",
        "|||line 5, col 80 to line 5, col 83 of module M: 6",
        "|||line 5, col 67 to line 5, col 76 of module M: 1",
      ],
    ],
    [
      "an action's \\E over pairs whose second set is a set of records",
      "x' = x /\\ \\E p \\in {t \\in (1..2) \\X {0} : TRUE} \\X [a : {t \\in SUBSET {1} : TRUE}] : FALSE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "|line 5, col 14 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 98 of module M: 1",
        "|line 5, col 94 to line 5, col 98 of module M: 4",
        "|line 5, col 28 to line 5, col 90 of module M: 1:17",
        "||line 5, col 28 to line 5, col 55 of module M: 1:3",
        "|||line 5, col 51 to line 5, col 54 of module M: 3",
        "|||line 5, col 35 to line 5, col 47 of module M: 1:6",
        "||||line 5, col 36 to line 5, col 39 of module M: 1",
        "||||line 5, col 45 to line 5, col 47 of module M: 1:8",
        "||line 5, col 60 to line 5, col 90 of module M: 1:5",
        "|||line 5, col 65 to line 5, col 89 of module M: 1:8",
        "||||line 5, col 85 to line 5, col 88 of module M: 8",
        "||||line 5, col 72 to line 5, col 81 of module M: 1",
      ],
    ],
    [
      "a set map",
      "x' = x /\\ {r.a : r \\in [a : {t \\in (1..2) \\X {0} : TRUE}, b : {t \\in SUBSET {1} : TRUE}]} = {}",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "|line 5, col 14 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 102 of module M: 1",
        "|line 5, col 19 to line 5, col 97 of module M: 1",
        "||line 5, col 20 to line 5, col 22 of module M: 4",
        "||line 5, col 32 to line 5, col 96 of module M: 1:17",
        "|||line 5, col 37 to line 5, col 64 of module M: 1:3",
        "||||line 5, col 60 to line 5, col 63 of module M: 3",
        "||||line 5, col 44 to line 5, col 56 of module M: 1:6",
        "|||||line 5, col 45 to line 5, col 48 of module M: 1",
        "|||||line 5, col 54 to line 5, col 56 of module M: 1:8",
        "|||line 5, col 71 to line 5, col 95 of module M: 1:6",
        "||||line 5, col 91 to line 5, col 94 of module M: 6",
        "||||line 5, col 78 to line 5, col 87 of module M: 1",
        "|line 5, col 101 to line 5, col 102 of module M: 1",
      ],
    ],
    [
      "CHOOSE",
      "x' = x /\\ (CHOOSE r \\in [a : {t \\in (1..2) \\X {0} : TRUE}, b : {t \\in SUBSET {1} : TRUE}] : r.b = {1}).a = <<1, 0>>",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 123 of module M: 1",
        "|line 5, col 19 to line 5, col 112 of module M: 1",
        "||line 5, col 20 to line 5, col 109 of module M: 1",
        "|||line 5, col 101 to line 5, col 109 of module M: 2",
        "|||line 5, col 33 to line 5, col 97 of module M: 1:14",
        "||||line 5, col 38 to line 5, col 65 of module M: 1:3",
        "|||||line 5, col 61 to line 5, col 64 of module M: 3",
        "|||||line 5, col 45 to line 5, col 57 of module M: 1:6",
        "||||||line 5, col 46 to line 5, col 49 of module M: 1",
        "||||||line 5, col 55 to line 5, col 57 of module M: 1:8",
        "||||line 5, col 72 to line 5, col 96 of module M: 1:6",
        "|||||line 5, col 92 to line 5, col 95 of module M: 6",
        "|||||line 5, col 79 to line 5, col 88 of module M: 1",
        "|line 5, col 116 to line 5, col 123 of module M: 1",
      ],
    ],
  ])(
    "charges a product of two filters as TLC's enumerator drains it under -coverage, for %s",
    async (_site, next, expected) => {
      expect(await getNextCoverageLines(next)).toEqual(expected);
    },
  );

  it.each([
    [
      "\\E over filters that share an element",
      "x' = x /\\ \\E s \\in {t \\in (1..2) \\X {0} : TRUE} \\cup {t \\in (1..3) \\X {0} : TRUE} : FALSE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "|line 5, col 14 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 97 of module M: 1",
        "|line 5, col 93 to line 5, col 97 of module M: 3",
        "|line 5, col 28 to line 5, col 89 of module M: 1:15",
        "||line 5, col 28 to line 5, col 55 of module M: 1:2",
        "|||line 5, col 51 to line 5, col 54 of module M: 2",
        "|||line 5, col 35 to line 5, col 47 of module M: 1:4",
        "||||line 5, col 36 to line 5, col 39 of module M: 1",
        "||||line 5, col 45 to line 5, col 47 of module M: 1:5",
        "||line 5, col 62 to line 5, col 89 of module M: 1:3",
        "|||line 5, col 85 to line 5, col 88 of module M: 3",
        "|||line 5, col 69 to line 5, col 81 of module M: 1:6",
        "||||line 5, col 70 to line 5, col 73 of module M: 1",
        "||||line 5, col 79 to line 5, col 81 of module M: 1:7",
      ],
    ],
    [
      "CHOOSE",
      "x' = x /\\ (CHOOSE s \\in {t \\in (1..2) \\X {0} : TRUE} \\cup {t \\in (2..3) \\X {0} : TRUE} : s[1] = 3) = <<3, 0>>",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 117 of module M: 1",
        "|line 5, col 20 to line 5, col 105 of module M: 1",
        "||line 5, col 98 to line 5, col 105 of module M: 3",
        "||line 5, col 33 to line 5, col 94 of module M: 1:12",
        "|||line 5, col 33 to line 5, col 60 of module M: 1:2",
        "||||line 5, col 56 to line 5, col 59 of module M: 2",
        "||||line 5, col 40 to line 5, col 52 of module M: 1:4",
        "|||||line 5, col 41 to line 5, col 44 of module M: 1",
        "|||||line 5, col 50 to line 5, col 52 of module M: 1:5",
        "|||line 5, col 67 to line 5, col 94 of module M: 1:2",
        "||||line 5, col 90 to line 5, col 93 of module M: 2",
        "||||line 5, col 74 to line 5, col 86 of module M: 1:4",
        "|||||line 5, col 75 to line 5, col 78 of module M: 1",
        "|||||line 5, col 84 to line 5, col 86 of module M: 1:5",
        "|line 5, col 110 to line 5, col 117 of module M: 1",
      ],
    ],
    [
      "a filter and a set literal",
      "x' = x /\\ \\E s \\in {t \\in (1..2) \\X {0} : TRUE} \\cup {<<5, 0>>} : FALSE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "|line 5, col 14 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 79 of module M: 1",
        "|line 5, col 75 to line 5, col 79 of module M: 3",
        "|line 5, col 28 to line 5, col 71 of module M: 1",
        "||line 5, col 28 to line 5, col 55 of module M: 1:2",
        "|||line 5, col 51 to line 5, col 54 of module M: 2",
        "|||line 5, col 35 to line 5, col 47 of module M: 1:4",
        "||||line 5, col 36 to line 5, col 39 of module M: 1",
        "||||line 5, col 45 to line 5, col 47 of module M: 1:5",
        "||line 5, col 62 to line 5, col 71 of module M: 1:15",
        "|||line 5, col 63 to line 5, col 70 of module M: 1",
      ],
    ],
    [
      "function sets",
      "x' = x /\\ \\E s \\in [{1, 2} -> {t \\in (1..2) \\X {0} : TRUE}] \\cup [{1} -> {t \\in SUBSET {1} : TRUE}] : FALSE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "|line 5, col 14 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 115 of module M: 1",
        "|line 5, col 111 to line 5, col 115 of module M: 6",
        "|line 5, col 28 to line 5, col 107 of module M: 1:20",
        "||line 5, col 28 to line 5, col 67 of module M: 1:8",
        "|||line 5, col 29 to line 5, col 34 of module M: 1",
        "|||line 5, col 39 to line 5, col 66 of module M: 1:8",
        "||||line 5, col 62 to line 5, col 65 of module M: 8",
        "||||line 5, col 46 to line 5, col 58 of module M: 1:16",
        "|||||line 5, col 47 to line 5, col 50 of module M: 1",
        "|||||line 5, col 56 to line 5, col 58 of module M: 1:21",
        "||line 5, col 74 to line 5, col 107 of module M: 1:2",
        "|||line 5, col 75 to line 5, col 77 of module M: 1",
        "|||line 5, col 82 to line 5, col 106 of module M: 1:3",
        "||||line 5, col 102 to line 5, col 105 of module M: 3",
        "||||line 5, col 89 to line 5, col 98 of module M: 1",
      ],
    ],
    [
      "a field of a set of records",
      "x' = x /\\ \\E r \\in [a : {t \\in (1..2) \\X {0} : TRUE} \\cup {t \\in (2..3) \\X {0} : TRUE}, b : {t \\in SUBSET {1} : TRUE}] : FALSE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "|line 5, col 14 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 134 of module M: 1",
        "|line 5, col 130 to line 5, col 134 of module M: 6",
        "|line 5, col 28 to line 5, col 126 of module M: 1:31",
        "||line 5, col 33 to line 5, col 94 of module M: 1:6",
        "|||line 5, col 33 to line 5, col 60 of module M: 1:3",
        "||||line 5, col 56 to line 5, col 59 of module M: 3",
        "||||line 5, col 40 to line 5, col 52 of module M: 1:6",
        "|||||line 5, col 41 to line 5, col 44 of module M: 1",
        "|||||line 5, col 50 to line 5, col 52 of module M: 1:8",
        "|||line 5, col 67 to line 5, col 94 of module M: 1:2",
        "||||line 5, col 90 to line 5, col 93 of module M: 2",
        "||||line 5, col 74 to line 5, col 86 of module M: 1:4",
        "|||||line 5, col 75 to line 5, col 78 of module M: 1",
        "|||||line 5, col 84 to line 5, col 86 of module M: 1:6",
        "||line 5, col 101 to line 5, col 125 of module M: 1:10",
        "|||line 5, col 121 to line 5, col 124 of module M: 10",
        "|||line 5, col 108 to line 5, col 117 of module M: 1",
      ],
    ],
    [
      "the range of a function set",
      "x' = x /\\ \\E f \\in [{1, 2} -> {t \\in (0..1) \\X {0} : TRUE} \\cup {<<7, 0>>}] : FALSE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "|line 5, col 14 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 91 of module M: 1",
        "|line 5, col 87 to line 5, col 91 of module M: 9",
        "|line 5, col 28 to line 5, col 83 of module M: 1:37",
        "||line 5, col 29 to line 5, col 34 of module M: 1",
        "||line 5, col 39 to line 5, col 82 of module M: 1",
        "|||line 5, col 39 to line 5, col 66 of module M: 1:8",
        "||||line 5, col 62 to line 5, col 65 of module M: 8",
        "||||line 5, col 46 to line 5, col 58 of module M: 1:16",
        "|||||line 5, col 47 to line 5, col 50 of module M: 1",
        "|||||line 5, col 56 to line 5, col 58 of module M: 1:22",
        "|||line 5, col 73 to line 5, col 82 of module M: 1:36",
        "||||line 5, col 74 to line 5, col 81 of module M: 1",
      ],
    ],
  ])(
    "charges S \\cup T as TLC's enumerator drains it under -coverage, for %s",
    async (_site, next, expected) => {
      expect(await getNextCoverageLines(next)).toEqual(expected);
    },
  );

  it.each([
    [
      "\\cap of sets of records",
      "x' = x /\\ \\E s \\in [a : {t \\in (1..2) \\X {0} : TRUE}] \\cap [a : {t \\in (1..3) \\X {0} : t[1] > 1}] : FALSE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "|line 5, col 14 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 113 of module M: 1",
        "|line 5, col 109 to line 5, col 113 of module M: 1",
        "|line 5, col 28 to line 5, col 105 of module M: 1",
        "||line 5, col 28 to line 5, col 61 of module M: 1:2",
        "|||line 5, col 33 to line 5, col 60 of module M: 1:3",
        "||||line 5, col 56 to line 5, col 59 of module M: 3",
        "||||line 5, col 40 to line 5, col 52 of module M: 1:6",
        "|||||line 5, col 41 to line 5, col 44 of module M: 1",
        "|||||line 5, col 50 to line 5, col 52 of module M: 1:8",
        "||line 5, col 68 to line 5, col 105 of module M: 1",
      ],
    ],
    [
      "\\ of sets of records",
      "x' = x /\\ \\E s \\in [a : {t \\in (1..3) \\X {0} : TRUE}] \\ [a : {t \\in (1..2) \\X {0} : TRUE}] : FALSE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "|line 5, col 14 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 106 of module M: 1",
        "|line 5, col 102 to line 5, col 106 of module M: 1",
        "|line 5, col 28 to line 5, col 98 of module M: 1",
        "||line 5, col 28 to line 5, col 61 of module M: 1:3",
        "|||line 5, col 33 to line 5, col 60 of module M: 1:4",
        "||||line 5, col 56 to line 5, col 59 of module M: 4",
        "||||line 5, col 40 to line 5, col 52 of module M: 1:8",
        "|||||line 5, col 41 to line 5, col 44 of module M: 1",
        "|||||line 5, col 50 to line 5, col 52 of module M: 1:10",
        "||line 5, col 65 to line 5, col 98 of module M: 1",
      ],
    ],
    [
      "a field of a set of records",
      "x' = x /\\ \\E r \\in [a : {t \\in (1..3) \\X {0} : TRUE} \\cap {t \\in (2..4) \\X {0} : TRUE}, b : {t \\in SUBSET {1} : TRUE}] : FALSE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "|line 5, col 14 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 134 of module M: 1",
        "|line 5, col 130 to line 5, col 134 of module M: 4",
        "|line 5, col 28 to line 5, col 126 of module M: 1:17",
        "||line 5, col 33 to line 5, col 94 of module M: 1",
        "|||line 5, col 33 to line 5, col 60 of module M: 1:5",
        "||||line 5, col 56 to line 5, col 59 of module M: 5",
        "||||line 5, col 40 to line 5, col 52 of module M: 1:10",
        "|||||line 5, col 41 to line 5, col 44 of module M: 1",
        "|||||line 5, col 50 to line 5, col 52 of module M: 1:12",
        "|||line 5, col 67 to line 5, col 94 of module M: 1",
        "||line 5, col 101 to line 5, col 125 of module M: 1:6",
        "|||line 5, col 121 to line 5, col 124 of module M: 6",
        "|||line 5, col 108 to line 5, col 117 of module M: 1",
      ],
    ],
    [
      "membership in SUBSET S",
      "x' = x /\\ \\E s \\in {t \\in SUBSET {1, 2} : TRUE} \\cap SUBSET {1} : FALSE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "|line 5, col 14 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 79 of module M: 1",
        "|line 5, col 75 to line 5, col 79 of module M: 2",
        "|line 5, col 28 to line 5, col 71 of module M: 1",
        "||line 5, col 28 to line 5, col 55 of module M: 1:4",
        "|||line 5, col 51 to line 5, col 54 of module M: 4",
        "|||line 5, col 35 to line 5, col 47 of module M: 1:6",
        "||||line 5, col 42 to line 5, col 47 of module M: 1",
        "||line 5, col 62 to line 5, col 71 of module M: 1",
      ],
    ],
    [
      "a side of S \\cup T",
      "x' = x /\\ \\E s \\in ({t \\in (1..3) \\X {0} : TRUE} \\cap {t \\in (2..4) \\X {0} : TRUE}) \\cup {t \\in (5..6) \\X {0} : TRUE} : FALSE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "|line 5, col 14 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 133 of module M: 1",
        "|line 5, col 129 to line 5, col 133 of module M: 4",
        "|line 5, col 28 to line 5, col 125 of module M: 1:14",
        "||line 5, col 29 to line 5, col 90 of module M: 1",
        "|||line 5, col 29 to line 5, col 56 of module M: 1:3",
        "||||line 5, col 52 to line 5, col 55 of module M: 3",
        "||||line 5, col 36 to line 5, col 48 of module M: 1:6",
        "|||||line 5, col 37 to line 5, col 40 of module M: 1",
        "|||||line 5, col 46 to line 5, col 48 of module M: 1:7",
        "|||line 5, col 63 to line 5, col 90 of module M: 1",
        "||line 5, col 98 to line 5, col 125 of module M: 1:2",
        "|||line 5, col 121 to line 5, col 124 of module M: 2",
        "|||line 5, col 105 to line 5, col 117 of module M: 1:4",
        "||||line 5, col 106 to line 5, col 109 of module M: 1",
        "||||line 5, col 115 to line 5, col 117 of module M: 1:5",
      ],
    ],
    [
      "a factor of S \\X T",
      "x' = x /\\ \\E p \\in ({t \\in (1..3) \\X {0} : TRUE} \\ {t \\in (2..4) \\X {0} : TRUE}) \\X {t \\in SUBSET {1} : TRUE} : FALSE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "|line 5, col 14 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 125 of module M: 1",
        "|line 5, col 121 to line 5, col 125 of module M: 2",
        "|line 5, col 28 to line 5, col 117 of module M: 1:9",
        "||line 5, col 29 to line 5, col 87 of module M: 1",
        "|||line 5, col 29 to line 5, col 56 of module M: 1:4",
        "||||line 5, col 52 to line 5, col 55 of module M: 4",
        "||||line 5, col 36 to line 5, col 48 of module M: 1:8",
        "|||||line 5, col 37 to line 5, col 40 of module M: 1",
        "|||||line 5, col 46 to line 5, col 48 of module M: 1:10",
        "|||line 5, col 60 to line 5, col 87 of module M: 1",
        "||line 5, col 93 to line 5, col 117 of module M: 1:4",
        "|||line 5, col 113 to line 5, col 116 of module M: 4",
        "|||line 5, col 100 to line 5, col 109 of module M: 1",
      ],
    ],
  ])(
    "charges S \\cap T and S \\ T as TLC's enumerator drains them under -coverage, for %s",
    async (_site, next, expected) => {
      expect(await getNextCoverageLines(next)).toEqual(expected);
    },
  );

  it.each([
    [
      "S \\cup T",
      "x' = x /\\ \\E s \\in {t \\in {u \\in (1..2) \\X {0} : TRUE} \\cup {<<5, 0>>} : t[1] > 1} : FALSE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "|line 5, col 14 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 98 of module M: 1",
        "|line 5, col 94 to line 5, col 98 of module M: 2",
        "|line 5, col 28 to line 5, col 90 of module M: 1:8",
        "||line 5, col 82 to line 5, col 89 of module M: 3",
        "||line 5, col 35 to line 5, col 78 of module M: 1",
        "|||line 5, col 35 to line 5, col 62 of module M: 1:2",
        "||||line 5, col 58 to line 5, col 61 of module M: 2",
        "||||line 5, col 42 to line 5, col 54 of module M: 1:4",
        "|||||line 5, col 43 to line 5, col 46 of module M: 1",
        "|||||line 5, col 52 to line 5, col 54 of module M: 1:5",
        "|||line 5, col 69 to line 5, col 78 of module M: 1:8",
        "||||line 5, col 70 to line 5, col 77 of module M: 1",
      ],
    ],
    [
      "a product of a filter",
      "x' = x /\\ \\E s \\in {t \\in {u \\in SUBSET {1, 2} : TRUE} \\X {0} : PrintT(t)} : FALSE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "|line 5, col 14 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 90 of module M: 1",
        "|line 5, col 86 to line 5, col 90 of module M: 4",
        "|line 5, col 28 to line 5, col 82 of module M: 1:13",
        "||line 5, col 73 to line 5, col 81 of module M: 4",
        "||line 5, col 35 to line 5, col 69 of module M: 1:8",
        "|||line 5, col 35 to line 5, col 62 of module M: 1:5",
        "||||line 5, col 58 to line 5, col 61 of module M: 5",
        "||||line 5, col 42 to line 5, col 54 of module M: 1",
        "|||line 5, col 67 to line 5, col 69 of module M: 1:9",
      ],
    ],
    [
      "a set of functions",
      'x\' = x /\\ \\E e \\in {f \\in [{1} -> {t \\in (1..3) \\X {0} : PrintT(t)}] : PrintT(<<"f", f>>)} : FALSE',
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "|line 5, col 14 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 106 of module M: 1",
        "|line 5, col 102 to line 5, col 106 of module M: 3",
        "|line 5, col 28 to line 5, col 98 of module M: 1:10",
        "||line 5, col 80 to line 5, col 97 of module M: 3",
        "||line 5, col 35 to line 5, col 76 of module M: 1:3",
        "|||line 5, col 36 to line 5, col 38 of module M: 1",
        "|||line 5, col 43 to line 5, col 75 of module M: 1:4",
        "||||line 5, col 66 to line 5, col 74 of module M: 4",
        "||||line 5, col 50 to line 5, col 62 of module M: 1:8",
        "|||||line 5, col 51 to line 5, col 54 of module M: 1",
        "|||||line 5, col 60 to line 5, col 62 of module M: 1:10",
      ],
    ],
    [
      "S \\cap T of sets of records",
      "x' = x /\\ \\E s \\in {t \\in [a : {u \\in (1..2) \\X {0} : TRUE}] \\cap [a : {u \\in (1..3) \\X {0} : u[1] > 1}] : TRUE} : FALSE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "|line 5, col 14 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 128 of module M: 1",
        "|line 5, col 124 to line 5, col 128 of module M: 1",
        "|line 5, col 28 to line 5, col 120 of module M: 1:4",
        "||line 5, col 116 to line 5, col 119 of module M: 1",
        "||line 5, col 35 to line 5, col 112 of module M: 1",
        "|||line 5, col 35 to line 5, col 68 of module M: 1:2",
        "||||line 5, col 40 to line 5, col 67 of module M: 1:3",
        "|||||line 5, col 63 to line 5, col 66 of module M: 3",
        "|||||line 5, col 47 to line 5, col 59 of module M: 1:6",
        "||||||line 5, col 48 to line 5, col 51 of module M: 1",
        "||||||line 5, col 57 to line 5, col 59 of module M: 1:8",
        "|||line 5, col 75 to line 5, col 112 of module M: 1",
      ],
    ],
    [
      "a filter of S \\cup T",
      "x' = x /\\ \\E s \\in {t \\in {u \\in {v \\in (1..3) \\X {0} : TRUE} \\cup {<<5, 0>>} : TRUE} : t[1] > 1} : FALSE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "|line 5, col 14 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 113 of module M: 1",
        "|line 5, col 109 to line 5, col 113 of module M: 3",
        "|line 5, col 28 to line 5, col 105 of module M: 1:11",
        "||line 5, col 97 to line 5, col 104 of module M: 4",
        "||line 5, col 35 to line 5, col 93 of module M: 1:4",
        "|||line 5, col 89 to line 5, col 92 of module M: 4",
        "|||line 5, col 42 to line 5, col 85 of module M: 1",
        "||||line 5, col 42 to line 5, col 69 of module M: 1:3",
        "|||||line 5, col 65 to line 5, col 68 of module M: 3",
        "|||||line 5, col 49 to line 5, col 61 of module M: 1:6",
        "||||||line 5, col 50 to line 5, col 53 of module M: 1",
        "||||||line 5, col 59 to line 5, col 61 of module M: 1:7",
        "||||line 5, col 76 to line 5, col 85 of module M: 1:10",
        "|||||line 5, col 77 to line 5, col 84 of module M: 1",
      ],
    ],
    [
      "the range of a set of functions",
      "x' = x /\\ \\E f \\in [{1, 2} -> {t \\in {u \\in (1..2) \\X {0} : TRUE} \\cup {<<5, 0>>} : t[1] > 1}] : FALSE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "|line 5, col 14 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 110 of module M: 1",
        "|line 5, col 106 to line 5, col 110 of module M: 4",
        "|line 5, col 28 to line 5, col 102 of module M: 1:17",
        "||line 5, col 29 to line 5, col 34 of module M: 1",
        "||line 5, col 39 to line 5, col 101 of module M: 1:11",
        "|||line 5, col 93 to line 5, col 100 of module M: 11",
        "|||line 5, col 46 to line 5, col 89 of module M: 1",
        "||||line 5, col 46 to line 5, col 73 of module M: 1:6",
        "|||||line 5, col 69 to line 5, col 72 of module M: 6",
        "|||||line 5, col 53 to line 5, col 65 of module M: 1:12",
        "||||||line 5, col 54 to line 5, col 57 of module M: 1",
        "||||||line 5, col 63 to line 5, col 65 of module M: 1:17",
        "||||line 5, col 80 to line 5, col 89 of module M: 1:28",
        "|||||line 5, col 81 to line 5, col 88 of module M: 1",
      ],
    ],
    [
      "an empty range of a set of functions",
      "x' = x /\\ \\E f \\in [{1} -> {t \\in {u \\in (1..2) \\X {0} : TRUE} \\cup {<<5, 0>>} : t[1] > 9}] : FALSE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "|line 5, col 14 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 107 of module M: 1",
        "|line 5, col 28 to line 5, col 99 of module M: 1:1",
        "||line 5, col 29 to line 5, col 31 of module M: 1",
        "||line 5, col 36 to line 5, col 98 of module M: 1:3",
        "|||line 5, col 90 to line 5, col 97 of module M: 3",
        "|||line 5, col 43 to line 5, col 86 of module M: 1",
        "||||line 5, col 43 to line 5, col 70 of module M: 1:2",
        "|||||line 5, col 66 to line 5, col 69 of module M: 2",
        "|||||line 5, col 50 to line 5, col 62 of module M: 1:4",
        "||||||line 5, col 51 to line 5, col 54 of module M: 1",
        "||||||line 5, col 60 to line 5, col 62 of module M: 1:5",
        "||||line 5, col 77 to line 5, col 86 of module M: 1:8",
        "|||||line 5, col 78 to line 5, col 85 of module M: 1",
      ],
    ],
  ])(
    "charges a filter's set as TLC's enumerator draws it under -coverage, for %s",
    async (_site, next, expected) => {
      expect(await getNextCoverageLines(next)).toEqual(expected);
    },
  );

  it.each([
    [
      "a filter of S \\cup T",
      "x' \\in {t \\in {u \\in (1..3) \\X {0} : TRUE} \\cup {<<5, 0>>} : t[1] > 1}",
      [
        "line 5, col 9 to line 5, col 78 of module M: 12",
        "|line 5, col 16 to line 5, col 78 of module M: 4:16",
        "||line 5, col 70 to line 5, col 77 of module M: 16",
        "||line 5, col 23 to line 5, col 66 of module M: 4",
        "|||line 5, col 23 to line 5, col 50 of module M: 4:12",
        "||||line 5, col 46 to line 5, col 49 of module M: 12",
        "||||line 5, col 30 to line 5, col 42 of module M: 4:24",
        "|||||line 5, col 31 to line 5, col 34 of module M: 4",
        "|||||line 5, col 40 to line 5, col 42 of module M: 4:28",
        "|||line 5, col 57 to line 5, col 66 of module M: 4:40",
        "||||line 5, col 58 to line 5, col 65 of module M: 4",
      ],
    ],
    [
      "S \\cap T of sets of records",
      "x' \\in [a : {u \\in (1..2) \\X {0} : TRUE}] \\cap [a : {u \\in (1..3) \\X {0} : u[1] > 1}]",
      [
        "line 5, col 9 to line 5, col 93 of module M: 2",
        "|line 5, col 16 to line 5, col 93 of module M: 2",
        "||line 5, col 16 to line 5, col 49 of module M: 2:4",
        "|||line 5, col 21 to line 5, col 48 of module M: 2:6",
        "||||line 5, col 44 to line 5, col 47 of module M: 6",
        "||||line 5, col 28 to line 5, col 40 of module M: 2:12",
        "|||||line 5, col 29 to line 5, col 32 of module M: 2",
        "|||||line 5, col 38 to line 5, col 40 of module M: 2:16",
        "||line 5, col 56 to line 5, col 93 of module M: 2",
      ],
    ],
    [
      "a filter of a product of a filter",
      "x' \\in {t \\in {u \\in SUBSET {1, 2} : TRUE} \\X {0} : PrintT(t)}",
      [
        "line 5, col 9 to line 5, col 70 of module M: 20",
        "|line 5, col 16 to line 5, col 70 of module M: 5:20",
        "||line 5, col 61 to line 5, col 69 of module M: 20",
        "||line 5, col 23 to line 5, col 57 of module M: 5:40",
        "|||line 5, col 23 to line 5, col 50 of module M: 5:25",
        "||||line 5, col 46 to line 5, col 49 of module M: 25",
        "||||line 5, col 30 to line 5, col 42 of module M: 5",
        "|||line 5, col 55 to line 5, col 57 of module M: 5:45",
      ],
    ],
  ])(
    "draws x' \\in S through TLC's enumerator under -coverage, for %s",
    async (_site, next, expected) => {
      expect(await getNextCoverageLines(next)).toEqual(expected);
    },
  );

  it.each([
    [
      "S \\cup T of a filter",
      "x' = [t \\in {u \\in (1..3) \\X {0} : u[1] > 1} \\cup {<<5, 0>>} |-> 0]",
      [
        "line 5, col 9 to line 5, col 75 of module M: 2",
        "|line 5, col 14 to line 5, col 75 of module M: 2:6",
        "||line 5, col 21 to line 5, col 68 of module M: 2",
        "|||line 5, col 21 to line 5, col 52 of module M: 2:6",
        "||||line 5, col 44 to line 5, col 51 of module M: 6",
        "||||line 5, col 28 to line 5, col 40 of module M: 2:12",
        "|||||line 5, col 29 to line 5, col 32 of module M: 2",
        "|||||line 5, col 38 to line 5, col 40 of module M: 2:14",
        "|||line 5, col 59 to line 5, col 68 of module M: 2:30",
        "||||line 5, col 60 to line 5, col 67 of module M: 2",
      ],
    ],
    [
      "a filter of S \\cup T",
      "x' = [t \\in {u \\in {v \\in (1..3) \\X {0} : TRUE} \\cup {<<5, 0>>} : u[1] > 1} |-> 0]",
      [
        "line 5, col 9 to line 5, col 90 of module M: 2",
        "|line 5, col 14 to line 5, col 90 of module M: 2:6",
        "||line 5, col 21 to line 5, col 83 of module M: 2:22",
        "|||line 5, col 75 to line 5, col 82 of module M: 8",
        "|||line 5, col 28 to line 5, col 71 of module M: 2",
        "||||line 5, col 28 to line 5, col 55 of module M: 2:6",
        "|||||line 5, col 51 to line 5, col 54 of module M: 6",
        "|||||line 5, col 35 to line 5, col 47 of module M: 2:12",
        "||||||line 5, col 36 to line 5, col 39 of module M: 2",
        "||||||line 5, col 45 to line 5, col 47 of module M: 2:14",
        "||||line 5, col 62 to line 5, col 71 of module M: 2:20",
        "|||||line 5, col 63 to line 5, col 70 of module M: 2",
      ],
    ],
    [
      "S \\cap T of sets of records",
      "x' = [t \\in [a : {u \\in (1..2) \\X {0} : TRUE}] \\cap [a : {u \\in (1..3) \\X {0} : u[1] > 1}] |-> 0]",
      [
        "line 5, col 9 to line 5, col 105 of module M: 2",
        "|line 5, col 14 to line 5, col 105 of module M: 2:2",
        "||line 5, col 21 to line 5, col 98 of module M: 2",
        "|||line 5, col 21 to line 5, col 54 of module M: 2:4",
        "||||line 5, col 26 to line 5, col 53 of module M: 2:6",
        "|||||line 5, col 49 to line 5, col 52 of module M: 6",
        "|||||line 5, col 33 to line 5, col 45 of module M: 2:12",
        "||||||line 5, col 34 to line 5, col 37 of module M: 2",
        "||||||line 5, col 43 to line 5, col 45 of module M: 2:16",
        "|||line 5, col 61 to line 5, col 98 of module M: 2",
      ],
    ],
    [
      "two domains",
      "x' = [s \\in {u \\in 1..2 : u > 0} \\cup {9}, t \\in {v \\in (1..2) \\X {0} : TRUE} \\cup {<<7, 0>>} |-> 0]",
      [
        "line 5, col 9 to line 5, col 108 of module M: 2",
        "|line 5, col 14 to line 5, col 108 of module M: 2:18",
        "||line 5, col 21 to line 5, col 49 of module M: 2",
        "|||line 5, col 21 to line 5, col 40 of module M: 2",
        "||||line 5, col 35 to line 5, col 39 of module M: 4",
        "||||line 5, col 28 to line 5, col 31 of module M: 2",
        "|||line 5, col 47 to line 5, col 49 of module M: 2:4",
        "||line 5, col 58 to line 5, col 101 of module M: 2",
        "|||line 5, col 58 to line 5, col 85 of module M: 2:4",
        "||||line 5, col 81 to line 5, col 84 of module M: 4",
        "||||line 5, col 65 to line 5, col 77 of module M: 2:8",
        "|||||line 5, col 66 to line 5, col 69 of module M: 2",
        "|||||line 5, col 75 to line 5, col 77 of module M: 2:10",
        "|||line 5, col 92 to line 5, col 101 of module M: 2:30",
        "||||line 5, col 93 to line 5, col 100 of module M: 2",
      ],
    ],
  ])(
    "charges a function's domain as TLC's FcnLambdaValue#toFcnRcd converts it under -coverage, for %s",
    async (_site, next, expected) => {
      expect(await getNextCoverageLines(next)).toEqual(expected);
    },
  );

  it.each([
    [
      "S \\cup T in SUBSET S, up to its first element outside",
      "x' = 0 /\\ ({u \\in (1..2) \\X {0} : u[1] > 1} \\cup {<<5, 0>>} \\in SUBSET ((1..3) \\X {0})) \\in BOOLEAN",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 107 of module M: 1",
        "|line 5, col 20 to line 5, col 94 of module M: 1",
        "||line 5, col 20 to line 5, col 67 of module M: 1",
        "|||line 5, col 20 to line 5, col 51 of module M: 1",
        "||||line 5, col 27 to line 5, col 39 of module M: 1",
        "|||||line 5, col 28 to line 5, col 31 of module M: 1",
        "|||||line 5, col 37 to line 5, col 39 of module M: 1:1",
        "|||line 5, col 58 to line 5, col 67 of module M: 1:2",
        "||||line 5, col 59 to line 5, col 66 of module M: 1",
        "||line 5, col 73 to line 5, col 94 of module M: 1",
        "|line 5, col 101 to line 5, col 107 of module M: 1",
      ],
    ],
    [
      "a filter of S \\cup T in SUBSET S",
      "x' = 0 /\\ ({t \\in {u \\in (1..3) \\X {0} : TRUE} \\cup {<<5, 0>>} : t[1] > 1} \\in SUBSET ((1..3) \\X {0})) \\in BOOLEAN",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 122 of module M: 1",
        "|line 5, col 20 to line 5, col 109 of module M: 1",
        "||line 5, col 20 to line 5, col 82 of module M: 1:1",
        "|||line 5, col 74 to line 5, col 81 of module M: 1",
        "|||line 5, col 27 to line 5, col 70 of module M: 1",
        "||||line 5, col 27 to line 5, col 54 of module M: 1",
        "|||||line 5, col 34 to line 5, col 46 of module M: 1",
        "||||||line 5, col 35 to line 5, col 38 of module M: 1",
        "||||||line 5, col 44 to line 5, col 46 of module M: 1:1",
        "||||line 5, col 61 to line 5, col 70 of module M: 1:2",
        "|||||line 5, col 62 to line 5, col 69 of module M: 1",
        "||line 5, col 88 to line 5, col 109 of module M: 1",
        "|line 5, col 116 to line 5, col 122 of module M: 1",
      ],
    ],
    [
      "S \\cap T of sets of records in SUBSET S",
      "x' = 0 /\\ [a : {u \\in (1..2) \\X {0} : TRUE}] \\cap [a : {u \\in (1..3) \\X {0} : u[1] > 1}] \\in SUBSET [a : (1..3) \\X {0}]",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 127 of module M: 1",
        "|line 5, col 19 to line 5, col 96 of module M: 1",
        "||line 5, col 19 to line 5, col 52 of module M: 1:2",
        "|||line 5, col 24 to line 5, col 51 of module M: 1:3",
        "||||line 5, col 47 to line 5, col 50 of module M: 3",
        "||||line 5, col 31 to line 5, col 43 of module M: 1:6",
        "|||||line 5, col 32 to line 5, col 35 of module M: 1",
        "|||||line 5, col 41 to line 5, col 43 of module M: 1:8",
        "||line 5, col 59 to line 5, col 96 of module M: 1",
        "|line 5, col 102 to line 5, col 127 of module M: 1",
      ],
    ],
    [
      "UNION of a filter of SUBSET S without the element",
      "x' = 0 /\\ (7 \\in UNION {s \\in SUBSET {1, 2} : PrintT(s)}) \\in BOOLEAN",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 77 of module M: 1",
        "|line 5, col 20 to line 5, col 64 of module M: 1",
        "||line 5, col 26 to line 5, col 64 of module M: 1",
        "|||line 5, col 32 to line 5, col 64 of module M: 1:4",
        "||||line 5, col 55 to line 5, col 63 of module M: 4",
        "||||line 5, col 39 to line 5, col 51 of module M: 1",
        "|line 5, col 71 to line 5, col 77 of module M: 1",
      ],
    ],
    [
      "UNION of a filter of SUBSET S for each element",
      "x' = 0 /\\ \\A e \\in {1, 2} : e \\in UNION {s \\in SUBSET {1, 2} : PrintT(s)}",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 81 of module M: 1",
        "|line 5, col 37 to line 5, col 81 of module M: 2",
        "||line 5, col 37 to line 5, col 37 of module M: 2",
        "||line 5, col 43 to line 5, col 81 of module M: 2",
        "|||line 5, col 49 to line 5, col 81 of module M: 2:5",
        "||||line 5, col 72 to line 5, col 80 of module M: 5",
        "||||line 5, col 56 to line 5, col 68 of module M: 2",
        "|line 5, col 28 to line 5, col 33 of module M: 1:3",
      ],
    ],
    [
      "a lazy filter in SUBSET S",
      "x' = 0 /\\ ({t \\in (0..2) \\X {1} : PrintT(t)} \\in SUBSET ((1..2) \\X {1})) \\in BOOLEAN",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 92 of module M: 1",
        "|line 5, col 20 to line 5, col 79 of module M: 1",
        "||line 5, col 20 to line 5, col 52 of module M: 1:1",
        "|||line 5, col 43 to line 5, col 51 of module M: 1",
        "|||line 5, col 27 to line 5, col 39 of module M: 1:2",
        "||||line 5, col 28 to line 5, col 31 of module M: 1",
        "||||line 5, col 37 to line 5, col 39 of module M: 1:3",
        "||line 5, col 58 to line 5, col 79 of module M: 1",
        "|line 5, col 86 to line 5, col 92 of module M: 1",
      ],
    ],
  ])(
    "draws a set for SUBSET S and UNION S membership through TLC's enumerator until it decides under -coverage, for %s",
    async (_site, next, expected) => {
      expect(await getNextCoverageLines(next)).toEqual(expected);
    },
  );

  it.each([
    [
      "a non-function",
      "x = 0 /\\ f = 0",
      "x < 1 /\\ f' = 0 /\\ (IF PrintT(\"e\") THEN 0 ELSE 0)[{}] /\\ x' = 1",
      "In computing next states, a non-function (an integer) was applied as a function.\nline 5, col 28 to line 5, col 61 of module M",
    ],
    [
      "a function to a non-boolean",
      "x = 0 /\\ f = [s \\in {{}, {1}} |-> 1]",
      "x < 1 /\\ f' = f /\\ f[{}] /\\ x' = 1",
      "In computing next states, TLC expected a boolean expression,\nbut didn't find one.\nline 5, col 28 to line 5, col 32 of module M",
    ],
  ])(
    "fails on applying %s as an action under -coverage, as TLC's getNextStates does",
    async (_applied, init, next, message) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLES x, f\nInit == ${init}\nNext == ${next}\n====`,
        config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
        coverage: 1,
      });
      expect(result.failure?.message).toBe(`${UNEXPECTED_EXCEPTION}${message}`);
    },
  );

  it("counts the applications of the copy EXCEPT makes of a lazy function, though TLC's FcnLambdaValue#takeExcept drops the cost model", async () => {
    const lines = await getCoverageLines(
      "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == LET f[n \\in 0..2] == 10 \\div (n + 1) IN x = [f EXCEPT ![2] = 0][1]\nNext == UNCHANGED x\n====",
      "INIT Init\nNEXT Next",
    );
    expect(lines?.[0]).toEqual([
      "line 4, col 49 to line 4, col 74 of module M: 1",
      "|line 4, col 53 to line 4, col 74 of module M: 1",
      "||line 4, col 53 to line 4, col 71 of module M: 1",
      "|||line 4, col 54 to line 4, col 54 of module M: 1",
      "||||line 4, col 13 to line 4, col 44 of module M: 1",
      "|||||line 4, col 30 to line 4, col 44 of module M: 2",
      "|||||line 4, col 21 to line 4, col 24 of module M: 1",
    ]);
  });

  it.each([
    [
      "an index",
      "LET f[n \\in 0..2] == 10 \\div (n + 1) IN x = DOMAIN [f EXCEPT ![2] = @ + 1]",
      [
        "line 4, col 49 to line 4, col 82 of module M: 1",
        "|line 4, col 53 to line 4, col 82 of module M: 1",
        "||line 4, col 60 to line 4, col 82 of module M: 1",
        "|||line 4, col 61 to line 4, col 61 of module M: 1",
        "||||line 4, col 13 to line 4, col 44 of module M: 1:3",
        "|||||line 4, col 30 to line 4, col 44 of module M: 3",
        "|||||line 4, col 21 to line 4, col 24 of module M: 1",
        "|||line 4, col 70 to line 4, col 81 of module M: 1",
      ],
    ],
    [
      "an index expression",
      "LET f[n \\in 0..2] == 10 \\div (n + 1) IN x = DOMAIN [f EXCEPT ![1 + 1] = @ + 1]",
      [
        "line 4, col 49 to line 4, col 86 of module M: 1",
        "|line 4, col 53 to line 4, col 86 of module M: 1",
        "||line 4, col 60 to line 4, col 86 of module M: 1",
        "|||line 4, col 61 to line 4, col 61 of module M: 1",
        "||||line 4, col 13 to line 4, col 44 of module M: 1:3",
        "|||||line 4, col 30 to line 4, col 44 of module M: 3",
        "|||||line 4, col 21 to line 4, col 24 of module M: 1",
        "|||line 4, col 70 to line 4, col 85 of module M: 1",
      ],
    ],
    [
      "two indices",
      "LET f[p, q \\in 0..2] == 10 \\div (p + 1) IN x = DOMAIN [f EXCEPT ![1, 2] = @ + 1]",
      [
        "line 4, col 52 to line 4, col 88 of module M: 1",
        "|line 4, col 56 to line 4, col 88 of module M: 1",
        "||line 4, col 63 to line 4, col 88 of module M: 1",
        "|||line 4, col 64 to line 4, col 64 of module M: 1",
        "||||line 4, col 13 to line 4, col 47 of module M: 1:9",
        "|||||line 4, col 33 to line 4, col 47 of module M: 9",
        "|||||line 4, col 24 to line 4, col 27 of module M: 1",
        "|||line 4, col 73 to line 4, col 87 of module M: 1",
      ],
    ],
    [
      "an index outside the domain",
      "x = [[n \\in 0..2 |-> n] EXCEPT ![5 - 1] = @ + 1]",
      [
        "line 4, col 9 to line 4, col 56 of module M: 1",
        "|line 4, col 13 to line 4, col 56 of module M: 1",
        "||line 4, col 14 to line 4, col 31 of module M: 1:3",
        "|||line 4, col 30 to line 4, col 30 of module M: 3",
        "|||line 4, col 21 to line 4, col 24 of module M: 1",
        "||line 4, col 40 to line 4, col 55 of module M: 1",
      ],
    ],
  ])(
    "counts an EXCEPT update with %s at the range of ![k] = e, as SANY locates $Pair and $Seq at the ExceptSpec",
    async (_title, init, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == ${init}\nNext == UNCHANGED x\n====`,
        "INIT Init\nNEXT Next",
      );
      expect(lines?.[0]).toEqual(expected);
    },
  );

  it.each([
    [
      "a module",
      "f[n \\in 0..2] == IF n = 0 THEN x ELSE f[n - 1] + 1\nInit == x = 0\nNext == x < 3 /\\ x' = [f EXCEPT ![2] = 7][1]",
      1,
      [
        "line 6, col 9 to line 6, col 13 of module M: 9",
        "|line 6, col 9 to line 6, col 9 of module M: 10",
        "line 6, col 18 to line 6, col 44 of module M: 9",
        "|line 6, col 23 to line 6, col 44 of module M: 9",
        "||line 6, col 23 to line 6, col 41 of module M: 9",
        "|||line 6, col 24 to line 6, col 24 of module M: 9",
        "||||line 4, col 1 to line 4, col 50 of module M: 9",
        "|||||line 4, col 18 to line 4, col 50 of module M: 45",
        "||||||line 4, col 21 to line 4, col 25 of module M: 45",
        "||||||line 4, col 32 to line 4, col 32 of module M: 18",
        "||||||line 4, col 39 to line 4, col 50 of module M: 27",
        "|||||line 4, col 9 to line 4, col 12 of module M: 9",
      ],
    ],
    [
      "a LET",
      "Init == LET f[n \\in 0..2] == IF n = 0 THEN 0 ELSE f[n - 1] + 1 IN x = [f EXCEPT ![2] = 7][1]\nNext == UNCHANGED x",
      0,
      [
        "line 4, col 67 to line 4, col 92 of module M: 1",
        "|line 4, col 71 to line 4, col 92 of module M: 1",
        "||line 4, col 71 to line 4, col 89 of module M: 1",
        "|||line 4, col 72 to line 4, col 72 of module M: 1",
        "||||line 4, col 13 to line 4, col 62 of module M: 1",
        "|||||line 4, col 30 to line 4, col 62 of module M: 5",
        "||||||line 4, col 33 to line 4, col 37 of module M: 5",
        "||||||line 4, col 51 to line 4, col 62 of module M: 3",
        "|||||line 4, col 21 to line 4, col 24 of module M: 1",
      ],
    ],
  ])(
    "counts the applications of the copy EXCEPT makes of a recursive function of %s, though TLC's FcnLambdaValue#takeExcept drops the copy's cost model",
    async (_name, definitions, relation, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\n${definitions}\n====`,
        "INIT Init\nNEXT Next",
      );
      expect(lines?.[relation]).toEqual(expected);
    },
  );

  it.each([
    [
      "a module",
      "g[n \\in 0..2] == IF n = 0 THEN x ELSE g[n - 1] + 1\nInit == x = 0 /\\ y = <<>>\nNext == x < 2 /\\ x' = x + 1 /\\ y' = <<g>>",
      [
        "line 6, col 9 to line 6, col 13 of module M: 2",
        "|line 6, col 9 to line 6, col 9 of module M: 3",
        "line 6, col 18 to line 6, col 27 of module M: 2",
        "line 6, col 32 to line 6, col 41 of module M: 2",
        "|line 6, col 37 to line 6, col 41 of module M: 2",
        "||line 6, col 39 to line 6, col 39 of module M: 2",
        "|||line 4, col 1 to line 4, col 50 of module M: 2:6",
        "||||line 4, col 18 to line 4, col 50 of module M: 12",
        "|||||line 4, col 21 to line 4, col 25 of module M: 12",
        "|||||line 4, col 32 to line 4, col 32 of module M: 6",
        "|||||line 4, col 39 to line 4, col 50 of module M: 6",
        "||||line 4, col 9 to line 4, col 12 of module M: 2",
      ],
    ],
    [
      "a LET",
      "Init == x = 0 /\\ y = <<>>\nNext == x < 2 /\\ x' = x + 1 /\\ LET g[n \\in 0..2] == IF n = 0 THEN x ELSE g[n - 1] + 1 IN y' = <<g>>",
      [
        "line 5, col 9 to line 5, col 13 of module M: 2",
        "|line 5, col 9 to line 5, col 9 of module M: 3",
        "line 5, col 18 to line 5, col 27 of module M: 2",
        "line 5, col 90 to line 5, col 99 of module M: 2",
        "|line 5, col 95 to line 5, col 99 of module M: 2",
        "||line 5, col 97 to line 5, col 97 of module M: 2",
        "|||line 5, col 36 to line 5, col 85 of module M: 2:6",
        "||||line 5, col 53 to line 5, col 85 of module M: 12",
        "|||||line 5, col 56 to line 5, col 60 of module M: 12",
        "|||||line 5, col 67 to line 5, col 67 of module M: 6",
        "|||||line 5, col 74 to line 5, col 85 of module M: 6",
        "||||line 5, col 44 to line 5, col 47 of module M: 2",
      ],
    ],
  ])(
    "counts the body of a recursive function %s defines when TLC fingerprints a state holding it, as FcnLambdaValue#toFcnRcd evaluates it under the cost model",
    async (_title, definitions, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Naturals\nVARIABLES x, y\n${definitions}\n====`,
        "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      );
      expect(lines?.[1]).toEqual(expected);
    },
  );

  it.each([
    [
      "an EXCEPT copy of it",
      "[g EXCEPT ![1] = 7]",
      [
        "line 6, col 9 to line 6, col 13 of module M: 2",
        "|line 6, col 9 to line 6, col 9 of module M: 3",
        "line 6, col 18 to line 6, col 27 of module M: 2",
        "line 6, col 32 to line 6, col 59 of module M: 2",
        "|line 6, col 37 to line 6, col 59 of module M: 2",
        "||line 6, col 39 to line 6, col 57 of module M: 2",
        "|||line 6, col 40 to line 6, col 40 of module M: 2",
        "||||line 4, col 1 to line 4, col 50 of module M: 2:6",
        "|||||line 4, col 18 to line 4, col 50 of module M: 16",
        "||||||line 4, col 21 to line 4, col 25 of module M: 16",
        "||||||line 4, col 32 to line 4, col 32 of module M: 8",
        "||||||line 4, col 39 to line 4, col 50 of module M: 8",
        "|||||line 4, col 9 to line 4, col 12 of module M: 2",
      ],
    ],
    [
      "a copy of that copy",
      "[[g EXCEPT ![1] = 7] EXCEPT ![2] = 8, ![1] = 9]",
      [
        "line 6, col 9 to line 6, col 13 of module M: 2",
        "|line 6, col 9 to line 6, col 9 of module M: 3",
        "line 6, col 18 to line 6, col 27 of module M: 2",
        "line 6, col 32 to line 6, col 87 of module M: 2",
        "|line 6, col 37 to line 6, col 87 of module M: 2",
        "||line 6, col 39 to line 6, col 85 of module M: 2",
        "|||line 6, col 40 to line 6, col 58 of module M: 2",
        "||||line 6, col 41 to line 6, col 41 of module M: 2",
        "|||||line 4, col 1 to line 4, col 50 of module M: 2:6",
        "||||||line 4, col 18 to line 4, col 50 of module M: 22",
        "|||||||line 4, col 21 to line 4, col 25 of module M: 22",
        "|||||||line 4, col 32 to line 4, col 32 of module M: 10",
        "|||||||line 4, col 39 to line 4, col 50 of module M: 12",
        "||||||line 4, col 9 to line 4, col 12 of module M: 2",
      ],
    ],
  ])(
    "counts the body of a recursive function at the keys %s replaces when TLC fingerprints a state holding the copy, as FcnLambdaValue#toFcnRcd evaluates every key, though TLC's FcnLambdaValue#takeExcept drops the copy's cost model",
    async (_title, copy, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Naturals\nVARIABLES x, y\ng[n \\in 0..2] == IF n = 0 THEN x ELSE g[n - 1] + 1\nInit == x = 0 /\\ y = <<>>\nNext == x < 2 /\\ x' = x + 1 /\\ y' = <<${copy}>>\n====`,
        "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      );
      expect(lines?.[1]).toEqual(expected);
    },
  );

  it("counts the body of a lazy function again where an application takes an EXCEPT that goes deeper, though TLC's FcnLambdaValue#takeExcept drops the copy's cost model", async () => {
    const lines = await getNextCoverageLines(
      "x' = 0 /\\ LET f == [t \\in {u \\in (0..2) \\X {1} : TRUE} |-> [c |-> 0]] IN [f EXCEPT ![<<1, 1>>].c = 5][<<1, 1>>].c = 5",
    );
    expect(lines).toEqual([
      "line 5, col 9 to line 5, col 14 of module M: 1",
      "line 5, col 28 to line 5, col 77 of module M: 1",
      "|line 5, col 68 to line 5, col 76 of module M: 2",
      "|line 5, col 35 to line 5, col 62 of module M: 1",
      "line 5, col 82 to line 5, col 125 of module M: 1",
    ]);
  });

  it.each([
    [
      "a function",
      "[t \\in (0..2) \\X {1} |-> 0][<<7, 1>>] = 0",
      [
        "line 5, col 19 to line 5, col 59 of module M: 2",
        "|line 5, col 19 to line 5, col 55 of module M: 2",
        "||line 5, col 19 to line 5, col 45 of module M: 2:3",
        "|||line 5, col 26 to line 5, col 38 of module M: 2:12",
        "||||line 5, col 27 to line 5, col 30 of module M: 2",
        "||||line 5, col 36 to line 5, col 38 of module M: 2:14",
        "||line 5, col 47 to line 5, col 54 of module M: 2",
      ],
    ],
    [
      "a recursive function",
      "LET f[n \\in {u \\in (0..2) \\X {1} : TRUE}] == 0 IN f[<<7, 1>>] = 0",
      [
        "line 5, col 23 to line 5, col 64 of module M: 2:3",
        "|line 5, col 31 to line 5, col 58 of module M: 2:20",
        "||line 5, col 54 to line 5, col 57 of module M: 6",
        "||line 5, col 38 to line 5, col 50 of module M: 2:12",
        "|||line 5, col 39 to line 5, col 42 of module M: 2",
        "|||line 5, col 48 to line 5, col 50 of module M: 2:14",
        "line 5, col 69 to line 5, col 83 of module M: 2",
      ],
    ],
  ])(
    "charges the domain of %s that TLC prints in its replay for a call stack, though CallStackTool's copy of the FcnLambdaValue drops its cost model",
    async (_name, body, rows) => {
      expect(await getNextCoverageLines(`x' = 0 /\\ ${body}`)).toEqual([
        "line 5, col 9 to line 5, col 14 of module M: 0",
        ...rows,
      ]);
    },
  );

  it.each([
    [
      "a Cartesian product",
      "PrintT((0..2) \\X {1})",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 39 of module M: 1",
        "|line 5, col 26 to line 5, col 38 of module M: 1:9",
        "||line 5, col 27 to line 5, col 30 of module M: 1",
        "||line 5, col 36 to line 5, col 38 of module M: 1:7",
      ],
    ],
    [
      "a set of functions",
      "PrintT([{1, 2} -> {3, 4}])",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 44 of module M: 1",
        "|line 5, col 26 to line 5, col 43 of module M: 1:12",
        "||line 5, col 27 to line 5, col 32 of module M: 1",
        "||line 5, col 37 to line 5, col 42 of module M: 1:10",
      ],
    ],
    [
      "a set of records",
      "PrintT([a : {1, 2}, b : {3}])",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 47 of module M: 1",
        "|line 5, col 26 to line 5, col 46 of module M: 1:6",
        "||line 5, col 27 to line 5, col 36 of module M: 1:3",
        "||line 5, col 39 to line 5, col 45 of module M: 1:5",
      ],
    ],
    [
      "a tuple that holds a Cartesian product",
      "PrintT(<<(0..1) \\X {1}>>)",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 43 of module M: 1",
        "|line 5, col 26 to line 5, col 42 of module M: 1",
        "||line 5, col 28 to line 5, col 40 of module M: 1:6",
        "|||line 5, col 29 to line 5, col 32 of module M: 1",
        "|||line 5, col 38 to line 5, col 40 of module M: 1:5",
      ],
    ],
    [
      "a Cartesian product of a variable",
      "PrintT({x} \\X {1})",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 36 of module M: 1",
        "|line 5, col 26 to line 5, col 35 of module M: 1:3",
        "||line 5, col 26 to line 5, col 28 of module M: 1:2",
        "|||line 5, col 27 to line 5, col 27 of module M: 1",
        "||line 5, col 33 to line 5, col 35 of module M: 1:3",
      ],
    ],
    [
      "a Cartesian product with a variable",
      "PrintT((0..2) \\X {x})",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 39 of module M: 1",
        "|line 5, col 26 to line 5, col 38 of module M: 1:9",
        "||line 5, col 27 to line 5, col 30 of module M: 1",
        "||line 5, col 36 to line 5, col 38 of module M: 1:7",
        "|||line 5, col 37 to line 5, col 37 of module M: 1",
      ],
    ],
    [
      "a union with a Cartesian product",
      "PrintT({<<1, 1>>} \\cup ((0..2) \\X {1}))",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 57 of module M: 1",
        "|line 5, col 26 to line 5, col 56 of module M: 1",
        "||line 5, col 26 to line 5, col 35 of module M: 1:14",
        "|||line 5, col 27 to line 5, col 34 of module M: 1",
        "||line 5, col 43 to line 5, col 55 of module M: 1:6",
        "|||line 5, col 44 to line 5, col 47 of module M: 1",
        "|||line 5, col 53 to line 5, col 55 of module M: 1:7",
      ],
    ],
    [
      "a tuple whose second element is a Cartesian product",
      "PrintT(<<1, (0..2) \\X {1}>>)",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 46 of module M: 1",
        "|line 5, col 26 to line 5, col 45 of module M: 1",
        "||line 5, col 31 to line 5, col 43 of module M: 1:9",
        "|||line 5, col 32 to line 5, col 35 of module M: 1",
        "|||line 5, col 41 to line 5, col 43 of module M: 1:7",
      ],
    ],
    [
      "an Assert message",
      "Assert(FALSE, (0..1) \\X {1})",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "line 5, col 19 to line 5, col 46 of module M: 2",
        "|line 5, col 26 to line 5, col 30 of module M: 2",
        "|line 5, col 33 to line 5, col 45 of module M: 2:12",
        "||line 5, col 34 to line 5, col 37 of module M: 2",
        "||line 5, col 43 to line 5, col 45 of module M: 2:10",
      ],
    ],
  ])(
    "charges %s that TLC prints to the lazy set's own cost model, as its toString converts the set",
    async (_name, body, rows) => {
      expect(await getNextCoverageLines(`x' = 0 /\\ ${body}`)).toEqual(rows);
    },
  );

  it.each([
    [
      "an equality",
      "((0..1) \\X {1}) = {1}",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "line 5, col 19 to line 5, col 39 of module M: 1",
        "|line 5, col 20 to line 5, col 32 of module M: 1:6",
        "||line 5, col 21 to line 5, col 24 of module M: 1",
        "||line 5, col 30 to line 5, col 32 of module M: 1:5",
        "|line 5, col 37 to line 5, col 39 of module M: 1",
      ],
    ],
    [
      "an equality after a print",
      "LET s == (0..1) \\X {1} IN PrintT(s) /\\ s = {}",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "line 5, col 28 to line 5, col 40 of module M: 1:12",
        "|line 5, col 29 to line 5, col 32 of module M: 1",
        "|line 5, col 38 to line 5, col 40 of module M: 1:10",
        "line 5, col 45 to line 5, col 63 of module M: 1",
      ],
    ],
    [
      "an equality of a union before a print",
      "LET s == ((0..1) \\X {1}) \\cup {<<5, 5>>} IN (s = {}) \\/ PrintT(s)",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 58 of module M: 1",
        "|line 5, col 29 to line 5, col 41 of module M: 1:4",
        "||line 5, col 30 to line 5, col 33 of module M: 1",
        "||line 5, col 39 to line 5, col 41 of module M: 1:5",
        "|line 5, col 49 to line 5, col 58 of module M: 1:11",
        "||line 5, col 50 to line 5, col 57 of module M: 1",
        "line 5, col 63 to line 5, col 83 of module M: 1",
      ],
    ],
    [
      "an equality of a union before an enumeration",
      "LET s == ((0..1) \\X {1}) \\cup {<<5, 5>>} IN (s = {}) \\/ \\E u \\in s : PrintT(u)",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 58 of module M: 1",
        "|line 5, col 29 to line 5, col 41 of module M: 1:4",
        "||line 5, col 30 to line 5, col 33 of module M: 1",
        "||line 5, col 39 to line 5, col 41 of module M: 1:5",
        "|line 5, col 49 to line 5, col 58 of module M: 1:13",
        "||line 5, col 50 to line 5, col 57 of module M: 1",
        "line 5, col 63 to line 5, col 96 of module M: 1",
      ],
    ],
    [
      "two cardinalities",
      "LET s == ((0..1) \\X {1}) \\cup {<<5, 5>>} IN Cardinality(s) + Cardinality(s) = 6",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 58 of module M: 1",
        "|line 5, col 29 to line 5, col 41 of module M: 1:4",
        "||line 5, col 30 to line 5, col 33 of module M: 1",
        "||line 5, col 39 to line 5, col 41 of module M: 1:5",
        "|line 5, col 49 to line 5, col 58 of module M: 1:11",
        "||line 5, col 50 to line 5, col 57 of module M: 1",
        "line 5, col 63 to line 5, col 97 of module M: 1",
      ],
    ],
  ])(
    "charges %s of a lazy set to the set's own cost model, which TLC's convertAndCache charges once",
    async (_name, body, rows) => {
      expect(await getNextCoverageLines(`x' = 0 /\\ ${body}`)).toEqual(rows);
    },
  );

  it.each([
    ["once", "Cardinality(s) = 3", "line 5, col 65 to line 5, col 82 of module M: 1"],
    [
      "twice",
      "Cardinality(s) + Cardinality(s) = 6",
      "line 5, col 65 to line 5, col 99 of module M: 1",
    ],
  ])(
    "charges UNION S to its set's cost model when Cardinality sizes it %s, as TLC's UnionValue#size converts with convertAndCache",
    async (_name, body, row) => {
      expect(
        await getNextCoverageLines(
          `x' = 0 /\\ LET s == UNION {{<<5, 5>>}, (0..1) \\X {1}} IN ${body}`,
        ),
      ).toEqual([
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 60 of module M: 1",
        "|line 5, col 34 to line 5, col 60 of module M: 1:10",
        "||line 5, col 35 to line 5, col 44 of module M: 1:2",
        "|||line 5, col 36 to line 5, col 43 of module M: 1",
        "||line 5, col 47 to line 5, col 59 of module M: 1:9",
        "|||line 5, col 48 to line 5, col 51 of module M: 1",
        "|||line 5, col 57 to line 5, col 59 of module M: 1:5",
        row,
      ]);
    },
  );

  it.each([
    [
      "S \\cup T",
      "((0..1) \\X {1}) \\cup {<<5, 5>>}",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 58 of module M: 1",
        "|line 5, col 29 to line 5, col 41 of module M: 1:4",
        "||line 5, col 30 to line 5, col 33 of module M: 1",
        "||line 5, col 39 to line 5, col 41 of module M: 1:5",
        "|line 5, col 49 to line 5, col 58 of module M: 1:11",
        "||line 5, col 50 to line 5, col 57 of module M: 1",
        "line 5, col 63 to line 5, col 91 of module M: 1",
        "|line 5, col 63 to line 5, col 78 of module M: 1",
        "||line 5, col 70 to line 5, col 77 of module M: 1:8",
        "|||line 5, col 77 to line 5, col 77 of module M: 1",
        "|line 5, col 83 to line 5, col 91 of module M: 1",
      ],
    ],
    [
      "UNION S",
      "UNION {{<<5, 5>>}, (0..1) \\X {1}}",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 60 of module M: 1",
        "|line 5, col 34 to line 5, col 60 of module M: 1:10",
        "||line 5, col 35 to line 5, col 44 of module M: 1:2",
        "|||line 5, col 36 to line 5, col 43 of module M: 1",
        "||line 5, col 47 to line 5, col 59 of module M: 1:9",
        "|||line 5, col 48 to line 5, col 51 of module M: 1",
        "|||line 5, col 57 to line 5, col 59 of module M: 1:5",
        "line 5, col 65 to line 5, col 93 of module M: 1",
        "|line 5, col 65 to line 5, col 80 of module M: 1",
        "||line 5, col 72 to line 5, col 79 of module M: 1:8",
        "|||line 5, col 79 to line 5, col 79 of module M: 1",
        "|line 5, col 85 to line 5, col 93 of module M: 1",
      ],
    ],
    [
      "S \\ T",
      "((0..1) \\X {1}) \\ {<<0, 1>>}",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 55 of module M: 1",
        "|line 5, col 29 to line 5, col 41 of module M: 1:4",
        "||line 5, col 30 to line 5, col 33 of module M: 1",
        "||line 5, col 39 to line 5, col 41 of module M: 1:5",
        "|line 5, col 46 to line 5, col 55 of module M: 1",
        "line 5, col 60 to line 5, col 88 of module M: 1",
        "|line 5, col 60 to line 5, col 75 of module M: 1",
        "||line 5, col 67 to line 5, col 74 of module M: 1:2",
        "|||line 5, col 74 to line 5, col 74 of module M: 1",
        "|line 5, col 80 to line 5, col 88 of module M: 1",
      ],
    ],
  ])(
    "charges %s once when TLC prints SUBSET of it and then the set, as SubsetValue#toSetEnum sizes its base with convertAndCache",
    async (_name, set, rows) => {
      expect(
        await getNextCoverageLines(`x' = 0 /\\ LET s == ${set} IN PrintT(SUBSET s) /\\ PrintT(s)`),
      ).toEqual(rows);
    },
  );

  it.each([
    [
      "a print",
      "PrintT([(0..1) \\X {1} -> {3}])",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 48 of module M: 1",
        "|line 5, col 26 to line 5, col 47 of module M: 1:3",
        "||line 5, col 27 to line 5, col 39 of module M: 1:6",
        "|||line 5, col 28 to line 5, col 31 of module M: 1",
        "|||line 5, col 37 to line 5, col 39 of module M: 1:5",
        "||line 5, col 44 to line 5, col 46 of module M: 1:5",
      ],
    ],
    [
      "two prints",
      "LET d == (0..1) \\X {1} IN PrintT([d -> {3}]) /\\ PrintT([d -> {3}])",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 40 of module M: 1:12",
        "|line 5, col 29 to line 5, col 32 of module M: 1",
        "|line 5, col 38 to line 5, col 40 of module M: 1:10",
        "line 5, col 45 to line 5, col 84 of module M: 1",
        "|line 5, col 45 to line 5, col 62 of module M: 1",
        "||line 5, col 52 to line 5, col 61 of module M: 1:3",
        "|||line 5, col 53 to line 5, col 53 of module M: 1",
        "|||line 5, col 58 to line 5, col 60 of module M: 1:5",
        "|line 5, col 67 to line 5, col 84 of module M: 1",
        "||line 5, col 74 to line 5, col 83 of module M: 1:3",
        "|||line 5, col 75 to line 5, col 75 of module M: 1",
        "|||line 5, col 80 to line 5, col 82 of module M: 1:5",
      ],
    ],
    [
      "a print after an equality",
      "LET d == (0..1) \\X {1} IN (d = {}) \\/ PrintT([d -> {3}])",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 40 of module M: 1:6",
        "|line 5, col 29 to line 5, col 32 of module M: 1",
        "|line 5, col 38 to line 5, col 40 of module M: 1:5",
        "line 5, col 45 to line 5, col 74 of module M: 1",
        "|line 5, col 46 to line 5, col 51 of module M: 1",
        "|line 5, col 57 to line 5, col 74 of module M: 1",
        "||line 5, col 64 to line 5, col 73 of module M: 1:3",
        "|||line 5, col 65 to line 5, col 65 of module M: 1",
        "|||line 5, col 70 to line 5, col 72 of module M: 1:5",
      ],
    ],
    [
      "an enumeration",
      "\\E f \\in [(0..1) \\X {1} -> {3, 4}] : PrintT(f)",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 64 of module M: 1",
        "|line 5, col 56 to line 5, col 64 of module M: 1",
        "|line 5, col 28 to line 5, col 52 of module M: 1:14",
        "||line 5, col 29 to line 5, col 41 of module M: 1:6",
        "|||line 5, col 30 to line 5, col 33 of module M: 1",
        "|||line 5, col 39 to line 5, col 41 of module M: 1:5",
        "||line 5, col 46 to line 5, col 51 of module M: 1:10",
      ],
    ],
  ])(
    "charges the Cartesian product that is the domain of a set of functions in %s, as SetOfFcnsValue's enumerator converts the domain with toSetEnum",
    async (_name, body, rows) => {
      expect(await getNextCoverageLines(`x' = 0 /\\ ${body}`)).toEqual(rows);
    },
  );

  it.each([
    [
      "S \\cup T",
      "PrintT(((0..1) \\X {1}) \\cup {<<5, 5>>})",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 57 of module M: 1",
        "|line 5, col 26 to line 5, col 56 of module M: 1",
        "||line 5, col 27 to line 5, col 39 of module M: 1:4",
        "|||line 5, col 28 to line 5, col 31 of module M: 1",
        "|||line 5, col 37 to line 5, col 39 of module M: 1:5",
        "||line 5, col 47 to line 5, col 56 of module M: 1:11",
        "|||line 5, col 48 to line 5, col 55 of module M: 1",
      ],
    ],
    [
      "UNION S",
      "PrintT(UNION {{<<5, 5>>}, (0..1) \\X {1}})",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 59 of module M: 1",
        "|line 5, col 26 to line 5, col 58 of module M: 1",
        "||line 5, col 32 to line 5, col 58 of module M: 1:10",
        "|||line 5, col 33 to line 5, col 42 of module M: 1:2",
        "||||line 5, col 34 to line 5, col 41 of module M: 1",
        "|||line 5, col 45 to line 5, col 57 of module M: 1:9",
        "||||line 5, col 46 to line 5, col 49 of module M: 1",
        "||||line 5, col 55 to line 5, col 57 of module M: 1:5",
      ],
    ],
    [
      "S \\ T",
      "PrintT(((0..1) \\X {1}) \\ {<<0, 1>>})",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 54 of module M: 1",
        "|line 5, col 26 to line 5, col 53 of module M: 1",
        "||line 5, col 27 to line 5, col 39 of module M: 1:4",
        "|||line 5, col 28 to line 5, col 31 of module M: 1",
        "|||line 5, col 37 to line 5, col 39 of module M: 1:5",
        "||line 5, col 44 to line 5, col 53 of module M: 1",
      ],
    ],
    [
      "S \\cap T",
      "PrintT(((0..1) \\X {1}) \\cap ((0..2) \\X {1}))",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 62 of module M: 1",
        "|line 5, col 26 to line 5, col 61 of module M: 1",
        "||line 5, col 27 to line 5, col 39 of module M: 1:4",
        "|||line 5, col 28 to line 5, col 31 of module M: 1",
        "|||line 5, col 37 to line 5, col 39 of module M: 1:5",
        "||line 5, col 48 to line 5, col 60 of module M: 1",
      ],
    ],
    [
      "UNION S with an empty set last",
      "PrintT(UNION {{<<5, 5>>}, (0..1) \\X {1}, {}})",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 63 of module M: 1",
        "|line 5, col 26 to line 5, col 62 of module M: 1",
        "||line 5, col 32 to line 5, col 62 of module M: 1:12",
        "|||line 5, col 33 to line 5, col 42 of module M: 1:2",
        "||||line 5, col 34 to line 5, col 41 of module M: 1",
        "|||line 5, col 45 to line 5, col 57 of module M: 1:9",
        "||||line 5, col 46 to line 5, col 49 of module M: 1",
        "||||line 5, col 55 to line 5, col 57 of module M: 1:5",
        "|||line 5, col 60 to line 5, col 61 of module M: 1:1",
      ],
    ],
    [
      "S \\cup T printed twice",
      "LET s == ((0..1) \\X {1}) \\cup {<<5, 5>>} IN PrintT(s) /\\ PrintT(s)",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 58 of module M: 1",
        "|line 5, col 29 to line 5, col 41 of module M: 1:8",
        "||line 5, col 30 to line 5, col 33 of module M: 1",
        "||line 5, col 39 to line 5, col 41 of module M: 1:10",
        "|line 5, col 49 to line 5, col 58 of module M: 1:22",
        "||line 5, col 50 to line 5, col 57 of module M: 1",
        "line 5, col 63 to line 5, col 84 of module M: 1",
      ],
    ],
  ])(
    "charges the sets that TLC's enumerator of %s draws as it prints the set",
    async (_name, body, rows) => {
      expect(await getNextCoverageLines(`x' = 0 /\\ ${body}`)).toEqual(rows);
    },
  );

  it.each([
    [
      "a function application",
      "LET f == [t \\in {u \\in (0..2) \\X {1} : PrintT(u)} |-> 0] IN f[1] = 0",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "line 5, col 28 to line 5, col 74 of module M: 2",
        "|line 5, col 35 to line 5, col 67 of module M: 2",
        "||line 5, col 42 to line 5, col 54 of module M: 2:18",
        "|||line 5, col 43 to line 5, col 46 of module M: 2",
        "|||line 5, col 52 to line 5, col 54 of module M: 2:14",
        "line 5, col 79 to line 5, col 86 of module M: 2",
      ],
    ],
    [
      "a membership test",
      "(1 \\in {u \\in (0..2) \\X {1} : PrintT(u)})",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "line 5, col 20 to line 5, col 58 of module M: 2",
        "|line 5, col 26 to line 5, col 58 of module M: 2",
        "||line 5, col 33 to line 5, col 45 of module M: 2:18",
        "|||line 5, col 34 to line 5, col 37 of module M: 2",
        "|||line 5, col 43 to line 5, col 45 of module M: 2:14",
      ],
    ],
    [
      "a function comparison",
      "LET f == [t \\in {u \\in (0..2) \\X {1} : PrintT(u)} |-> 0] IN [f EXCEPT ![1] = 5] = f",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "line 5, col 28 to line 5, col 74 of module M: 2",
        "|line 5, col 35 to line 5, col 67 of module M: 2",
        "||line 5, col 42 to line 5, col 54 of module M: 2:18",
        "|||line 5, col 43 to line 5, col 46 of module M: 2",
        "|||line 5, col 52 to line 5, col 54 of module M: 2:14",
        "line 5, col 79 to line 5, col 101 of module M: 2",
      ],
    ],
    [
      "a membership test in a LET set",
      "LET s == {u \\in (0..2) \\X {1} : PrintT(u)} IN 1 \\in s",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "line 5, col 28 to line 5, col 60 of module M: 2",
        "|line 5, col 35 to line 5, col 47 of module M: 2:18",
        "||line 5, col 36 to line 5, col 39 of module M: 2",
        "||line 5, col 45 to line 5, col 47 of module M: 2:14",
        "line 5, col 65 to line 5, col 71 of module M: 2",
      ],
    ],
    [
      "an EXCEPT of the function",
      "LET f == [t \\in {u \\in (0..2) \\X {1} : PrintT(u)} |-> 0] IN [f EXCEPT ![1] = 5][<<1, 1>>] = 0",
      [
        "line 5, col 9 to line 5, col 14 of module M: 0",
        "line 5, col 28 to line 5, col 74 of module M: 2",
        "|line 5, col 35 to line 5, col 67 of module M: 2",
        "||line 5, col 42 to line 5, col 54 of module M: 2:18",
        "|||line 5, col 43 to line 5, col 46 of module M: 2",
        "|||line 5, col 52 to line 5, col 54 of module M: 2:14",
        "line 5, col 79 to line 5, col 111 of module M: 2",
      ],
    ],
  ])(
    "charges the Cartesian product under a filter that TLC prints in the error of %s",
    async (_name, body, rows) => {
      expect(await getNextCoverageLines(`x' = 0 /\\ ${body}`)).toEqual(rows);
    },
  );

  it("charges the base of a SUBSET domain that TLC prints in the error of a function application", async () => {
    expect(
      await getNextCoverageLines(`x' = 0 /\\ [t \\in SUBSET ((0..1) \\X {1}) |-> 0][7] = 0`),
    ).toEqual([
      "line 5, col 9 to line 5, col 14 of module M: 0",
      "line 5, col 19 to line 5, col 61 of module M: 2",
      "|line 5, col 19 to line 5, col 57 of module M: 2",
      "||line 5, col 19 to line 5, col 54 of module M: 2",
      "|||line 5, col 26 to line 5, col 47 of module M: 2:8",
      "||||line 5, col 34 to line 5, col 46 of module M: 2:12",
      "|||||line 5, col 35 to line 5, col 38 of module M: 2",
      "|||||line 5, col 44 to line 5, col 46 of module M: 2:10",
    ]);
  });

  it.each([
    [
      "<<G>> = 1",
      [
        "line 6, col 9 to line 6, col 14 of module M: 0",
        "|line 6, col 14 to line 6, col 14 of module M: 2",
        "line 6, col 19 to line 6, col 27 of module M: 2",
        "|line 6, col 19 to line 6, col 23 of module M: 2:2",
        "||line 6, col 21 to line 6, col 21 of module M: 2",
      ],
    ],
    [
      "\\E y \\in {1} : <<G>> = y",
      [
        "line 6, col 9 to line 6, col 14 of module M: 0",
        "|line 6, col 14 to line 6, col 14 of module M: 2",
        "line 6, col 19 to line 6, col 42 of module M: 2",
        "|line 6, col 34 to line 6, col 42 of module M: 2",
        "||line 6, col 34 to line 6, col 38 of module M: 2:2",
        "|||line 6, col 36 to line 6, col 36 of module M: 2",
        "||line 6, col 42 to line 6, col 42 of module M: 2",
        "|line 6, col 28 to line 6, col 30 of module M: 2:4",
      ],
    ],
  ])(
    "counts nothing for the predicate of a constant filter that the replay of %s prints",
    async (body, rows) => {
      const lines = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nVARIABLE x\nG == {s \\in SUBSET {1} : s = {}}\nInit == x = 0\nNext == x' = x /\\ ${body}\n====`,
        "INIT Init\nNEXT Next",
      );
      expect(lines?.at(-1)).toEqual(rows);
    },
  );

  it("charges each draw of a filter from a converted Cartesian product, as TLC's SetOfTuplesValue enumerates the SetEnumValue it keeps", async () => {
    expect(
      await getNextCoverageLines(
        `x' = 0 /\\ LET t == (0..1) \\X {1} IN (t = {}) \\/ PrintT({u \\in t : TRUE})`,
      ),
    ).toEqual([
      "line 5, col 9 to line 5, col 14 of module M: 1",
      "line 5, col 28 to line 5, col 40 of module M: 1:9",
      "|line 5, col 29 to line 5, col 32 of module M: 1",
      "|line 5, col 38 to line 5, col 40 of module M: 1:5",
      "line 5, col 45 to line 5, col 80 of module M: 1",
      "|line 5, col 46 to line 5, col 51 of module M: 1",
      "|line 5, col 57 to line 5, col 80 of module M: 1",
      "||line 5, col 64 to line 5, col 79 of module M: 1:4",
      "|||line 5, col 75 to line 5, col 78 of module M: 2",
      "|||line 5, col 71 to line 5, col 71 of module M: 1",
    ]);
  });

  it("charges the conversion of a lazy function's EXCEPT copy in the replay, since the copy keeps the cost model that TLC's FcnLambdaValue#takeExcept drops", async () => {
    expect(
      await getNextCoverageLines(
        `x' = 0 /\\ [[t \\in (0..2) \\X {1} |-> 0] EXCEPT ![<<1, 1>>] = 5][<<7, 1>>] = 0`,
      ),
    ).toEqual([
      "line 5, col 9 to line 5, col 14 of module M: 0",
      "line 5, col 19 to line 5, col 84 of module M: 2",
      "|line 5, col 19 to line 5, col 80 of module M: 2",
      "||line 5, col 19 to line 5, col 70 of module M: 2",
      "|||line 5, col 20 to line 5, col 46 of module M: 2:3",
      "||||line 5, col 27 to line 5, col 39 of module M: 2:12",
      "|||||line 5, col 28 to line 5, col 31 of module M: 2",
      "|||||line 5, col 37 to line 5, col 39 of module M: 2:14",
      "|||line 5, col 55 to line 5, col 69 of module M: 2",
      "||line 5, col 72 to line 5, col 79 of module M: 2",
    ]);
  });

  it.each([
    [
      "the cardinality of a product of unions",
      "Cardinality(S \\X S) = 4",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 74 of module M: 1",
        "|line 5, col 34 to line 5, col 74 of module M: 1:12",
        "||line 5, col 35 to line 5, col 58 of module M: 2:14",
        "|||line 5, col 43 to line 5, col 45 of module M: 2:10",
        "||||line 5, col 44 to line 5, col 44 of module M: 2",
        "|||line 5, col 48 to line 5, col 57 of module M: 2",
        "||line 5, col 68 to line 5, col 73 of module M: 1:3",
        "line 5, col 79 to line 5, col 101 of module M: 1",
      ],
    ],
    [
      "the cardinality of a set of functions from a union",
      "Cardinality([S -> {1, 2}]) = 4",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 74 of module M: 1",
        "|line 5, col 34 to line 5, col 74 of module M: 1:10",
        "||line 5, col 35 to line 5, col 58 of module M: 2:12",
        "|||line 5, col 43 to line 5, col 45 of module M: 2:8",
        "||||line 5, col 44 to line 5, col 44 of module M: 2",
        "|||line 5, col 48 to line 5, col 57 of module M: 2",
        "||line 5, col 68 to line 5, col 73 of module M: 1:3",
        "line 5, col 79 to line 5, col 108 of module M: 1",
      ],
    ],
    [
      "the cardinality of the subsets of a union",
      "Cardinality(SUBSET S) = 4",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 74 of module M: 1",
        "|line 5, col 34 to line 5, col 74 of module M: 1:8",
        "||line 5, col 35 to line 5, col 58 of module M: 2:10",
        "|||line 5, col 43 to line 5, col 45 of module M: 2:6",
        "||||line 5, col 44 to line 5, col 44 of module M: 2",
        "|||line 5, col 48 to line 5, col 57 of module M: 2",
        "||line 5, col 68 to line 5, col 73 of module M: 1:3",
        "line 5, col 79 to line 5, col 103 of module M: 1",
      ],
    ],
    [
      "a bound over a set of functions into a union",
      "\\E f \\in [{1} -> S] : TRUE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 74 of module M: 1",
        "|line 5, col 34 to line 5, col 74 of module M: 1:8",
        "||line 5, col 35 to line 5, col 58 of module M: 2:12",
        "|||line 5, col 43 to line 5, col 45 of module M: 2:8",
        "||||line 5, col 44 to line 5, col 44 of module M: 2",
        "|||line 5, col 48 to line 5, col 57 of module M: 2",
        "||line 5, col 68 to line 5, col 73 of module M: 1:3",
        "line 5, col 79 to line 5, col 104 of module M: 1",
        "|line 5, col 101 to line 5, col 104 of module M: 1",
        "|line 5, col 88 to line 5, col 97 of module M: 1:6",
        "||line 5, col 89 to line 5, col 91 of module M: 1",
        "||line 5, col 96 to line 5, col 96 of module M: 1",
      ],
    ],
    [
      "the cardinality of a product of a union that a cardinality converted",
      "Cardinality(S) = 2 /\\ Cardinality(S \\X S) = 4",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 74 of module M: 1",
        "|line 5, col 34 to line 5, col 74 of module M: 1:10",
        "||line 5, col 35 to line 5, col 58 of module M: 2:10",
        "|||line 5, col 43 to line 5, col 45 of module M: 2:6",
        "||||line 5, col 44 to line 5, col 44 of module M: 2",
        "|||line 5, col 48 to line 5, col 57 of module M: 2",
        "||line 5, col 68 to line 5, col 73 of module M: 1:3",
        "line 5, col 79 to line 5, col 123 of module M: 1",
      ],
    ],
    [
      "a bound over a product of a union that a cardinality converted",
      "Cardinality(S) = 2 /\\ \\E t \\in S \\X S : TRUE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 74 of module M: 1",
        "|line 5, col 34 to line 5, col 74 of module M: 1:20",
        "||line 5, col 35 to line 5, col 58 of module M: 2:10",
        "|||line 5, col 43 to line 5, col 45 of module M: 2:6",
        "||||line 5, col 44 to line 5, col 44 of module M: 2",
        "|||line 5, col 48 to line 5, col 57 of module M: 2",
        "||line 5, col 68 to line 5, col 73 of module M: 1:3",
        "line 5, col 79 to line 5, col 122 of module M: 1",
        "|line 5, col 79 to line 5, col 96 of module M: 1",
        "|line 5, col 101 to line 5, col 122 of module M: 1",
        "||line 5, col 119 to line 5, col 122 of module M: 1",
        "||line 5, col 110 to line 5, col 115 of module M: 1:14",
        "|||line 5, col 110 to line 5, col 110 of module M: 1",
        "|||line 5, col 115 to line 5, col 115 of module M: 1",
      ],
    ],
    [
      "a bound over a product of unions",
      "\\E t \\in S \\X S : TRUE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 74 of module M: 1",
        "|line 5, col 34 to line 5, col 74 of module M: 1:24",
        "||line 5, col 35 to line 5, col 58 of module M: 2:24",
        "|||line 5, col 43 to line 5, col 45 of module M: 2:16",
        "||||line 5, col 44 to line 5, col 44 of module M: 2",
        "|||line 5, col 48 to line 5, col 57 of module M: 2",
        "||line 5, col 68 to line 5, col 73 of module M: 1:3",
        "line 5, col 79 to line 5, col 100 of module M: 1",
        "|line 5, col 97 to line 5, col 100 of module M: 1",
        "|line 5, col 88 to line 5, col 93 of module M: 1:14",
        "||line 5, col 88 to line 5, col 88 of module M: 1",
        "||line 5, col 93 to line 5, col 93 of module M: 1",
      ],
    ],
  ])("charges %s to the sets that TLC's size and isEmpty draw", async (_name, body, rows) => {
    expect(
      await getNextCoverageLines(
        `x' = 0 /\\ LET S == UNION {[proc : {p}, idx : 1..1] : p \\in {1, 2}} IN ${body}`,
      ),
    ).toEqual(rows);
  });

  it.each([
    [
      "a union",
      "x' = 0 /\\ LET S == UNION {[proc : {p}, idx : 1..1] : p \\in {1, 2}} IN \\E R \\in SUBSET S : TRUE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 74 of module M: 1",
        "|line 5, col 34 to line 5, col 74 of module M: 1:8",
        "||line 5, col 35 to line 5, col 58 of module M: 2:10",
        "|||line 5, col 43 to line 5, col 45 of module M: 2:6",
        "||||line 5, col 44 to line 5, col 44 of module M: 2",
        "|||line 5, col 48 to line 5, col 57 of module M: 2",
        "||line 5, col 68 to line 5, col 73 of module M: 1:3",
        "line 5, col 79 to line 5, col 102 of module M: 1",
      ],
    ],
    [
      "a product",
      "x' = 0 /\\ \\E R \\in SUBSET ({1, 2} \\X {3}) : TRUE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 56 of module M: 1",
        "|line 5, col 53 to line 5, col 56 of module M: 1",
        "|line 5, col 28 to line 5, col 49 of module M: 1",
        "||line 5, col 36 to line 5, col 48 of module M: 1:6",
        "|||line 5, col 36 to line 5, col 41 of module M: 1:3",
        "|||line 5, col 46 to line 5, col 48 of module M: 1:5",
      ],
    ],
    [
      "a set of records",
      "x' = 0 /\\ \\E R \\in SUBSET [a : {1, 2}] : TRUE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 53 of module M: 1",
        "|line 5, col 50 to line 5, col 53 of module M: 1",
        "|line 5, col 28 to line 5, col 46 of module M: 1",
        "||line 5, col 35 to line 5, col 46 of module M: 1:4",
        "|||line 5, col 36 to line 5, col 45 of module M: 1:3",
      ],
    ],
    [
      "a product after PrintT converts the SUBSET",
      "LET S == SUBSET ({1, 2} \\X {3}) IN x' = 0 /\\ PrintT(S) /\\ \\E R \\in S : TRUE",
      [
        "line 5, col 44 to line 5, col 49 of module M: 1",
        "line 5, col 54 to line 5, col 62 of module M: 1",
        "|line 5, col 61 to line 5, col 61 of module M: 1",
        "||line 5, col 18 to line 5, col 39 of module M: 1:4",
        "|||line 5, col 26 to line 5, col 38 of module M: 1:6",
        "||||line 5, col 26 to line 5, col 31 of module M: 1:3",
        "||||line 5, col 36 to line 5, col 38 of module M: 1:5",
        "line 5, col 67 to line 5, col 83 of module M: 1",
        "|line 5, col 80 to line 5, col 83 of module M: 1",
        "|line 5, col 76 to line 5, col 76 of module M: 1",
        "||line 5, col 18 to line 5, col 39 of module M: 1",
        "|||line 5, col 26 to line 5, col 38 of module M: 1:6",
        "||||line 5, col 26 to line 5, col 31 of module M: 1:3",
        "||||line 5, col 36 to line 5, col 38 of module M: 1:5",
      ],
    ],
  ])(
    "charges the subsets of %s to the base that SUBSET sizes and converts",
    async (_name, next, rows) => {
      expect(await getNextCoverageLines(next)).toEqual(rows);
    },
  );

  it.each([
    [
      "a union of empty record sets",
      "\\E s \\in SUBSET ((UNION {[a : {p}, b : {}] : p \\in {1, 2}}) \\X {1}) : TRUE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 92 of module M: 1",
        "|line 5, col 89 to line 5, col 92 of module M: 1",
        "|line 5, col 28 to line 5, col 85 of module M: 1",
        "||line 5, col 36 to line 5, col 84 of module M: 1",
        "|||line 5, col 37 to line 5, col 76 of module M: 1",
        "||||line 5, col 43 to line 5, col 76 of module M: 1:2",
        "|||||line 5, col 44 to line 5, col 60 of module M: 2",
        "|||||line 5, col 70 to line 5, col 75 of module M: 1:3",
        "|||line 5, col 82 to line 5, col 84 of module M: 1",
      ],
    ],
    [
      "a union of empty products",
      "\\E s \\in SUBSET ((UNION {{p} \\X {} : p \\in {1, 2}}) \\X {1}) : TRUE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 84 of module M: 1",
        "|line 5, col 81 to line 5, col 84 of module M: 1",
        "|line 5, col 28 to line 5, col 77 of module M: 1",
        "||line 5, col 36 to line 5, col 76 of module M: 1",
        "|||line 5, col 37 to line 5, col 68 of module M: 1",
        "||||line 5, col 43 to line 5, col 68 of module M: 1:2",
        "|||||line 5, col 44 to line 5, col 52 of module M: 2",
        "|||||line 5, col 62 to line 5, col 67 of module M: 1:3",
        "|||line 5, col 74 to line 5, col 76 of module M: 1",
      ],
    ],
    [
      "a union of empty function sets",
      "\\E s \\in SUBSET ((UNION {[{p} -> {}] : p \\in {1, 2}}) \\X {1}) : TRUE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 86 of module M: 1",
        "|line 5, col 83 to line 5, col 86 of module M: 1",
        "|line 5, col 28 to line 5, col 79 of module M: 1",
        "||line 5, col 36 to line 5, col 78 of module M: 1",
        "|||line 5, col 37 to line 5, col 70 of module M: 1",
        "||||line 5, col 43 to line 5, col 70 of module M: 1:2",
        "|||||line 5, col 44 to line 5, col 54 of module M: 2",
        "|||||line 5, col 64 to line 5, col 69 of module M: 1:3",
        "|||line 5, col 76 to line 5, col 78 of module M: 1",
      ],
    ],
  ])("doesn't convert an empty product of %s that SUBSET sizes", async (_name, body, rows) => {
    expect(await getNextCoverageLines(`x' = 0 /\\ ${body}`)).toEqual(rows);
  });

  it("charges the conversion of a product after sizing it converts its union", async () => {
    expect(
      await getNextCoverageLines(
        "x' = 0 /\\ LET S == UNION { [proc : {p}, idx : 1..1] : p \\in {1, 2} } IN \\E R \\in SUBSET (S \\X S) : Cardinality(R) = 2",
      ),
    ).toEqual([
      "line 5, col 9 to line 5, col 14 of module M: 1",
      "line 5, col 28 to line 5, col 76 of module M: 1",
      "|line 5, col 34 to line 5, col 76 of module M: 1:24",
      "||line 5, col 36 to line 5, col 59 of module M: 2:14",
      "|||line 5, col 44 to line 5, col 46 of module M: 2:10",
      "||||line 5, col 45 to line 5, col 45 of module M: 2",
      "|||line 5, col 49 to line 5, col 58 of module M: 2",
      "||line 5, col 69 to line 5, col 74 of module M: 1:3",
      "line 5, col 81 to line 5, col 125 of module M: 1",
      "|line 5, col 108 to line 5, col 125 of module M: 6",
      "|line 5, col 90 to line 5, col 104 of module M: 1",
      "||line 5, col 98 to line 5, col 103 of module M: 1:12",
      "|||line 5, col 98 to line 5, col 98 of module M: 1",
      "|||line 5, col 103 to line 5, col 103 of module M: 1",
    ]);
  });

  it.each([
    [
      "a product of a union",
      "LET S == UNION {[proc : {p}, idx : 1..1] : p \\in {1, 2}} IN PrintT(S \\X S)",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 74 of module M: 1",
        "|line 5, col 34 to line 5, col 74 of module M: 1:20",
        "||line 5, col 35 to line 5, col 58 of module M: 2:10",
        "|||line 5, col 43 to line 5, col 45 of module M: 2:6",
        "||||line 5, col 44 to line 5, col 44 of module M: 2",
        "|||line 5, col 48 to line 5, col 57 of module M: 2",
        "||line 5, col 68 to line 5, col 73 of module M: 1:3",
        "line 5, col 79 to line 5, col 92 of module M: 1",
        "|line 5, col 86 to line 5, col 91 of module M: 1:12",
        "||line 5, col 86 to line 5, col 86 of module M: 1",
        "||line 5, col 91 to line 5, col 91 of module M: 1",
      ],
    ],
    [
      "a product of S \\cup T twice",
      "LET S == ((0..1) \\X {1}) \\cup {<<5, 5>>} IN PrintT(S \\X {1}) /\\ PrintT(S \\X {1})",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 58 of module M: 1",
        "|line 5, col 29 to line 5, col 41 of module M: 1:4",
        "||line 5, col 30 to line 5, col 33 of module M: 1",
        "||line 5, col 39 to line 5, col 41 of module M: 1:5",
        "|line 5, col 49 to line 5, col 58 of module M: 1:21",
        "||line 5, col 50 to line 5, col 57 of module M: 1",
        "line 5, col 63 to line 5, col 98 of module M: 1",
        "|line 5, col 63 to line 5, col 78 of module M: 1",
        "||line 5, col 70 to line 5, col 77 of module M: 1:9",
        "|||line 5, col 70 to line 5, col 70 of module M: 1",
        "|||line 5, col 75 to line 5, col 77 of module M: 1:7",
        "|line 5, col 83 to line 5, col 98 of module M: 1",
        "||line 5, col 90 to line 5, col 97 of module M: 1:9",
        "|||line 5, col 90 to line 5, col 90 of module M: 1",
        "|||line 5, col 95 to line 5, col 97 of module M: 1:7",
      ],
    ],
    [
      "a set of records over S \\cup T",
      "PrintT([a : ((0..1) \\X {1}) \\cup {<<5, 5>>}])",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 63 of module M: 1",
        "|line 5, col 26 to line 5, col 62 of module M: 1:6",
        "||line 5, col 31 to line 5, col 61 of module M: 1",
        "|||line 5, col 32 to line 5, col 44 of module M: 1:4",
        "||||line 5, col 33 to line 5, col 36 of module M: 1",
        "||||line 5, col 42 to line 5, col 44 of module M: 1:5",
        "|||line 5, col 52 to line 5, col 61 of module M: 1:16",
        "||||line 5, col 53 to line 5, col 60 of module M: 1",
      ],
    ],
    [
      "a set of functions from S \\cup T",
      "PrintT([((0..1) \\X {1}) \\cup {<<5, 5>>} -> {3}])",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 66 of module M: 1",
        "|line 5, col 26 to line 5, col 65 of module M: 1:4",
        "||line 5, col 27 to line 5, col 57 of module M: 1",
        "|||line 5, col 28 to line 5, col 40 of module M: 1:4",
        "||||line 5, col 29 to line 5, col 32 of module M: 1",
        "||||line 5, col 38 to line 5, col 40 of module M: 1:6",
        "|||line 5, col 48 to line 5, col 57 of module M: 1:14",
        "||||line 5, col 49 to line 5, col 56 of module M: 1",
        "||line 5, col 62 to line 5, col 64 of module M: 1:8",
      ],
    ],
    [
      "a set of functions into S \\cup T",
      "PrintT([{1, 2} -> ((0..1) \\X {1}) \\cup {<<5, 5>>}])",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 69 of module M: 1",
        "|line 5, col 26 to line 5, col 68 of module M: 1:27",
        "||line 5, col 27 to line 5, col 32 of module M: 1",
        "||line 5, col 37 to line 5, col 67 of module M: 1",
        "|||line 5, col 38 to line 5, col 50 of module M: 1:4",
        "||||line 5, col 39 to line 5, col 42 of module M: 1",
        "||||line 5, col 48 to line 5, col 50 of module M: 1:5",
        "|||line 5, col 58 to line 5, col 67 of module M: 1:29",
        "||||line 5, col 59 to line 5, col 66 of module M: 1",
      ],
    ],
    [
      "the subsets of a set of records over S \\cup T",
      "LET S == ((0..1) \\X {1}) \\cup {<<5, 5>>} IN PrintT(SUBSET [a : S])",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 58 of module M: 1",
        "|line 5, col 29 to line 5, col 41 of module M: 1:4",
        "||line 5, col 30 to line 5, col 33 of module M: 1",
        "||line 5, col 39 to line 5, col 41 of module M: 1:6",
        "|line 5, col 49 to line 5, col 58 of module M: 1:20",
        "||line 5, col 50 to line 5, col 57 of module M: 1",
        "line 5, col 63 to line 5, col 84 of module M: 1",
        "|line 5, col 70 to line 5, col 83 of module M: 1:8",
        "||line 5, col 77 to line 5, col 83 of module M: 1:6",
        "|||line 5, col 78 to line 5, col 82 of module M: 1",
      ],
    ],
  ])("charges the sets that TLC sizes before it prints %s", async (_name, body, rows) => {
    expect(await getNextCoverageLines(`x' = 0 /\\ ${body}`)).toEqual(rows);
  });

  it.each([
    [
      "a union of set literals",
      "LET S == UNION {{p, 3} : p \\in {1, 2}} IN \\E s \\in S : \\E t \\in S : TRUE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 56 of module M: 1",
        "|line 5, col 34 to line 5, col 56 of module M: 1:4",
        "||line 5, col 35 to line 5, col 40 of module M: 2",
        "||line 5, col 50 to line 5, col 55 of module M: 1:3",
        "line 5, col 61 to line 5, col 90 of module M: 1",
      ],
    ],
    [
      "the products of a union of set literals",
      "LET S == UNION {{p, 3} : p \\in {1, 2}} IN \\E R \\in SUBSET (S \\X S) : TRUE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 56 of module M: 1",
        "|line 5, col 34 to line 5, col 56 of module M: 1:17",
        "||line 5, col 35 to line 5, col 40 of module M: 2",
        "||line 5, col 50 to line 5, col 55 of module M: 1:3",
        "line 5, col 61 to line 5, col 91 of module M: 1",
        "|line 5, col 88 to line 5, col 91 of module M: 1",
        "|line 5, col 70 to line 5, col 84 of module M: 1",
        "||line 5, col 78 to line 5, col 83 of module M: 1:27",
        "|||line 5, col 78 to line 5, col 78 of module M: 1",
        "|||line 5, col 83 to line 5, col 83 of module M: 1",
      ],
    ],
    [
      "an empty union of set literals",
      "(\\E s \\in UNION {{} : p \\in {1, 2}} : TRUE) = FALSE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 69 of module M: 1",
        "|line 5, col 20 to line 5, col 60 of module M: 1",
        "||line 5, col 29 to line 5, col 53 of module M: 1",
        "|||line 5, col 35 to line 5, col 53 of module M: 1:1",
        "||||line 5, col 36 to line 5, col 37 of module M: 2",
        "||||line 5, col 47 to line 5, col 52 of module M: 1:3",
        "|line 5, col 65 to line 5, col 69 of module M: 1",
      ],
    ],
    [
      "UNION {}",
      "(\\E s \\in UNION {} : TRUE) = FALSE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 52 of module M: 1",
        "|line 5, col 20 to line 5, col 43 of module M: 1",
        "||line 5, col 29 to line 5, col 36 of module M: 1",
        "|||line 5, col 35 to line 5, col 36 of module M: 1:1",
        "|line 5, col 48 to line 5, col 52 of module M: 1",
      ],
    ],
  ])("charges the enumeration of %s to the set of sets", async (_name, body, rows) => {
    expect(await getNextCoverageLines(`x' = 0 /\\ ${body}`)).toEqual(rows);
  });

  it.each([
    [
      "S \\cup T when PrintT converts the filter",
      "PrintT({u \\in ((0..1) \\X {1}) \\cup {<<5, 5>>} : TRUE})",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 72 of module M: 1",
        "|line 5, col 26 to line 5, col 71 of module M: 1:6",
        "||line 5, col 67 to line 5, col 70 of module M: 3",
        "||line 5, col 33 to line 5, col 63 of module M: 1",
        "|||line 5, col 34 to line 5, col 46 of module M: 1:4",
        "||||line 5, col 35 to line 5, col 38 of module M: 1",
        "||||line 5, col 44 to line 5, col 46 of module M: 1:5",
        "|||line 5, col 54 to line 5, col 63 of module M: 1:8",
        "||||line 5, col 55 to line 5, col 62 of module M: 1",
      ],
    ],
    [
      "UNION S when a bound converts the filter",
      "LET S == UNION {[proc : {p}, idx : 1..1] : p \\in {1, 2}} IN \\E u \\in {v \\in S : TRUE} : TRUE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 74 of module M: 1",
        "|line 5, col 34 to line 5, col 74 of module M: 1:6",
        "||line 5, col 35 to line 5, col 58 of module M: 2:10",
        "|||line 5, col 43 to line 5, col 45 of module M: 2:6",
        "||||line 5, col 44 to line 5, col 44 of module M: 2",
        "|||line 5, col 48 to line 5, col 57 of module M: 2",
        "||line 5, col 68 to line 5, col 73 of module M: 1:3",
        "line 5, col 79 to line 5, col 110 of module M: 1",
        "|line 5, col 107 to line 5, col 110 of module M: 1",
        "|line 5, col 88 to line 5, col 103 of module M: 1:6",
        "||line 5, col 99 to line 5, col 102 of module M: 2",
        "||line 5, col 95 to line 5, col 95 of module M: 1",
      ],
    ],
    [
      "S \\cup T after Cardinality converts it",
      "LET S == ((0..1) \\X {1}) \\cup {<<5, 5>>} IN Cardinality(S) = 3 /\\ PrintT({u \\in S : TRUE})",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 58 of module M: 1",
        "|line 5, col 29 to line 5, col 41 of module M: 1:4",
        "||line 5, col 30 to line 5, col 33 of module M: 1",
        "||line 5, col 39 to line 5, col 41 of module M: 1:5",
        "|line 5, col 49 to line 5, col 58 of module M: 1:15",
        "||line 5, col 50 to line 5, col 57 of module M: 1",
        "line 5, col 63 to line 5, col 108 of module M: 1",
        "|line 5, col 63 to line 5, col 80 of module M: 1",
        "|line 5, col 85 to line 5, col 108 of module M: 1",
        "||line 5, col 92 to line 5, col 107 of module M: 1:6",
        "|||line 5, col 103 to line 5, col 106 of module M: 3",
        "|||line 5, col 99 to line 5, col 99 of module M: 1",
      ],
    ],
    [
      "S \\ T when a bound converts the filter",
      "\\E u \\in {v \\in ((0..1) \\X {1}) \\ {<<0, 1>>} : TRUE} : TRUE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 77 of module M: 1",
        "|line 5, col 74 to line 5, col 77 of module M: 1",
        "|line 5, col 28 to line 5, col 70 of module M: 1:4",
        "||line 5, col 66 to line 5, col 69 of module M: 1",
        "||line 5, col 35 to line 5, col 62 of module M: 1",
        "|||line 5, col 36 to line 5, col 48 of module M: 1:4",
        "||||line 5, col 37 to line 5, col 40 of module M: 1",
        "||||line 5, col 46 to line 5, col 48 of module M: 1:5",
        "|||line 5, col 53 to line 5, col 62 of module M: 1",
      ],
    ],
    [
      "the subsets of a product of a union when a bound converts the filter",
      "LET S == UNION {[proc : {p}, idx : 1..1] : p \\in {1, 2}} IN \\E R \\in {Q \\in SUBSET (S \\X S) : Cardinality(Q) = 2} : TRUE",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 74 of module M: 1",
        "|line 5, col 34 to line 5, col 74 of module M: 1:24",
        "||line 5, col 35 to line 5, col 58 of module M: 2:14",
        "|||line 5, col 43 to line 5, col 45 of module M: 2:10",
        "||||line 5, col 44 to line 5, col 44 of module M: 2",
        "|||line 5, col 48 to line 5, col 57 of module M: 2",
        "||line 5, col 68 to line 5, col 73 of module M: 1:3",
        "line 5, col 79 to line 5, col 138 of module M: 1",
        "|line 5, col 135 to line 5, col 138 of module M: 1",
        "|line 5, col 88 to line 5, col 131 of module M: 1:24",
        "||line 5, col 113 to line 5, col 130 of module M: 16",
        "||line 5, col 95 to line 5, col 109 of module M: 1",
        "|||line 5, col 103 to line 5, col 108 of module M: 1:12",
        "||||line 5, col 103 to line 5, col 103 of module M: 1",
        "||||line 5, col 108 to line 5, col 108 of module M: 1",
      ],
    ],
    [
      "the subsets of S \\cup T when PrintT converts the filter",
      "PrintT({Q \\in SUBSET (((0..1) \\X {1}) \\cup {<<5, 5>>}) : Cardinality(Q) = 1})",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 95 of module M: 1",
        "|line 5, col 26 to line 5, col 94 of module M: 1:11",
        "||line 5, col 76 to line 5, col 93 of module M: 8",
        "||line 5, col 33 to line 5, col 72 of module M: 1",
        "|||line 5, col 41 to line 5, col 71 of module M: 1",
        "||||line 5, col 42 to line 5, col 54 of module M: 1:4",
        "|||||line 5, col 43 to line 5, col 46 of module M: 1",
        "|||||line 5, col 52 to line 5, col 54 of module M: 1:5",
        "||||line 5, col 62 to line 5, col 71 of module M: 1:11",
        "|||||line 5, col 63 to line 5, col 70 of module M: 1",
      ],
    ],
    [
      "the subsets of a product when Cardinality converts the filter",
      "Cardinality({Q \\in SUBSET ((0..1) \\X {1}) : TRUE}) = 4",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 72 of module M: 1",
        "|line 5, col 19 to line 5, col 68 of module M: 1",
        "||line 5, col 31 to line 5, col 67 of module M: 1:8",
        "|||line 5, col 63 to line 5, col 66 of module M: 4",
        "|||line 5, col 38 to line 5, col 59 of module M: 1",
        "||||line 5, col 46 to line 5, col 58 of module M: 1:6",
        "|||||line 5, col 47 to line 5, col 50 of module M: 1",
        "|||||line 5, col 56 to line 5, col 58 of module M: 1:5",
      ],
    ],
    [
      "a SUBSET that PrintT converted",
      "LET T == SUBSET ({1, 2} \\X {3}) IN PrintT(T) /\\ PrintT({Q \\in T : TRUE})",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 49 of module M: 1:4",
        "|line 5, col 36 to line 5, col 48 of module M: 1:12",
        "||line 5, col 36 to line 5, col 41 of module M: 1:6",
        "||line 5, col 46 to line 5, col 48 of module M: 1:10",
        "line 5, col 54 to line 5, col 90 of module M: 1",
        "|line 5, col 54 to line 5, col 62 of module M: 1",
        "|line 5, col 67 to line 5, col 90 of module M: 1",
        "||line 5, col 74 to line 5, col 89 of module M: 1:8",
        "|||line 5, col 85 to line 5, col 88 of module M: 4",
        "|||line 5, col 81 to line 5, col 81 of module M: 1",
      ],
    ],
    [
      "the subsets of a product when an equality converts the filter",
      "({Q \\in SUBSET ((0..1) \\X {1}) : Cardinality(Q) = 5} = {})",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 20 to line 5, col 75 of module M: 1",
        "|line 5, col 20 to line 5, col 70 of module M: 1:4",
        "||line 5, col 52 to line 5, col 69 of module M: 4",
        "||line 5, col 27 to line 5, col 48 of module M: 1",
        "|||line 5, col 35 to line 5, col 47 of module M: 1:6",
        "||||line 5, col 36 to line 5, col 39 of module M: 1",
        "||||line 5, col 45 to line 5, col 47 of module M: 1:5",
        "|line 5, col 74 to line 5, col 75 of module M: 1",
      ],
    ],
  ])("charges the draws a filter takes from %s", async (_name, body, rows) => {
    expect(await getNextCoverageLines(`x' = 0 /\\ ${body}`)).toEqual(rows);
  });

  it("enumerates the subsets a state keeps without charging their base again", async () => {
    expect(
      await getCoverageLines(
        "---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nVARIABLE x\nInit == x = SUBSET ({1, 2} \\X {3})\nNext == x' = x /\\ \\E R \\in x : TRUE\nInv == TRUE\n====",
        "INIT Init\nNEXT Next\nINVARIANT Inv",
      ),
    ).toEqual([
      [
        "line 4, col 9 to line 4, col 34 of module M: 1",
        "|line 4, col 13 to line 4, col 34 of module M: 1:6",
        "||line 4, col 21 to line 4, col 33 of module M: 1:6",
        "|||line 4, col 21 to line 4, col 26 of module M: 1:3",
        "|||line 4, col 31 to line 4, col 33 of module M: 1:5",
      ],
      ["line 5, col 9 to line 5, col 35 of module M: 1"],
    ]);
  });

  it("charges the sets a state keeps each time a liveness check enumerates them", async () => {
    expect(
      await getCoverageLines(
        "---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nVARIABLE x, y\nInit == x = 0 /\\ y = {}\nA == x < 2 /\\ x' = x + 1 /\\ y' \\in SUBSET ({1, 2} \\X {3}) /\\ y \\subseteq y'\nB == x = 2 /\\ UNCHANGED <<x, y>>\nNext == A \\/ B\nSpec == Init /\\ [][Next]_<<x, y>> /\\ WF_<<x, y>>(A)\nProp == <>(x = 2)\n====",
        "SPECIFICATION Spec\nPROPERTY Prop",
      ),
    ).toEqual([
      [
        "line 4, col 18 to line 4, col 23 of module M: 1",
        "|line 4, col 22 to line 4, col 23 of module M: 1:13",
      ],
      [
        "line 5, col 6 to line 5, col 10 of module M: 5",
        "|line 5, col 6 to line 5, col 6 of module M: 9",
        "line 5, col 15 to line 5, col 24 of module M: 5",
        "line 5, col 29 to line 5, col 57 of module M: 13",
        "|line 5, col 36 to line 5, col 57 of module M: 5:107",
        "||line 5, col 44 to line 5, col 56 of module M: 5:30",
        "|||line 5, col 44 to line 5, col 49 of module M: 5:15",
        "|||line 5, col 54 to line 5, col 56 of module M: 5:25",
        "line 5, col 62 to line 5, col 75 of module M: 20",
      ],
      [
        "line 6, col 6 to line 6, col 10 of module M: 13",
        "|line 6, col 6 to line 6, col 6 of module M: 9",
        "line 6, col 15 to line 6, col 32 of module M: 4",
      ],
    ]);
  });

  it.each([
    [
      "a union with itself",
      "LET S == ((0..1) \\X {1}) \\cup {<<5, 5>>} IN S = S",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 58 of module M: 1",
        "|line 5, col 29 to line 5, col 41 of module M: 1:4",
        "||line 5, col 30 to line 5, col 33 of module M: 1",
        "||line 5, col 39 to line 5, col 41 of module M: 1:5",
        "|line 5, col 49 to line 5, col 58 of module M: 1:11",
        "||line 5, col 50 to line 5, col 57 of module M: 1",
        "line 5, col 63 to line 5, col 67 of module M: 1",
      ],
    ],
    [
      "a union with itself in a set literal",
      "LET S == ((0..1) \\X {1}) \\cup {<<5, 5>>} IN Cardinality({S, S}) = 1",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 58 of module M: 1",
        "|line 5, col 29 to line 5, col 41 of module M: 1:4",
        "||line 5, col 30 to line 5, col 33 of module M: 1",
        "||line 5, col 39 to line 5, col 41 of module M: 1:5",
        "|line 5, col 49 to line 5, col 58 of module M: 1:11",
        "||line 5, col 50 to line 5, col 57 of module M: 1",
        "line 5, col 63 to line 5, col 85 of module M: 1",
      ],
    ],
    [
      "two products of a union",
      "LET S == ((0..1) \\X {1}) \\cup {<<5, 5>>} IN S \\X {1} = S \\X {1}",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 58 of module M: 1",
        "|line 5, col 29 to line 5, col 41 of module M: 1:4",
        "||line 5, col 30 to line 5, col 33 of module M: 1",
        "||line 5, col 39 to line 5, col 41 of module M: 1:7",
        "|line 5, col 49 to line 5, col 58 of module M: 1:15",
        "||line 5, col 50 to line 5, col 57 of module M: 1",
        "line 5, col 63 to line 5, col 81 of module M: 1",
      ],
    ],
    [
      "two function sets from a union",
      "LET S == ((0..1) \\X {1}) \\cup {<<5, 5>>} IN [S -> {1}] = [S -> {1}]",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 58 of module M: 1",
        "|line 5, col 29 to line 5, col 41 of module M: 1:4",
        "||line 5, col 30 to line 5, col 33 of module M: 1",
        "||line 5, col 39 to line 5, col 41 of module M: 1:7",
        "|line 5, col 49 to line 5, col 58 of module M: 1:15",
        "||line 5, col 50 to line 5, col 57 of module M: 1",
        "line 5, col 63 to line 5, col 85 of module M: 1",
      ],
    ],
    [
      "two record sets of a union",
      "LET S == ((0..1) \\X {1}) \\cup {<<5, 5>>} IN [a : S] = [a : S]",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 58 of module M: 1",
        "|line 5, col 29 to line 5, col 41 of module M: 1:4",
        "||line 5, col 30 to line 5, col 33 of module M: 1",
        "||line 5, col 39 to line 5, col 41 of module M: 1:7",
        "|line 5, col 49 to line 5, col 58 of module M: 1:15",
        "||line 5, col 50 to line 5, col 57 of module M: 1",
        "line 5, col 63 to line 5, col 79 of module M: 1",
      ],
    ],
    [
      "a product of a union with itself",
      "LET S == ((0..1) \\X {1}) \\cup {<<5, 5>>} IN LET P == S \\X {1} IN P = P",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 58 of module M: 1",
        "|line 5, col 29 to line 5, col 41 of module M: 1:4",
        "||line 5, col 30 to line 5, col 33 of module M: 1",
        "||line 5, col 39 to line 5, col 41 of module M: 1:7",
        "|line 5, col 49 to line 5, col 58 of module M: 1:15",
        "||line 5, col 50 to line 5, col 57 of module M: 1",
        "line 5, col 72 to line 5, col 79 of module M: 1",
        "line 5, col 84 to line 5, col 88 of module M: 1",
      ],
    ],
    [
      "a record set of a union with itself",
      "LET S == ((0..1) \\X {1}) \\cup {<<5, 5>>} IN LET Q == [a : S] IN Q = Q",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 58 of module M: 1",
        "|line 5, col 29 to line 5, col 41 of module M: 1:4",
        "||line 5, col 30 to line 5, col 33 of module M: 1",
        "||line 5, col 39 to line 5, col 41 of module M: 1:7",
        "|line 5, col 49 to line 5, col 58 of module M: 1:15",
        "||line 5, col 50 to line 5, col 57 of module M: 1",
        "line 5, col 72 to line 5, col 78 of module M: 1",
        "line 5, col 83 to line 5, col 87 of module M: 1",
      ],
    ],
    [
      "a function set into a union with itself",
      "LET S == ((0..1) \\X {1}) \\cup {<<5, 5>>} IN LET F == [{1} -> S] IN F = F",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 58 of module M: 1",
        "|line 5, col 29 to line 5, col 41 of module M: 1:4",
        "||line 5, col 30 to line 5, col 33 of module M: 1",
        "||line 5, col 39 to line 5, col 41 of module M: 1:7",
        "|line 5, col 49 to line 5, col 58 of module M: 1:15",
        "||line 5, col 50 to line 5, col 57 of module M: 1",
        "line 5, col 72 to line 5, col 81 of module M: 1",
        "line 5, col 86 to line 5, col 90 of module M: 1",
      ],
    ],
  ])(
    "charges the emptiness tests and conversions that equality of %s takes",
    async (_name, body, rows) => {
      expect(await getNextCoverageLines(`x' = 0 /\\ ${body}`)).toEqual(rows);
    },
  );

  it.each([
    [
      "a SUBSET",
      "LET S == SUBSET ({1, 2} \\X {3}) IN S \\in {S}",
      ["line 5, col 9 to line 5, col 62 of module M: 1"],
    ],
    [
      "a product of a union",
      "LET S == ((0..1) \\X {1}) \\cup {<<5, 5>>} IN LET P == S \\X {1} IN P \\in {P}",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 58 of module M: 1",
        "|line 5, col 29 to line 5, col 41 of module M: 1:4",
        "||line 5, col 30 to line 5, col 33 of module M: 1",
        "||line 5, col 39 to line 5, col 41 of module M: 1:7",
        "|line 5, col 49 to line 5, col 58 of module M: 1:15",
        "||line 5, col 50 to line 5, col 57 of module M: 1",
        "line 5, col 72 to line 5, col 79 of module M: 1",
        "line 5, col 84 to line 5, col 92 of module M: 1",
      ],
    ],
  ])("compares %s with the members of a set literal by equality", async (_name, body, rows) => {
    expect(await getNextCoverageLines(`x' = 0 /\\ ${body}`)).toEqual(rows);
  });

  it.each([
    [
      "a product",
      "LET P == ({1, 2} \\X {3}) IN {P} = {P}",
      ["line 5, col 9 to line 5, col 55 of module M: 1"],
    ],
    [
      "a product and a set equal to it",
      "LET P == ({1, 2} \\X {3}) IN {P, {<<1, 3>>, <<2, 3>>}} = {P}",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 29 to line 5, col 41 of module M: 1:6",
        "|line 5, col 29 to line 5, col 34 of module M: 1:3",
        "|line 5, col 39 to line 5, col 41 of module M: 1:5",
        "line 5, col 47 to line 5, col 77 of module M: 1",
      ],
    ],
    [
      "two equal sets of records",
      "LET P == [a : {1, 2}] IN {P, [a : {1, 2}]} = {P}",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 39 of module M: 1:4",
        "|line 5, col 29 to line 5, col 38 of module M: 1:3",
        "line 5, col 44 to line 5, col 66 of module M: 1",
        "|line 5, col 44 to line 5, col 60 of module M: 1",
        "||line 5, col 45 to line 5, col 45 of module M: 1",
        "||line 5, col 48 to line 5, col 59 of module M: 1:4",
        "|||line 5, col 49 to line 5, col 58 of module M: 1:3",
        "|line 5, col 64 to line 5, col 66 of module M: 1",
      ],
    ],
  ])(
    "converts no set of tuples or records that equality of set literals of %s compares with itself",
    async (_name, body, rows) => {
      expect(await getNextCoverageLines(`x' = 0 /\\ ${body}`)).toEqual(rows);
    },
  );

  it.each([
    [
      "a product with itself in set literals",
      "LET S == ((0..1) \\X {1}) \\cup {<<5, 5>>} IN LET P == S \\X {1} IN {P} = {P}",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 58 of module M: 1",
        "|line 5, col 29 to line 5, col 41 of module M: 1:4",
        "||line 5, col 30 to line 5, col 33 of module M: 1",
        "||line 5, col 39 to line 5, col 41 of module M: 1:7",
        "|line 5, col 49 to line 5, col 58 of module M: 1:15",
        "||line 5, col 50 to line 5, col 57 of module M: 1",
        "line 5, col 72 to line 5, col 79 of module M: 1",
        "line 5, col 84 to line 5, col 92 of module M: 1",
      ],
    ],
    [
      "two products in set literals",
      "LET S == ((0..1) \\X {1}) \\cup {<<5, 5>>} IN {S \\X {1}} = {S \\X {1}}",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 58 of module M: 1",
        "|line 5, col 29 to line 5, col 41 of module M: 1:4",
        "||line 5, col 30 to line 5, col 33 of module M: 1",
        "||line 5, col 39 to line 5, col 41 of module M: 1:7",
        "|line 5, col 49 to line 5, col 58 of module M: 1:15",
        "||line 5, col 50 to line 5, col 57 of module M: 1",
        "line 5, col 63 to line 5, col 85 of module M: 1",
      ],
    ],
    [
      "two record sets in set literals",
      "LET S == ((0..1) \\X {1}) \\cup {<<5, 5>>} IN {[a : S]} = {[a : S]}",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 58 of module M: 1",
        "|line 5, col 29 to line 5, col 41 of module M: 1:4",
        "||line 5, col 30 to line 5, col 33 of module M: 1",
        "||line 5, col 39 to line 5, col 41 of module M: 1:7",
        "|line 5, col 49 to line 5, col 58 of module M: 1:15",
        "||line 5, col 50 to line 5, col 57 of module M: 1",
        "line 5, col 63 to line 5, col 83 of module M: 1",
      ],
    ],
    [
      "two function sets in set literals",
      "LET S == ((0..1) \\X {1}) \\cup {<<5, 5>>} IN {[S -> {1}]} = {[S -> {1}]}",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 58 of module M: 1",
        "|line 5, col 29 to line 5, col 41 of module M: 1:4",
        "||line 5, col 30 to line 5, col 33 of module M: 1",
        "||line 5, col 39 to line 5, col 41 of module M: 1:7",
        "|line 5, col 49 to line 5, col 58 of module M: 1:15",
        "||line 5, col 50 to line 5, col 57 of module M: 1",
        "line 5, col 63 to line 5, col 89 of module M: 1",
      ],
    ],
  ])("compares %s by their emptiness and parts", async (_name, body, rows) => {
    expect(await getNextCoverageLines(`x' = 0 /\\ ${body}`)).toEqual(rows);
  });

  it.each([
    [
      "a product",
      "LET P == {u \\in (0..1) \\X {1} : PrintT(u)} \\X {1} IN PrintT(P = P) /\\ \\A e \\in P : PrintT(e)",
      [
        "<<0, 1>>",
        "<<0, 1>>",
        "<<0, 1>>",
        "<<1, 1>>",
        "TRUE",
        "<<<<0, 1>>, 1>>",
        "<<<<1, 1>>, 1>>",
      ],
    ],
    [
      "a product in set literals",
      "LET P == {u \\in (0..1) \\X {1} : PrintT(u)} \\X {1} IN PrintT({P} = {P}) /\\ \\A e \\in P : PrintT(e)",
      [
        "<<0, 1>>",
        "<<0, 1>>",
        "<<0, 1>>",
        "<<1, 1>>",
        "TRUE",
        "<<<<0, 1>>, 1>>",
        "<<<<1, 1>>, 1>>",
      ],
    ],
    [
      "a record set",
      "LET Q == [a : {u \\in (0..1) \\X {1} : PrintT(u)}] IN PrintT(Q = Q) /\\ \\A e \\in Q : PrintT(e)",
      [
        "<<0, 1>>",
        "<<0, 1>>",
        "<<0, 1>>",
        "<<1, 1>>",
        "TRUE",
        "[a |-> <<0, 1>>]",
        "[a |-> <<1, 1>>]",
      ],
    ],
    [
      "a record set in set literals",
      "LET Q == [a : {u \\in (0..1) \\X {1} : PrintT(u)}] IN PrintT({Q} = {Q}) /\\ \\A e \\in Q : PrintT(e)",
      [
        "<<0, 1>>",
        "<<0, 1>>",
        "<<0, 1>>",
        "<<1, 1>>",
        "TRUE",
        "[a |-> <<0, 1>>]",
        "[a |-> <<1, 1>>]",
      ],
    ],
    [
      "a function set",
      "LET G == [{1} -> {u \\in (0..1) \\X {1} : PrintT(u)}] IN PrintT(G = G) /\\ \\A e \\in G : PrintT(e)",
      ["<<0, 1>>", "<<0, 1>>", "<<0, 1>>", "<<1, 1>>", "TRUE", "<<<<0, 1>>>>", "<<<<1, 1>>>>"],
    ],
    [
      "a function set in set literals",
      "LET G == [{1} -> {u \\in (0..1) \\X {1} : PrintT(u)}] IN PrintT({G} = {G}) /\\ \\A e \\in G : PrintT(e)",
      ["<<0, 1>>", "<<0, 1>>", "<<0, 1>>", "<<1, 1>>", "TRUE", "<<<<0, 1>>>>", "<<<<1, 1>>>>"],
    ],
    [
      "an empty product",
      "LET P == {u \\in (0..1) \\X {1} : PrintT(u) /\\ FALSE} \\X {1} IN PrintT(P = P) /\\ \\A e \\in P : PrintT(e)",
      ["<<0, 1>>", "<<1, 1>>", "<<0, 1>>", "<<1, 1>>", "TRUE", "<<0, 1>>", "<<1, 1>>"],
    ],
    [
      "a function set with an empty domain",
      "LET G == [{u \\in (0..1) \\X {1} : PrintT(u) /\\ FALSE} -> {1}] IN PrintT(G = G) /\\ \\A e \\in G : PrintT(e)",
      [
        "<<0, 1>>",
        "<<1, 1>>",
        "<<0, 1>>",
        "<<1, 1>>",
        "TRUE",
        "<<0, 1>>",
        "<<1, 1>>",
        "<<0, 1>>",
        "<<1, 1>>",
        "<<>>",
      ],
    ],
    [
      "a filter",
      "LET T == {u \\in (0..1) \\X {1} : PrintT(u)} IN PrintT(T = T) /\\ \\A e \\in T \\X {1} : PrintT(e)",
      ["<<0, 1>>", "<<1, 1>>", "TRUE", "<<<<0, 1>>, 1>>", "<<<<1, 1>>, 1>>"],
    ],
  ])(
    "asks %s compared with itself about emptiness twice and keeps the filters it converts",
    async (_name, body, printed) => {
      const prints: string[] = [];
      await check({
        source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = 0 /\\ ${body}\n====`,
        config: "INIT Init\nNEXT Next",
        onPrint: (text) => prints.push(text),
      });
      expect(prints).toEqual(printed);
    },
  );

  it.each([
    [
      "a product",
      "LET P == {u \\in (0..1) \\X {1} : u[1] < 5} \\X {1} IN P = P /\\ \\A e \\in P : e = e",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 66 of module M: 1:9",
        "|line 5, col 28 to line 5, col 59 of module M: 1:10",
        "||line 5, col 51 to line 5, col 58 of module M: 4",
        "||line 5, col 35 to line 5, col 47 of module M: 1:8",
        "|||line 5, col 36 to line 5, col 39 of module M: 1",
        "|||line 5, col 45 to line 5, col 47 of module M: 1:11",
        "|line 5, col 64 to line 5, col 66 of module M: 1:5",
        "line 5, col 71 to line 5, col 97 of module M: 1",
        "|line 5, col 71 to line 5, col 75 of module M: 1",
        "|line 5, col 80 to line 5, col 97 of module M: 1",
        "||line 5, col 93 to line 5, col 97 of module M: 2",
        "||line 5, col 89 to line 5, col 89 of module M: 1",
      ],
    ],
    [
      "a product in set literals",
      "LET P == {u \\in (0..1) \\X {1} : u[1] < 5} \\X {1} IN {P} = {P} /\\ \\A e \\in P : e = e",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 66 of module M: 1:9",
        "|line 5, col 28 to line 5, col 59 of module M: 1:10",
        "||line 5, col 51 to line 5, col 58 of module M: 4",
        "||line 5, col 35 to line 5, col 47 of module M: 1:8",
        "|||line 5, col 36 to line 5, col 39 of module M: 1",
        "|||line 5, col 45 to line 5, col 47 of module M: 1:11",
        "|line 5, col 64 to line 5, col 66 of module M: 1:5",
        "line 5, col 71 to line 5, col 101 of module M: 1",
        "|line 5, col 71 to line 5, col 79 of module M: 1",
        "|line 5, col 84 to line 5, col 101 of module M: 1",
        "||line 5, col 97 to line 5, col 101 of module M: 2",
        "||line 5, col 93 to line 5, col 93 of module M: 1",
      ],
    ],
    [
      "a record set",
      "LET Q == [a : {u \\in (0..1) \\X {1} : u[1] < 5}] IN Q = Q /\\ \\A e \\in Q : e = e",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 65 of module M: 1:7",
        "|line 5, col 33 to line 5, col 64 of module M: 1:10",
        "||line 5, col 56 to line 5, col 63 of module M: 4",
        "||line 5, col 40 to line 5, col 52 of module M: 1:8",
        "|||line 5, col 41 to line 5, col 44 of module M: 1",
        "|||line 5, col 50 to line 5, col 52 of module M: 1:11",
        "line 5, col 70 to line 5, col 96 of module M: 1",
        "|line 5, col 70 to line 5, col 74 of module M: 1",
        "|line 5, col 79 to line 5, col 96 of module M: 1",
        "||line 5, col 92 to line 5, col 96 of module M: 2",
        "||line 5, col 88 to line 5, col 88 of module M: 1",
      ],
    ],
    [
      "a record set in set literals",
      "LET Q == [a : {u \\in (0..1) \\X {1} : u[1] < 5}] IN {Q} = {Q} /\\ \\A e \\in Q : e = e",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 65 of module M: 1:7",
        "|line 5, col 33 to line 5, col 64 of module M: 1:10",
        "||line 5, col 56 to line 5, col 63 of module M: 4",
        "||line 5, col 40 to line 5, col 52 of module M: 1:8",
        "|||line 5, col 41 to line 5, col 44 of module M: 1",
        "|||line 5, col 50 to line 5, col 52 of module M: 1:11",
        "line 5, col 70 to line 5, col 100 of module M: 1",
        "|line 5, col 70 to line 5, col 78 of module M: 1",
        "|line 5, col 83 to line 5, col 100 of module M: 1",
        "||line 5, col 96 to line 5, col 100 of module M: 2",
        "||line 5, col 92 to line 5, col 92 of module M: 1",
      ],
    ],
    [
      "a function set",
      "LET G == [{1} -> {u \\in (0..1) \\X {1} : u[1] < 5}] IN G = G /\\ \\A e \\in G : e = e",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 68 of module M: 1:7",
        "|line 5, col 29 to line 5, col 31 of module M: 1",
        "|line 5, col 36 to line 5, col 67 of module M: 1:10",
        "||line 5, col 59 to line 5, col 66 of module M: 4",
        "||line 5, col 43 to line 5, col 55 of module M: 1:8",
        "|||line 5, col 44 to line 5, col 47 of module M: 1",
        "|||line 5, col 53 to line 5, col 55 of module M: 1:11",
        "line 5, col 73 to line 5, col 99 of module M: 1",
        "|line 5, col 73 to line 5, col 77 of module M: 1",
        "|line 5, col 82 to line 5, col 99 of module M: 1",
        "||line 5, col 95 to line 5, col 99 of module M: 2",
        "||line 5, col 91 to line 5, col 91 of module M: 1",
      ],
    ],
    [
      "a function set in set literals",
      "LET G == [{1} -> {u \\in (0..1) \\X {1} : u[1] < 5}] IN {G} = {G} /\\ \\A e \\in G : e = e",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 68 of module M: 1:7",
        "|line 5, col 29 to line 5, col 31 of module M: 1",
        "|line 5, col 36 to line 5, col 67 of module M: 1:10",
        "||line 5, col 59 to line 5, col 66 of module M: 4",
        "||line 5, col 43 to line 5, col 55 of module M: 1:8",
        "|||line 5, col 44 to line 5, col 47 of module M: 1",
        "|||line 5, col 53 to line 5, col 55 of module M: 1:11",
        "line 5, col 73 to line 5, col 103 of module M: 1",
        "|line 5, col 73 to line 5, col 81 of module M: 1",
        "|line 5, col 86 to line 5, col 103 of module M: 1",
        "||line 5, col 99 to line 5, col 103 of module M: 2",
        "||line 5, col 95 to line 5, col 95 of module M: 1",
      ],
    ],
    [
      "an empty product",
      "LET P == {u \\in (0..1) \\X {1} : u[1] > 5} \\X {1} IN P = P /\\ \\A e \\in P : e = e",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 66 of module M: 1:1",
        "|line 5, col 28 to line 5, col 59 of module M: 1:6",
        "||line 5, col 51 to line 5, col 58 of module M: 6",
        "||line 5, col 35 to line 5, col 47 of module M: 1:12",
        "|||line 5, col 36 to line 5, col 39 of module M: 1",
        "|||line 5, col 45 to line 5, col 47 of module M: 1:15",
        "|line 5, col 64 to line 5, col 66 of module M: 1",
        "line 5, col 71 to line 5, col 97 of module M: 1",
      ],
    ],
    [
      "a function set with an empty domain",
      "LET G == [{u \\in (0..1) \\X {1} : u[1] > 5} -> {u \\in (0..1) \\X {1} : u[1] < 5}] IN G = G /\\ \\A e \\in G : e = e",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 97 of module M: 1:4",
        "|line 5, col 29 to line 5, col 60 of module M: 1:8",
        "||line 5, col 52 to line 5, col 59 of module M: 8",
        "||line 5, col 36 to line 5, col 48 of module M: 1:16",
        "|||line 5, col 37 to line 5, col 40 of module M: 1",
        "|||line 5, col 46 to line 5, col 48 of module M: 1:20",
        "|line 5, col 65 to line 5, col 96 of module M: 1",
        "line 5, col 102 to line 5, col 128 of module M: 1",
      ],
    ],
    [
      "a filter",
      "LET T == {u \\in (0..1) \\X {1} : u[1] < 5} IN T = T /\\ \\A e \\in T \\X {1} : e = e",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 59 of module M: 1:8",
        "|line 5, col 51 to line 5, col 58 of module M: 2",
        "|line 5, col 35 to line 5, col 47 of module M: 1:4",
        "||line 5, col 36 to line 5, col 39 of module M: 1",
        "||line 5, col 45 to line 5, col 47 of module M: 1:5",
        "line 5, col 64 to line 5, col 97 of module M: 1",
        "|line 5, col 64 to line 5, col 68 of module M: 1",
        "|line 5, col 73 to line 5, col 97 of module M: 1",
        "||line 5, col 93 to line 5, col 97 of module M: 2",
        "||line 5, col 82 to line 5, col 89 of module M: 1:9",
        "|||line 5, col 82 to line 5, col 82 of module M: 1",
        "|||line 5, col 87 to line 5, col 89 of module M: 1:5",
      ],
    ],
  ])(
    "charges %s compared with itself and the filters it converts as TLC does",
    async (_name, body, rows) => {
      expect(await getNextCoverageLines(`x' = 0 /\\ ${body}`)).toEqual(rows);
    },
  );

  it.each([
    [
      "the emptiness of a product",
      "LET F == {u \\in (0..1) \\X {1} : u[1] < 5} IN F = F /\\ F \\X {2} # {}",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 59 of module M: 1:8",
        "|line 5, col 51 to line 5, col 58 of module M: 2",
        "|line 5, col 35 to line 5, col 47 of module M: 1:4",
        "||line 5, col 36 to line 5, col 39 of module M: 1",
        "||line 5, col 45 to line 5, col 47 of module M: 1:5",
        "line 5, col 64 to line 5, col 85 of module M: 1",
        "|line 5, col 64 to line 5, col 68 of module M: 1",
        "|line 5, col 73 to line 5, col 85 of module M: 1",
        "||line 5, col 73 to line 5, col 80 of module M: 1:6",
        "|||line 5, col 73 to line 5, col 73 of module M: 1",
        "|||line 5, col 78 to line 5, col 80 of module M: 1:5",
        "||line 5, col 84 to line 5, col 85 of module M: 1",
      ],
    ],
    [
      "the emptiness of a record set",
      "LET F == {u \\in (0..1) \\X {1} : u[1] < 5} IN F = F /\\ [a : F] # {}",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 59 of module M: 1:8",
        "|line 5, col 51 to line 5, col 58 of module M: 2",
        "|line 5, col 35 to line 5, col 47 of module M: 1:4",
        "||line 5, col 36 to line 5, col 39 of module M: 1",
        "||line 5, col 45 to line 5, col 47 of module M: 1:5",
        "line 5, col 64 to line 5, col 84 of module M: 1",
        "|line 5, col 64 to line 5, col 68 of module M: 1",
        "|line 5, col 73 to line 5, col 84 of module M: 1",
        "||line 5, col 73 to line 5, col 79 of module M: 1:4",
        "|||line 5, col 74 to line 5, col 78 of module M: 1",
        "||line 5, col 83 to line 5, col 84 of module M: 1",
      ],
    ],
    [
      "the subsets of a product",
      "LET F == {u \\in (0..1) \\X {1} : u[1] < 5} IN F = F /\\ \\E s \\in SUBSET (F \\X {2}) : s = s",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 59 of module M: 1:9",
        "|line 5, col 51 to line 5, col 58 of module M: 2",
        "|line 5, col 35 to line 5, col 47 of module M: 1:4",
        "||line 5, col 36 to line 5, col 39 of module M: 1",
        "||line 5, col 45 to line 5, col 47 of module M: 1:5",
        "line 5, col 64 to line 5, col 106 of module M: 1",
        "|line 5, col 64 to line 5, col 68 of module M: 1",
        "|line 5, col 73 to line 5, col 106 of module M: 1",
        "||line 5, col 102 to line 5, col 106 of module M: 1",
        "||line 5, col 82 to line 5, col 98 of module M: 1",
        "|||line 5, col 90 to line 5, col 97 of module M: 1:6",
        "||||line 5, col 90 to line 5, col 90 of module M: 1",
        "||||line 5, col 95 to line 5, col 97 of module M: 1:5",
      ],
    ],
    [
      "a union",
      "LET F == {u \\in (0..1) \\X {1} : u[1] < 5} IN F = F /\\ \\E t \\in F \\cup {<<5, 1>>} : t = t",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 59 of module M: 1:7",
        "|line 5, col 51 to line 5, col 58 of module M: 2",
        "|line 5, col 35 to line 5, col 47 of module M: 1:4",
        "||line 5, col 36 to line 5, col 39 of module M: 1",
        "||line 5, col 45 to line 5, col 47 of module M: 1:5",
        "line 5, col 64 to line 5, col 106 of module M: 1",
        "|line 5, col 64 to line 5, col 68 of module M: 1",
        "|line 5, col 73 to line 5, col 106 of module M: 1",
        "||line 5, col 102 to line 5, col 106 of module M: 1",
        "||line 5, col 82 to line 5, col 98 of module M: 1",
        "|||line 5, col 82 to line 5, col 82 of module M: 1",
        "|||line 5, col 89 to line 5, col 98 of module M: 1:13",
        "||||line 5, col 90 to line 5, col 97 of module M: 1",
      ],
    ],
    [
      "S \\ T",
      "LET F == {u \\in (0..1) \\X {1} : u[2] = 1} IN F = F /\\ \\A t \\in F \\ {<<9, 9>>} : t # <<7, 7>>",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 59 of module M: 1:7",
        "|line 5, col 51 to line 5, col 58 of module M: 2",
        "|line 5, col 35 to line 5, col 47 of module M: 1:4",
        "||line 5, col 36 to line 5, col 39 of module M: 1",
        "||line 5, col 45 to line 5, col 47 of module M: 1:5",
        "line 5, col 64 to line 5, col 110 of module M: 1",
        "|line 5, col 64 to line 5, col 68 of module M: 1",
        "|line 5, col 73 to line 5, col 110 of module M: 1",
        "||line 5, col 99 to line 5, col 110 of module M: 2",
        "||line 5, col 82 to line 5, col 95 of module M: 1",
      ],
    ],
    [
      "the size of S \\ T",
      "LET F == {u \\in (0..1) \\X {1} : u[2] = 1} IN F = F /\\ Cardinality(F \\ {<<9, 9>>}) = 2",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 59 of module M: 1:7",
        "|line 5, col 51 to line 5, col 58 of module M: 2",
        "|line 5, col 35 to line 5, col 47 of module M: 1:4",
        "||line 5, col 36 to line 5, col 39 of module M: 1",
        "||line 5, col 45 to line 5, col 47 of module M: 1:5",
        "line 5, col 64 to line 5, col 103 of module M: 1",
      ],
    ],
    [
      "S \\cap S",
      "LET F == {u \\in (0..1) \\X {1} : u[2] = 1} IN F = F /\\ \\A t \\in F \\cap F : t # <<7, 7>>",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 59 of module M: 1:7",
        "|line 5, col 51 to line 5, col 58 of module M: 2",
        "|line 5, col 35 to line 5, col 47 of module M: 1:4",
        "||line 5, col 36 to line 5, col 39 of module M: 1",
        "||line 5, col 45 to line 5, col 47 of module M: 1:5",
        "line 5, col 64 to line 5, col 104 of module M: 1",
        "|line 5, col 64 to line 5, col 68 of module M: 1",
        "|line 5, col 73 to line 5, col 104 of module M: 1",
        "||line 5, col 93 to line 5, col 104 of module M: 2",
        "||line 5, col 82 to line 5, col 89 of module M: 1",
      ],
    ],
    [
      "T \\ S",
      "LET F == {u \\in (0..1) \\X {1} : u[2] = 1} IN F = F /\\ \\A t \\in (0..1) \\X {1} \\ F : t # <<7, 7>>",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 59 of module M: 1:4",
        "|line 5, col 51 to line 5, col 58 of module M: 2",
        "|line 5, col 35 to line 5, col 47 of module M: 1:4",
        "||line 5, col 36 to line 5, col 39 of module M: 1",
        "||line 5, col 45 to line 5, col 47 of module M: 1:5",
        "line 5, col 64 to line 5, col 113 of module M: 1",
        "|line 5, col 64 to line 5, col 68 of module M: 1",
        "|line 5, col 73 to line 5, col 113 of module M: 1",
        "||line 5, col 82 to line 5, col 98 of module M: 1",
        "|||line 5, col 82 to line 5, col 94 of module M: 1:4",
        "||||line 5, col 83 to line 5, col 86 of module M: 1",
        "||||line 5, col 92 to line 5, col 94 of module M: 1:5",
        "|||line 5, col 98 to line 5, col 98 of module M: 1",
      ],
    ],
  ])("charges a converted filter in %s as the set it keeps", async (_name, body, rows) => {
    expect(await getNextCoverageLines(`x' = 0 /\\ ${body}`)).toEqual(rows);
  });

  it.each([
    [
      "Cardinality",
      "LET F == {u \\in (0..1) \\X {1} : u[2] = 1} IN Cardinality(F) = 2 /\\ \\A t \\in F \\ {<<9, 9>>} : t # <<7, 7>>",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 59 of module M: 1:7",
        "|line 5, col 51 to line 5, col 58 of module M: 2",
        "|line 5, col 35 to line 5, col 47 of module M: 1:4",
        "||line 5, col 36 to line 5, col 39 of module M: 1",
        "||line 5, col 45 to line 5, col 47 of module M: 1:5",
        "line 5, col 64 to line 5, col 123 of module M: 1",
        "|line 5, col 64 to line 5, col 81 of module M: 1",
        "|line 5, col 86 to line 5, col 123 of module M: 1",
        "||line 5, col 112 to line 5, col 123 of module M: 2",
        "||line 5, col 95 to line 5, col 108 of module M: 1",
      ],
    ],
    [
      "equality with a set literal",
      "LET F == {u \\in (0..1) \\X {1} : u[2] = 1} IN F = {<<0, 1>>, <<1, 1>>} /\\ \\A t \\in F \\ {<<9, 9>>} : t # <<7, 7>>",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 59 of module M: 1:7",
        "|line 5, col 51 to line 5, col 58 of module M: 2",
        "|line 5, col 35 to line 5, col 47 of module M: 1:4",
        "||line 5, col 36 to line 5, col 39 of module M: 1",
        "||line 5, col 45 to line 5, col 47 of module M: 1:5",
        "line 5, col 64 to line 5, col 129 of module M: 1",
        "|line 5, col 64 to line 5, col 87 of module M: 1",
        "|line 5, col 92 to line 5, col 129 of module M: 1",
        "||line 5, col 118 to line 5, col 129 of module M: 2",
        "||line 5, col 101 to line 5, col 114 of module M: 1",
      ],
    ],
    [
      "a set literal's equality with it",
      "LET F == {u \\in (0..1) \\X {1} : u[2] = 1} IN {<<0, 1>>, <<1, 1>>} = F /\\ \\A t \\in F : t # <<7, 7>>",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 59 of module M: 1:11",
        "|line 5, col 51 to line 5, col 58 of module M: 4",
        "|line 5, col 35 to line 5, col 47 of module M: 1:8",
        "||line 5, col 36 to line 5, col 39 of module M: 1",
        "||line 5, col 45 to line 5, col 47 of module M: 1:10",
        "line 5, col 64 to line 5, col 116 of module M: 1",
        "|line 5, col 64 to line 5, col 87 of module M: 1",
        "|line 5, col 92 to line 5, col 116 of module M: 1",
        "||line 5, col 105 to line 5, col 116 of module M: 2",
        "||line 5, col 101 to line 5, col 101 of module M: 1",
      ],
    ],
    [
      "Cardinality, for T \\ S",
      "LET F == {u \\in (0..1) \\X {1} : u[2] = 1} IN Cardinality(F) = 2 /\\ \\A t \\in (0..1) \\X {1} \\ F : t # <<7, 7>>",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 59 of module M: 1:4",
        "|line 5, col 51 to line 5, col 58 of module M: 2",
        "|line 5, col 35 to line 5, col 47 of module M: 1:4",
        "||line 5, col 36 to line 5, col 39 of module M: 1",
        "||line 5, col 45 to line 5, col 47 of module M: 1:5",
        "line 5, col 64 to line 5, col 126 of module M: 1",
        "|line 5, col 64 to line 5, col 81 of module M: 1",
        "|line 5, col 86 to line 5, col 126 of module M: 1",
        "||line 5, col 95 to line 5, col 111 of module M: 1",
        "|||line 5, col 95 to line 5, col 107 of module M: 1:4",
        "||||line 5, col 96 to line 5, col 99 of module M: 1",
        "||||line 5, col 105 to line 5, col 107 of module M: 1:5",
        "|||line 5, col 111 to line 5, col 111 of module M: 1",
      ],
    ],
    [
      "a set literal's sort",
      "LET F == {u \\in (0..1) \\X {1} : u[2] = 1} IN {{<<0, 1>>}, F} # {} /\\ \\A t \\in F \\ {<<9, 9>>} : t # <<7, 7>>",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 59 of module M: 1:7",
        "|line 5, col 51 to line 5, col 58 of module M: 2",
        "|line 5, col 35 to line 5, col 47 of module M: 1:4",
        "||line 5, col 36 to line 5, col 39 of module M: 1",
        "||line 5, col 45 to line 5, col 47 of module M: 1:5",
        "line 5, col 64 to line 5, col 125 of module M: 1",
        "|line 5, col 64 to line 5, col 83 of module M: 1",
        "|line 5, col 88 to line 5, col 125 of module M: 1",
        "||line 5, col 114 to line 5, col 125 of module M: 2",
        "||line 5, col 97 to line 5, col 110 of module M: 1",
      ],
    ],
  ])("charges a filter that %s converts as the set it keeps", async (_name, body, rows) => {
    expect(await getNextCoverageLines(`x' = 0 /\\ ${body}`)).toEqual(rows);
  });

  it.each([
    [
      "a product",
      "{u \\in (0..1) \\X {1} : u[2] = 1} \\X {1}",
      [
        "line 4, col 9 to line 4, col 51 of module M: 1",
        "|line 4, col 13 to line 4, col 51 of module M: 1:6",
        "||line 4, col 13 to line 4, col 44 of module M: 1:3",
        "|||line 4, col 36 to line 4, col 43 of module M: 3",
        "|||line 4, col 20 to line 4, col 32 of module M: 1:6",
        "||||line 4, col 21 to line 4, col 24 of module M: 1",
        "||||line 4, col 30 to line 4, col 32 of module M: 1:8",
        "||line 4, col 49 to line 4, col 51 of module M: 1:5",
      ],
    ],
    [
      "a product's second factor",
      "{1} \\X {u \\in (0..1) \\X {1} : u[2] = 1}",
      [
        "line 4, col 9 to line 4, col 51 of module M: 1",
        "|line 4, col 13 to line 4, col 51 of module M: 1:6",
        "||line 4, col 13 to line 4, col 15 of module M: 1:2",
        "||line 4, col 20 to line 4, col 51 of module M: 1:4",
        "|||line 4, col 43 to line 4, col 50 of module M: 4",
        "|||line 4, col 27 to line 4, col 39 of module M: 1:8",
        "||||line 4, col 28 to line 4, col 31 of module M: 1",
        "||||line 4, col 37 to line 4, col 39 of module M: 1:11",
      ],
    ],
    [
      "a record set",
      "[a : {u \\in (0..1) \\X {1} : u[2] = 1}]",
      [
        "line 4, col 9 to line 4, col 50 of module M: 1",
        "|line 4, col 13 to line 4, col 50 of module M: 1:4",
        "||line 4, col 18 to line 4, col 49 of module M: 1:3",
        "|||line 4, col 41 to line 4, col 48 of module M: 3",
        "|||line 4, col 25 to line 4, col 37 of module M: 1:6",
        "||||line 4, col 26 to line 4, col 29 of module M: 1",
        "||||line 4, col 35 to line 4, col 37 of module M: 1:8",
      ],
    ],
    [
      "a function set's range",
      "[{1} -> {u \\in (0..1) \\X {1} : u[2] = 1}]",
      [
        "line 4, col 9 to line 4, col 53 of module M: 1",
        "|line 4, col 13 to line 4, col 53 of module M: 1:4",
        "||line 4, col 14 to line 4, col 16 of module M: 1",
        "||line 4, col 21 to line 4, col 52 of module M: 1:3",
        "|||line 4, col 44 to line 4, col 51 of module M: 3",
        "|||line 4, col 28 to line 4, col 40 of module M: 1:6",
        "||||line 4, col 29 to line 4, col 32 of module M: 1",
        "||||line 4, col 38 to line 4, col 40 of module M: 1:8",
      ],
    ],
  ])(
    "charges the draws of %s with a filter in it that the initial state holds",
    async (_name, set, rows) => {
      const relations = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nVARIABLE x\nInit == x = ${set}\nNext == x' = x\nInv == TRUE\n====`,
        "INIT Init\nNEXT Next\nINVARIANT Inv",
      );
      expect(relations?.[0]).toEqual(rows);
    },
  );

  it.each([
    [
      "the next state holds",
      "x' = {u \\in (0..1) \\X {1} : u[2] = 1} \\X {1}",
      [
        "line 5, col 9 to line 5, col 52 of module M: 2",
        "|line 5, col 14 to line 5, col 52 of module M: 2:12",
        "||line 5, col 14 to line 5, col 45 of module M: 2:6",
        "|||line 5, col 37 to line 5, col 44 of module M: 6",
        "|||line 5, col 21 to line 5, col 33 of module M: 2:12",
        "||||line 5, col 22 to line 5, col 25 of module M: 2",
        "||||line 5, col 31 to line 5, col 33 of module M: 2:16",
        "||line 5, col 50 to line 5, col 52 of module M: 2:10",
      ],
    ],
    [
      "a comparison converts",
      "x' = 0 /\\ LET P == {u \\in (0..1) \\X {1} : u[2] = 1} \\X {1} IN P # {}",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 66 of module M: 1:6",
        "|line 5, col 28 to line 5, col 59 of module M: 1:3",
        "||line 5, col 51 to line 5, col 58 of module M: 3",
        "||line 5, col 35 to line 5, col 47 of module M: 1:6",
        "|||line 5, col 36 to line 5, col 39 of module M: 1",
        "|||line 5, col 45 to line 5, col 47 of module M: 1:8",
        "|line 5, col 64 to line 5, col 66 of module M: 1:5",
        "line 5, col 71 to line 5, col 76 of module M: 1",
      ],
    ],
  ])("charges the draws of a product with a filter in it that %s", async (_name, next, rows) => {
    expect(await getNextCoverageLines(next)).toEqual(rows);
  });

  it.each([
    ["Cardinality", "Cardinality(F) = 2 /\\ <<0, 1>> \\in F", ["<<0, 1>>", "<<1, 1>>"]],
    [
      "the size of its product",
      "Cardinality(F \\X {1}) = 2 /\\ <<0, 1>> \\in F",
      ["<<0, 1>>", "<<0, 1>>", "<<1, 1>>"],
    ],
    [
      "equality with a set literal",
      "F = {<<0, 1>>, <<1, 1>>} /\\ <<0, 1>> \\in F",
      ["<<0, 1>>", "<<1, 1>>"],
    ],
    ["inequality with the empty set", "F # {} /\\ <<0, 1>> \\in F", ["<<0, 1>>", "<<1, 1>>"]],
    [
      "a set literal's equality with it",
      "{<<0, 1>>, <<1, 1>>} = F /\\ Cardinality(F) = 2",
      ["<<0, 1>>", "<<1, 1>>", "<<0, 1>>", "<<1, 1>>"],
    ],
    [
      "equality with another filter",
      'LET G == {u \\in (0..1) \\X {1} : PrintT(<<"g", u>>)} IN F = G /\\ <<0, 1>> \\in F /\\ <<0, 1>> \\in G',
      ["<<0, 1>>", "<<1, 1>>", '<<"g", <<0, 1>>>>', '<<"g", <<1, 1>>>>', '<<"g", <<0, 1>>>>'],
    ],
    ["a set literal's sort", "{{<<0, 1>>}, F} # {} /\\ <<0, 1>> \\in F", ["<<0, 1>>", "<<1, 1>>"]],
    [
      "membership in a set literal that holds it",
      "{<<0, 1>>, <<1, 1>>} \\in {{}, F} /\\ <<0, 1>> \\in F",
      ["<<0, 1>>", "<<1, 1>>"],
    ],
    [
      "PrintT",
      "PrintT(F) /\\ Cardinality(F) = 2",
      ["<<0, 1>>", "<<1, 1>>", "{<<0, 1>>, <<1, 1>>}", "<<0, 1>>", "<<1, 1>>"],
    ],
    [
      "ToString",
      'ToString(F) # "" /\\ Cardinality(F) = 2',
      ["<<0, 1>>", "<<1, 1>>", "<<0, 1>>", "<<1, 1>>"],
    ],
    [
      "PrintT of a tuple that holds it",
      "PrintT(<<F>>) /\\ F = {<<0, 1>>, <<1, 1>>}",
      ["<<0, 1>>", "<<1, 1>>", "<<{<<0, 1>>, <<1, 1>>}>>", "<<0, 1>>", "<<1, 1>>"],
    ],
    [
      "a bound over a function set with it as the domain",
      "LET P == [F -> {1}] IN (\\A o \\in P : TRUE) /\\ (\\A o \\in P : TRUE)",
      ["<<0, 1>>", "<<0, 1>>", "<<1, 1>>", "<<0, 1>>", "<<0, 1>>", "<<1, 1>>"],
    ],
    [
      "a function set with it as the domain compared with the empty set",
      "[F -> {1}] # {} /\\ \\A t \\in F : TRUE",
      ["<<0, 1>>", "<<0, 1>>", "<<1, 1>>", "<<0, 1>>", "<<1, 1>>"],
    ],
    [
      "a bound over a record set of function sets with it as the domain",
      "(\\A o \\in [a : [F -> {1}]] : TRUE) /\\ (\\A o \\in [a : [F -> {1}]] : TRUE)",
      [
        "<<0, 1>>",
        "<<0, 1>>",
        "<<0, 1>>",
        "<<1, 1>>",
        "<<0, 1>>",
        "<<0, 1>>",
        "<<0, 1>>",
        "<<1, 1>>",
      ],
    ],
    [
      "PrintT of its product, which sizes it",
      "PrintT(F \\X {1}) /\\ Cardinality(F) = 2",
      ["<<0, 1>>", "<<1, 1>>", "{<<<<0, 1>>, 1>>, <<<<1, 1>>, 1>>}"],
    ],
    [
      "a literal's sort compares a record set of it",
      "LET P == [a : F] IN {{9}, P} # {} /\\ \\A t \\in F : TRUE",
      ["<<0, 1>>", "<<0, 1>>", "<<1, 1>>", "<<0, 1>>", "<<1, 1>>"],
    ],
    [
      "a literal's sort compares its product",
      "LET P == F \\X {1} IN {{9}, P} # {} /\\ \\A t \\in F : TRUE",
      ["<<0, 1>>", "<<0, 1>>", "<<1, 1>>", "<<0, 1>>", "<<1, 1>>"],
    ],
    [
      "a literal's sort compares a record set of it in two fields",
      "LET P == [a : F, b : F] IN {{9}, P} # {} /\\ \\A t \\in F : TRUE",
      [
        "<<0, 1>>",
        "<<0, 1>>",
        "<<0, 1>>",
        "<<0, 1>>",
        "<<1, 1>>",
        "<<0, 1>>",
        "<<1, 1>>",
        "<<1, 1>>",
        "<<0, 1>>",
        "<<0, 1>>",
        "<<1, 1>>",
      ],
    ],
    [
      "a literal's sort compares a record set of it with itself",
      "LET P == [a : F] IN {P, P} # {} /\\ \\A t \\in F : TRUE",
      ["<<0, 1>>", "<<0, 1>>", "<<1, 1>>", "<<0, 1>>", "<<1, 1>>"],
    ],
  ])(
    "runs a filter's predicate again after %s only where TLC does",
    async (_name, body, printed) => {
      const prints: string[] = [];
      await check({
        source: `---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = 0 /\\ LET F == {u \\in (0..1) \\X {1} : PrintT(u)} IN ${body}\n====`,
        config: "INIT Init\nNEXT Next",
        onPrint: (text) => prints.push(text),
      });
      expect(prints).toEqual(printed);
    },
  );

  it.each([
    ["an equality", "ASSUME LET F == {s \\in SUBSET {1} : PrintT(s)} IN <<F, F>> = 1"],
    ["a record", "ASSUME LET F == {s \\in SUBSET {1} : PrintT(s)} IN [a |-> F, b |-> F] = 1"],
    ["an inequality", "ASSUME LET F == {s \\in SUBSET {1} : PrintT(s)} IN <<F, F>> # 1"],
    ["a membership", "ASSUME LET F == {s \\in SUBSET {1} : PrintT(s)} IN <<F, F>> \\in {1}"],
    ["a constant definition", "K == LET F == {s \\in SUBSET {1} : PrintT(s)} IN <<F, F>> = 1"],
    [
      "a comparison inside another",
      "ASSUME LET F == {s \\in SUBSET {1} : PrintT(s)} IN <<{s \\in {1} : <<F, F>> = s}>> = <<{}>>",
    ],
  ])("formats an error's message once in %s, as TLC does", async (_name, line) => {
    const prints: string[] = [];
    await check({
      source: `---- MODULE M ----\nEXTENDS TLC\nVARIABLE x\n${line}\nInit == x = 0\nNext == x' = x\n====`,
      config: "INIT Init\nNEXT Next",
      onPrint: (text) => prints.push(text),
    });
    expect(prints).toEqual(["{}", "{1}", "{}", "{1}"]);
  });

  it.each([
    ["an enumeration", "<<F \\cup Nat>> = <<{1}>>"],
    ["a filter's enumeration", "<<{y \\in F \\cup Nat : TRUE}>> = <<{1}>>"],
    ["a comparison of overridden sets", "<<Seq(F)>> = <<Nat>>"],
  ])(
    "formats the message of %s that fails inside a comparison once, as TLC does",
    async (_name, comparison) => {
      const prints: string[] = [];
      await check({
        source: `---- MODULE M ----\nEXTENDS Naturals, Sequences, TLC\nASSUME LET F == {s \\in SUBSET {1} : PrintT(s)} IN ${comparison}\n====`,
        config: "",
        onPrint: (text) => prints.push(text),
      });
      expect(prints).toEqual(["{}", "{1}"]);
    },
  );

  it("formats an error's message as it throws in a check after a comparison failed", async () => {
    await check({
      source:
        "---- MODULE M ----\nEXTENDS TLC\nASSUME LET F == {s \\in SUBSET {1} : PrintT(s)} IN <<{s \\in {1} : <<F, F>> = s}>> = <<{}>>\n====",
      config: "",
      onPrint: () => {},
    });
    const result = await check({
      source:
        '---- MODULE M ----\nEXTENDS Naturals, TLCExt\nASSUME AssertError("Attempted to enumerate S \\\\cup T when S:\\n{0}\\nand T:\\nNat\\nare not both enumerable", Nat \\cup {0} = Nat)\n====',
      config: "",
    });
    expect(result.status).toBe("success");
  });

  it("formats the message of a split of Next that fails, as TLC does", async () => {
    const prints: string[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS TLC\nVARIABLE x\nInit == x = 0\nNext == \\E o \\in LET F == {s \\in SUBSET {1} : PrintT(s)} IN {<<F, F>>, 1} : x' = x\n====",
      config: "INIT Init\nNEXT Next",
      onPrint: (text) => prints.push(text),
    });
    expect([prints, result.failure?.traceOutput]).toEqual([
      ["{}", "{1}", "{}", "{1}", "{}", "{1}", "{}", "{1}"],
      ["{}", "{1}", "{}", "{1}"],
    ]);
  });

  it.each([
    [
      "PrintT",
      "PrintT(F) /\\ \\A t \\in F : t # <<7, 7>>",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 59 of module M: 1:11",
        "|line 5, col 51 to line 5, col 58 of module M: 4",
        "|line 5, col 35 to line 5, col 47 of module M: 1:8",
        "||line 5, col 36 to line 5, col 39 of module M: 1",
        "||line 5, col 45 to line 5, col 47 of module M: 1:10",
        "line 5, col 64 to line 5, col 101 of module M: 1",
        "|line 5, col 64 to line 5, col 72 of module M: 1",
        "|line 5, col 77 to line 5, col 101 of module M: 1",
        "||line 5, col 90 to line 5, col 101 of module M: 2",
        "||line 5, col 86 to line 5, col 86 of module M: 1",
      ],
    ],
    [
      "ToString",
      'ToString(F) # "" /\\ Cardinality(F) = 2',
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 59 of module M: 1:8",
        "|line 5, col 51 to line 5, col 58 of module M: 4",
        "|line 5, col 35 to line 5, col 47 of module M: 1:8",
        "||line 5, col 36 to line 5, col 39 of module M: 1",
        "||line 5, col 45 to line 5, col 47 of module M: 1:10",
        "line 5, col 64 to line 5, col 101 of module M: 1",
      ],
    ],
  ])("charges a filter's next pass after %s prints it", async (_name, body, rows) => {
    expect(
      await getNextCoverageLines(
        `x' = 0 /\\ LET F == {u \\in (0..1) \\X {1} : u[2] = 1} IN ${body}`,
      ),
    ).toEqual(rows);
  });

  it("keeps no set of a function set compared with itself in a spec with a union", async () => {
    const relations = await getCoverageLines(
      "---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nVARIABLE x\nInit == x = 0 /\\ (SUBSET {1}) \\cup (SUBSET {2}) # {}\nNext == x' = 0 /\\ LET G == [{u \\in (0..1) \\X {1} : u[1] > 5} -> {u \\in (0..1) \\X {1} : u[1] < 5}] IN G = G /\\ \\A e \\in G : e = e\nInv == TRUE\n====",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    );
    expect(relations?.at(-1)).toEqual([
      "line 5, col 9 to line 5, col 14 of module M: 1",
      "line 5, col 28 to line 5, col 97 of module M: 1:4",
      "|line 5, col 29 to line 5, col 60 of module M: 1:8",
      "||line 5, col 52 to line 5, col 59 of module M: 8",
      "||line 5, col 36 to line 5, col 48 of module M: 1:16",
      "|||line 5, col 37 to line 5, col 40 of module M: 1",
      "|||line 5, col 46 to line 5, col 48 of module M: 1:20",
      "|line 5, col 65 to line 5, col 96 of module M: 1",
      "line 5, col 102 to line 5, col 128 of module M: 1",
    ]);
  });

  it.each([
    ["a function set with it as the domain", "[F -> {1}] # {}"],
    ["its product", "LET P == F \\X {1} IN P # {}"],
    ["a record set of it", "LET P == [a : F] IN P # {}"],
  ])(
    "runs a filter's predicate again after %s is compared with the empty set in a spec with a union",
    async (_name, comparison) => {
      const prints: string[] = [];
      await check({
        source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = 0 /\\ (SUBSET {1}) \\cup (SUBSET {2}) # {} /\\ LET F == {u \\in (0..1) \\X {1} : PrintT(u)} IN ${comparison} /\\ \\A t \\in F : TRUE\n====`,
        config: "INIT Init\nNEXT Next",
        onPrint: (text) => prints.push(text),
      });
      expect(prints).toEqual(["<<0, 1>>", "<<0, 1>>", "<<1, 1>>", "<<0, 1>>", "<<1, 1>>"]);
    },
  );

  it("charges the draws of a product compared with the empty set in a spec with a union", async () => {
    const relations = await getCoverageLines(
      "---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nVARIABLE x\nInit == x = 0 /\\ (SUBSET {1}) \\cup (SUBSET {2}) # {}\nNext == x' = 0 /\\ LET P == {u \\in (0..1) \\X {1} : u[2] = 1} \\X {1} IN P # {} /\\ \\A o \\in P : TRUE\nInv == TRUE\n====",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    );
    expect(relations?.at(-1)).toEqual([
      "line 5, col 9 to line 5, col 14 of module M: 1",
      "line 5, col 28 to line 5, col 66 of module M: 1:9",
      "|line 5, col 28 to line 5, col 59 of module M: 1:3",
      "||line 5, col 51 to line 5, col 58 of module M: 3",
      "||line 5, col 35 to line 5, col 47 of module M: 1:6",
      "|||line 5, col 36 to line 5, col 39 of module M: 1",
      "|||line 5, col 45 to line 5, col 47 of module M: 1:8",
      "|line 5, col 64 to line 5, col 66 of module M: 1:5",
      "line 5, col 71 to line 5, col 97 of module M: 1",
      "|line 5, col 71 to line 5, col 76 of module M: 1",
      "|line 5, col 81 to line 5, col 97 of module M: 1",
      "||line 5, col 94 to line 5, col 97 of module M: 2",
      "||line 5, col 90 to line 5, col 90 of module M: 1",
    ]);
  });

  it("charges a filter in a function set's domain on each pass over the function set", async () => {
    expect(
      await getNextCoverageLines(
        "x' = 0 /\\ LET F == {u \\in (0..1) \\X {1} : u[2] = 1} IN LET P == [F -> {1}] IN (\\A o \\in P : TRUE) /\\ (\\A o \\in P : TRUE)",
      ),
    ).toEqual([
      "line 5, col 9 to line 5, col 14 of module M: 1",
      "line 5, col 28 to line 5, col 59 of module M: 1:10",
      "|line 5, col 51 to line 5, col 58 of module M: 6",
      "|line 5, col 35 to line 5, col 47 of module M: 1:12",
      "||line 5, col 36 to line 5, col 39 of module M: 1",
      "||line 5, col 45 to line 5, col 47 of module M: 1:16",
      "line 5, col 73 to line 5, col 82 of module M: 1:10",
      "|line 5, col 74 to line 5, col 74 of module M: 1",
      "|line 5, col 79 to line 5, col 81 of module M: 1:10",
      "line 5, col 87 to line 5, col 128 of module M: 1",
    ]);
  });

  it.each([
    ["a filter over it", "\\A o \\in {v \\in y : TRUE} : TRUE"],
    ["membership in it", "<<0, 1>> \\in y"],
  ])(
    "runs no predicate of a filter that a state holds again in %s, as TLC's fingerprint keeps the set",
    async (_name, body) => {
      const prints: string[] = [];
      await check({
        source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x, y\nInit == x = 0 /\\ y = {u \\in (0..1) \\X {1} : PrintT(<<"p", u>>)}\nNext == x' = (x + 1) % 2 /\\ y' = y /\\ PrintT(<<"n", x>>) /\\ ${body}\n====`,
        config: "INIT Init\nNEXT Next",
        onPrint: (text) => prints.push(text),
      });
      expect(prints).toEqual([
        '<<"p", <<0, 1>>>>',
        '<<"p", <<1, 1>>>>',
        '<<"n", 0>>',
        '<<"n", 1>>',
      ]);
    },
  );

  it.each([
    ["<<T, T \\X {1}>>", "y[1]", "", ['<<"p", <<0, 1>>>>', '<<"p", <<1, 1>>>>']],
    [
      "T",
      "y",
      "\nVIEW V",
      ['<<"p", <<0, 1>>>>', '<<"p", <<1, 1>>>>', '<<"p", <<0, 1>>>>', '<<"p", <<1, 1>>>>'],
    ],
  ])(
    "keeps a filter that the state %s holds once its fingerprint converts it, and only then, as TLC does",
    async (value, read, view, printed) => {
      const prints: string[] = [];
      await check({
        source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x, y\nInit == x = 0 /\\ y = (LET T == {u \\in (0..1) \\X {1} : PrintT(<<"p", u>>)} IN ${value})\nNext == x' = (x + 1) % 2 /\\ y' = y /\\ (\\A o \\in ${read} : TRUE)\nV == x\n====`,
        config: `INIT Init\nNEXT Next${view}`,
        onPrint: (text) => prints.push(text),
      });
      expect(prints).toEqual(printed);
    },
  );

  it("charges a filter that the initial state holds once, as TLC's fingerprint keeps the set", async () => {
    const relations = await getCoverageLines(
      "---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nVARIABLE x\nInit == x = {u \\in (0..1) \\X {1} : u[2] = 1}\nNext == x' = x /\\ (\\A o \\in {v \\in x : TRUE} : TRUE)\nInv == TRUE\n====",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    );
    expect(relations?.[0]).toEqual([
      "line 4, col 9 to line 4, col 44 of module M: 1",
      "|line 4, col 13 to line 4, col 44 of module M: 1:7",
      "||line 4, col 36 to line 4, col 43 of module M: 2",
      "||line 4, col 20 to line 4, col 32 of module M: 1:4",
      "|||line 4, col 21 to line 4, col 24 of module M: 1",
      "|||line 4, col 30 to line 4, col 32 of module M: 1:5",
    ]);
  });

  it.each([
    [
      "a pass in each state",
      "x' = 1 - x /\\ \\A o \\in T : TRUE",
      ["FIN", "<<0, 1>>", "<<1, 1>>", "<<0, 1>>", "<<1, 1>>"],
    ],
    [
      "passes over a filter of it",
      "x' = 0 /\\ (\\A o \\in W : TRUE) /\\ (\\A o \\in W : TRUE) /\\ (\\A o \\in T : TRUE)",
      ["FIN", "<<0, 1>>", "<<1, 1>>", "<<0, 1>>", "<<1, 1>>", "<<0, 1>>", "<<1, 1>>"],
    ],
    [
      "a comparison that keeps it",
      "x' = 1 - x /\\ T # {} /\\ \\A o \\in T : TRUE",
      ["FIN", "<<0, 1>>", "<<1, 1>>"],
    ],
    [
      "a tuple that holds one",
      "x' = 0 /\\ \\A o \\in C[1] : TRUE",
      ["FIN", "<<0, 1>>", "<<1, 1>>"],
    ],
    ["a split of Next on it", "\\E o \\in T : x' = 1 - x", ["<<0, 1>>", "<<1, 1>>", "FIN"]],
  ])(
    "runs a constant filter's predicate where TLC does in %s, as SpecProcessor keeps the filter lazy",
    async (_name, next, expected) => {
      const prints: string[] = [];
      await check({
        source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nT == {u \\in (0..1) \\X {1} : PrintT(u)}\nW == {w \\in T : TRUE}\nC == <<{u \\in (0..1) \\X {1} : PrintT(u)}>>\nInit == x = 0\nNext == ${next}\n====`,
        config: "INIT Init\nNEXT Next",
        onPrint: (text) => prints.push(text),
        onProgress: (event) => {
          if (event.kind === "initial-states-computed") prints.push("FIN");
        },
      });
      expect(prints).toEqual(expected);
    },
  );

  it("runs a constant filter's predicate again when it rebuilds the trace, as TLC does", async () => {
    const prints: string[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nT == {u \\in (0..1) \\X {1} : PrintT(u)}\nInv == x < 2\nInit == x = 0\nNext == x' = x + 1 /\\ \\A o \\in T : TRUE\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      onPrint: (text) => prints.push(text),
    });
    expect([
      prints,
      result.violation?.trace.map((step) => step.output ?? []),
      result.violation?.traceOutput,
    ]).toEqual([
      ["<<0, 1>>", "<<1, 1>>", "<<0, 1>>", "<<1, 1>>"],
      [[], ["<<0, 1>>", "<<1, 1>>"], ["<<0, 1>>", "<<1, 1>>"]],
      ["<<0, 1>>", "<<1, 1>>", "<<0, 1>>", "<<1, 1>>"],
    ]);
  });

  it.each([
    ["a literal that fails to sort", "{<<F, F>>, 1}", ["{}", "{1}", "{}", "{1}", '"n"']],
    ["a literal", "{F, {9}}", ["{}", "{1}", '"n"']],
    ["a literal in a literal", "{{F, {9}}, {8}}", ["{}", "{1}", '"n"']],
    ["a record", "[a |-> 1, b |-> {F, {9}}]", ["{}", "{1}", '"n"']],
    ["a product", "{F, {9}} \\X {1}", ["{}", "{1}", '"n"']],
    ["a record set", "[a : {F, {9}}]", ["{}", "{1}", '"n"']],
    ["a function set", "[{F, {9}} -> {1}]", ["{}", "{1}", '"n"']],
    ["a set difference", "{F, {9}} \\ {{7}}", ["{}", "{1}", "{}", "{1}", '"n"']],
    ["a SUBSET", "SUBSET {F, {9}}", ["{}", "{1}", '"n"']],
    ["a function's domain", "({F, {9}} :> 1)", ['"n"']],
    ["a Seq", "Seq({F, {9}})", ['"n"']],
    [
      "a literal before the assumptions",
      '{F, {9}}\nASSUME PrintT("assume")',
      ["{}", "{1}", '"assume"', '"n"'],
    ],
  ])(
    "sorts the literals of a constant definition as TLC starts in %s",
    async (_name, body, expected) => {
      const prints: string[] = [];
      await check({
        source: `---- MODULE M ----\nEXTENDS Integers, Sequences, TLC\nVARIABLE x\nK == LET F == {s \\in SUBSET {1} : PrintT(s)} IN ${body}\nInit == x = 0\nNext == x' = x /\\ PrintT("n")\n====`,
        config: "INIT Init\nNEXT Next",
        onPrint: (text) => prints.push(text),
      });
      expect(prints).toEqual(expected);
    },
  );

  it.each([
    [
      "a product compared with itself",
      "LET F == {u \\in (0..1) \\X {1} : u[2] = 1} IN LET P == F \\X {1} IN P = P /\\ \\E t \\in F \\cup {9} : t = t",
      [
        "line 5, col 28 to line 5, col 59 of module M: 2:17",
        "|||line 5, col 110 to line 5, col 112 of module M: 2:22",
      ],
    ],
    [
      "the filter compared with itself",
      "LET F == {u \\in (0..1) \\X {1} : u[2] = 1} IN F = F /\\ \\E t \\in F \\cup {9} : t = t",
      [
        "line 5, col 28 to line 5, col 59 of module M: 2:17",
        "|||line 5, col 89 to line 5, col 91 of module M: 2:22",
      ],
    ],
    [
      "the filter compared with itself, on the right of the union",
      "LET F == {u \\in (0..1) \\X {1} : u[2] = 1} IN F = F /\\ \\E t \\in {9} \\cup F : t = t",
      [
        "line 5, col 28 to line 5, col 59 of module M: 2:17",
        "|||line 5, col 82 to line 5, col 84 of module M: 2:22",
      ],
    ],
  ])(
    "charges the draws of a union with a filter converted by %s before sorting it fails",
    async (_name, body, rows) => {
      expect(await getNextCoverageLines(`x' = 0 /\\ ${body}`)).toEqual(
        expect.arrayContaining(rows),
      );
    },
  );

  it.each([
    [
      "a filter",
      "LET F == {u \\in (0..1) \\X {1} : PrintT(u)} IN PrintT(F = F) /\\ PrintT(<<1, 1>> \\in F)",
      ["<<0, 1>>", "<<1, 1>>", "TRUE", "TRUE"],
    ],
    [
      "a product of a filter",
      "LET F == {u \\in (0..1) \\X {1} : PrintT(u)} IN LET P == F \\X {1} IN PrintT(P = P) /\\ PrintT(<<<<1, 1>>, 1>> \\in P)",
      ["<<0, 1>>", "<<0, 1>>", "<<0, 1>>", "<<1, 1>>", "TRUE", "TRUE"],
    ],
    [
      "a filter in a set literal",
      "LET F == {u \\in SUBSET {1, 2} : PrintT(u)} IN PrintT({F} = {F}) /\\ PrintT({1} \\in F)",
      ["{}", "{1}", "{2}", "{1, 2}", "TRUE", "TRUE"],
    ],
  ])(
    "tests membership in %s that equality converts without the filter's predicate",
    async (_name, body, printed) => {
      for (const coverage of [undefined, 1]) {
        const prints: string[] = [];
        await check({
          source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = 0 /\\ ${body}\n====`,
          config: "INIT Init\nNEXT Next",
          coverage,
          onPrint: (text) => prints.push(text),
        });
        expect(prints).toEqual(printed);
      }
    },
  );

  it.each([
    [
      "S \\cup T enumerated twice",
      "LET T == {u \\in (0..1) \\X {1} : PrintT(u) /\\ FALSE} \\cup {<<9, 9>>} IN (\\A o \\in T : o # <<7, 7>>) /\\ (\\A o \\in T : o # <<7, 7>>)",
      ["<<0, 1>>", "<<1, 1>>", "<<0, 1>>", "<<1, 1>>"],
    ],
    [
      "a set enumerated twice",
      "LET T == {u \\in (0..1) \\X {1} : PrintT(u)} IN (\\A o \\in T : o # <<7, 7>>) /\\ (\\A o \\in T : o # <<7, 7>>)",
      ["<<0, 1>>", "<<1, 1>>", "<<0, 1>>", "<<1, 1>>"],
    ],
    [
      "UNION S enumerated twice",
      "LET T == UNION {{u \\in (0..1) \\X {1} : PrintT(u)}, {<<9, 9>>}} IN (\\A o \\in T : o # <<7, 7>>) /\\ (\\A o \\in T : o # <<7, 7>>)",
      ["<<0, 1>>", "<<1, 1>>", "<<0, 1>>", "<<1, 1>>", "<<0, 1>>", "<<1, 1>>"],
    ],
    [
      "S \\ T enumerated twice",
      "LET T == {u \\in (0..1) \\X {1} : PrintT(u)} \\ {<<0, 1>>} IN (\\A o \\in T : o # <<7, 7>>) /\\ (\\A o \\in T : o # <<7, 7>>)",
      ["<<0, 1>>", "<<1, 1>>", "<<0, 1>>", "<<1, 1>>"],
    ],
    [
      "S \\cup T that \\E enumerates twice",
      "LET T == {u \\in (0..1) \\X {1} : PrintT(u)} \\cup {<<9, 9>>} IN (\\E o \\in T : o = <<9, 9>>) /\\ (\\E o \\in T : o = <<9, 9>>)",
      ["<<0, 1>>", "<<1, 1>>", "<<0, 1>>", "<<1, 1>>"],
    ],
    [
      "S \\cup T enumerated and then sized",
      "LET T == {u \\in (0..1) \\X {1} : PrintT(u)} \\cup {<<9, 9>>} IN (\\A o \\in T : o # <<7, 7>>) /\\ Cardinality(T) = 3",
      ["<<0, 1>>", "<<1, 1>>", "<<0, 1>>", "<<1, 1>>"],
    ],
    [
      "S \\cup T enumerated and then printed",
      "LET T == {u \\in (0..1) \\X {1} : PrintT(u)} \\cup {<<9, 9>>} IN (\\A o \\in T : o # <<7, 7>>) /\\ PrintT(T)",
      ["<<0, 1>>", "<<1, 1>>", "<<0, 1>>", "<<1, 1>>", "{<<0, 1>>, <<1, 1>>, <<9, 9>>}"],
    ],
    [
      "S \\cup T enumerated and then chosen from",
      "LET T == {u \\in (0..1) \\X {1} : PrintT(u)} \\cup {<<9, 9>>} IN (\\A o \\in T : o # <<7, 7>>) /\\ (CHOOSE o \\in T : TRUE) = <<0, 1>>",
      ["<<0, 1>>", "<<1, 1>>", "<<0, 1>>", "<<1, 1>>"],
    ],
  ])(
    "runs the predicate of a filter in %s on each pass, as TLC does",
    async (_name, body, printed) => {
      const prints: string[] = [];
      await check({
        source: `---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = 0 /\\ ${body}\n====`,
        config: "INIT Init\nNEXT Next",
        onPrint: (text) => prints.push(text),
      });
      expect(prints).toEqual(printed);
    },
  );

  it("runs the predicate of a filter that reaches another filter's base through x' on each pass, as TLC does", async () => {
    const prints: string[] = [];
    await check({
      source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = {u \\in (0..1) \\X {1} : PrintT(u)} /\\ LET T == {w \\in x' : TRUE} IN (\\A o \\in T : o # <<7, 7>>) /\\ (\\A o \\in T : o # <<7, 7>>)\n====`,
      config: "INIT Init\nNEXT Next",
      onPrint: (text) => prints.push(text),
    });
    expect(prints).toEqual(Array.from({ length: 6 }, () => ["<<0, 1>>", "<<1, 1>>"]).flat());
  });

  it.each([
    [
      "S \\cup T",
      "LET T == {u \\in ((0..1) \\X {1}) \\cup {<<5, 5>>} : FALSE} \\cup {9} IN (\\A o \\in T : o # 0) /\\ (\\A o \\in T : o # 0)",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 83 of module M: 1",
        "|line 5, col 28 to line 5, col 74 of module M: 1:6",
        "||line 5, col 69 to line 5, col 73 of module M: 6",
        "||line 5, col 35 to line 5, col 65 of module M: 1",
        "|||line 5, col 36 to line 5, col 48 of module M: 1:8",
        "||||line 5, col 37 to line 5, col 40 of module M: 1",
        "||||line 5, col 46 to line 5, col 48 of module M: 1:10",
        "|||line 5, col 56 to line 5, col 65 of module M: 1:16",
        "||||line 5, col 57 to line 5, col 64 of module M: 1",
        "|line 5, col 81 to line 5, col 83 of module M: 1:14",
        "line 5, col 88 to line 5, col 131 of module M: 1",
      ],
    ],
    [
      "S \\cup T with a predicate that reads its element",
      "LET T == {u \\in ((0..1) \\X {1}) \\cup {<<5, 5>>} : u[1] = 7} \\cup {9} IN (\\A o \\in T : o # 0) /\\ (\\A o \\in T : o # 0)",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 86 of module M: 1",
        "|line 5, col 28 to line 5, col 77 of module M: 1:6",
        "||line 5, col 69 to line 5, col 76 of module M: 6",
        "||line 5, col 35 to line 5, col 65 of module M: 1",
        "|||line 5, col 36 to line 5, col 48 of module M: 1:8",
        "||||line 5, col 37 to line 5, col 40 of module M: 1",
        "||||line 5, col 46 to line 5, col 48 of module M: 1:10",
        "|||line 5, col 56 to line 5, col 65 of module M: 1:16",
        "||||line 5, col 57 to line 5, col 64 of module M: 1",
        "|line 5, col 84 to line 5, col 86 of module M: 1:14",
        "line 5, col 91 to line 5, col 134 of module M: 1",
      ],
    ],
    [
      "a set",
      "LET T == {u \\in ((0..1) \\X {1}) \\cup {<<5, 5>>} : u[1] = 0} IN (\\A o \\in T : o # <<9, 9>>) /\\ (\\A o \\in T : o # <<9, 9>>)",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 28 to line 5, col 77 of module M: 1:12",
        "|line 5, col 69 to line 5, col 76 of module M: 6",
        "|line 5, col 35 to line 5, col 65 of module M: 1",
        "||line 5, col 36 to line 5, col 48 of module M: 1:8",
        "|||line 5, col 37 to line 5, col 40 of module M: 1",
        "|||line 5, col 46 to line 5, col 48 of module M: 1:10",
        "||line 5, col 56 to line 5, col 65 of module M: 1:16",
        "|||line 5, col 57 to line 5, col 64 of module M: 1",
        "line 5, col 82 to line 5, col 139 of module M: 1",
      ],
    ],
  ])("charges each of two passes over a filter in %s, as TLC does", async (_name, body, rows) => {
    expect(await getNextCoverageLines(`x' = 0 /\\ ${body}`)).toEqual(rows);
  });

  it("counts an operator argument that a filter's membership test forces", async () => {
    expect(
      await getNextCoverageLines(
        "x' = 0 /\\ LET G(a) == {9} \\cup {o \\in Nat : o > 1 /\\ o = a} IN \\A oi \\in {1, 2, 3} : oi \\in G(oi) \\/ TRUE",
      ),
    ).toEqual([
      "line 5, col 9 to line 5, col 14 of module M: 1",
      "line 5, col 72 to line 5, col 113 of module M: 1",
      "|line 5, col 94 to line 5, col 113 of module M: 3",
      "||line 5, col 94 to line 5, col 105 of module M: 3",
      "|||line 5, col 94 to line 5, col 95 of module M: 3",
      "|||line 5, col 101 to line 5, col 105 of module M: 3",
      "||||line 5, col 31 to line 5, col 67 of module M: 3",
      "||||line 5, col 103 to line 5, col 104 of module M: 2",
      "||line 5, col 110 to line 5, col 113 of module M: 1",
      "|line 5, col 82 to line 5, col 90 of module M: 1:4",
    ]);
  });

  it("counts an operator argument that a filter's membership test forces under a prime", async () => {
    expect(
      await getNextCoverageLines(
        "x' = 0 /\\ (LET G(a) == {9} \\cup {o \\in Nat : o > 1 /\\ o = a} IN \\A oi \\in {1, 2, 3} : oi \\in G(oi) \\/ TRUE)'",
      ),
    ).toEqual([
      "line 5, col 9 to line 5, col 14 of module M: 1",
      "line 5, col 19 to line 5, col 116 of module M: 1",
      "|line 5, col 73 to line 5, col 114 of module M: 1",
      "||line 5, col 95 to line 5, col 114 of module M: 3",
      "|||line 5, col 95 to line 5, col 106 of module M: 3",
      "||||line 5, col 95 to line 5, col 96 of module M: 3",
      "||||line 5, col 102 to line 5, col 106 of module M: 3",
      "|||||line 5, col 32 to line 5, col 68 of module M: 3",
      "|||||line 5, col 104 to line 5, col 105 of module M: 2",
      "|||line 5, col 111 to line 5, col 114 of module M: 1",
      "||line 5, col 83 to line 5, col 91 of module M: 1:4",
    ]);
  });

  it.each([
    [
      "S \\cup T",
      "\\A o \\in {9} \\cup {u \\in ((0..1) \\X {1}) \\cup {<<5, 5>>} : FALSE} : o # 0",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 91 of module M: 1",
        "|line 5, col 87 to line 5, col 91 of module M: 1",
        "|line 5, col 28 to line 5, col 83 of module M: 1",
        "||line 5, col 28 to line 5, col 30 of module M: 1:7",
        "||line 5, col 37 to line 5, col 83 of module M: 1:3",
        "|||line 5, col 78 to line 5, col 82 of module M: 3",
        "|||line 5, col 44 to line 5, col 74 of module M: 1",
        "||||line 5, col 45 to line 5, col 57 of module M: 1:4",
        "|||||line 5, col 46 to line 5, col 49 of module M: 1",
        "|||||line 5, col 55 to line 5, col 57 of module M: 1:5",
        "||||line 5, col 65 to line 5, col 74 of module M: 1:8",
        "|||||line 5, col 66 to line 5, col 73 of module M: 1",
      ],
    ],
    [
      "UNION S",
      "\\A o \\in {u \\in UNION {[a : {p}] : p \\in {1, 2}} : FALSE} \\cup {9} : o # 0",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 92 of module M: 1",
        "|line 5, col 88 to line 5, col 92 of module M: 1",
        "|line 5, col 28 to line 5, col 84 of module M: 1",
        "||line 5, col 28 to line 5, col 75 of module M: 1:2",
        "|||line 5, col 70 to line 5, col 74 of module M: 2",
        "|||line 5, col 35 to line 5, col 66 of module M: 1",
        "||||line 5, col 41 to line 5, col 66 of module M: 1:6",
        "|||||line 5, col 42 to line 5, col 50 of module M: 2:7",
        "||||||line 5, col 47 to line 5, col 49 of module M: 2:6",
        "|||||||line 5, col 48 to line 5, col 48 of module M: 2",
        "|||||line 5, col 60 to line 5, col 65 of module M: 1:3",
        "||line 5, col 82 to line 5, col 84 of module M: 1:7",
      ],
    ],
    [
      "S \\cup T before the other operand",
      "\\A o \\in {u \\in ((0..1) \\X {1}) \\cup {<<5, 5>>} : FALSE} \\cup {9} : o # 0",
      [
        "line 5, col 9 to line 5, col 14 of module M: 1",
        "line 5, col 19 to line 5, col 91 of module M: 1",
        "|line 5, col 87 to line 5, col 91 of module M: 1",
        "|line 5, col 28 to line 5, col 83 of module M: 1",
        "||line 5, col 28 to line 5, col 74 of module M: 1:3",
        "|||line 5, col 69 to line 5, col 73 of module M: 3",
        "|||line 5, col 35 to line 5, col 65 of module M: 1",
        "||||line 5, col 36 to line 5, col 48 of module M: 1:4",
        "|||||line 5, col 37 to line 5, col 40 of module M: 1",
        "|||||line 5, col 46 to line 5, col 48 of module M: 1:5",
        "||||line 5, col 56 to line 5, col 65 of module M: 1:8",
        "|||||line 5, col 57 to line 5, col 64 of module M: 1",
        "||line 5, col 81 to line 5, col 83 of module M: 1:7",
      ],
    ],
  ])(
    "charges the draw that finds the end of %s under a filter that a union streams",
    async (_name, body, rows) => {
      expect(await getNextCoverageLines(`x' = 0 /\\ ${body}`)).toEqual(rows);
    },
  );

  it.each([
    [
      "CHOOSE",
      "CHOOSE y \\in s : y[1] > 5",
      [
        "line 5, col 64 to line 5, col 88 of module M: 2",
        "|line 5, col 81 to line 5, col 88 of module M: 4",
        "|line 5, col 77 to line 5, col 77 of module M: 2",
      ],
      16,
    ],
    [
      "Cardinality",
      "1 \\div (Cardinality(s) - 2) = 0",
      ["line 5, col 64 to line 5, col 94 of module M: 2"],
      10,
    ],
  ])(
    "counts a filter in TLC's replay of a failed %s for its call stack, as CallStackTool copies a SetPredValue with its cost model",
    async (_name, body, rows, cost) => {
      const lines = await getNextCoverageLines(
        `x' = 0 /\\ LET s == {u \\in (0..2) \\X {1} : u[1] > 0} IN ${body}`,
      );
      expect(lines).toEqual([
        "line 5, col 9 to line 5, col 14 of module M: 0",
        `line 5, col 28 to line 5, col 59 of module M: 2:${cost}`,
        "|line 5, col 51 to line 5, col 58 of module M: 6",
        "|line 5, col 35 to line 5, col 47 of module M: 2:12",
        "||line 5, col 36 to line 5, col 39 of module M: 2",
        "||line 5, col 45 to line 5, col 47 of module M: 2:14",
        ...rows,
      ]);
    },
  );

  it("charges the domain of the copy EXCEPT makes of a recursive function when TLC fingerprints a state holding it, as FcnParams#elements charges each bound set", async () => {
    const lines = await getCoverageLines(
      "---- MODULE M ----\nEXTENDS Naturals\nVARIABLES x, y\ng[n \\in {0, 1, 2}] == IF n = 0 THEN x ELSE g[n - 1] + 1\nInit == x = 0 /\\ y = <<>>\nNext == x < 2 /\\ x' = x + 1 /\\ y' = <<[g EXCEPT ![1] = 7]>>\n====",
      "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
    );
    expect(lines?.[1]).toEqual([
      "line 6, col 9 to line 6, col 13 of module M: 2",
      "|line 6, col 9 to line 6, col 9 of module M: 3",
      "line 6, col 18 to line 6, col 27 of module M: 2",
      "line 6, col 32 to line 6, col 59 of module M: 2",
      "|line 6, col 37 to line 6, col 59 of module M: 2",
      "||line 6, col 39 to line 6, col 57 of module M: 2",
      "|||line 6, col 40 to line 6, col 40 of module M: 2",
      "||||line 4, col 1 to line 4, col 55 of module M: 2:6",
      "|||||line 4, col 23 to line 4, col 55 of module M: 16",
      "||||||line 4, col 26 to line 4, col 30 of module M: 16",
      "||||||line 4, col 37 to line 4, col 37 of module M: 8",
      "||||||line 4, col 44 to line 4, col 55 of module M: 8",
      "|||||line 4, col 9 to line 4, col 17 of module M: 2:8",
    ]);
  });

  it.each([
    ["an EXCEPT copy of it", "[g EXCEPT ![1] = 7]", ["1", "0", "1", "2"]],
    ["a copy of that copy", "[[g EXCEPT ![1] = 7] EXCEPT ![0] = 8]", ["1", "0", "0", "1", "2"]],
  ])(
    "evaluates the body of a recursive function at each key in order when TLC fingerprints a state holding %s, as FcnLambdaValue#toFcnRcd does",
    async (_title, copy, expected) => {
      const prints: string[] = [];
      await check({
        source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLES x, y\ng[n \\in 0..2] == IF n < 0 THEN g[0] ELSE x + n + (IF PrintT(n) THEN 0 ELSE 1)\nInit == x = 0 /\\ y = <<>>\nNext == x < 1 /\\ x' = x + 1 /\\ y' = <<${copy}>>\n====`,
        config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
        onPrint: (text) => prints.push(text),
      });
      expect(prints).toEqual(expected);
    },
  );

  it.each([
    [
      "a constant domain",
      "VARIABLE v\nfib[n \\in 0..3] == IF n < 2 THEN n ELSE fib[n - 1] + fib[n - 2]",
      ["line 7, col 8 to line 7, col 17 of module M: 2"],
    ],
    [
      "a domain that reads a variable",
      "VARIABLE v\nfib[n \\in 0..(v + 3)] == IF n < 2 THEN n ELSE fib[n - 1] + fib[n - 2]",
      [
        "line 7, col 8 to line 7, col 17 of module M: 2",
        "|line 7, col 8 to line 7, col 13 of module M: 2",
        "||line 7, col 8 to line 7, col 10 of module M: 2",
        "|||line 4, col 1 to line 4, col 69 of module M: 2:4",
        "||||line 4, col 26 to line 4, col 69 of module M: 10",
        "|||||line 4, col 29 to line 4, col 33 of module M: 10",
        "|||||line 4, col 40 to line 4, col 40 of module M: 7",
        "|||||line 4, col 47 to line 4, col 69 of module M: 3",
        "||||line 4, col 11 to line 4, col 20 of module M: 2",
      ],
    ],
  ])(
    "counts no evaluation of %s when TLC replays an invariant that applies a recursive function outside it, as the replay keeps the function's domain",
    async (_title, definitions, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE M ----\nEXTENDS Integers\n${definitions}\nInit == v = 0\nNext == UNCHANGED v\nInv == fib[7] = 1\n====`,
        "INIT Init\nNEXT Next\nINVARIANT Inv",
      );
      expect(lines?.[2]).toEqual(expected);
    },
  );

  it("counts no node for the reference that applies a recursive function a parameterized instance copies", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nJ(p) == INSTANCE Inner\nVARIABLE x\nInit == x = J(1)!r[2]\nNext == UNCHANGED x\n====",
      config: "INIT Init\nNEXT Next",
      coverage: 1,
      loadModule: (name) =>
        name === "Inner"
          ? "---- MODULE Inner ----\nEXTENDS Naturals\nr[n \\in 0..2] == IF n = 0 THEN 0 ELSE r[n - 1] + 1\n===="
          : undefined,
    });
    expect(formatCoverage(result)?.[0]).toEqual([
      "line 5, col 9 to line 5, col 21 of module M: 1",
      "|line 5, col 13 to line 5, col 21 of module M: 1",
      "||line 5, col 13 to line 5, col 18 of module M: 1",
      "|||line 3, col 1 to line 3, col 50 of module Inner: 1",
      "||||line 3, col 18 to line 3, col 50 of module Inner: 3",
      "|||||line 3, col 21 to line 3, col 25 of module Inner: 3",
      "|||||line 3, col 39 to line 3, col 50 of module Inner: 2",
      "||||line 3, col 9 to line 3, col 12 of module Inner: 1",
    ]);
  });

  it.each([
    [
      "the invariants of an initial state",
      'Init == x \\in 0..1\nNext == UNCHANGED x\nInvPrint == PrintT(<<"inv", x>>)\nInvLim == x <= 0\nInvAfter == PrintT(<<"after", x>>)',
      "INIT Init\nNEXT Next\nINVARIANT InvPrint\nINVARIANT InvLim\nINVARIANT InvAfter",
      ['<<"inv", 0>>', '<<"after", 0>>', '<<"inv", 1>>'],
    ],
    [
      "the invariants of a successor",
      'Init == x = 0\nNext == x < 3 /\\ x\' = x + 1\nInvP == PrintT(<<"inv", x>>) /\\ x <= 1\nInvAfter == PrintT(<<"after", x>>)',
      "INIT Init\nNEXT Next\nINVARIANT InvP\nINVARIANT InvAfter",
      ['<<"inv", 0>>', '<<"after", 0>>', '<<"inv", 1>>', '<<"after", 1>>', '<<"inv", 2>>'],
    ],
    [
      "the implied initial predicates",
      'Init == x \\in 0..1\nNext == UNCHANGED x\nSpec == Init /\\ [][Next]_x\nP1 == PrintT(<<"p", x>>)\nP2 == x <= 0',
      "SPECIFICATION Spec\nPROPERTY P1\nPROPERTY P2",
      ['<<"p", 0>>', '<<"p", 1>>'],
    ],
    [
      "the action properties",
      "Init == x = 0\nNext == x < 3 /\\ x' = x + 1\nSpec == Init /\\ [][Next]_x\nP1 == [][PrintT(<<\"a\", x, x'>>)]_x\nP2 == [][x' <= 1]_x",
      "SPECIFICATION Spec\nPROPERTY P1\nPROPERTY P2",
      ['<<"a", 0, 1>>', '<<"a", 1, 2>>'],
    ],
  ])(
    "evaluates %s once each under coverage, as TLC does",
    async (_name, definitions, config, expected) => {
      const printed: string[] = [];
      await check({
        source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\n${definitions}\n====`,
        config,
        coverage: 1,
        onPrint: (text) => printed.push(text),
      });
      expect(printed).toEqual(expected);
    },
  );

  it("counts a selection in the initial predicate as a node of its own, as SANY's $Nop is in TLC's cost model", async () => {
    const lines = await getCoverageLines(
      "---- MODULE S ----\nEXTENDS Integers\nVARIABLE x, y\nSets == {1, 2, 3} \\cup {4}\nInit == x \\in Sets!<< /\\ y \\in Sets!1\nNext == UNCHANGED <<x, y>>\n====",
      "INIT Init\nNEXT Next",
    );
    expect(lines?.[0]).toEqual([
      "line 5, col 15 to line 5, col 21 of module S: 1",
      "|line 4, col 9 to line 4, col 17 of module S: 1:4",
      "line 5, col 26 to line 5, col 37 of module S: 9",
      "|line 5, col 32 to line 5, col 37 of module S: 3",
      "||line 4, col 9 to line 4, col 17 of module S: 3:12",
    ]);
  });

  it("takes a selection in the next-state relation as an action of its own, as TLC's Tool#getActions does with SANY's $Nop", async () => {
    const result = await check({
      source:
        "---- MODULE A ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nAct == \\/ x < 2 /\\ x' = x + 1\n       \\/ x = 2 /\\ x' = 0\nNext == Act!1 \\/ Act!2\n====",
      config: "INIT Init\nNEXT Next",
      coverage: 1,
    });
    expect(result.coverage?.relations.map((relation) => relation.label)).toEqual([
      "Init line 4, col 1 to line 4, col 4 of module A",
      "Next line 7, col 1 to line 7, col 4 of module A (7 9 7 13)",
      "Next line 7, col 1 to line 7, col 4 of module A (7 18 7 22)",
    ]);
  });

  it("names the action a selection with parameters gives LAMBDA, as SANY selects it as a LAMBDA it applies", async () => {
    const result = await check({
      source:
        "---- MODULE L ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nH == \\E k \\in 1..2 : x' = x + k\nNext == H!(1) \\/ H!(2)\nInv == x < 3\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    });
    expect(result.violation?.trace.map((step) => step.label)).toEqual([
      undefined,
      "LAMBDA(1) line 5, col 22 to line 5, col 31 of module L",
      "LAMBDA(2) line 5, col 22 to line 5, col 31 of module L",
    ]);
  });

  it("counts the operand a selection with parameters selects only where it applies it, as SANY's LAMBDA is no LET definition", async () => {
    const lines = await getCoverageLines(
      "---- MODULE G ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nA(k) == /\\ x < 2\n        /\\ x' = x + k\nNext == A(1)!1 /\\ A(1)!2\n====",
      "INIT Init\nNEXT Next",
    );
    expect(lines?.[1]).toEqual([
      "line 5, col 12 to line 5, col 16 of module G: 6",
      "|line 5, col 12 to line 5, col 12 of module G: 7",
      "line 7, col 19 to line 7, col 24 of module G: 6",
    ]);
  });

  it("locates the relation of a selection with parameters where SANY applies its LAMBDA", async () => {
    const result = await check({
      source:
        "---- MODULE P ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 3\nP == \\A e \\in 0..2 : e # x + 3\nInv == P!(1)\nProp == [](P!(0))\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nPROPERTY Prop",
      coverage: 1,
    });
    expect(result.coverage?.relations.map((relation) => relation.label)).toEqual([
      "Init line 4, col 1 to line 4, col 4 of module P",
      "Next line 5, col 1 to line 5, col 4 of module P",
      "Inv line 7, col 1 to line 7, col 3 of module P",
      "Action line 8, col 12 to line 8, col 16 of module P",
    ]);
  });

  it.each([
    [
      "I == INSTANCE Inner WITH K <- M + 1, w <- y",
      "I!A",
      "I!Q /\\ I!G >= 0",
      [
        "line 5, col 1 to line 5, col 43 of module E: 15",
        "line 5, col 31 to line 5, col 35 of module E: 21",
        "line 5, col 43 to line 5, col 43 of module E: 3",
      ],
      [
        "line 8, col 8 to line 8, col 22 of module E: 3",
        "|line 8, col 8 to line 8, col 10 of module E: 3",
        "||line 6, col 6 to line 6, col 42 of module Inner: 3",
        "|||line 6, col 24 to line 6, col 42 of module Inner: 6",
        "|||line 6, col 15 to line 6, col 20 of module Inner: 3:9",
        "|line 8, col 15 to line 8, col 22 of module E: 3",
        "||line 8, col 15 to line 8, col 17 of module E: 3",
        "|||line 5, col 1 to line 5, col 43 of module E: 6",
        "|||line 5, col 31 to line 5, col 35 of module E: 5",
        "|||line 7, col 6 to line 7, col 27 of module Inner: 3",
        "||||line 7, col 9 to line 7, col 13 of module Inner: 3",
        "||||line 7, col 20 to line 7, col 20 of module Inner: 2",
      ],
    ],
    [
      "INSTANCE Inner WITH K <- M + 1, w <- y",
      "A",
      "Q /\\ G >= 0",
      [
        "line 5, col 1 to line 5, col 38 of module E: 15",
        "line 5, col 26 to line 5, col 30 of module E: 21",
        "line 5, col 38 to line 5, col 38 of module E: 3",
      ],
      [
        "line 8, col 8 to line 8, col 18 of module E: 3",
        "|line 8, col 8 to line 8, col 8 of module E: 3",
        "||line 6, col 6 to line 6, col 42 of module Inner: 3",
        "|||line 6, col 24 to line 6, col 42 of module Inner: 6",
        "|||line 6, col 15 to line 6, col 20 of module Inner: 3:9",
        "|line 8, col 13 to line 8, col 18 of module E: 3",
        "||line 8, col 13 to line 8, col 13 of module E: 3",
        "|||line 5, col 1 to line 5, col 38 of module E: 6",
        "|||line 5, col 26 to line 5, col 30 of module E: 5",
        "|||line 7, col 6 to line 7, col 27 of module Inner: 3",
        "||||line 7, col 9 to line 7, col 13 of module Inner: 3",
        "||||line 7, col 20 to line 7, col 20 of module Inner: 2",
      ],
    ],
  ])(
    "counts each substitution of %s as a node, at each reference in an action and once in an invariant, as TLC's cost model does",
    async (instance, next, invariant, substitutions, invariantLines) => {
      const lines = formatCoverage(await getInstanceCoverage(instance, next, invariant));
      expect(lines?.[1]).toEqual([
        ...substitutions,
        "line 6, col 24 to line 6, col 42 of module Inner: 6",
        "line 6, col 15 to line 6, col 20 of module Inner: 3:9",
        "line 9, col 9 to line 9, col 24 of module Inner: 3",
        "line 10, col 9 to line 10, col 14 of module Inner: 3",
      ]);
      expect(lines?.[2]).toEqual(invariantLines);
    },
  );

  it("counts no node for the parameters an instance passes to the definitions it copies, as SANY's definitions take none", async () => {
    const lines = formatCoverage(
      await getInstanceCoverage(
        "I(p, q) == INSTANCE Inner WITH K <- p + q, w <- y",
        "\\E p \\in {1, 2} : I(p, M)!A",
        "I(1, 1)!Q /\\ I(M, 0)!G >= 0",
      ),
    );
    expect(lines?.[2]).toEqual([
      "line 8, col 8 to line 8, col 34 of module E: 3",
      "|line 8, col 8 to line 8, col 16 of module E: 3",
      "||line 6, col 6 to line 6, col 42 of module Inner: 3",
      "|||line 6, col 24 to line 6, col 42 of module Inner: 6",
      "|||line 6, col 15 to line 6, col 20 of module Inner: 3:9",
      "|line 8, col 21 to line 8, col 34 of module E: 3",
      "||line 8, col 21 to line 8, col 29 of module E: 3",
      "|||line 5, col 1 to line 5, col 49 of module E: 6",
      "|||line 5, col 37 to line 5, col 41 of module E: 5",
      "|||line 7, col 6 to line 7, col 27 of module Inner: 3",
      "||||line 7, col 9 to line 7, col 13 of module Inner: 3",
      "||||line 7, col 20 to line 7, col 20 of module Inner: 2",
      "|||line 8, col 23 to line 8, col 23 of module E: 2",
    ]);
  });

  it("counts the variables a LET instance substitutes with its parameters, which its actions assign and keep unchanged", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLES x, y\nInit == x = 0 /\\ y \\in {0, 1}\nNext == LET L(w) == INSTANCE C WITH v <- w\n            K(w) == INSTANCE C WITH v <- <<w, y>>\n        IN \\/ L(x)!Inc /\\ L(y)!Stay\n           \\/ L(y)!IncIn /\\ L(x)!StayAll\n           \\/ K(x)!Stay /\\ TRUE\nInv == ~(x = 2 /\\ y = 2)\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      coverage: 1,
      loadModule: (name) =>
        name === "C"
          ? "---- MODULE C ----\nEXTENDS Naturals\nVARIABLE v\nInc == v' = (v + 1) % 3\nIncIn == v' \\in {(v + 1) % 3}\nStay == UNCHANGED v\nStayAll == UNCHANGED <<v>>\n===="
          : undefined,
    });
    expect([
      result.status,
      result.generatedStates,
      result.distinctStates,
      formatCoverage(result),
    ]).toEqual([
      "invariant-violation",
      22,
      9,
      [
        [
          "line 4, col 18 to line 4, col 29 of module M: 6",
          "|line 4, col 24 to line 4, col 29 of module M: 3:9",
        ],
        [
          "line 7, col 15 to line 7, col 22 of module M: 13",
          "line 5, col 42 to line 5, col 42 of module M: 13",
          "line 6, col 9 to line 6, col 19 of module C: 13",
        ],
        [
          "line 5, col 10 to line 5, col 29 of module C: 8",
          "|line 5, col 17 to line 5, col 29 of module C: 9:17",
          "||line 5, col 18 to line 5, col 28 of module C: 9",
          "line 8, col 17 to line 8, col 17 of module M: 9",
          "line 5, col 42 to line 5, col 42 of module M: 9",
          "line 7, col 12 to line 7, col 26 of module C: 8",
        ],
        [
          "line 6, col 9 to line 6, col 19 of module C: 12",
          "line 9, col 28 to line 9, col 31 of module M: 6",
        ],
        [
          "line 10, col 8 to line 10, col 24 of module M: 9",
          "|line 10, col 10 to line 10, col 23 of module M: 9",
          "||line 10, col 10 to line 10, col 14 of module M: 9",
          "||line 10, col 19 to line 10, col 23 of module M: 3",
        ],
      ],
    ]);
  });

  it("counts the substitution a recursive function of an instance reads when it is applied, as its FcnLambdaValue keeps the substitution's LazyValue", async () => {
    const lines = await getCoverageLines(
      "---- MODULE C ----\nEXTENDS Naturals\nVARIABLE x\n---- MODULE Inner ----\nEXTENDS Naturals\nCONSTANT c\nr[n \\in 0..2] == IF n = 0 THEN c ELSE r[n - 1] + 1\n====\nI(p) == INSTANCE Inner WITH c <- p + x\nJ == INSTANCE Inner WITH c <- 1 + x\nInit == x = 0\nNext == x < 2 /\\ x' = I(1)!r[2] + J!r[1] + x\n====",
      "INIT Init\nNEXT Next",
    );
    expect(lines?.[1]).toEqual([
      "line 12, col 9 to line 12, col 13 of module C: 3",
      "|line 12, col 9 to line 12, col 9 of module C: 4",
      "line 12, col 18 to line 12, col 44 of module C: 3",
      "|line 12, col 23 to line 12, col 44 of module C: 3",
      "||line 12, col 23 to line 12, col 40 of module C: 3",
      "|||line 12, col 23 to line 12, col 31 of module C: 3",
      "||||line 12, col 23 to line 12, col 28 of module C: 3",
      "|||||line 9, col 34 to line 9, col 38 of module C: 3",
      "|||||line 7, col 1 to line 7, col 50 of module C: 3",
      "||||||line 7, col 18 to line 7, col 50 of module C: 9",
      "|||||||line 7, col 21 to line 7, col 25 of module C: 9",
      "|||||||line 7, col 32 to line 7, col 32 of module C: 3",
      "|||||||line 7, col 39 to line 7, col 50 of module C: 6",
      "||||||line 7, col 9 to line 7, col 12 of module C: 3",
      "|||line 12, col 35 to line 12, col 40 of module C: 3",
      "||||line 12, col 35 to line 12, col 37 of module C: 3",
      "|||||line 10, col 31 to line 10, col 35 of module C: 3",
      "|||||line 7, col 1 to line 7, col 50 of module C: 3",
      "||||||line 7, col 18 to line 7, col 50 of module C: 6",
      "|||||||line 7, col 21 to line 7, col 25 of module C: 6",
      "|||||||line 7, col 32 to line 7, col 32 of module C: 3",
      "|||||||line 7, col 39 to line 7, col 50 of module C: 3",
      "||||||line 7, col 9 to line 7, col 12 of module C: 3",
      "||line 12, col 44 to line 12, col 44 of module C: 3",
    ]);
  });

  it("counts the substitution a recursive function of an instance reads in the call-stack replay, which counts nothing else in the body", async () => {
    const lines = await getCoverageLines(
      "---- MODULE D ----\nEXTENDS Naturals\nVARIABLE x\n---- MODULE Inner ----\nEXTENDS Naturals\nCONSTANT c\nr[n \\in 0..2] == IF n = 0 THEN c ELSE r[n - 1] + (n = 1) * 0\n====\nI(p) == INSTANCE Inner WITH c <- p\nInit == x = I(1)!r[2]\nNext == UNCHANGED x\n====",
      "INIT Init\nNEXT Next",
    );
    expect(lines?.[0]).toEqual([
      "line 10, col 13 to line 10, col 21 of module D: 2",
      "|line 10, col 13 to line 10, col 18 of module D: 2",
      "||line 9, col 34 to line 9, col 34 of module D: 2",
      "||line 7, col 1 to line 7, col 60 of module D: 2",
      "|||line 7, col 18 to line 7, col 60 of module D: 3",
      "||||line 7, col 21 to line 7, col 25 of module D: 3",
      "||||line 7, col 32 to line 7, col 32 of module D: 1",
      "||||line 7, col 39 to line 7, col 60 of module D: 2",
      "|||||line 7, col 39 to line 7, col 46 of module D: 2",
      "|||||line 7, col 50 to line 7, col 60 of module D: 1",
      "|||line 7, col 9 to line 7, col 12 of module D: 2",
    ]);
  });

  it.each([
    [
      "an initial state",
      2,
      [
        "line 5, col 9 to line 5, col 16 of module R: 2",
        "|line 5, col 13 to line 5, col 16 of module R: 2",
        "||line 4, col 13 to line 4, col 62 of module R: 2:6",
        "|||line 4, col 30 to line 4, col 62 of module R: 12",
        "||||line 4, col 33 to line 4, col 37 of module R: 12",
        "||||line 4, col 44 to line 4, col 44 of module R: 6",
        "||||line 4, col 51 to line 4, col 62 of module R: 6",
        "|||line 4, col 21 to line 4, col 24 of module R: 2",
        "||line 4, col 67 to line 4, col 67 of module R: 2",
      ],
    ],
    [
      "a successor",
      1,
      [
        "line 5, col 9 to line 5, col 16 of module R: 3",
        "|line 5, col 13 to line 5, col 16 of module R: 3",
        "||line 4, col 13 to line 4, col 62 of module R: 3:9",
        "|||line 4, col 30 to line 4, col 62 of module R: 18",
        "||||line 4, col 33 to line 4, col 37 of module R: 18",
        "||||line 4, col 44 to line 4, col 44 of module R: 9",
        "||||line 4, col 51 to line 4, col 62 of module R: 9",
        "|||line 4, col 21 to line 4, col 24 of module R: 3",
        "||line 4, col 67 to line 4, col 67 of module R: 3",
      ],
    ],
  ])(
    "enumerates a recursive function again as the trace to a deadlock at %s fingerprints each initial state it rebuilds",
    async (_title, start, expected) => {
      const lines = await getCoverageLines(
        `---- MODULE R ----\nEXTENDS Naturals\nVARIABLE x\nF(c) == LET r[n \\in 0..2] == IF n = 0 THEN c ELSE r[n - 1] + 1 IN r\nInit == x = F(${start})\nNext == x[1] < 3 /\\ x' = [x EXCEPT ![1] = 5]\n====`,
        "INIT Init\nNEXT Next",
      );
      expect(lines?.[0]).toEqual(expected);
    },
  );

  it("prints what a recursive function a deadlocked initial state holds prints again after the trace, as the rebuild fingerprints it", async () => {
    const result = await check({
      source:
        "---- MODULE P ----\nEXTENDS Naturals, TLC\nVARIABLE x\nF(c) == LET r[n \\in 0..1] == Print(n, IF n = 0 THEN c ELSE r[n - 1] + 1) IN r\nInit == x = F(2)\nNext == x[1] < 3 /\\ x' = x\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect(result.violation?.traceOutput).toEqual(["0  2", "0  2", "1  3"]);
  });

  it("counts the substitutions of a LET INSTANCE under the operator it copies, at the name each one replaces, as SANY builds a SubstInNode there too", async () => {
    const result = await check({
      source:
        "---- MODULE E ----\nEXTENDS Naturals\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == LET I == INSTANCE Inner WITH a <- x + 0 IN I!P /\\ x' = x + 1 /\\ y' = y\nInv == LET J == INSTANCE Inner WITH a <- y IN J!P\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      coverage: 1,
      loadModule: (name) =>
        name === "Inner"
          ? "---- MODULE Inner ----\nEXTENDS Naturals\nVARIABLE a\nA == a' = a + 1\nP == a < 3\n===="
          : undefined,
    });
    expect(formatCoverage(result)?.slice(1)).toEqual([
      [
        "line 5, col 43 to line 5, col 47 of module E: 10",
        "line 5, col 6 to line 5, col 10 of module Inner: 9",
        "|line 5, col 6 to line 5, col 6 of module Inner: 10",
        "line 5, col 59 to line 5, col 68 of module E: 9",
        "line 5, col 73 to line 5, col 78 of module E: 9",
      ],
      [
        "line 5, col 6 to line 5, col 10 of module Inner: 4",
        "line 6, col 47 to line 6, col 49 of module E: 4",
      ],
    ]);
  });

  it("counts each substitution a name passes through in an instance of an instance, as TLC evaluates the LazyValue of each", async () => {
    const lines = await getCoverageLines(
      "---- MODULE N ----\nEXTENDS Naturals\nVARIABLES x, y\n---- MODULE Inner ----\nEXTENDS Naturals\nCONSTANT K\nVARIABLES a, b\nA == a < 2 /\\ a' = a + K /\\ UNCHANGED b\nP == a + b + K >= 0\n====\n---- MODULE Mid ----\nEXTENDS Naturals\nCONSTANT C\nVARIABLES p, q\nJ == INSTANCE Inner WITH K <- C + 1, a <- p, b <- q\nM == J!A\nPM == J!P\n====\nI == INSTANCE Mid WITH C <- 0, p <- x, q <- y\nInit == x = 0 /\\ y = 0\nNext == I!M \\/ (x = 2 /\\ UNCHANGED <<x, y>>)\nInv == I!PM /\\ I!J!P\n====",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    );
    expect(lines?.slice(1)).toEqual([
      [
        "line 19, col 37 to line 19, col 37 of module N: 5",
        "line 15, col 31 to line 15, col 35 of module N: 2",
        "line 15, col 43 to line 15, col 43 of module N: 5",
        "line 8, col 6 to line 8, col 10 of module N: 2",
        "|line 8, col 6 to line 8, col 6 of module N: 3",
        "line 8, col 15 to line 8, col 24 of module N: 2",
        "line 8, col 29 to line 8, col 39 of module N: 2",
      ],
      [
        "line 21, col 17 to line 21, col 21 of module N: 4",
        "|line 21, col 17 to line 21, col 17 of module N: 3",
        "line 21, col 26 to line 21, col 43 of module N: 1",
      ],
      [
        "line 22, col 8 to line 22, col 20 of module N: 3",
        "|line 22, col 8 to line 22, col 11 of module N: 3",
        "|line 22, col 16 to line 22, col 20 of module N: 3",
        "||line 19, col 37 to line 19, col 37 of module N: 6",
        "||line 19, col 45 to line 19, col 45 of module N: 6",
        "||line 15, col 31 to line 15, col 35 of module N: 6",
        "||line 15, col 43 to line 15, col 43 of module N: 6",
        "||line 15, col 51 to line 15, col 51 of module N: 6",
        "||line 9, col 6 to line 9, col 19 of module N: 3",
      ],
    ]);
  });

  it("counts the checks a property implies through an instance of an instance under the substitutions of both, as TLC's SpecProcessor wraps each check in them", async () => {
    const result = await check({
      source:
        "---- MODULE S2 ----\nEXTENDS Integers\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == x' = (x + 1) % 3 /\\ y' = y\nMd == INSTANCE Mid WITH Top <- 2, p <- x, q <- y\nRefines == Md!MSpec\n====",
      config: "INIT Init\nNEXT Next\nPROPERTY Refines",
      coverage: 1,
      loadModule: (name) =>
        name === "Mid"
          ? "---- MODULE Mid ----\nCONSTANT Top\nVARIABLES p, q\nG == INSTANCE Hi WITH Max <- Top, c <- p, d <- q\nMSpec == G!HSpec\n===="
          : name === "Hi"
            ? "---- MODULE Hi ----\nEXTENDS Integers\nCONSTANT Max\nVARIABLES c, d\nhv == <<c, d>>\nHInit == c = 0 /\\ d = 0\nHNext == (c < Max /\\ c' = c + 1 /\\ d' = d) \\/ (c = Max /\\ c' = 0 /\\ d' = d)\nHSpec == HInit /\\ [][HNext]_hv\n===="
            : undefined,
    });
    const lines = formatCoverage(result);
    expect(
      result.coverage?.relations
        .slice(2)
        .map((relation, index) => [relation.label, lines?.[index + 2]]),
    ).toEqual([
      [
        "Action line 6, col 1 to line 6, col 48 of module S2",
        [
          "line 6, col 40 to line 6, col 40 of module S2: 1",
          "line 4, col 40 to line 4, col 40 of module Mid: 1",
          "line 6, col 10 to line 6, col 14 of module Hi: 1",
        ],
      ],
      [
        "Action line 6, col 1 to line 6, col 48 of module S2",
        [
          "line 6, col 48 to line 6, col 48 of module S2: 1",
          "line 4, col 48 to line 4, col 48 of module Mid: 1",
          "line 6, col 19 to line 6, col 23 of module Hi: 1",
        ],
      ],
      [
        "Action line 6, col 1 to line 6, col 48 of module S2",
        [
          "line 6, col 40 to line 6, col 40 of module S2: 6",
          "line 6, col 48 to line 6, col 48 of module S2: 6",
          "line 4, col 30 to line 4, col 32 of module Mid: 3",
          "line 4, col 40 to line 4, col 40 of module Mid: 6",
          "line 4, col 48 to line 4, col 48 of module Mid: 6",
          "line 8, col 21 to line 8, col 30 of module Hi: 3",
          "|line 8, col 22 to line 8, col 26 of module Hi: 3",
          "||line 7, col 10 to line 7, col 75 of module Hi: 3",
          "|||line 7, col 11 to line 7, col 41 of module Hi: 3",
          "||||line 7, col 11 to line 7, col 31 of module Hi: 3",
          "|||||line 7, col 11 to line 7, col 17 of module Hi: 3",
          "|||||line 7, col 22 to line 7, col 31 of module Hi: 2",
          "||||line 7, col 36 to line 7, col 41 of module Hi: 2",
          "|||line 7, col 48 to line 7, col 74 of module Hi: 1",
        ],
      ],
    ]);
  });

  it("evaluates an action property it implies through an instance under the substitutions, which TLC lists first in the call stack of an error", async () => {
    const result = await check({
      source:
        "---- MODULE S7 ----\nEXTENDS Integers\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == x' = 1 - x /\\ y' = y\nB == INSTANCE Bad2 WITH c <- x, d <- y\nRefines == B!HSpec\n====",
      config: "INIT Init\nNEXT Next\nPROPERTY Refines",
      loadModule: (name) =>
        name === "Bad2"
          ? "---- MODULE Bad2 ----\nEXTENDS Integers\nVARIABLES c, d\nHInit == c = 0\nHNext == c' = 1 - c /\\ d' = d \\div c\nHSpec == HInit /\\ [][HNext]_<<c, d>>\n===="
          : undefined,
    });
    expect(formatCallStackLines(result)).toEqual([
      "Line 6, column 1 to line 6, column 38 in S7",
      "Line 6, column 21 to line 6, column 36 in Bad2",
      "Line 6, column 22 to line 6, column 26 in Bad2",
      "Line 5, column 10 to line 5, column 36 in Bad2",
      "Line 5, column 24 to line 5, column 36 in Bad2",
      "Line 5, column 29 to line 5, column 36 in Bad2",
    ]);
  });

  const LO_MODULE =
    "---- MODULE Lo ----\nEXTENDS Integers\nCONSTANT Max\nVARIABLES c, d\nhv == <<c, d>>\nOne == c = 0\nTwo == c = 0 /\\ d \\in {0, 1}\nStep == c < Max /\\ c' = c + 1 /\\ d' = d\nSpec1 == One /\\ d = 0 /\\ [][Step]_hv\nSpec2 == Two /\\ [][Step]_hv\n====";

  it.each([
    [
      "splits it where the instance's variables have names the root module doesn't declare",
      "U1",
      "x, y",
      "Max <- 2, c <- x, d <- y",
      [
        "Action line 4, col 1 to line 4, col 46 of module U1 0:0",
        "Action line 4, col 1 to line 4, col 46 of module U1 6:6",
        "Action line 4, col 1 to line 4, col 46 of module U1 4:8",
      ],
      'UnnamedAction",\n    location |->\n        [ beginLine |-> 4,\n          beginColumn |-> 1,\n          endLine |-> 4,\n          endColumn |-> 46,\n          module |-> "U1" ] ] }',
    ],
    [
      "keeps it whole where the root module declares variables of their names",
      "U2",
      "c, d",
      "Max <- 2",
      [
        "Two line 7, col 1 to line 7, col 3 of module Lo (4 1 4 30) 6:6",
        "Action line 4, col 1 to line 4, col 30 of module U2 4:8",
      ],
      'Two",\n    location |->\n        [ beginLine |-> 4,\n          beginColumn |-> 1,\n          endLine |-> 4,\n          endColumn |-> 30,\n          module |-> "U2" ] ] }',
    ],
  ])(
    "takes the initial predicate of a specification from an instance at the instance, and %s, as TLC's SpecProcessor bounds its level without the substitutions",
    async (_title, module, variables, substitutions, labels, printed) => {
      const prints: string[] = [];
      const result = await check({
        source: `---- MODULE ${module} ----\nEXTENDS Integers, TLC\nVARIABLES ${variables}\nL == INSTANCE Lo WITH ${substitutions}\nSpec == L!Spec2\nASSUME PrintT(TLCGet("spec").inits)\n====`,
        config: "SPECIFICATION Spec",
        coverage: 1,
        onPrint: (text) => prints.push(text),
        loadModule: (name) => (name === "Lo" ? LO_MODULE : undefined),
      });
      expect([
        result.coverage?.relations.map(
          (relation) => `${relation.label} ${relation.distinct}:${relation.generated}`,
        ),
        prints,
      ]).toEqual([
        labels,
        [`{ [ coverage |-> [generated |-> 0, distinct |-> 0],\n    name |-> "${printed}`],
      ]);
    },
  );

  it("names the initial predicate a specification takes from an instance directly by the instance, as TLC names the definition the instance adds", async () => {
    const prints: string[] = [];
    const result = await check({
      source:
        '---- MODULE U3 ----\nEXTENDS Integers, TLC\nVARIABLES x, y\nL == INSTANCE Lo WITH Max <- 2, c <- x, d <- y\nSpec == L!Two /\\ [][L!Step]_<<x, y>>\nASSUME PrintT(TLCGet("spec").inits)\n====',
      config: "SPECIFICATION Spec",
      coverage: 1,
      onPrint: (text) => prints.push(text),
      loadModule: (name) => (name === "Lo" ? LO_MODULE : undefined),
    });
    expect([
      result.coverage?.relations.map(
        (relation) => `${relation.label} ${relation.distinct}:${relation.generated}`,
      ),
      prints,
    ]).toEqual([
      [
        "L!Two line 4, col 1 to line 4, col 1 of module U3 6:6",
        "L!Step line 4, col 1 to line 4, col 1 of module U3 4:8",
      ],
      [
        '{ [ coverage |-> [generated |-> 0, distinct |-> 0],\n    name |-> "L!Two",\n    location |->\n        [ beginLine |-> 4,\n          beginColumn |-> 1,\n          endLine |-> 4,\n          endColumn |-> 46,\n          module |-> "U3" ] ] }',
      ],
    ]);
  });

  const NESTED_MODULES = new Map([
    [
      "N",
      "---- MODULE N ----\nEXTENDS Naturals\nCONSTANT k\nVARIABLES x, y\nInner == INSTANCE O WITH m <- k\nInitIn == x = 0 /\\ y = 0 /\\ Inner!BadM\nInitIn2 == Inner!InitO\nNextIn == Inner!NextO\nInitIn3 == Inner!InitD\nPlain == INSTANCE Q\nInitQ == Plain!InitQ\nSpecN == Inner!InitO /\\ [][UNCHANGED <<x, y>>]_<<x, y>>\nSpecO == Inner!SpecO\n====\n",
    ],
    [
      "O",
      "---- MODULE O ----\nEXTENDS Naturals\nCONSTANT m\nVARIABLES x, y\nBadM == x + m\nInitO == x = m /\\ y = 0\nNextO == x' = x /\\ y' = y\nDeep == INSTANCE P WITH n <- m\nInitD == Deep!InitP\nSpecO == InitO /\\ [][UNCHANGED <<x, y>>]_<<x, y>>\n====\n",
    ],
    ["P", "---- MODULE P ----\nCONSTANT n\nVARIABLES x, y\nInitP == x = n /\\ y = 0\n====\n"],
    ["Q", "---- MODULE Q ----\nVARIABLES x, y\nInitQ == x = 0 /\\ y = 0\n====\n"],
  ]);
  const getInitRecord = (name: string, line: number, endColumn: number) =>
    `[ coverage |-> [generated |-> 0, distinct |-> 0],\n    name |-> "${name}",\n    location |->\n        [ beginLine |-> ${line},\n          beginColumn |-> 1,\n          endLine |-> ${line},\n          endColumn |-> ${endColumn},\n          module |-> "M" ] ]`;

  it.each([
    [
      `Spec == I(0)!InitIn /\\ ${UNCHANGED_STEP}`,
      [
        "<Action line 4, col 1 to line 4, col 30 of module M>: 0:0",
        "<Action line 4, col 1 to line 4, col 30 of module M>: 0:0",
        "<Inner!BadM line 5, col 1 to line 5, col 5 of module N (4 1 4 30)>: 0:0",
        "<Action line 6, col 27 to line 6, col 44 of module M>: 0:0",
      ],
      `{ ${getInitRecord("Inner!BadM", 4, 30)},\n  ${getInitRecord("UnnamedAction", 4, 30)} }`,
    ],
    [
      `Spec == I(0)!InitIn2 /\\ ${UNCHANGED_STEP}`,
      [
        "<Inner!InitO line 5, col 1 to line 5, col 5 of module N (4 1 4 30)>: 1:1",
        "<Action line 6, col 28 to line 6, col 45 of module M>: 0:1",
      ],
      `{ ${getInitRecord("Inner!InitO", 4, 30)} }`,
    ],
    [
      `Spec == I(0)!InitIn3 /\\ ${UNCHANGED_STEP}`,
      [
        "<Inner!InitD line 5, col 1 to line 5, col 5 of module N (4 1 4 30)>: 1:1",
        "<Action line 6, col 28 to line 6, col 45 of module M>: 0:1",
      ],
      `{ ${getInitRecord("Inner!InitD", 4, 30)} }`,
    ],
    [
      `Spec == I(0)!InitQ /\\ ${UNCHANGED_STEP}`,
      [
        "<Plain!InitQ line 10, col 1 to line 10, col 5 of module N (4 1 4 30)>: 1:1",
        "<Action line 6, col 26 to line 6, col 43 of module M>: 0:1",
      ],
      `{ ${getInitRecord("Plain!InitQ", 4, 30)} }`,
    ],
    [
      "Spec == J!SpecN",
      [
        "<Inner!InitO line 5, col 1 to line 5, col 5 of module N (5 1 5 27)>: 1:1",
        "<Action line 5, col 1 to line 5, col 27 of module M>: 0:1",
      ],
      `{ ${getInitRecord("Inner!InitO", 5, 27)} }`,
    ],
    [
      "Spec == I(0)!SpecN",
      [
        "<Inner!InitO line 5, col 1 to line 5, col 5 of module N (4 1 4 30)>: 1:1",
        "<Action line 4, col 1 to line 4, col 30 of module M>: 0:1",
      ],
      `{ ${getInitRecord("Inner!InitO", 4, 30)} }`,
    ],
    [
      `Spec == J!InitIn2 /\\ ${UNCHANGED_STEP}`,
      [
        "<J!InitIn2 line 5, col 1 to line 5, col 1 of module M>: 1:1",
        "<Action line 6, col 25 to line 6, col 42 of module M>: 0:1",
      ],
      `{ ${getInitRecord("J!InitIn2", 5, 27)} }`,
    ],
    [
      `Spec == I(0)!Inner!InitO /\\ ${UNCHANGED_STEP}`,
      [
        "<Action line 4, col 1 to line 4, col 30 of module M>: 0:0",
        "<Action line 4, col 1 to line 4, col 30 of module M>: 1:1",
        "<Action line 6, col 32 to line 6, col 49 of module M>: 0:1",
      ],
      `{ ${getInitRecord("UnnamedAction", 4, 30)} }`,
    ],
  ])(
    "names the initial predicate %j reaches through an inner instance by the definition that instance adds to its module, as TLC names the OpDefNode the body refers to",
    async (spec, labels, printed) => {
      const prints: string[] = [];
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLES x, y\nI(j) == INSTANCE N WITH k <- j\nJ == INSTANCE N WITH k <- 0\n${spec}\nASSUME PrintT(TLCGet("spec").inits)\n====\n`,
        config: "SPECIFICATION Spec\n",
        coverage: 1,
        onPrint: (text) => prints.push(text),
        loadModule: (name) => NESTED_MODULES.get(name),
      });
      expect([
        result.coverage?.relations.map(
          (relation) => `<${relation.label}>: ${relation.distinct}:${relation.generated}`,
        ),
        prints,
      ]).toEqual([labels, [printed]]);
    },
  );

  it.each(["Spec == J!SpecO", "Spec == I(0)!SpecO", "Spec == J!SpecN"])(
    "finds the variables of a subscript %j reaches through two instances, where TLC's SubscriptCollector loses the outer substitutes and warns",
    async (spec) => {
      const warnings: string[] = [];
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLES x, y\nI(j) == INSTANCE N WITH k <- j\nJ == INSTANCE N WITH k <- 0\n${spec}\n====\n`,
        config: "SPECIFICATION Spec\n",
        loadModule: (name) => NESTED_MODULES.get(name),
        onProgress: (progress) => {
          if (progress.kind === "warning") warnings.push(progress.text);
        },
      });
      expect([result.status, warnings]).toEqual(["success", []]);
    },
  );

  it.each([
    [
      "LET I2 == Init IN I2",
      "I2",
      "6, col 13 to line 6, col 14",
      "6,\n          beginColumn |-> 19,\n          endLine |-> 6,\n          endColumn |-> 22",
    ],
    [
      "LET I2 == Init IN LET I3 == I2 IN I3",
      "I3",
      "6, col 31 to line 6, col 32",
      "6,\n          beginColumn |-> 37,\n          endLine |-> 6,\n          endColumn |-> 38",
    ],
    [
      "LET I2 == x = 0 /\\ y = 0 IN I2",
      "I2",
      "6, col 13 to line 6, col 14",
      "6,\n          beginColumn |-> 19,\n          endLine |-> 6,\n          endColumn |-> 32",
    ],
  ])(
    "takes the initial predicate of Spec == %s /\\ [][Next]_<<x, y>> whole and names it by the LET definition, as TLC's SpecProcessor does",
    async (init, name, range, location) => {
      const source = `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLES x, y\nInit == x = 0 /\\ y \\in {0, 1}\nNext == x < 3 /\\ x' = x + 1 /\\ y' = y\nSpec == ${init} /\\ [][Next]_<<x, y>>\nASSUME PrintT(TLCGet("spec").inits)\n====`;
      const printed: string[] = [];
      await check({ source, config: "SPECIFICATION Spec", onPrint: (text) => printed.push(text) });
      const result = await check({
        source,
        config: "SPECIFICATION Spec",
        coverage: 1,
        onPrint: () => {},
      });
      expect([printed, result.coverage?.relations[0].label]).toEqual([
        [
          `{ [ name |-> "${name}",\n    location |->\n        [ beginLine |-> ${location},\n          module |-> "M" ] ] }`,
        ],
        `${name} line ${range} of module M`,
      ]);
    },
  );

  it.each([
    ["TRUE /\\ Init", ""],
    ["C /\\ Init", ""],
    [
      "(1 = 1) /\\ TRUE /\\ Init",
      ',\n  [ name |-> "UnnamedAction",\n    location |->\n        [ beginLine |-> 6,\n          beginColumn |-> 10,\n          endLine |-> 6,\n          endColumn |-> 14,\n          module |-> "M" ] ]',
    ],
  ])(
    "leaves out of the initial predicates of Spec == %s /\\ [][x' = 1 - x]_x a name whose value is TRUE, as TLC's SpecProcessor does",
    async (init, unnamed) => {
      const printed: string[] = [];
      await check({
        source: `---- MODULE M ----\nEXTENDS Integers, TLC\nCONSTANT C\nVARIABLE x\nInit == x = 0\nSpec == ${init} /\\ [][x' = 1 - x]_x\nASSUME PrintT(TLCGet("spec").inits)\n====`,
        config: "CONSTANT C = TRUE\nSPECIFICATION Spec",
        onPrint: (text) => printed.push(text),
      });
      expect(printed).toEqual([
        `{ [ name |-> "Init",\n    location |->\n        [ beginLine |-> 5,\n          beginColumn |-> 9,\n          endLine |-> 5,\n          endColumn |-> 13,\n          module |-> "M" ] ]${unnamed} }`,
      ]);
    },
  );

  it("counts a recursive function of an instance of an instance at its definition once", async () => {
    const lines = await getCoverageLines(
      "---- MODULE G ----\nEXTENDS Naturals\nVARIABLES x, y\n---- MODULE Inner ----\nEXTENDS Naturals\nCONSTANT K\nVARIABLES a, b\nD == \\E e \\in {0, K % 4} : a' = e /\\ b' = b\nRf[n \\in 0..2] == IF n = 0 THEN K ELSE Rf[n - 1] + (a % 2)\n====\n---- MODULE Mid ----\nEXTENDS Naturals\nCONSTANT L\nVARIABLES p, q\nII == INSTANCE Inner WITH K <- L + 1, a <- p, b <- q\n====\nMd == INSTANCE Mid WITH L <- 1, p <- x, q <- y\nInit == x = 0 /\\ y = 0\nNext == Md!II!D\nInv == Md!II!Rf[2] > 0\n====",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    );
    expect(lines?.[2]).toEqual([
      "line 20, col 8 to line 20, col 22 of module G: 2",
      "|line 20, col 8 to line 20, col 18 of module G: 2",
      "||line 20, col 8 to line 20, col 15 of module G: 2",
      "|||line 17, col 38 to line 17, col 38 of module G: 2",
      "|||line 15, col 32 to line 15, col 36 of module G: 2",
      "|||line 15, col 44 to line 15, col 44 of module G: 2",
      "|||line 9, col 1 to line 9, col 58 of module G: 2",
      "||||line 9, col 19 to line 9, col 58 of module G: 6",
      "|||||line 9, col 22 to line 9, col 26 of module G: 6",
      "|||||line 9, col 33 to line 9, col 33 of module G: 2",
      "|||||line 9, col 40 to line 9, col 58 of module G: 4",
      "||||line 9, col 10 to line 9, col 13 of module G: 2",
    ]);
  });

  it("takes the definition an instance with parameters copies for an action of constant arguments, as TLC's Tool#getActionsAppl binds them", async () => {
    const lines = formatCoverage(
      await getInstanceCoverage(
        "I(p, q) == INSTANCE Inner WITH K <- p + q, w <- y",
        "\\E p \\in {1, 2} : I(p, M)!A",
        "I(1, 1)!Q /\\ I(M, 0)!G >= 0",
      ),
    );
    expect(lines?.[1]).toEqual([
      "line 5, col 1 to line 5, col 49 of module E: 30",
      "line 5, col 37 to line 5, col 41 of module E: 42",
      "line 5, col 49 to line 5, col 49 of module E: 6",
      "line 6, col 24 to line 6, col 42 of module Inner: 12",
      "line 6, col 15 to line 6, col 20 of module Inner: 6:18",
      "line 9, col 9 to line 9, col 24 of module Inner: 6",
      "line 10, col 9 to line 10, col 14 of module Inner: 6",
    ]);
  });

  it("marks a primed or unchanged declaration of an instance as a state variable by its own name, as TLC's Spec#collectPrimedLocs ignores the substitutions", async () => {
    const primed = formatCoverage(
      await getInstanceCoverage(
        "I == INSTANCE Inner WITH K <- M + 1, w <- y",
        "I!A \\/ (x = 2 /\\ x' = 0 /\\ UNCHANGED y)",
        "(ENABLED I!A) \\/ x = 2",
      ),
    );
    expect(primed?.at(-1)).toEqual([
      "line 8, col 8 to line 8, col 29 of module E: 3",
      "|line 8, col 9 to line 8, col 19 of module E: 3",
      "||line 5, col 1 to line 5, col 43 of module E: 15",
      "||line 5, col 31 to line 5, col 35 of module E: 21",
      "||line 5, col 43 to line 5, col 43 of module E: 3",
      "||line 6, col 24 to line 6, col 42 of module Inner: 6",
      "||line 6, col 15 to line 6, col 20 of module Inner: 3:9",
      "||line 9, col 9 to line 9, col 24 of module Inner: 0",
      "|||line 9, col 14 to line 9, col 24 of module Inner: 3",
      "||line 10, col 9 to line 10, col 14 of module Inner: 3",
    ]);
    const unchanged = formatCoverage(
      await getInstanceCoverage(
        "J == INSTANCE Inner WITH K <- M, w <- y",
        "J!B \\/ (x = 2 /\\ UNCHANGED <<x, y>>)",
        "(ENABLED J!B) \\/ x = 2",
      ),
    );
    expect(unchanged).toContainEqual([
      "line 5, col 1 to line 5, col 39 of module E: 5",
      "line 11, col 6 to line 11, col 10 of module Inner: 2",
      "|line 11, col 6 to line 11, col 6 of module Inner: 3",
      "line 11, col 15 to line 11, col 24 of module Inner: 2",
      "line 11, col 29 to line 11, col 39 of module Inner: 2",
    ]);
  });

  it("counts the substitution of a declaration that ENABLED keeps unchanged, as TLC's Tool#enabledUnchanged evaluates it", async () => {
    const lines = formatCoverage(
      await getInstanceCoverage(
        "J == INSTANCE Inner WITH K <- M, w <- y",
        "J!B \\/ (x = 2 /\\ UNCHANGED <<x, y>>)",
        "(ENABLED J!B) \\/ x = 2",
      ),
    );
    expect(lines?.at(-1)).toEqual([
      "line 8, col 8 to line 8, col 29 of module E: 3",
      "|line 8, col 9 to line 8, col 19 of module E: 3",
      "||line 5, col 1 to line 5, col 39 of module E: 5",
      "||line 5, col 39 to line 5, col 39 of module E: 2",
      "||line 11, col 6 to line 11, col 10 of module Inner: 3",
      "||line 11, col 15 to line 11, col 24 of module Inner: 0",
      "|||line 11, col 20 to line 11, col 24 of module Inner: 2",
      "||line 11, col 29 to line 11, col 39 of module Inner: 2",
      "|line 8, col 25 to line 8, col 29 of module E: 1",
    ]);
  });

  it.each([
    [
      "d",
      [
        "||line 4, col 39 to line 4, col 39 of module M: 2",
        "||line 5, col 8 to line 5, col 16 of module Inner: 4",
        "|||line 4, col 6 to line 4, col 10 of module Inner: 4",
        "|||line 4, col 15 to line 4, col 24 of module Inner: 2",
        "|||line 4, col 29 to line 4, col 39 of module Inner: 2",
      ],
    ],
    [
      "<<d>>",
      [
        "||line 4, col 39 to line 4, col 39 of module M: 2",
        "||line 5, col 8 to line 5, col 16 of module Inner: 4",
        "|||line 4, col 6 to line 4, col 10 of module Inner: 4",
        "|||line 4, col 15 to line 4, col 24 of module Inner: 2",
        "|||line 4, col 29 to line 4, col 43 of module Inner: 2",
      ],
    ],
    [
      "<<>>",
      [
        "||line 5, col 8 to line 5, col 16 of module Inner: 4",
        "|||line 4, col 6 to line 4, col 10 of module Inner: 4",
        "|||line 4, col 15 to line 4, col 24 of module Inner: 2",
        "|||line 4, col 29 to line 4, col 42 of module Inner: 0",
      ],
    ],
  ])(
    "counts UNCHANGED %s in an instanced ENABLED as TLC's Tool#enabledUnchanged does",
    async (unchanged, lines) => {
      const result = await check({
        source:
          "---- MODULE M ----\nEXTENDS Naturals\nVARIABLES x, y\nI == INSTANCE Inner WITH c <- x, d <- y\nInit == x = 0 /\\ y = 0\nNext == x < 3 /\\ x' = x + 1 /\\ UNCHANGED y\nInv == I!Can \\/ x >= 2\n====",
        config: "INIT Init\nNEXT Next\nINVARIANT Inv",
        coverage: 1,
        loadModule: (name) =>
          name === "Inner"
            ? `---- MODULE Inner ----\nEXTENDS Naturals\nVARIABLES c, d\nA == c < 2 /\\ c' = c + 1 /\\ UNCHANGED ${unchanged}\nCan == ENABLED A\n====`
            : undefined,
      });
      expect(formatCoverage(result)?.at(-1)).toEqual([
        "line 7, col 8 to line 7, col 22 of module M: 4",
        "|line 7, col 8 to line 7, col 12 of module M: 4",
        "||line 4, col 31 to line 4, col 31 of module M: 4",
        ...lines,
        "|line 7, col 17 to line 7, col 22 of module M: 2",
      ]);
    },
  );

  it.each([
    [
      "K2",
      "UNCHANGED <<d>>",
      "UNCHANGED d",
      [
        "||line 8, col 32 to line 8, col 46 of module K2: 2",
        "||line 9, col 10 to line 9, col 29 of module K2: 1",
        "||line 9, col 34 to line 9, col 50 of module K2: 2",
        "||line 10, col 30 to line 10, col 40 of module K2: 0",
      ],
    ],
    [
      "K4",
      "d' = d",
      "d' = d",
      [
        "||line 8, col 32 to line 8, col 37 of module K4: 2",
        "||line 9, col 10 to line 9, col 29 of module K4: 1",
        "||line 9, col 34 to line 9, col 50 of module K4: 2",
      ],
    ],
  ])(
    "counts an instance's variable that its ENABLED primes as an operator argument under UNCHANGED, as TLC's Tool#evalAppl counts each reference: %s",
    async (name, incremented, reset, lines) => {
      const result = await check({
        source: `---- MODULE ${name} ----\nEXTENDS Integers\nVARIABLES x, y\n---- MODULE Hi ----\nEXTENDS Integers\nVARIABLES c, d\nKeep(v) == v\nHInc == c < 2 /\\ c' = c + 1 /\\ ${incremented}\nHFlip == c' = c /\\ d' = 1 - d /\\ UNCHANGED Keep(c)\nHReset == c = 2 /\\ c' = 0 /\\ ${reset}\nHNext == HInc \\/ HFlip \\/ HReset\nHCanMove == ENABLED HNext\n====\nInit == x = 0 /\\ y = 0\nNext == x < 2 /\\ x' = x + 1 /\\ UNCHANGED y\nH == INSTANCE Hi WITH c <- x, d <- y\nInv == H!HCanMove\n====`,
        config: "INIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
        coverage: 1,
      });
      expect(formatCoverage(result)?.at(-1)).toEqual([
        `line 17, col 8 to line 17, col 17 of module ${name}: 3`,
        `|line 16, col 28 to line 16, col 28 of module ${name}: 3`,
        `|line 16, col 36 to line 16, col 36 of module ${name}: 3`,
        `|line 12, col 13 to line 12, col 25 of module ${name}: 3`,
        `||line 8, col 9 to line 8, col 13 of module ${name}: 3`,
        `||line 8, col 18 to line 8, col 27 of module ${name}: 2`,
        ...lines,
      ]);
    },
  );

  it.each([
    ["T11", "v' = v", "d' = d", ["||line 9, col 18 to line 9, col 18 of module T11: 3"]],
    [
      "M1",
      "UNCHANGED v",
      "Op(d)",
      [
        "||line 8, col 6 to line 8, col 15 of module M1: 3",
        "||line 7, col 10 to line 7, col 20 of module M1: 3",
        "||line 8, col 23 to line 8, col 23 of module M1: 3",
      ],
    ],
    ["M3", "v' = v", "Op(d)", ["||line 9, col 18 to line 9, col 18 of module M3: 3"]],
  ])(
    "counts the subscript of an instance's <<A>>_v under ENABLED twice at its own location, as TLC's Tool#enabled checks it CHANGED: %s",
    async (name, kept, keep, lines) => {
      const result = await check({
        source: `---- MODULE ${name} ----\nEXTENDS Integers\nVARIABLES x, y\n---- MODULE Hi ----\nEXTENDS Integers\nVARIABLES c, d\nOp(v) == ${kept}\nA == c' = c + 1 /\\ ${keep}\nCan == ENABLED <<A>>_<<c, d>>\n====\nInit == x = 0 /\\ y = 0\nNext == x < 2 /\\ x' = x + 1 /\\ UNCHANGED y\nH == INSTANCE Hi WITH c <- x, d <- y\nInv == H!Can\n====`,
        config: "INIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
        coverage: 1,
      });
      expect(formatCoverage(result)?.at(-1)).toEqual([
        `line 14, col 8 to line 14, col 12 of module ${name}: 3`,
        `|line 13, col 28 to line 13, col 28 of module ${name}: 3`,
        `|line 13, col 36 to line 13, col 36 of module ${name}: 3`,
        `|line 9, col 8 to line 9, col 29 of module ${name}: 3`,
        ...lines,
        `||line 9, col 22 to line 9, col 29 of module ${name}: 6`,
      ]);
    },
  );

  it.each([
    ["P2", "Prop == []H!CanFlip", "PROPERTY Prop", "line 14, col 11 to line 14, col 19"],
    ["P4", "Inv == H!CanFlip", "INVARIANT Inv", "line 14, col 8 to line 14, col 16"],
  ])(
    "counts UNCHANGED of an instance's variable in its ENABLED in %s, as TLC's Tool#enabledUnchanged evaluates it",
    async (name, definition, config, location) => {
      const result = await check({
        source: `---- MODULE ${name} ----\nEXTENDS Integers\nVARIABLES x, y\n---- MODULE Hi ----\nEXTENDS Integers\nVARIABLES c, d\nFlip == d' = 1 - d /\\ UNCHANGED c\nCanFlip == ENABLED Flip\n====\nInit == x = 0 /\\ y = 0\nNext == x < 2 /\\ x' = x + 1 /\\ UNCHANGED y\nSpec == Init /\\ [][Next]_<<x, y>>\nH == INSTANCE Hi WITH c <- x, d <- y\n${definition}\n====`,
        config: `SPECIFICATION Spec\n${config}\nCHECK_DEADLOCK FALSE`,
        coverage: 1,
      });
      expect(formatCoverage(result)?.at(-1)).toEqual([
        `${location} of module ${name}: 3`,
        `|line 13, col 28 to line 13, col 28 of module ${name}: 3`,
        `|line 13, col 36 to line 13, col 36 of module ${name}: 3`,
        `|line 8, col 12 to line 8, col 23 of module ${name}: 3`,
        `||line 7, col 9 to line 7, col 18 of module ${name}: 3`,
        `||line 7, col 23 to line 7, col 33 of module ${name}: 3`,
      ]);
    },
  );

  it("counts a substitution at each primed reference and again for UNCHANGED, as TLC's LazyValue caches it only for the states it was evaluated in", async () => {
    const lines = formatCoverage(
      await check({
        source:
          "---- MODULE E ----\nEXTENDS Naturals\nVARIABLES x, y\nI == INSTANCE Inner WITH w <- y\nInit == x = 0 /\\ y = 0\nNext == x < 2 /\\ x' = x + 1 /\\ y' = y\nAC == I!C\n====",
        config: "INIT Init\nNEXT Next\nACTION_CONSTRAINT AC",
        coverage: 1,
        loadModule: (name) =>
          name === "Inner"
            ? "---- MODULE Inner ----\nVARIABLES x, w\nC == w' = w /\\ UNCHANGED w /\\ [x' = x]_w\n===="
            : undefined,
      }),
    );
    expect(lines?.at(-1)).toEqual([
      "line 7, col 7 to line 7, col 9 of module E: 2",
      "|line 4, col 1 to line 4, col 31 of module E: 4",
      "|line 4, col 31 to line 4, col 31 of module E: 10",
      "|line 3, col 6 to line 3, col 40 of module Inner: 2",
      "||line 3, col 6 to line 3, col 26 of module Inner: 2",
      "|||line 3, col 6 to line 3, col 11 of module Inner: 2",
      "|||line 3, col 16 to line 3, col 26 of module Inner: 4",
      "||line 3, col 31 to line 3, col 40 of module Inner: 2",
      "|||line 3, col 32 to line 3, col 37 of module Inner: 2",
      "|||line 3, col 40 to line 3, col 40 of module Inner: 4",
    ]);
  });

  it.each([
    ["w = w /\\ UNCHANGED w", 6],
    ["UNCHANGED w /\\ w = w", 4],
    ["w' = w /\\ w = w", 4],
    ["w = w /\\ w' = w'", 6],
    ["UNCHANGED w /\\ UNCHANGED w", 6],
    ["w' = w /\\ UNCHANGED w /\\ [x' = x]_w", 10],
  ])(
    "evaluates a substitution under -coverage in %s as often as TLC counts it, as its LazyValue caches the value",
    async (body, count) => {
      const printed: string[] = [];
      const result = await check({
        source:
          "---- MODULE M ----\nEXTENDS TLC, Naturals\nVARIABLES x, y\nI == INSTANCE P WITH w <- IF PrintT(\"w\") THEN y ELSE y\nInit == x = 0 /\\ y = 0\nNext == x < 2 /\\ x' = x + 1 /\\ y' = y\nAC == I!C\n====\n",
        config: "INIT Init\nNEXT Next\nACTION_CONSTRAINT AC\nCHECK_DEADLOCK FALSE\n",
        coverage: 1,
        loadModule: (name) =>
          name === "P" ? `---- MODULE P ----\nVARIABLES x, w\nC == ${body}\n====\n` : undefined,
        onPrint: (text) => printed.push(text),
      });
      expect([
        printed.length,
        formatCoverage(result)
          ?.at(-1)
          ?.find((line) => line.startsWith("|line 4, col 27 ")),
      ]).toEqual([count, `|line 4, col 27 to line 4, col 54 of module M: ${count}`]);
    },
  );

  it("evaluates a substitution an invariant reads twice once per state under -coverage, as TLC's LazyValue caches it", async () => {
    const printed: string[] = [];
    await check({
      source:
        "---- MODULE M ----\nEXTENDS TLC, Naturals\nVARIABLES x, y\nI == INSTANCE P WITH w <- IF PrintT(\"w\") THEN y ELSE y\nInit == x = 0 /\\ y = 0\nNext == x < 2 /\\ x' = x + 1 /\\ y' = y\nInv == I!D\n====\n",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE\n",
      coverage: 1,
      loadModule: (name) =>
        name === "P"
          ? "---- MODULE P ----\nVARIABLES x, w\nD == w = w /\\ w = w\n====\n"
          : undefined,
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toEqual(['"w"', '"w"', '"w"']);
  });

  it("assigns the variables UNCHANGED keeps through the definition of an instance, where TLC evaluates the definition and fails on an unassigned variable", async () => {
    const result = await check({
      source:
        "---- MODULE E ----\nEXTENDS Naturals\nVARIABLES x, y\nI == INSTANCE Inner WITH w <- y\nInit == x = 0 /\\ y = 0\nNext == y' = (y + 1) % 3 /\\ UNCHANGED I!vx\n====",
      config: "INIT Init\nNEXT Next",
      loadModule: (name) =>
        name === "Inner" ? "---- MODULE Inner ----\nVARIABLES x, w\nvx == <<x>>\n====" : undefined,
    });
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "success",
      4,
      3,
    ]);
  });

  it("orders the actions of an instance by its definition and keeps each of them, where TLC keeps one action per location", async () => {
    const result = await getInstanceCoverage(
      "I == INSTANCE Inner WITH K <- M, w <- y",
      "(x = 2 /\\ x' = 0 /\\ UNCHANGED y) \\/ I!B \\/ I!A",
      "x < 3",
    );
    expect(result.coverage?.relations.map((relation) => relation.label)).toEqual([
      "Init line 6, col 1 to line 6, col 4 of module E",
      "I!A line 5, col 1 to line 5, col 1 of module E",
      "I!B line 5, col 1 to line 5, col 1 of module E",
      "Next line 7, col 1 to line 7, col 4 of module E (7 10 7 39)",
      "Inv line 8, col 1 to line 8, col 3 of module E",
    ]);
    expect(formatCoverage(result)?.[2]).toEqual([
      "line 5, col 1 to line 5, col 39 of module E: 5",
      "line 11, col 6 to line 11, col 10 of module Inner: 2",
      "|line 11, col 6 to line 11, col 6 of module Inner: 3",
      "line 11, col 15 to line 11, col 24 of module Inner: 2",
      "line 11, col 29 to line 11, col 39 of module Inner: 2",
    ]);
  });

  it("names an action by the standard operator it applies, as TLC's Tool#getActionsAppl does", async () => {
    const result = await check({
      source:
        "---- MODULE E ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == (x < 3 /\\ x' = x + 1) \\/ x >= 9 \\/ x + 9 =< 0 \\/ x + 9 < 0 \\/ (x = 3 /\\ x' = 0)\n====",
      config: "INIT Init\nNEXT Next",
      coverage: 1,
    });
    expect(result.coverage?.relations.map((relation) => relation.label)).toEqual([
      "Init line 4, col 1 to line 4, col 4 of module E",
      "Next line 5, col 1 to line 5, col 4 of module E (5 10 5 28)",
      "\\geq line 23, col 1 to line 23, col 8 of module Naturals (5 34 5 39)",
      "\\leq line 22, col 1 to line 22, col 8 of module Naturals (5 44 5 53)",
      "< line 20, col 1 to line 20, col 3 of module Naturals (5 58 5 66)",
      "Next line 5, col 1 to line 5, col 4 of module E (5 72 5 86)",
    ]);
  });

  it("names an action by the operator of a standard module linked from its source that it applies, as TLC's Tool#getActionsAppl does", async () => {
    const result = await check({
      source:
        "---- MODULE E ----\nEXTENDS Bags, Naturals, TLCExt\nVARIABLE x\nInit == x = 0\nNext == (x < 2 /\\ x' = x + 1) \\/ BagIn(2, SetToBag({1})) \\/ TLCNoOp(FALSE)\n====",
      config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      coverage: 1,
    });
    expect(result.coverage?.relations.map((relation) => relation.label)).toEqual([
      "Init line 4, col 1 to line 4, col 4 of module E",
      "Next line 5, col 1 to line 5, col 4 of module E (5 10 5 28)",
      "BagIn line 36, col 1 to line 36, col 10 of module Bags (5 34 5 56)",
      "TLCNoOp line 138, col 1 to line 138, col 12 of module TLCExt (5 61 5 74)",
    ]);
  });

  it("counts the substitutions of an instance a subexpression is selected through, as SANY puts the instance's SubstInNode around the selection", async () => {
    const lines = formatCoverage(
      await check({
        source:
          "---- MODULE E ----\nEXTENDS Naturals\nVARIABLES x, y\n---- MODULE Inner ----\nEXTENDS Naturals\nVARIABLE z\nOp(a) == /\\ z < a\n         /\\ z' = z + 1\n====\nI == INSTANCE Inner WITH z <- x\nInit == x = 0 /\\ y = 0\nNext == \\/ I!Op(3)!1 /\\ I!Op(3)!2 /\\ y' = y\n        \\/ I!Op(2)!2 /\\ x < 2 /\\ y' = y\n====",
        config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
        coverage: 1,
      }),
    );
    expect(lines?.slice(1)).toEqual([
      [
        "line 7, col 13 to line 7, col 17 of module E: 3",
        "|line 7, col 13 to line 7, col 13 of module E: 4",
        "|line 7, col 17 to line 7, col 17 of module E: 4",
        "line 10, col 31 to line 10, col 31 of module E: 7",
        "line 8, col 13 to line 8, col 22 of module E: 3",
        "line 12, col 38 to line 12, col 43 of module E: 3",
      ],
      [
        "line 10, col 31 to line 10, col 31 of module E: 4",
        "line 8, col 13 to line 8, col 22 of module E: 2",
        "|line 8, col 18 to line 8, col 22 of module E: 4",
        "line 13, col 25 to line 13, col 29 of module E: 2",
        "|line 13, col 25 to line 13, col 25 of module E: 4",
        "line 13, col 34 to line 13, col 39 of module E: 2",
      ],
    ]);
  });

  it("names an action by the LET definition it applies and splits the definition's body, as TLC's Tool#getActionsAppl does", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLES x, y\nG == y < 1 /\\ y' = y + 1 /\\ x' = x\nInit == x = 0 /\\ y = 0\nNext == \\/ LET Gct == G IN Gct\n        \\/ LET Hct == x = 2 /\\ x' = 0 /\\ y' = y IN Hct\n        \\/ LET Kct(k) == y = k /\\ y' = 0 /\\ x' = x IN Kct(1)\n        \\/ LET Lct == \\/ x = 0 /\\ y = 1 /\\ x' = 1 /\\ y' = 1\n                      \\/ x = 1 /\\ y = 1 /\\ x' = 2 /\\ y' = 1 IN Lct\nInv == x < 2\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      coverage: 1,
    });
    expect(result.violation?.trace.map((step) => step.label)).toEqual([
      undefined,
      "G line 4, col 6 to line 4, col 34 of module M",
      "Lct line 9, col 26 to line 9, col 59 of module M",
      "Lct line 10, col 26 to line 10, col 59 of module M",
    ]);
    expect(result.coverage?.relations.map((relation) => relation.label)).toEqual([
      "Init line 5, col 1 to line 5, col 4 of module M",
      "G line 4, col 1 to line 4, col 1 of module M",
      "Hct line 7, col 16 to line 7, col 18 of module M",
      "Kct line 8, col 16 to line 8, col 21 of module M",
      "Lct line 9, col 16 to line 9, col 18 of module M (9 26 9 59)",
      "Lct line 9, col 16 to line 9, col 18 of module M (10 26 10 59)",
      "Inv line 11, col 1 to line 11, col 3 of module M",
    ]);
  });

  it("orders the substitutions of an instance as SANY infers them from the instanced module's symbol table", async () => {
    const result = await check({
      source:
        "---- MODULE E ----\nEXTENDS Naturals\nVARIABLES a, b, c, d, z\nTwo == 1 + 1\nI == INSTANCE Inner WITH b <- z, K <- Two, T <- <<c, d>>\nJ == INSTANCE Inner WITH K <- 2, T <- <<a, a + 1>>\nInit == I!Init /\\ b = 0\nNext == (I!A /\\ UNCHANGED b) \\/ (J!A /\\ UNCHANGED z)\nInv == I!P /\\ J!P /\\ I!P\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      coverage: 1,
      loadModule: (name) =>
        name === "Inner"
          ? "---- MODULE Inner ----\nEXTENDS Naturals\nCONSTANT K\nVARIABLES a, b, c, d, T\nInit == a = 0 /\\ b = 0 /\\ c = 0 /\\ d = 0\nA == a < 3 /\\ a' = a + K /\\ b' = b /\\ c' = T[1] /\\ d' = d\nP == a + b + c + d + K + T[2] >= 0\n===="
          : undefined,
    });
    expect(formatCoverage(result)?.[1]).toEqual([
      "line 5, col 1 to line 5, col 56 of module E: 6",
      "line 5, col 31 to line 5, col 31 of module E: 6",
      "line 5, col 1 to line 5, col 56 of module E: 13",
      "line 5, col 39 to line 5, col 41 of module E: 6",
      "line 5, col 49 to line 5, col 56 of module E: 6",
      "line 6, col 6 to line 6, col 10 of module Inner: 6",
      "|line 6, col 6 to line 6, col 6 of module Inner: 7",
      "line 6, col 15 to line 6, col 24 of module Inner: 6",
      "line 6, col 29 to line 6, col 34 of module Inner: 6",
      "line 6, col 39 to line 6, col 47 of module Inner: 6",
      "line 6, col 52 to line 6, col 57 of module Inner: 6",
      "line 8, col 17 to line 8, col 27 of module E: 6",
    ]);
  });

  it.each([
    [
      "I == INSTANCE Inner WITH K <- M + 1, w <- y",
      "I!A",
      "I!Q /\\ I!G >= 0",
      "I!A line 5, col 1 to line 5, col 1",
    ],
    [
      "INSTANCE Inner WITH K <- M + 1, w <- y",
      "A",
      "Q /\\ G >= 0",
      "A line 5, col 1 to line 5, col 38",
    ],
    [
      "I(p, q) == INSTANCE Inner WITH K <- p + q, w <- y",
      "\\E p \\in {1, 2} : I(p, M)!A",
      "I(1, 1)!Q /\\ I(M, 0)!G >= 0",
      "I!A line 5, col 1 to line 5, col 7",
    ],
    [
      "I( p ,q  ) == INSTANCE Inner WITH K <- p + q, w <- y",
      "\\E p \\in {1, 2} : I(p, M)!A",
      "I(1, 1)!Q /\\ I(M, 0)!G >= 0",
      "I!A line 5, col 1 to line 5, col 10",
    ],
  ])(
    "names the action of %s by the left side of the definition, as TLC's Action#getDeclaration does",
    async (instance, next, invariant, label) => {
      const result = await getInstanceCoverage(instance, next, invariant);
      expect(result.coverage?.relations.map((relation) => relation.label)).toEqual([
        "Init line 6, col 1 to line 6, col 4 of module E",
        `${label} of module E`,
        "Inv line 8, col 1 to line 8, col 3 of module E",
      ]);
    },
  );

  it.each([
    [
      "Pad == 0",
      "LET L == INSTANCE T WITH c <- 1, v <- x IN L!Inc",
      "L!Inc line 6, col 13 to line 6, col 47 of module M",
      ["L!Inc line 6, col 13 to line 6, col 13 of module M"],
    ],
    [
      "Pad == 0",
      "LET L(w) == INSTANCE T WITH c <- w, v <- x IN L(1)!Inc",
      "L!Inc(1) line 6, col 13 to line 6, col 50 of module M",
      ["L!Inc line 6, col 13 to line 6, col 16 of module M"],
    ],
    [
      "Pad == 0",
      "LET L(w) == INSTANCE T WITH c <- w, v <- x IN L(1)!Same(2)",
      "L!Same(1,2) line 6, col 13 to line 6, col 50 of module M",
      ["L!Same line 6, col 13 to line 6, col 16 of module M"],
    ],
    [
      "Pad == 0",
      "LET L == INSTANCE T WITH c <- 1, v <- x IN L!Both",
      "L!Both line 6, col 13 to line 6, col 47 of module M",
      ["L!Both line 6, col 13 to line 6, col 13 of module M"],
    ],
    [
      "Pad == 0",
      "LET L == INSTANCE T4 IN L!Bump(x)",
      "L!Bump line 6, col 33 to line 6, col 41 of module M",
      ["L!Bump line 6, col 13 to line 6, col 13 of module M (6 33 6 41)"],
    ],
    [
      "L(w) == INSTANCE T4",
      "L(1)!Put(x, x + 1)",
      "L!Put line 6, col 9 to line 6, col 26 of module M",
      ["L!Put line 4, col 1 to line 4, col 4 of module M (6 9 6 26)"],
    ],
    [
      "L == INSTANCE T4\nK == INSTANCE T4",
      "L!Bump(x) \\/ K!Put(x, 2)",
      "L!Bump line 7, col 9 to line 7, col 17 of module M",
      [
        "L!Bump line 4, col 1 to line 4, col 1 of module M (7 9 7 17)",
        "K!Put line 5, col 1 to line 5, col 1 of module M (7 22 7 32)",
      ],
    ],
    [
      "L == INSTANCE T WITH c <- 1, v <- x",
      "L!Same(x + 1)",
      "L!Same line 6, col 9 to line 6, col 21 of module M",
      ["L!Same line 4, col 1 to line 4, col 1 of module M (6 9 6 21)"],
    ],
    [
      "I == INSTANCE TV WITH v <- x",
      "I!K!Bump(x)",
      "I!K!Bump line 6, col 9 to line 6, col 19 of module M",
      ["I!K!Bump line 4, col 1 to line 4, col 1 of module M (6 9 6 19)"],
    ],
  ])(
    "names an action through %j and %s as TLC does, at the instance's SubstInNode where it substitutes and by the instance's left side",
    async (definition, next, label, coverageLabels) => {
      const source = `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\n${definition}\nInit == x = 0\nNext == ${next}\nBound == x < 3\nInv == x < 1\n====`;
      const loadModule = (name: string) =>
        name === "T"
          ? "---- MODULE T ----\nEXTENDS Naturals\nCONSTANT c\nVARIABLE v\nSame(p) == v' = v + p\nInc == v' = v + c\nBoth == Inc \\/ Same(1)\n===="
          : name === "T4"
            ? "---- MODULE T4 ----\nEXTENDS Naturals\nPut(u, n) == u' = n\nBump(u) == u' = u + 1\n===="
            : name === "TV"
              ? "---- MODULE TV ----\nVARIABLE v\nK == INSTANCE T4\n===="
              : undefined;
      const violated = await check({
        source,
        config: "INIT Init\nNEXT Next\nINVARIANT Inv",
        loadModule,
      });
      const covered = await check({
        source,
        config: "INIT Init\nNEXT Next\nCONSTRAINT Bound",
        coverage: 1,
        loadModule,
      });
      expect([
        violated.violation?.trace.map((step) => step.label),
        covered.coverage?.relations
          .filter((relation) => relation.kind === "next")
          .map((relation) => relation.label),
      ]).toEqual([[undefined, label], coverageLabels]);
    },
  );
});

describe("formatValue matches TLC", () => {
  it("prints functions as records only when every key is a field name", async () => {
    const printed: string[] = [];
    const result = await checkFixture("formatting", "Format", "Format", {
      onPrint: (text) => printed.push(text),
    });
    expect(result.status).toBe("success");
    expect(printed).toEqual(
      readFileSync(join(FIXTURES, "formatting", "Format.out"), "utf8")
        .trim()
        .split("\n"),
    );
  });

  it.each([
    ["1.7.4" as const, ["<< >>", "<< >>", "<<>>", "<<>>", "<<<< >>>>"]],
    [undefined, ["<<>>", "<<>>", "<<>>", "<<>>", "<<<<>>>>"]],
  ])("prints an empty function that isn't a tuple like TLC %s", async (version, expected) => {
    const printed: string[] = [];
    await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, Sequences, TLC\nE == [k \\in {} |-> k]\nASSUME \\A i \\in 1..5 : PrintT(<<[k \\in 1..0 |-> k], E @@ E, Tail(<<1>>), E \\o E, <<E>>>>[i])\n====",
      config: "",
      version,
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toEqual(expected);
  });

  it("prints a record whatever its fields, and a function with a key that isn't a name like TLC", async () => {
    const printed: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS TLC\nASSUME PrintT(<<[_ |-> 1], [[_ |-> 1] EXCEPT !._ = 2], "_" :> 1, [_ |-> 1] @@ [b |-> 2]>>)\n====',
      config: "",
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toEqual(['<<[_ |-> 1], [_ |-> 2], ("_" :> 1), ("_" :> 1 @@ "b" :> 2)>>']);
  });

  it.each(["", "SYMMETRY Sym"])(
    "keeps an empty function apart from an equal tuple in a trace with %j like TLC 1.7.4",
    async (symmetry) => {
      const result = await check({
        source:
          "---- MODULE M ----\nEXTENDS Integers, TLC\nCONSTANT P\nVARIABLES q, x\nSym == Permutations(P)\nInit == q = <<>> /\\ x = 0\nNext == x' = x + 1 /\\ q' = IF x = 0 THEN [k \\in 1..0 |-> k] ELSE q\nInv == x < 2\n====",
        config: `CONSTANT P = {p1, p2}\nINIT Init\nNEXT Next\nINVARIANT Inv\n${symmetry}`,
        version: "1.7.4",
      });
      expect(result.violation?.trace.map((step) => formatValue(step.state.q))).toEqual([
        "<<>>",
        "<< >>",
        "<< >>",
      ]);
    },
  );
});

describe("DOMAIN matches TLC", () => {
  const printDomain = async (expression: string) => {
    const printed: string[] = [];
    await check({
      source: `---- MODULE M ----\nEXTENDS Integers, Sequences, TLC\nASSUME PrintT(${expression})\n====`,
      config: "",
      onPrint: (text) => printed.push(text),
    });
    return printed;
  };

  it.each([
    ['DOMAIN <<"a", "b">>', "1..2"],
    ["DOMAIN [i \\in 1..2 |-> i]", "1..2"],
    ["DOMAIN [x \\in {1, 2} |-> x]", "{1, 2}"],
    ["DOMAIN [[i \\in 1..2 |-> i] EXCEPT ![2] = 5]", "1..2"],
    ["DOMAIN CHOOSE f \\in [1..2 -> {0}] : TRUE", "1..2"],
    ["DOMAIN [x \\in (1..2) \\cap (1..3) |-> x]", "{1, 2}"],
    ["DOMAIN (<<1>> @@ <<1, 2>>)", "{1, 2}"],
    ["LET f[n \\in 1..3] == IF n = 1 THEN 1 ELSE n * f[n - 1] IN DOMAIN f", "1..3"],
    ["DOMAIN <<>>", "{}"],
    ["ToString(DOMAIN <<1, 2>>)", '"1..2"'],
    ["\\A i \\in DOMAIN <<1, 2, 3>> : i \\in DOMAIN <<4, 5, 6>>", "TRUE"],
    ["ToString(DOMAIN [i \\in 1..2000 |-> i])", '"1..2000"'],
    [
      "LET f[n \\in 0..1100] == IF n = 0 THEN <<>> ELSE Append(f[n - 1], n) IN ToString(DOMAIN f[1100])",
      '"1..1100"',
    ],
  ])("prints %s as %s", async (expression, text) => {
    expect(await printDomain(expression)).toEqual([text]);
  });

  it.each([
    [
      'x = [s \\in SUBSET {1} |-> TLCGet("level")]',
      "x' = x /\\ (DOMAIN x)[1] = 0",
      "{e1, ... ,eN}",
      "line 5, col 19 to line 5, col 31",
    ],
    [
      "x = [s \\in SUBSET {1} |-> 0]",
      "x' = x /\\ (DOMAIN x)[1] = 0",
      "{e1, ... ,eN}",
      "line 5, col 19 to line 5, col 31",
    ],
    [
      "x = 0",
      "x' = x /\\ LET f == [s \\in SUBSET {1} |-> 0] IN f = f /\\ (DOMAIN f)[1] = 0",
      "{e1, ... ,eN}",
      "line 5, col 65 to line 5, col 77",
    ],
    [
      "x = 0",
      "x' = x /\\ (DOMAIN [s \\in SUBSET {1} |-> 0])[1] = 0",
      "SUBSET S",
      "line 5, col 19 to line 5, col 54",
    ],
  ])(
    "takes DOMAIN of a function over SUBSET from its record once it converts, as TLC's FcnLambdaValue#getDomain does, with Init == %s and Next == %s",
    async (init, next, form, location) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == ${init}\nNext == ${next}\n====`,
        config: "INIT Init\nNEXT Next",
      });
      expect(result.failure?.message).toBe(
        `${UNEXPECTED_EXCEPTION}A non-function (a set of the form ${form}) was applied as a function.\n${location} of module M`,
      );
    },
  );

  it("keeps the interval in a state", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nVARIABLE b\nInit == b = DOMAIN <<7, 8>>\nNext == UNCHANGED b\nInv == b # b\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    });
    expect(formatValue(result.violation?.trace[0].state.b ?? false)).toBe("1..2");
  });
});

describe("rejecting literals matches TLC", () => {
  const checkLiterals = (source: string) =>
    check({
      source: `---- MODULE M ----\n${source}\nNext == x' = x\n====`,
      config: "INIT Init\nNEXT Next",
    });

  it("parses decimal literals", () => {
    const module = parseModule("---- MODULE M ----\nHalf == 1.5\nRange == 1..2\n====");
    expect(module.definitions.map((definition) => definition.body.kind)).toEqual([
      "Decimal",
      "Apply",
    ]);
  });

  it.each([
    ["an evaluated decimal", "EXTENDS Reals\nVARIABLE x\nInit == x = 1.5"],
    [
      "a decimal with a comment around its point",
      "EXTENDS Reals\nVARIABLE x\nInit == x = 1 .(* c *) 5",
    ],
    ["a decimal that is never evaluated", "VARIABLE x\nHalf == 1.5\nInit == x = 0"],
    ["a decimal in an unused LET", "VARIABLE x\nF == LET h == 1.5 IN 0\nInit == x = 0"],
    ["a decimal in an unnamed theorem", "VARIABLE x\nTHEOREM 1.5 = 1.5\nInit == x = 0"],
    [
      "a decimal in an instance substitution",
      "---- MODULE Inner ----\nCONSTANT c\n====\nVARIABLE x\nI == INSTANCE Inner WITH c <- 1.5\nInit == x = 0",
    ],
    [
      "a decimal in an unused nested module",
      "VARIABLE x\n---- MODULE Inner ----\nHalf == 1.5\n====\nInit == x = 0",
    ],
  ])("rejects %s before checking", async (_title, source) => {
    const run = checkLiterals(source);
    await expect(run).rejects.toThrow(TlaEvaluationError);
    await expect(run).rejects.toThrow("TLC can't handle real numbers.\n1.5");
  });

  it("accepts decimals in proofs and ASSUME PROVE theorems", async () => {
    const result = await checkLiterals(
      "VARIABLE x\nTHEOREM TRUE\n<1>1. 1.5 = 1.5\n  OBVIOUS\n<1>2. QED\n  BY <1>1\nTHEOREM ASSUME NEW c PROVE c = 1.5\nInit == x = 0",
    );
    expect(result.status).toBe("success");
  });

  it.each([
    ["an unused definition", "VARIABLE x\nBig == 2147483648\nInit == x = 0"],
    ["an assumption", "VARIABLE x\nASSUME 2147483648 > 0\nInit == x = 0"],
    ["a negated literal", "EXTENDS Integers\nVARIABLE x\nInit == x = -2147483648"],
    [
      "an unused nested module",
      "VARIABLE x\n---- MODULE Inner ----\nBig == 2147483648\n====\nInit == x = 0",
    ],
  ])("rejects an integer literal too big for TLC in %s", async (_title, source) => {
    const run = checkLiterals(source);
    await expect(run).rejects.toThrow(TlaEvaluationError);
    await expect(run).rejects.toThrow("TLC can't handle a number this big.\n2147483648");
  });

  it.each(["\\hFFFFFFFFF", "99999999999999999999"])("quotes %s as typed", async (literal) => {
    await expect(checkLiterals(`VARIABLE x\nBig == ${literal}\nInit == x = 0`)).rejects.toThrow(
      `TLC can't handle a number this big.\n${literal}`,
    );
  });

  it("reads based numerals", async () => {
    const result = await checkLiterals(
      "VARIABLE x\nASSUME \\h1F = 31 /\\ \\b101 = 5 /\\ \\o17 = 15\nInit == x = 0",
    );
    expect(result.status).toBe("success");
  });

  it("accepts the largest integer literal and big literals in proofs", async () => {
    const result = await checkLiterals(
      "EXTENDS Naturals\nVARIABLE x\nTHEOREM TRUE\n<1>1. 2147483648 > 0\n  OBVIOUS\n<1>2. QED\n  BY <1>1\nInit == x = 2147483647",
    );
    expect(result.status).toBe("success");
  });
});

describe("initial predicate and next-state relation match TLC", () => {
  it("explores no states when a spec without variables has no initial predicate", async () => {
    const result = await checkBody("ASSUME TRUE\nSpec == [][TRUE]_<<>>", "SPECIFICATION Spec");
    expect([result.status, result.generatedStates, result.distinctStates, result.depth]).toEqual([
      "success",
      0,
      0,
      0,
    ]);
  });

  it("requires an initial predicate when the spec has variables", async () => {
    await expect(
      checkBody("VARIABLE x\nSpec == [][x' = x]_x", "SPECIFICATION Spec"),
    ).rejects.toThrow(/did not specify the initial state predicate/);
  });

  it("rejects a constant initial predicate or next-state action", async () => {
    await expect(
      checkBody("VARIABLE x\nInit == TRUE\nNext == x' = x", "INIT Init\nNEXT Next"),
    ).rejects.toThrow(/The initial predicate Init cannot be a constant/);
    await expect(
      checkBody("VARIABLE x\nInit == x = 0\nNext == TRUE", "INIT Init\nNEXT Next"),
    ).rejects.toThrow(/The next state action Next cannot be a constant/);
  });

  it("reads a name of the configuration as TLC's defns holds TRUE, FALSE, BOOLEAN and the Java overrides", async () => {
    const statuses = await Promise.all(
      ["INVARIANT TRUE", "PROPERTY TRUE", "CONSTRAINT TRUE"].map(
        async (config) => (await checkModule("", config)).status,
      ),
    );
    expect(statuses).toEqual(["success", "success", "success"]);
    const cases = [
      ["INVARIANT BOOLEAN", "The invariant of BOOLEAN is equal to {FALSE, TRUE}"],
      [
        "ACTION_CONSTRAINT STRING",
        "The action constraint of STRING is equal to <Java Method: public static tlc2.value.impl.Value tlc2.module.Strings.STRING()>",
      ],
      ["VIEW BOOLEAN", "The view function BOOLEAN cannot be a constant."],
    ];
    for (const item of cases) {
      await expect(checkModule("", item[0])).rejects.toThrow(new TlaConfigError(item[1]));
    }
    await expect(checkModule("", "POSTCONDITION TRUE")).rejects.toThrow(
      new TlaEvaluationError("The post condition TRUE cannot be a constant."),
    );
    await expect(
      check({
        source:
          "---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = x\n====",
        config: "SPECIFICATION Nat",
      }),
    ).rejects.toThrow(
      new TlaConfigError(
        "The value of Nat is equal to <Java Method: public static tlc2.value.impl.Value tlc2.module.Naturals.Nat()>",
      ),
    );
    const symmetries = [
      ["", "SYMMETRY FALSE", "FALSE"],
      ["CONSTANT N", "CONSTANT N <- TRUE\nSYMMETRY N", "N"],
    ];
    for (const item of symmetries) {
      await expect(checkModule(item[0], item[1])).rejects.toThrow(
        new TlaEvaluationError(
          `${UNEXPECTED_EXCEPTION}The symmetry function ${item[2]} must specify a set of permutations.`,
        ),
      );
    }
  });

  it("takes a constant next-state action that TLC fails to compute for an operator", async () => {
    const result = await checkSteps("Step == <<TRUE>>[1] /\\ <<1>>[1]", "INIT Init\nNEXT Step");
    expect(result.failure?.message).toBe(
      `${UNEXPECTED_EXCEPTION}In computing next states, TLC expected a boolean expression,\nbut didn't find one.\nline 6, col 24 to line 6, col 31 of module M`,
    );
  });

  it("checks the configuration in the order TLC reads it, before any assumption", async () => {
    await expect(
      checkBody(
        "VARIABLE x\nASSUME FALSE\nInit == x = 0\nNext == TRUE\nInv == {}",
        "INIT Init\nNEXT Next\nINVARIANT Inv\nPROPERTY Q",
      ),
    ).rejects.toThrow(new TlaConfigError("The invariant of Inv is equal to {}"));
    await expect(
      checkBody(
        "VARIABLE x\nInit == x = 0\nNext == x' = x\nQ(a) == TRUE",
        "INIT Init\nNEXT Next\nPROPERTY Q\nCONSTRAINT Nope",
      ),
    ).rejects.toThrow(new TlaConfigError("TLC requires Q not to take any argument."));
    await expect(
      checkBody(
        "VARIABLE x\nInit == x = 0\nNext == x' = x\nC == FALSE",
        "INIT Init\nNEXT Next\nCONSTRAINT C",
      ),
    ).rejects.toThrow(new TlaConfigError("The constraint of C is equal to FALSE"));
  });

  it("reads a constant invariant that failed at startup as TLC does, without evaluating it again", async () => {
    const prints: string[] = [];
    const result = await check({
      source:
        '---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == x = 0\nNext == UNCHANGED x\nInv == PrintT("p") /\\ (1 :> 2)[3] = 0\n====',
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      onPrint: (text) => prints.push(text),
    });
    expect(result.failure?.message).toContain("Attempted to apply function:\n<<2>>\nto argument 3");
    expect(prints).toEqual(['"p"', '"p"']);
  });

  it("checks a constant invariant on each state when it calls an operator whose parameter is named like a variable, as TLC does", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nIsEven(v) == v % 2 = 0\nVARIABLE v\nInit == v = 0\nNext == UNCHANGED v\nInv == IsEven(3)\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    });
    expect([result.status, result.violation?.name, result.generatedStates]).toEqual([
      "invariant-violation",
      "Inv",
      1,
    ]);
  });

  it("evaluates a constant invariant once as it starts when it passes such an operator as an argument, as TLC does", async () => {
    const prints: string[] = [];
    await expect(
      check({
        source:
          "---- MODULE M ----\nEXTENDS Integers, TLC\nIsEven(v) == v % 2 = 0\nApply(Op(_), w) == Op(w)\nVARIABLE v\nInit == v = 0\nNext == UNCHANGED v\nInv == PrintT(1) /\\ Apply(IsEven, 1)\n====",
        config: "INIT Init\nNEXT Next\nINVARIANT Inv",
        onPrint: (text) => prints.push(text),
      }),
    ).rejects.toThrow(new TlaConfigError("The invariant of Inv is equal to FALSE"));
    expect(prints).toEqual(["1"]);
  });

  it("warns about a state-level property before it reads the constraints", async () => {
    const warned: string[] = [];
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\nInit == x = 0\nNext == x' = x\nP == x = 0\nC == FALSE\n====",
        config: "INIT Init\nNEXT Next\nPROPERTY P\nCONSTRAINT C",
        onProgress: (progress) => {
          if (progress.kind === "state-level-property") warned.push(progress.name);
        },
      }),
    ).rejects.toThrow(new TlaConfigError("The constraint of C is equal to FALSE"));
    expect(warned).toEqual(["P"]);
  });

  it.each([
    ["P == LET A == x' = x IN x \\in {0, 1}", ["P"]],
    ["P == LET A(p) == p' = p IN x \\in {0, 1}", ["P"]],
    ["P == LET A == x IN TRUE", []],
  ])("levels the property %j by its LET's body, as TLC does", async (definition, expected) => {
    const warned: string[] = [];
    await check({
      source: `---- MODULE M ----\nVARIABLE x\nInit == x = 0\nNext == x' = x\n${definition}\n====`,
      config: "INIT Init\nNEXT Next\nPROPERTY P",
      onProgress: (progress) => {
        if (progress.kind === "state-level-property") warned.push(progress.name);
      },
    });
    expect(warned).toEqual(expected);
  });

  it.each(["P == [](LET A == x' = x IN x = 0)", "F(p) == x = 0\nP == [](F(x'))"])(
    "checks %j as a temporal property, as TLC's level bound counts what the formula leaves out",
    async (definitions) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 2\n${definitions}\n====`,
        config: "INIT Init\nNEXT Next\nPROPERTY P",
      });
      expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
        "property-violation",
        3,
        2,
      ]);
    },
  );

  it.each([
    [
      "P == ~~(LET A == x' = x IN x = 0)",
      "INIT Init\nNEXT Next\nPROPERTY P",
      "The formula P at line 6, col 6 to line 6, col 33 of module M is an action-level formula (i.e., it contains no temporal operators). Only temporal-level (or state-level) formulas are allowed under PROPERTY or PROPERTIES. To check that action P holds in *every* step of the behavior, define a temporal property: Let A be the formula at line 6, col 6 to line 6, col 33 of module M; rewrite A as [][A]_v, where v is a state function (typically the tuple of variables) (compare page 90 of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html).",
    ],
    [
      "Spec == Init /\\ [][Next]_x /\\ ~~(LET A == x' = x IN x = 0)",
      "SPECIFICATION Spec",
      "TLC cannot handle this conjunct of the spec:\nline 6, col 31 to line 6, col 58 of module M",
    ],
    [
      "F(p) == TRUE\nSpec == Init /\\ [][Next]_x /\\ ~~F(x')",
      "SPECIFICATION Spec",
      "TLC cannot handle this conjunct of the spec:\nline 7, col 31 to line 7, col 37 of module M",
    ],
  ])("rejects %j at the level TLC bounds it by", async (definitions, config, message) => {
    await expect(
      check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 2\n${definitions}\n====`,
        config,
      }),
    ).rejects.toThrow(new TlaConfigError(message));
  });

  const getTwoStateSource = (definitions: string) =>
    `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 2\n${definitions}\n====`;
  it.each(["Q == LET A == x' = x IN x \\in {0, 1}\nP == Q", "F(p) == x = 0\nH == F(x')\nP == H"])(
    "warns that the property in %j is state-level, as SANY levels the definition it names",
    async (definitions) => {
      const warned: string[] = [];
      const result = await check({
        source: getTwoStateSource(definitions),
        config: "INIT Init\nNEXT Next\nPROPERTY P",
        onProgress: (progress) => {
          if (progress.kind === "state-level-property") warned.push(progress.name);
        },
      });
      expect([result.status, warned]).toEqual(["success", ["P"]]);
    },
  );

  it.each([
    ["Q == LET A == x' = x IN x \\in {0, 1}\nSpec == Init /\\ [][Next]_x /\\ []Q", 7, 33],
    ["F(p) == x = 0\nH == F(x')\nSpec == Init /\\ [][Next]_x /\\ []H", 8, 33],
    ["MySpec(I) == Init /\\ [][Next]_x /\\ []I\nSpec == MySpec(<>(x = 1))", 6, 38],
  ])(
    "rejects the [] in %j, as SANY levels its argument below an action",
    async (definitions, line, column) => {
      await expect(
        check({ source: getTwoStateSource(definitions), config: "SPECIFICATION Spec" }),
      ).rejects.toThrow(
        new TlaEvaluationError(
          `TLC cannot handle the temporal formula line ${line}, col ${column} to line ${line}, col ${column} of module M`,
        ),
      );
    },
  );

  it.each([
    [
      "INIT Init\nNEXT Next\nPROPERTY T",
      new TlaConfigError(
        "The property T specified in the configuration file\nis not defined in the specification.",
      ),
    ],
    [
      "INIT Init\nNEXT Next\nPROPERTY A",
      new TlaConfigError(
        "The property A specified in the configuration file\nis not defined in the specification.",
      ),
    ],
    [
      "INIT Init\nNEXT Next\nINVARIANT T",
      new TlaConfigError(
        "The invariant T specified in the configuration file\nis not defined in the specification.",
      ),
    ],
    [
      "INIT Init\nNEXT Next\nCONSTRAINT T",
      new TlaConfigError(
        "The constraint T specified in the configuration file\nis not defined in the specification.",
      ),
    ],
    [
      "INIT Init\nNEXT Next\nACTION_CONSTRAINT T",
      new TlaConfigError(
        "The action constraint T specified in the configuration file\nis not defined in the specification.",
      ),
    ],
    [
      "INIT T\nNEXT Next",
      new TlaConfigError(
        "The initial predicate T specified in the configuration file\nis not defined in the specification.",
      ),
    ],
    [
      "INIT Init\nNEXT T",
      new TlaConfigError(
        "The next state action T specified in the configuration file\nis not defined in the specification.",
      ),
    ],
    [
      "SPECIFICATION T",
      new TlaConfigError(
        "The name T specified in the configuration file\nis not defined in the specification.",
      ),
    ],
    [
      "INIT Init\nNEXT Next\nVIEW T",
      new TlaConfigError(
        "The view function T specified in the configuration file\nis not defined in the specification.",
      ),
    ],
    [
      "INIT Init\nNEXT Next\nSYMMETRY T",
      new TlaConfigError(
        "The symmetry function T specified in the configuration file\nis not defined in the specification.",
      ),
    ],
    [
      "INIT Init\nNEXT Next\nPOSTCONDITION T",
      new TlaEvaluationError(
        "The post condition T specified in the configuration file\nis not defined in the specification.",
      ),
    ],
  ])(
    "takes the theorem or assumption that %j names for undefined, as TLC does",
    async (config, error) => {
      await expect(
        check({
          source: getTwoStateSource("THEOREM T == x \\in {0, 1}\nASSUME A == TRUE"),
          config,
        }),
      ).rejects.toThrow(error);
    },
  );

  const theoremBase =
    "---- MODULE Base ----\nVARIABLE v\nTHEOREM Baz == v \\in {0, 1}\nTHEOREM Foo == ASSUME v = 0 PROVE v \\in {0, 1}\nQ == Baz\n====\n";
  const theoremChain = "---- MODULE L2 ----\nVARIABLE w\nJ == INSTANCE Base WITH v <- w\n====\n";
  const theoremLink =
    "---- MODULE L3 ----\nVARIABLE w\nJ == INSTANCE Base WITH v <- w\nR == J!Baz\n====\n";
  // SANY loads an inner module that only a LET instance names a second time, so Base also has a top-level INSTANCE.
  const letBase = `${theoremBase}JB == INSTANCE Base WITH v <- x\n`;
  it.each([
    [
      "THEOREM T == x \\in {0, 1}\nP == T",
      "INIT Init\nNEXT Next\nPROPERTY P",
      "The operator T, which equals line 6, col 1 to line 6, col 25 of module M,\ncannot be used as a property",
    ],
    [
      "THEOREM T == x \\in {0, 1}\nPROOF OBVIOUS\nP == T",
      "INIT Init\nNEXT Next\nPROPERTY P",
      "The operator T, which equals line 6, col 1 to line 7, col 13 of module M,\ncannot be used as a property",
    ],
    [
      "ASSUME A == TRUE\nP == A /\\ [](x \\in {0, 1})",
      "INIT Init\nNEXT Next\nPROPERTY P",
      "The operator A, which equals line 6, col 1 to line 6, col 16 of module M,\ncannot be used as a property",
    ],
    [
      "THEOREM T == 1\nP == T /\\ [](x \\in {0, 1})",
      "INIT Init\nNEXT Next\nPROPERTY P",
      "The operator T, which equals line 6, col 1 to line 6, col 14 of module M,\ncannot be used as a property",
    ],
    [
      "THEOREM T == x \\in {0, 1}\nP == \\A i \\in {1} : LET Q == T IN Q",
      "INIT Init\nNEXT Next\nPROPERTY P",
      "The operator T, which equals line 6, col 1 to line 6, col 25 of module M,\ncannot be used as a property",
    ],
    [
      `${theoremBase}I == INSTANCE Base WITH v <- x\nP == I!Foo`,
      "INIT Init\nNEXT Next\nPROPERTY P",
      "The operator I!Foo, which equals line 12, col 1 to line 12, col 30 of module M,\ncannot be used as a property",
    ],
    [
      `${theoremBase}INSTANCE Base WITH v <- x\nP == Baz /\\ [](x \\in {0, 1})`,
      "INIT Init\nNEXT Next\nPROPERTY P",
      "The operator Baz, which equals line 12, col 1 to line 12, col 25 of module M,\ncannot be used as a property",
    ],
    [
      `${theoremBase}${theoremChain}I == INSTANCE L2 WITH w <- x\nP == I!J!Baz /\\ [](x \\in {0, 1})`,
      "INIT Init\nNEXT Next\nPROPERTY P",
      "The operator I!J!Baz, which equals line 16, col 1 to line 16, col 28 of module M,\ncannot be used as a property",
    ],
    [
      `${theoremBase}${theoremLink}I == INSTANCE L3 WITH w <- x\nP == I!R /\\ [](x \\in {0, 1})`,
      "INIT Init\nNEXT Next\nPROPERTY P",
      "The operator J!Baz, which equals line 14, col 1 to line 14, col 30 of module M,\ncannot be used as a property",
    ],
    [
      `${theoremBase}${theoremLink}I == INSTANCE L3 WITH w <- x\nP == I!J!Q /\\ [](x \\in {0, 1})`,
      "INIT Init\nNEXT Next\nPROPERTY P",
      "The operator Baz, which equals line 8, col 1 to line 8, col 27 of module M,\ncannot be used as a property",
    ],
    [
      `${theoremBase}I(p) == INSTANCE Base WITH v <- p\nP == I(x)!Q /\\ [](x \\in {0, 1})`,
      "INIT Init\nNEXT Next\nPROPERTY P",
      "The operator Baz, which equals line 8, col 1 to line 8, col 27 of module M,\ncannot be used as a property",
    ],
    [
      "THEOREM T == TRUE\nSpec == Init /\\ [][Next]_x /\\ (T /\\ TRUE)",
      "SPECIFICATION Spec",
      "The operator T, which equals line 6, col 1 to line 6, col 17 of module M,\ncannot be used as a spec",
    ],
    [
      `${theoremBase}I == INSTANCE Base WITH v <- x\nSpec == Init /\\ [][Next]_x /\\ I!Q`,
      "SPECIFICATION Spec",
      "The operator Baz, which equals line 8, col 1 to line 8, col 27 of module M,\ncannot be used as a spec",
    ],
    [
      "THEOREM T == [](x \\in {0, 1})\nSpec == Init /\\ [][Next]_x /\\ T",
      "SPECIFICATION Spec",
      "The operator T, which equals line 6, col 1 to line 6, col 29 of module M,\ncannot be used as a spec",
    ],
    [
      "THEOREM T == x \\in {0, 1}\nInit2 == T\nSpec == Init2 /\\ [][Next]_x",
      "SPECIFICATION Spec",
      "The operator T, which equals line 6, col 1 to line 6, col 25 of module M,\ncannot be used as a spec",
    ],
    [
      `${theoremBase}I == INSTANCE Base WITH v <- x\nR == I!Foo\nSpec == Init /\\ [][Next]_x /\\ R`,
      "SPECIFICATION Spec",
      "The operator I!Foo, which equals line 12, col 1 to line 12, col 30 of module M,\ncannot be used as a spec",
    ],
    [
      `${theoremBase}I(p) == INSTANCE Base WITH v <- p\nSpec == Init /\\ [][Next]_x /\\ I(x)!Q`,
      "SPECIFICATION Spec",
      "The operator Baz, which equals line 8, col 1 to line 8, col 27 of module M,\ncannot be used as a spec",
    ],
    [
      `${theoremBase}I(p) == INSTANCE Base WITH v <- p\nF(q) == I(q)!Q\nSpec == Init /\\ [][Next]_x /\\ F(x)`,
      "SPECIFICATION Spec",
      "The operator Baz, which equals line 8, col 1 to line 8, col 27 of module M,\ncannot be used as a spec",
    ],
    [
      "THEOREM T == x \\in {0, 1}\nF(p) == T /\\ p = 0\nSpec == Init /\\ [][Next]_x /\\ F(x)",
      "SPECIFICATION Spec",
      "The operator T, which equals line 6, col 1 to line 6, col 25 of module M,\ncannot be used as a spec",
    ],
    [
      `${letBase}P == LET K == INSTANCE Base WITH v <- x IN K!Baz`,
      "INIT Init\nNEXT Next\nPROPERTY P",
      "The operator K!Baz, which equals line 13, col 10 to line 13, col 39 of module M,\ncannot be used as a property",
    ],
    [
      `${letBase}P == LET K == INSTANCE Base WITH v <- x IN K!Q`,
      "INIT Init\nNEXT Next\nPROPERTY P",
      "The operator Baz, which equals line 8, col 1 to line 8, col 27 of module M,\ncannot be used as a property",
    ],
    [
      `${letBase}P == LET K == INSTANCE Base WITH v <- x IN K!Foo`,
      "INIT Init\nNEXT Next\nPROPERTY P",
      "The operator K!Foo, which equals line 13, col 10 to line 13, col 39 of module M,\ncannot be used as a property",
    ],
    [
      `${letBase}P == LET K(p) == INSTANCE Base WITH v <- p IN K(x)!Q`,
      "INIT Init\nNEXT Next\nPROPERTY P",
      "The operator Baz, which equals line 8, col 1 to line 8, col 27 of module M,\ncannot be used as a property",
    ],
    [
      `${letBase}${theoremLink}JL == INSTANCE L3 WITH w <- x\nP == LET K == INSTANCE L3 WITH w <- x IN K!R`,
      "INIT Init\nNEXT Next\nPROPERTY P",
      "The operator J!Baz, which equals line 15, col 1 to line 15, col 30 of module M,\ncannot be used as a property",
    ],
    [
      `${letBase}${theoremLink}JL == INSTANCE L3 WITH w <- x\nP == LET K == INSTANCE L3 WITH w <- x IN K!J!Baz`,
      "INIT Init\nNEXT Next\nPROPERTY P",
      "The operator K!J!Baz, which equals line 19, col 10 to line 19, col 37 of module M,\ncannot be used as a property",
    ],
    [
      `${letBase}P == LET K == INSTANCE Base WITH v <- x IN \\A k \\in {1} : K!Baz`,
      "INIT Init\nNEXT Next\nPROPERTY P",
      "The operator K!Baz, which equals line 13, col 10 to line 13, col 39 of module M,\ncannot be used as a property",
    ],
    [
      `${letBase}Spec == Init /\\ [][Next]_x /\\ LET K == INSTANCE Base WITH v <- x IN K!Baz`,
      "SPECIFICATION Spec",
      "The operator K!Baz, which equals line 13, col 35 to line 13, col 64 of module M,\ncannot be used as a spec",
    ],
    [
      `${letBase}Spec == LET K == INSTANCE Base WITH v <- x IN Init /\\ [][Next]_x /\\ K!Q`,
      "SPECIFICATION Spec",
      "The operator Baz, which equals line 8, col 1 to line 8, col 27 of module M,\ncannot be used as a spec",
    ],
  ])("rejects the theorem that %j reaches, as TLC does", async (definitions, config, message) => {
    await expect(check({ source: getTwoStateSource(definitions), config })).rejects.toThrow(
      new TlaConfigError(message),
    );
  });

  it.each([
    ["P == TN", "The operator TN, which equals line 3, col 1 to line 3, col 26 of module N"],
    [
      "I == INSTANCE N\nP == I!TN",
      "The operator I!TN, which equals line 5, col 1 to line 5, col 15 of module M",
    ],
  ])("rejects the extended theorem that %j reaches, as TLC does", async (definitions, operator) => {
    await expect(
      check({
        source: `---- MODULE M ----\nEXTENDS Naturals, N\nInit == x = 0\nNext == x' = (x + 1) % 2\n${definitions} /\\ [](x \\in {0, 1})\n====`,
        config: "INIT Init\nNEXT Next\nPROPERTY P",
        loadModule: (name) =>
          name === "N"
            ? "---- MODULE N ----\nVARIABLE x\nTHEOREM TN == x \\in {0, 1}\n===="
            : undefined,
      }),
    ).rejects.toThrow(new TlaConfigError(`${operator},\ncannot be used as a property`));
  });

  it.each([
    [
      "THEOREM T == x \\in {0, 1}\nInit2 == T /\\ x = 0\nSpec == Init2 /\\ [][Next]_x",
      "SPECIFICATION Spec",
    ],
    [
      "THEOREM T == x \\in {0, 1}\nSpec == Init /\\ [][Next]_x /\\ \\A i \\in {1} : T",
      "SPECIFICATION Spec",
    ],
    ["THEOREM T == x \\in {0, 1}\nP == []T", "INIT Init\nNEXT Next\nPROPERTY P"],
    [
      "---- MODULE B2 ----\nTHEOREM Baz2 == TRUE\n====\nI2 == INSTANCE B2\nP == I2!Baz2",
      "INIT Init\nNEXT Next\nPROPERTY P",
    ],
    [
      `${letBase}P == LET K(p) == INSTANCE Base WITH v <- p IN K(x)!Baz`,
      "INIT Init\nNEXT Next\nPROPERTY P",
    ],
    [
      `${letBase}P == LET K == INSTANCE Base WITH v <- x IN [](K!Baz)`,
      "INIT Init\nNEXT Next\nPROPERTY P",
    ],
    [
      `${letBase}P == LET K == INSTANCE Base WITH v <- x IN K!Baz \\/ FALSE`,
      "INIT Init\nNEXT Next\nPROPERTY P",
    ],
    [
      `${letBase}P == LET K == INSTANCE Base WITH v <- x IN K!Baz`,
      "INIT Init\nNEXT Next\nINVARIANT P",
    ],
  ])("checks the theorem that %j evaluates, as TLC does", async (definitions, config) => {
    expect((await check({ source: getTwoStateSource(definitions), config })).status).toBe(
      "success",
    );
  });

  const loopBase =
    "---- MODULE R ----\nVARIABLE z\nRECURSIVE Ev(_)\nEv(n) == IF n = 0 THEN z = 1 ELSE Ev(n - 1)\n====\n";
  const falseBase =
    "---- MODULE R ----\nVARIABLE z\nRECURSIVE Ev(_)\nEv(n) == z = n /\\ FALSE\n====\n";

  it.each([
    ["F(p) == p = 0 /\\ FALSE\nSpec == Init /\\ [][Next]_x /\\ F(x)", "FALSE"],
    ["F(p) == FALSE\nSpec == Init /\\ [][Next]_x /\\ F(x)", "FALSE"],
    [`${falseBase}INSTANCE R WITH z <- x\nSpec == Init /\\ [][Next]_x /\\ Ev(0)`, "FALSE"],
    [
      `${falseBase}I == INSTANCE R WITH z <- x\nSpec == LET J == INSTANCE R WITH z <- x IN Init /\\ [][Next]_x /\\ J!Ev(0)`,
      "FALSE",
    ],
    [`${falseBase}I == INSTANCE R WITH z <- x\nSpec == Init /\\ [][Next]_x /\\ I!Ev(0)`, "FALSE"],
    ["Spec == LET F(p) == p = 0 /\\ FALSE IN Init /\\ [][Next]_x /\\ F(x)", "FALSE"],
    ["F(p) == p = 0\nG(q) == F(q) /\\ FALSE\nSpec == Init /\\ [][Next]_x /\\ G(x)", "FALSE"],
    ["H(Op(_)) == Op(x)\nSpec == Init /\\ [][Next]_x /\\ H(LAMBDA p : p = 0 /\\ FALSE)", "FALSE"],
    ["G(p) == p = 0 /\\ FALSE\nH(Op(_)) == Op(x)\nSpec == Init /\\ [][Next]_x /\\ H(G)", "FALSE"],
    ["C == FALSE\nF(p) == p = 0 /\\ C\nSpec == Init /\\ [][Next]_x /\\ F(x)", "C"],
  ])(
    "takes apart the state-level application in %j of the spec, as TLC does",
    async (definitions, name) => {
      await expect(
        check({ source: getTwoStateSource(definitions), config: "SPECIFICATION Spec" }),
      ).rejects.toThrow(
        new TlaConfigError(`The spec is trivially false because ${name} is false.`),
      );
    },
  );

  it.each([
    "RECURSIVE R(_)\nR(p) == p = 0 /\\ FALSE\nSpec == Init /\\ [][Next]_x /\\ R(x)",
    "Spec == LET RECURSIVE R(_)\n            R(p) == p = 0 /\\ FALSE\n        IN Init /\\ [][Next]_x /\\ R(x)",
    "F(p) == p = 0 /\\ FALSE\nS == F(x)\nSpec == Init /\\ [][Next]_x /\\ S",
  ])(
    "takes the conjunct in %j of the spec whole as an initial predicate, as TLC does",
    async (definitions) => {
      const result = await check({
        source: getTwoStateSource(definitions),
        config: "SPECIFICATION Spec",
      });
      expect([result.status, result.distinctStates]).toEqual(["success", 0]);
    },
  );

  it.each([
    ["P == LET RECURSIVE R(_)\n         R(n) == x \\in {0, 1} /\\ FALSE\n     IN R(1)", "P"],
    [
      "P == LET RECURSIVE R(_)\n         R(n) == x = 1\n     IN R(1) /\\ [](x \\in {0, 1})",
      "line 8, col 9 to line 8, col 12 of module M",
    ],
  ])(
    "names the property in %j without taking its RECURSIVE operator apart, as TLC does",
    async (definitions, name) => {
      const result = await check({
        source: getTwoStateSource(definitions),
        config: "INIT Init\nNEXT Next\nPROPERTY P",
      });
      expect(result.violation?.name).toBe(name);
    },
  );

  it.each([
    [`${loopBase}INSTANCE R WITH z <- x\nP == Ev(1) /\\ [](x \\in {0, 1})`, "Ev"],
    [
      `${loopBase}I == INSTANCE R WITH z <- x\nP == LET J == INSTANCE R WITH z <- x IN J!Ev(1) /\\ [](x \\in {0, 1})`,
      "J!Ev",
    ],
  ])(
    "names the property in %j by the INSTANCE's copy of a RECURSIVE operator it takes apart, as TLC does",
    async (definitions, name) => {
      const result = await check({
        source: getTwoStateSource(definitions),
        config: "INIT Init\nNEXT Next\nPROPERTY P",
      });
      expect(result.violation?.name).toBe(name);
    },
  );

  const argumentBase = "G(Op(_)) == TRUE\nH(a) == x' = a\n";
  const stateTheorem = "THEOREM T == x \\in {0, 1}\n";

  it.each([
    [`${argumentBase}C == FALSE /\\ G(H)\nSpec == Init /\\ [][Next]_x /\\ C`, "SPECIFICATION Spec"],
    [`${stateTheorem}C == FALSE /\\ T\nSpec == Init /\\ [][Next]_x /\\ C`, "SPECIFICATION Spec"],
    [
      `${stateTheorem}C == IF TRUE THEN FALSE ELSE T\nSpec == Init /\\ [][Next]_x /\\ C`,
      "SPECIFICATION Spec",
    ],
    [
      "G(Op(_)) == TRUE\nC == FALSE /\\ G(LAMBDA a : x' = a)\nSpec == Init /\\ [][Next]_x /\\ C",
      "SPECIFICATION Spec",
    ],
    [
      `${stateTheorem}C == FALSE /\\ T\nP == C /\\ [](x \\in {0, 1})`,
      "INIT Init\nNEXT Next\nPROPERTY P",
    ],
    [
      `${stateTheorem}C == IF TRUE THEN FALSE ELSE T\nP == C /\\ [](x \\in {0, 1})`,
      "INIT Init\nNEXT Next\nPROPERTY P",
    ],
  ])(
    "rejects %j by the value startup stored for C, as TLC's lookup does",
    async (definitions, config) => {
      await expect(check({ source: getTwoStateSource(definitions), config })).rejects.toThrow(
        new TlaConfigError("The spec is trivially false because C is false."),
      );
    },
  );

  it("rejects a spec conjunct whose stored value isn't a boolean, as TLC does", async () => {
    await expect(
      check({
        source: getTwoStateSource(
          `${stateTheorem}C == IF TRUE THEN 1 ELSE T\nSpec == Init /\\ [][Next]_x /\\ C`,
        ),
        config: "SPECIFICATION Spec",
      }),
    ).rejects.toThrow(
      new TlaConfigError("The operator C, which equals 1,\ncannot be used as a spec"),
    );
  });

  it.each([
    `${argumentBase}C == G(H)\nP == []C`,
    `${argumentBase}P == [](G(H))`,
    "G(Op(_)) == TRUE\nP == [](G(LAMBDA a : x' = a))",
    `${argumentBase}K(Op(_)) == [](G(Op))\nP == K(H)`,
    "G(Op(_)) == TRUE\nP == LET L(a) == x' = a IN [](G(L))",
    "a ++ b == x' = a\nG(Op(_, _)) == TRUE\nP == [](G(++))",
  ])(
    "checks the property %j as an invariant, as TLC's level bound takes an operator argument for a constant",
    async (definitions) => {
      const result = await check({
        source: getTwoStateSource(definitions),
        config: "INIT Init\nNEXT Next\nPROPERTY P",
      });
      expect([result.status, result.distinctStates]).toEqual(["success", 2]);
    },
  );

  const getExtendingSource = (extended: string, definitions: string) =>
    `---- MODULE M ----\nEXTENDS ${extended}, Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 2\n${definitions}\n====`;

  it.each([
    ['G(Op(_)) == Op("level") \\in Nat\nC == PrintT(<<"C", G(TLCGet)>>)', ['<<"C", TRUE>>']],
    [
      'G(Op(_)) == Op("level") \\in Nat\nK(Op(_)) == G(Op)\nC == PrintT(<<"C", K(TLCGet)>>)',
      ['<<"C", TRUE>>'],
    ],
    [
      'G(Op(_)) == Op("level") \\in Nat\nC == PrintT(<<"C", LET L == G(TLCGet) IN L>>)',
      ['<<"C", TRUE>>'],
    ],
    [
      'G(Op(_)) == Op("level")\nC == PrintT(<<"C", G(LAMBDA v : TLCGet(v) \\in Nat)>>)',
      ['<<"C", TRUE>>'],
    ],
    ['C == PrintT(<<"C", TLCGet("level") \\in Nat>>)', []],
  ])(
    "prints %j as TLC starts only for a builtin passed as an operator argument, which TLC's level bound takes for a constant",
    async (definitions, expected) => {
      const printed: string[] = [];
      await check({
        source: getExtendingSource("TLC", definitions),
        config: "INIT Init\nNEXT Next",
        onPrint: (text) => printed.push(text),
      });
      expect(printed).toEqual(expected);
    },
  );

  it.each([
    ["TLC", "G(Op(_)) == TRUE\nC == FALSE /\\ G(TLCGet)\nSpec == Init /\\ [][Next]_x /\\ C"],
    [
      "TLCExt",
      "G(Op(_)) == TRUE\nC == FALSE /\\ G(PickSuccessor)\nSpec == Init /\\ [][Next]_x /\\ C",
    ],
  ])(
    "rejects the spec by C's startup value when C passes a builtin of %s as an operator argument",
    async (extended, definitions) => {
      await expect(
        check({ source: getExtendingSource(extended, definitions), config: "SPECIFICATION Spec" }),
      ).rejects.toThrow(new TlaConfigError("The spec is trivially false because C is false."));
    },
  );

  it.each([
    "G(Op(_)) == TRUE\nP == [](G(PickSuccessor))",
    "G(Op(_)) == TRUE\nC == G(PickSuccessor)\nP == []C",
    "G(Op(_)) == TRUE\nP == LET L == G(PickSuccessor) IN []L",
  ])(
    "checks the property %j as an invariant, as TLC's level bound takes a builtin operator argument for a constant",
    async (definitions) => {
      const result = await check({
        source: getExtendingSource("TLCExt", definitions),
        config: "INIT Init\nNEXT Next\nPROPERTY P",
      });
      expect([result.status, result.distinctStates]).toEqual(["success", 2]);
    },
  );

  const getLetInstanceSource = (variable: string, definitions: string) =>
    `---- MODULE M ----\nEXTENDS TLC, Naturals\nVARIABLE ${variable}\nInit == ${variable} = 0\nNext == ${variable}' = (${variable} + 1) % 2\n${definitions}\n====\n`;
  const getInstancedModule = (line: string) =>
    `---- MODULE P ----\n${line}\nCONSTANT c\nP1 == c\n====\n`;
  const instancedPrint = 'D == LET K == INSTANCE P WITH c <- 1 IN PrintT(<<"P1", K!P1>>)';
  const directPrint = 'D == LET K == INSTANCE TLC IN PrintT(<<"P1", 1>>)';

  it.each([
    ["y", instancedPrint, "EXTENDS TLC", ['<<"P1", 1>>']],
    ["x", instancedPrint, "EXTENDS TLC", []],
    ["y", instancedPrint, "LOCAL INSTANCE TLC", ['<<"P1", 1>>']],
    ["a", instancedPrint, "EXTENDS Naturals", []],
    ["y", instancedPrint, "EXTENDS Naturals", ['<<"P1", 1>>']],
    ["s", instancedPrint, "EXTENDS Sequences", []],
    ["x", instancedPrint, "EXTENDS FiniteSets", []],
    ["y", directPrint, "", ['<<"P1", 1>>']],
    ["a", directPrint, "", ['<<"P1", 1>>']],
    ["n", directPrint, "", []],
  ])(
    "with VARIABLE %s, evaluates %j at startup unless a TLA+ body K exports from %j applies that name, as TLC does",
    async (variable, definitions, line, printed) => {
      const prints: string[] = [];
      await check({
        source: getLetInstanceSource(variable, definitions),
        config: "INIT Init\nNEXT Next",
        loadModule: (name) => (name === "P" ? getInstancedModule(line) : undefined),
        onPrint: (text) => prints.push(text),
      });
      expect(prints).toEqual(printed);
    },
  );

  it.each([
    ["y", "INSTANCE P WITH c <- 1", "EXTENDS Naturals"],
    ["y", "INSTANCE TLC", ""],
  ])(
    "with VARIABLE %s, rejects the spec by C's startup value through LET K == %s, as TLC does",
    async (variable, instance, line) => {
      await expect(
        check({
          source: getLetInstanceSource(
            variable,
            `C == LET K == ${instance} IN FALSE\nSpec == Init /\\ [][Next]_${variable} /\\ C`,
          ),
          config: "SPECIFICATION Spec",
          loadModule: (name) => (name === "P" ? getInstancedModule(line) : undefined),
        }),
      ).rejects.toThrow(new TlaConfigError("The spec is trivially false because C is false."));
    },
  );

  it.each([
    ["a", "INSTANCE P WITH c <- 1", "EXTENDS Naturals"],
    ["x", "INSTANCE TLC", ""],
  ])(
    "with VARIABLE %s, takes C through LET K == %s whole as an initial predicate, as TLC does",
    async (variable, instance, line) => {
      const result = await check({
        source: getLetInstanceSource(
          variable,
          `C == LET K == ${instance} IN FALSE\nSpec == Init /\\ [][Next]_${variable} /\\ C`,
        ),
        config: "SPECIFICATION Spec",
        loadModule: (name) => (name === "P" ? getInstancedModule(line) : undefined),
      });
      expect([result.status, result.distinctStates]).toEqual(["success", 0]);
    },
  );

  // Deviation from TLC: TLC evaluates the copy by SANY's placeholder body, so it prints <<"A", FALSE>> for Nat == {} and fails JavaTime as an unbounded CHOOSE.
  it.each([
    ["Naturals", "1 \\in K!Nat"],
    ["TLC", "K!JavaTime > 0"],
  ])("evaluates LET K == INSTANCE %s's %s by the Java override", async (module, expression) => {
    const printed: string[] = [];
    await check({
      source: getLetInstanceSource(
        "y",
        `ASSUME LET K == INSTANCE ${module} IN PrintT(<<"A", ${expression}>>)`,
      ),
      config: "INIT Init\nNEXT Next",
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toEqual(['<<"A", TRUE>>']);
  });

  const literalBase =
    "---- MODULE B7 ----\nCONSTANT c\nTHEOREM Cz == c = 1\n====\nJ7 == INSTANCE B7 WITH c <- 1\n";

  // Deviation from TLC: SpecProcessor#processConstants visits a module's own theorems but not an INSTANCE's copies, so a literal substitute that only the copies reach has no value. Evaluating one fails with a NullPointerException, which startup swallows before it rejects the property as "The operator J7!Cz ... cannot be used as a property".
  it.each([
    ["P == J7!Cz", "INIT Init\nNEXT Next\nPROPERTY P"],
    ["P == LET K == INSTANCE B7 WITH c <- 1 IN K!Cz", "INIT Init\nNEXT Next\nPROPERTY P"],
    ["ASSUME J7!Cz", "INIT Init\nNEXT Next"],
    ["P == J7!Cz", "INIT Init\nNEXT Next\nINVARIANT P"],
  ])(
    "evaluates the theorem that %j reaches with its literal substitute, where TLC fails with a NullPointerException",
    async (definitions, config) => {
      const result = await check({
        source: getTwoStateSource(`${literalBase}${definitions}`),
        config,
      });
      expect(result.status).toBe("success");
    },
  );

  // Deviation from TLC: as above, TLC rejects P as "The operator K!Cz ... cannot be used as a property".
  it("evaluates at startup a property that reaches a theorem with a literal substitute, where TLC fails with a NullPointerException", async () => {
    await expect(
      check({
        source: getTwoStateSource(`${literalBase}P == LET K == INSTANCE B7 WITH c <- 2 IN K!Cz`),
        config: "INIT Init\nNEXT Next\nPROPERTY P",
      }),
    ).rejects.toThrow(new TlaConfigError("The property of P is equal to FALSE"));
  });

  it("takes a theorem that a <- substitutes for undefined, as TLC does", async () => {
    await expect(
      check({
        source: getTwoStateSource("CONSTANT c\nTHEOREM T == TRUE"),
        config: "INIT Init\nNEXT Next\nCONSTANT c <- T",
      }),
    ).rejects.toThrow(
      new TlaConfigError(
        "The configuration file substitutes for c with the undefined identifier T.",
      ),
    );
  });

  it("finds the Java override a root theorem shares its name with, as TLC's defns holds no theorem", async () => {
    await expect(
      check({
        source: getTwoStateSource("THEOREM Len == TRUE\nI == INSTANCE Sequences"),
        config: "INIT Init\nNEXT Next\nINVARIANT Len",
      }),
    ).rejects.toThrow(
      new TlaConfigError(
        "The invariant of Len is equal to <Java Method: public static tlc2.value.impl.IntValue tlc2.module.Sequences.Len(tlc2.value.impl.Value)>",
      ),
    );
    const substituted = await check({
      source: getTwoStateSource("CONSTANT c\nTHEOREM Len == TRUE\nI == INSTANCE Sequences"),
      config: "INIT Init\nNEXT Next\nCONSTANT c <- Len",
    });
    expect(substituted.status).toBe("success");
  });

  it("takes a theorem that the ALIAS names for undefined, as TLC does", async () => {
    const result = await check({
      source: getTwoStateSource("THEOREM T == x \\in {0, 1}\nASSUME A == TRUE\nInv == x = 0"),
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nALIAS T",
    });
    expect(result.violation?.trace[0].state._ALIASEvalError).toBe(
      "The alias T specified in the configuration file\nis not defined in the specification.",
    );
  });

  it("checks in the initial state a property that reaches an action-level theorem, as TLC's level bound skips it", async () => {
    const result = await check({
      source: getTwoStateSource("THEOREM T2 == x' = x\nP == ~T2"),
      config: "INIT Init\nNEXT Next\nPROPERTY P",
    });
    expect([result.status, result.failure?.message]).toEqual([
      "error",
      "In evaluation, the identifier x is either undefined or not an operator.\nline 6, col 15 to line 6, col 15 of module M",
    ]);
  });

  it.each(["THEOREM T == x \\in {0, 1}\nC == T", "THEOREM T2 == x' = x\nC == T2"])(
    "substitutes the definition in %j for a constant, as TLC's level bound skips its theorem",
    async (definitions) => {
      const result = await check({
        source: getTwoStateSource(`CONSTANT c\n${definitions}`),
        config: "INIT Init\nNEXT Next\nCONSTANT c <- C",
      });
      expect(result.status).toBe("success");
    },
  );

  it("evaluates at startup a definition that reaches a theorem, as TLC's level bound skips it", async () => {
    const prints: string[] = [];
    await check({
      source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 2\nTHEOREM T == x \\in {0, 1}\nC == PrintT("c") /\\ T\n====`,
      config: "INIT Init\nNEXT Next",
      onPrint: (text) => prints.push(text),
    });
    expect(prints).toEqual(['"c"']);
  });

  it("takes an atom of a temporal property to the level TLC bounds its LET by", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 2\nP == <>((LET A == x' = x IN 1) = 2)\n====",
        config: "INIT Init\nNEXT Next\nPROPERTY P",
      }),
    ).rejects.toThrow(
      new TlaEvaluationError(
        "Temporal formulas containing actions must be of forms <>[]A or []<>A.",
      ),
    );
  });

  it('describes a property in TLCGet("spec") at the level TLC bounds its LET by', async () => {
    const prints: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS Naturals, TLC, FiniteSets\nVARIABLE x\nInit == x = 0\nNext == x\' = (x + 1) % 2\nP == [](LET A == x\' = x IN x \\in {0, 1})\nInv == PrintT(<<Cardinality(TLCGet("spec").invariants), Cardinality(TLCGet("spec").impliedtemporals)>>)\n====',
      config: "INIT Init\nNEXT Next\nPROPERTY P\nINVARIANT Inv",
      onPrint: (text) => prints.push(text),
    });
    expect(prints).toEqual(["<<1, 1>>", "<<1, 1>>"]);
  });

  it("rejects an invariant that is not a state predicate", async () => {
    await expect(
      checkBody(
        "VARIABLE x\nInit == x = 0\nNext == x' = x\nInv == []TRUE",
        "INIT Init\nNEXT Next\nINVARIANT Inv",
      ),
    ).rejects.toThrow(
      new TlaConfigError(
        "The invariant Inv is not a state predicate (one with no primes or temporal operators).",
      ),
    );
    await expect(
      checkBody(
        "VARIABLE x\nInit == x = 0\nNext == x' = x\nInv == x' = x",
        "INIT Init\nNEXT Next\nINVARIANT Inv",
      ),
    ).rejects.toThrow(
      new TlaConfigError(
        "The invariant Inv is not a state predicate (one with no primes or temporal operators).\nNote that a bug can cause TLC to incorrectly report this error.\nIf you believe your TLA+ or PlusCal specification to be correct,\nplease check if this bug described in LevelNode.java starting at line 590ff affects you.",
      ),
    );
  });

  it.each(["x'", "[](x = 0)"])(
    "rejects an instanced invariant whose substitute %s is not a state predicate",
    async (substitute) => {
      await expect(
        checkBody(
          `---- MODULE N ----\nCONSTANT Op(_), k\nInv == Op(k)\n====\nVARIABLE x\nINSTANCE N WITH Op <- LAMBDA p : TRUE, k <- ${substitute}\nInit == x = 0\nNext == x' = x`,
          "INIT Init\nNEXT Next\nINVARIANT Inv",
        ),
      ).rejects.toThrow(
        new TlaConfigError(
          "The invariant Inv is not a state predicate (one with no primes or temporal operators).",
        ),
      );
    },
  );

  it.each(["y", "z"])(
    "rejects an invariant that selects through an instance with a primed argument for the bound %s",
    async (bound) => {
      await expect(
        checkBody(
          `---- MODULE L ----\nCONSTANT c\nDef == \\A ${bound} \\in {1} : <<${bound}, c>> = <<1, 1>>\n====\nVARIABLE y\nI3 == INSTANCE L WITH c <- y\nInv == I3!Def!(y')!1\nInit == y = 0\nNext == y' = y`,
          "INIT Init\nNEXT Next\nINVARIANT Inv",
        ),
      ).rejects.toThrow(
        new TlaConfigError(
          "The invariant Inv is not a state predicate (one with no primes or temporal operators).\nNote that a bug can cause TLC to incorrectly report this error.\nIf you believe your TLA+ or PlusCal specification to be correct,\nplease check if this bug described in LevelNode.java starting at line 590ff affects you.",
        ),
      );
    },
  );

  it("binds a variable once for each time a lazy UNION streams an element", async () => {
    const set = "UNION {SUBSET {1}, {{}}}";
    const result = await checkBody(
      `VARIABLE x\nInit == x \\in ${set}\nNext == x' \\in ${set}`,
      "INIT Init\nNEXT Next",
    );
    expect([result.generatedStates, result.distinctStates]).toEqual([9, 2]);
  });

  it("takes each element of S for x' \\in S as it streams S, as TLC's getNextStates does", async () => {
    const printed: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS TLC\nVARIABLE x\nInit == x = {}\nNext == x = {} /\\ x\' \\in {s \\in SUBSET {1, 2} : PrintT(<<"f", s>>)} /\\ PrintT(<<"n", x\'>>)\n====',
      config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toEqual([
      '<<"f", {}>>',
      '<<"n", {}>>',
      '<<"f", {1}>>',
      '<<"n", {1}>>',
      '<<"f", {2}>>',
      '<<"n", {2}>>',
      '<<"f", {1, 2}>>',
      '<<"n", {1, 2}>>',
    ]);
  });

  it("keeps a set operation lazy unless TLC can reduce both sets", async () => {
    const getCounts = async (set: string) => {
      const result = await checkBody(
        `EXTENDS Naturals\nVARIABLE x\nInit == x \\in ${set}\nNext == UNCHANGED x`,
        "INIT Init\nNEXT Next",
      );
      return [result.generatedStates, result.distinctStates];
    };
    expect(await getCounts("SUBSET {1} \\cup SUBSET {2}")).toEqual([7, 3]);
    expect(await getCounts("(1..3) \\cup SUBSET {}")).toEqual([8, 4]);
    expect(await getCounts("{1} \\cup {1, 2}")).toEqual([4, 2]);
  });

  it.each<[TlcVersion, number[]]>([
    ["master", [21, 17, 25]],
    ["1.7.4", [21, 21, 25]],
  ])("streams a lazy UNION's duplicates until TLC %s caches the set", async (version, expected) => {
    const nexts = [
      "y' \\in UNION {UNION {0..2, {1}}, {7}}",
      "\\E e \\in UNION {UNION {0..2, {1}}, {7}} : y' = e",
      "y' \\in {1} \\X UNION {UNION {0..2, {1}}, {1, 2}}",
    ];
    const results = await Promise.all(
      nexts.map((next) =>
        check({
          source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == (${next}) /\\ UNCHANGED x\n====`,
          config: "INIT Init\nNEXT Next",
          version,
        }),
      ),
    );
    expect(results.map((result) => result.generatedStates)).toEqual(expected);
  });

  it("evaluates a LET definition's UNION again at each reference in an action", async () => {
    const result = await checkBody(
      "EXTENDS Naturals, FiniteSets\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == LET u == UNION {UNION {0..2, {1}}, {7}} IN Cardinality(u) > 0 /\\ y' \\in u /\\ UNCHANGED x",
      "INIT Init\nNEXT Next",
    );
    expect(result.generatedStates).toBe(21);
  });

  it.each([
    ["", undefined],
    [" with coverage", 1],
  ])(
    "evaluates a LET definition again at each reference in an action, but once under ENABLED%s, as TLC's Tool does",
    async (_title, coverage) => {
      const prints: string[] = [];
      await check({
        coverage,
        source:
          '---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == x = 0\nNext == x < 1 /\\ LET r == PrintT(<<"next", x>>) IN x\' = IF r /\\ r THEN x + 1 ELSE x\nInv == ENABLED (LET r == PrintT(<<"enabled", x>>) IN x\' = IF r /\\ r THEN x ELSE x)\n====',
        config: "INIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
        onPrint: (text) => prints.push(text),
      });
      expect(prints).toEqual([
        '<<"enabled", 0>>',
        '<<"next", 0>>',
        '<<"next", 0>>',
        '<<"enabled", 1>>',
      ]);
    },
  );

  it("draws a LET definition's random subset again at each reference in an action, as TLC's Tool#getNextStates does", async () => {
    const prints: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS Integers, TLC, Randomization\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ LET s == RandomSubset(1, 1..100) IN PrintT(<<"n", s, s>>) /\\ x\' = x + 1\nInv == LET s == RandomSubset(1, 1..100) IN PrintT(<<"i", s, s>>)\nInv2 == ENABLED (LET s == RandomSubset(1, 1..100) IN PrintT(<<"e", s, s>>) /\\ x\' = x)\n====',
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nINVARIANT Inv2\nCHECK_DEADLOCK FALSE",
      seed: 4n,
      onPrint: (text) => prints.push(text),
    });
    expect(prints).toEqual([
      '<<"i", {10}, {10}>>',
      '<<"e", {78}, {78}>>',
      '<<"n", {7}, {100}>>',
      '<<"e", {7}, {7}>>',
      '<<"n", {1}, {49}>>',
      '<<"e", {65}, {65}>>',
    ]);
  });

  it("takes a LET definition without parameters that prints or asserts for an action of the initial predicate and the next-state relation, as TLC's Tool does", async () => {
    const prints: string[] = [];
    const result = await check({
      source:
        '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == LET A == x = 0 /\\ PrintT("init") IN A\nNext == LET B == x < 3 /\\ Assert(x < 5, "m") /\\ x\' = x + 1 IN B\nInv == x < 2\n====',
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      onPrint: (text) => prints.push(text),
    });
    expect([
      result.status,
      result.violation?.trace.map((step) => [step.state.x, step.label]),
      prints,
    ]).toEqual([
      "invariant-violation",
      [
        [0, undefined],
        [1, "B line 5, col 18 to line 5, col 58 of module M"],
        [2, "B line 5, col 18 to line 5, col 58 of module M"],
      ],
      ['"init"'],
    ]);
  });

  it("reports initial states without a next-state action", async () => {
    await expect(checkBody("VARIABLE x\nInit == x \\in {1, 2}", "INIT Init")).rejects.toThrow(
      /No next state actions defined to generate successor states from/,
    );
  });

  const checkBody = (body: string, config: string) =>
    check({ source: `---- MODULE M ----\n${body}\n====`, config });

  it.each([
    ["[](FALSE)", "FALSE"],
    ["[]Bad", "Bad"],
    ["[](Op(1))", "Property"],
    ["Op(1)", "Op"],
    ["Two(0)", "line 6, col 11 to line 6, col 15 of module M"],
    ["[](x = 0) /\\ [](x = 1)", "line 8, col 26 to line 8, col 34 of module M"],
    ["[](x = 0) /\\ (x = 1)", "line 8, col 27 to line 8, col 31 of module M"],
    ["\\A n \\in {0, 1} : x # n", "line 8, col 31 to line 8, col 35 of module M"],
    ["[](x < 9) /\\ [][x = 7]_x", "line 8, col 26 to line 8, col 36 of module M"],
  ])("names the part of property %s that fails as TLC does", async (property, name) => {
    const result = await checkBody(
      `EXTENDS Integers\nVARIABLE x\nBad == x = 1\nOp(n) == x = n\nTwo(n) == x # n /\\ x # n + 1\nSpec == x = 0 /\\ [][x' = x + 1 /\\ x < 3]_x\nProperty == ${property}`,
      "SPECIFICATION Spec\nPROPERTY Property\nCHECK_DEADLOCK FALSE",
    );
    expect(result.violation?.name).toBe(name);
  });

  it("names the invariant a property asserts by the operator an extended module defines", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Base\nSpec == x = 0 /\\ [][x' = x + 1 /\\ x < 3]_x\nProperty == []Small\n====",
      config: "SPECIFICATION Spec\nPROPERTY Property\nCHECK_DEADLOCK FALSE",
      loadModule: (name) =>
        name === "Base"
          ? "---- MODULE Base ----\nEXTENDS Integers\nVARIABLE x\nSmall == x < 2\n===="
          : undefined,
    });
    expect(result.violation?.name).toBe("Small");
  });

  it("rejects a property that quantifies over no elements as a tautology", async () => {
    await expect(
      checkBody(
        "VARIABLE x\nSpec == x = 0 /\\ [][x' = x]_x\nProperty == \\A n \\in {} : x # n",
        "SPECIFICATION Spec\nPROPERTY Property",
      ),
    ).rejects.toThrow("Temporal formula is a tautology (its negation is unsatisfiable).");
  });

  it.each([
    ["x \\in UNION UNION (SUBSET {{}, {{}}})", "UNCHANGED x", [3, 1]],
    ["x \\in UNION UNION {SUBSET {1}, {{1}}}", "UNCHANGED x", [3, 1]],
    ["x = 0", "x = 0 /\\ x' \\in UNION UNION (SUBSET {{1}, {1, 2}})", [7, 3]],
  ])("streams a lazy UNION of a lazy UNION with Init %s", async (init, next, counts) => {
    const result = await checkBody(
      `VARIABLE x\nInit == ${init}\nNext == ${next}`,
      "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
    );
    expect([result.generatedStates, result.distinctStates]).toEqual(counts);
  });

  it.each([
    ["UNION {UNION (SUBSET {{1}, {1, 2}}), {1}}", [8, 3]],
    ["UNION {{1}, UNION (SUBSET {{1}, {1, 2}})}", [6, 3]],
  ])("streams a lazy UNION in %s until a sort compares it as TLC does", async (set, counts) => {
    const result = await checkBody(
      `VARIABLE x\nInit == x \\in ${set}\nNext == UNCHANGED x`,
      "INIT Init\nNEXT Next",
    );
    expect([result.generatedStates, result.distinctStates]).toEqual(counts);
  });
});

describe("check without code generation from strings", () => {
  it.each([
    [
      "a spec",
      "VARIABLE present\nInit == present = FALSE\nNext == UNCHANGED present\nInv == ~present \\/ present",
    ],
    [
      "a set filter whose predicate ignores the element",
      "EXTENDS Integers\nVARIABLE x\nInit == x = 0\nNext == UNCHANGED x\nInv == {e \\in 1..2147483647 : 1..3 \\subseteq {1, 2}} = {} /\\ {e \\in 1..3 : x = 0} = 1..3",
    ],
    [
      "a predicate's UNCHANGED that fails to compare a variable with its successor",
      "VARIABLE x\nInit == x = 0\nNext == x' = {1} /\\ ~UNCHANGED x\nInv == TRUE",
    ],
    [
      "a filter's membership whose base fails after framing the failure",
      "EXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = x /\\ <<1, x>> \\notin {e \\in ({} \\cup Nat) : e # x}\nInv == TRUE",
    ],
    [
      "a member of SUBSET S that would fail the filter past its first element outside S",
      "EXTENDS Integers\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 3 /\\ ~({t \\in (0..2) \\X {x} : 1 \\div (2 - t[1]) >= 0} \\in SUBSET ((1..2) \\X {x}))\nInv == TRUE",
    ],
    [
      "the domain of a converted function over SUBSET",
      "EXTENDS Integers\nVARIABLE x\nInit == x = 0\nNext == x' = x /\\ LET f == [s \\in SUBSET {1} |-> 0] IN f = f /\\ (DOMAIN f)[1] = 0\nInv == TRUE",
    ],
  ])("checks %s like it does with code generation", async (_title, body) => {
    const options = {
      source: `---- MODULE M ----\n${body}\n====`,
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    };
    const script = `const tlaTs = await import(${JSON.stringify(pathToFileURL(DIST).href)});
console.log(JSON.stringify(await tlaTs.check(${JSON.stringify(options)})));`;
    const output = execFileSync(
      process.execPath,
      ["--disallow-code-generation-from-strings", "--input-type=module", "--eval", script],
      { encoding: "utf8" },
    );
    expect(JSON.parse(output)).toEqual(JSON.parse(JSON.stringify(await check(options))));
  });
});

const getCheckText = async (options: CheckOptions) => {
  const output: unknown[] = [];
  const result = await check({
    ...options,
    onPrint: (text) => output.push(text),
    onProgress: (progress) => output.push(progress),
  });
  return JSON.stringify([result, output], (key, value: unknown) =>
    key === "callStack" || key === "liveCallStack"
      ? undefined
      : typeof value === "bigint"
        ? String(value)
        : value,
  );
};

describe("check names definitions and constants as the spec spells them", () => {
  const source = [
    "---- MODULE Root ----",
    "EXTENDS Naturals, TLC",
    "VARIABLE x",
    "Init == x = 0",
    "Inc == x' = (x + 1) % 3",
    "Next == Inc",
    "Spec == Init /\\ [][Next]_x /\\ WF_x(Next)",
    "Small == x < 2",
    "Live == <>(x = 5)",
    "Up == [][x' > x]_x",
    "Bad == x' = CHOOSE y \\in {} : TRUE",
    "View == x",
    "Alias == [x |-> x]",
    "====",
  ].join("\n");

  it.each([
    ["an invariant", "SPECIFICATION Spec\nINVARIANT Small\nVIEW View\nALIAS Alias", "Small"],
    ["a temporal property", "SPECIFICATION Spec\nPROPERTY Live", "Live"],
    ["an action property", "INIT Init\nNEXT Next\nPROPERTY Up", "Up"],
    ["an error in an action", "INIT Init\nNEXT Bad", "Init"],
  ])("in the result and output of %s", async (_title, config, name) => {
    const text = await getCheckText({ source, config, coverage: 1 });
    expect(text).toContain(name);
    expect(text).not.toContain("@Root");
  });

  it("in the error for a constant substituted with a non-constant definition", async () => {
    await expect(
      check({
        source:
          "---- MODULE Root ----\nVARIABLE v\nCONSTANT c\nDef == v\nInit == v = 0\nNext == UNCHANGED v\n====",
        config: "CONSTANT c <- Def\nINIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(/^The configuration file substitutes constant c with non-constant Def - /);
  });

  it("in the error for a constant that a second extended module declares again", async () => {
    const modules = new Map([
      ["P1", "---- MODULE P1 ----\nCONSTANT c\n===="],
      ["P2", "---- MODULE P2 ----\nEXTENDS Naturals\nCONSTANT c\nD == c + 1\n===="],
    ]);
    const text = await getCheckText({
      source:
        "---- MODULE Root ----\nEXTENDS TLC, P1, P2\nVARIABLE v\nASSUME PrintT(D)\nInit == v = 0\nNext == UNCHANGED v\n====",
      config: "CONSTANT c = 1\nINIT Init\nNEXT Next",
      loadModule: (name) => modules.get(name),
    });
    expect(text).toContain(
      "In evaluation, the identifier c is either undefined or not an operator.",
    );
    expect(text).not.toContain("c@");
  });
});
