import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import {
  check,
  formatValue,
  parseModule,
  TlaConfigError,
  TlaEvaluationError,
  TlaSyntaxError,
} from "../../src";
import { createSanyError, UNEXPECTED_EXCEPTION } from "../../src/errors";
import { checkFixture, formatCallStackLines, getModuleLoader } from "./check-harness";

const DIRECTORY = join(import.meta.dirname, "../fixtures/instances");

const loadModule = getModuleLoader("instances");

const checkInstances = (configName: string, moduleName = "Instances") =>
  check({
    source: readFileSync(join(DIRECTORY, `${moduleName}.tla`), "utf8"),
    config: readFileSync(join(DIRECTORY, configName), "utf8"),
    loadModule,
  });

const SHADOWED_MODULES = new Map([
  [
    "N",
    "---- MODULE N ----\nEXTENDS Naturals, Sequences\nTwo == 2 + 2\nSmall == Nat \\cap {1}\nLength == Len(<<1, 2>>)\n====",
  ],
  ["Plus", "---- MODULE Plus ----\na + b == 99\n===="],
  ["Universe", "---- MODULE Universe ----\nCONSTANT Nat\n===="],
]);

const checkTheorem = (definitions: string, config: string) =>
  check({
    source: `---- MODULE M ----\nEXTENDS TLC\nCONSTANT c\nVARIABLE x\nI == INSTANCE Inner WITH k <- c\n${definitions}\nInit == x = 0\nNext == x' = x\n====`,
    config: `CONSTANT c = 1\n${config}`,
    loadModule: (name) =>
      name === "Inner"
        ? "---- MODULE Inner ----\nCONSTANT k\nTHEOREM Ta == ASSUME NEW y PROVE y = k\n===="
        : undefined,
  });

const THEOREM_LOCATION = "line 3, col 15 to line 3, col 38 of module Inner";

const checkShadowed = (unit: string, assumption: string, config = "") =>
  check({
    source: `---- MODULE M ----\n${unit}\nI == INSTANCE N\nASSUME ${assumption}\nVARIABLE x\nInit == x = 0\nNext == UNCHANGED x\n====`,
    config: `INIT Init\nNEXT Next\n${config}`,
    loadModule: (name) => SHADOWED_MODULES.get(name),
  });

const checkInstancedEnabled = (
  inner: string,
  substitution: string,
  maxSetSize: number | undefined,
  warnings: string[],
) =>
  check({
    source: `---- MODULE M ----\nEXTENDS Integers\nVARIABLES x, y\n---- MODULE Hi ----\nEXTENDS Integers\nVARIABLES c, d\n${inner}\n====\nInit == x = 0 /\\ y = 0\nNext == x < 2 /\\ x' = x + 1 /\\ UNCHANGED y\nH == INSTANCE Hi WITH c <- ${substitution}, d <- y\nInv == H!Can\n====`,
    config: "INIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
    maxSetSize,
    onProgress: (progress) => {
      if (progress.kind === "warning") warnings.push(progress.text);
    },
  });

const getInstancedEnabledOutcome = async (
  inner: string,
  substitution: string,
  maxSetSize: number | undefined,
) => {
  const warnings: string[] = [];
  const result = await checkInstancedEnabled(inner, substitution, maxSetSize, warnings);
  return [result.status, result.violation?.trace.map((step) => step.state.x), warnings];
};

