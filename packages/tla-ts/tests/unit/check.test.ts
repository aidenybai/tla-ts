import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import {
  check,
  type CheckProgress,
  type CheckResult,
  formatValue,
  parseConfig,
  parseModule,
  TlaConfigError,
  TlaEvaluationError,
  TlaSyntaxError,
} from "../../src";
import {
  getUnexpectedException,
  TlaSanyFatalError,
  TlaStackOverflowError,
  UNEXPECTED_EXCEPTION,
} from "../../src/errors";
import { getExitCode } from "../../src/exit-codes";
import type { TlcVersion } from "../../src/tlc-version";

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

  // A1 reaches a state with the same VIEW as the successor of A2 that violates the property.
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

  it("rejects a symmetry that names a constant", async () => {
    // TLC reports it as a RuntimeException it did not expect, verified with TLC.
    const result = checkModule("CONSTANT P", "CONSTANT P = {p1, p2}\nSYMMETRY P");
    await expect(result).rejects.toThrow(TlaEvaluationError);
    await expect(result).rejects.toThrow(
      "The symmetry function P must specify a set of permutations.",
    );
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

  // TLC 1.7.4 prints an empty FcnRcdValue with a space, but an empty TupleValue without one.
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
});

const checkSteps = (definitions: string, config: string, version?: TlcVersion) =>
  check({
    source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == x = 0\nNext == x < 3 /\\ x' = x + 1\n${definitions}\n====`,
    config,
    version,
  });

const getFailureSummary = (result: CheckResult) => [
  result.status,
  result.failure?.trace.map((step) => formatValue(step.state.x)),
  [result.generatedStates, result.distinctStates, result.queuedStates, result.depth],
  result.failure?.exitCode,
];

