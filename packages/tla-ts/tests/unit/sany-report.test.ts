import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vite-plus/test";
import { getSanyModuleName, getSanyReport, type SanyReportOptions } from "../../src/sany/report";

const directories: string[] = [];

afterAll(() => directories.forEach((directory) => rmSync(directory, { recursive: true })));

const getReport = (modules: Record<string, string>, options?: SanyReportOptions) => {
  const directory = mkdtempSync(join(tmpdir(), "sany-report-"));
  directories.push(directory);
  Object.entries(modules).forEach(([name, source]) =>
    writeFileSync(join(directory, `${name}.tla`), source),
  );
  const report = getSanyReport(
    join(directory, `${Object.keys(modules)[0]}.tla`),
    (name) => (name in modules ? readFileSync(join(directory, `${name}.tla`), "utf8") : undefined),
    options,
  );
  return { text: report.text, isFailed: report.isFailed };
};

const joinLines = (lines: string[]) => lines.map((line) => `${line}\n`).join("");

describe("getSanyReport", () => {
  it("reports nothing for a specification SANY accepts", () => {
    const report = getReport({
      Fine: `---- MODULE Fine ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = x + 1
Spec == Init /\\ [][Next]_x
====
`,
    });
    expect(report).toEqual({ text: "", isFailed: false });
  });

  it("reports the prime standing alone as an operator that needs an argument", () => {
    const report = getReport({
      M: "---- MODULE M ----\nEXTENDS Naturals\nf == {'} /\\ <<', 1>> /\\ 1 + ' = 2 /\\ '(1, 2) /\\ ''\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 5",
        "",
        ...[
          "line 3, col 7 to line 3, col 7",
          "line 3, col 15 to line 3, col 15",
          "line 3, col 29 to line 3, col 29",
          "line 3, col 39 to line 3, col 44",
          "line 3, col 49 to line 3, col 49",
        ].flatMap((range) => [
          `${range} of module M`,
          "",
          "The operator ' requires 1 arguments.",
          "",
          "",
        ]),
      ]),
    );
  });

  it("reports a selector after an operator symbol as SANY does", () => {
    const report = getReport({
      M: "---- MODULE M ----\nf == '!x /\\ ^#!x /\\ \\cup!x /\\ -.!x /\\ ^+!x /\\ ^#(1)!x /\\ \\union!1 /\\ '(1)!1 /\\ \\X!1\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 9",
        "",
        ...[
          ["line 2, col 6 to line 2, col 6", "Cannot take subexpression of `''."],
          ["line 2, col 13 to line 2, col 16", "Unknown operator: `^#!x'."],
          ["line 2, col 21 to line 2, col 24", "Cannot take subexpression of `\\union'."],
          ["line 2, col 31 to line 2, col 34", "Unknown operator: `-.!x'."],
          ["line 2, col 39 to line 2, col 42", "Unknown operator: `^+!x'."],
          ["line 2, col 47 to line 2, col 53", "Unknown operator: `^#!x'."],
          ["line 2, col 58 to line 2, col 63", "Cannot take subexpression of `\\union'."],
          ["line 2, col 70 to line 2, col 70", "Cannot take subexpression of `''."],
          ["line 2, col 80 to line 2, col 81", "Cannot take subexpression of `\\times'."],
        ].flatMap((error) => [`${error[0]} of module M`, "", error[1], "", ""]),
      ]),
    );
  });

  it("reports a selection into an expression that failed to resolve as SANY does", () => {
    const report = getReport({
      M: "---- MODULE M ----\nVARIABLE x\nOp(a) == a + zz\nV == x\nS(a) == {zz + 1}\nC == CASE TRUE -> zz + 1\nf == Op(2)!1 /\\ V!1 /\\ S(2)!1 /\\ Op(2)!: /\\ C!1!2 /\\ Op(2)!<<\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 12",
        "",
        ...[
          [
            "line 3, col 12 to line 3, col 12",
            "Could not find declaration or definition of symbol '+'.",
          ],
          ["line 3, col 10 to line 3, col 15", "Couldn't resolve infix operator symbol `+'."],
          [
            "line 5, col 13 to line 5, col 13",
            "Could not find declaration or definition of symbol '+'.",
          ],
          ["line 5, col 10 to line 5, col 15", "Couldn't resolve infix operator symbol `+'."],
          [
            "line 6, col 22 to line 6, col 22",
            "Could not find declaration or definition of symbol '+'.",
          ],
          ["line 6, col 19 to line 6, col 24", "Couldn't resolve infix operator symbol `+'."],
          [
            "line 7, col 12 to line 7, col 12",
            "Subexpression selection failed, probably due to an error in the selected expression.",
          ],
          [
            "line 7, col 19 to line 7, col 19",
            "Choosing operand `argument selector 1' of subexpression with no operands.",
          ],
          [
            "line 7, col 29 to line 7, col 29",
            "An unexpected null node specified by 'argument selector 1'.\nThis is probably due to a previous error.",
          ],
          [
            "line 7, col 40 to line 7, col 40",
            "An unexpected null node specified by ':'.\nThis is probably due to a previous error.",
          ],
          ["line 7, col 49 to line 7, col 49", "Selecting OTHER in a CASE statement."],
          [
            "line 7, col 60 to line 7, col 61",
            "Subexpression selection failed, probably due to an error in the selected expression.",
          ],
        ].flatMap((error) => [`${error[0]} of module M`, "", error[1], "", ""]),
      ]),
    );
  });

  it("reports a selection into a definition whose own selection failed as SANY does", () => {
    const report = getReport({
      M: "---- MODULE M ----\nEXTENDS Naturals\nG(a) == a + 1\nF == G(1)!7\nK == F!1\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        ...[
          [
            "line 4, col 11 to line 4, col 11",
            "Nonexistent operand specified by `argument selector 7'.",
          ],
          [
            "line 5, col 8 to line 5, col 8",
            "Choosing operand `argument selector 1' of subexpression with no operands.",
          ],
        ].flatMap((error) => [`${error[0]} of module M`, "", error[1], "", ""]),
      ]),
    );
  });

  it("reports an @ fact as an unknown operator as SANY does", () => {
    const report = getReport({ M: "---- MODULE M ----\nUSE @\nTHEOREM TRUE\nBY @\n====\n" });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        ...["line 2, col 5 to line 2, col 5", "line 4, col 4 to line 4, col 4"].flatMap((range) => [
          `${range} of module M`,
          "",
          "Unknown operator: `@'.",
          "",
          "",
        ]),
      ]),
    );
  });

  it("ends a line at a lone CR as SANY does", () => {
    const report = getReport({
      M: "---- MODULE M ----\rVARIABLE x\rA == y\rB ==\r  /\\ x = 1\r  /\\ z\r====\r",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        ...[
          ["line 3, col 6 to line 3, col 6", "y"],
          ["line 6, col 6 to line 6, col 6", "z"],
        ].flatMap((error) => [
          `${error[0]} of module M`,
          "",
          `Unknown operator: \`${error[1]}'.`,
          "",
          "",
        ]),
      ]),
    );
  });

  it("passes an operator whose definition has fewer parameters than its RECURSIVE declaration, where SANY crashes", () => {
    const report = getReport({
      M: "---- MODULE M ----\nRECURSIVE R(_, _)\nR == 1\nL(P(_, _)) == 1\nA == L(R)\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 1",
        "",
        "line 3, col 1 to line 3, col 6 of module M",
        "",
        "Definition of R has different arity than its RECURSIVE declaration.",
        "",
        "",
      ]),
    );
  });

  it("declares the operator symbols of a LET's RECURSIVE statements, as SANY does", () => {
    const report = getReport({
      M: "---- MODULE M ----\nR ==\n  LET\n    RECURSIVE _**_\n    x ** y == x ** y\n    RECURSIVE _^#\n    x^# == x^#\n  IN 1 ** 2\nS == LET RECURSIVE _++_ IN 1\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 1",
        "",
        "line 9, col 20 to line 9, col 23 of module M",
        "",
        "Symbol ++ declared in RECURSIVE statement but not defined.",
        "",
        "",
      ]),
    );
  });

  it("rejects an argument above the level that the operator parameter it reaches through a definition permits, where SANY drops the constraint", () => {
    const report = getReport({
      M: "---- MODULE M ----\nVARIABLE x\nPr(p) == p'\nW(Op(_)) == LET D(p) == Op(p) IN D(x')\nV == W(Pr)\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 1",
        "",
        "line 5, col 6 to line 5, col 10 of module M",
        "",
        "Level error in applying operator W:",
        "The permitted level of argument 1 of the operator argument 1 ",
        "must be at least 2.",
        "",
        "",
      ]),
    );
  });

  it("rejects a non-Leibniz operator substituted for an operator constant under a LET, which SANY accepts", () => {
    const report = getReport({
      M: "---- MODULE M ----\nVARIABLE x\nF(a) == LET L == 1 IN ENABLED (x' = a)\n---- MODULE Inner ----\nCONSTANT c\nVARIABLE w\nD == LET L == 1 IN ENABLED (w' = c)\n====\n---- MODULE Other ----\nCONSTANT Op(_)\n====\nJ(q) == INSTANCE Inner WITH c <- q, w <- x\nINSTANCE Other WITH Op <- F\nINSTANCE Other WITH Op <- J!D\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        "line 13, col 1 to line 13, col 27 of module M",
        "",
        "Error in instantiating module 'Other':",
        " A non-Leibniz operator substituted for 'Op'.",
        "",
        "",
        "line 14, col 1 to line 14, col 29 of module M",
        "",
        "Error in instantiating module 'Other':",
        " A non-Leibniz operator substituted for 'Op'.",
        "",
        "",
      ]),
    );
  });

  it("rejects a non-Leibniz operator substituted for an operator constant under a label, which SANY accepts", () => {
    const report = getReport({
      M: "---- MODULE M ----\nVARIABLE x\nF(a) == lab :: ENABLED (x' = a)\nH(a) == TRUE /\\ lab :: ENABLED (x' = a)\n---- MODULE Inner ----\nCONSTANT c\nVARIABLE w\nD == lab :: ENABLED (w' = c)\n====\n---- MODULE Other ----\nCONSTANT Op(_)\n====\nJ(q) == INSTANCE Inner WITH c <- q, w <- x\nINSTANCE Other WITH Op <- F\nINSTANCE Other WITH Op <- H\nINSTANCE Other WITH Op <- J!D\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 3",
        "",
        ...[
          ["14", "27"],
          ["15", "27"],
          ["16", "29"],
        ].flatMap((entry) => [
          `line ${entry[0]}, col 1 to line ${entry[0]}, col ${entry[1]} of module M`,
          "",
          "Error in instantiating module 'Other':",
          " A non-Leibniz operator substituted for 'Op'.",
          "",
          "",
        ]),
      ]),
    );
  });

  it("rejects a non-Leibniz operator substituted for an operator constant through an operator argument, which SANY accepts", () => {
    const report = getReport({
      M: "---- MODULE M ----\nVARIABLE x\nH(K(_)) == K(1)\nF(a) == H(LAMBDA b : a')\n---- MODULE Lifted ----\nCONSTANT Op(_)\nD == Op(1)\n====\n---- MODULE Other ----\nCONSTANT Op(_)\n====\nP(a) == INSTANCE Lifted WITH Op <- LAMBDA b : a'\nINSTANCE Other WITH Op <- F\nINSTANCE Other WITH Op <- P!D\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        ...[
          ["13", "27"],
          ["14", "29"],
        ].flatMap((entry) => [
          `line ${entry[0]}, col 1 to line ${entry[0]}, col ${entry[1]} of module M`,
          "",
          "Error in instantiating module 'Other':",
          " A non-Leibniz operator substituted for 'Op'.",
          "",
          "",
        ]),
      ]),
    );
  });

  it("accepts an operator argument that a recursive operator never applies, as SANY does", () => {
    const report = getReport({
      M: "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nH1(K(_)) == LET RECURSIVE R(_) R(n) == 0 IN R(K(1))\nH2(K(_)) == LET RECURSIVE A(_), R(_)\n               A(n) == IF n = 0 THEN K(1) ELSE A(n - 1)\n               R(n) == 0\n           IN R(2)\nH3(K(_)) == LET RECURSIVE R(_)\n               R(n) == 0\n               G(n) == R(n)\n           IN G(K(1))\nF1(a) == H1(LAMBDA b : a')\nF2(a) == H2(LAMBDA b : a')\nF3(a) == H3(LAMBDA b : a')\n---- MODULE Recursed ----\nCONSTANT Op(_)\nRECURSIVE R(_)\nR(n) == 0\nD == R(Op(1))\n====\n---- MODULE Other ----\nCONSTANT Op(_)\n====\nP(a) == INSTANCE Recursed WITH Op <- LAMBDA b : a'\nINSTANCE Other WITH Op <- F1\nINSTANCE Other WITH Op <- F2\nINSTANCE Other WITH Op <- F3\nINSTANCE Other WITH Op <- P!D\n====\n",
    });
    expect(report).toEqual({ text: "", isFailed: false });
  });

  it("rejects a non-Leibniz operator argument that tla-ts cannot show a recursive operator ignores, which SANY accepts", () => {
    const report = getReport({
      M: "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nH1(K(_)) == LET RECURSIVE R(_) R(n) == K(n) IN R(1)\nH2(K(_)) == LET RECURSIVE R(_, _) R(n, k) == IF n = 0 THEN 0 ELSE R(n - 1, k) IN R(3, K(1))\nH3(K(_)) == LET RECURSIVE A(_), B(_), C(_)\n               A(n) == IF n = 0 THEN 0 ELSE B(n - 1)\n               B(n) == IF n = 0 THEN 0 ELSE C(n - 1)\n               C(n) == IF n = 0 THEN K(1) ELSE A(n - 1)\n           IN A(2)\nH4(K(_)) == LET RECURSIVE A(_), B(_)\n               A(n) == IF n = 0 THEN K(1) ELSE A(n - 1)\n               B(n) == IF n = 0 THEN 0 ELSE B(n - 1)\n           IN B(2)\nH5(K(_)) == LET RECURSIVE A(_), B(_), D(_)\n               A(n) == B(n)\n               B(n) == A(n)\n               D(n) == K(n)\n           IN A(1)\nH6(K(_)) == LET RECURSIVE R(_), S(_)\n               R(n) == S(1)\n               S(m) == S(m)\n           IN R(K(1))\nH7(K(_)) == LET RECURSIVE R(_)\n               G(n) == R(1)\n               R(m) == G(m)\n           IN G(K(1))\nH8(K(_)) == LET RECURSIVE A(_), B(_)\n               A(n) == B(n)\n               D(n) == K(n)\n               B(n) == A(n)\n           IN A(1)\nRECURSIVE T(_)\nW(n) == T(1)\nT(m) == W(m)\nH9(K(_)) == W(K(1))\nF1(a) == H1(LAMBDA b : a')\nF2(a) == H2(LAMBDA b : a')\nF3(a) == H3(LAMBDA b : a')\nF4(a) == H4(LAMBDA b : a')\nF5(a) == H5(LAMBDA b : a')\nF6(a) == H6(LAMBDA b : a')\nF7(a) == H7(LAMBDA b : a')\nF8(a) == H8(LAMBDA b : a')\nF9(a) == H9(LAMBDA b : a')\n---- MODULE Recursed ----\nCONSTANT Op(_)\nRECURSIVE R(_)\nR(n) == Op(n)\nD == R(1)\n====\n---- MODULE Other ----\nCONSTANT Op(_)\n====\nP(a) == INSTANCE Recursed WITH Op <- LAMBDA b : a'\nINSTANCE Other WITH Op <- F1\nINSTANCE Other WITH Op <- F2\nINSTANCE Other WITH Op <- F3\nINSTANCE Other WITH Op <- F4\nINSTANCE Other WITH Op <- F5\nINSTANCE Other WITH Op <- F6\nINSTANCE Other WITH Op <- F7\nINSTANCE Other WITH Op <- F8\nINSTANCE Other WITH Op <- F9\nINSTANCE Other WITH Op <- P!D\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 10",
        "",
        ...[
          ["56", "28"],
          ["57", "28"],
          ["58", "28"],
          ["59", "28"],
          ["60", "28"],
          ["61", "28"],
          ["62", "28"],
          ["63", "28"],
          ["64", "28"],
          ["65", "29"],
        ].flatMap((entry) => [
          `line ${entry[0]}, col 1 to line ${entry[0]}, col ${entry[1]} of module M`,
          "",
          "Error in instantiating module 'Other':",
          " A non-Leibniz operator substituted for 'Op'.",
          "",
          "",
        ]),
      ]),
    );
  });

  it("rejects a non-Leibniz operator argument that reaches a definition between a RECURSIVE declaration and its definition through a LAMBDA or an INSTANCE, which SANY accepts", () => {
    const report = getReport({
      M: "---- MODULE M ----\nVARIABLE x\n---- MODULE Lifted ----\nCONSTANT Op(_)\nD == Op(1)\n====\n---- MODULE Other ----\nCONSTANT Op(_)\n====\nRECURSIVE R(_)\nG(n) == R(1)\nR(m) == G(m)\nP(Q(_)) == Q(1)\nH(K(_)) == P(LAMBDA y : G(K(y)))\nL(K(_)) == INSTANCE Lifted WITH Op <- LAMBDA y : G(K(y))\nB(a) == INSTANCE Between WITH Op <- LAMBDA b : a'\nF1(a) == H(LAMBDA b : a')\nF2(a) == L(LAMBDA b : a')!D\nF3(a) == B(a)!T\nINSTANCE Other WITH Op <- F1\nINSTANCE Other WITH Op <- F2\nINSTANCE Other WITH Op <- F3\nINSTANCE Other WITH Op <- B!D\n====\n",
      Between:
        "---- MODULE Between ----\nCONSTANT Op(_)\nRECURSIVE R(_)\nG(n) == R(1)\nR(m) == G(m)\nD == G(Op(1))\nTHEOREM T == G(Op(1)) = 0\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 4",
        "",
        ...[
          ["20", "28"],
          ["21", "28"],
          ["22", "28"],
          ["23", "29"],
        ].flatMap((entry) => [
          `line ${entry[0]}, col 1 to line ${entry[0]}, col ${entry[1]} of module M`,
          "",
          "Error in instantiating module 'Other':",
          " A non-Leibniz operator substituted for 'Op'.",
          "",
          "",
        ]),
      ]),
    );
  });

  it("rejects a non-Leibniz instanced theorem substituted for an operator constant, which SANY accepts", () => {
    const report = getReport({
      M: "---- MODULE M ----\nVARIABLE x\n---- MODULE Inner ----\nCONSTANT c\nVARIABLE w\nTHEOREM T == ENABLED (w' = c)\n====\n---- MODULE Other ----\nCONSTANT Op(_)\n====\nI(a) == INSTANCE Inner WITH c <- a, w <- x\nF(a) == I(a)!T\nINSTANCE Other WITH Op <- F\nINSTANCE Other WITH Op <- I!T\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        ...[
          ["13", "27"],
          ["14", "29"],
        ].flatMap((entry) => [
          `line ${entry[0]}, col 1 to line ${entry[0]}, col ${entry[1]} of module M`,
          "",
          "Error in instantiating module 'Other':",
          " A non-Leibniz operator substituted for 'Op'.",
          "",
          "",
        ]),
      ]),
    );
  });

  it("rejects an instanced theorem that primes its instance parameter, substituted for an operator constant, which SANY accepts", () => {
    const report = getReport({
      M: "---- MODULE M ----\nVARIABLE x\n---- MODULE Inner ----\nVARIABLE w\nTHEOREM T == w' = 0\n====\n---- MODULE Other ----\nCONSTANT Op(_)\n====\nI(a) == INSTANCE Inner WITH w <- a\nF(a) == I(a)!T\nINSTANCE Other WITH Op <- F\nINSTANCE Other WITH Op <- I!T\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        ...[
          ["12", "27"],
          ["13", "29"],
        ].flatMap((entry) => [
          `line ${entry[0]}, col 1 to line ${entry[0]}, col ${entry[1]} of module M`,
          "",
          "Error in instantiating module 'Other':",
          " A non-Leibniz operator substituted for 'Op'.",
          "",
          "",
        ]),
      ]),
    );
  });

  it("rejects a non-Leibniz operator passed for an operator parameter an instance substitutes, which SANY accepts", () => {
    const report = getReport({
      M: "---- MODULE M ----\nVARIABLE x\nF(a) == a'\n---- MODULE Pure ----\nCONSTANT c, Op(_)\nUse == Op(c)\n====\nP(G(_)) == INSTANCE Pure WITH c <- 1, Op <- G\nUse == P(F)!Use\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 1",
        "",
        "line 9, col 8 to line 9, col 15 of module M",
        "",
        "Error in instantiating module 'Pure':",
        " A non-Leibniz operator substituted for 'Op'.",
        "",
        "",
      ]),
    );
  });

  it("locates the tuple of an EXCEPT path at the part of its update SANY picks", () => {
    const report = getReport({
      M: "---- MODULE M ----\nVARIABLE x\nf == [v \\in {1} |-> v]\nB == [f EXCEPT ![1][[]x, 2] = 1]\nC == [f EXCEPT ![1][2][[]x, 3] = ((1))]\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        "line 4, col 29 to line 4, col 29 of module M",
        "",
        "Level error in applying operator $Tuple:",
        "The level of argument 1 exceeds the maximum level allowed by the operator.",
        "",
        "",
        "line 5, col 34 to line 5, col 38 of module M",
        "",
        "Level error in applying operator $Tuple:",
        "The level of argument 1 exceeds the maximum level allowed by the operator.",
        "",
        "",
      ]),
    );
  });

  it("locates the tuple of a late EXCEPT path component at the component, where SANY crashes", () => {
    const report = getReport({
      M: "---- MODULE M ----\nVARIABLE x\nf == [v \\in {1} |-> v]\nA == [f EXCEPT ![1][2][3][[]x, 4] = 1]\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 1",
        "",
        "line 4, col 26 to line 4, col 33 of module M",
        "",
        "Level error in applying operator $Tuple:",
        "The level of argument 1 exceeds the maximum level allowed by the operator.",
        "",
        "",
      ]),
    );
  });

  it("keeps a label it rejects out of the HIDE fact check, as SANY does", () => {
    const report = getReport({
      M: "---- MODULE M ----\nA == 1\nTHEOREM T == TRUE\nHIDE lab:: A, T\nUSE lab:: A\nASSUME lab:: TRUE\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 3",
        "",
        ...[
          "line 4, col 6 to line 4, col 12",
          "line 5, col 5 to line 5, col 11",
          "line 6, col 8 to line 6, col 17",
        ].flatMap((location) => [
          `${location} of module M`,
          "",
          "Label not in definition or proof step.",
          "",
          "",
        ]),
      ]),
    );
  });

  it("rejects the arguments of a name after a prefix in a DEF clause entry, where SANY crashes", () => {
    const report = getReport({
      M: "---- MODULE M ----\nA == 1\nB == 2\nTHEOREM TRUE BY DEF A!B(1)\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 3",
        "",
        ...[
          ["line 4, col 23 to line 4, col 23", "Selector `B' should not have argument(s)."],
          [
            "line 4, col 21 to line 4, col 26",
            "DEF clause entry should describe a defined operator.",
          ],
          ["line 4, col 14 to line 4, col 26", "Empty BY"],
        ].flatMap((error) => [`${error[0]} of module M`, "", error[1], "", ""]),
      ]),
    );
  });

  it("rejects a DEF clause entry whose first child nests, where SANY reports line 2147483647", () => {
    const report = getReport({
      M: "---- MODULE M ----\nA == 1\nB == 2\nf == [x \\in {1} |-> x]\nF(x) == x\nTHEOREM TRUE BY DEF A + B + A, A /\\ B /\\ A, f[1] + B, A'', F(A)[1], A\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 5",
        "",
        ...[
          "line 6, col 21 to line 6, col 29",
          "line 6, col 32 to line 6, col 42",
          "line 6, col 45 to line 6, col 52",
          "line 6, col 55 to line 6, col 57",
          "line 6, col 60 to line 6, col 66",
        ].flatMap((location) => [
          `${location} of module M`,
          "",
          "DEF clause entry should describe a defined operator.",
          "",
          "",
        ]),
      ]),
    );
  });

  it("looks up the name a binder declares in a DEF clause entry, and rejects decimals, as SANY does", () => {
    const DEF_ERROR = "DEF clause entry should describe a defined operator.";
    const report = getReport({
      M: "---- MODULE M ----\nCONSTANT K\nA == 1\nB == 2\nTHEOREM TRUE BY DEF CHOOSE v : TRUE, \\E v, w : TRUE, {v \\in {} : TRUE}, A\nTHEOREM TRUE BY DEF CHOOSE <<a, b>> \\in {} : TRUE, {<<a, b>> \\in {} : TRUE}, 12.50, A\nTHEOREM TRUE BY DEF CHOOSE A : TRUE, CHOOSE K : TRUE, \\AA v : TRUE\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 18",
        "",
        ...[
          ["line 5, col 28 to line 5, col 28", "Unknown operator: `v'."],
          ["line 5, col 21 to line 5, col 35", DEF_ERROR],
          ["line 5, col 41 to line 5, col 41", "Unknown operator: `v'."],
          ["line 5, col 38 to line 5, col 51", DEF_ERROR],
          ["line 5, col 55 to line 5, col 55", "Unknown operator: `v'."],
          ["line 5, col 54 to line 5, col 70", DEF_ERROR],
          ["line 6, col 28 to line 6, col 35", "Unexpected token found."],
          [
            "line 6, col 28 to line 6, col 35",
            "Need name or step number here, not `N_IdentifierTuple'.",
          ],
          ["line 6, col 21 to line 6, col 49", DEF_ERROR],
          ["line 6, col 53 to line 6, col 60", "Unexpected token found."],
          [
            "line 6, col 53 to line 6, col 60",
            "Need name or step number here, not `N_IdentifierTuple'.",
          ],
          ["line 6, col 52 to line 6, col 75", DEF_ERROR],
          ["line 6, col 80 to line 6, col 80", "Unexpected token found."],
          ["line 6, col 80 to line 6, col 80", "Need name or step number here, not `.'."],
          ["line 6, col 78 to line 6, col 82", DEF_ERROR],
          ["line 7, col 38 to line 7, col 52", DEF_ERROR],
          ["line 7, col 59 to line 7, col 59", "Unknown operator: `v'."],
          ["line 7, col 55 to line 7, col 66", DEF_ERROR],
        ].flatMap((error) => [`${error[0]} of module M`, "", error[1], "", ""]),
      ]),
    );
  });

  it("reads a decimal's point and parts as separate tokens, as SANY does", () => {
    const DEF_ERRORS = ["Unexpected token found.", "Need name or step number here, not `.'."];
    const report = getReport({
      M: "---- MODULE M ----\nVARIABLE x\nA == 1\nTHEOREM TRUE BY DEF 12 . 50, A\nTHEOREM TRUE BY DEF 1\n  .2, A\nB == 1.(* c *)2 + 1.5x\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 8",
        "",
        ...[
          ...DEF_ERRORS.map((message) => ["line 4, col 24 to line 4, col 24", message]),
          [
            "line 4, col 21 to line 4, col 27",
            "DEF clause entry should describe a defined operator.",
          ],
          ...DEF_ERRORS.map((message) => ["line 6, col 3 to line 6, col 3", message]),
          [
            "line 5, col 21 to line 6, col 4",
            "DEF clause entry should describe a defined operator.",
          ],
          [
            "line 7, col 17 to line 7, col 17",
            "Could not find declaration or definition of symbol '+'.",
          ],
          ["line 7, col 6 to line 7, col 22", "Couldn't resolve infix operator symbol `+'."],
        ].flatMap((error) => [`${error[0]} of module M`, "", error[1], "", ""]),
      ]),
    );
  });

  it.each([
    ["\\b1.1", "\\b1", 6],
    ["1 . \\h1F", "\\h1F", 10],
  ])("rejects the decimal %s with a based part, where SANY crashes", (decimal, part, column) => {
    const report = getReport({ M: `---- MODULE M ----\nA == ${decimal}\n====\n` });
    expect(report.isFailed).toBe(true);
    expect(report.text).toContain(
      `***Parse Error***\nExpected decimal digits but found ${part} at line 2, column ${column}\n`,
    );
  });

  it.each(["{a, e \\in S}", "{a, e, a \\in S}", "{<<1, 2>> \\in S}", "{<<a, e>> \\in S}"])(
    "reads %s as a set enumeration, which SANY's lookahead reads as a bound",
    (set) => {
      const report = getReport({ M: `---- MODULE M ----\nCONSTANTS a, e, S\nX == ${set}\n====\n` });
      expect(report.isFailed).toBe(false);
    },
  );

  it("reports DEF clause entries of bracketed, quantified and infix shapes as SANY does", () => {
    const report = getReport({
      M: "---- MODULE M ----\nA == 1\nB == 2\nTHEOREM TRUE BY DEF CASE A -> 1 [] OTHER -> 2, [a |-> 1], [a : {}], A\nTHEOREM TRUE BY DEF [v \\in {} |-> 1], \\A v, w \\in {} : TRUE, A\nTHEOREM TRUE BY DEF LET Q == 1 IN Q, A \\X B, A /\\ B, {A \\/ B}, A\nTHEOREM TRUE BY DEF [A EXCEPT ![1] = 2], [A -> B], {A : v \\in {}}, WF_A(B), A\nTHEOREM TRUE BY DEF /\\ A\n                    /\\ B\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 46",
        "",
        "line 4, col 26 to line 4, col 31 of module M",
        "",
        "Unexpected token found.",
        "",
        "",
        "line 4, col 26 to line 4, col 31 of module M",
        "",
        "Need name or step number here, not `N_CaseArm'.",
        "",
        "",
        "line 4, col 21 to line 4, col 45 of module M",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
        "line 4, col 49 to line 4, col 55 of module M",
        "",
        "Unexpected token found.",
        "",
        "",
        "line 4, col 49 to line 4, col 55 of module M",
        "",
        "Need name or step number here, not `N_FieldVal'.",
        "",
        "",
        "line 4, col 48 to line 4, col 56 of module M",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
        "line 4, col 60 to line 4, col 65 of module M",
        "",
        "Unexpected token found.",
        "",
        "",
        "line 4, col 60 to line 4, col 65 of module M",
        "",
        "Need name or step number here, not `N_FieldSet'.",
        "",
        "",
        "line 4, col 59 to line 4, col 66 of module M",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
        "line 5, col 22 to line 5, col 29 of module M",
        "",
        "Unexpected token found.",
        "",
        "",
        "line 5, col 22 to line 5, col 29 of module M",
        "",
        "Need name or step number here, not `N_QuantBound'.",
        "",
        "",
        "line 5, col 21 to line 5, col 36 of module M",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
        "line 5, col 42 to line 5, col 52 of module M",
        "",
        "Unexpected token found.",
        "",
        "",
        "line 5, col 42 to line 5, col 52 of module M",
        "",
        "Need name or step number here, not `N_QuantBound'.",
        "",
        "",
        "line 5, col 39 to line 5, col 59 of module M",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
        "line 6, col 25 to line 6, col 30 of module M",
        "",
        "Unexpected token found.",
        "",
        "",
        "line 6, col 25 to line 6, col 30 of module M",
        "",
        "Need name or step number here, not `N_LetDefinitions'.",
        "",
        "",
        "line 6, col 21 to line 6, col 35 of module M",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
        "line 6, col 38 to line 6, col 43 of module M",
        "",
        "Was expecting a GeneralId.",
        "",
        "",
        "line 6, col 40 to line 6, col 41 of module M",
        "",
        "Unexpected token found.",
        "",
        "",
        "line 6, col 40 to line 6, col 41 of module M",
        "",
        "Need name or step number here, not `N_GenInfixOp'.",
        "",
        "",
        "line 6, col 38 to line 6, col 43 of module M",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
        "line 6, col 46 to line 6, col 51 of module M",
        "",
        "Was expecting a GeneralId.",
        "",
        "",
        "line 6, col 48 to line 6, col 49 of module M",
        "",
        "Unexpected token found.",
        "",
        "",
        "line 6, col 48 to line 6, col 49 of module M",
        "",
        "Need name or step number here, not `N_GenInfixOp'.",
        "",
        "",
        "line 6, col 46 to line 6, col 51 of module M",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
        "line 6, col 55 to line 6, col 60 of module M",
        "",
        "Unexpected token found.",
        "",
        "",
        "line 6, col 55 to line 6, col 60 of module M",
        "",
        "Need name or step number here, not `N_InfixExpr'.",
        "",
        "",
        "line 6, col 54 to line 6, col 61 of module M",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
        "line 7, col 22 to line 7, col 22 of module M",
        "",
        "Unexpected token found.",
        "",
        "",
        "line 7, col 22 to line 7, col 22 of module M",
        "",
        "Need name or step number here, not `N_GeneralId'.",
        "",
        "",
        "line 7, col 21 to line 7, col 39 of module M",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
        "line 7, col 43 to line 7, col 43 of module M",
        "",
        "Unexpected token found.",
        "",
        "",
        "line 7, col 43 to line 7, col 43 of module M",
        "",
        "Need name or step number here, not `N_GeneralId'.",
        "",
        "",
        "line 7, col 42 to line 7, col 49 of module M",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
        "line 7, col 53 to line 7, col 53 of module M",
        "",
        "Unexpected token found.",
        "",
        "",
        "line 7, col 53 to line 7, col 53 of module M",
        "",
        "Need name or step number here, not `N_GeneralId'.",
        "",
        "",
        "line 7, col 52 to line 7, col 65 of module M",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
        "line 7, col 71 to line 7, col 71 of module M",
        "",
        "Unexpected token found.",
        "",
        "",
        "line 7, col 71 to line 7, col 71 of module M",
        "",
        "Need name or step number here, not `N_GeneralId'.",
        "",
        "",
        "line 7, col 68 to line 7, col 74 of module M",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
        "line 8, col 21 to line 9, col 24 of module M",
        "",
        "Was expecting a GeneralId.",
        "",
        "",
        "line 9, col 21 to line 9, col 24 of module M",
        "",
        "Unexpected token found.",
        "",
        "",
        "line 9, col 21 to line 9, col 24 of module M",
        "",
        "Need name or step number here, not `N_ConjItem'.",
        "",
        "",
        "line 8, col 21 to line 9, col 24 of module M",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
        "line 8, col 14 to line 9, col 24 of module M",
        "",
        "Empty BY",
        "",
        "",
      ]),
    );
  });

  it("rejects a number or a string as a DEF clause entry, where SANY crashes", () => {
    const report = getReport({
      M: '---- MODULE M ----\nA == 1\nTHEOREM TRUE BY DEF 1, "s", A\n====\n',
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        "line 3, col 21 to line 3, col 21 of module M",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
        "line 3, col 24 to line 3, col 26 of module M",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
      ]),
    );
  });

  it("level-checks the recursive sections of a file's modules before the modules, apart, as SANY does", () => {
    expect(
      getReport({
        M: "---- MODULE M ----\n---- MODULE Inner ----\nVARIABLE w\nRECURSIVE S(_)\nS(p) == IF p THEN []w ELSE S(p)\n====\nRECURSIVE R(_)\nR(p) == IF p THEN 1 ELSE R(p)\nASSUME R(TRUE)\n====\n",
      }),
    ).toEqual({ text: "", isFailed: false });
    expect(
      getReport({
        M: "---- MODULE M ----\nVARIABLE v\n---- MODULE Inner ----\nVARIABLE w\nRECURSIVE S(_)\nS(p) == {<>w} \\cup S(p)\nA == {[]w}\n====\nRECURSIVE R(_)\nR(p) == {[]v} \\cup R(p)\nC == {<>v}\n====\n",
      }).text,
    ).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 6",
        "",
        "line 6, col 9 to line 6, col 13 of module M",
        "",
        "Level error in applying operator $SetEnumerate:",
        "The level of argument 1 exceeds the maximum level allowed by the operator.",
        "",
        "",
        "line 6, col 9 to line 6, col 23 of module M",
        "",
        "Level error in applying operator \\union:",
        "The level of argument 2 exceeds the maximum level allowed by the operator.",
        "",
        "",
        "line 10, col 9 to line 10, col 13 of module M",
        "",
        "Level error in applying operator $SetEnumerate:",
        "The level of argument 1 exceeds the maximum level allowed by the operator.",
        "",
        "",
        "line 10, col 9 to line 10, col 23 of module M",
        "",
        "Level error in applying operator \\union:",
        "The level of argument 2 exceeds the maximum level allowed by the operator.",
        "",
        "",
        "line 7, col 6 to line 7, col 10 of module M",
        "",
        "Level error in applying operator $SetEnumerate:",
        "The level of argument 1 exceeds the maximum level allowed by the operator.",
        "",
        "",
        "line 11, col 6 to line 11, col 10 of module M",
        "",
        "Level error in applying operator $SetEnumerate:",
        "The level of argument 1 exceeds the maximum level allowed by the operator.",
        "",
        "",
      ]),
    );
  });

  // Deviation from SANY: it reports only the first row, since ThmOrAssumpDefNode#levelCheck never sets a theorem's weights.
  it.each([
    ["D == c = 1", "ASSUME I(x)!D", "line 8, col 1 to line 8, col 13"],
    ["THEOREM T == ASSUME c = 1 PROVE TRUE", "ASSUME I(x)!T", "line 8, col 1 to line 8, col 13"],
    ["THEOREM T == c = 1", "ASSUME I(x)!T", "line 8, col 1 to line 8, col 13"],
    [
      "THEOREM T == ASSUME NEW z, c = 1 PROVE z = z",
      "ASSUME I(x)!T",
      "line 8, col 1 to line 8, col 13",
    ],
    [
      "THEOREM T == ASSUME c = 1, NEW z PROVE z = z",
      "ASSUME I(x)!T",
      "line 8, col 1 to line 8, col 13",
    ],
    [
      "THEOREM T == ASSUME c = 1 PROVE TRUE",
      "D == I(x)!T\nASSUME D",
      "line 9, col 1 to line 9, col 8",
    ],
  ])(
    "levels %j applied through a parameterized instance by its argument in %j",
    (lines, use, range) => {
      expect(
        getReport({
          M: `---- MODULE M ----\nVARIABLE x\n---- MODULE L ----\nCONSTANT c\n${lines}\n====\nI(p) == INSTANCE L WITH c <- p\n${use}\nInit == x = 0\nNext == x' = x\n====\n`,
        }),
      ).toEqual({
        text: joinLines([
          "Semantic errors:",
          "",
          "*** Errors: 1",
          "",
          `${range} of module M`,
          "",
          "Level error: assumptions must be level 0 (Constant), ",
          "but this one has level 1.",
          "",
          "",
        ]),
        isFailed: true,
      });
    },
  );

  it("parses a module once the module that names it reaches it, though another loaded it", () => {
    const report = getReport(
      {
        Root: "---- MODULE Root ----\nEXTENDS A, B\nI == INSTANCE C\n====\n",
        A: "---- MODULE A ----\nLOCAL INSTANCE D\n====\n",
        B: "---- MODULE B ----\nLOCAL INSTANCE A\nLOCAL INSTANCE E\n====\n",
        C: "---- MODULE C ----\nEXTENDS F, E, G\n====\n",
        E: "---- MODULE E ----\nEXTENDS D\n====\n",
        D: "---- MODULE D ----\n====\n",
        F: "---- MODULE F ----\n====\n",
        G: "---- MODULE G ----\n====\n",
      },
      { describeFile: (name) => `${name}.tla` },
    );
    const order = ["D", "A", "E", "B", "F", "G", "C", "Root"];
    expect(report).toEqual({
      text: joinLines([
        ...["Root", "A", "B", "C", "F", "E", "G", "D"].map((name) => `Parsing file ${name}.tla`),
        ...order.map((name) => `Semantic processing of module ${name}`),
        ...order.map((name) => `Linting of module ${name}`),
      ]),
      isFailed: false,
    });
  });

  it("loads the modules that LETs, substitutions, proofs and inner modules instantiate as SANY does", () => {
    const leaves = Object.fromEntries(
      ["A", "C", "D", "E", "F", "G", "H"].map((name) => [
        name,
        `---- MODULE ${name} ----\nK == TRUE\n====\n`,
      ]),
    );
    const report = getReport(
      {
        M: "---- MODULE M ----\n---- MODULE Inner ----\nTHEOREM TRUE\n<1> N == INSTANCE A\n<1> QED\n====\nI == INSTANCE P WITH q <- LET N == INSTANCE C IN N!K\nASSUME LET N == INSTANCE D IN N!K\nUSE LET N == INSTANCE E IN N!K\nTHEOREM ASSUME NEW v \\in LET N == INSTANCE F IN {N!K} PROVE TRUE\n<1>1. PICK w \\in LET N == INSTANCE G IN {N!K} : TRUE\n<1> QED BY LET N == INSTANCE H IN N!K\n====\n",
        P: "---- MODULE P ----\nCONSTANT q\nK == q\n====\n",
        ...leaves,
      },
      { describeFile: (name) => `${name}.tla` },
    );
    const order = ["P", "C", "D", "E", "F", "G", "H", "A"];
    expect(report).toEqual({
      text: joinLines([
        ...["M", ...order].map((name) => `Parsing file ${name}.tla`),
        ...[...order, "M"].map((name) => `Semantic processing of module ${name}`),
        ...[...order, "M"].map((name) => `Linting of module ${name}`),
      ]),
      isFailed: false,
    });
  });

  it("loads the modules that a LET instantiates in source order as SANY does", () => {
    const order = ["Q", "R", "S"];
    const report = getReport(
      {
        L: "---- MODULE L ----\nX == LET A == LET N == INSTANCE Q IN N!K\n         M == INSTANCE R\n         B == LET N == INSTANCE S IN N!K\n     IN TRUE\n====\n",
        ...Object.fromEntries(
          order.map((name) => [name, `---- MODULE ${name} ----\nK == TRUE\n====\n`]),
        ),
      },
      { describeFile: (name) => `${name}.tla` },
    );
    expect(report).toEqual({
      text: joinLines([
        ...["L", ...order].map((name) => `Parsing file ${name}.tla`),
        ...[...order, "L"].map((name) => `Semantic processing of module ${name}`),
        ...[...order, "L"].map((name) => `Linting of module ${name}`),
      ]),
      isFailed: false,
    });
  });

  it("reports an unresolved infix operator twice", () => {
    const report = getReport({ Infix: "---- MODULE Infix ----\nVARIABLE x\nOp == x @@ x\n====\n" });
    expect(report.isFailed).toBe(true);
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        "line 3, col 9 to line 3, col 10 of module Infix",
        "",
        "Could not find declaration or definition of symbol '@@'.",
        "",
        "",
        "line 3, col 7 to line 3, col 12 of module Infix",
        "",
        "Couldn't resolve infix operator symbol `@@'.",
        "",
        "",
      ]),
    );
  });

  it("leaves out the arguments of a function it can't generate as SANY does", () => {
    const report = getReport({ Apply: "---- MODULE Apply ----\nOp == (1 @@ 2)[y]\n====\n" });
    expect(report.text).toContain("*** Errors: 2");
    expect(report.text).not.toContain("symbol 'y'");
  });

  it.each(["\\geq", "=<", "(+)", "\\circ", "!!"])(
    "names the unresolved operator %s as it is spelled",
    (operator) => {
      const report = getReport({ Infix: `---- MODULE Infix ----\nOp == 1 ${operator} 2\n====\n` });
      expect(report.text).toContain(
        `Could not find declaration or definition of symbol '${operator}'.`,
      );
      expect(report.text).toContain(`Couldn't resolve infix operator symbol \`${operator}'.`);
    },
  );

  it("names an operand selector past the last operand after the argument it selects", () => {
    const report = getReport({
      Sel: "---- MODULE Sel ----\nT == 1 = 1 /\\ 2 = 2\nP == T!3\n====\n",
    });
    expect(report.text).toContain("Nonexistent operand specified by `argument selector 3'.");
  });

  it("reports an action without a subscript as an unsupported expression", () => {
    const report = getReport({
      Box: "---- MODULE Box ----\nVARIABLE x\nSpec == x = 0 /\\ [][x' = x] /\\ [x, x] = 1\n====\n",
    });
    expect(report.isFailed).toBe(true);
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        "line 3, col 20 to line 3, col 20 of module Box",
        "",
        "Unsupported expression type `['.",
        "",
        "",
        "line 3, col 32 to line 3, col 32 of module Box",
        "",
        "Unsupported expression type `['.",
        "",
        "",
      ]),
    );
  });

  it.each([
    ["x == {|}", "line 2, col 7 to line 2, col 7", "Unknown operator: `|'."],
    ["x == @@(1, 2)", "line 2, col 6 to line 2, col 7", "Unknown operator: `@@'."],
    [
      "x == {\\cup}",
      "line 2, col 7 to line 2, col 10",
      "The operator \\union requires 2 arguments.",
    ],
    [
      "F(a) == a\nx == F(\\in)",
      "line 3, col 8 to line 3, col 10",
      "The operator \\in requires 2 arguments.",
    ],
    [
      "F(a) == a\nx == F(\\cup)",
      "line 3, col 8 to line 3, col 11",
      "The operator \\union requires 2 arguments.",
    ],
    [
      "F(a) == a\nx == F(SUBSET)",
      "line 3, col 8 to line 3, col 13",
      "The operator SUBSET requires 1 arguments.",
    ],
    [
      "F(a) == a\nx == F(\\lnot)",
      "line 3, col 8 to line 3, col 12",
      "The operator \\lnot requires 1 arguments.",
    ],
    [
      "F(a) == a\nx == F(')",
      "line 3, col 8 to line 3, col 8",
      "The operator ' requires 1 arguments.",
    ],
    [
      "F(a) == a\nx == F(^#)",
      "line 3, col 8 to line 3, col 9",
      "Could not find declaration or definition of symbol '^#'.",
    ],
    [
      "F(a) == a\nx == F(=<)",
      "line 3, col 8 to line 3, col 9",
      "Could not find declaration or definition of symbol '=<'.",
    ],
    [
      "F(a) == a\nx == F(LAMBDA y : y)",
      "line 3, col 8 to line 3, col 19",
      "LAMBDA expression used where an expression is required.",
    ],
  ])("reports an operator where %j needs an expression", (body, range, message) => {
    const report = getReport({ M: `---- MODULE M ----\n${body}\n====\n` });
    expect(report.text).toContain(`*** Errors: 1\n\n${range} of module M\n\n${message}\n`);
  });

  it.each([
    ["Z(c) == INSTANCE R\nx == Z(7)!Nope", "line 3, col 6 to line 3, col 14"],
    ["Z == INSTANCE R WITH c <- 1\nx == Z!Nope", "line 3, col 6 to line 3, col 11"],
  ])("locates the unknown operator of %j from the instance's name", (body, range) => {
    const report = getReport({
      M: `---- MODULE M ----\n${body}\n====\n`,
      R: "---- MODULE R ----\nCONSTANT c\n====\n",
    });
    expect(report.text).toContain(`${range} of module M\n\nUnknown operator: \`Z!Nope'.\n`);
  });

  const EXPRESSION_ARGUMENT =
    "An expression appears as argument number 1 (counting from 1) to operator 'Apply', in a position an operator is required.";
  it.each([
    ["UNCHANGED x", "line 6, col 12 to line 6, col 22", EXPRESSION_ARGUMENT],
    ["(F)", "line 6, col 12 to line 6, col 14", EXPRESSION_ARGUMENT],
    [
      "-.",
      "line 6, col 12 to line 6, col 13",
      "Could not find declaration or definition of symbol '-.'.",
    ],
    [
      "LAMBDA y, z : y",
      "line 6, col 6 to line 6, col 10",
      "Lambda expression with arity 2 used as argument 1 of operator `Apply', \nbut an operator of arity 1 is required.",
    ],
    [
      "+",
      "line 6, col 6 to line 6, col 10",
      "Operator with incorrect arity passed as argument. \nOperator '+' of arity 2 is argument number 1 (counting from 1) to operator `line 5, col 1 to line 5, col 22 of module M', \nbut an operator of arity 1 was expected.",
    ],
    ["F(1)!C", "line 6, col 12 to line 6, col 12", "Selector `F' should not have argument(s)."],
  ])(
    "reports the operator argument %j that doesn't fit as SANY does",
    (argument, range, message) => {
      const report = getReport({
        M: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nF(y) == y\nApply(G(_), v) == G(v)\nA == Apply(${argument}, x)\n====\n`,
      });
      expect(report.text).toContain(`*** Errors: 2\n\n${range} of module M\n\n${message}\n`);
    },
  );

  it("reports an operator substitution that doesn't fit as SANY does", () => {
    const report = getReport({
      M: "---- MODULE M ----\nF(y) == y\nI == INSTANCE R WITH Op <- F(1)!C\nJ == INSTANCE R WITH Op <- F(1)\n====\n",
      R: "---- MODULE R ----\nCONSTANT Op(_)\n====\n",
    });
    expect(report.text).toContain(
      joinLines([
        "*** Errors: 3",
        "",
        "line 3, col 28 to line 3, col 28 of module M",
        "",
        "Selector `F' should not have argument(s).",
        "",
        "",
        "In module --TLA+ BUILTINS--",
        "",
        "An operator must be substituted for symbol 'Op', and it must have arity 1.",
        "",
        "",
        "line 4, col 28 to line 4, col 31 of module M",
        "",
        "Arity 1 operator (not an expression) is expected ",
        "to substitute for CONSTANT 'Op'.",
      ]),
    );
  });

  it("reports an operator substitution that is undefined or parenthesized as SANY does", () => {
    const report = getReport({
      M: "---- MODULE M ----\nG(a) == a\nI == INSTANCE R WITH Op <- +\nJ == INSTANCE R WITH Op <- (G)\n====\n",
      R: "---- MODULE R ----\nCONSTANT Op(_)\n====\n",
    });
    expect(report.text).toContain(
      joinLines([
        "*** Errors: 3",
        "",
        "line 3, col 28 to line 3, col 28 of module M",
        "",
        "Could not find declaration or definition of symbol '+'.",
        "",
        "",
        "In module --TLA+ BUILTINS--",
        "",
        "An operator must be substituted for symbol 'Op', and it must have arity 1.",
        "",
        "",
        "line 4, col 28 to line 4, col 30 of module M",
        "",
        "Arity 1 operator (not an expression) is expected ",
        "to substitute for CONSTANT 'Op'.",
      ]),
    );
  });

  it("substitutes for an operator CONSTANT named by a synonym, which SANY rejects", () => {
    const report = getReport({
      M: "---- MODULE M ----\nG(a, b) == a\nI == INSTANCE R WITH <= <- G\n====\n",
      R: "---- MODULE R ----\nCONSTANT _ <= _\n====\n",
    });
    expect(report).toEqual({ text: "", isFailed: false });
  });

  it.each([
    [
      "rejects as multiply defined",
      "---- MODULE M ----\n---- MODULE Inner ----\nK == 1\n====\nD == LET N == INSTANCE Inner IN N!K\n====\n",
    ],
    [
      "fails to parse when it has an inner module of its own",
      "---- MODULE M ----\n---- MODULE Inner ----\n---- MODULE Nested ----\nJ == 1\n====\nK == 1\n====\nD == LET N == INSTANCE Inner IN N!K\n====\n",
    ],
  ])("accepts an inner module that only a LET instantiates, which SANY %s", (_title, source) => {
    expect(getReport({ M: source })).toEqual({ text: "", isFailed: false });
  });

  it.each([
    "f[v \\in LET N == 1 IN {N}] == v",
    "D == LET f[v \\in {LET N == 1 IN N}] == v IN f[1]",
    "THEOREM TRUE\n<1> DEFINE f[v \\in [a : LET N == 1 IN {N}]] == v\n<1> QED",
  ])("accepts a function definition with a LET in its bounds in %j, which SANY rejects", (unit) => {
    const report = getReport({ M: `---- MODULE M ----\n${unit}\n====\n` });
    expect(report).toEqual({ text: "", isFailed: false });
  });

  it("checks the proof of a labeled temporal theorem or step, which SANY skips", () => {
    const report = getReport({
      M: "---- MODULE M ----\nVARIABLE x\nTHEOREM T == t :: [](x = 0)\n<1>1. HAVE x = 1\n<1>2. s :: [](x = 0)\n  <2>1. CASE x = 1\n    OBVIOUS\n  <2> QED\n<1> QED\n====\n",
    });
    expect(report).toEqual({
      text: joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        "line 6, col 9 to line 6, col 18 of module M",
        "",
        "Non-constant CASE for temporal goal.",
        "",
        "",
        "line 4, col 7 to line 4, col 16 of module M",
        "",
        "Non-constant TAKE, WITNESS, or HAVE for temporal goal.",
        "",
        "",
      ]),
      isFailed: true,
    });
  });

  it("accepts a definition after a field named THEOREM, AXIOM or DOMAIN, which SANY rejects", () => {
    const report = getReport({
      M: "---- MODULE M ----\nr == [a |-> 1]\nF == r.THEOREM\nG == [r EXCEPT !.AXIOM = 1]\nH == r.DOMAIN\nI == 1\n====\n",
    });
    expect(report).toEqual({ text: "", isFailed: false });
  });

  it("accepts an operator substituted before a LEMMA, which SANY rejects", () => {
    const report = getReport({
      M: "---- MODULE M ----\nEXTENDS Integers\n---- MODULE Inner ----\nCONSTANT G(_, _)\n====\nI == INSTANCE Inner WITH G <- -\nLEMMA TRUE\n====\n",
    });
    expect(report).toEqual({ text: "", isFailed: false });
  });

  it.each([
    ["VARIABLES x,\n  y", "line 4, col 1 to line 5, col 3", "A VARIABLE declaration"],
    ["CONSTANT C", "line 4, col 1 to line 4, col 10", "A declaration"],
    ["AXIOM A == TRUE", "line 4, col 1 to line 4, col 15", "An ASSUME"],
    ["THEOREM T == TRUE", "line 4, col 1 to line 4, col 17", "A THEOREM"],
    ["USE DEF F", "line 4, col 1 to line 4, col 9", "A USE or HIDE"],
  ])("rejects %j between a RECURSIVE declaration and its definition", (unit, range, type) => {
    const report = getReport({
      M: `---- MODULE M ----\nEXTENDS Naturals\nRECURSIVE F(_)\n${unit}\nF(n) == IF n = 0 THEN 0 ELSE F(n-1)\n====\n`,
    });
    expect(report.text).toContain(
      `*** Errors: 1\n\n${range} of module M\n\n${type} may not appear within a recursive definition section.\n`,
    );
  });

  it.each([
    ["RECURSIVE F(_)", "F", "line 3, col 11 to line 3, col 14", 1],
    ["RECURSIVE F(_)\nF(x) == 1\nRECURSIVE F(_)", "F", "line 5, col 11 to line 5, col 14", 1],
    ["RECURSIVE F(_)\nF[x \\in Nat] == 1", "F", "line 3, col 11 to line 3, col 14", 2],
    ["A == LET RECURSIVE G(_) IN 1", "G", "line 3, col 20 to line 3, col 23", 1],
  ])("reports what %j declares RECURSIVE but leaves undefined", (body, name, range, count) => {
    const report = getReport({ M: `---- MODULE M ----\nEXTENDS Naturals\n${body}\n====\n` });
    expect(report.text).toContain(`*** Errors: ${count}\n`);
    expect(report.text).toContain(
      `${range} of module M\n\nSymbol ${name} declared in RECURSIVE statement but not defined.\n`,
    );
  });

  it("rejects the declarations of an inner module in a recursive definition section like SANY", () => {
    const report = getReport({
      M: "---- MODULE M ----\nRECURSIVE F(_)\n---- MODULE Inner ----\nCONSTANT c\nVARIABLE v\n====\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 4",
        "",
        "line 3, col 1 to line 6, col 4 of module M",
        "",
        "A MODULE  may not appear within a recursive definition section.",
        "",
        "",
        "line 4, col 1 to line 4, col 10 of module M",
        "",
        "A declaration may not appear within a recursive definition section.",
        "",
        "",
        "line 5, col 1 to line 5, col 10 of module M",
        "",
        "A VARIABLE declaration may not appear within a recursive definition section.",
        "",
        "",
        "line 2, col 11 to line 2, col 14 of module M",
        "",
        "Symbol F declared in RECURSIVE statement but not defined.",
        "",
        "",
      ]),
    );
  });

  it("reports an instance's substitution into a RECURSIVE operator that nothing defines like SANY", () => {
    const report = getReport({
      M: "---- MODULE M ----\n---- MODULE A ----\nCONSTANT c\nRECURSIVE G\n====\nI == INSTANCE A WITH c <- 1\nINSTANCE A WITH c <- 2\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 3",
        "",
        "line 4, col 11 to line 4, col 11 of module M",
        "",
        "Symbol G declared in RECURSIVE statement but not defined.",
        "",
        "",
        "line 6, col 1 to line 6, col 27 of module M",
        "",
        "Substitution error, probably due to error ",
        "in module being instantiated.",
        "",
        "",
        "line 7, col 1 to line 7, col 22 of module M",
        "",
        "Substitution error, probably due to error ",
        "in module being instantiated.",
        "",
        "",
      ]),
    );
  });

  it("closes the outer module's recursive definition section at the end of an inner module like SANY", () => {
    const report = getReport({
      M: "---- MODULE M ----\nRECURSIVE F(_)\n---- MODULE Inner ----\nCONSTANT c\n====\nCONSTANT d\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 3",
        "",
        "line 3, col 1 to line 5, col 4 of module M",
        "",
        "A MODULE  may not appear within a recursive definition section.",
        "",
        "",
        "line 4, col 1 to line 4, col 10 of module M",
        "",
        "A declaration may not appear within a recursive definition section.",
        "",
        "",
        "line 2, col 11 to line 2, col 14 of module M",
        "",
        "Symbol F declared in RECURSIVE statement but not defined.",
        "",
        "",
      ]),
    );
  });

  it.each(["CONSTANT d\nF(x) == x", "F(x) == x\nCONSTANT d"])(
    "goes on past a recursive definition an inner module closed, where SANY throws WrongInvocationException (%s)",
    (after) => {
      const report = getReport({
        M: `---- MODULE M ----\nRECURSIVE F(_)\n---- MODULE Inner ----\nCONSTANT c\n====\n${after}\n====\n`,
      });
      expect(report.text).toBe(
        joinLines([
          "Semantic errors:",
          "",
          "*** Errors: 2",
          "",
          "line 3, col 1 to line 5, col 4 of module M",
          "",
          "A MODULE  may not appear within a recursive definition section.",
          "",
          "",
          "line 4, col 1 to line 4, col 10 of module M",
          "",
          "A declaration may not appear within a recursive definition section.",
          "",
          "",
        ]),
      );
    },
  );

  it.each([
    ["RECURSIVE F(_)\nF == 1\nA == F(1)", "line 5, col 6 to line 5, col 9", 1, 0],
    ["RECURSIVE F\nF(x) == 1\nA == F", "line 5, col 6 to line 5, col 6", 0, 1],
    ["RECURSIVE F(_, _)\nF(x) == x\nA == F(1, 2)", "line 5, col 6 to line 5, col 12", 2, 1],
    ["RECURSIVE F(_, _)\nF == 1\nA == F(F(F, 1), 1)", "line 5, col 6 to line 5, col 18", 2, 0],
  ])("reports %j as given the wrong number of arguments", (body, range, given, required) => {
    const report = getReport({ M: `---- MODULE M ----\nEXTENDS Naturals\n${body}\n====\n` });
    expect(report.text).toContain("*** Errors: 2\n");
    expect(report.text).toContain(
      `${range} of module M\n\nWrong number of arguments (${given}) given to operator 'F', \nwhich requires ${required} arguments.\n`,
    );
  });

  it("takes an instance between a RECURSIVE declaration and its definition", () => {
    const report = getReport({
      M: "---- MODULE M ----\nEXTENDS Naturals\nRECURSIVE F(_)\nI == INSTANCE Naturals\nF(n) == IF n = 0 THEN 0 ELSE F(n-1)\n====\n",
    });
    expect(report.isFailed).toBe(false);
  });

  it("takes the parentheses of an operator's only argument for the operator's own", () => {
    const report = getReport({
      M: "---- MODULE M ----\nF(y) == y\nOp(G(_)) == G(1)\nA == Op(F)\n====\n",
    });
    expect(report).toEqual({ text: "", isFailed: false });
  });

  it("reports a multiply defined operator with a warning and an error", () => {
    const report = getReport({ Twice: "---- MODULE Twice ----\nOp == 1\nOp == 2\n====\n" });
    expect(report.isFailed).toBe(true);
    expect(report.text).toBe(
      joinLines([
        "*** Warnings: 1",
        "",
        "line 3, col 1 to line 3, col 7 of module Twice",
        "",
        "Multiple declarations or definitions for symbol Op.  ",
        "This duplicates the one at line 2, col 1 to line 2, col 7 of module Twice.",
        "",
        "",
        "",
        "Semantic errors:",
        "",
        "*** Errors: 1",
        "",
        "line 3, col 1 to line 3, col 7 of module Twice",
        "",
        "Operator Op already defined or declared.",
        "",
        "",
      ]),
    );
  });

  it("reports a theorem that two instances with parameters copy as multiply defined", () => {
    const report = getReport({
      M: "---- MODULE M ----\n---- MODULE L ----\nCONSTANT c\nA == c\nTHEOREM T == c = c\n====\nI(p) == INSTANCE L WITH c <- p\nI(p) == INSTANCE L WITH c <- p\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "*** Warnings: 2",
        "",
        ...["I!A", "I"].flatMap((name) => [
          "line 8, col 1 to line 8, col 30 of module M",
          "",
          `Multiple declarations or definitions for symbol ${name}.  `,
          "This duplicates the one at line 7, col 1 to line 7, col 30 of module M.",
          "",
          "",
          "",
        ]),
        "Semantic errors:",
        "",
        "*** Errors: 1",
        "",
        "line 8, col 1 to line 8, col 30 of module M",
        "",
        "Multiply-defined symbol 'I!T': this definition or declaration conflicts ",
        "with the one at line 7, col 1 to line 7, col 30 of module M.",
        "",
        "",
      ]),
    );
  });

  it.each([
    ["<>", "<>"],
    ["~", "\\lnot"],
    ["SUBSET", "SUBSET"],
  ])("reads a definition of the built-in prefix operator %s and rejects it", (operator, name) => {
    const definition = `${operator} a == a`;
    const report = getReport({ Prefix: `---- MODULE Prefix ----\n${definition}\n====\n` });
    const location = `line 2, col 1 to line 2, col ${definition.length} of module Prefix`;
    expect(report.isFailed).toBe(true);
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        location,
        "",
        `Operator ${name} already defined or declared.`,
        "",
        "",
        location,
        "",
        `Symbol ${name} is a built-in operator, and cannot be redefined.`,
        "",
        "",
      ]),
    );
  });

  it("warns about a record field named like a definition", () => {
    const report = getReport({
      Fields: "---- MODULE Fields ----\nfoo == 1\nr == [foo |-> 2]\n====\n",
    });
    expect(report.isFailed).toBe(false);
    expect(report.text).toBe(
      joinLines([
        "line 3, col 7 to line 3, col 9 of module Fields",
        "",
        'The field name "foo" in the record constructor is identical to the existing definition or declaration',
        "named foo, located at line 2, col 1 to line 2, col 8 of module Fields.",
        "The field in the record will not take the value of the foo definition or declaration.",
        "In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.",
        'Therefore, DOMAIN [foo |-> ...] = {"foo"} holds true.',
        "",
        "",
        "",
      ]),
    );
  });

  it("warns about a field only when no record with the same domain uses a declaration", () => {
    const report = getReport({
      Fields:
        "---- MODULE Fields ----\nCONSTANT k\nfoo == 1\nr == [foo |-> 2, bar |-> 3]\ns == [bar |-> k, foo |-> 4]\nt == [foo |-> 5]\n====\n",
    });
    expect(
      report.text.match(/line \d+, col \d+ to line \d+, col \d+ of module Fields\n\nThe field/g),
    ).toEqual(["line 6, col 7 to line 6, col 9 of module Fields\n\nThe field"]);
  });

  it("reports a circular dependency as a fatal error", () => {
    const report = getReport({
      Cycle: "---- MODULE Cycle ----\nEXTENDS Other\n====\n",
      Other: "---- MODULE Other ----\nEXTENDS Cycle\n====\n",
    });
    expect(report.isFailed).toBe(true);
    expect(report.text).toBe(
      joinLines([
        "",
        "Fatal errors while parsing TLA+ spec in file Cycle",
        "",
        "Unknown location",
        "",
        "Circular dependency among .tla files; dependency cycle is:",
        "",
        "  Cycle.tla --> Other.tla --> Cycle.tla",
        "*** Errors: 1",
        "",
        "Unknown location",
        "",
        "Circular dependency among .tla files; dependency cycle is:",
        "",
        "  Cycle.tla --> Other.tla --> Cycle.tla",
        "",
        "",
        "",
      ]),
    );
  });

  it.each([
    [
      "the module itself",
      "---- MODULE Self ----\nVARIABLE y\nI == INSTANCE Self\n====\n",
      "  Self.tla --> Self.tla",
    ],
    [
      "an inner module",
      "---- MODULE Self ----\n  ---- MODULE A ----\n  VARIABLE y\n  I == INSTANCE A\n  ====\n====\n",
      "Cannot find source file for module A imported in module A.",
    ],
  ])(
    "looks for a file for an instance of %s that it is in, as SANY does",
    (_description, source, error) => {
      const report = getReport({ Self: source });
      expect(report.isFailed).toBe(true);
      expect(report.text).toContain(error);
    },
  );

  it("ends a CASE at the []PROVE after it as SANY does", () => {
    const getTheoremReport = (statement: string) =>
      getReport({ M: `---- MODULE M ----\nVARIABLE x\nTHEOREM T == ${statement}\n====\n` });
    expect(getTheoremReport("[]ASSUME CASE x = 1 -> TRUE [] x = 2 -> TRUE []PROVE TRUE")).toEqual({
      text: "",
      isFailed: false,
    });
    const report = getTheoremReport("ASSUME CASE x = 1 -> TRUE []PROVE TRUE");
    expect(report.isFailed).toBe(true);
    expect(report.text).toContain(
      joinLines([
        "line 3, col 14 to line 3, col 19 of module M",
        "",
        "ASSUME matched by []PROVE instead of PROVE",
      ]),
    );
  });

  it("reports a []ASSUME matched by PROVE in an ASSUME's scope with both errors as SANY does", () => {
    const report = getReport({
      Box: "---- MODULE Box ----\nTHEOREM T == ASSUME NEW J PROVE TRUE\n<1>1 []ASSUME TRUE PROVE TRUE\n<1> QED\n====\n",
    });
    expect(report.isFailed).toBe(true);
    expect(report.text).toContain(
      joinLines([
        "*** Errors: 2",
        "",
        "line 3, col 6 to line 3, col 13 of module Box",
        "",
        "[]ASSUME matched by PROVE instead of []PROVE",
        "",
        "",
        "line 3, col 6 to line 3, col 13 of module Box",
        "",
        "[]ASSUME used within the scope of an ordinary ASSUME's assumptions",
      ]),
    );
  });

  it.each([
    ["E == \\A y \\in S : L:: y = 1", "Label L must contain formal parameter `y'."],
    ["E == \\A y \\in S : L(y, y):: y = 1", "Repeated formal parameter y \nin label `L'."],
    ["E == L(z):: 1 = 1", "Illegal parameter z of label `L'."],
    ["E == L(z):: 1 = 1", "Label L declares extra parameter(s)  z  "],
    ["E == [y \\in S |-> L:: y]", "Label L must contain formal parameter `y'."],
    ["f[y \\in S] == L:: y", "Label L must contain formal parameter `y'."],
    ["E == (L:: 1 = 1) /\\ (L:: 2 = 2)", "Duplicate label `L'."],
    ["ASSUME L:: TRUE", "Label not in definition or proof step."],
    [
      "VARIABLE x\nE == [x EXCEPT ![1] = L:: 2]",
      "Labels inside EXCEPT clauses are not yet implemented.",
    ],
  ])("checks the label in %j as SANY does", (unit, error) => {
    const report = getReport({ M: `---- MODULE M ----\nCONSTANT S\n${unit}\n====\n` });
    expect(report.isFailed).toBe(true);
    expect(report.text).toContain(`\n\n${error}\n`);
  });

  it.each([
    "THEOREM T == ASSUME a :: ASSUME 1 = 1 PROVE 2 = 2 PROVE TRUE\nX == T!a!2",
    "THEOREM T == ASSUME a :: ASSUME TRUE PROVE TRUE PROVE TRUE\nX == T!a!1",
    "THEOREM T == ASSUME a :: ASSUME TRUE PROVE b :: TRUE PROVE TRUE\nX == T!a!b",
    "THEOREM T == ASSUME a :: ASSUME TRUE PROVE TRUE PROVE TRUE\nTHEOREM U == TRUE\nPROOF BY T!a",
    "THEOREM T == ASSUME ASSUME a :: ASSUME TRUE PROVE TRUE PROVE TRUE PROVE TRUE\nTHEOREM U == TRUE\nPROOF BY T!a",
  ])("selects through the labeled nested ASSUME/PROVE in %j as SANY does", (source) => {
    expect(getReport({ M: `---- MODULE M ----\n${source}\n====\n` }).isFailed).toBe(false);
  });

  const labeled = "a :: ASSUME TRUE PROVE TRUE";
  it.each([
    [
      `THEOREM T == ASSUME a :: TRUE, ${labeled} PROVE TRUE`,
      "line 2, col 32 to line 2, col 58",
      "Duplicate label `a'.",
    ],
    [
      `THEOREM T == ASSUME ${labeled} PROVE a :: TRUE`,
      "line 2, col 55 to line 2, col 63",
      "Duplicate label `a'.",
    ],
    [
      `THEOREM T == ASSUME ${labeled} PROVE TRUE\nX == T!1`,
      "line 3, col 6 to line 3, col 8",
      "ASSUME/PROVE used where an expression is required.",
    ],
    [
      "THEOREM T == ASSUME a :: ASSUME b :: ASSUME TRUE PROVE TRUE PROVE TRUE PROVE TRUE\nX == T!a!b",
      "line 3, col 6 to line 3, col 10",
      "ASSUME/PROVE used where an expression is required.",
    ],
    [
      `THEOREM T == TRUE\n<1>1. ASSUME ${labeled} PROVE TRUE\n  OBVIOUS\n<1>2. <1>1!a\n  OBVIOUS\n<1> QED`,
      "line 5, col 7 to line 5, col 12",
      "ASSUME/PROVE used where an expression is required.",
    ],
    [
      "THEOREM T == ASSUME a :: ASSUME TRUE PROVE b :: TRUE PROVE TRUE\nX == T!b",
      "line 3, col 8 to line 3, col 8",
      "Cannot find label `b'.",
    ],
    [
      `THEOREM T == ASSUME ${labeled} PROVE TRUE\nX == T!a!3`,
      "line 3, col 10 to line 3, col 10",
      "Nonexistent operand specified by `argument selector 3'.",
    ],
    [
      `THEOREM T == ASSUME ${labeled} PROVE TRUE\nX == T!a!:`,
      "line 3, col 10 to line 3, col 10",
      "`!:' can be used only after a name and either at the end after an\noperator name or before an operator name.",
    ],
    [
      "THEOREM T == ASSUME a :: ASSUME NEW y, b :: ASSUME TRUE PROVE TRUE PROVE TRUE PROVE TRUE",
      "line 2, col 40 to line 2, col 66",
      "Label not allowed within scope of declaration in nested ASSUME/PROVE.",
    ],
    [
      "THEOREM T == ASSUME NEW x, a :: ASSUME x = 1 PROVE TRUE PROVE TRUE\nTHEOREM U == TRUE\nPROOF BY T!a",
      "line 4, col 12 to line 4, col 12",
      "Accessing subexpression labeled `a' of ASSUME/PROVE clause within the scope of a declaration\n from outside that declaration's scope.",
    ],
  ])("checks the labeled nested ASSUME/PROVE in %j as SANY does", (source, location, message) => {
    expect(getReport({ M: `---- MODULE M ----\n${source}\n====\n` }).text).toContain(
      joinLines(["*** Errors: 1", "", `${location} of module M`, "", message]),
    );
  });

  it("fails a selection into a failed definition through an instance as SANY does without one", () => {
    const error =
      "Subexpression selection failed, probably due to an error in the selected expression.";
    expect(
      getReport({ M: "---- MODULE M ----\na ## b == a ## b\nU == ##(1, 2)!1\n====\n" }).text,
    ).toContain(`line 3, col 15 to line 3, col 15 of module M\n\n${error}\n`);
    expect(
      getReport({
        M: "---- MODULE M ----\n---- MODULE Inner ----\nCONSTANT c\na ## b == a ## b\n====\nI == INSTANCE Inner WITH c <- 1\nU == I!##(1, 2)!1\n====\n",
      }).text,
    ).toContain(`line 7, col 17 to line 7, col 17 of module M\n\n${error}\n`);
  });

  it.each([
    ["Op0 == lab:: 1 |- 2\nU == Op0!1", "line 3, col 6 to line 3, col 8", "Op0"],
    [
      "Op0 == {lab:: 1 |- 2}\nU == Op0!1!1",
      "line 3, col 10 to line 3, col 10",
      "argument selector 1",
    ],
  ])(
    "reports a selection through a failed label in %j at the selector before it",
    (unit, location, name) => {
      expect(getReport({ M: `---- MODULE M ----\n${unit}\n====\n` }).text).toContain(
        `${location} of module M\n\nAn unexpected null node specified by '${name}'.\nThis is probably due to a previous error.\n`,
      );
    },
  );

  it("rejects a LET without definitions", () => {
    const report = getReport({ M: "---- MODULE M ----\nD0 ==\n  LET\n  IN 1\n====\n" });
    expect(report.isFailed).toBe(true);
    expect(report.text).toContain(
      '***Parse Error***\nEncountered "IN" at line 4, column 3 and token "LET" \n\nResidual stack trace follows:\nLet Definitions starting at line 4, column 3.\n',
    );
  });

  it.each([
    [
      "RECURSIVE _ ^# _",
      'Was expecting "==== or more Module body"\nEncountered "_" at line 3, column 16 and token "^#" ',
    ],
    [
      "RECURSIVE _ ++",
      'Was expecting "_"\nEncountered "Beginning of definition" at line 4, column 1 and token "++" ',
    ],
    [
      "F(_ ^+ _) == 1",
      'Was expecting "COMMA or )"\nEncountered "_" at line 3, column 8 and token "^+" ',
    ],
  ])("rejects the operator symbol declaration %j of the wrong fixity", (unit, error) => {
    const report = getReport({
      M: `---- MODULE M ----\nEXTENDS Naturals\n${unit}\nx == 1\n====\n`,
    });
    expect(report.isFailed).toBe(true);
    expect(report.text).toContain(`***Parse Error***\n${error}\n`);
  });

  it("reports a file without a module as a parse error", () => {
    const report = getReport({ Headless: "Nothing here\n" });
    expect(report.isFailed).toBe(true);
    expect(report.text).toBe(
      joinLines([
        "***Parse Error***",
        'Was expecting "---- MODULE (beginning of module)"',
        'Encountered "<EOF>" at line 1, column 13 and token "" ',
        "",
        "Residual stack trace follows:",
        "Begin module starting at line 1, column 13.",
        "Module definition starting at line 1, column 13.",
        "",
        "",
        "Fatal errors while parsing TLA+ spec in file Headless",
        "",
        "In module Headless",
        "",
        "Could not parse module Headless from file Headless.tla",
        "*** Errors: 1",
        "",
        "In module Headless",
        "",
        "Could not parse module Headless from file Headless.tla",
        "",
        "",
        "",
      ]),
    );
  });

  it("reports actions used as temporal formulas", () => {
    const report = getReport({
      Leads: "---- MODULE Leads ----\nVARIABLE x\nA == x' ~> []x\nB == [](x')\n====\n",
    });
    expect(report.isFailed).toBe(true);
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        "line 3, col 6 to line 3, col 14 of module Leads",
        "",
        "Action used where only temporal formula or state predicate allowed.",
        "",
        "",
        "line 4, col 6 to line 4, col 11 of module Leads",
        "",
        "[] followed by action not of form [A]_v.",
        "",
        "",
      ]),
    );
  });

  it.each([
    ["1.7.4", 2],
    ["master", 1],
  ] as const)(
    "checks the level of an operator applied to []A as TLC %s's SANY does",
    (version, errorCount) => {
      const report = getReport(
        { Strong: "---- MODULE Strong ----\nVARIABLE x\nL == SF_x([](x' = 1))\n====\n" },
        { version },
      );
      expect(report.text).toContain(`*** Errors: ${errorCount}\n`);
      expect(report.text.includes("Level error in applying operator $SF")).toBe(errorCount === 2);
    },
  );

  it.each([
    ["1.7.4", 1],
    ["master", 2],
  ] as const)(
    "reports a level error that two checks find with the same text as TLC %s's SANY does",
    (version, errorCount) => {
      const report = getReport(
        {
          Twice: `---- MODULE Twice ----\nVARIABLE s\nF(q, Op(_)) == {x \\in {1} : Op(q)}\nA == F([]s, LAMBDA e: e = 1)\n====\n`,
        },
        { version },
      );
      expect(report.text).toContain(`*** Errors: ${errorCount}\n`);
    },
  );

  it("warns of a theorem named as an earlier one of the module", () => {
    const report = getReport(
      { Twice: "---- MODULE Twice ----\nTHEOREM Thm == TRUE\nTHEOREM Thm == TRUE\n====\n" },
      { version: "1.7.4" },
    );
    expect(report.text).toContain(
      "line 3, col 1 to line 3, col 19 of module Twice\n\nMultiple declarations or definitions for symbol Thm.  \nThis duplicates the one at line 2, col 1 to line 2, col 19 of module Twice.",
    );
  });

  it.each(["USE", "HIDE", "THEOREM TRUE BY", "THEOREM TRUE\n<1> USE\n<1> QED"])(
    "reports %j with nothing after its keyword as SANY does",
    (statement) => {
      const report = getReport({ Empty: `---- MODULE Empty ----\n${statement}\n====\n` });
      expect(report.text).toContain("\n\nEmpty BY, USE, or HIDE\n");
    },
  );

  it("locates a HIDE fact SANY fails to resolve at its null node in the builtins", () => {
    const report = getReport({ Hidden: "---- MODULE Hidden ----\nHIDE bar\n====\n" });
    expect(report.text).toContain(
      "In module --TLA+ BUILTINS--\n\nThe only expression allowed as a fact in a HIDE is \nthe name of a theorem, assumption, or step.",
    );
  });

  it("reports a HIDE fact whose operator SANY can't resolve, where SANY crashes", () => {
    const report = getReport({ Hidden: "---- MODULE Hidden ----\nVARIABLE x\nHIDE -x\n====\n" });
    expect(report.text).toContain(
      joinLines([
        "*** Errors: 3",
        "",
        "line 3, col 6 to line 3, col 6 of module Hidden",
        "",
        "Could not find declaration or definition of symbol '-.'.",
        "",
        "",
        "line 3, col 6 to line 3, col 7 of module Hidden",
        "",
        "Couldn't resolve prefix operator symbol `-.'.",
        "",
        "",
        "In module --TLA+ BUILTINS--",
        "",
        "The only expression allowed as a fact in a HIDE is ",
        "the name of a theorem, assumption, or step.",
      ]),
    );
  });

  it("rejects USE ONLY in a module body but not in a proof", () => {
    const getText = (body: string) =>
      getReport({ Only: `---- MODULE Only ----\n${body}\n====\n` }).text;
    expect(getText("USE ONLY TRUE")).toContain(
      'Was expecting "==== or more Module body"\nEncountered "USE" at line 2, column 1',
    );
    expect(getText("THEOREM TRUE\n<1> USE ONLY TRUE\n<1> QED")).not.toContain("Parse Error");
  });

  it("names the specification by a root module that parses but has semantic errors", () => {
    const text = "---- MODULE Named ----\nCONSTANT C\nTHEOREM TRUE BY DEF C\n====\n";
    expect(getSanyModuleName(text, "1.7.4")).toBe("Named");
  });

  it("locates a substitution for a parameter of the definition at its target", () => {
    const report = getReport({
      Outer: "---- MODULE Outer ----\nM(a) == INSTANCE Inner WITH a <- 1, C <- a\n====\n",
      Inner: "---- MODULE Inner ----\nCONSTANT C\n====\n",
    });
    expect(report.text).toContain(
      "line 2, col 29 to line 2, col 29 of module Outer\n\nIdentifier 'a' is not a legal target",
    );
  });

  it("locates a substitution target named in an earlier substitution at the target", () => {
    const report = getReport({
      Outer: "---- MODULE Outer ----\nVARIABLE z\nI == INSTANCE Inner WITH x <- z, z <- x\n====\n",
      Inner: "---- MODULE Inner ----\nVARIABLE x\n====\n",
    });
    expect(report.text).toContain(
      "line 3, col 34 to line 3, col 34 of module Outer\n\nIdentifier 'z' is not a legal target",
    );
  });

  it("binds no bound identifier in the body of a function named by a parameter", () => {
    const report = getReport({
      Fold: "---- MODULE Fold ----\nF(it, S) == LET it[s \\in S] == s IN it\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        "line 2, col 17 to line 2, col 32 of module Fold",
        "",
        "Function name `it' already defined or declared.",
        "",
        "",
        "line 2, col 32 to line 2, col 32 of module Fold",
        "",
        "Unknown operator: `s'.",
        "",
        "",
      ]),
    );
  });

  it("binds the bound identifiers in the body of a function whose name is already defined", () => {
    const report = getReport({
      Twice: "---- MODULE Twice ----\nf[x \\in {1}] == x\nf[x \\in {1}] == x\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 1",
        "",
        "line 3, col 1 to line 3, col 17 of module Twice",
        "",
        "Function name `f' already defined or declared.",
        "",
        "",
      ]),
    );
  });

  it("reads MODULE as the start of a fact", () => {
    const report = getReport({
      Facts:
        "---- MODULE Facts ----\nTHEOREM T == TRUE\nUSE MODULE Facts, T\nTHEOREM TRUE BY MODULE Facts\n====\n",
    });
    expect(report).toEqual({ text: "", isFailed: false });
  });

  it("reports a module in a fact that isn't extended or instantiated, and leaves it out", () => {
    const report = getReport({ Facts: "---- MODULE Facts ----\nUSE DEF MODULE Nope\n====\n" });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        "line 2, col 16 to line 2, col 19 of module Facts",
        "",
        "Module `Nope' used without being extended or instantiated.",
        "",
        "",
        "line 2, col 1 to line 2, col 19 of module Facts",
        "",
        "Empty USE or HIDE statement.",
        "",
        "",
      ]),
    );
  });

  it("reads a DEF clause entry that isn't a name as SANY reads its syntax node", () => {
    const report = getReport({
      Defs: "---- MODULE Defs ----\nA == 1\nTHEOREM TRUE BY A DEF UNION A, A + 1, (A), A(1), A\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 14",
        "",
        "line 3, col 23 to line 3, col 29 of module Defs",
        "",
        "Was expecting a GeneralId.",
        "",
        "",
        "line 3, col 29 to line 3, col 29 of module Defs",
        "",
        "Unexpected token found.",
        "",
        "",
        "line 3, col 29 to line 3, col 29 of module Defs",
        "",
        "Need name or step number here, not `N_GeneralId'.",
        "",
        "",
        "line 3, col 23 to line 3, col 29 of module Defs",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
        "line 3, col 32 to line 3, col 36 of module Defs",
        "",
        "Was expecting a GeneralId.",
        "",
        "",
        "line 3, col 34 to line 3, col 34 of module Defs",
        "",
        "Unexpected token found.",
        "",
        "",
        "line 3, col 34 to line 3, col 34 of module Defs",
        "",
        "Need name or step number here, not `N_GenInfixOp'.",
        "",
        "",
        "line 3, col 32 to line 3, col 36 of module Defs",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
        "line 3, col 40 to line 3, col 40 of module Defs",
        "",
        "Unexpected token found.",
        "",
        "",
        "line 3, col 40 to line 3, col 40 of module Defs",
        "",
        "Need name or step number here, not `N_GeneralId'.",
        "",
        "",
        "line 3, col 39 to line 3, col 41 of module Defs",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
        "line 3, col 44 to line 3, col 47 of module Defs",
        "",
        "Was expecting a GeneralId.",
        "",
        "",
        "line 3, col 45 to line 3, col 47 of module Defs",
        "",
        "Selector `!(...)' should not have argument(s).",
        "",
        "",
        "line 3, col 44 to line 3, col 47 of module Defs",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
      ]),
    );
  });

  it("takes only an identifier or an operator for a substitution target", () => {
    const report = getReport({
      Outer: "---- MODULE Outer ----\nINSTANCE Inner WITH VARIABLES <- 1\n====\n",
      Inner: "---- MODULE Inner ----\nCONSTANT C\n====\n",
    });
    expect(report.text).toContain(
      'Encountered "VARIABLES" at line 2, column 21 and token "WITH" \n\nResidual stack trace follows:\nSubstitution starting at line 2, column 21.',
    );
  });

  it("spells an operator that is no legal substitution target as the source does", () => {
    const report = getReport({
      Outer: "---- MODULE Outer ----\nINSTANCE Inner WITH \\lnot <- 1\n====\n",
      Inner: "---- MODULE Inner ----\nCONSTANT C\n====\n",
    });
    expect(report.text).toContain(
      "line 2, col 21 to line 2, col 25 of module Outer\n\nIdentifier '\\lnot' is not a legal target",
    );
  });

  it("reads @ as an identifier", () => {
    const report = getReport({
      At: "---- MODULE At ----\nVARIABLE @\nA == @ + 1\nB == \\A @ \\in {} : @\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 5",
        "",
        "line 2, col 10 to line 2, col 10 of module At",
        "",
        "Attempted to declare '@' as a variable.",
        "",
        "",
        "line 3, col 8 to line 3, col 8 of module At",
        "",
        "Could not find declaration or definition of symbol '+'.",
        "",
        "",
        "line 3, col 6 to line 3, col 10 of module At",
        "",
        "Couldn't resolve infix operator symbol `+'.",
        "",
        "",
        "line 4, col 9 to line 4, col 9 of module At",
        "",
        "Multiply-defined symbol '@': this definition or declaration conflicts ",
        "with the one at line 2, col 10 to line 2, col 10 of module At.",
        "",
        "",
        "line 4, col 20 to line 4, col 20 of module At",
        "",
        "@ used where its meaning is not defined.",
        "",
        "",
      ]),
    );
  });

  it("reads an @ that starts a conjunction or disjunction step as the previous step's right side, like SANY", () => {
    const report = getReport({
      At: "---- MODULE At ----\nTHEOREM T == TRUE\n<1>1. 1 = 1 OBVIOUS\n<1>2. @ /\\ TRUE OBVIOUS\n<1>3. @ \\/ TRUE OBVIOUS\n<1>4. (@) = 1 OBVIOUS\n<1> QED\n====\n",
    });
    expect(report).toEqual({
      text: joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 1",
        "",
        "line 6, col 8 to line 6, col 8 of module At",
        "",
        "@ used where its meaning is not defined.",
        "",
        "",
      ]),
      isFailed: true,
    });
  });

  it("reports a substitution above the level the instantiated module allows", () => {
    const report = getReport({
      Outer: "---- MODULE Outer ----\nVARIABLE x\nI == INSTANCE Inner WITH C <- [](x = 0)\n====\n",
      Inner: "---- MODULE Inner ----\nCONSTANT C\nASSUME C = {}\n====\n",
    });
    expect(report.isFailed).toBe(true);
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 1",
        "",
        "line 3, col 1 to line 3, col 39 of module Outer",
        "",
        "Level error in instantiating module 'Inner':",
        "The level of the expression or operator substituted for 'C' ",
        "must be at most 2.",
        "",
        "",
      ]),
    );
  });

  it.each([
    [
      "a HIDE of an expression",
      "THEOREM T == TRUE\nHIDE TRUE",
      [
        "line 3, col 6 to line 3, col 9 of module M",
        "",
        "The only expression allowed as a fact in a HIDE is ",
        "the name of a theorem, assumption, or step.",
      ],
    ],
    [
      "a reference to an ASSUME/PROVE clause in the scope of its NEW",
      "THEOREM T == ASSUME NEW y, y = 1 PROVE y = 1\nU == T!2",
      [
        "line 3, col 8 to line 3, col 8 of module M",
        "",
        "Accessing ASSUME/PROVE clause within the scope of a declaration",
        " from outside that declaration's scope.",
      ],
    ],
    [
      "a reference to a label in the scope of a NEW",
      "THEOREM T == ASSUME NEW y PROVE lab:: y = y\nU == T!lab",
      [
        "line 3, col 8 to line 3, col 10 of module M",
        "",
        "Accessing subexpression labeled `lab' of ASSUME/PROVE clause within the scope of a declaration",
        " from outside that declaration's scope.",
      ],
    ],
  ])("reports %s", (_description, body, error) => {
    const report = getReport({ M: `---- MODULE M ----\n${body}\n====\n` });
    expect(report.isFailed).toBe(true);
    expect(report.text).toBe(
      joinLines(["Semantic errors:", "", "*** Errors: 1", "", ...error, "", ""]),
    );
  });

  it("reports references in the scope of a NEW to a theorem another module instantiates", () => {
    const report = getReport({
      M: "---- MODULE M ----\nI == INSTANCE Inner\nU == I!T!2\nV == I!T!lab\n====\n",
      Inner: "---- MODULE Inner ----\nTHEOREM T == ASSUME NEW y, y = 1 PROVE lab:: y = y\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        "line 3, col 10 to line 3, col 10 of module M",
        "",
        "Accessing ASSUME/PROVE clause within the scope of a declaration",
        " from outside that declaration's scope.",
        "",
        "",
        "line 4, col 10 to line 4, col 12 of module M",
        "",
        "Accessing subexpression labeled `lab' of ASSUME/PROVE clause within the scope of a declaration",
        " from outside that declaration's scope.",
        "",
        "",
      ]),
    );
  });

  it("reports a variable in a DEF clause and the BY it leaves empty", () => {
    const report = getReport({
      M: "---- MODULE M ----\nVARIABLE x\nTHEOREM TRUE BY DEF x\n====\n",
    });
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        "line 3, col 21 to line 3, col 21 of module M",
        "",
        "DEF clause entry should describe a defined operator.",
        "",
        "",
        "line 3, col 14 to line 3, col 21 of module M",
        "",
        "Empty BY",
        "",
        "",
      ]),
    );
  });
});

