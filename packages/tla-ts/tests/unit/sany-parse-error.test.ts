import { describe, expect, it } from "vite-plus/test";
import { getSanyParseError } from "../../src/sany-parse-error";

const toText = (lines: string[]) => lines.map((line) => `${line}\n`).join("");

// The modules come from the conformance corpora, and the expected reports are what SANY's parser
// prints for them after "***Parse Error***".
describe("getSanyParseError", () => {
  it("reports where a record constructor has an expression for a field name", () => {
    const source = `---- MODULE definition_parse_error ----
EXTENDS Integers
CONSTANT Limit
VARIABLE x
Bad == [a/b |-> 1]
Derived == Bad.a
Init == x = 0
Next == x < Limit /\\ x' = x + 1
Small == x <= Limit
====
`;
    expect(getSanyParseError(source)).toBe(
      toText([
        'Encountered "|->" at line 5, column 13 and token "b" ',
        "",
        "Residual stack trace follows:",
        "Some [] Form starting at line 5, column 8.",
        "ExtendableExpr starting at line 5, column 8.",
        "Expression starting at line 5, column 8.",
        "Definition starting at line 5, column 1.",
        "Module body starting at line 3, column 1.",
      ]),
    );
  });

  it("reports a LAMBDA outside an operator argument with what the parser expected", () => {
    const source = `---- MODULE lambda ----
EXTENDS Naturals

VARIABLES x

Init == x = 0

double == LAMBDA n : n * 2

Next == x' = double[x] /\\ x < 5

Inv == x <= 10 /\\ x >= 0

====
`;
    expect(getSanyParseError(source)).toBe(
      toText([
        'Was expecting "Expression or Instance"',
        'Encountered "LAMBDA" at line 8, column 11 and token "==" ',
        "",
        "Residual stack trace follows:",
        "Definition starting at line 8, column 1.",
        "Module body starting at line 4, column 1.",
        "Module definition starting at line 1, column 1.",
      ]),
    );
  });

  it("reports an unbounded declaration in a function constructor", () => {
    const source = `-------------------- MODULE FunctionConstructorOnlyBoundeds --------------------
(* Test that function constructors allow only bounded declarations. *)
f == [x \\in TRUE, y |-> TRUE]
================================================================================
`;
    expect(getSanyParseError(source)).toBe(
      toText([
        'Encountered "|->" at line 3, column 21 and token "y" ',
        "",
        "Residual stack trace follows:",
        "Quant Bound starting at line 3, column 19.",
        "Some [] Form starting at line 3, column 6.",
        "ExtendableExpr starting at line 3, column 6.",
        "Expression starting at line 3, column 6.",
        "Definition starting at line 3, column 1.",
      ]),
    );
  });

  it("reports an operator as a BY DEF item in the productions of a proof", () => {
    const source = `--------------- MODULE Operators_test -------------
z - y == z
z + y == z
THEOREM (z - y) = z
BY DEF - , +
=============================================================================
`;
    expect(getSanyParseError(source)).toBe(
      toText([
        'Encountered "," at line 5, column 10 and token "-" ',
        "",
        "Residual stack trace follows:",
        "ExtendableExpr starting at line 5, column 10.",
        "Expression starting at line 5, column 8.",
        "UseOrHideOrBy starting at line 5, column 1.",
        "Proof starting at line 5, column 1.",
        "Theorem starting at line 4, column 1.",
      ]),
    );
  });

  it("shows the tokens a failed two-token lookahead read", () => {
    const source = "---- MODULE Github1417Local ----\nLOCAL hidden hidden == 42\n====\n";
    expect(getSanyParseError(source)).toBe(
      toText([
        'Was expecting "LOCAL, INSTANCE, PROOF, ASSUMPTION, THEOREM, RECURSIVE, declaration, or definition"',
        'Encountered "LOCAL hidden" at line 2, column 1 and token "----" ',
        "",
        "Residual stack trace follows:",
        "Module body starting at line 2, column 1.",
        "Module definition starting at line 1, column 1.",
      ]),
    );
  });

  it("skips text before the module header", () => {
    const source = `CAUSES the translator to throw an exception

last modified on Sun 11 Dec 2005 at  0:30:16 UT by lamport

---------------------------- MODULE bug-05-12-10 ----------------------------
EXTENDS Naturals, Sequences, FiniteSets , TLC
`;
    expect(getSanyParseError(source)).toBe(
      toText([
        'Was expecting "----"',
        'Encountered "-" at line 5, column 40 and token "bug" ',
        "",
        "Residual stack trace follows:",
        "Begin module starting at line 5, column 1.",
        "Module definition starting at line 5, column 1.",
      ]),
    );
  });

  it("reports a file without a module header at its last character", () => {
    expect(getSanyParseError("CAUSES the translator to throw an exception\n")).toBe(
      toText([
        'Was expecting "---- MODULE (beginning of module)"',
        'Encountered "<EOF>" at line 1, column 44 and token "" ',
        "",
        "Residual stack trace follows:",
        "Begin module starting at line 1, column 44.",
        "Module definition starting at line 1, column 44.",
      ]),
    );
  });

  it("reports nothing for a module whose error SANY finds after parsing", () => {
    expect(getSanyParseError("---- MODULE Infix ----\nVARIABLE x\nOp == x @@ x\n====\n")).toBe(
      undefined,
    );
  });
});