describe("INSTANCE matches TLC", () => {
  it("substitutes constants and variables in named, parameterized, and unnamed instances", async () => {
    const result = await checkInstances("Instances.cfg");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([244, 27, 4]);
  });

  it("substitutes TLC's infix operators for constant operators of the same name", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS TLC\nVARIABLE x\nINSTANCE Inner\nInit == x = Merged[2]\nNext == UNCHANGED x\n====",
      config: "INIT Init\nNEXT Next",
      loadModule: (name) =>
        name === "Inner"
          ? "---- MODULE Inner ----\nCONSTANTS _ @@ _, _ :> _\nMerged == (1 :> 1) @@ (2 :> 2)\n===="
          : undefined,
    });
    expect([result.status, result.distinctStates]).toEqual(["success", 1]);
  });

  it("evaluates a substitution once each time an instantiated operator is evaluated", async () => {
    const prints: string[] = [];
    const result = await checkFixture("instances", "SubstOnce", "SubstOnce", {
      loadModule,
      onPrint: (text) => prints.push(text),
    });
    expect(result.status).toBe("success");
    expect(result.generatedStates).toBe(3);
    expect(prints).toEqual([1, 2, 2, 1, 3, 3, 2].map((value) => `<<"eval", ${value}>>  ${value}`));
  });

  it("evaluates each definition a named instance of a parameter-free module copies at startup, as SANY gives each its own OpDefNode", async () => {
    const prints: string[] = [];
    const result = await check({
      source:
        '---- MODULE M ----\nEXTENDS TLC\nI == INSTANCE Inner\nK == PrintT("K")\nJ == INSTANCE Inner\nL == PrintT("L")\nVARIABLE x\nInit == x = <<I!g, J!h, K>>\nNext == UNCHANGED x\n====',
      config: "INIT Init\nNEXT Next",
      loadModule: (name) =>
        name === "Inner"
          ? '---- MODULE Inner ----\nEXTENDS TLC\ng == PrintT("g")\nh == PrintT("h")\n===='
          : undefined,
      onPrint: (text) => prints.push(text),
    });
    expect(result.status).toBe("success");
    expect(prints).toEqual(['"g"', '"h"', '"h"', '"g"', '"K"', '"h"', '"g"', '"L"']);
  });

  it.each([
    [
      "an enclosing module's definitions before its inner module's",
      'A == PrintT("A")\n---- MODULE P ----\nP1 == PrintT("P1")\n====\nC == PrintT("C")',
      ["A", "C", "P1"],
    ],
    [
      "inner modules in the order of SANY's context",
      '---- MODULE P ----\nP1 == PrintT("P1")\n====\n---- MODULE Q ----\nQ1 == PrintT("Q1")\n====',
      ["Q1", "P1"],
    ],
    [
      "an inner module's own inner module after it",
      '---- MODULE P ----\nP1 == PrintT("P1")\n---- MODULE Q ----\nQ1 == PrintT("Q1")\n====\nP2 == PrintT("P2")\n====',
      ["P1", "P2", "Q1"],
    ],
    [
      "an instance's copies before the instanced inner module's definitions",
      '---- MODULE P ----\nFoo == PrintT("Foo")\nBar == PrintT("Bar")\nBaz == PrintT("Baz")\n====\nI == INSTANCE P',
      ["Bar", "Baz", "Foo", "Foo", "Bar", "Baz"],
    ],
    [
      "no inner module of a module instanced with a parameter",
      "I == INSTANCE N WITH c <- 1",
      ["N1"],
    ],
    [
      "nothing of a module that only a LET instances with a parameter",
      "D == LET K == INSTANCE N WITH c <- 1 IN K!N1",
      [],
    ],
    [
      "nothing of a module that only a proof step instances with a parameter",
      "THEOREM TRUE\n<1>1. INSTANCE N WITH c <- 1\n<1>2. QED",
      [],
    ],
    [
      "what an inner module EXTENDS when it visits that module",
      '---- MODULE U ----\nUA == PrintT("UA")\n====\n---- MODULE V ----\nEXTENDS U\nVA == PrintT("VA")\n====',
      ["UA", "VA"],
    ],
    [
      "what an inner module EXTENDS through another",
      '---- MODULE U ----\nUA == PrintT("UA")\n====\n---- MODULE V ----\nEXTENDS U\nVA == PrintT("VA")\n====\n---- MODULE W ----\nEXTENDS V\nWA == PrintT("WA")\n====',
      ["UA", "VA", "WA"],
    ],
    [
      "a failing inner definition again in each module that EXTENDS it",
      '---- MODULE U ----\nUX == PrintT("UX") /\\ (CHOOSE n \\in {} : TRUE)\n====\n---- MODULE V ----\nEXTENDS U\nVA == PrintT("VA")\n====',
      ["UX", "VA", "UX"],
    ],
    [
      "a failing file definition again in each module that EXTENDS it",
      "---- MODULE W ----\nEXTENDS F\n====",
      ["FX", "FX"],
    ],
    [
      "no inherited definition of a module instanced with a parameter",
      '---- MODULE U ----\nCONSTANT u\nUA == PrintT("UA")\n====\n---- MODULE V ----\nEXTENDS U\nVA == PrintT("VA")\n====\nI == INSTANCE U WITH u <- 1',
      ["UA", "VA"],
    ],
    [
      "the inner modules but not the definitions an inner module EXTENDS from a module instanced with a parameter",
      "---- MODULE W ----\nEXTENDS N\n====\nI == INSTANCE N WITH c <- 1",
      ["N1", "P1"],
    ],
    [
      "a LET whose instance's definitions don't read a variable's substitute",
      '---- MODULE P ----\nVARIABLE v\nN2(a) == PrintT(a)\n====\nI == INSTANCE P WITH v <- x\nD == LET K == INSTANCE P WITH v <- x IN K!N2("D")',
      ["D"],
    ],
    [
      "no LET whose instance's definition reads a variable's substitute",
      '---- MODULE P ----\nVARIABLE v\nN2(a) == PrintT(a)\nFv == v\n====\nI == INSTANCE P WITH v <- x\nD == LET K == INSTANCE P WITH v <- x IN K!N2("D")',
      [],
    ],
  ])("evaluates %s at startup, as TLC does", async (_name, lines, expected) => {
    const prints: string[] = [];
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS TLC\nVARIABLE x\n${lines}\nInit == x = 0\nNext == UNCHANGED x\n====`,
      config: "INIT Init\nNEXT Next",
      loadModule: (name) =>
        name === "N"
          ? '---- MODULE N ----\nEXTENDS TLC\nCONSTANT c\nN1 == PrintT("N1")\n---- MODULE P ----\nP1 == PrintT("P1")\n====\n===='
          : name === "F"
            ? '---- MODULE F ----\nEXTENDS TLC\nFX == PrintT("FX") /\\ (CHOOSE n \\in {} : TRUE)\n===='
            : undefined,
      onPrint: (text) => prints.push(text),
    });
    expect([result.status, prints]).toEqual(["success", expected.map((text) => `"${text}"`)]);
  });

  it("checks a named instance of a module whose own instance substitutes an expression of the variable it substitutes, as TLC does", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\n---- MODULE Inner ----\nVARIABLE v\nGet == v\n====\n---- MODULE Mid ----\nVARIABLE v\nJ == INSTANCE Inner WITH v <- v + 0\nVal == J!Get\n====\nI == INSTANCE Mid WITH v <- x + 0\nInit == x = 0\nNext == x' = x\nInv == I!Val = 0\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    });
    expect(result.status).toBe("success");
  });

  it("reports violations through instantiated operators", async () => {
    const result = await checkInstances("Violation.cfg");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.name).toBe("Different");
    expect(result.violation?.trace).toHaveLength(4);
  });

  it("scopes LOCAL instances per module and overrides definitions shared by instances", async () => {
    const result = await checkInstances("Scoping.cfg", "Scoping");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([4, 4, 4]);
  });

  it("overrides a definition scoped to a module in every instance of the module", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nCONSTANT Acc\nVARIABLE x\nMCBallot == 0..2\nV == INSTANCE Inner\nP(A) == INSTANCE Inner WITH Acc <- A\nInit == x = 0\nNext == UNCHANGED x\nInv == V!Safe /\\ P({3})!Safe /\\ V!Ballot = 0..2 /\\ x = 0\n====",
      config:
        "INIT Init\nNEXT Next\nCONSTANT Acc = {1, 2}\nBallot <-[Inner] MCBallot\nINVARIANT Inv",
      loadModule: (name) =>
        name === "Inner"
          ? "---- MODULE Inner ----\nEXTENDS Naturals\nCONSTANT Acc\nBallot == Nat\nSafe == \\A a \\in Acc, b \\in Ballot : b >= 0\n===="
          : undefined,
    });
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "success",
      2,
      1,
    ]);
  });

  it("substitutes operator parameters with LAMBDA expressions without capturing bound names", async () => {
    const result = await checkInstances("Operators.cfg", "Operators");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([113, 28, 7]);
  });

  it("reports violations through LAMBDA substitutions", async () => {
    const result = await checkInstances("OperatorsViolation.cfg", "Operators");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.trace).toHaveLength(4);
    expect([result.generatedStates, result.distinctStates]).toEqual([37, 16]);
  });

  it("instantiates modules inside LET with substitutions that use local names", async () => {
    const result = await checkInstances("LetInstances.cfg", "LetInstances");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([193, 96, 19]);
  });

  it("reports violations through instances defined inside LET", async () => {
    const result = await checkInstances("LetInstancesViolation.cfg", "LetInstances");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.trace).toHaveLength(5);
    expect(result.distinctStates).toBe(11);
  });

  it("checks a specification taken from a parameterized instance", async () => {
    const result = await checkInstances("ParameterizedSpec.cfg", "ParameterizedSpec");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([4, 4, 4]);
  });

  it("reports violations of a specification taken from a parameterized instance", async () => {
    const result = await checkInstances("ParameterizedSpecViolation.cfg", "ParameterizedSpec");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.trace).toHaveLength(4);
    expect([result.generatedStates, result.distinctStates]).toEqual([4, 4]);
  });

  it("keeps instance parameters apart from names bound inside the instance", async () => {
    const result = await checkInstances("Capture.cfg", "Capture");
    expect([result.status, result.generatedStates, result.distinctStates, result.depth]).toEqual([
      "success",
      3,
      2,
      2,
    ]);
  });

  it("renames names bound inside an instance that would capture substituted names", async () => {
    const result = await checkInstances("Binders.cfg", "Binders");
    expect([result.status, result.generatedStates, result.distinctStates, result.depth]).toEqual([
      "success",
      4,
      3,
      3,
    ]);
  });

  it("reports violations through substitutions that bound names would capture", async () => {
    const result = await checkInstances("BindersViolation.cfg", "Binders");
    expect([result.status, result.violation?.trace.length, result.distinctStates]).toEqual([
      "invariant-violation",
      2,
      2,
    ]);
  });

  it.each(["Selection", "SelectionOuter"])(
    "selects renamed LET definitions by their names in %s",
    async (moduleName) => {
      const result = await checkInstances("Selection.cfg", moduleName);
      expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
        "success",
        4,
        3,
      ]);
    },
  );

  it("instantiates parameterized modules inside LET", async () => {
    const result = await checkInstances("LetParameters.cfg", "LetParameters");
    expect([result.status, result.violation?.trace.length, result.distinctStates]).toEqual([
      "invariant-violation",
      4,
      4,
    ]);
  });

  it("applies recursive definitions of an instance inside LET without substitutions", async () => {
    const inner =
      "---- MODULE Inner ----\nEXTENDS Naturals\nr[n \\in 0..5] == IF n = 0 THEN 0 ELSE r[n - 1] + 2\nRECURSIVE R(_)\nR(n) == IF n = 0 THEN 0 ELSE R(n - 1) + 3\n====";
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = <<>>\nNext == x' = <<LET L == INSTANCE Inner IN L!r[3], LET L == INSTANCE Inner IN L!R(3), LET L == INSTANCE Inner IN L!r>>\nInv == x = <<>>\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      loadModule: (name) => (name === "Inner" ? inner : undefined),
    });
    expect(result.violation?.trace.map((step) => formatValue(step.state.x))).toEqual([
      "<<>>",
      "<<6, 9, (0 :> 0 @@ 1 :> 2 @@ 2 :> 4 @@ 3 :> 6 @@ 4 :> 8 @@ 5 :> 10)>>",
    ]);
  });

  it("evaluates the domain of a recursive function of a parameterized instance once per application", async () => {
    const inner =
      '---- MODULE Inner ----\nEXTENDS Naturals, TLC\nCONSTANT c\nr[n \\in {m \\in 0..2 : PrintT(<<"r", m>>)}] == IF n = 0 THEN c ELSE r[n - 1] + 1\n====';
    const printed: string[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nL(p) == INSTANCE Inner WITH c <- p\nInit == x = L(1)!r[2] + L(2)!r[1]\nNext == UNCHANGED x\n====",
      config: "INIT Init\nNEXT Next",
      loadModule: (name) => (name === "Inner" ? inner : undefined),
      onPrint: (text) => printed.push(text),
    });
    expect(result.status).toBe("success");
    expect(printed).toEqual([
      '<<"r", 0>>',
      '<<"r", 1>>',
      '<<"r", 2>>',
      '<<"r", 0>>',
      '<<"r", 1>>',
      '<<"r", 2>>',
    ]);
  });

  it("substitutes a replacement an instance of an instance binds once in a function the operator it copies refers to", async () => {
    const result = await check({
      source:
        "---- MODULE N ----\nEXTENDS Naturals\nVARIABLES x, y\n---- MODULE Inner ----\nEXTENDS Naturals\nVARIABLES a, b\ng[n \\in 0..1] == a + n\nP == g[1] + b < 3\n====\n---- MODULE Mid ----\nVARIABLES p, q\nJ == INSTANCE Inner WITH a <- p, b <- q\n====\nI == INSTANCE Mid WITH p <- x + 1, q <- y\nInit == x = 0 /\\ y = 0\nNext == x < 3 /\\ x' = x + 1 /\\ y' = y\nInv == I!J!P\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    });
    expect([result.violation?.name, result.violation?.trace.map((step) => step.state.x)]).toEqual([
      "Inv",
      [0, 1],
    ]);
  });

  it("substitutes operator symbols at the end of a WITH clause", async () => {
    expect((await checkInstances("Symbols.cfg", "Symbols")).status).toBe("success");
  });

  it("calls a recursive function of a LET INSTANCE, not a definition of its name in the instancing module", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nr == 100\nInit == x = 0\nNext == x' = LET L == INSTANCE Inner IN L!r[2] + r\nInv == x = 0\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      loadModule: (name) =>
        name === "Inner"
          ? "---- MODULE Inner ----\nEXTENDS Naturals\nr[n \\in 0..2] == IF n = 0 THEN 0 ELSE r[n - 1] + 1\n===="
          : undefined,
    });
    expect(result.violation?.trace.map((step) => step.state.x)).toEqual([0, 102]);
  });

  it("resolves the definitions a LET INSTANCE copies in the instanced module, not the instancing one", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nVARIABLE x\nInit == x = <<>>\nNext == x' = <<LET L == INSTANCE Call WITH c <- 2 IN L!G(1), LET L(p) == INSTANCE Call WITH c <- p IN L(3)!G(1), LET a + b == 99 IN LET L == INSTANCE Call WITH c <- 2 IN L!G(1)>>\nInv == x = <<>>\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      loadModule: (name) =>
        name === "Call"
          ? "---- MODULE Call ----\nEXTENDS Naturals\nCONSTANT c\nF(a) == a + c\nG(a) == F(a) + 1\n===="
          : undefined,
    });
    expect(result.violation?.trace.map((step) => formatValue(step.state.x))).toEqual([
      "<<>>",
      "<<4, 5, 4>>",
    ]);
  });

  it("evaluates a LET INSTANCE's copy that a module-level instance already defines as the module-level copy, as TLC does", async () => {
    const prints: string[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS TLC\n---- MODULE Inner ----\nCONSTANT c\nFoo == c\n====\nI == INSTANCE Inner WITH c <- 2\nF == LET I == INSTANCE Inner WITH c <- 1 IN I!Foo\nASSUME PrintT(F)\nVARIABLE x\nInit == x = 0\nNext == x' = x\n====",
      config: "INIT Init\nNEXT Next",
      onPrint: (text) => prints.push(text),
    });
    expect([result.status, prints]).toEqual([
      "success",
      [
        "*** Warnings: 2\n\nline 8, col 10 to line 8, col 40 of module M\n\nMultiple declarations or definitions for symbol I!Foo.  \nThis duplicates the one at line 7, col 1 to line 7, col 31 of module M.\n\n\n\nline 8, col 10 to line 8, col 40 of module M\n\nMultiple declarations or definitions for symbol I.  \nThis duplicates the one at line 7, col 1 to line 7, col 31 of module M.\n\n\n",
        "2",
      ],
    ]);
  });

  it("evaluates a LET INSTANCE's copy that an earlier LET INSTANCE already defines as the earlier copy, as TLC does", async () => {
    const prints: string[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS TLC\n---- MODULE Inner ----\nCONSTANT c\nFoo == c\n====\nN == INSTANCE Inner WITH c <- 0\nF == LET I == INSTANCE Inner WITH c <- 1\n         I == INSTANCE Inner WITH c <- 2\n     IN I!Foo\nASSUME PrintT(F)\nVARIABLE x\nInit == x = 0\nNext == x' = x\n====",
      config: "INIT Init\nNEXT Next",
      onPrint: (text) => prints.push(text),
    });
    expect([result.status, prints]).toEqual([
      "success",
      [
        "*** Warnings: 2\n\nline 9, col 10 to line 9, col 40 of module M\n\nMultiple declarations or definitions for symbol I!Foo.  \nThis duplicates the one at line 8, col 10 to line 8, col 40 of module M.\n\n\n\nline 9, col 10 to line 9, col 40 of module M\n\nMultiple declarations or definitions for symbol I.  \nThis duplicates the one at line 8, col 10 to line 8, col 40 of module M.\n\n\n",
        "1",
      ],
    ]);
  });

  it.each([
    [
      "the LET's body",
      "F == LET I == INSTANCE Inner WITH c <- 1\n     IN LET I == INSTANCE Inner WITH c <- 2\n        IN I!Foo",
      "line 9, col 13 to line 9, col 43",
    ],
    [
      "a later LET definition",
      "F == LET I == INSTANCE Inner WITH c <- 1\n         G == LET I == INSTANCE Inner WITH c <- 2 IN I!Foo\n     IN G",
      "line 9, col 19 to line 9, col 49",
    ],
  ])(
    "evaluates a nested LET INSTANCE's copy in %s that the enclosing LET INSTANCE already defines as the enclosing copy, as TLC does",
    async (_title, definition, location) => {
      const prints: string[] = [];
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS TLC\n---- MODULE Inner ----\nCONSTANT c\nFoo == c\n====\nN == INSTANCE Inner WITH c <- 0\n${definition}\nASSUME PrintT(F)\nVARIABLE x\nInit == x = 0\nNext == x' = x\n====`,
        config: "INIT Init\nNEXT Next",
        onPrint: (text) => prints.push(text),
      });
      expect([result.status, prints]).toEqual([
        "success",
        [
          `*** Warnings: 2\n\n${location} of module M\n\nMultiple declarations or definitions for symbol I!Foo.  \nThis duplicates the one at line 8, col 10 to line 8, col 40 of module M.\n\n\n\n${location} of module M\n\nMultiple declarations or definitions for symbol I.  \nThis duplicates the one at line 8, col 10 to line 8, col 40 of module M.\n\n\n`,
          "1",
        ],
      ]);
    },
  );

  it("parses a prefix operator followed by an operand as an expression", () => {
    const module = parseModule(
      "---- MODULE M ----\nI == INSTANCE N WITH a <- - b, c <- SUBSET d, e <- -\n====",
    );
    expect(module.instances[0].substitutions.map((item) => item.expression.kind)).toEqual([
      "Apply",
      "Apply",
      "OperatorReference",
    ]);
    expect(() =>
      parseModule(
        "---- MODULE M ----\nFoo == LET I == INSTANCE N WITH c <- ~\n           J == 1\n       IN J\n====",
      ),
    ).not.toThrow();
  });

  it.each([
    ["a root infix operator", "a + b == 99", "I!Two = 4", ""],
    ["a root constant operator", "Nat == {7}", "I!Small = {1}", ""],
    ["a root operator", "Len(s) == 42", "I!Length = 2", ""],
    ["an operator the root extends", "EXTENDS Plus", "I!Two = 4", ""],
    [
      "a root operator around a LET INSTANCE",
      "a + b == 99",
      "LET J == INSTANCE N IN J!Two = 4",
      "",
    ],
    ["a root constant", "CONSTANT Nat", "I!Small = {1} /\\ Nat = {7}", "CONSTANT Nat = {7}"],
    ["a model value", "CONSTANT Nat", "I!Small = {1}", "CONSTANT Nat = Nat"],
    ["a constant the root extends", "EXTENDS Universe", "I!Small = {1}", "CONSTANT Nat = {7}"],
    [
      "a root operator constant",
      "CONSTANT Len(_)\nMyLen(s) == 42",
      "I!Length = 2 /\\ Len(<<>>) = 42",
      "CONSTANT Len <- MyLen",
    ],
  ])(
    "keeps a standard operator in an instanced module apart from %s of the same name",
    async (_title, unit, assumption, config) => {
      expect((await checkShadowed(unit, assumption, config)).status).toBe("success");
    },
  );

  it.each([
    ["assigns a value", "Nat == {7}", "I!Small = {1} /\\ Nat = {9}", "CONSTANT Nat = {9}"],
    [
      "replaces with an operator",
      "a + b == 99\nPlus(a, b) == 5",
      "I!Two = 4 /\\ 1 + 1 = 5",
      "CONSTANT + <- Plus",
    ],
    ["defines by a table", "Len(s) == 42", "I!Length = 2", "CONSTANT Len(s) = 3"],
  ])(
    "keeps a standard operator in an instanced module apart from a root definition of the same name that the configuration %s",
    async (_title, unit, assumption, config) => {
      expect((await checkShadowed(unit, assumption, config)).status).toBe("success");
    },
  );

  it("checks the root definition a configuration names where an instanced module loads a Java override of the same name", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nVARIABLE x\nI == INSTANCE N\nNat == x \\in {0, 1}\nInit == x = 0\nNext == x' = I!Succ(x)\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Nat",
      loadModule: (name) =>
        name === "N" ? "---- MODULE N ----\nEXTENDS Naturals\nSucc(v) == v + 1\n====" : undefined,
    });
    expect(result.violation?.name).toBe("Nat");
    expect(result.violation?.trace.map((step) => formatValue(step.state.x))).toEqual([
      "0",
      "1",
      "2",
    ]);
  });

  it("names a property that applies an operator of an instance as TLC does", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nI == INSTANCE N\nInit == x = 0\nNext == x' = (x + 1) % 3\nR == I!Rising(x)\n====",
      config: "INIT Init\nNEXT Next\nPROPERTY R",
      loadModule: (name) =>
        name === "N"
          ? "---- MODULE N ----\nEXTENDS Naturals\nRising(v) == [][v' >= v]_v\n===="
          : undefined,
    });
    expect(result.violation?.name).toBe("I!Rising");
  });

  it.each([
    ["v <- (x = 1)", "I!Dv", "I!Dv"],
    ["v <- (x = 0)", "I!Ev", "v"],
    ["v <- x", "I!Gv", "G"],
  ])(
    "names a property that reaches the substitute in %s through %s as TLC does",
    async (substitution, property, name) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 2\nI == INSTANCE L WITH ${substitution}\nProp == ${property}\n====`,
        config: "INIT Init\nNEXT Next\nPROPERTY Prop",
        loadModule: (module) =>
          module === "L"
            ? "---- MODULE L ----\nVARIABLE v\nDv == v\nEv == [](v)\nGv == LET G == v = 0 IN [](G)\n===="
            : undefined,
      });
      expect(result.violation?.name).toBe(name);
    },
  );

  it.each([
    ["v <- (x = 1)", "K!Dv", "K!Dv"],
    ["v <- (x = 0)", "K!Ev", "v"],
    ["v <- x", "K!Gv", "G"],
    ["v <- FALSE", "K!Dv", "K!Dv"],
  ])(
    "names a property that reaches the substitute in a LET instance's %s through %s as TLC does",
    async (substitution, property, name) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 2\nProp == LET K == INSTANCE L WITH ${substitution} IN ${property}\n====`,
        config: "INIT Init\nNEXT Next\nPROPERTY Prop",
        loadModule: (module) =>
          module === "L"
            ? "---- MODULE L ----\nVARIABLE v\nDv == v\nEv == [](v)\nGv == LET G == v = 0 IN [](G)\n===="
            : undefined,
      });
      expect(result.violation?.name).toBe(name);
    },
  );

  it.each([
    ["I == INSTANCE L2 WITH w <- (x = 1)\nProp == I!D2", "J!Dv"],
    ["I == INSTANCE L2 WITH w <- (x = 0)\nProp == I!E2", "v"],
    ["INSTANCE L2 WITH w <- (x = 1)\nProp == D2", "J!Dv"],
    ["I(q) == INSTANCE L2 WITH w <- q\nProp == I(x = 1)!D2", "J!Dv"],
    ["Prop == LET K == INSTANCE L2 WITH w <- (x = 1) IN K!D2", "J!Dv"],
    ["Prop == LET K == INSTANCE L2 WITH w <- (x = 0) IN K!E2", "v"],
  ])(
    "names the property in %j through an instance chain as TLC does",
    async (definitions, name) => {
      const modules = new Map([
        ["L", "---- MODULE L ----\nVARIABLE v\nDv == v\nEv == [](v)\n===="],
        [
          "L2",
          "---- MODULE L2 ----\nVARIABLE w\nJ == INSTANCE L WITH v <- w\nD2 == J!Dv\nE2 == J!Ev\n====",
        ],
      ]);
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 2\n${definitions}\n====`,
        config: "INIT Init\nNEXT Next\nPROPERTY Prop",
        loadModule: (module) => modules.get(module),
      });
      expect(result.violation?.name).toBe(name);
    },
  );

  it.each([
    ["I == INSTANCE L WITH v <- (x = 0)\nProp == [](I!Dv)", "I!Dv"],
    ["I == INSTANCE L2 WITH w <- (x = 0)\nProp == I!B2", "J!Dv"],
    ["Prop == LET K == INSTANCE L2 WITH w <- (x = 0) IN K!B2", "J!Dv"],
    ["One == x = 0\nI == INSTANCE L WITH v <- One\nProp == I!Wv", "v"],
    ["I == INSTANCE C\nProp == [](I!Cv)", "I!Cv"],
  ])(
    "names the invariant in %j by the operator under the box, as its module names it, as TLC does",
    async (definitions, name) => {
      const modules = new Map([
        ["L", "---- MODULE L ----\nVARIABLE v\nDv == v\nWv == [](v)\n===="],
        [
          "L2",
          "---- MODULE L2 ----\nVARIABLE w\nJ == INSTANCE L WITH v <- w\nB2 == [](J!Dv)\n====",
        ],
        ["C", "---- MODULE C ----\nCv == 1 = 2\n===="],
      ]);
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 2\n${definitions}\n====`,
        config: "INIT Init\nNEXT Next\nPROPERTY Prop",
        loadModule: (module) => modules.get(module),
      });
      expect(result.violation?.name).toBe(name);
    },
  );

  it.each([
    ["v <- (x = 1 /\\ x >= 0)", "I!Dv", undefined, "I!Dv"],
    ["v <- (\\A k \\in {1} : x = k)", "I!Dv", undefined, "I!Dv"],
    ["v <- One", "I!Dv", undefined, "I!Dv"],
    ["v <- One", "I!Av", undefined, "line 4, col 7 to line 4, col 7 of module L"],
    ["v <- One", "I!Kv", undefined, "G"],
    ["v <- (x = 1)", "I!Dv", 1, "I!Dv"],
    ["v <- (x = 1)", "I!Kv", 1, "G"],
  ])(
    "names a property that reaches the VARIABLE substitute in %s through %s, with coverage %s, as TLC does",
    async (substitution, property, coverage, name) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 2\nOne == x = 1\nI == INSTANCE L WITH ${substitution}\nProp == ${property}\n====`,
        config: "INIT Init\nNEXT Next\nPROPERTY Prop",
        coverage,
        loadModule: (module) =>
          module === "L"
            ? "---- MODULE L ----\nVARIABLE v\nDv == v\nAv == v /\\ TRUE\nKv == LET G == v IN G\n===="
            : undefined,
      });
      expect(result.violation?.name).toBe(name);
    },
  );

  it.each([
    ["Prop == LET K == INSTANCE L WITH v <- (x = 1) IN K!Av", "line 4, col 7 to line 4, col 7"],
    ["I == INSTANCE L2 WITH w <- (x = 1)\nProp == I!A2", "line 4, col 7 to line 4, col 7"],
    ["I(q) == INSTANCE L2 WITH w <- q\nProp == I(x = 1)!A2", "line 4, col 7 to line 4, col 7"],
    ["Prop == LET K == INSTANCE L WITH v <- (x = 1) IN K!Fv", "line 5, col 22 to line 5, col 22"],
    ["I == INSTANCE L2 WITH w <- (x = 1)\nProp == I!F2", "line 5, col 22 to line 5, col 22"],
    ["I(q) == INSTANCE L WITH v <- q\nProp == I(x = 1)!Fv", "line 5, col 22 to line 5, col 22"],
  ])(
    "names the substitute that %j reaches as a part by its position in L, as TLC does",
    async (definitions, range) => {
      const modules = new Map([
        [
          "L",
          "---- MODULE L ----\nVARIABLE v\nDv == v\nAv == v /\\ TRUE\nFv == \\A k \\in {1} : v\n====",
        ],
        [
          "L2",
          "---- MODULE L2 ----\nVARIABLE w\nJ == INSTANCE L WITH v <- w\nA2 == J!Av\nF2 == J!Fv\n====",
        ],
      ]);
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 2\n${definitions}\n====`,
        config: "INIT Init\nNEXT Next\nPROPERTY Prop",
        loadModule: (module) => modules.get(module),
      });
      expect(result.violation?.name).toBe(`${range} of module L`);
    },
  );

  // Deviation from TLC: it rejects each row, though it checks [](x \in {0, 1}), [](x = 0) and x = 1 written without the instance this way.
  it.each([
    ["[](x \\in {0, 1})", "success", undefined],
    ["[](x = 0)", "invariant-violation", "I!D"],
    ["(x = 1)", "liveness-violation", "I!D"],
  ])(
    "checks a property that is the constant c <- %s of an instance, which TLC rejects as 'The operator c ... cannot be used as a property'",
    async (substitute, status, name) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 2\nI == INSTANCE L WITH c <- ${substitute}\nProp == I!D\n====`,
        config: "INIT Init\nNEXT Next\nPROPERTY Prop",
        loadModule: (module) =>
          module === "L" ? "---- MODULE L ----\nCONSTANT c\nD == c\n====" : undefined,
      });
      expect([result.status, result.violation?.name]).toEqual([status, name]);
    },
  );

  // Deviation from TLC: it rejects the spec, though it checks Init /\ [][Next]_x /\ WF_x(Next) written without the instance this way.
  it("takes fairness that is the constant c <- WF_x(Next) of an instance, which TLC rejects as 'The operator c ... cannot be used as a spec'", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 2\nI == INSTANCE L WITH c <- WF_x(Next)\nSpec == Init /\\ [][Next]_x /\\ I!D\nLive == <>(x = 1)\n====",
      config: "SPECIFICATION Spec\nPROPERTY Live",
      loadModule: (module) =>
        module === "L" ? "---- MODULE L ----\nCONSTANT c\nD == c\n====" : undefined,
    });
    expect(result.status).toBe("success");
  });

  it.each([
    ["F == FALSE", "I!F", "The spec is trivially false because I!F is false."],
    ["G == 3", "I!G", "The operator I!G, which equals 3,\ncannot be used as a spec"],
  ])(
    "names a constant conjunct of the spec from an instance as TLC does: %s",
    async (definition, conjunct, message) => {
      await expect(
        check({
          source: `---- MODULE M ----\nVARIABLE x\nI == INSTANCE N\nInit == x = 0\nNext == x' = x\nSpec == Init /\\ [][Next]_x /\\ ${conjunct}\n====`,
          config: "SPECIFICATION Spec",
          loadModule: (name) =>
            name === "N" ? `---- MODULE N ----\n${definition}\n====` : undefined,
        }),
      ).rejects.toThrow(new TlaConfigError(message));
    },
  );

  it("applies a standard operator an instance with parameters imports to its own arguments, where TLC fails", async () => {
    const prints: string[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS TLC\nVARIABLE x\nI(c) == INSTANCE Sub\nAp(Op(_, _), v) == Op(5, v)\nASSUME PrintT(<<I(5)!Len(<<1, 2>>), I(5)!+(1, 2), I(5)!-.(3), 2 \\in I(5)!Nat, I(5)!Append(<<1>>, 2), Ap(I!Len, <<4>>)>>)\nInit == x = 0\nNext == x' = x\n====",
      config: "INIT Init\nNEXT Next",
      loadModule: (name) =>
        name === "Sub"
          ? "---- MODULE Sub ----\nEXTENDS Integers, Sequences\nCONSTANT c\n===="
          : undefined,
      onPrint: (text) => prints.push(text),
    });
    expect([result.status, prints]).toEqual(["success", ["<<2, 3, -3, TRUE, <<1, 2>>, 1>>"]]);
  });

  it("applies an operator of a standard module instanced with parameters to its own arguments, where TLC fails", async () => {
    const prints: string[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS TLC\nVARIABLE x\nS(a) == INSTANCE Sequences\nN(a) == INSTANCE Naturals\nAp(Op(_, _, _), v) == Op(1, v, 2)\nASSUME PrintT(<<S(1)!Append(<<5>>, 1), S(1)!Len(<<5>>), N(1)!+(2, 3), Ap(S!Append, <<4>>)>>)\nInit == x = 0\nNext == x' = x\n====",
      config: "INIT Init\nNEXT Next",
      onPrint: (text) => prints.push(text),
    });
    expect([result.status, prints]).toEqual(["success", ["<<<<5, 1>>, 1, 5, <<4, 2>>>>"]]);
  });

  it("selects into an operator of a standard module instanced with parameters like TLC", async () => {
    const prints: string[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS TLC\nVARIABLE x\nS(a) == INSTANCE Sequences\nASSUME PrintT(<<S(5)!Append(<<1>>, 2)!1, S(5)!Len(<<1, 2>>)!1>>)\nInit == x = 0\nNext == x' = x\n====",
      config: "INIT Init\nNEXT Next",
      onPrint: (text) => prints.push(text),
    });
    expect([result.status, prints]).toEqual(["success", ["<<<<1>>, Nat>>"]]);
  });

  it("can't evaluate an ASSUME/PROVE theorem a substituting instance imports, like TLC", async () => {
    const assumed = await checkTheorem("ASSUME PrintT(I!Ta)", "INIT Init\nNEXT Next");
    expect([assumed.status, assumed.violation?.name, assumed.violation?.message]).toEqual([
      "assumption-violation",
      "line 6, col 8 to line 6, col 19 of module M",
      `Attempted to evaluate an expression that cannot be evaluated.\n${THEOREM_LOCATION}`,
    ]);
    const initial = await checkTheorem("Init2 == x = 0 /\\ I!Ta", "INIT Init2\nNEXT Next");
    expect([initial.failure?.message, formatCallStackLines(initial)]).toEqual([
      `Attempted to evaluate an expression that cannot be evaluated.\n${THEOREM_LOCATION}`,
      [
        "Line 6, column 10 to line 6, column 22 in M",
        "Line 6, column 10 to line 6, column 14 in M",
        "Line 6, column 19 to line 6, column 22 in M",
        "Line 5, column 1 to line 5, column 31 in M",
        "Line 3, column 15 to line 3, column 38 in Inner",
      ],
    ]);
  });

  it.each([
    [
      "Init2 == I!Ta /\\ x = 0",
      "INIT Init2\nNEXT Next",
      `The init state relation is not a boolean expression.\n${THEOREM_LOCATION}`,
      [
        "Line 6, column 10 to line 6, column 22 in M",
        "Line 6, column 10 to line 6, column 13 in M",
      ],
    ],
    [
      "Next2 == I!Ta /\\ x' = x",
      "INIT Init\nNEXT Next2",
      `${UNEXPECTED_EXCEPTION}The next state relation is not a boolean expression.\n${THEOREM_LOCATION}`,
      [
        "Line 6, column 10 to line 6, column 23 in M",
        "Line 6, column 10 to line 6, column 13 in M",
      ],
    ],
    [
      "Next2 == x' = x /\\ ENABLED I!Ta",
      "INIT Init\nNEXT Next2",
      `${UNEXPECTED_EXCEPTION}Attempted to compute ENABLED on a non-boolean expression.\n${THEOREM_LOCATION}`,
      [
        "Line 6, column 10 to line 6, column 31 in M",
        "Line 6, column 10 to line 6, column 15 in M",
        "Line 6, column 20 to line 6, column 31 in M",
        "Line 6, column 28 to line 6, column 31 in M",
      ],
    ],
  ])(
    "reports an ASSUME/PROVE theorem a substituting instance imports in %s as not boolean, like TLC",
    async (definitions, config, message, frames) => {
      const result = await checkTheorem(definitions, config);
      expect([result.failure?.message, formatCallStackLines(result)]).toEqual([
        message,
        [
          ...frames,
          "Line 5, column 1 to line 5, column 31 in M",
          "Line 3, column 15 to line 3, column 38 in Inner",
        ],
      ]);
    },
  );

  it.each([
    [
      "Foo == I!Ta\nNext2 == Foo",
      ["Line 7, column 10 to line 7, column 12 in M", "Line 6, column 8 to line 6, column 11 in M"],
    ],
    [
      "Next2 == \\E i \\in {1} : x' = x \\/ I!Ta",
      [
        "Line 6, column 10 to line 6, column 38 in M",
        "Line 6, column 25 to line 6, column 38 in M",
        "Line 6, column 35 to line 6, column 38 in M",
      ],
    ],
  ])(
    "keeps the operator or \\E around an ASSUME/PROVE theorem in %s as one action, like TLC",
    async (definitions, frames) => {
      const result = await checkTheorem(definitions, "INIT Init\nNEXT Next2");
      expect([result.failure?.message, formatCallStackLines(result)]).toEqual([
        `${UNEXPECTED_EXCEPTION}The next state relation is not a boolean expression.\n${THEOREM_LOCATION}`,
        [
          ...frames,
          "Line 5, column 1 to line 5, column 31 in M",
          "Line 3, column 15 to line 3, column 38 in Inner",
        ],
      ]);
    },
  );

  it("reports an ASSUME/PROVE theorem as an action of the next-state relation as not boolean, where TLC crashes", async () => {
    await expect(checkTheorem("Next2 == x' = x \\/ I!Ta", "INIT Init\nNEXT Next2")).rejects.toThrow(
      new TlaEvaluationError(
        `${UNEXPECTED_EXCEPTION}The next state relation is not a boolean expression.\n${THEOREM_LOCATION}`,
      ),
    );
  });

  it("keeps the \\E around an ASSUME/PROVE theorem an instance substitutes an expression into as one action, like TLC", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nCONSTANT c\nVARIABLE x\nI == INSTANCE Inner WITH k <- {c}\nInit == x = 0\nNext == \\E i \\in {1} : x' = x \\/ I!Tb\n====",
      config: "CONSTANT c = 1\nINIT Init\nNEXT Next",
      loadModule: (name) =>
        name === "Inner"
          ? "---- MODULE Inner ----\nCONSTANT k\nTHEOREM Tb == ASSUME k = k PROVE TRUE\n===="
          : undefined,
    });
    expect([result.failure?.message, formatCallStackLines(result)]).toEqual([
      `${UNEXPECTED_EXCEPTION}The next state relation is not a boolean expression.\nline 3, col 15 to line 3, col 37 of module Inner`,
      [
        "Line 6, column 9 to line 6, column 37 in M",
        "Line 6, column 24 to line 6, column 37 in M",
        "Line 6, column 34 to line 6, column 37 in M",
        "Line 4, column 1 to line 4, column 33 in M",
        "",
        "Line 3, column 15 to line 3, column 37 in Inner",
      ],
    ]);
  });

  it.each(["(LET k == d IN k)", "<<LET k == d IN k>>", "dk"])(
    "keeps the variable a LET names under UNCHANGED %s in an instanced ENABLED, as TLC's Tool#getVar finds it",
    async (unchanged) => {
      const result = await check({
        source:
          "---- MODULE M ----\nEXTENDS Naturals\nVARIABLES x, y\nI == INSTANCE Inner WITH c <- x, d <- y\nInit == x = 0 /\\ y = 0\nNext == x < 3 /\\ x' = x + 1 /\\ UNCHANGED y\nInv == I!Can\n====",
        config: "INIT Init\nNEXT Next\nINVARIANT Inv",
        loadModule: (name) =>
          name === "Inner"
            ? `---- MODULE Inner ----\nEXTENDS Naturals\nVARIABLES c, d\ndk == LET k == d IN k\nA == c < 2 /\\ c' = c + 1 /\\ UNCHANGED ${unchanged}\nCan == ENABLED <<A>>_<<c, d>>\n====`
            : undefined,
      });
      expect([result.violation?.name, result.violation?.trace.map((step) => step.state.x)]).toEqual(
        ["Inv", [0, 1, 2]],
      );
    },
  );

  const getChangedWarning = (name: string, location: string) =>
    `The variable ${name} was changed while it is specified as UNCHANGED at\n${location} of module M`;

  it.each([
    [
      "Keep(v) == v\nA == c' = c + 1 /\\ UNCHANGED Keep(c)\nCan == ENABLED A",
      "x",
      ["invariant-violation", [0], []],
    ],
    [
      "Keep(v) == v\nA == c' = c /\\ UNCHANGED Keep(c)\nCan == ENABLED A",
      "x + 0",
      ["success", undefined, []],
    ],
    [
      "Keep(v) == v\nA == c' = c + 1 /\\ UNCHANGED Keep(c)\nCan == ENABLED A",
      "x + 0",
      ["invariant-violation", [0], []],
    ],
    [
      "Op(v) == UNCHANGED v\nA == c' = c + 1 /\\ Op(d)\nCan == ENABLED <<A>>_<<c, d>>",
      "x",
      ["success", undefined, []],
    ],
    [
      "A == LET k == d IN c' = c + 1 /\\ UNCHANGED k\nCan == ENABLED <<A>>_<<c, d>>",
      "x",
      ["success", undefined, []],
    ],
    [
      "Op(v) == v' = v\nA == c' = c + 1 /\\ Op(d)\nCan == ENABLED <<A>>_<<c, d>>",
      "x",
      ["success", undefined, []],
    ],
    [
      "Op(v) == UNCHANGED v\nA == c' = c + 1 /\\ d' = 1 - d /\\ Op(d)\nCan == ENABLED <<A>>_<<c, d>>",
      "x",
      ["invariant-violation", [0], [getChangedWarning("d", "line 7, col 20 to line 7, col 20")]],
    ],
  ])(
    "reads a primed variable of an instance inside its ENABLED as the variable ENABLED binds, however it is reached, as TLC's OPCODE_enabled branches the context: %s with c <- %s",
    async (inner, substitution, outcome) => {
      expect(await getInstancedEnabledOutcome(inner, substitution, undefined)).toEqual(outcome);
      expect(await getInstancedEnabledOutcome(inner, substitution, 1_000_000)).toEqual(outcome);
    },
  );

  it.each([
    [
      "A == c' = c + 1 /\\ UNCHANGED <<c, d>>\nCan == ENABLED A",
      getChangedWarning("c", "line 7, col 32 to line 7, col 32"),
    ],
    [
      "A == c' = c + 1 /\\ UNCHANGED (LET k == c IN k)\nCan == ENABLED <<A>>_<<c, d>>",
      getChangedWarning("c", "line 7, col 31 to line 7, col 45"),
    ],
  ])(
    "warns about a changed variable of an instance that its ENABLED keeps unchanged, as TLC's Tool#enabledUnchanged does: %s",
    async (inner, warning) => {
      const outcome = ["invariant-violation", [0], [warning]];
      expect(await getInstancedEnabledOutcome(inner, "x", undefined)).toEqual(outcome);
      expect(await getInstancedEnabledOutcome(inner, "x", 1_000_000)).toEqual(outcome);
    },
  );

  it.each([
    [
      "after the step changes one",
      "dv == <<d>>\nA == c' = c + 1 /\\ d' = 1 - d /\\ UNCHANGED dv\nCan == ENABLED A",
      ["invariant-violation", [0], [getChangedWarning("d", "line 7, col 9 to line 7, col 9")]],
    ],
    [
      "nested in another definition",
      "dv == <<d>>\nboth == <<dv, c>>\nA == c' = c /\\ UNCHANGED both\nCan == ENABLED A",
      ["success", undefined, []],
    ],
    [
      "before a guard reads one",
      "dv == <<d>>\nA == c' = c + 1 /\\ UNCHANGED dv /\\ d' > d\nCan == ENABLED A",
      ["invariant-violation", [0], []],
    ],
  ])(
    "keeps the variables of a definition under UNCHANGED in an instanced ENABLED, as TLC's Tool#enabledUnchanged takes its body, %s",
    async (_label, inner, outcome) => {
      expect(await getInstancedEnabledOutcome(inner, "x", undefined)).toEqual(outcome);
      expect(await getInstancedEnabledOutcome(inner, "x", 1_000_000)).toEqual(outcome);
    },
  );

  it.each([
    [
      "swaps the names of two variables",
      "A == c = 0 /\\ c' = 1 /\\ d' = d",
      "VARIABLES c, d\nInit == c = 0 /\\ d \\in 0..1\nNext == UNCHANGED <<c, d>>\nH == INSTANCE Hi WITH c <- d, d <- c",
      ["invariant-violation", [{ c: 0, d: 1 }]],
    ],
    [
      "substitutes a definition of the same name",
      "A == LET k == c IN k' = k + 1 /\\ d' = d /\\ k' > k",
      "VARIABLES x, d\nc == 1 - x\nInit == x \\in 0..2 /\\ d = 0\nNext == UNCHANGED <<x, d>>\nH == INSTANCE Hi",
      ["success", undefined],
    ],
    [
      "keeps one variable and substitutes it for the other",
      "A == LET k == d IN c' = c + 1 /\\ k' = k + 1 /\\ k' > c'",
      "VARIABLES c, d\nInit == c \\in 0..2 /\\ d = 0\nNext == UNCHANGED <<c, d>>\nH == INSTANCE Hi WITH c <- c, d <- c",
      ["invariant-violation", [{ c: 0, d: 0 }]],
    ],
  ])(
    "binds a variable in an instance's ENABLED where the instance %s, as TLC's Context.lookup does",
    async (_label, action, outer, outcome) => {
      const results = await Promise.all(
        [undefined, 1_000_000].map((maxSetSize) =>
          check({
            source: `---- MODULE M ----\nEXTENDS Integers\n${outer}\nInv == H!Can\n====`,
            config: "INIT Init\nNEXT Next\nINVARIANT Inv",
            maxSetSize,
            loadModule: (name) =>
              name === "Hi"
                ? `---- MODULE Hi ----\nEXTENDS Integers\nVARIABLES c, d\n${action}\nCan == ENABLED A\n====`
                : undefined,
          }),
        ),
      );
      expect(
        results.map((result) => [result.status, result.violation?.trace.map((step) => step.state)]),
      ).toEqual([outcome, outcome]);
    },
  );

  it.each([undefined, 1_000_000])(
    "keeps a primed variable of an instance in its ENABLED apart from the outer variable of the same name, as TLC's Context.lookup does (maxSetSize %s)",
    async (maxSetSize) => {
      const result = await check({
        source:
          "---- MODULE M ----\nEXTENDS Integers\nVARIABLE c\nInit == c \\in 0..2\nNext == UNCHANGED c\nH == INSTANCE Hi WITH c <- 1 - c\nInv == H!Can\n====",
        config: "INIT Init\nNEXT Next\nINVARIANT Inv",
        maxSetSize,
        loadModule: (name) =>
          name === "Hi"
            ? "---- MODULE Hi ----\nEXTENDS Integers\nVARIABLE c\nA == LET k == c IN k' = k + 1 /\\ k' > k\nCan == ENABLED A\n===="
            : undefined,
      });
      expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
        "success",
        6,
        3,
      ]);
    },
  );

  it.each([
    [
      "A == c' = c + 1 /\\ UNCHANGED (LET k == <<d>> IN k)\nCan == ENABLED <<A>>_<<c, d>>",
      [
        "Line 10, column 9 to line 10, column 22 in M",
        "Line 10, column 9 to line 10, column 13 in M",
        "Line 10, column 18 to line 10, column 22 in M",
        "Line 13, column 8 to line 13, column 12 in M",
        "Line 12, column 1 to line 12, column 36 in M",
        "Line 8, column 8 to line 8, column 29 in M",
        "Line 8, column 16 to line 8, column 29 in M",
        "Line 8, column 18 to line 8, column 18 in M",
        "Line 7, column 6 to line 7, column 50 in M",
        "Line 7, column 6 to line 7, column 15 in M",
        "Line 7, column 20 to line 7, column 50 in M",
        "Line 7, column 31 to line 7, column 49 in M",
        "Line 7, column 49 to line 7, column 49 in M",
        "Line 7, column 40 to line 7, column 44 in M",
        "Line 7, column 42 to line 7, column 42 in M",
      ],
    ],
    [
      "hv == <<d>>\nA == c' = c + 1 /\\ UNCHANGED (LET k == hv IN k)\nCan == ENABLED <<A>>_<<c, d>>",
      [
        "Line 11, column 9 to line 11, column 22 in M",
        "Line 11, column 9 to line 11, column 13 in M",
        "Line 11, column 18 to line 11, column 22 in M",
        "Line 14, column 8 to line 14, column 12 in M",
        "Line 13, column 1 to line 13, column 36 in M",
        "Line 9, column 8 to line 9, column 29 in M",
        "Line 9, column 16 to line 9, column 29 in M",
        "Line 9, column 18 to line 9, column 18 in M",
        "Line 8, column 6 to line 8, column 47 in M",
        "Line 8, column 6 to line 8, column 15 in M",
        "Line 8, column 20 to line 8, column 47 in M",
        "Line 8, column 31 to line 8, column 46 in M",
        "Line 8, column 46 to line 8, column 46 in M",
        "Line 8, column 40 to line 8, column 41 in M",
        "Line 7, column 7 to line 7, column 11 in M",
        "Line 7, column 9 to line 7, column 9 in M",
      ],
    ],
  ])(
    "names the variable of an instance that its ENABLED leaves unassigned under UNCHANGED of a LET tuple, as TLC's Tool#enabledUnchanged evaluates it: %s",
    async (inner, callStack) => {
      const result = await checkInstancedEnabled(inner, "x", undefined, []);
      expect([
        result.failure?.message,
        result.failure?.exitCode,
        formatCallStackLines(result),
      ]).toEqual([
        "The action formula A appearing in a WF_v(A) or SF_v(A) operator does not specify the primed value of the variable d occurring in the state formula v.\n",
        75,
        callStack,
      ]);
    },
  );
});