const COUNTER = `---- MODULE Counter ----
EXTENDS Naturals
(* --algorithm Counter
variables x = 0;
begin
  while x < 3 do
    x := x + 1;
  end while;
end algorithm; *)
\\* BEGIN TRANSLATION (chksum(pcal) = "f3520a51" /\\ chksum(tla) = "5821f1e4")
VARIABLES pc, x

vars == << pc, x >>

Init == (* Global variables *)
        /\\ x = 0
        /\\ pc = "Lbl_1"

Lbl_1 == /\\ pc = "Lbl_1"
         /\\ IF x < 3
               THEN /\\ x' = x + 1
                    /\\ pc' = "Lbl_1"
               ELSE /\\ pc' = "Done"
                    /\\ x' = x

(* Allow infinite stuttering to prevent deadlock on termination. *)
Terminating == pc = "Done" /\\ UNCHANGED vars

Next == Lbl_1
           \\/ Terminating

Spec == Init /\\ [][Next]_vars

Termination == <>(pc = "Done")

\\* END TRANSLATION
====
`;

const getDivergenceText = (root: string, module: string, message: string) =>
  joinLines([
    "Labels added.",
    `Warnings (1) during syntax parsing of ${root}:`,
    "",
    "",
    `In module ${module}`,
    "",
    message,
    "",
    "",
    "",
  ]);

