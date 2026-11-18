import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check, formatValue } from "../../src";
import { createSanyError } from "../../src/errors";
import { getModuleLoader } from "./check-harness";

const DIRECTORY = join(import.meta.dirname, "../fixtures/subexpressions");

const SOURCE = readFileSync(join(DIRECTORY, "Subexpressions.tla"), "utf8");

const checkSubexpressions = (source: string, configName: string) =>
  check({
    source,
    config: readFileSync(join(DIRECTORY, configName), "utf8"),
    loadModule: getModuleLoader("subexpressions"),
  });

describe("subexpression references match TLC", () => {
  it("selects operands, bound bodies, labels, LET definitions, and instance operators", async () => {
    const result = await checkSubexpressions(SOURCE, "Subexpressions.cfg");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([5, 4, 4]);
  });

  it("reports violations of labeled subexpressions", async () => {
    const result = await checkSubexpressions(SOURCE, "Violation.cfg");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.name).toBe("Broken");
    expect(result.violation?.trace).toHaveLength(4);
  });

  it("rejects an assumption whose selected operand differs", async () => {
    const source = SOURCE.replace("ASSUME A!Double(4)!1!<< = 4", "ASSUME A!Double(4)!1!<< = 8");
    expect((await checkSubexpressions(source, "Subexpressions.cfg")).status).toBe(
      "assumption-violation",
    );
  });

  it("selects an operand of a definition whose body is itself a selection", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nG(a) == a + 1\nH == 2 + 3\nF == G(1)!1\nE == H!1\nVARIABLE x\nInit == x = 0\nNext == x' = F!1 * 10 + E!1\nInv == x = 0\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    });
    expect(result.violation?.trace.map((step) => step.state)).toEqual([{ x: 0 }, { x: 12 }]);
  });

  it("selects an operand that contains a subexpression reference", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nQ == {5}\nP(y) == {y + 1}\nOp == {Q!1, Q!1 + 1}\nL == LET K == {5} IN {K!1, 2}\nN == LET K == {{7}} IN {K!1, 2}\nR(z) == {P(z)!1, Q!1 + z}\nVARIABLES a, b, c, d, e\nInit == a = 0 /\\ b = 0 /\\ c = 0 /\\ d = 0 /\\ e = 0\nNext == a' = Op!1 /\\ b' = Op!2 /\\ c' = L!1!1 /\\ d' = R(3)!1 + R(3)!2 /\\ e' = N!1!1!1!1\nInv == a = 0\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    });
    expect(result.violation?.trace.map((step) => step.state)).toEqual([
      { a: 0, b: 0, c: 0, d: 0, e: 0 },
      { a: 5, b: 6, c: 5, d: 12, e: 7 },
    ]);
  });

  it("selects an operand that contains a reference to an operand that contains a reference", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nR == {5}\nQ == {R!1 + 2}\nOp == {Q!1 + 1, 2}\nVARIABLE x\nInit == x = 0\nNext == x' = Op!1\nInv == x = 0\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    });
    expect(result.violation?.trace.map((step) => step.state)).toEqual([{ x: 0 }, { x: 8 }]);
  });

  it("selects through the LET that keeps a selection's or a substitution's definitions in scope", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\n---- MODULE Inner ----\nEXTENDS Naturals\nCONSTANT c\nA == {c + 1, 7}\n====\nJ(n) == INSTANCE Inner WITH c <- n + 1\nW == {5, 6}\nK == INSTANCE Inner WITH c <- W!1\nOp == LET a == 1 IN {a + 10, LET z == 2 IN z + 1}\nQ == Op!1!1\nR == Op!1!2\nVARIABLES u, v, w, y, t\nInit == u = 0 /\\ v = 0 /\\ w = 0 /\\ y = 0 /\\ t = 0\nNext == u' = Q!1!1 /\\ v' = Q!1!2 /\\ w' = R!1!z /\\ y' = J(4)!A!1 /\\ t' = K!A!1!1\nInv == u = 0\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    });
    expect(result.violation?.trace.map((step) => step.state)).toEqual([
      { u: 0, v: 0, w: 0, y: 0, t: 0 },
      { u: 1, v: 10, w: 2, y: 6, t: 5 },
    ]);
  });

  it("selects the operands of an infix junction as SANY nests them", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nOp == TRUE /\\ TRUE /\\ FALSE /\\ TRUE\nOr == FALSE \\/ TRUE \\/ FALSE\nVARIABLE x\nInit == x = <<>>\nNext == x' = <<Op!1, Op!1!1, Op!1!1!2, Op!2, Or!1>>\nInv == x = <<>>\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    });
    expect(result.violation?.trace.map((step) => formatValue(step.state.x))).toEqual([
      "<<>>",
      "<<FALSE, TRUE, TRUE, TRUE, TRUE>>",
    ]);
  });

  it("selects an argument of an operator constant that an instance sets to a LAMBDA", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\n---- MODULE Inner ----\nEXTENDS Naturals\nCONSTANT F(_)\nVal == {F(4)}\n====\nI == INSTANCE Inner WITH F <- LAMBDA y : y + 1\nVARIABLE x\nInit == x = 0\nNext == x' = I!Val!1!1\nInv == x = 0\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    });
    expect(result.violation?.trace.map((step) => step.state)).toEqual([{ x: 0 }, { x: 4 }]);
  });

  it("selects into the definitions of an instance inside a LET", async () => {
    const modules = new Map([
      [
        "Inner",
        "---- MODULE Inner ----\nEXTENDS Naturals\nF(a) == \\A y \\in {a} : y + a = 3\nG == {7, 8}\n====",
      ],
      [
        "Inner2",
        "---- MODULE Inner2 ----\nEXTENDS Naturals\nCONSTANT c\nH(a) == \\E y \\in {a} : y + c = 5\nK == {c, 9}\n====",
      ],
    ]);
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nB == <<LET L == INSTANCE Inner IN L!F(1)!(2), LET L == INSTANCE Inner IN L!G!2, LET L(p) == INSTANCE Inner2 WITH c <- p IN L(3)!H(1)!(2), LET L(p) == INSTANCE Inner2 WITH c <- p IN L(3)!K!1, LET L == INSTANCE Inner2 WITH c <- 4 IN L!K!1>>\nInit == x = <<>>\nNext == x' = B\nInv == x = <<>>\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      loadModule: (name) => modules.get(name),
    });
    expect(result.violation?.trace.map((step) => formatValue(step.state.x))).toEqual([
      "<<>>",
      "<<TRUE, 8, TRUE, 3, 4>>",
    ]);
  });

  it("passes on a selected LAMBDA that uses definitions of an enclosing LET", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nAp(G(_), v) == G(v)\nF(G(_)) == G(0)\nOp == LET W == 1 IN F(LAMBDA z : z + W)\nOp2(a) == LET W == a IN F(LAMBDA z : z + W)\nOp3 == LET W == 1 IN LET V == W + 1 IN F(LAMBDA z : z + V)\nOp6 == LET W == 1 IN F(LAMBDA z : LET U == z + W IN U)\nB == <<Ap(Op!1!1, 5), Ap(Op3!1!1!1, 5), Ap(Op6!1!1, 5), Op!1!1!(2), Op2(3)!1!1!(4)!1, Op2(3)!1!1!(4)>>\nInit == x = <<>>\nNext == x' = B\nInv == x = <<>>\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    });
    expect(result.violation?.trace.map((step) => formatValue(step.state.x))).toEqual([
      "<<>>",
      "<<6, 7, 6, 3, 4, 7>>",
    ]);
  });

  it("passes on a selected operator that an operator argument names", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nF(G(_)) == G(0)\nAp(G(_), v) == G(v)\nFoo(a) == a + 1\nOp == F(Foo)\nOp4 == F(-.)\nOp5 == LET L(b) == b * 2 IN F(L)\nInit == x = <<>>\nNext == x' = <<Ap(Op!1, 4), Ap(Op4!1, 3), Ap(Op5!1!1, 5)>>\nInv == x = <<>>\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    });
    expect(result.violation?.trace.map((step) => formatValue(step.state.x))).toEqual([
      "<<>>",
      "<<5, -3, 10>>",
    ]);
  });

  it("selects into a function definition as into its constructor", async () => {
    const inner =
      "---- MODULE Inner ----\nEXTENDS Naturals\nCONSTANT c\nh[z \\in {1, 2}] == z + c\n====";
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\ng[z \\in {1, 2}] == z + 1\nr[n \\in {0, 1}] == IF n = 0 THEN 0 ELSE r[n - 1] + 1\nm[a \\in {1}, b \\in {2, 3}] == a + b\nt[<<a, b>> \\in {<<1, 2>>}] == a + b\nlg[z \\in {1, 2}] == lab(z) :: z + 1\nL(p) == INSTANCE Inner WITH c <- p\nVARIABLE x\nInit == x = <<>>\nNext == x' = <<g!1, g!(1), r!1, r!(0)!1, m!2, m!(1, 3), t!1, t!(1, 2), lg!lab(2)!1, L(5)!h!1, LET K == INSTANCE Inner WITH c <- 3 IN K!h!(2)>>\nInv == x = <<>>\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      loadModule: (name) => (name === "Inner" ? inner : undefined),
    });
    expect(result.violation?.trace.map((step) => formatValue(step.state.x))).toEqual([
      "<<>>",
      "<<{1, 2}, 2, {0, 1}, TRUE, {2, 3}, 4, {<<1, 2>>}, 3, 2, {1, 2}, 5>>",
    ]);
  });

  it("selects into a recursive function that an instance copies as into its constructor", async () => {
    const inner =
      "---- MODULE Inner ----\nEXTENDS Naturals\nCONSTANT c\nr[n \\in {0, 1, 2}] == IF n = 0 THEN c ELSE r[n - 1] + 1\nlr[n \\in {0, 1}] == lab(n) :: IF n = 0 THEN c ELSE lr[n - 1] * 2\n====";
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nL(p) == INSTANCE Inner WITH c <- p\nInit == x = <<>>\nNext == x' = <<L(5)!r!1, L(5)!r!(1)!1, L(5)!r!(0), L(3)!lr!lab(1)!1, LET K == INSTANCE Inner WITH c <- 4 IN K!r!(0)>>\nInv == x = <<>>\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      loadModule: (name) => (name === "Inner" ? inner : undefined),
    });
    expect(result.violation?.trace.map((step) => formatValue(step.state.x))).toEqual([
      "<<>>",
      "<<{0, 1, 2}, FALSE, 5, FALSE, 4>>",
    ]);
  });

  it("selects a label through an instance whose operators the instancing module does not extend", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\n---- MODULE I ----\nEXTENDS Naturals\nL == l :: 2 + 3\n====\nJ == INSTANCE I\nVARIABLE x\nInit == x = 0\nNext == x' = J!L!l\nInv == x = 0\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    });
    expect(result.violation?.trace.map((step) => step.state)).toEqual([{ x: 0 }, { x: 5 }]);
  });

  it("selects an operand of a definition that selects a label through such an instance", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\n---- MODULE I ----\nEXTENDS Naturals\nL == l :: 2 + 3\n====\nJ == INSTANCE I\nQ == {J!L!l, 1}\nB == Q!1!1\nVARIABLE x\nInit == x = 0\nNext == x' = B\nInv == x = 0\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    });
    expect(result.violation?.trace.map((step) => step.state)).toEqual([{ x: 0 }, { x: 5 }]);
  });

  it("passes a selected LAMBDA on as an operator argument", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\n---- MODULE I ----\nEXTENDS Naturals\nUse(F(_), a) == F(a)\nOp == Use(LAMBDA x : x + 10, 1)\n====\nJ == INSTANCE I\nAp(F(_), a) == F(a)\nAp2(F(_, _), a, b) == F(a, b)\nOp == Ap(LAMBDA x : x = 1, 1)\nOp2 == Ap2(LAMBDA x, y : x + y, 1, 1)\nQ == Ap(Op!1, 2)\nR == Ap(Q!1, 3)\nQ2 == Ap2(Op2!1, 2, 2)\nL == LET G(H(_)) == Ap(H, 1) IN G(Op!1)\nVARIABLE v\nInit == v = <<>>\nNext == v' = <<Ap(Op!1, 1), Ap2(Op2!1, 3, 4), Q, R, Ap(R!1, 1), Ap2(Q2!1, 5, 6), L, Q!1!(5), Q!1!(1)!1, R!1!(7)!2, Op!1!(1)!1, J!Use(J!Op!1, 1), Ap(J!Op!1, 5), Q2!1!(2, 3)>>\nInv == v = <<>>\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    });
    expect(result.violation?.trace.map((step) => formatValue(step.state.v))).toEqual([
      "<<>>",
      "<<TRUE, 7, FALSE, FALSE, TRUE, 11, TRUE, FALSE, 1, 1, 1, 11, 15, 5>>",
    ]);
  });

  it("rejects a selected LAMBDA of the wrong arity as an operator argument, like SANY", async () => {
    await expect(
      check({
        source:
          "---- MODULE M ----\nAp(F(_), a) == F(a)\nAp2(F(_, _), a, b) == F(a, b)\nOp == Ap2(LAMBDA x, y : x = y, 1, 1)\nQ == Ap2(Op!1, 2, 2)\nTest == Ap(Op!1, 1) /\\ Ap(Q!1, 1)\nVARIABLE v\nInit == v = 0\nNext == v' = v\n====",
        config: "INIT Init\nNEXT Next",
      }),
    ).rejects.toThrow(
      createSanyError(
        [
          ["line 6, col 12 to line 6, col 15", "Expected arity 1 but found operator of arity 2."],
          [
            "line 6, col 9 to line 6, col 19",
            "Argument number 1 to operator 'Ap' \nshould be a 1-parameter operator.",
          ],
          ["line 6, col 27 to line 6, col 29", "Expected arity 1 but found operator of arity 2."],
          [
            "line 6, col 24 to line 6, col 33",
            "Argument number 1 to operator 'Ap' \nshould be a 1-parameter operator.",
          ],
        ].map((error) => ({ location: `${error[0]} of module M`, message: error[1] })),
      ),
    );
  });

  it("resolves a chain of selections from definitions that select twice in linear time", async () => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nD0 == {1}\n${Array.from(
        { length: 20 },
        (_value, index) => `D${index + 1} == {D${index}!1 + D${index}!1}`,
      ).join("\n")}\nVARIABLE x\nInit == x = 0\nNext == x' = x\n====`,
      config: "INIT Init\nNEXT Next",
    });
    expect(result.status).toBe("success");
  });

  it("resolves a chain of selections through operators with arguments in linear time", async () => {
    const result = await check({
      source: `---- MODULE M ----\nE1(p) == {p}\n${Array.from(
        { length: 29 },
        (_value, index) => `E${index + 2}(p) == E${index + 1}(p)!1`,
      ).join("\n")}\nVARIABLE x\nInit == x = 0\nNext == x' = x\n====`,
      config: "INIT Init\nNEXT Next",
    });
    expect(result.status).toBe("success");
  });
});

