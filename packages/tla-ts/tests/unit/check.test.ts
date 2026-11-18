import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import {
  check,
  type CheckProgress,
  formatValue,
  parseModule,
  TlaConfigError,
  TlaEvaluationError,
  TlaSyntaxError,
} from "../../src";
import type { OutputLine } from "../../src/check";
import { UNEXPECTED_EVAL_EXCEPTION, UNEXPECTED_EXCEPTION } from "../../src/errors";
import type { TlcVersion } from "../../src/tlc/version";
import { formatState } from "../../src/values";
import { checkFixture, checkModule, checkSteps, FIXTURES } from "./check-harness";

const DIST = join(import.meta.dirname, "../../dist/index.js");

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
    const frames = result.failure?.callStack
      ?.filter((expression, index, stack) => expression !== stack[index - 1])
      .map((expression) => {
        const range = expression.location.range;
        return range
          ? `Line ${range.start.line}, column ${range.start.column} to line ${range.end.line}, column ${range.end.column} in ${range.module}`
          : "";
      });
    expect(frames).toEqual([
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
    ];
    for (const [body, config, name] of cases) {
      await expect(checkModule(body, config)).rejects.toThrow(
        new TlaConfigError(
          `The constant parameter ${name} is not assigned a value by the configuration file.`,
        ),
      );
    }
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

  it("binds a variable once for each time a lazy UNION streams an element", async () => {
    const set = "UNION {SUBSET {1}, {{}}}";
    const result = await checkBody(
      `VARIABLE x\nInit == x \\in ${set}\nNext == x' \\in ${set}`,
      "INIT Init\nNEXT Next",
    );
    expect([result.generatedStates, result.distinctStates]).toEqual([9, 2]);
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