const INNER_MODULES: Record<string, string> = {
  Stateful: "EXTENDS Naturals\nCONSTANT c, Op(_)\nVARIABLE v\nUse == Op(v) + c",
  Pure: "EXTENDS Naturals\nCONSTANT c, Op(_)\nUse == Op(c) + c",
  Primed: "EXTENDS Naturals\nCONSTANT c, Op(_)\nUse == Op(c)' + c",
  Vars: "EXTENDS Naturals\nVARIABLE v, w\nUse == v + w",
  Applied: "CONSTANT c, Op(_)\nUse == Op(c)",
  Assumed: "CONSTANT C, D\nASSUME C = {}\nTHEOREM ASSUME D PROVE TRUE",
  Nested: "EXTENDS Naturals\nCONSTANT c, Op(_)\nVARIABLE v\nUse == Op(v') /\\ c = 1",
  Twice: "CONSTANT c, Op(_, _)\nUse == Op(c, c)\nOther(d) == Op(d, c)",
  Passed: "CONSTANT c, Op(_)\nAp(F(_), a) == F(a)\nUse == Ap(Op, c)",
  Handed: "CONSTANT Op(_)\nVARIABLE v\nH(F(_)) == F(v')\nUse == H(Op)",
  Primes: "F(a) == LET G == a' IN G",
  Outer:
    "EXTENDS Naturals\nCONSTANT c\nN == INSTANCE Twice WITH c <- c, Op <- LAMBDA a, b : a + b\nUse == N!Use",
  Functions:
    "EXTENDS Naturals\nCONSTANT c\nf[i \\in {1}] == c + i\nRECURSIVE g(_)\ng(n) == IF n = 0 THEN c ELSE g(n - 1)",
};

