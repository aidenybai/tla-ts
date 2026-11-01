import { describe, expect, it } from "vite-plus/test";
import { getSanyParseError } from "../../src/sany-parse-error";

const toText = (lines: string[]) =>
  `***Parse Error***\n${lines.map((line) => `${line}\n`).join("")}`;

// The modules come from the conformance corpora unless they test one of the checks SANY's parser
// makes as it builds the syntax tree, and the expected reports are what SANY's parser prints for
// them.
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

  it.each([
    {
      check: "a precedence conflict",
      body: "F == a = b = c",
      report: [
        "",
        "  Precedence conflict between ops = in block line 2, col 8 to line 2, col 8 of module Test and =.",
        "",
        "Residual stack trace follows:",
        "ExtendableExpr starting at line 2, column 10.",
        "ExtendableExpr starting at line 2, column 6.",
        "Expression starting at line 2, column 6.",
        "Definition starting at line 2, column 1.",
        "Module body starting at line 2, column 1.",
      ],
    },
    {
      check: "a precedence conflict with a prefix minus",
      body: "F == x ^ -y",
      report: [
        "",
        "  Precedence conflict between ops ^ in block line 2, col 8 to line 2, col 8 of module Test and -..",
        "",
        "Residual stack trace follows:",
        "ExtendableExpr starting at line 2, column 6.",
        "Expression starting at line 2, column 6.",
        "Definition starting at line 2, column 1.",
        "Module body starting at line 2, column 1.",
        "Module definition starting at line 1, column 1.",
      ],
    },
    {
      check: "a precedence conflict with a postfix operator",
      body: "F == ENABLED x'",
      report: [
        "Precedence conflict between ops ENABLED in block line 2, col 15 to line 2, col 15 of module Test and '.",
        "",
        "Residual stack trace follows:",
        "ExtendableExpr starting at line 2, column 14.",
        "Expression starting at line 2, column 6.",
        "Definition starting at line 2, column 1.",
        "Module body starting at line 2, column 1.",
        "Module definition starting at line 1, column 1.",
      ],
    },
    {
      check: "expressions without an operator between them",
      body: "F == f[x \\in S |-> 1]",
      report: [
        "Expression at location line 2, col 6 to line 2, col 6 of module Test and expression at location line 2, col 7 to line 2, col 21 of module Test follow each other without any intervening operator.",
        "",
        "Residual stack trace follows:",
        "Definition starting at line 2, column 1.",
        "Module body starting at line 2, column 1.",
        "Module definition starting at line 1, column 1.",
      ],
    },
    {
      check: "an expression after a postfix operator",
      body: "F == a' [b -> c]",
      report: [
        "",
        " Error following expression at  line 2, col 7 to line 2, col 7 of module Test, missing operator or separator.",
        "",
        "Residual stack trace follows:",
        "Definition starting at line 2, column 1.",
        "Module body starting at line 2, column 1.",
        "Module definition starting at line 1, column 1.",
      ],
    },
    {
      check: "a = that may be a mistyped ==",
      body: "F == a'\n  [b -> c] = 1",
      report: [
        "",
        "  *** Hint *** You may have mistyped ==",
        "  Illegal combination of operators ' in block line 2, col 7 to line 2, col 7 of module Test and =.",
        "",
        "Residual stack trace follows:",
        "ExtendableExpr starting at line 2, column 6.",
        "Expression starting at line 2, column 6.",
        "Definition starting at line 2, column 1.",
        "Module body starting at line 2, column 1.",
        "Module definition starting at line 1, column 1.",
      ],
    },
    {
      check: "a junction item that is not indented",
      body: "F == /\\ x = [a |-> 1,\nb |-> 2]\n     /\\ y",
      report: [
        "Item at line 3, col 1 to line 3, col 7 of module Test is not properly indented inside conjunction or  disjunction list item at line 2, col 6 to line 3, col 8 of module Test",
        "",
        "Residual stack trace follows:",
        "AND-OR Junction starting at line 2, column 6.",
        "ExtendableExpr starting at line 2, column 6.",
        "Expression starting at line 2, column 6.",
        "Definition starting at line 2, column 1.",
        "Module body starting at line 2, column 1.",
      ],
    },
    {
      check: "a :: after something other than a label",
      body: "F == x' :: y",
      report: [
        "`::' at line 2, col 9 to line 2, col 10 of module Test does not follow a label.",
        "",
        "Residual stack trace follows:",
        "ExtendableExpr starting at line 2, column 6.",
        "Expression starting at line 2, column 6.",
        "Definition starting at line 2, column 1.",
        "Module body starting at line 2, column 1.",
        "Module definition starting at line 1, column 1.",
      ],
    },
    {
      check: "a label whose removal would change the parse",
      body: "F == a * l(u, v) :: b + c",
      report: [
        "Removing label at line 2, col 10 to line 2, col 16 of module Test would change expression parsing.",
        "",
        "Residual stack trace follows:",
        "ExtendableExpr starting at line 2, column 10.",
        "ExtendableExpr starting at line 2, column 6.",
        "Expression starting at line 2, column 6.",
        "Definition starting at line 2, column 1.",
        "Module body starting at line 2, column 1.",
      ],
    },
    {
      check: "a declared operator with a domain",
      body: "THEOREM ASSUME NEW F(_, _) \\in S PROVE TRUE",
      report: [
        "declared symbol with arguments before \\in at line 2, col 20 to line 2, col 26 of module Test",
        "",
        "Residual stack trace follows:",
        "NEW symbol declaration starting at line 2, column 16.",
        "Assume-Prove starting at line 2, column 9.",
        "Theorem starting at line 2, column 1.",
        "Module body starting at line 2, column 1.",
        "Module definition starting at line 1, column 1.",
      ],
    },
    {
      check: "a proof of a step that takes none",
      body: "THEOREM TRUE\n<1>1. HAVE TRUE\n  OBVIOUS\n<1>2. QED",
      report: [
        "line 3, col 7 to line 3, col 15 of module Test: proof of step that does not take a proof.",
        "",
        "Residual stack trace follows:",
        "Step starting at line 3, column 1.",
        "Proof starting at line 3, column 1.",
        "Theorem starting at line 2, column 1.",
        "Module body starting at line 2, column 1.",
        "Module definition starting at line 1, column 1.",
      ],
    },
    {
      check: "a decimal number as a structural term",
      body: "F == y!1.5",
      report: [
        "Illegal structural term at line 2, col 8 to line 2, col 10 of module Test",
        "",
        "Residual stack trace follows:",
        "Bang Extension starting at line 2, column 7.",
        "Primitive expression starting at line 2, column 6.",
        "ExtendableExpr starting at line 2, column 6.",
        "Expression starting at line 2, column 6.",
        "Definition starting at line 2, column 1.",
      ],
    },
    {
      check: "a set of all whose expression is a membership",
      body: "S == {1 \\in x : x \\in T}",
      report: [
        "Form {a \\in b : c \\in d }, at line 2, is not allowed",
        "",
        "Residual stack trace follows:",
        "Some { } form starting at line 2, column 6.",
        "ExtendableExpr starting at line 2, column 6.",
        "Expression starting at line 2, column 6.",
        "Definition starting at line 2, column 1.",
        "Module body starting at line 2, column 1.",
      ],
    },
  ])("reports $check", (testCase) => {
    expect(getSanyParseError(`---- MODULE Test ----\n${testCase.body}\n====\n`)).toBe(
      toText(testCase.report),
    );
  });

  // The modules and messages come from SANY.
  it.each([
    [
      "a character no token starts with",
      "x == 1 ; 2\n====\n",
      'Lexical error at line 2, column 8.  Encountered: ";" (59), after : ""',
    ],
    [
      "a token prefix",
      'x == "a" ?\n====\n',
      'Lexical error at line 2, column 11.  Encountered: "\\n" (10), after : "?"',
    ],
    [
      "an invalid escape",
      'x == "a\\qb"\n====\n',
      'Lexical error at line 2, column 9.  Encountered: "q" (113), after : "\\"a\\\\"',
    ],
    [
      "a string at the end of the file",
      'x == "abc',
      'Lexical error at line 2, column 10.  Encountered: <EOF> after : "\\"abc"',
    ],
    [
      "a comment that ends the last line",
      "(* abc\n",
      'Lexical error at line 3, column 0.  Encountered: <EOF> after : ""',
    ],
    [
      "an end-of-line comment at the end of the file",
      "x == 1 \\* abc",
      'Lexical error at line 2, column 14.  Encountered: <EOF> after : ""',
    ],
    [
      "a comment open over lines",
      "(* abc\n\n",
      "Lexical {error: EOF reached, possibly open comment starting around line 2",
    ],
    [
      "a comment open after a nested comment",
      "(* \n(* \n *) abc\n\n",
      "Lexical {error: EOF reached, possibly open comment starting around line 4",
    ],
  ])("reports the lexical error of %s", (_, body, message) => {
    expect(getSanyParseError(`---- MODULE M ----\n${body}`)).toBe(message);
  });

  it("reports a parse error for a comment that ends the file with a bracket", () => {
    expect(getSanyParseError("---- MODULE M ----\nx == 1\n(* abc (* d *)")).toMatch(
      /^\*\*\*Parse Error\*\*\*\n/,
    );
  });

  it("reports the parse error before a lexical error in a token the parser never reads", () => {
    expect(getSanyParseError("---- MODULE M ----\nOp == LET a == 1\n====\n\\* abc")).toBe(
      toText([
        'Encountered "====" at line 3, column 1 and token "1" ',
        "",
        "Residual stack trace follows:",
        "Case Other Arm starting at line 2, column 7.",
        "Expression starting at line 2, column 7.",
        "Definition starting at line 2, column 1.",
        "Module body starting at line 2, column 1.",
        "Module definition starting at line 1, column 1.",
      ]),
    );
  });

  it("reports nothing for a module whose error SANY finds after parsing", () => {
    expect(getSanyParseError("---- MODULE Infix ----\nVARIABLE x\nOp == x @@ x\n====\n")).toBe(
      undefined,
    );
  });
});