describe("getSanyReport on PlusCal", () => {
  it("reports the labels the translator adds to an algorithm that matches its checksums", () => {
    expect(getReport({ Counter: COUNTER })).toEqual({ text: "Labels added.\n", isFailed: false });
  });

  it("validates the root module once it parses it", () => {
    const report = getReport({ Counter: COUNTER }, { describeFile: (name) => `${name}.tla` });
    expect(report.text.split("\n").slice(0, 3)).toEqual([
      "Parsing file Counter.tla",
      "Labels added.",
      "Parsing file Naturals.tla",
    ]);
  });

  it("warns that the algorithm changed since its translation", () => {
    const report = getReport({ Counter: COUNTER.replace("x := x + 1", "x := x + 2") });
    expect(report).toEqual({
      text: getDivergenceText(
        "Counter",
        "Counter",
        "The PlusCal algorithm in module Counter has changed since its last translation.",
      ),
      isFailed: false,
    });
  });

  it("warns that the translation changed since it was written", () => {
    const report = getReport({
      Counter: COUNTER.replace('<>(pc = "Done")', '<>(pc = "Done" /\\ TRUE)'),
    });
    expect(report).toEqual({
      text: getDivergenceText(
        "Counter",
        "Counter",
        "The TLA+ translation in module Counter has changed since its last translation.",
      ),
      isFailed: false,
    });
  });

  it("warns that both changed", () => {
    const report = getReport({ Counter: COUNTER.replaceAll("x < 3", "x < 4") });
    expect(report).toEqual({
      text: getDivergenceText(
        "Counter",
        "Counter",
        "Both the PlusCal algorithm and its TLA+ translation in module Counter have changed since the last translation.",
      ),
      isFailed: false,
    });
  });

  it("validates a module that the root extends", () => {
    const report = getReport({
      Root: "---- MODULE Root ----\nEXTENDS Counter\n====\n",
      Counter: COUNTER.replace("x := x + 1", "x := x + 2"),
    });
    expect(report).toEqual({
      text: getDivergenceText(
        "Root",
        "Counter",
        "The PlusCal algorithm in module Counter has changed since its last translation.",
      ),
      isFailed: false,
    });
  });

  it("reports the variables the translator renames", () => {
    const report = getReport({
      Renamed: `---- MODULE Renamed ----
EXTENDS Naturals
(* --algorithm Renamed
variables total = 0;
process A = 1
variables t = 1;
begin
  a: total := total + t;
end process;
process B = 2
variables t = 2;
begin
  b: total := total + t;
end process;
end algorithm; *)
\\* BEGIN TRANSLATION
\\* END TRANSLATION
====
`,
    });
    expect(report).toEqual({ text: "Warning: symbols were renamed.\n", isFailed: false });
  });

  it("reports an algorithm the translator rejects, whose checksum then differs", () => {
    const report = getReport({
      Undeclared: `---- MODULE Undeclared ----
(* --algorithm Undeclared
variables x = 0;
begin
  a: y := 1;
end algorithm; *)
\\* BEGIN TRANSLATION (chksum(pcal) = "ffffffff" /\\ chksum(tla) = "ffffffff")
VARIABLE x
\\* END TRANSLATION
====
`,
    });
    expect(report.isFailed).toBe(false);
    expect(report.text).toBe(
      joinLines([
        "",
        "Unrecoverable error:",
        " -- Assignment to undeclared variable y",
        "    at line 5, column 6.",
        "",
        "Warnings (1) during syntax parsing of Undeclared:",
        "",
        "",
        "In module Undeclared",
        "",
        "Both the PlusCal algorithm and its TLA+ translation in module Undeclared have changed since the last translation.",
        "",
        "",
        "",
      ]),
    );
  });

  it("rejects a specification whose algorithm it cannot uncomment", () => {
    const report = getReport({
      Quote: `---- MODULE Quote ----
(* --algorithm Quote
begin
  a: print "abc;
end algorithm; *)
\\* BEGIN TRANSLATION
\\* END TRANSLATION
====
`,
    });
    expect(report.isFailed).toBe(true);
    expect(report.text).toBe(
      joinLines([
        "",
        "Unrecoverable error:",
        " -- Unterminated string in line 4.",
        "",
        "*** Errors: 1",
        "",
        "In module Quote",
        "",
        "An unexpected problem was encountered attempting to validate the specification for Quote",
        "",
        "",
        "",
      ]),
    );
  });
});