const checkSubstitution = (body: string) =>
  check({
    source: `---- MODULE Main ----\nEXTENDS Naturals\nVARIABLE x\n${body}\nInit == x = 0\nNext == x' = x\n====`,
    config: "INIT Init\nNEXT Next",
    loadModule: (name) =>
      name in INNER_MODULES ? `---- MODULE ${name} ----\n${INNER_MODULES[name]}\n====` : undefined,
  });

const getLevelError = (module: string, name: string, level: number) =>
  `Level error in instantiating module '${module}':\nThe level of the expression or operator substituted for '${name}' \nmust be at most ${level}.`;

const getLeibnizError = (module: string) =>
  `Error in instantiating module '${module}':\n A non-Leibniz operator substituted for 'Op'.`;

const getArgumentError = (module: string, index: number, maximum: number) =>
  `Level error when instantiating module '${module}':\nThe level of the argument ${index} of the operator Op' \nmust be at most ${maximum}.`;

const getMessagePattern = (messages: string[]) =>
  new RegExp(
    `^${messages
      .map(
        (message) =>
          `line \\d+, col \\d+ to line \\d+, col \\d+ of module Main\\n\\n${message.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")}`,
      )
      .join("\\n\\n")}$`,
  );

describe("substitution levels match SANY", () => {
  it.each([
    [
      "I == INSTANCE Stateful WITH c <- 1, Op <- LAMBDA a : a + x, v <- x",
      [getLevelError("Stateful", "Op", 0)],
    ],
    [
      "I == INSTANCE Stateful WITH c <- x, Op <- LAMBDA a : a, v <- x",
      [getLevelError("Stateful", "c", 0)],
    ],
    [
      "I == INSTANCE Stateful WITH c <- x', Op <- LAMBDA a : a, v <- x",
      [getLevelError("Stateful", "c", 0)],
    ],
    [
      "INSTANCE Stateful WITH c <- x, Op <- LAMBDA a : a, v <- x",
      [getLevelError("Stateful", "c", 0)],
    ],
    [
      "F(a) == a + x\nI == INSTANCE Stateful WITH c <- 1, Op <- F, v <- x",
      [getLevelError("Stateful", "Op", 0)],
    ],
    ["I == INSTANCE Vars WITH v <- x', w <- x", [getLevelError("Vars", "v", 1)]],
    [
      "I == INSTANCE Vars WITH v <- [](x = 1), w <- x",
      [getLevelError("Vars", "v", 1), getLevelError("Vars", "v", 2)],
    ],
    [
      "I == INSTANCE Primed WITH c <- 1, Op <- LAMBDA a : a + x",
      [getLevelError("Primed", "Op", 0)],
    ],
    ["I == INSTANCE Pure WITH c <- [](x = 1), Op <- LAMBDA a : a", [getLevelError("Pure", "c", 2)]],
    ["I == INSTANCE Assumed WITH C <- [](x = 0), D <- TRUE", [getLevelError("Assumed", "C", 2)]],
    ["I == INSTANCE Assumed WITH C <- TRUE, D <- [](x = 0)", [getLevelError("Assumed", "D", 2)]],
    ["I == INSTANCE Outer WITH c <- [](x = 1)", [getLevelError("Outer", "c", 2)]],
    ["I == INSTANCE Functions WITH c <- [](x = 1)", [getLevelError("Functions", "c", 2)]],
    [
      "I == INSTANCE Applied WITH c <- [](x = 1), Op <- LAMBDA a : a + 1",
      [getArgumentError("Applied", 0, 2)],
    ],
    [
      "F(a) == LET G == a' IN G\nI == INSTANCE Applied WITH c <- [](x = 1), Op <- F",
      [getArgumentError("Applied", 0, 1)],
    ],
    [
      "I == INSTANCE Twice WITH c <- [](x = 1), Op <- LAMBDA a, b : a + b",
      [getArgumentError("Twice", 0, 2), getArgumentError("Twice", 1, 2)],
    ],
    [
      "F(a) == LET G == a' IN G\nI == INSTANCE Nested WITH c <- 1, Op <- F, v <- x",
      [
        getLevelError("Nested", "Op", 0),
        "Level error in instantiating module 'Nested':\nThe level of the argument 1 of the operator F \nmust be at least 2.",
      ],
    ],
    [
      "F(a) == LET G == a' IN G\nI == INSTANCE Passed WITH c <- x', Op <- F",
      [getArgumentError("Passed", 0, 1)],
    ],
    [
      "I == INSTANCE Passed WITH c <- [](x = 1), Op <- LAMBDA a : a + 1",
      [getArgumentError("Passed", 0, 2)],
    ],
    [
      "F(a) == LET G == a' IN G\nI == INSTANCE Handed WITH Op <- F, v <- x",
      [
        getLevelError("Handed", "Op", 0),
        "Level error in instantiating module 'Handed':\nThe level of the argument 1 of the operator F \nmust be at least 2.",
      ],
    ],
    [
      "Q == INSTANCE Primes\nI == INSTANCE Nested WITH c <- 1, Op <- Q!F, v <- x",
      [
        getLevelError("Nested", "Op", 0),
        "Level error in instantiating module 'Nested':\nThe level of the argument 1 of the operator Q!F \nmust be at least 2.",
      ],
    ],
    ...["'", "UNCHANGED"].map((operator): [string, string[]] => [
      `I == INSTANCE Nested WITH c <- 1, Op <- ${operator}, v <- x`,
      [
        getLevelError("Nested", "Op", 0),
        getLeibnizError("Nested"),
        `Level error in instantiating module 'Nested':\nThe level of the argument 1 of the operator ${operator} \nmust be at least 2.`,
      ],
    ]),
    [
      "Foo == LET I == INSTANCE Stateful WITH c <- x, Op <- LAMBDA a : a, v <- x IN I!Use",
      [getLevelError("Stateful", "c", 0)],
    ],
    [
      "Foo == LET k == x\n           I == INSTANCE Stateful WITH c <- k, Op <- LAMBDA a : a, v <- x IN I!Use",
      [getLevelError("Stateful", "c", 0)],
    ],
    [
      "Foo == LET k == x\n           j == k + 1\n           I == INSTANCE Stateful WITH c <- j, Op <- LAMBDA a : a, v <- x IN I!Use",
      [getLevelError("Stateful", "c", 0)],
    ],
    [
      "Foo == LET F(a) == a + x\n           I == INSTANCE Stateful WITH c <- 1, Op <- F, v <- x IN I!Use",
      [getLevelError("Stateful", "Op", 0)],
    ],
    [
      "Foo == LET F(a) == a'\n           I == INSTANCE Pure WITH c <- 1, Op <- F IN I!Use",
      [getLeibnizError("Pure")],
    ],
    ["F(a) == a'\nI == INSTANCE Pure WITH c <- 1, Op <- F", [getLeibnizError("Pure")]],
    ["I == INSTANCE Pure WITH c <- 1, Op <- LAMBDA a : ENABLED a", [getLeibnizError("Pure")]],
    ["I == INSTANCE Pure WITH c <- 1, Op <- LAMBDA a : UNCHANGED a", [getLeibnizError("Pure")]],
    [
      "I == INSTANCE Pure WITH c <- 1, Op <- LAMBDA a : [](a = 1)",
      [getLeibnizError("Pure"), getLevelError("Pure", "Op", 2)],
    ],
    [
      "G(b) == b'\nF(a) == G(a) + 1\nI == INSTANCE Pure WITH c <- 1, Op <- F",
      [getLeibnizError("Pure")],
    ],
    [
      "a ++ b == a' + b\nF(a) == a ++ 1\nI == INSTANCE Pure WITH c <- 1, Op <- F",
      [getLeibnizError("Pure")],
    ],
    [
      "F(a) == \\E k \\in {1} : a' = k\nI == INSTANCE Pure WITH c <- 1, Op <- F",
      [getLeibnizError("Pure")],
    ],
    ["F(a) == [a = 1]_a\nI == INSTANCE Pure WITH c <- 1, Op <- F", [getLeibnizError("Pure")]],
  ])("rejects %s", async (body, messages) => {
    await expect(checkSubstitution(body)).rejects.toThrow(TlaSyntaxError);
    await expect(checkSubstitution(body)).rejects.toThrow(getMessagePattern(messages));
  });

  it("reports an error at the whole instance, like SANY", async () => {
    const body = "I == INSTANCE Pure WITH c <- 1, Op <- LAMBDA a : ENABLED a";
    await expect(checkSubstitution(body)).rejects.toThrow(
      createSanyError([
        {
          location: `line 4, col 1 to line 4, col ${body.length} of module Main`,
          message: getLeibnizError("Pure"),
        },
      ]),
    );
  });

  it.each([
    "I == INSTANCE Stateful WITH c <- 1, Op <- LAMBDA a : a + 1, v <- x",
    "I == INSTANCE Pure WITH c <- x, Op <- LAMBDA a : a + x",
    "I == INSTANCE Pure WITH c <- x', Op <- LAMBDA a : a",
    "I == INSTANCE Vars WITH v <- ENABLED (x' = 1), w <- x",
    "I == INSTANCE Applied WITH c <- x', Op <- LAMBDA a : a + 1",
    "I == INSTANCE Applied WITH c <- [](x = 1), Op <- LAMBDA a : a",
    "I == INSTANCE Assumed WITH C <- x', D <- x'",
    "I == INSTANCE Outer WITH c <- x'",
    "I == INSTANCE Nested WITH c <- 1, Op <- LAMBDA a : a = 1, v <- x",
    "I == INSTANCE Twice WITH c <- [](x = 1), Op <- LAMBDA a, b : a",
    "P(k) == INSTANCE Stateful WITH c <- k, Op <- LAMBDA a : a + k, v <- x",
    "Foo == LET k == 1\n           I == INSTANCE Stateful WITH c <- k, Op <- LAMBDA a : a, v <- x IN I!Use",
    "Foo == \\E k \\in {1} : LET I == INSTANCE Stateful WITH c <- k, Op <- LAMBDA a : a, v <- x IN I!Use",
    "F(a) == x' + a\nI == INSTANCE Pure WITH c <- 1, Op <- F",
    "F(a) == LET G == a' IN G\nI == INSTANCE Pure WITH c <- 1, Op <- F",
    "F(a) == LET G == 1 IN a' + G\nI == INSTANCE Pure WITH c <- 1, Op <- F",
    "F(a) == LET G(b) == b' IN G(a)\nI == INSTANCE Pure WITH c <- 1, Op <- F",
    "H(K(_)) == K(1)\nF(a) == H(LAMBDA b : a') + 1\nI == INSTANCE Pure WITH c <- 1, Op <- F",
    "P(G(_)) == INSTANCE Pure WITH c <- 1, Op <- G\nF(a) == a'\nUse == P(F)!Use",
    "I == INSTANCE Passed WITH c <- x', Op <- LAMBDA a : a + 1",
    "I == INSTANCE Handed WITH Op <- LAMBDA a : a = 1, v <- x",
  ])("accepts %s", async (body) => {
    expect((await checkSubstitution(body)).status).toBe("success");
  });
});
