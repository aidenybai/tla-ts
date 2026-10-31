import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import {
  check,
  type CheckResult,
  formatValue,
  parseConfig,
  parseModule,
  TlaConfigError,
  TlaEvaluationError,
  TlaSyntaxError,
} from "../../src";
import { UNEXPECTED_EXCEPTION } from "../../src/errors";

const FIXTURES = join(import.meta.dirname, "../fixtures");

const checkModule = (body: string, config = "") =>
  check({
    source: `---- MODULE M ----\nEXTENDS Integers, Sequences, FiniteSets, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = x\n${body}\n====`,
    config: `${config}\nINIT Init\nNEXT Next`,
  });

const checkFixture = (directory: string, name: string) =>
  check({
    source: readFileSync(join(FIXTURES, directory, `${name}.tla`), "utf8"),
    config: readFileSync(join(FIXTURES, directory, `${name}.cfg`), "utf8"),
  });

describe("check matches TLC", () => {
  it("evaluates every assumption in the semantics fixture", async () => {
    const result = await checkFixture("semantics", "Semantics");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([2, 1, 1]);
  });

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
        check({
          source: readFileSync(join(FIXTURES, "ordering", "Ordering.tla"), "utf8"),
          config: readFileSync(join(FIXTURES, "ordering", `${name}.cfg`), "utf8"),
        }),
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

  it("compares power sets through their bases", async () => {
    expect((await checkModule("ASSUME SUBSET (1..23) \\subseteq SUBSET (1..42)")).status).toBe(
      "success",
    );
    expect((await checkModule("ASSUME ~(SUBSET (1..42) \\subseteq SUBSET (2..42))")).status).toBe(
      "success",
    );
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

  it("exposes TLC's level, counters, and registers through TLCGet and TLCSet", async () => {
    const results = await Promise.all(
      ["Runtime", "Distinct", "Generated"].map((name) =>
        check({
          source: readFileSync(join(FIXTURES, "runtime", "Runtime.tla"), "utf8"),
          config: readFileSync(join(FIXTURES, "runtime", `${name}.cfg`), "utf8"),
        }),
      ),
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
        check({
          source: readFileSync(join(FIXTURES, "postconditions", "Postconditions.tla"), "utf8"),
          config: readFileSync(join(FIXTURES, "postconditions", `${name}.cfg`), "utf8"),
          onPrint: () => {},
        }),
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
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nWitness(i) == \\E j \\in 1..3 : j >= i\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1 /\\ \\A i \\in {1, 2} : Witness(i)\n====",
      config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
    });
    expect([result.generatedStates, result.distinctStates]).toEqual([13, 3]);
  });

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
    const result = await check({
      source: readFileSync(join(FIXTURES, "strings", "StringOrder.tla"), "utf8"),
      config: readFileSync(join(FIXTURES, "strings", "StringOrder.cfg"), "utf8"),
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
    const result = await check({
      source: readFileSync(join(FIXTURES, "randomization", "RandomModelValue.tla"), "utf8"),
      config: readFileSync(join(FIXTURES, "randomization", "RandomModelValue.cfg"), "utf8"),
    });
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
      new TlaEvaluationError("Failed to recover the next state from its fingerprint."),
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

  it("implements the TLCExt operators", async () => {
    const results = await Promise.all(
      ["Extensions", "ExtensionsShort"].map((name) =>
        check({
          source: readFileSync(join(FIXTURES, "runtime", "Extensions.tla"), "utf8"),
          config: readFileSync(join(FIXTURES, "runtime", `${name}.cfg`), "utf8"),
        }),
      ),
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

  it("checks liveness on the symmetry-reduced graph", async () => {
    const result = await checkFixture("symmetry", "SymmetricLiveness");
    expect(result.status).toBe("liveness-violation");
    expect(result.violation?.name).toBe("Live");
    expect(result.violation?.trace.map((step) => step.state.x)).toMatchObject([
      { kind: "ModelValue", name: "m1" },
    ]);
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

  it("reports the unassigned constant TLC finds first", async () => {
    const cases = [
      [
        "CONSTANT TableId\nCONSTANT Snapshot\nCONSTANT BranchId",
        "CONSTANT TableId = 1",
        "BranchId",
      ],
      ["CONSTANTS Zeta, Alpha, Mid, N", "CONSTANT Mid = 1", "Zeta"],
      ["CONSTANTS N, Procs, Values, Acceptors, Quorums", "CONSTANT Procs = 1", "Quorums"],
    ];
    for (const [body, config, name] of cases) {
      await expect(checkModule(body, config)).rejects.toThrow(
        new TlaConfigError(
          `The constant parameter ${name} is not assigned a value by the configuration file.`,
        ),
      );
    }
  });

  it("rejects substituting a constant with a state-level definition", async () => {
    await expect(checkModule("CONSTANT C\nFoo == x", "CONSTANT C <- Foo")).rejects.toThrow(
      TlaConfigError,
    );
    expect((await checkModule("CONSTANT C\nFoo == 1", "CONSTANT C <- Foo")).status).toBe("success");
    // TLC rejects a state-level substitute only when evaluating it at startup fails.
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
      check({
        source: readFileSync(join(FIXTURES, "github687", "Github687spec.tla"), "utf8"),
        config: readFileSync(join(FIXTURES, "github687", `Github687spec${name}.cfg`), "utf8"),
      });
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
});

describe("formatValue matches TLC", () => {
  it("prints functions as records only when every key is a field name", async () => {
    const printed: string[] = [];
    const result = await check({
      source: readFileSync(join(FIXTURES, "formatting", "Format.tla"), "utf8"),
      config: readFileSync(join(FIXTURES, "formatting", "Format.cfg"), "utf8"),
      onPrint: (text) => printed.push(text),
    });
    expect(result.status).toBe("success");
    expect(printed).toEqual(
      readFileSync(join(FIXTURES, "formatting", "Format.out"), "utf8")
        .trim()
        .split("\n"),
    );
  });
});

const checkSteps = (definitions: string, config: string) =>
  check({
    source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == x = 0\nNext == x < 3 /\\ x' = x + 1\n${definitions}\n====`,
    config,
  });

const getFailureSummary = (result: CheckResult) => [
  result.status,
  result.failure?.trace.map((step) => formatValue(step.state.x)),
  [result.generatedStates, result.distinctStates, result.queuedStates, result.depth],
  result.failure?.exitCode,
];

describe("evaluation errors match TLC", () => {
  it("reports a failing TLCGet as a failure of its Java method like TLC", async () => {
    const signature =
      "public static tlc2.value.impl.Value tlc2.module.TLCGetSet.TLCGetEval(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel)";
    const cases = [
      ["TLCGet(42)", "TLCGet(42) was undefined."],
      ['TLCGet("nope")', "TLCGet(nope) was undefined."],
      [
        "TLCGet(<<1>>)",
        "The argument of TLCGet should be a nonnegative integer, but instead it is:\n<<1>>",
      ],
    ];
    const results = await Promise.all(
      cases.map((item) =>
        check({
          source: `---- MODULE M ----\nEXTENDS TLC\nVARIABLE x\nInit == x = ${item[0]}\nNext == UNCHANGED x\n====`,
          config: "INIT Init\nNEXT Next",
        }),
      ),
    );
    expect(results.map((result) => [result.failure?.message, result.failure?.exitCode])).toEqual(
      cases.map((item) => [
        `Attempted to apply the operator overridden by the Java method\n${signature},\nbut it produced the following error:\n${item[1]}`,
        75,
      ]),
    );
  });

  it("reports a CASE with no true guard like TLC", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nVARIABLE x\nASSUME CASE 1 = 2 -> 3\nInit == x = 0\nNext == UNCHANGED x\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect(result.violation?.message).toBe(
      "Attempted to evaluate a CASE with no conditions true.\nline 3, col 8 to line 3, col 22 of module M",
    );
  });

  it("reports a SUBSET too large to enumerate like TLC", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nInit == x = SUBSET (SUBSET (1..36))\nNext == x' = x\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect([result.failure?.message, result.failure?.exitCode]).toEqual([
      "Overflow when computing the number of elements in:\nSUBSET (1..36)",
      75,
    ]);
  });

  it("reports a variable read before the initial predicate assigns it like TLC", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nVARIABLES x, y\nInit == y = x /\\ x = 0\nNext == UNCHANGED <<x, y>>\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect([result.failure?.message, result.failure?.exitCode]).toEqual([
      "In evaluation, the identifier x is either undefined or not an operator.\nline 3, col 13 to line 3, col 13 of module M",
      75,
    ]);
  });

  it("reports a variable drawn from a set it can't enumerate like TLC", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x \\in Nat\nNext == UNCHANGED x\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect(result.failure?.message).toBe(
      "In computing initial states, the right side of \\IN is not enumerable.\nline 4, col 9 to line 4, col 17 of module M",
    );
    expect(result.failure?.exitCode).toBe(75);
  });

  it("reports a CASE with no true guard in the next-state relation like TLC", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nVARIABLE x\nInit == x = 0\nNext == CASE x = 5 -> x' = 0\n  [] x = 6 -> x' = 1\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect(result.failure?.message).toBe(
      "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: In computing next states, TLC encountered a CASE with no conditions true.\nline 4, col 9 to line 5, col 20 of module M",
    );
    expect(result.failure?.exitCode).toBe(75);
  });

  it("reports a CASE with no true guard in the initial predicate like TLC", async () => {
    const result = await check({
      source: "---- MODULE M ----\nVARIABLE x\nInit == CASE FALSE -> x = 0\nNext == x' = x\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect([result.failure?.message, result.failure?.exitCode]).toEqual([
      "In computing initial states, TLC encountered a CASE with no conditions true.\nline 3, col 9 to line 3, col 27 of module M",
      75,
    ]);
  });

  it("reports a failure of the next-state relation as an unexpected exception like TLC", async () => {
    const results = await Promise.all(
      ["x' = CHOOSE n \\in {} : TRUE", "x' = 1 \\div 0"].map((next) =>
        check({
          source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == ${next}\n====`,
          config: "INIT Init\nNEXT Next",
        }),
      ),
    );
    expect(results.map((result) => [result.failure?.message, result.failure?.exitCode])).toEqual([
      [
        `${UNEXPECTED_EXCEPTION}Attempted to compute the value of an expression of form\nCHOOSE x \\in S: P, but no element of S satisfied P.\nline 5, col 14 to line 5, col 35 of module M`,
        75,
      ],
      ["The second argument of \\div is 0.", 255],
    ]);
  });

  it("reports the behavior up to a state whose invariant fails to evaluate", async () => {
    const result = await checkSteps(
      "Inv == 1 \\div (2 - x) >= 0",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    );
    expect(result.failure?.message).toBe(
      "Evaluating invariant Inv failed.\nThe second argument of \\div is 0.",
    );
    expect(getFailureSummary(result)).toEqual(["error", ["0", "1", "2"], [3, 3, 0, 3], 76]);
  });

  it("names an action property that fails to evaluate", async () => {
    const result = await checkSteps(
      "P == [][1 \\div (2 - x) >= 0]_x\nSpec == Init /\\ [][Next]_x",
      "SPECIFICATION Spec\nPROPERTY P",
    );
    expect(result.failure?.message).toBe(
      "Evaluating action property P failed.\nThe second argument of \\div is 0.",
    );
    expect(getFailureSummary(result)).toEqual(["error", ["0", "1", "2", "3"], [4, 4, 0, 4], 255]);
  });

  it("reports the behavior up to a state whose successors fail to evaluate", async () => {
    const result = await checkSteps(
      'Step == Next /\\ Assert(x < 1, "boom")',
      "INIT Init\nNEXT Step",
    );
    expect(result.failure?.message).toBe(
      'The first argument of Assert evaluated to FALSE; the second argument was:\n"boom"',
    );
    expect(getFailureSummary(result)).toEqual(["error", ["0", "1"], [2, 2, 0, 2], 14]);
  });

  it("reports a check that is not a boolean at the location of its predicate", async () => {
    const getMessage = async (definitions: string, config: string) =>
      (await checkSteps(definitions, `INIT Init\nNEXT Next\n${config}`)).failure?.message;
    expect(await getMessage("Inv == x + 1", "INVARIANT Inv")).toBe(
      "TLC expected a boolean value, but did not find one. line 6, col 8 to line 6, col 12 of module M",
    );
    expect(await getMessage("Inv == 1", "INVARIANT Inv")).toBe(
      "TLC expected a boolean value, but did not find one. 1",
    );
    expect(await getMessage("C == x' + 1", "ACTION_CONSTRAINT C")).toBe(
      "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: TLC expected a boolean value, but did not find one. line 6, col 6 to line 6, col 11 of module M",
    );
    const property = await checkSteps(
      "Spec == Init /\\ [][Next]_x\nP == [][x' + 1]_x",
      "SPECIFICATION Spec\nPROPERTY P",
    );
    expect(property.failure?.message).toBe(
      "Evaluating action property P failed.\nAttempted to evaluate an expression of form [A]_e, but A was not a boolean.\nline 7, col 8 to line 7, col 17 of module M",
    );
  });

  it("names the initial state a check fails on unless a standard module fails", async () => {
    const config = "INIT Init\nNEXT Next\nINVARIANT Inv";
    const core = await checkSteps("Inv == (CHOOSE y \\in {} : TRUE) = x", config);
    const standard = await checkSteps("Inv == 1 \\div x = 0", config);
    expect(core.failure?.initialState).toEqual({ x: 0 });
    expect(getFailureSummary(core)).toEqual(["error", [], [1, 1, 1, 1], 75]);
    expect(standard.failure?.initialState).toBeUndefined();
    expect(getFailureSummary(standard)).toEqual(["error", [], [1, 1, 1, 1], 75]);
  });

  it("checks only the assumptions of a model without variables or an initial predicate", async () => {
    const result = await check({ source: "---- MODULE M ----\nASSUME TRUE\n====", config: "" });
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([0, 0, 0]);
    await expect(
      check({ source: "---- MODULE M ----\nVARIABLE x\n====", config: "" }),
    ).rejects.toThrow(TlaConfigError);
  });

  it("reports an assumption that fails to evaluate and skips axioms", async () => {
    const result = await checkModule("AXIOM 1 = 2\nASSUME CHOOSE n \\in {} : TRUE");
    expect(result.status).toBe("assumption-violation");
    expect(result.violation?.name).toBe("line 7, col 8 to line 7, col 29 of module M");
    expect(result.violation?.message).toMatch(
      /^Attempted to compute the value of an expression of form\nCHOOSE x \\in S: P/,
    );
  });

  it("words arithmetic, sequence, and membership errors like TLC", async () => {
    const cases = [
      ["1 \\div 0 = 0", "The second argument of \\div is 0."],
      ["1 % 0 = 0", "The second argument of % should be a positive number, but instead it is:\n0"],
      [
        "2 ^ (-1) = 0",
        "The second argument of ^ should be a natural number, but instead it is:\n-1",
      ],
      ["0 ^ 0 = 0", "0^0 is undefined."],
      ["2147483647 + 1 = 0", "Overflow when computing 2147483647+1"],
      ["-2147483647 - 2 = 0", "Overflow when computing -2147483647-2"],
      ["65536 * 65536 = 0", "Overflow when computing 65536*65536"],
      ["2 ^ 31 = 0", "Overflow when computing 2^31"],
      ["-(-2147483647 - 1) = 0", "Overflow when computing --2147483648"],
      ["(-2147483647 - 1) \\div (-1) = 0", "Overflow when computing -2147483648 \\div -1"],
      ['"a" < 1', 'The first argument of < should be an integer, but instead it is:\n"a"'],
      ['1 >= "a"', 'The second argument of >= should be an integer, but instead it is:\n"a"'],
      ["Head(<<>>) = 0", "Attempted to apply Head to the empty sequence."],
      ["Tail(<<>>) = 0", "Attempted to apply Tail to the empty sequence."],
      ["Len(1) = 0", "The argument of Len should be a sequence, but instead it is:\n1"],
      [
        "Append(1, 2) = 0",
        "Evaluating an expression of the form Append(s, v) when s is not a sequence:\n1",
      ],
      [
        "1 \\o <<1>> = 0",
        "Evaluating an expression of the form s \\o t when s is not a sequence:\n1",
      ],
      [
        '"ab" \\o <<1>> = 0',
        "Evaluating an expression of the form t \\o s when s is not a string:\n<<1>>",
      ],
      [
        "SubSeq(<<1, 2>>, 1, 3) = <<>>",
        "The third argument of SubSeq must be in the domain of its first argument:\n<<1, 2>>\n, but instead it is\n3",
      ],
      [
        "SelectSeq(<<1>>, LAMBDA e: 1) = <<>>",
        "The second argument of SelectSeq should be a operator, but instead it is:\n1",
      ],
      ["Cardinality(Nat) = 0", "Attempted to compute cardinality of the value\nNat"],
      ...[
        ['"a" + 1 = 0', "Plus", "StringValue"],
        ['1 \\div "a" = 0', "Divide", "StringValue"],
        ["{1} * 2 = 0", "Times", "SetEnumValue"],
        ["2 % <<1>> = 0", "Mod", "TupleValue"],
        ["2 ^ [a |-> 1] = 0", "Expt", "RecordValue"],
        ["1 - TRUE = 0", "Minus", "BoolValue"],
        ["Nat + 1 = 0", "Plus", "UserValue"],
        ["[{1} -> {1}] + 1 = 0", "Plus", "SetOfFcnsValue"],
        ["({1} \\X {1}) + 1 = 0", "Plus", "SetOfTuplesValue"],
        ["[e \\in Nat |-> e] + 1 = 0", "Plus", "FcnLambdaValue"],
      ].map((item) => [
        item[0],
        `Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.IntValue tlc2.module.Integers.${item[1]}(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),\nbut it produced the following error:\nCannot cast tlc2.value.impl.${item[2]} to tlc2.value.impl.IntValue`,
      ]),
      [
        '1 .. "a" = {}',
        "Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),\nbut it produced the following error:\nCannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue",
      ],
      [
        '-"a" = 0',
        "Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),\nbut it produced the following error:\nCannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue",
      ],
      [
        'IsFiniteSet("a")',
        'Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.IBoolValue tlc2.module.FiniteSets.IsFiniteSet(tlc2.value.impl.Value),\nbut it produced the following error:\nAttempted to check if the string "a" is a finite set.',
      ],
      ['"a" \\in Nat', 'Attempted to check if the value:\n"a"\nis an element of Nat.'],
      ['"a" \\in 1..2', 'Attempted to check if the value:\n"a"\nis in the integer interval 1..2'],
      ["1 \\in TRUE", "Attempted to check if the value:\n1\nis an element of the boolean TRUE"],
      ["1 \\in [a |-> 1]", "Attempted to check if element:\n1\nis in the record:\n[a |-> 1]"],
      ["1 \\in <<1>>", "Attempted to check set membership in a tuple value."],
    ];
    const messages = await Promise.all(
      cases.map(async (item) => (await checkModule(`ASSUME ${item[0]}`)).violation?.message),
    );
    expect(messages).toEqual(cases.map((item) => item[1]));
  });

  it("locates IF, CHOOSE, conjunction, DOMAIN, application, and field errors like TLC", async () => {
    const cases = [
      [
        "ASSUME IF 1 THEN TRUE ELSE FALSE",
        "A non-boolean expression (an integer) was used as the condition of an IF.\nline 6, col 8 to line 6, col 32 of module M",
      ],
      [
        "ASSUME CHOOSE e \\in {} : TRUE",
        "Attempted to compute the value of an expression of form\nCHOOSE x \\in S: P, but no element of S satisfied P.\nline 6, col 8 to line 6, col 29 of module M",
      ],
      [
        "ASSUME 1 /\\ TRUE",
        "Attempted to evaluate an expression of form P /\\ Q when P was\nan integer.\nline 6, col 8 to line 6, col 16 of module M",
      ],
      [
        "ASSUME TRUE /\\ 1 /\\ TRUE",
        "Attempted to evaluate an expression of form P /\\ Q when Q was\nan integer.\nline 6, col 8 to line 6, col 16 of module M",
      ],
      [
        "ASSUME\n    /\\ TRUE\n    /\\ {1}",
        "A non-boolean expression (a set of the form {e1, ... ,eN}) was used as a formula in a conjunction.\nline 8, col 8 to line 8, col 10 of module M",
      ],
      [
        "ASSUME\n    /\\ TRUE\n    /\\ 1",
        "A non-boolean expression (an integer) was used as a formula in a conjunction.\n1",
      ],
      [
        "ASSUME DOMAIN 1 = {}",
        "Attempted to apply the operator DOMAIN to a non-function\n(an integer)\nline 6, col 8 to line 6, col 15 of module M",
      ],
      [
        "ASSUME [a |-> 1].b = 0",
        'Attempted to select nonexistent field "b" from the record\n[a |-> 1]\nline 6, col 8 to line 6, col 18 of module M',
      ],
      [
        "ASSUME 3[1] = 0",
        "A non-function (an integer) was applied as a function.\nline 6, col 8 to line 6, col 11 of module M",
      ],
      [
        'ASSUME "ab"[1, 2] = 0',
        "A non-function (a string) was applied as a function.\nline 6, col 8 to line 6, col 17 of module M",
      ],
      [
        "ASSUME {1}.b = 0",
        'Attempted to select field "b" from a non-record value {1}\nline 6, col 8 to line 6, col 12 of module M',
      ],
    ];
    const messages = await Promise.all(
      cases.map(async (item) => (await checkModule(item[0])).violation?.message),
    );
    expect(messages).toEqual(cases.map((item) => item[1]));
  });

  it("treats a function as a finite set like TLC", async () => {
    expect((await checkModule("ASSUME IsFiniteSet(<<1>>) /\\ IsFiniteSet([a |-> 1])")).status).toBe(
      "success",
    );
  });

  it("reports an argument outside the domain of a function construction like TLC", async () => {
    const pairs = [
      -12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]
      .map((key) => `${key} :> ${key} @@\n  `)
      .join("");
    expect((await checkModule("ASSUME [n \\in -12..12 |-> n][13] = 0")).violation?.message).toBe(
      `In applying the function\n( ${pairs}12 :> 12 ),\nthe first argument is:\n13\nwhich is not in its domain.\n`,
    );
    expect((await checkModule('ASSUME [n \\in {"a"} |-> n]["b"] = 0')).violation?.message).toBe(
      'In applying the function\n[a |-> "a"],\nthe first argument is:\n"b"\nwhich is not in its domain.\n',
    );
  });

  it("reports an argument outside the domain of a tuple, record, or function like TLC", async () => {
    const cases = [
      ["<<1, 2>>[3]", "Attempted to access index 3 of tuple\n<<1, 2>>\nwhich is out of bounds."],
      ['<<1, 2>>["a"]', 'Attempted to access tuple at a non integral index: "a"'],
      ["[a |-> 1][2]", "Attempted to access record by a non-string argument: 2"],
      ['[a |-> 1]["b"]', "Attempted to access nonexistent field 'b' of record\n[a |-> 1]"],
      [
        "(1 :> 2)[3]",
        "Attempted to apply function:\n<<2>>\nto argument 3, which is not in the domain of the function.",
      ],
      ["<<>>.b", 'Attempted to apply function with integer domain to the non-integer argument "b"'],
      [
        "[n \\in 0..2 |-> n].b",
        'Attempted to apply function with integer domain to the non-integer argument "b"',
      ],
      [
        "[n \\in {} |-> n].b",
        'Attempted to apply function:\n<<>>\nto argument "b", which is not in the domain of the function.',
      ],
    ];
    const messages = await Promise.all(
      cases.map(async (item) => (await checkModule(`ASSUME ${item[0]} = 0`)).violation?.message),
    );
    expect(messages).toEqual(cases.map((item) => item[1]));
  });

  it("reports an overflowing cardinality without enumerating the set", async () => {
    const result = await checkModule("ASSUME Cardinality(SUBSET (1..31)) > 0");
    expect(result.violation?.message).toBe(
      "Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),\nbut it produced the following error:\nOverflow when computing the number of elements in:\nSUBSET (1..31)",
    );
  });

  it("wraps a failure inside an operator that another operator's Java method calls", async () => {
    const result = await checkModule(
      "ASSUME SelectSeq(<<1>>, LAMBDA e : Cardinality(SUBSET (1..31)) > e) = <<>>",
    );
    expect(result.violation?.message).toBe(
      "Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.Value tlc2.module.Sequences.SelectSeq(tlc2.value.impl.Value,tlc2.value.impl.Value),\nbut it produced the following error:\nAttempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),\nbut it produced the following error:\nOverflow when computing the number of elements in:\nSUBSET (1..31)",
    );
  });

  it("checks membership in a set enumeration TLC can't sort element by element", async () => {
    const result = await checkModule(
      'ASSUME 1 \\in {1, "a"}\nASSUME [e \\in {1, "a"} |-> e][1] = 1\nASSUME "a" \\in {1, "a"}',
    );
    expect(result.violation?.message).toBe(
      'Attempted to check equality of integer 1 with non-integer:\n"a"',
    );
  });

  it("shows a record in the order the spec writes it until TLC sorts it", async () => {
    const prints: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS TLC\nASSUME PrintT([fld2 |-> 0])\nASSUME PrintT(ToString([fld1 |-> 1, fld2 |-> 2]))\nASSUME PrintT(ToString(("fld1" :> 1) @@ ("fld3" :> 3) @@ ("fld2" :> 2)))\nASSUME PrintT([fld1 |-> 1, fld2 |-> 2])\n====',
      config: "",
      onPrint: (text) => prints.push(text),
    });
    expect(prints.slice(1)).toEqual([
      '"[fld1 |-> 1, fld2 |-> 2]"',
      '"[fld1 |-> 1, fld3 |-> 3, fld2 |-> 2]"',
      "[fld2 |-> 2, fld1 |-> 1]",
    ]);
  });

  it("evaluates a function over a domain TLC keeps lazy only where it is applied", async () => {
    const prints: string[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nASSUME PrintT([b |-> 0])\nASSUME PrintT([s \\in SUBSET {1} |-> 1 \\div Cardinality(s)][{1}])\nASSUME PrintT([v \\in {0} |-> [a |-> 1, b |-> 2]])\nASSUME PrintT([v \\in SUBSET {0} |-> [a |-> 1, b |-> 2]])\nASSUME PrintT([v \\in {0} \\X {1} |-> [a |-> 1, b |-> 2]])\n====",
      config: "",
      onPrint: (text) => prints.push(text),
    });
    expect(result.status).toBe("success");
    expect(prints.slice(1)).toEqual([
      "1",
      "(0 :> [b |-> 2, a |-> 1])",
      "({} :> [a |-> 1, b |-> 2] @@ {0} :> [a |-> 1, b |-> 2])",
      "(<<0, 1>> :> [a |-> 1, b |-> 2])",
    ]);
  });

  it("sorts a record TLC compares with itself and the records inside it", async () => {
    const prints: string[] = [];
    await check({
      source:
        "---- MODULE M ----\nEXTENDS TLC\nASSUME PrintT([fld2 |-> 0])\nASSUME PrintT(ToString(LET r == <<[fld1 |-> 1, fld2 |-> 2]>> IN IF r = r THEN r ELSE r))\n====",
      config: "",
      onPrint: (text) => prints.push(text),
    });
    expect(prints.slice(1)).toEqual(['"<<[fld2 |-> 2, fld1 |-> 1]>>"']);
  });

  it("sorts a TLCEval argument only outside an instance that substitutes", async () => {
    const inner =
      '---- MODULE Inner ----\nEXTENDS TLC\nCONSTANT K\nMixed == 1 \\in TLCEval({1, "a"})\n====';
    const instanced = await check({
      source: "---- MODULE M ----\nEXTENDS TLC\nINSTANCE Inner WITH K <- 1\nASSUME Mixed\n====",
      config: "",
      loadModule: (name) => (name === "Inner" ? inner : undefined),
    });
    expect(instanced.status).toBe("success");
    const direct = await checkModule('ASSUME 1 \\in TLCEval({1, "a"})');
    expect(direct.violation?.message).toBe(
      'Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.Value tlc2.module.TLCEval.tlcEval(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),\nbut it produced the following error:\nAttempted to compare string "a" with non-string:\n1',
    );
  });

  it("rejects a mistyped membership outside an assumption", async () => {
    const result = await check({
      source:
        '---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = "a" /\\ x \\in Nat\nNext == x\' = x\n====',
      config: "INIT Init\nNEXT Next",
    });
    expect(result.status).toBe("error");
  });

  it("treats untyped model values as outside built-in sets", async () => {
    const result = await checkModule(
      'CONSTANT m\nASSUME ~(m \\in Nat) /\\ ~(m \\in Int) /\\ ~(m \\in STRING) /\\ ~(m \\in 1..3) /\\ ~(m \\in Seq({1}))\nASSUME ~("a" \\in 3..1)',
      "CONSTANT m = m",
    );
    expect(result.status).toBe("success");
  });

  it.each(['"a" \\in Nat', "1 \\in STRING", "{} \\in 1..4", "FALSE \\in Int"])(
    "rejects %s",
    async (membership) => {
      const result = await checkModule(`ASSUME ${membership}`);
      expect(result.status).toBe("assumption-violation");
      expect(result.violation?.message).toMatch(/^Attempted to check if the value/);
    },
  );

  it.each([
    ["1 \\in TRUE", "Attempted to check if the value:\n1\nis an element of the boolean TRUE"],
    ["1 \\notin 5", "Attempted to check if the value:\n1\nis an element of the integer 5"],
    ['1 \\in "abc"', 'Attempted to check if the value:\n1\nis an element of the string "abc"'],
    ["1 \\in m", "Attempted to check if the value:\n1\nis an element of the model value m"],
    ["1 \\in <<1, 2>>", "Attempted to check set membership in a tuple value."],
    ["1 \\in [a |-> 1]", "Attempted to check if element:\n1\nis in the record:\n[a |-> 1]"],
  ])("words %s like TLC", async (membership, message) => {
    const result = await checkModule(`CONSTANT m\nASSUME ${membership}`, "CONSTANT m = m");
    expect(result.status).toBe("assumption-violation");
    expect(result.violation?.message).toBe(message);
  });
});

describe("DOMAIN matches TLC", () => {
  const printDomain = async (expression: string) => {
    const printed: string[] = [];
    await check({
      source: `---- MODULE M ----\nEXTENDS Integers, TLC\nASSUME PrintT(${expression})\n====`,
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
  ])("prints %s as %s", async (expression, text) => {
    expect(await printDomain(expression)).toEqual([text]);
  });

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
  const checkSource = (source: string) =>
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
  ])("rejects %s before checking", async (_, source) => {
    const run = checkSource(source);
    await expect(run).rejects.toThrow(TlaEvaluationError);
    await expect(run).rejects.toThrow(/^TLC can't handle real numbers: 1\.5/);
  });

  it("accepts decimals in proofs and ASSUME PROVE theorems", async () => {
    const result = await checkSource(
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
  ])("rejects an integer literal too big for TLC in %s", async (_, source) => {
    const run = checkSource(source);
    await expect(run).rejects.toThrow(TlaEvaluationError);
    await expect(run).rejects.toThrow(/^TLC can't handle a number this big: 2147483648/);
  });

  it.each(["\\hFFFFFFFFF", "99999999999999999999"])("quotes %s as typed", async (literal) => {
    await expect(checkSource(`VARIABLE x\nBig == ${literal}\nInit == x = 0`)).rejects.toThrow(
      `TLC can't handle a number this big: ${literal} at line 3, column 8`,
    );
  });

  it("reads based numerals", async () => {
    const result = await checkSource(
      "VARIABLE x\nASSUME \\h1F = 31 /\\ \\b101 = 5 /\\ \\o17 = 15\nInit == x = 0",
    );
    expect(result.status).toBe("success");
  });

  it("accepts the largest integer literal and big literals in proofs", async () => {
    const result = await checkSource(
      "EXTENDS Naturals\nVARIABLE x\nTHEOREM TRUE\n<1>1. 2147483648 > 0\n  OBVIOUS\n<1>2. QED\n  BY <1>1\nInit == x = 2147483647",
    );
    expect(result.status).toBe("success");
  });
});

describe("name resolution matches SANY", () => {
  const checkSource = (source: string) =>
    check({
      source: `---- MODULE M ----\n${source}\nVARIABLE x\nInit == x = 0\nNext == x' = x\n====`,
      config: "INIT Init\nNEXT Next",
    });

  it("fails to parse a spec that imports a module it cannot find, such as Strings", async () => {
    await expect(checkSource("EXTENDS Strings")).rejects.toThrow(
      new TlaSyntaxError("Cannot find source file for module Strings imported in module M."),
    );
    await expect(checkSource("N == INSTANCE Nowhere")).rejects.toThrow(
      new TlaSyntaxError("Cannot find source file for module Nowhere imported in module M."),
    );
  });

  it.each([
    ["an operator from a module that is not extended", "EXTENDS Naturals\nf == 1 :> 2"],
    ["an operator that a standard module only instantiates locally", "EXTENDS TLC\nf == 1 + 1"],
    ["a definition before it is defined", "EXTENDS Naturals\nf == g + 1\ng == 1"],
    ["an operator with the wrong number of arguments", "g(a) == a\nf == g(1, 2)"],
    ["a record with duplicate fields", "f == [a |-> 1, b |-> 2, a |-> 1]"],
    ["an expression as a fact in a HIDE", "THEOREM bar == <<1, 2>>\nUSE bar\nHIDE bar, TRUE"],
    [
      "a definition as a fact in a HIDE step",
      "foo == 1\nTHEOREM T == TRUE\n<1>1. HIDE foo\n<1> QED",
    ],
    [
      "a LET definition named after the recursive one it is in",
      "RECURSIVE F\nF == LET F == 2 IN F",
    ],
    ["an unknown operator in a theorem", "THEOREM Undefined"],
    ["an unknown operator in a proof step", "THEOREM TRUE\n<1>1. Undefined\n  OBVIOUS\n<1> QED"],
    ["a higher-order operator as an operator argument", "D(Op(_)) == Op(42)\nFoo == D(D)"],
    ["an expression as an operator argument", "D(Op(_)) == Op(42)\nFoo == D(1)"],
    ["an operator as an expression argument", "F(a) == a\nG(a) == a\nFoo == F(G)"],
    ["an operator argument with the wrong arity", "D(Op(_)) == Op(42)\nG(a, b) == a\nFoo == D(G)"],
    [
      "a NEW symbol after the proof of its step",
      "THEOREM TRUE\n<1>1. ASSUME NEW c PROVE c = c\n  OBVIOUS\n<1>2. c = c\n<1> QED",
    ],
  ])("rejects %s", async (_, source) => {
    await expect(checkSource(source)).rejects.toThrow(TlaSyntaxError);
  });

  it("names an unknown identifier and an unknown operator symbol like SANY", async () => {
    await expect(checkSource("f == g")).rejects.toThrow(
      "Unknown operator: `g' at line 2, column 6",
    );
    await expect(checkSource("f == 1 + 1")).rejects.toThrow(
      "Could not find declaration or definition of symbol '+' at line 2, column 8",
    );
  });

  it("accepts USE and HIDE of theorems, assumptions, steps, and definitions", async () => {
    const result = await checkSource(
      "EXTENDS Naturals\nfoo == 1\nUSE foo, foo > 0 DEF foo\nASSUME A == foo \\in Nat\nHIDE A\nTHEOREM T == foo = 1\nHIDE T DEF foo\nTHEOREM U == ASSUME NEW n \\in Nat PROVE n >= 0\n<1>1. n >= 0\n  OBVIOUS\n<1>2. HIDE <1>1, T\n<1> QED\n  BY <1>1",
    );
    expect(result.status).toBe("success");
  });

  it("resolves NEW, SUFFICES, PICK, DEFINE, and theorem labels in the steps they scope", async () => {
    const result = await checkSource(
      [
        "EXTENDS Naturals",
        "THEOREM Thm == ASSUME NEW S PROVE lab :: S = S",
        "<1> SUFFICES ASSUME NEW n \\in Nat PROVE n + 0 = n OBVIOUS",
        "<1>1. PICK m \\in Nat : m = n OBVIOUS",
        "<1> DEFINE k == m + n",
        "<1>2. ASSUME NEW c PROVE Thm!lab /\\ k = c",
        "  <2>1. c = c OBVIOUS",
        "  <2> QED",
        "<1> QED BY <1>2",
      ].join("\n"),
    );
    expect(result.status).toBe("success");
  });

  it("reads instance-qualified subscripts", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\n---- MODULE Inner ----\nVARIABLE x\nvars == <<x>>\nNext == x' = (x + 1) % 3\n====\nI == INSTANCE Inner\nSpec == x = 0 /\\ [][I!Next]_I!vars /\\ WF_I!vars(I!Next)\nProp == <>(x = 2)\nTHEOREM Spec => WF_I!vars(I!Next)\n====",
      config: "SPECIFICATION Spec\nPROPERTY Prop",
    });
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "success",
      4,
      3,
    ]);
  });

  it.each([
    ["a definition defined twice", "B == 1\nB == 2"],
    ["a definition of a declared constant", "CONSTANT B\nB == 1"],
    ["a constant declared after a definition", "B == 1\nCONSTANT B"],
    ["a constant and a variable with one name", "CONSTANT y\nVARIABLE y"],
    ["an operator parameter named after a definition", "B == 1\nF(B) == B"],
    ["a LET definition named after a definition", "B == 1\nF == LET B == 2 IN B"],
    ["a bound variable named after a variable", "VARIABLE y\nF == \\E y \\in {1} : TRUE"],
    ["nested bound variables with one name", "F == \\E y \\in {1} : \\E y \\in {2} : TRUE"],
    ["an operator of an extended module", "EXTENDS Naturals\na + b == a"],
    ["a built-in operator", "BOOLEAN == 1"],
    ["a constant named after a built-in operator", "CONSTANT BOOLEAN"],
    ["a variable named after a built-in operator", "VARIABLE TRUE"],
    ["a constant named after an operator of an extended module", "EXTENDS Naturals\nCONSTANT Nat"],
    [
      "a nested module constant named after an enclosing variable",
      "VARIABLE y\n---- MODULE Inner ----\nCONSTANT y\n====",
    ],
    ["a definition after an instance that imports it", "INSTANCE Naturals\nNat == 1"],
    ["a named instance and a definition with one name", "I == 1\nI == INSTANCE Naturals"],
    ["duplicate operator parameters", "F(a, a) == a"],
    [
      "a LAMBDA parameter named after a definition",
      "B == 1\nG(Op(_)) == Op(1)\nF == G(LAMBDA B : B)",
    ],
    ["a function bound named after a definition", "y == 1\nf[y \\in {1}] == y"],
    ["duplicate names in a tuple pattern", "F == \\E <<a, a>> \\in {<<1, 2>>} : TRUE"],
    ["a LET definition named after an enclosing one", "F == LET A == 1 IN LET A == 2 IN A"],
    ["a LOCAL definition of an extended operator", "EXTENDS FiniteSets\nLOCAL Cardinality(S) == 0"],
    [
      "a nested module definition named after an outer one",
      "B == 1\n---- MODULE Inner ----\nB == 2\n====\nI == INSTANCE Inner",
    ],
  ])("rejects %s as multiply defined", async (_, source) => {
    await expect(checkSource(source)).rejects.toThrow(/Multiply-defined symbol/);
  });

  it.each([
    ["a definition before an instance that imports it", "Nat == 1\nINSTANCE Naturals"],
    ["a bound variable before a definition of that name", "F == \\E B \\in {1} : TRUE\nB == 1"],
    [
      "sibling quantifiers with one name",
      "F == (\\E y \\in {1} : TRUE) /\\ (\\E y \\in {2} : TRUE)",
    ],
    [
      "a LET definition whose body binds its own name",
      "F == LET e == CHOOSE e \\in {1} : TRUE IN e",
    ],
    ["a LET definition named after the definition it is in", "F == LET F == 2 IN F"],
    [
      "a definition named after a recursive LET definition before it",
      "G == LET RECURSIVE F(_)\n         F(n) == n\n     IN F(1)\nF == LET F == 2 IN F",
    ],
    [
      "a LET parameter named after a later LET definition",
      "F == LET A(B) == B\n         B == 1\n     IN A(B)",
    ],
    [
      "a recursive LET definition",
      "F == LET RECURSIVE G(_)\n         G(n) == IF n = 0 THEN 0 ELSE G(0)\n     IN G(1)",
    ],
    [
      "operator arguments of the arity a parameter takes",
      "D(Op(_)) == Op(42)\nG(a) == a\nF == D(G) = D(LAMBDA a : a)",
    ],
  ])("accepts %s", async (_, source) => {
    expect((await checkSource(source)).status).toBe("success");
  });

  it("defines prefix, postfix, and <: operators", async () => {
    const result = await checkSource(
      "EXTENDS Naturals\nn ^+ == n + 1\n-. n == 10 - n\na <: b == a - b\nASSUME (2^+) = 3 /\\ -4 = 6 /\\ (5 <: 2) = 3",
    );
    expect(result.status).toBe("success");
  });

  it("applies operators in prefix form and reads keywords as field names", async () => {
    const result = await checkSource(
      'EXTENDS Naturals\nn ^+ == n + 1\nASSUME +(4, 6) = 10 /\\ ^+(2) = 3\nASSUME [[x \\in {"THEN"} |-> 1] EXCEPT !.THEN = 2].THEN = 2',
    );
    expect(result.status).toBe("success");
  });

  it("takes infix operators as parameters", async () => {
    const result = await checkSource(
      "EXTENDS Naturals\nFoo(a, _--_) == a -- 1\nASSUME Foo(7, +) = 8 /\\ Foo(7, *) = 7",
    );
    expect(result.status).toBe("success");
  });

  it("accepts recursive functions, named assumptions, and operator aliases", async () => {
    const result = await checkSource(
      "EXTENDS Naturals\nRECURSIVE fact\ntwice[n \\in Nat] == fact[n] * 2\nfact[n \\in Nat] == IF n = 0 THEN 1 ELSE n * fact[n - 1]\nASSUME Positive == twice[3] = 12\nASSUME Positive\na \\oplus b == a + b\nASSUME 1 (+) 2 = 3",
    );
    expect(result.status).toBe("success");
  });

  it("rejects RandomSubsetSet, which TLC's Randomization module does not define", async () => {
    await expect(
      checkSource('EXTENDS Randomization\nASSUME RandomSubsetSet(2, "0.5", {1, 2}) = {}'),
    ).rejects.toThrow(TlaSyntaxError);
  });
});

describe("level checking matches SANY", () => {
  const checkDefinition = (definition: string) =>
    check({
      source: `---- MODULE M ----\nVARIABLE x\nF == ${definition}\nInit == x = 0\nNext == x' = x\n====`,
      config: "INIT Init\nNEXT Next",
    });

  // Cases from SANY's test215, which outlaws raw actions in temporal formulas.
  it.each([
    ["x' ~> []x", "Action used where only temporal formula or state predicate allowed"],
    ["[]x -+-> x'", "Action used where only temporal formula or state predicate allowed"],
    ["<>(x')", "<> followed by action not of form <<A>>_v"],
    ["[](x')", "[] followed by action not of form [A]_v"],
    ["\\A i \\in {}, j \\in x' : []x", "Action-level bound of quantified temporal formula"],
    ["x' /\\ []x", "Formula has both temporal formula and action as arguments"],
    ["(x')'", "Level error in applying operator '"],
    ["ENABLED []x", "Level error in applying operator ENABLED"],
  ])("rejects %s", async (definition, message) => {
    await expect(checkDefinition(definition)).rejects.toThrow(message);
  });

  it.each(["x ~> []x", "<><<x'>>_x", "[][x']_x", "\\A i \\in x' : x'", "[](LET A == x' IN A)"])(
    "accepts %s",
    async (definition) => {
      expect((await checkDefinition(definition)).status).toBe("success");
    },
  );

  it("rejects an argument above the level an instantiated operator allows", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\n---- MODULE Inner ----\nVARIABLE y\nFoo == y' = 0\n====\nI(z) == INSTANCE Inner WITH y <- z\nFooBar == I(x')!Foo\nInit == x = 0\nNext == x' = x\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow("Level error in applying operator Foo");
  });

  // SANY bounds a sequence argument by the level its LAMBDA allows for the elements.
  it.each([
    "SelectSeq(s, LAMBDA a : a' = 1)",
    "SortSeq(s, LAMBDA a, b : a' = b)",
    "SortSeq(s, LAMBDA a, b : a = b')",
  ])("rejects a primed sequence where %s primes its elements", async (application) => {
    await expect(
      check({
        source: `---- MODULE M ----\nEXTENDS Sequences, TLC\nVARIABLE x\nF(s) == ${application}\nG == F(x')\nInit == x = 0\nNext == x' = x\n====`,
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      "Level error in applying operator F: The level of argument 1 exceeds the maximum level allowed by the operator.",
    );
  });
});

describe("parseConfig matches TLC", () => {
  it("reads operator symbols and names that start with digits", () => {
    const config = parseConfig("CONSTANT ++ <- PlusPlus\n  Plus <- +\n  \\o <- +\nINVARIANT 1Inv");
    expect(config.substitutions).toEqual([
      { name: "++", target: "PlusPlus" },
      { name: "Plus", target: "+" },
      { name: "\\o", target: "+" },
    ]);
    expect(config.invariants).toEqual(["1Inv"]);
  });

  it("reads _POSSIBLE and POSTCONDITION names", () => {
    const config = parseConfig("SPECIFICATION Spec\n_POSSIBLE Done Started\nPOSTCONDITION Post");
    expect([config.possible, config.postconditions]).toEqual([["Done", "Started"], ["Post"]]);
  });

  it("reads _PERIODIC and _RL_REWARD names and checks their definitions", async () => {
    const config = parseConfig("INIT Init\n_PERIODIC Periodic\n_RL_REWARD Reward");
    expect([config.periodic, config.rlReward]).toEqual(["Periodic", "Reward"]);
    await expect(checkModule("Argument(n) == n", "_PERIODIC Nope")).rejects.toThrow(
      new TlaConfigError(
        "The periodic Nope specified in the configuration file\nis not defined in the specification.",
      ),
    );
    await expect(checkModule("Argument(n) == n", "_RL_REWARD Argument")).rejects.toThrow(
      new TlaConfigError(
        "TLC requires rlreward not to take any argument, but one was given: Argument",
      ),
    );
    const result = await checkModule(
      "Periodic == x < 100\nReward == 1",
      "_PERIODIC Periodic\n_RL_REWARD Reward",
    );
    expect(result.status).toBe("success");
  });

  it("rejects keywords that appear twice", () => {
    ["CHECK_DEADLOCK", "_PERIODIC", "_RL_REWARD"].forEach((keyword) =>
      expect(() => parseConfig(`${keyword} FALSE\n${keyword} TRUE`)).toThrow(
        new TlaConfigError(`The keyword ${keyword} appears twice`),
      ),
    );
  });

  it("reads values the way TLC does", () => {
    expect(parseConfig('CONSTANT S = "a\\"b\\\\n"').constants[0].value).toEqual({
      kind: "String",
      value: 'a\\"b\\\\n',
    });
    ["CONSTANT N = -1", "CONSTANT S = {1,}"].forEach((source) =>
      expect(() => parseConfig(source)).toThrow(TlaConfigError),
    );
  });
});

describe("initial predicate and next-state relation match TLC", () => {
  const checkSource = (body: string, config: string) =>
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
    const result = await checkSource(
      `EXTENDS Integers\nVARIABLE x\nBad == x = 1\nOp(n) == x = n\nTwo(n) == x # n /\\ x # n + 1\nSpec == x = 0 /\\ [][x' = x + 1 /\\ x < 3]_x\nProperty == ${property}`,
      "SPECIFICATION Spec\nPROPERTY Property\nCHECK_DEADLOCK FALSE",
    );
    expect(result.violation?.name).toBe(name);
  });

  it("rejects a property that quantifies over no elements as a tautology", async () => {
    await expect(
      checkSource(
        "VARIABLE x\nSpec == x = 0 /\\ [][x' = x]_x\nProperty == \\A n \\in {} : x # n",
        "SPECIFICATION Spec\nPROPERTY Property",
      ),
    ).rejects.toThrow("Temporal formula is a tautology (its negation is unsatisfiable).");
  });

  it("explores no states when a spec without variables has no initial predicate", async () => {
    const result = await checkSource("ASSUME TRUE\nSpec == [][TRUE]_<<>>", "SPECIFICATION Spec");
    expect([result.status, result.generatedStates, result.distinctStates, result.depth]).toEqual([
      "success",
      0,
      0,
      0,
    ]);
  });

  it("requires an initial predicate when the spec has variables", async () => {
    await expect(
      checkSource("VARIABLE x\nSpec == [][x' = x]_x", "SPECIFICATION Spec"),
    ).rejects.toThrow(/did not specify the initial state predicate/);
  });

  it("rejects a constant initial predicate or next-state action", async () => {
    await expect(
      checkSource("VARIABLE x\nInit == TRUE\nNext == x' = x", "INIT Init\nNEXT Next"),
    ).rejects.toThrow(/The initial predicate Init cannot be a constant/);
    await expect(
      checkSource("VARIABLE x\nInit == x = 0\nNext == TRUE", "INIT Init\nNEXT Next"),
    ).rejects.toThrow(/The next state action Next cannot be a constant/);
  });

  it("checks the configuration in the order TLC reads it, before any assumption", async () => {
    await expect(
      checkSource(
        "VARIABLE x\nASSUME FALSE\nInit == x = 0\nNext == TRUE\nInv == {}",
        "INIT Init\nNEXT Next\nINVARIANT Inv\nPROPERTY Q",
      ),
    ).rejects.toThrow(new TlaConfigError("The invariant of Inv is equal to {}"));
    await expect(
      checkSource(
        "VARIABLE x\nInit == x = 0\nNext == x' = x\nQ(a) == TRUE",
        "INIT Init\nNEXT Next\nPROPERTY Q\nCONSTRAINT Nope",
      ),
    ).rejects.toThrow(new TlaConfigError("TLC requires Q not to take any argument."));
    await expect(
      checkSource(
        "VARIABLE x\nInit == x = 0\nNext == x' = x\nC == FALSE",
        "INIT Init\nNEXT Next\nCONSTRAINT C",
      ),
    ).rejects.toThrow(new TlaConfigError("The constraint of C is equal to FALSE"));
  });

  it("rejects an invariant that is not a state predicate", async () => {
    await expect(
      checkSource(
        "VARIABLE x\nInit == x = 0\nNext == x' = x\nInv == []TRUE",
        "INIT Init\nNEXT Next\nINVARIANT Inv",
      ),
    ).rejects.toThrow(
      new TlaConfigError(
        "The invariant Inv is not a state predicate (one with no primes or temporal operators).",
      ),
    );
    await expect(
      checkSource(
        "VARIABLE x\nInit == x = 0\nNext == x' = x\nInv == x' = x",
        "INIT Init\nNEXT Next\nINVARIANT Inv",
      ),
    ).rejects.toThrow(
      new TlaConfigError(
        "The invariant Inv is not a state predicate (one with no primes or temporal operators).\nNote that a bug can cause TLC to incorrectly report this error.\nIf you believe your TLA+ or PlusCal specification to be correct,\nplease check if this bug described in LevelNode.java starting at line 590ff affects you.",
      ),
    );
  });

  it("binds a variable once for each time a lazy UNION streams an element", async () => {
    const set = "UNION {SUBSET {1}, {{}}}";
    const result = await checkSource(
      `VARIABLE x\nInit == x \\in ${set}\nNext == x' \\in ${set}`,
      "INIT Init\nNEXT Next",
    );
    expect([result.generatedStates, result.distinctStates]).toEqual([9, 2]);
  });

  it.each([
    ["x \\in UNION UNION (SUBSET {{}, {{}}})", "UNCHANGED x", [3, 1]],
    ["x \\in UNION UNION {SUBSET {1}, {{1}}}", "UNCHANGED x", [3, 1]],
    ["x = 0", "x = 0 /\\ x' \\in UNION UNION (SUBSET {{1}, {1, 2}})", [7, 3]],
  ])("streams a lazy UNION of a lazy UNION with Init %s", async (init, next, counts) => {
    const result = await checkSource(
      `VARIABLE x\nInit == ${init}\nNext == ${next}`,
      "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
    );
    expect([result.generatedStates, result.distinctStates]).toEqual(counts);
  });

  it.each([
    ["UNION {UNION (SUBSET {{1}, {1, 2}}), {1}}", [8, 3]],
    ["UNION {{1}, UNION (SUBSET {{1}, {1, 2}})}", [6, 3]],
  ])("streams a lazy UNION in %s until a sort compares it as TLC does", async (set, counts) => {
    const result = await checkSource(
      `VARIABLE x\nInit == x \\in ${set}\nNext == UNCHANGED x`,
      "INIT Init\nNEXT Next",
    );
    expect([result.generatedStates, result.distinctStates]).toEqual(counts);
  });

  it("keeps a set operation lazy unless TLC can reduce both sets", async () => {
    const getCounts = async (set: string) => {
      const result = await checkSource(
        `EXTENDS Naturals\nVARIABLE x\nInit == x \\in ${set}\nNext == UNCHANGED x`,
        "INIT Init\nNEXT Next",
      );
      return [result.generatedStates, result.distinctStates];
    };
    expect(await getCounts("SUBSET {1} \\cup SUBSET {2}")).toEqual([7, 3]);
    expect(await getCounts("(1..3) \\cup SUBSET {}")).toEqual([8, 4]);
    expect(await getCounts("{1} \\cup {1, 2}")).toEqual([4, 2]);
  });

  it("reports initial states without a next-state action", async () => {
    await expect(checkSource("VARIABLE x\nInit == x \\in {1, 2}", "INIT Init")).rejects.toThrow(
      /No next state actions defined to generate successor states from/,
    );
  });
});