const FAIR = `---- MODULE Fair ----
EXTENDS Naturals
(* --fair algorithm Fair
variables x = 0;
begin
  Step: while x < 3 \\/ x = 4 do
    x := x + 1;
  end while;
end algorithm; *)
\\* BEGIN TRANSLATION (chksum(pcal) = "2c64e8f2" /\\ chksum(tla) = "e3ed5ed0")
VARIABLES pc, x

vars == << pc, x >>

Init == (* Global variables *)
        /\\ x = 0
        /\\ pc = "Step"

Step == /\\ pc = "Step"
        /\\ IF x < 3 \\/ x = 4
              THEN /\\ x' = x + 1
                   /\\ pc' = "Step"
              ELSE /\\ pc' = "Done"
                   /\\ x' = x

(* Allow infinite stuttering to prevent deadlock on termination. *)
Terminating == pc = "Done" /\\ UNCHANGED vars

Next == Step
           \\/ Terminating

Spec == /\\ Init /\\ [][Next]_vars
        /\\ WF_vars(Next)

Termination == <>(pc = "Done")

\\* END TRANSLATION
====
`;

describe("getSanyReport for TLC 1.7.4", () => {
  const options: SanyReportOptions = { version: "1.7.4" };

  it("prints the errors and warnings of a module together", () => {
    const report = getReport(
      {
        Twice: `---- MODULE Twice ----
Op == 1
Op == 2
Unknown == Missing
====
`,
      },
      options,
    );
    expect(report.isFailed).toBe(true);
    expect(report.text).toBe(
      joinLines([
        "Semantic errors:",
        "",
        "*** Errors: 2",
        "",
        "line 3, col 1 to line 3, col 7 of module Twice",
        "",
        "Operator Op already defined or declared.",
        "",
        "",
        "line 4, col 12 to line 4, col 18 of module Twice",
        "",
        "Unknown operator: `Missing'.",
        "",
        "",
        "*** Warnings: 1",
        "",
        "line 3, col 1 to line 3, col 7 of module Twice",
        "",
        "Multiple declarations or definitions for symbol Op.  ",
        "This duplicates the one at line 2, col 1 to line 2, col 7 of module Twice.",
        "",
        "",
        "",
      ]),
    );
  });

  it("names only the last item of a selector it can't resolve", () => {
    const getError = (expression: string) =>
      getReport({ U: `---- MODULE U ----\nOp == ${expression}\n====\n` }, options)
        .text.split("\n")
        .slice(4, 7)
        .join("\n");
    expect(getError("M!Init")).toBe(
      "line 2, col 9 to line 2, col 12 of module U\n\nUnknown operator: `Init'.",
    );
    expect(getError("M!Init!1")).toBe(
      "line 2, col 14 to line 2, col 14 of module U\n\nUnknown operator: `argument selector 1'.",
    );
    expect(getError("M!Init!(1)")).toBe(
      "line 2, col 14 to line 2, col 16 of module U\n\nUnknown operator: `!(...)'.",
    );
  });

  it("reads a character past U+00FF in a string by its low byte", () => {
    const report = getReport({ Shapes: '---- MODULE Shapes ----\nX == "ǩ ●"\n====\n' }, options);
    expect(report).toEqual({ text: "", isFailed: false });
  });

  it("aborts on a character past U+00FF whose low byte is below 0x80, which its lexer cannot read", () => {
    const report = getReport(
      {
        Checked: `---- MODULE Checked ----
X == "✓"
====
`,
      },
      options,
    );
    expect(report.isFailed).toBe(true);
    expect(report.text).toBe(
      joinLines([
        'Lexical error at line 2, column 7.  Encountered: "\\u2713" (10003), after : "\\""',
        "",
        "Fatal errors while parsing TLA+ spec in file Checked",
        "",
        "tla2sany.semantic.AbortException",
        "*** Abort messages: 1",
        "",
        "In module Checked",
        "",
        "Could not parse module Checked from file Checked.tla",
        "",
        "",
      ]),
    );
  });

  it("warns after the file it parses that the algorithm changed", () => {
    const report = getReport(
      { Counter: COUNTER.replace("x := x + 1", "x := x + 2") },
      { ...options, describeFile: (name) => `${name}.tla` },
    );
    expect(report).toEqual({
      text: joinLines([
        "Parsing file Counter.tla",
        "Labels added.",
        "!! WARNING: The PlusCal algorithm in module Counter has changed since its last translation.",
        "Parsing file Naturals.tla",
        "Semantic processing of module Naturals",
        "Semantic processing of module Counter",
      ]),
      isFailed: false,
    });
  });

  it("warns in its own words that both the algorithm and its translation changed", () => {
    const report = getReport({ Counter: COUNTER.replaceAll("x < 3", "x < 4") }, options);
    expect(report.text).toBe(
      joinLines([
        "Labels added.",
        "!! WARNING: The PlusCal algorithm and its TLA+ translation in module Counter filename since the last translation.",
      ]),
    );
  });

  it("checksums a fair algorithm by its text, without the columns of its junctions", () => {
    expect(getReport({ Fair: FAIR }, options)).toEqual({ text: "", isFailed: false });
    expect(getReport({ Fair: FAIR }).text).toContain(
      "The PlusCal algorithm in module Fair has changed since its last translation.",
    );
  });

  it("aborts without a location on a module it cannot find", () => {
    const report = getReport(
      {
        Lonely: `---- MODULE Lonely ----
EXTENDS Absent
====
`,
      },
      options,
    );
    expect(report.text).toBe(
      joinLines([
        "",
        "Fatal errors while parsing TLA+ spec in file Lonely",
        "",
        "tla2sany.semantic.AbortException",
        "*** Abort messages: 1",
        "",
        "Unknown location",
        "",
        "Cannot find source file for module Absent imported in module Lonely.",
        "",
        "",
      ]),
    );
  });
});