describe("subexpression references into theorems match SANY", () => {
  const SCOPE = "within the scope of a declaration\n from outside that declaration's scope.";

  const getSanyError = (errors: string[][], module: string) =>
    createSanyError(
      errors.map((error) => ({ location: `${error[0]} of module ${module}`, message: error[1] })),
    );

  const checkModule = (definitions: string) =>
    check({
      source: `---- MODULE M ----\nVARIABLE x\n${definitions}\nInit == x = 0\nNext == x' = x\n====`,
      config: "INIT Init\nNEXT Next",
    });

  it("reports every error SANY reports for test210", async () => {
    await expect(
      checkSubexpressions(readFileSync(join(DIRECTORY, "test210.tla"), "utf8"), "test210.cfg"),
    ).rejects.toThrow(
      getSanyError(
        [
          [
            "line 33, col 16 to line 33, col 19",
            `Accessing subexpression labeled \`laby' of ASSUME/PROVE clause ${SCOPE}`,
          ],
          ["line 35, col 16 to line 35, col 16", `Accessing ASSUME/PROVE clause ${SCOPE}`],
          [
            "line 42, col 41 to line 42, col 55",
            "Label not allowed within scope of declaration in nested ASSUME/PROVE.",
          ],
          [
            "line 43, col 30 to line 43, col 44",
            "Label not allowed within scope of declaration in nested ASSUME/PROVE.",
          ],
          [
            "line 55, col 16 to line 55, col 16",
            "Accessing non-existent subexpression of a SUFFICES",
          ],
          [
            "line 62, col 15 to line 62, col 18",
            `Accessing subexpression labeled \`laby' of ASSUME/PROVE clause ${SCOPE}`,
          ],
          [
            "line 63, col 15 to line 63, col 18",
            `Accessing subexpression labeled \`labi' of ASSUME/PROVE clause ${SCOPE}`,
          ],
          [
            "line 64, col 15 to line 64, col 18",
            `Accessing subexpression labeled \`labu' of ASSUME/PROVE clause ${SCOPE}`,
          ],
          ["line 65, col 15 to line 65, col 15", `Accessing ASSUME/PROVE clause ${SCOPE}`],
        ],
        "test210",
      ),
    );
  });

  it.each([
    [
      "a label or clause in the scope of a NEW, from outside the proof",
      "LEGAL == TRUE\nTHEOREM foo == ASSUME NEW v \\in labx :: LEGAL, labz :: LEGAL PROVE labu :: LEGAL\nBar == foo!labx /\\ foo!labz\nBaz == foo!1 /\\ foo!2",
      [
        [
          "line 5, col 24 to line 5, col 27",
          `Accessing subexpression labeled \`labz' of ASSUME/PROVE clause ${SCOPE}`,
        ],
        [
          "line 6, col 8 to line 6, col 12",
          "Selected a NEW declaration as an expression or operator.",
        ],
        ["line 6, col 21 to line 6, col 21", `Accessing ASSUME/PROVE clause ${SCOPE}`],
      ],
    ],
    [
      "a SUFFICES step, from within its proof and with a missing clause",
      "LEGAL == TRUE\nTHEOREM foo == ASSUME NEW v, lab :: LEGAL PROVE LEGAL\n<1>1. SUFFICES ASSUME NEW y, laba :: LEGAL PROVE LEGAL\n  <2>1. <1>1!laba /\\ <1>1!1!2\n  <2>2. QED\n<1>2. <1>1!laba /\\ <1>1!1!2 /\\ <1>1!1!3\n<1>3. SUFFICES LEGAL\n<1>4. <1>3!1\n<1>5. <1>3!2\n<1>6. <1>1!3\n<1>7. QED",
      [
        [
          "line 6, col 14 to line 6, col 17",
          `Accessing subexpression labeled \`laba' of ASSUME/PROVE clause ${SCOPE}`,
        ],
        ["line 6, col 29 to line 6, col 29", `Accessing ASSUME/PROVE clause ${SCOPE}`],
        [
          "line 11, col 12 to line 11, col 12",
          "Nonexistent operand specified by `argument selector 2'.",
        ],
        [
          "line 12, col 12 to line 12, col 12",
          "Accessing non-existent subexpression of a SUFFICES",
        ],
      ],
    ],
    [
      "facts that select clauses and labels in the scope of a NEW",
      "LEGAL == TRUE\nTHEOREM foo == ASSUME NEW v, lab :: LEGAL, ASSUME NEW y PROVE LEGAL PROVE LEGAL\nTHEOREM TRUE\nBY foo!2, foo!1, foo!3, foo!lab, foo!4\nTHEOREM TRUE\nBY foo!3!1, foo!3!2\nUSE foo!lab",
      [
        ["line 6, col 8 to line 6, col 8", `Accessing ASSUME/PROVE clause ${SCOPE}`],
        ["line 6, col 22 to line 6, col 22", `Accessing ASSUME/PROVE clause ${SCOPE}`],
        [
          "line 6, col 29 to line 6, col 31",
          `Accessing subexpression labeled \`lab' of ASSUME/PROVE clause ${SCOPE}`,
        ],
        ["line 6, col 38 to line 6, col 38", `Accessing ASSUME/PROVE clause ${SCOPE}`],
        ["line 8, col 8 to line 8, col 8", `Accessing ASSUME/PROVE clause ${SCOPE}`],
        ["line 8, col 17 to line 8, col 17", `Accessing ASSUME/PROVE clause ${SCOPE}`],
        [
          "line 9, col 9 to line 9, col 11",
          `Accessing subexpression labeled \`lab' of ASSUME/PROVE clause ${SCOPE}`,
        ],
      ],
    ],
    [
      "a NEW declaration, an ASSUME/PROVE, and a missing operand or label",
      "LEGAL == TRUE\nTHEOREM foo == ASSUME LEGAL, ASSUME NEW y, LEGAL PROVE LEGAL PROVE LEGAL\nA == foo!2!2\nB == foo!2\nC == foo!2!3!1\nD == foo!4\nTHEOREM bar == ASSUME NEW v, LEGAL PROVE LEGAL\nE == bar!1!1\nF == bar!3\nG == bar!nolab",
      [
        ["line 5, col 12 to line 5, col 12", `Accessing ASSUME/PROVE clause ${SCOPE}`],
        ["line 6, col 6 to line 6, col 10", "Selected ASSUME/PROVE instead of expression."],
        ["line 7, col 12 to line 7, col 12", `Accessing ASSUME/PROVE clause ${SCOPE}`],
        [
          "line 8, col 10 to line 8, col 10",
          "Nonexistent operand specified by `argument selector 4'.",
        ],
        [
          "line 10, col 10 to line 10, col 10",
          "Selected a subexpression of a NEW clause of an ASSUME.",
        ],
        ["line 11, col 10 to line 11, col 10", `Accessing ASSUME/PROVE clause ${SCOPE}`],
        ["line 12, col 10 to line 12, col 14", "Cannot find label `nolab'."],
      ],
    ],
    [
      "labels outside a definition, a named theorem, or a numbered step",
      "LEGAL == TRUE\nTHEOREM foo == ASSUME LEGAL, ASSUME NEW v, l1 :: v PROVE l2 :: v PROVE LEGAL\nTHEOREM ASSUME NEW y, ASSUME LEGAL, ASSUME NEW v PROVE l3 :: v PROVE l4 :: LEGAL PROVE LEGAL\nBaz == foo!l1\nTHEOREM le :: TRUE\nTHEOREM LET G == lf :: TRUE IN lg :: G\nUSE li :: TRUE\nTHEOREM TRUE\n<1>1. TRUE\n  <2>1. TRUE BY lj :: TRUE\n  <2>2. QED\n<1>2. HAVE lk :: TRUE\n<1> HAVE ll :: TRUE\n<1> DEFINE H == ln :: TRUE\n<1>3. QED",
      [
        [
          "line 4, col 44 to line 4, col 50",
          "Label not allowed within scope of declaration in nested ASSUME/PROVE.",
        ],
        [
          "line 4, col 58 to line 4, col 64",
          "Label not allowed within scope of declaration in nested ASSUME/PROVE.",
        ],
        ["line 5, col 56 to line 5, col 62", "Label not in definition or proof step."],
        ["line 5, col 70 to line 5, col 80", "Label not in definition or proof step."],
        ["line 6, col 12 to line 6, col 13", "Cannot find label `l1'."],
        ["line 7, col 9 to line 7, col 18", "Label not in definition or proof step."],
        ["line 8, col 32 to line 8, col 38", "Label not in definition or proof step."],
        ["line 9, col 5 to line 9, col 14", "Label not in definition or proof step."],
        ["line 12, col 17 to line 12, col 26", "Label not in definition or proof step."],
        ["line 15, col 10 to line 15, col 19", "Label not in definition or proof step."],
      ],
    ],
    [
      "names that select labels of definitions with the wrong arguments",
      "Op(a) == lab :: a\nOp2(a, b) == lab2 :: a\nTHEOREM thm == lt :: TRUE\nA1 == Op(1)!lab /\\ Op!lab(A) /\\ Op!lab /\\ B\nA2 == Op2(1)!lab2(C) /\\ thm!lt /\\ thm!nolab /\\ D\nA3 == LET L(y) == m :: y IN L!m /\\ E\nA4 == Op(F)!nolab /\\ Op(1)!lab(G) /\\ H",
      [
        ["line 6, col 20 to line 6, col 28", "The operator Op requires 1 arguments."],
        ["line 6, col 33 to line 6, col 38", "The operator Op requires 1 arguments."],
        ["line 6, col 43 to line 6, col 43", "Unknown operator: `B'."],
        ["line 7, col 10 to line 7, col 12", "The operator Op2 requires 2 arguments."],
        ["line 7, col 39 to line 7, col 43", "Cannot find label `nolab'."],
        ["line 7, col 48 to line 7, col 48", "Unknown operator: `D'."],
        ["line 8, col 29 to line 8, col 31", "The operator L requires 1 arguments."],
        ["line 8, col 36 to line 8, col 36", "Unknown operator: `E'."],
        ["line 9, col 10 to line 9, col 10", "Unknown operator: `F'."],
        ["line 9, col 13 to line 9, col 17", "Cannot find label `nolab'."],
        ["line 9, col 28 to line 9, col 30", "Label `lab' used with wrong number of arguments."],
        ["line 9, col 38 to line 9, col 38", "Unknown operator: `H'."],
      ],
    ],
    [
      "names that select labels of definitions in theorems, proofs, and facts",
      "Op(a) == lab :: a = 1\nOp3(a) == \\E y \\in {a} : lab3(y) :: y = a\nTHEOREM Op!lab(A) /\\ B\nTHEOREM ASSUME Op(1)!nolab PROVE Op3(1)!lab3 /\\ C\nUSE Op!lab, D\nTHEOREM TRUE\n<1>1. Op(1)!nolab /\\ E\n<1>2. PICK y \\in {Op!lab} : Op(y)!nolab\n<1> QED BY Op(1)!lab, Op(2)!nolab, F",
      [
        ["line 5, col 9 to line 5, col 17", "The operator Op requires 1 arguments."],
        ["line 5, col 22 to line 5, col 22", "Unknown operator: `B'."],
        ["line 6, col 22 to line 6, col 26", "Cannot find label `nolab'."],
        ["line 6, col 41 to line 6, col 44", "Label `lab3' used with wrong number of arguments."],
        ["line 6, col 49 to line 6, col 49", "Unknown operator: `C'."],
        ["line 7, col 5 to line 7, col 10", "The operator Op requires 1 arguments."],
        ["line 7, col 13 to line 7, col 13", "Unknown operator: `D'."],
        ["line 9, col 13 to line 9, col 17", "Cannot find label `nolab'."],
        ["line 9, col 22 to line 9, col 22", "Unknown operator: `E'."],
        ["line 10, col 19 to line 10, col 24", "The operator Op requires 1 arguments."],
        ["line 10, col 35 to line 10, col 39", "Cannot find label `nolab'."],
        ["line 11, col 29 to line 11, col 33", "Cannot find label `nolab'."],
        ["line 11, col 36 to line 11, col 36", "Unknown operator: `F'."],
      ],
    ],
    [
      "labels whose parameters differ from the names bound around them",
      "C == 1\nA1 == \\A y \\in {1} : lab(y, y) :: y = 1\nA2 == \\A y, z \\in {1} : lab(y) :: y = z\nA3 == \\A y \\in {1} : lab(C) :: y = 1\nA4 == [x EXCEPT ![1] = lab :: 2]\nA5 == CHOOSE y : lab :: y = 1\nA6 == (lab :: TRUE) /\\ (lab :: FALSE)\nTHEOREM foo == ASSUME NEW v, lab(y) :: y = v PROVE TRUE",
      [
        ["line 4, col 22 to line 4, col 39", "Repeated formal parameter y \nin label `lab'."],
        ["line 5, col 25 to line 5, col 39", "Label lab must contain formal parameter `z'."],
        ["line 6, col 26 to line 6, col 26", "Illegal parameter C of label `lab'."],
        ["line 6, col 22 to line 6, col 36", "Label lab must contain formal parameter `y'."],
        ["line 6, col 22 to line 6, col 36", "Label lab declares extra parameter(s)  C  "],
        [
          "line 7, col 24 to line 7, col 31",
          "Labels inside EXCEPT clauses are not yet implemented.",
        ],
        ["line 8, col 18 to line 8, col 29", "Label lab must contain formal parameter `y'."],
        ["line 9, col 25 to line 9, col 36", "Duplicate label `lab'."],
        ["line 10, col 40 to line 10, col 40", "Unknown operator: `y'."],
        ["line 10, col 34 to line 10, col 34", "Illegal parameter y of label `lab'."],
        ["line 10, col 30 to line 10, col 44", "Label lab declares extra parameter(s)  y  "],
      ],
    ],
    [
      "labels in an unnamed assumption or an INSTANCE substitution",
      "---- MODULE Inner ----\nCONSTANT c\n====\nOp(a) == lab :: (in :: a)\nASSUME la :: TRUE\nASSUME named == lb :: TRUE\nASSUME Op(1)!lab = 1 /\\ Op(1)!lab!in = 1\nI == INSTANCE Inner WITH c <- lc :: 1",
      [
        ["line 7, col 8 to line 7, col 17", "Label not in definition or proof step."],
        ["line 10, col 31 to line 10, col 37", "Label not in definition or proof step."],
      ],
    ],
    [
      "facts naming nothing and step names selecting missing operands or labels",
      "THEOREM thm == ASSUME NEW a PROVE a = a\nTHEOREM TRUE\n<1>1. TRUE BY D, thm\n<1>2. lab2 :: TRUE\n<1>3. lab3 :: \\A b \\in {1} : in3(b) :: b = 1\n<1>4. <1>2!1 /\\ <1>3!lab3!in3 /\\ <1>3!lab3!2 /\\ <1>3!1!in3 /\\ <1>3!lab3!in3(1)\n<1> USE E\n<1>5. QED",
      [
        ["line 5, col 15 to line 5, col 15", "Unknown operator: `D'."],
        [
          "line 8, col 12 to line 8, col 12",
          "Nonexistent operand specified by `argument selector 1'.",
        ],
        ["line 8, col 27 to line 8, col 29", "Label `in3' used with wrong number of arguments."],
        [
          "line 8, col 44 to line 8, col 44",
          "Nonexistent operand specified by `argument selector 2'.",
        ],
        ["line 8, col 54 to line 8, col 54", "A name selector here must be from a LET clause."],
        ["line 9, col 9 to line 9, col 9", "Unknown operator: `E'."],
      ],
    ],
    [
      "selections of definitions whose bodies are selections",
      "G(a, b) == <<a, b>>\nH == {2, 3}\nF == G(1, 2)!1\nE == H!1\nN == F!3\nP == E!2\nQ == E!1!1\nR == F!2!1\nS == G(1, 2)!7\nT == S!1",
      [
        [
          "line 7, col 8 to line 7, col 8",
          "Nonexistent operand specified by `argument selector 3'.",
        ],
        [
          "line 8, col 8 to line 8, col 8",
          "Nonexistent operand specified by `argument selector 2'.",
        ],
        [
          "line 9, col 10 to line 9, col 10",
          "Selecting subexpression of expression that has none.",
        ],
        [
          "line 10, col 10 to line 10, col 10",
          "Selecting subexpression of expression that has none.",
        ],
        [
          "line 11, col 14 to line 11, col 14",
          "Nonexistent operand specified by `argument selector 7'.",
        ],
        [
          "line 12, col 8 to line 12, col 8",
          "Choosing operand `argument selector 1' of subexpression with no operands.",
        ],
      ],
    ],
    [
      "selectors that a LET, a CASE or an expression without bound identifiers lacks",
      "Op1(a, b) == <<a, b>>\nL == LET q == 1 IN <<q, 1>>\nC == CASE x = 1 -> 2 [] OTHER -> 3\nQ == \\A y \\in {1} : y = 1\nN == 7\nA1 == Op1(1, 2)!@ /\\ L!2 /\\ L!@ /\\ C!1 /\\ C!3!1 /\\ C!1!3 /\\ C!2!1\nA2 == C!@!1 /\\ N!@ /\\ Op1(1, 2)!(3) /\\ C!1!@ /\\ Q!@ /\\ L!1!@",
      [
        ["line 8, col 17 to line 8, col 17", "Nonexistent operand specified by `@'."],
        ["line 8, col 24 to line 8, col 24", "A LET/IN expression has only one operand."],
        ["line 8, col 31 to line 8, col 31", "A LET/IN expression has only one operand."],
        ["line 8, col 38 to line 8, col 38", "Subexpression of CASE must have form !i!j."],
        [
          "line 8, col 45 to line 8, col 45",
          "Nonexistent operand specified by `argument selector 3'.",
        ],
        [
          "line 8, col 56 to line 8, col 56",
          "Second selector for CASE subexpression must specify  one of two operands.",
        ],
        ["line 8, col 65 to line 8, col 65", "Selecting OTHER in a CASE statement."],
        ["line 9, col 9 to line 9, col 9", "Nonexistent operand specified by `@'."],
        [
          "line 9, col 18 to line 9, col 18",
          "Selecting subexpression of expression that has none.",
        ],
        ["line 9, col 33 to line 9, col 35", "Nonexistent operand specified by `!(...)'."],
        [
          "line 9, col 44 to line 9, col 44",
          "Second selector for CASE subexpression must specify  one of two operands.",
        ],
        ["line 9, col 49 to line 9, col 51", "Expected 1 arguments but found 0."],
        ["line 9, col 60 to line 9, col 60", "Nonexistent operand specified by `@'."],
      ],
    ],
    [
      "the arguments of a selection that fails, against the parameters they fill",
      "Op1(a0, P1(_)) == TRUE\nOp0(P0(_, _)) == 1\nA == Op1(LAMBDA p : p, {zz})!@\nB == Op0(LAMBDA p : p)!1\nC == Op1(Op0, Op0)!2",
      [
        [
          "line 5, col 10 to line 5, col 21",
          "LAMBDA expression used where an expression is required.",
        ],
        [
          "line 5, col 24 to line 5, col 27",
          "An expression appears as argument number 2 (counting from 1) to operator 'Op1', in a position an operator is required.",
        ],
        ["line 5, col 30 to line 5, col 30", "Nonexistent operand specified by `@'."],
        [
          "line 6, col 6 to line 6, col 8",
          "Lambda expression with arity 1 used as argument 1 of operator `Op0', \nbut an operator of arity 2 is required.",
        ],
        [
          "line 6, col 24 to line 6, col 24",
          "Selecting subexpression of expression that has none.",
        ],
        ["line 7, col 10 to line 7, col 12", "The operator Op0 requires 1 arguments."],
        [
          "line 7, col 20 to line 7, col 20",
          "Nonexistent operand specified by `argument selector 2'.",
        ],
      ],
    ],
    [
      "a third operand of an infix junction",
      "A == TRUE /\\ FALSE /\\ TRUE\nB == A!3\nC == A!1!3",
      [
        [
          "line 4, col 8 to line 4, col 8",
          "Nonexistent operand specified by `argument selector 3'.",
        ],
        [
          "line 5, col 10 to line 5, col 10",
          "Nonexistent operand specified by `argument selector 3'.",
        ],
      ],
    ],
    [
      "selectors past a selected LET definition",
      "Op == LET A == {1} IN {A, 2}\nB == Op!1!1\nD == B!1!1\nE == B!1!A\nF == Op!:!A\nG == F!1",
      [
        [
          "line 5, col 10 to line 5, col 10",
          "Nonexistent operand specified by `argument selector 1'.",
        ],
        ["line 6, col 8 to line 6, col 8", "A name selector here must be from a LET clause."],
        [
          "line 8, col 8 to line 8, col 8",
          "Nonexistent operand specified by `argument selector 1'.",
        ],
      ],
    ],
    [
      "a selected LAMBDA where an expression is expected",
      "F(G(_)) == G(0)\nOp == F(LAMBDA z : z = 1)\nOp2(a) == F(LAMBDA z : z = a)\nQ == Op!1\nR == {Op!1, Op2(1)!1}",
      [
        ["line 6, col 6 to line 6, col 9", "Selected operator argument when expression expected."],
        ["line 7, col 7 to line 7, col 10", "Selected operator argument when expression expected."],
        [
          "line 7, col 13 to line 7, col 20",
          "Selected operator argument when expression expected.",
        ],
      ],
    ],
    [
      "a selected operator that an operator argument names",
      "F(G(_)) == G(0)\nFoo(a) == a\nOp == F(Foo)\nQ == Op!1\nA == Op!1!(4)\nB == Op!1!1\nAp2(G(_, _), v) == G(v, v)\nR == Ap2(Op!1, 4)\nOp2(H(_)) == F(H)\nS == Op2(Foo)!1",
      [
        ["line 6, col 6 to line 6, col 9", "Selected operator argument when expression expected."],
        [
          "line 7, col 11 to line 7, col 13",
          "Trying to select subexpression of an operator argument.",
        ],
        [
          "line 8, col 11 to line 8, col 11",
          "Trying to select subexpression of an operator argument.",
        ],
        ["line 10, col 10 to line 10, col 13", "Expected arity 2 but found operator of arity 1."],
        [
          "line 10, col 6 to line 10, col 17",
          "Argument number 1 to operator 'Ap2' \nshould be a 2-parameter operator.",
        ],
        [
          "line 12, col 6 to line 12, col 15",
          "Selected operator argument when expression expected.",
        ],
      ],
    ],
    [
      "selectors into a LAMBDA, naming a numbered selector by its number where SANY names its syntax node",
      "F(G(_)) == G(0)\nOp == F(LAMBDA z : z = 1)\nC == Op!1!1\nD == Op!1!(1, 2)\nE == Op!1!<<\nH == Op!1!(1) /\\ Op!1!@",
      [
        ["line 5, col 11 to line 5, col 11", "Cannot use !1 to select subexpression of a LAMBDA."],
        [
          "line 6, col 11 to line 6, col 16",
          "Selector with 2 arguments used for LAMBDA expression taking 1 arguments.",
        ],
        ["line 7, col 11 to line 7, col 12", "Cannot use !<< to select subexpression of a LAMBDA."],
        ["line 8, col 18 to line 8, col 23", "Expected 1 arguments but found 0."],
      ],
    ],
    [
      "@ and !(...) selectors of steps and theorems",
      "THEOREM T == ASSUME NEW n PROVE n = n\nTHEOREM U == \\A y \\in {1} : y = 1\nTHEOREM TRUE\n<1>1. SUFFICES TRUE\n<1>2. TRUE # 0\n  <2>1. <1>1!@ /\\ <1>2!@ /\\ <1>2!(1) /\\ T!@ /\\ T!2!@ /\\ U!@ /\\ U!(1)\n  <2>2. QED\n<1>3. QED",
      [
        ["line 8, col 14 to line 8, col 14", "Nonexistent operand specified by `@'."],
        ["line 8, col 24 to line 8, col 24", "Nonexistent operand specified by `@'."],
        ["line 8, col 34 to line 8, col 36", "Nonexistent operand specified by `!(...)'."],
        ["line 8, col 43 to line 8, col 43", "Nonexistent operand specified by `@'."],
        ["line 8, col 50 to line 8, col 50", `Accessing ASSUME/PROVE clause ${SCOPE}`],
        ["line 8, col 57 to line 8, col 59", "Expected 1 arguments but found 0."],
      ],
    ],
  ])("reports every error SANY reports for %s", async (_name, definitions, errors) => {
    await expect(checkModule(definitions)).rejects.toThrow(getSanyError(errors, "M"));
  });

  it("accepts the references SANY accepts", async () => {
    const result = await checkModule(
      "LEGAL == TRUE\nTHEOREM foo == ASSUME LEGAL, lab :: LEGAL, ASSUME LEGAL PROVE labi :: LEGAL PROVE lab2 :: LEGAL\nBar == foo!lab /\\ foo!1 /\\ foo!2 /\\ foo!4 /\\ foo!lab2 /\\ foo!labi /\\ foo!3!1 /\\ foo!3!2 /\\ foo!<<\nTHEOREM bar == ASSUME NEW v, lv :: v = v, ASSUME NEW w PROVE w = w PROVE LEGAL\n<1>1. bar!lv /\\ bar!2 /\\ bar!4\n<1>2. ASSUME NEW z, lz :: z = 1 PROVE TRUE\n  <2>1. ASSUME NEW w PROVE <1>2!lz /\\ <1>2!2\n    <3>1. <2>1!2 /\\ <1>2!lz\n    <3>2. QED\n  <2>2. QED BY <1>2!1, <1>2!2, <2>1!1\n<1>3. SUFFICES ASSUME NEW q, lq :: q = q PROVE LEGAL\n<1>4. <1>3!lq /\\ <1>3!1!2 /\\ <1>3!<<!2\n<1>5. QED BY bar!1, bar!3",
    );
    expect(result.status).toBe("success");
  });
});