describe("evaluation errors match TLC", () => {
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

  it.each([
    [
      "0 \\in [{1} -> {2}]",
      "Attempted to check if \n0\nwhich is not a TLC function value, is in the set of functions:\n{<<2>>}",
    ],
    [
      "0 \\in SUBSET {1}",
      "Attempted to check if the non-enumerable value\n0\nis element of\n{{}, {1}}",
    ],
    ["0 \\in Seq({1})", "Attempted to check if the value:\n0\nis an element of Seq({1})."],
  ])("reports a value that can't be an element of %s like TLC", async (expression, message) => {
    const result = await checkModule(`ASSUME ${expression}`);
    expect(result.violation?.message).toBe(message);
  });

  // TLC's etest15: TLC normalizes the value of a constant definition as it starts, and searches the
  // sorted domain of a function over it.
  it("compares a value with the elements of a constant definition's set like TLC", async () => {
    const result = await checkModule(
      "S == {<<y>> : y \\in {1, 2, 3, 4}}\nASSUME [<<y>> \\in S |-> y + 1][2] = 3",
    );
    expect(result.violation?.message).toBe(
      "Attempted to compare integer 2 with non-integer:\n<<3>>",
    );
  });

  // TLC's FingerprintExceptionHang: the replay of the failed expansion adds the successors TLC
  // hasn't seen and checks their invariants, which fail to fingerprint.
  it("counts the states that the replay of a failed invariant adds", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nCONSTANTS Nodes\nVARIABLES nodeState\nLegalSets == {{}}\nTypeOK == nodeState \\in [Nodes -> [set: LegalSets]]\nInit == nodeState = [n \\in Nodes |-> [set |-> {}]]\nNext == \\E n \\in Nodes : nodeState' = [nodeState EXCEPT ![n].set = 1]\n====",
      config:
        "CONSTANT Nodes = {A, B}\nINIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE\nINVARIANT TypeOK",
    });
    expect(result.failure?.message).toBe(
      "Evaluating invariant TypeOK failed.\nAttempted to compare integer 1 with non-integer:\n{}",
    );
    expect(result.failure?.fingerprint?.sources.map((source) => source.kind)).toEqual([
      "FunctionSet",
      "RecordSet",
    ]);
    expect([result.distinctStates, result.failure?.exitCode]).toEqual([3, 75]);
  });

  // A set with a source raises a FingerprintException when TLC's replay fails to enumerate it, unless
  // a Java method that enumerates it wraps the failure.
  it.each([
    ["\\E n \\in ({1} \\cup 2) : x' = n", ["Apply"]],
    ["x' = x /\\ \\A n \\in ({1} \\cup 2) : TRUE", ["Apply"]],
    ["x' = CHOOSE n \\in ({1} \\cup 2) : TRUE", ["Apply"]],
    ["x' = Cardinality({n + 1 : n \\in ({1} \\cup 2)})", ["Apply"]],
    ["x' \\in ({1} \\cup 2)", ["Apply"]],
    ["x' \\in {1} \\cup ({1} \\cup 2)", ["Apply", "Apply"]],
    ["x' \\in UNION {Nat}", ["Apply"]],
    ["x' = Cardinality({n \\in ({1} \\cup 2) : TRUE})", undefined],
  ])(
    "reports the sources of a set the replay of %s fails to enumerate like TLC",
    async (next, sources) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals, FiniteSets\nVARIABLE x\nInit == x = 0\nNext == ${next}\n====`,
        config: "INIT Init\nNEXT Next",
      });
      expect(result.failure?.fingerprint?.sources.map((source) => source.kind)).toEqual(sources);
    },
  );

  // A tuple, record or set with a source raises a FingerprintException when the replay fails to
  // apply it, but TLC fails before it applies a value that isn't a function.
  it.each([
    ["<<1, 2>>[3]", ["Tuple"]],
    ["[a |-> 1][1]", ["Record"]],
    ['[<<1, 2>> EXCEPT !["a"] = 1]', ["Tuple"]],
    ["[{1} EXCEPT ![1] = 1]", ["SetEnumeration"]],
    ["{1, 2}[1]", undefined],
  ])(
    "reports the source of a value the replay of x' = %s fails to apply like TLC",
    async (value, sources) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = ${value}\n====`,
        config: "INIT Init\nNEXT Next",
      });
      expect(result.failure?.fingerprint?.sources.map((source) => source.kind)).toEqual(sources);
    },
  );

  // TLC builds a function in a method of the FcnLambdaValue that CallStackTool gives a source, so
  // the replay fails to fingerprint it when its body fails.
  it.each([
    ["x = [k \\in {1, 2} |-> k \\div 0]", "x' = x", ["FunctionConstruction"]],
    ["x = 0", "x' = [k \\in 1..2 |-> k \\div 0]", ["FunctionConstruction"]],
    ["x = 0", "x' = [k \\in {1, 2} |-> <<1, 2>>[k + 1]]", ["FunctionConstruction", "Tuple"]],
    [
      "x = 0",
      "x' = [j \\in {1} |-> [k \\in {1, 2} |-> k \\div 0]]",
      ["FunctionConstruction", "FunctionConstruction"],
    ],
    ["x = 0", "x' = [k \\in Nat |-> k \\div 0][1]", undefined],
  ])(
    "reports a function whose body fails in %s or %s as one TLC can't fingerprint",
    async (init, next, sources) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == ${init}\nNext == ${next}\n====`,
        config: "INIT Init\nNEXT Next",
      });
      expect(result.failure?.fingerprint?.sources.map((source) => source.kind)).toEqual(sources);
      expect(result.failure?.exitCode).toBe(sources ? 75 : 255);
    },
  );

  // Value#equals of a value with a source raises a FingerprintException even when the stack froze
  // where the filter failed, but an operand that fails fails before TLC compares.
  it.each([
    ["x' = Filter /\\ {} = x'", ["SetEnumeration"]],
    ["x' = 1 /\\ {1} # Filter", ["SetEnumeration"]],
    ["x' = Filter /\\ x' = {}", undefined],
    ["x' = 1 /\\ {} = (1 \\div 0)", undefined],
  ])("reports the left side of %s that fails to compare like TLC", async (next, sources) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nFilter == {n \\in SUBSET {1} : 1 \\div 0 = 1}\nNext == ${next}\n====`,
      config: "INIT Init\nNEXT Next",
    });
    expect(result.failure?.fingerprint?.sources.map((source) => source.kind)).toEqual(sources);
  });

  // TLC compares the sets as Value#equals does, and never takes tla-ts's faster comparison that
  // fails first.
  it("records the replay of a filter that fails to compare once", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = {n \\in SUBSET {1} : 1 \\div 0 = 1} /\\ x' = {}\n====",
      config: "INIT Init\nNEXT Next",
    });
    const ranges = result.failure?.callStack?.map(({ location: { range } }) =>
      range ? `${range.start.column}-${range.end.column}` : "",
    );
    expect(new Set(ranges)).toEqual(new Set(["9-57", "9-46", "51-57", "34-45", "34-41"]));
    expect(ranges?.at(-1)).toBe("34-41");
  });

  // Tool.processUnchangedImplTuple puts the elements after the first in front of the conjuncts left,
  // in order.
  it("records the variables of an UNCHANGED tuple in order", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLES a, b, c\nInit == a = 0 /\\ b = 0 /\\ c = 0\nNext == UNCHANGED <<a, b, c>> /\\ 1 \\div 0 = 1\n====",
      config: "INIT Init\nNEXT Next",
    });
    const names = result.failure?.callStack?.flatMap((expression) =>
      expression.kind === "Identifier" ? [expression.name] : [],
    );
    expect(names).toEqual(["a", "b", "c"]);
  });

  it("applies a function without computing the values it isn't applied to as TLC does", async () => {
    const result = await checkSteps(
      "G(n) == [k \\in {1, 2} |-> 10 \\div (k - n)]\nStep == x' = G(2)[1]",
      "INIT Init\nNEXT Step",
    );
    expect([result.failure, result.generatedStates, result.distinctStates]).toEqual([
      undefined,
      3,
      2,
    ]);
  });

  it("prints a function it can't compute in applying it outside its domain like TLC", async () => {
    const result = await checkSteps(
      "G(n) == [k \\in {1, 2} |-> 10 \\div (k - n)]\nStep == x' = G(1)[3]",
      "INIT Init\nNEXT Step",
    );
    expect(result.failure?.message).toBe(
      "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: In applying the function\n[k \\in {1, 2} |-> <expression line 6, col 27 to line 6, col 41 of module M>],\nthe first argument is:\n3\nwhich is not in its domain.\n",
    );
  });

  it.each([
    ["Start == x = [k \\in {1, 2} |-> 0]\nStep == x' = x /\\ x[3] = 0", "Start", "<<0, 0>>"],
    ["Step == x' = [k \\in {1, 2} |-> 1] /\\ x'[3] = 0", "Init", "<<1, 1>>"],
  ])(
    "applies a function built over a set enumeration as the record TLC builds for %j",
    async (definitions, init, value) => {
      const result = await checkSteps(definitions, `INIT ${init}\nNEXT Step`);
      expect(result.failure?.message).toBe(
        `TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: Attempted to apply function:\n${value}\nto argument 3, which is not in the domain of the function.`,
      );
    },
  );

  // FcnLambdaValue#fingerPrint caches the FcnRcdValue that applies the function from then on.
  it.each([
    [
      "Start == x = [k \\in SUBSET {1} |-> 0]\nStep == x' = x /\\ x[{2}] = 0",
      "Start",
      ": Attempted to apply function:\n({} :> 0 @@ {1} :> 0)\nto argument {2}, which is not in the domain of the function.",
    ],
    [
      "Step == x' = [k \\in SUBSET {1} |-> 1] /\\ x'[{2}] = 0",
      "Init",
      ": In applying the function\n({} :> 1 @@ {1} :> 1),\nthe first argument is:\n{2}\nwhich is not in its domain.\n",
    ],
  ])(
    "applies a function as TLC does once it fingerprints it in %j",
    async (definitions, init, message) => {
      const result = await checkSteps(definitions, `INIT ${init}\nNEXT Step`);
      expect(result.failure?.message).toBe(
        `TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n${message}`,
      );
    },
  );

  it("reports a set TLC can't enumerate in computing next states like TLC", async () => {
    const result = await checkSteps("Step == x' \\in Nat", "INIT Init\nNEXT Step");
    expect(result.failure?.message).toBe(
      "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: In computing next states, the right side of \\IN is not enumerable.\nline 6, col 9 to line 6, col 18 of module M",
    );
  });

  // CallStackTool copies a SetPredValue without its source, so TLC reports where it evaluated the
  // filter rather than where it built it.
  it.each([
    ["Nat", "TLC has found a state in which the value of a variable contains Nat", undefined],
    ["{Nat}", "TLC has found a state in which the value of a variable contains Nat", 1],
    ["SUBSET Nat", "Attempted to compute the number of elements in the overridden value Nat.", 1],
    [
      "{n \\in Nat : n > 1}",
      "Attempted to enumerate { x \\in S : p(x) } when S:\nNat\nis not enumerable",
      undefined,
    ],
  ])(
    "fails to fingerprint an initial state x = %s like TLC",
    async (expression, message, sources) => {
      const result = await checkSteps(`Start == x = ${expression}`, "INIT Start\nNEXT Next");
      expect(result.failure?.message).toBe(message);
      expect(result.failure?.fingerprint?.sources.length).toBe(sources);
      expect([result.generatedStates, result.distinctStates, result.failure?.exitCode]).toEqual([
        1, 0, 75,
      ]);
    },
  );

  it("prints a set filter it can't enumerate as its bound and the location of its predicate", async () => {
    const result = await checkSteps("Start == x = {n \\in Nat : n > 1}", "INIT Start\nNEXT Next");
    expect(result.failure?.initialState?.x && formatValue(result.failure.initialState.x)).toBe(
      "{n \\in Nat : <expression line 6, col 27 to line 6, col 31 of module M> }",
    );
  });

  it("fingerprints only the states in the model like TLC", async () => {
    const result = await checkSteps(
      "Start == x = SUBSET Nat\nC == x \\in {}",
      "INIT Start\nNEXT Next\nCONSTRAINT C",
    );
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "success",
      1,
      0,
    ]);
  });

  it("fails again as it prints a successor it can't fingerprint", async () => {
    const result = await checkSteps(
      "Step == x' = IF x = 1 THEN {Nat} ELSE x + 1",
      "INIT Init\nNEXT Step",
    );
    expect(result.failure?.message).toBe(
      `${UNEXPECTED_EXCEPTION}TLC has found a state in which the value of a variable contains Nat`,
    );
    expect(result.failure?.traceFailure?.message).toBe(result.failure?.message);
    expect(getFailureSummary(result)).toEqual(["error", ["0", "1"], [3, 2, 0, 2], 75]);
  });

  // TLC builds a function over a domain other than a set enumeration or an interval lazily, so its
  // body fails as TLC fingerprints the successor and again as TLC prints it.
  it.each([
    ["master" as const, "tlc2.tool.EvalException\n: The second argument"],
    ["1.7.4" as const, "java.lang.RuntimeException\n: tlc2.tool.EvalException: The second"],
  ])("fails to fingerprint a function whose body fails in TLC %s", async (version, wrapped) => {
    const result = await checkSteps(
      "Step == x' = [k \\in SUBSET {1} |-> 1 \\div 0]",
      "INIT Init\nNEXT Step",
      version,
    );
    const failure = result.failure;
    expect(failure?.traceFailure?.message ?? failure?.message).toContain(wrapped);
    expect([result.generatedStates, failure?.exitCode]).toEqual([2, 255]);
  });

  it("doesn't force a function TLC builds lazily in a disabled action", async () => {
    const result = await checkSteps(
      "Step == x' = [k \\in SUBSET {1} |-> 1 \\div 0] /\\ FALSE",
      "INIT Init\nNEXT Step",
    );
    expect([result.status, result.failure]).toEqual(["deadlock", undefined]);
  });

  // TLC evaluates the whole predicate, not each conjunct on its own.
  it.each(["INVARIANT", "CONSTRAINT"])(
    "fails at a non-boolean conjunct of %s P as the conjunction does",
    async (kind) => {
      const result = await checkSteps(
        "P == /\\ x < 3\n     /\\ IF x = 1 THEN 1 ELSE TRUE",
        `INIT Init\nNEXT Next\n${kind} P`,
      );
      expect(result.failure?.message).toContain(
        "A non-boolean expression (an integer) was used as a formula in a conjunction.\nline 7, col 9 to line 7, col 33 of module M",
      );
    },
  );

  it("prints what the replay of a failed constraint prints after the trace", async () => {
    const result = await checkSteps(
      'C == PrintT(<<"c", x>>) /\\ (IF x = 2 THEN 1 \\in 2 ELSE TRUE)',
      "INIT Init\nNEXT Next\nCONSTRAINT C",
    );
    expect(result.failure?.trace.map((step) => formatValue(step.state.x))).toEqual(["0", "1", "2"]);
    expect(result.failure?.traceOutput).toEqual(['<<"c", 2>>']);
  });

  it.each(["1.7.4" as const, undefined])(
    "names an action property that fails to evaluate in TLC %s",
    async (version) => {
      const result = await checkSteps(
        "P == [][1 \\div (2 - x) >= 0]_x\nSpec == Init /\\ [][Next]_x",
        "SPECIFICATION Spec\nPROPERTY P",
        version,
      );
      expect(result.failure?.message).toBe(
        "Evaluating action property P failed.\nThe second argument of \\div is 0.",
      );
      expect(getFailureSummary(result)).toEqual(["error", ["0", "1", "2", "3"], [4, 4, 0, 4], 255]);
    },
  );

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
      [
        "1 /\\ (TRUE)",
        "Attempted to evaluate an expression of form P /\\ Q when P was\nan integer.\nline 6, col 8 to line 6, col 18 of module M",
      ],
      [
        "FALSE \\/ (1) \\/ TRUE",
        "Attempted to evaluate an expression of form P \\/ Q when Q was\nan integer.\nline 6, col 8 to line 6, col 19 of module M",
      ],
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
        "SubSeq(<<>>, 1, 1) = <<>>",
        "The second argument of SubSeq must be in the domain of its first argument:\n<<>>\n, but instead it is\n1",
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
      [
        "(SUBSET 0)..2 = {}",
        "Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),\nbut it produced the following error:\nCannot cast tlc2.value.impl.SubsetValue to tlc2.value.impl.IntValue",
      ],
      ["SUBSET 0 = {}", "Attempted to compute the number of elements in the integer 0."],
      ['SUBSET "a" = {}', 'Attempted to compute the number of elements in the string "a".'],
      [
        "SUBSET <<1, 2>> = {}",
        "Attempted to compute the value of an expression of form\nSUBSET S, but S is a non-enumerable value:\n<<1, 2>>",
      ],
    ];
    const messages = await Promise.all(
      cases.map(async (item) => (await checkModule(`ASSUME ${item[0]}`)).violation?.message),
    );
    expect(messages).toEqual(cases.map((item) => item[1]));
  });

  it.each([
    ["1.7.4" as const, "Append(v, s)"],
    [undefined, "Append(s, v)"],
  ])("words a failed Append like TLC %s", async (version, form) => {
    const result = await check({
      source: "---- MODULE M ----\nEXTENDS Sequences\nASSUME Append(1, 2) = 0\n====",
      config: "",
      version,
    });
    expect(result.violation?.message).toBe(
      `Evaluating an expression of the form ${form} when s is not a sequence:\n1`,
    );
  });

  const EXPECTED_BOOLEAN = "TLC expected a boolean expression,\nbut instead found";

  // TLC evaluates the conjuncts left once every variable has a value, and walks the others.
  it.each([
    ["x = 0 /\\ 3", "x' = x", `In computing initial states, ${EXPECTED_BOOLEAN} 3.\n3`],
    [
      "x = 0 /\\ Op(x)",
      "x' = x",
      `In computing initial states, ${EXPECTED_BOOLEAN} 1.\nline 5, col 18 to line 5, col 22 of module M`,
    ],
    [
      "x = 0",
      "x' = x /\\ (0 \\div 3)",
      `In computing next states, ${EXPECTED_BOOLEAN} 0.\nline 6, col 20 to line 6, col 27 of module M`,
    ],
    ["x = 0", "x' = x /\\ \\b11", `In computing next states, ${EXPECTED_BOOLEAN} 3.\n\\b11`],
    ["3 /\\ x = 0", "x' = x", "The init state relation is not a boolean expression.\n3"],
    ["x = 0", "3 /\\ x' = x", "The next state relation is not a boolean expression.\n3"],
  ])("words a conjunct of %s or %s that isn't a boolean like TLC", async (init, next, message) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nOp(a) == a + 1\nInit == ${init}\nNext == ${next}\n====`,
      config: "INIT Init\nNEXT Next",
    });
    expect(result.failure?.message).toContain(message);
  });

  it.each([
    [
      "CASE 1 -> x = 0",
      "x' = x",
      "In computing initial states, a non-boolean expression (an integer) was used as a guard condition of a CASE.\nline 5, col 19 to line 5, col 23 of module M",
    ],
    [
      "CASE FALSE -> x = 0",
      "x' = x",
      "In computing initial states, TLC encountered a CASE with no conditions true.\nline 5, col 9 to line 5, col 27 of module M",
    ],
    [
      "x = 0",
      "CASE 1 -> x' = x",
      "In computing next states, a non-boolean expression (an integer) was used as a guard condition of a CASE.\nline 6, col 19 to line 6, col 24 of module M",
    ],
    [
      "IF 1 THEN x = 0 ELSE x = 1",
      "x' = x",
      "In computing initial states, a non-boolean expression (an integer) was used as the condition of an IF.\nline 5, col 9 to line 5, col 34 of module M",
    ],
    [
      "x = 0",
      "IF 1 THEN x' = 0 ELSE x' = 1",
      "In computing next states, a non-boolean expression (an integer) was used as the condition of an IF.line 6, col 9 to line 6, col 36 of module M",
    ],
    [
      "x \\in Nat",
      "x' = x",
      "In computing initial states, the right side of \\IN is not enumerable.\nline 5, col 9 to line 5, col 17 of module M",
    ],
  ])("words a failed CASE, IF or \\IN in %s or %s like TLC", async (init, next, message) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nOp(a) == a + 1\nInit == ${init}\nNext == ${next}\n====`,
      config: "INIT Init\nNEXT Next",
    });
    expect(result.failure?.message).toContain(message);
  });

  it.each([
    [
      "CASE x -> x' = x",
      "In computing ENABLED, a non-boolean expression(an integer) was used as a guard condition of a CASE.\nline 5, col 16 to line 5, col 21 of module M",
    ],
    [
      "IF x THEN x' = x ELSE x' = 1",
      "In computing ENABLED, a non-boolean expression(an integer) was used as the guard condition of an IF.\nline 5, col 6 to line 5, col 33 of module M",
    ],
    [
      "x' \\in Nat",
      "The right side of \\IN is not enumerable.\nline 5, col 6 to line 5, col 15 of module M",
    ],
  ])("words a failed %s in a fair action like TLC", async (action, message) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nA == ${action}\nSpec == Init /\\ [][x' = x]_x /\\ WF_x(A)\nP == <>(x = 0)\n====`,
      config: "SPECIFICATION Spec\nPROPERTY P",
    });
    expect(result.failure?.message).toContain(message);
  });

  // TLC's enabled walks the action, and words a literal it walks to differently.
  it.each([
    ["3", "Attempted to compute ENABLED on a non-boolean expression.\n3"],
    [
      "x + 3",
      `In computing ENABLED, ${EXPECTED_BOOLEAN} 3.\nline 5, col 31 to line 5, col 35 of module M`,
    ],
  ])("words a conjunct of a fair action that is %s like TLC", async (value, message) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nA == x' = x /\\ (IF x = 0 THEN ${value} ELSE TRUE)\nSpec == Init /\\ [][x' = x]_x /\\ WF_x(A)\nP == <>(x = 0)\n====`,
      config: "SPECIFICATION Spec\nPROPERTY P",
    });
    expect(result.failure?.message).toContain(message);
  });

  const checkFairPrint = (action: string, config: string, version: TlcVersion) =>
    check({
      source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nA == PrintT(x) /\\ ${action}\nSpec == Init /\\ [][A]_x /\\ WF_x(A)\nP == [](x = 0 => <>(x = 1))\nInv == x < 1\n====`,
      config: `SPECIFICATION Spec\nPROPERTY P\n${config}`,
      version,
    });

  // TLC's worker adds the state to the behavior graph after it prints the trace, and again with its
  // call stack when that fails. TLC 1.7.4 adds it once and replays the next-state relation.
  it.each([
    ["master", 9],
    ["1.7.4", 6],
  ] as const)(
    "prints what adding a state whose next states fail to the behavior graph prints in TLC %s",
    async (version, count) => {
      const result = await checkFairPrint("(x' = 1 \\/ x' = 1 \\div 0)", "", version);
      expect(result.failure?.traceOutput).toEqual(Array.from({ length: count }, () => "0"));
    },
  );

  it.each([
    ["an invariant violation", "master", "INVARIANT Inv", ["0", "0", "0", "0", "0", "0", "0", "0"]],
    ["an invariant violation", "1.7.4", "INVARIANT Inv", []],
    ["a deadlock", "master", "", ["0", "1", "2"]],
    ["a deadlock", "1.7.4", "", ["2"]],
  ] as const)(
    "prints what adding a state to the behavior graph prints after %s in TLC %s",
    async (_, version, config, expected) => {
      const result = await checkFairPrint("x < 2 /\\ x' = x + 1", config, version);
      expect(result.violation?.traceOutput).toEqual(expected);
    },
  );

  it.each([
    ["master", "[i \\in 1..2 |-> i]", 'y["a"]', 'integer domain to the non-integer argument "a"'],
    [
      "master",
      "(1 :> 2 @@ 3 :> 4)",
      'y["a"]',
      'check equality of integer 1 with non-integer:\n"a"',
    ],
    [
      "master",
      "[i \\in {2 * k : k \\in 1..40} |-> i]",
      'y["a"]',
      'Attempted to compare integer 40 with non-integer:\n"a"',
    ],
    ["master", "<<1, 2>>", 'y["a"]', 'Attempted to access tuple at a non integral index: "a"'],
    ["master", "[a |-> 1]", "y[1]", "Attempted to access record by a non-string argument: 1"],
    ["master", "<<1, 2>>", "[y EXCEPT ![1][1] = 2]", "apply EXCEPT construct to the value 1."],
    ["master", "{1, 2}", "y.a", 'Attempted to select field "a" from a non-record value {1, 2}'],
    ["master", "<<1, 2>>", "y.a", 'integer domain to the non-integer argument "a"'],
    ["1.7.4", "<<1, 2>>", "y.a", 'integer domain to the non-integer argument "a"'],
    [
      "1.7.4",
      "[i \\in 1..2 |-> i]",
      'y["a"]',
      'check equality of integer 1 with non-integer:\n"a"',
    ],
    [
      "1.7.4",
      "[i \\in {2 * k : k \\in 1..40} |-> i]",
      'y["a"]',
      'check equality of integer 2 with non-integer:\n"a"',
    ],
    [
      "1.7.4",
      "<<1, 2>>",
      '[y EXCEPT !["a"] = 1]',
      'Attempted to apply tuple to a non-integer argument "a".',
    ],
    [
      "1.7.4",
      "[a |-> 1]",
      "[y EXCEPT ![1] = 1]",
      "Attempted to apply record to a non-string argument 1.",
    ],
  ] as const)(
    "words a key of the wrong type in TLC %s for y = %s and x' = %s like TLC",
    async (version, value, next, message) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLES x, y\nInit == x = 0 /\\ y = ${value}\nNext == x' = ${next} /\\ UNCHANGED y\n====`,
        config: "INIT Init\nNEXT Next",
        version,
      });
      expect(result.failure?.message).toContain(message);
    },
  );

  it("enumerates SUBSET of a function with an empty domain as {{}} like TLC", async () => {
    const result = await checkModule("ASSUME SUBSET <<>> = {{}}");
    expect(result.status).toBe("success");
  });

  it.each([
    [true, "Integers"],
    [false, "Naturals"],
  ])(
    "names the Java class of .. by whether TLC records a trace (%s)",
    async (isTraceRecorded, module) => {
      const result = await check({
        source: '---- MODULE M ----\nEXTENDS Naturals\nASSUME 1 .. "a" = {}\n====',
        config: "",
        isTraceRecorded,
      });
      expect(result.violation?.message).toContain(`tlc2.module.${module}.DotDot`);
    },
  );

  // tlc2.module.Naturals#Divide rounds some negative quotients toward 0, and doesn't report an
  // overflow, unlike tlc2.module.Integers#Divide.
  it.each([
    [false, "Naturals", ["<<0, 0, -2>>", "-2147483648"]],
    [true, "Naturals", ["<<-1, -1, -2>>"]],
    [false, "Integers", ["<<-1, -1, -2>>"]],
  ])(
    "divides negative integers as TLC does when it records a trace (%s) for a spec of %s",
    async (isTraceRecorded, module, quotients) => {
      const printed: string[] = [];
      await check({
        source: `---- MODULE M ----\nEXTENDS ${module}, TLC\nASSUME PrintT(<<1 \\div (0 - 2), (0 - 1) \\div 2, (0 - 3) \\div 2>>)\nASSUME PrintT((0 - 2147483647 - 1) \\div (0 - 1))\n====`,
        config: "",
        isTraceRecorded,
        onPrint: (text) => printed.push(text),
      });
      expect(printed).toEqual(quotients);
    },
  );

  it("locates IF, CHOOSE, conjunction, DOMAIN, and field errors like TLC", async () => {
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
        "ASSUME CHOOSE e \\in Seq({1}) : TRUE",
        "Attempted to compute the value of an expression of\nform CHOOSE x \\in S: P, but S was not enumerable.\nline 6, col 8 to line 6, col 35 of module M",
      ],
      ["ASSUME \\A e \\in 1 : TRUE", "TLC encountered a non-enumerable quantifier bound\n1.\n1"],
      [
        "ASSUME {e \\in 1 : TRUE} = {}",
        "Attempted to enumerate { x \\in S : p(x) } when S:\n1\nis not enumerable",
      ],
      [
        "ASSUME CASE 1 -> TRUE",
        "A non-boolean expression (an integer) was used as a condition of a CASE. 1",
      ],
      [
        "ASSUME CHOOSE e \\in 3 : TRUE",
        "Attempted to compute the value of an expression of\nform CHOOSE x \\in S: P, but S was not enumerable.\nline 6, col 8 to line 6, col 28 of module M",
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
      new TlaSanyFatalError(
        "Cannot find source file for module Strings imported in module M.",
        "M",
      ),
    );
    await expect(checkSource("N == INSTANCE Nowhere")).rejects.toThrow(
      new TlaSanyFatalError(
        "Cannot find source file for module Nowhere imported in module M.",
        "M",
      ),
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

  it("keeps a recursive function lazy, so it computes only the arguments a spec applies it to", async () => {
    const result = await checkSource(
      "EXTENDS Naturals\nsteps[n \\in 0..20] == IF n = 1 THEN 0 ELSE IF n % 2 = 0 THEN 1 + steps[n \\div 2] ELSE 1 + steps[3 * n + 1]\nASSUME steps[5] = 5",
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
        new TlaConfigError(
          `TLC found an error in the configuration file at line 2\nThe keyword ${keyword} appeared twice.`,
        ),
      ),
    );
  });

  it("reports TLC's errors for a file it can't read", () => {
    expect(() => parseConfig("CONSTANT Humans = {%1%}")).toThrow(
      new TlaConfigError(
        "TLC found an error in the configuration file at line 1\nIt was expecting }, but did not find it.",
      ),
    );
    expect(() => parseConfig("INIT Init\nNEXT Next\nSYMBOLIC_INTEGERS Int")).toThrow(
      new TlaConfigError(
        "TLC found an error in the configuration file at line 3\nIt was expecting a keyword, but did not find it.",
      ),
    );
    expect(() => parseConfig('INIT Init\n"unterminated\nNEXT Next')).toThrow(
      new TlaConfigError(
        'TLC found an error in the configuration file:\nLexical error at line 2, column 14.  Encountered: "\\n" (10), after : "\\"unterminated"',
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

describe("parseConfig matches TLC 1.7.4", () => {
  it("reads a keyword that TLC 1.7.4 doesn't have as a name", () => {
    expect(parseConfig("INVARIANT Inv ALIAS", "1.7.4").invariants).toEqual(["Inv", "ALIAS"]);
    expect(() => parseConfig("INIT Init\nALIAS Alias", "1.7.4")).toThrow(
      new TlaConfigError(
        "TLC found an error in the configuration file at line 2\nIt was expecting a keyword, but did not find it.",
      ),
    );
  });

  it("reads a TYPE and a TYPE_CONSTRAINT, which it ignores, once each", () => {
    expect(parseConfig("INIT Init\nTYPE T\nTYPE_CONSTRAINT C", "1.7.4")).toEqual(
      parseConfig("INIT Init", "1.7.4"),
    );
    expect(() => parseConfig("TYPE T\nTYPE U", "1.7.4")).toThrow(
      new TlaConfigError(
        "TLC found an error in the configuration file at line 2\nThe keyword TYPE appeared twice.",
      ),
    );
    expect(() => parseConfig("TYPE T")).toThrow(TlaConfigError);
  });
});

describe("initial predicate and next-state relation match TLC", () => {
  const checkSource = (body: string, config: string) =>
    check({ source: `---- MODULE M ----\n${body}\n====`, config });

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

describe("check matches TLC 1.7.4", () => {
  const check174 = (definitions: string, config = "INIT Init\nNEXT Next") =>
    check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\n${definitions}\n====`,
      config,
      version: "1.7.4",
    });

  it("keeps the outdegree of the states it expanded before a violation, a deadlocked state among them", async () => {
    const invariant = await check174(
      "Init == x = 0\nNext == x' = x + 1\nInv == x < 2",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    );
    expect(invariant.violationOutDegrees?.slice(0, 3)).toEqual([0, 1, 0]);
    const deadlock = await check174("Init == x = 0\nNext == x < 2 /\\ x' = x + 1");
    expect(deadlock.violationOutDegrees?.slice(0, 3)).toEqual([1, 2, 0]);
  });

  it("leaves out the outdegree of the state whose invariant it failed to evaluate", async () => {
    const source =
      "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == \\E n \\in {1, 2} : x' = x + n\nInv == x # 3 \\/ CHOOSE n \\in {} : TRUE\n====";
    const getOutDegrees = async (version: TlcVersion) => {
      const result = await check({
        source,
        config: "INIT Init\nNEXT Next\nINVARIANT Inv",
        version,
      });
      return result.outDegrees?.slice(0, 3);
    };
    expect(await getOutDegrees("1.7.4")).toEqual([0, 0, 1]);
    expect(await getOutDegrees("master")).toEqual([0, 1, 1]);
  });

  it("words a missing tuple index or record field as TLC 1.7.4 does", async () => {
    const tuple = await check174(
      'Init == x = 0\nNext == x\' = x + 1\nName == <<"zero", "one">>\nInv == Name[x + 1] # "none"',
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    );
    expect(tuple.failure?.message).toContain(
      'Attempted to apply tuple\n<<"zero", "one">>\nto integer 3 which is out of domain.',
    );
    const record = await check174(
      'Init == x = 0\nNext == x\' = x + 1\nR == [a |-> 1]\nInv == R[IF x = 0 THEN "a" ELSE "b"] = 1',
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    );
    expect(record.failure?.message).toContain(
      "Attempted to apply the record\n[a |-> 1]\nto nonexistent record field b.",
    );
  });

  it("reports an error in adding a state to the behavior graph as TLC 1.7.4's worker does", async () => {
    const result = await check174(
      "Init == x = 0\nNext == x' = 1 - x\nSpec == Init /\\ [][Next]_x\nProp == []<>(1 \\div x = 1)",
      "SPECIFICATION Spec\nPROPERTY Prop",
    );
    expect(result.failure?.message).toBe(
      "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a tlc2.tool.EvalException\n: The second argument of \\div is 0.",
    );
    expect([result.failure?.trace, result.failure?.callStack, result.failure?.exitCode]).toEqual([
      [],
      undefined,
      255,
    ]);
  });

  const checkProperty = (property: string, version?: "1.7.4") =>
    check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x, b\nInit == x = 0 /\\ b = FALSE\nNext == x' = x /\\ b' = ~b\nSpec == Init /\\ [][Next]_<<x, b>>\n${property}\n====`,
      config: "SPECIFICATION Spec\nPROPERTY P",
      version,
    });

  // TLC names a part of a property by its location, or by the definition it is the body of.
  it.each([
    [undefined, "P == []b", "b"],
    [undefined, "P == []FALSE", "FALSE"],
    [undefined, "P == [](x # 0) /\\ TRUE", "line 7, col 6 to line 7, col 14 of module M"],
    [undefined, "P == x # 0 /\\ TRUE", "line 7, col 6 to line 7, col 10 of module M"],
    [undefined, "Q == [][b' = b]_b\nP == Q /\\ TRUE", "Q"],
    [undefined, "P == \\A c \\in {0, 1} : x # c", "line 7, col 24 to line 7, col 28 of module M"],
    ["1.7.4" as const, "P == \\A c \\in {0, 1} : x # c", "P"],
  ])(
    "names the violated part of a property as TLC %s does: %s",
    async (version, property, name) => {
      expect((await checkProperty(property, version)).violation?.name).toBe(name);
    },
  );

  it.each([undefined, "1.7.4" as const])(
    "reports a property that quantifies over the empty set as a tautology (TLC %s)",
    async (version) => {
      await expect(checkProperty("P == \\A c \\in {} : []b", version)).rejects.toThrow(
        "Temporal formula is a tautology (its negation is unsatisfiable).",
      );
    },
  );

  // TLC evaluates the constant parts of the properties as it builds the liveness checker.
  it.each([
    [
      "<>(1 \\notin SUBSET 1)",
      "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: Attempted to check if the non-enumerable value\n1\nis element of\nSUBSET 1",
    ],
    [
      "<>(1 + 1)",
      "TLC expected a boolean value, but did not find one. line 6, col 9 to line 6, col 13 of module M",
    ],
    ["<>(\\b101 /\\ TRUE)", "TLC expected a boolean value, but did not find one. \\b101"],
  ])(
    "reports an error in the constant part of the property %s as TLC does",
    async (property, message) => {
      await expect(
        check({
          source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nSpec == Init /\\ [][x' = x]_x\nP == ${property}\n====`,
          config: "SPECIFICATION Spec\nPROPERTY P",
        }),
      ).rejects.toMatchObject({ message });
    },
  );

  it("exits successfully after an error in adding an initial state to the behavior graph, as TLC 1.7.4 does", async () => {
    const result = await check174(
      "Init == x = 0\nNext == (x = 0 /\\ x' = 1) \\/ UNCHANGED x\nSpec == Init /\\ [][Next]_x\nProp == <>~ENABLED (x' > x)",
      "SPECIFICATION Spec\nPROPERTY Prop",
    );
    expect(result.failure?.exitCode).toBe(0);
  });

  it("says which variables a successor leaves unassigned as TLC 1.7.4 does", async () => {
    const result = await check174("Init == x = 0\nNext == UNCHANGED <<>>");
    expect(result.failure?.message).toBe(
      "Successor state is not completely specified by the next-state action. The following variable is not assigned: x.\n",
    );
  });

  it("reports an error in adding a successor without the trace, as TLC 1.7.4's worker does", async () => {
    const result = await check174("Init == x = 0\nNext == x' = {x + 1} \\cup x");
    expect(result.failure?.message).toBe(
      "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: util.Assert$TLCRuntimeException: Attempted to enumerate S \\cup T when S:\n{1}\nand T:\n0\nare not both enumerable",
    );
    expect(result.failure?.trace).toEqual([]);
  });

  it("reads only the keys TLC 1.7.4's TLCGet has", async () => {
    const getRevision = async (version: TlcVersion) => {
      const result = await check({
        source:
          '---- MODULE M ----\nEXTENDS TLC\nVARIABLE x\nInit == x = TLCGet("revision").tag\nNext == UNCHANGED x\n====',
        config: "INIT Init\nNEXT Next",
        version,
      });
      return result.failure?.message ?? result.status;
    };
    expect(await getRevision("master")).toBe("success");
    expect(await getRevision("1.7.4")).toBe("TLCGet(revision) was undefined.");
  });

  it("sizes every component of a set of functions as TLC 1.7.4 does", async () => {
    const getCardinality = async (version: TlcVersion) => {
      const result = await check({
        source:
          "---- MODULE M ----\nEXTENDS Naturals, FiniteSets\nVARIABLE x\nInit == x = Cardinality([Nat -> {}])\nNext == UNCHANGED x\n====",
        config: "INIT Init\nNEXT Next",
        version,
      });
      return result.failure?.message ?? result.status;
    };
    expect(await getCardinality("master")).toBe("success");
    expect(await getCardinality("1.7.4")).toMatch(
      /but it produced the following error:\nAttempted to compute the number of elements in the overridden value Nat\.$/,
    );
  });

  it("doesn't explain a set it can't enumerate", async () => {
    const result = await check174("Init == x = 0\nNext == \\E n \\in Nat : x' = n");
    expect(result.failure?.message).toContain(
      ": TLC encountered a non-enumerable quantifier bound\nNat.\nline 5, col 18 to line 5, col 20 of module M",
    );
    expect(result.failure?.message).not.toContain("infinitely many elements");
  });

  it("refuses action composition without the Java property that enables it", async () => {
    const result = await check174("Init == x = 0\nNext == (x' = x) \\cdot (x' = x)");
    expect(result.failure?.message).toMatch(
      /: The current version of TLC does not support action composition\.$/,
    );
  });

  it("blames a parameterized INSTANCE for a missing initial predicate as well", async () => {
    await expect(check174("Next == x' = x", "NEXT Next")).rejects.toThrow(
      new TlaConfigError(
        "The configuration file did not specify the initial state predicate.\nCan also be caused by trying to run TLC on a specification from\na module imported with a parameterized INSTANCE statement.",
      ),
    );
  });
  it("doesn't rebuild the trace, so it prints nothing of the states again", async () => {
    const getTraceOutput = async (version: TlcVersion) => {
      const result = await check({
        source:
          '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0 /\\ PrintT("init")\nNext == x = 5 /\\ x\' = x\n====',
        config: "INIT Init\nNEXT Next",
        version,
      });
      return result.violation?.traceOutput;
    };
    expect(await getTraceOutput("master")).toEqual(['"init"']);
    expect(await getTraceOutput("1.7.4")).toEqual([]);
  });

  it("doesn't expand a specification that applies an operator to arguments", async () => {
    const getStatus = (version: TlcVersion) =>
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\nS(v) == v = 0 /\\ [][v' = v]_v\nSpec == S(x)\n====",
        config: "SPECIFICATION Spec",
        version,
      }).then((result) => result.status);
    expect(await getStatus("master")).toBe("success");
    await expect(getStatus("1.7.4")).rejects.toThrow(
      "The configuration file did not specify the initial state predicate.",
    );
  });

  it("reads the level of the state it explores in a constraint", async () => {
    const getDistinctStates = async (version: TlcVersion) => {
      const result = await check({
        source:
          '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x\' = x + 1\nC == TLCGet("level") < 3\n====',
        config: "INIT Init\nNEXT Next\nCONSTRAINT C\nCHECK_DEADLOCK FALSE",
        version,
      });
      return result.distinctStates;
    };
    expect(await getDistinctStates("master")).toBe(2);
    expect(await getDistinctStates("1.7.4")).toBe(3);
  });

  it("evaluates TLCGet in a temporal property before it starts the model checker", async () => {
    const checkVersion = (version: TlcVersion) =>
      check({
        source:
          '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x\' = 1 - x\nSpec == Init /\\ [][Next]_x\nP == <>[](x = 1 /\\ TLCGet("diameter") > 0)\n====',
        config: "SPECIFICATION Spec\nPROPERTY P",
        version,
      }).then((result) => result.status);
    expect(await checkVersion("master")).toBe("liveness-violation");
    await expect(checkVersion("1.7.4")).rejects.toThrow(
      new TlaEvaluationError(
        `${getUnexpectedException("tlc2.tool.EvalException")}TLCGet(diameter) was undefined.`,
      ),
    );
  });

  it("evaluates the arguments of a recursive temporal operator it expands", async () => {
    const checkProperty = (property: string, version: TlcVersion) =>
      check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = 1 - x\nSpec == Init /\\ [][Next]_x\nRECURSIVE R(_)\nR(n) == IF n = 0 THEN <>(x = 1) ELSE R(n - 1)\nP == ${property}\n====`,
        config: "SPECIFICATION Spec\nPROPERTY P",
        version,
      }).then((result) => result.status);
    const stackOverflow = new TlaStackOverflowError();
    expect(await checkProperty("R(2)", "master")).toBe("liveness-violation");
    await expect(checkProperty("R(2)", "1.7.4")).rejects.toThrow(stackOverflow);
    await expect(checkProperty("R(x)", "master")).rejects.toThrow(stackOverflow);
    await expect(checkProperty("R(x)", "1.7.4")).rejects.toThrow(
      "TLC cannot handle the temporal formula line 9, col 6 to line 9, col 9 of module M",
    );
  });

  it("doesn't expect an EvalException in the values a property quantifies over", async () => {
    const error = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nInit == x = 0\nNext == x' = 1 - x\nSpec == Init /\\ [][Next]_x\nP == \\A k \\in {1 \\div 0} : <>(x = k)\n====",
      config: "SPECIFICATION Spec\nPROPERTY P",
    }).catch((caught: unknown) => caught);
    expect(error).toEqual(
      new TlaEvaluationError(
        `${getUnexpectedException("tlc2.tool.EvalException")}The second argument of \\div is 0.`,
      ),
    );
    expect(error instanceof Error && getExitCode(error)).toBe(255);
  });

  // TLC doesn't evaluate a definition with a temporal operator before it checks the property.
  it.each(["1.7.4" as const, "master" as const])(
    "reports a property quantified over no values as a tautology in TLC %s",
    async (version) => {
      const result = check({
        source:
          "---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nInit == x = 0\nNext == x' = 1 - x\nSpec == Init /\\ [][Next]_x\nP == \\A k \\in {} : <>TRUE\n====",
        config: "SPECIFICATION Spec\nPROPERTY P",
        version,
      });
      await expect(result).rejects.toThrow(
        new TlaEvaluationError("Temporal formula is a tautology (its negation is unsatisfiable)."),
      );
    },
  );

  // An EvalException, which Java code throws, leaves its message out.
  it.each([
    [
      "1.7.4" as const,
      "\\A k \\in 0..1 : <>(2 \\in 1)",
      "TLC cannot handle the temporal formula line 7, col 6 to line 7, col 32 of module M:\nAttempted to check if the value:\n2\nis an element of the integer 1",
    ],
    [
      "1.7.4" as const,
      "\\A k \\in 0..1 : <>(1 \\div 0 = k)",
      "TLC cannot handle the temporal formula line 7, col 6 to line 7, col 37 of module M",
    ],
    [
      "master" as const,
      "\\E k \\in 0..1 : <>(2 \\in 1)",
      "TLC cannot handle the temporal formula line 7, col 6 to line 7, col 32 of module M",
    ],
    // TLC checks the formula as a whole when it can't enumerate the values to check it for.
    [
      "master" as const,
      "\\A k \\in 1 : <>(x = k)",
      "TLC cannot handle the temporal formula line 7, col 6 to line 7, col 27 of module M:\nTLC encountered a non-enumerable quantifier bound\n1.\n1",
    ],
  ])(
    "fails a quantified formula whose body fails in TLC %s as one it can't handle",
    async (version, property, message) => {
      const result = check({
        source: `---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nInit == x = 0\nNext == x' = 1 - x\nSpec == Init /\\ [][Next]_x\nP == ${property}\n====`,
        config: "SPECIFICATION Spec\nPROPERTY P",
        version,
      });
      await expect(result).rejects.toThrow(new TlaEvaluationError(message));
    },
  );
});
