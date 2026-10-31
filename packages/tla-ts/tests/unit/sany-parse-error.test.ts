import { describe, expect, it } from "vite-plus/test";
import { getSanyParseError } from "../../src/sany-parse-error";

// Each module with the message SANY's parser in tla2tools.jar prints for it.
const CASES: [string, string, string | undefined][] = [
  [
    "a module SANY parses",
    `---- MODULE U01 ----
VARIABLE x
Init == x = 0
====
`,
    undefined,
  ],
  [
    "a token the grammar does not allow",
    `---- MODULE U02 ----
Foo == [a |-> 1, b |-> ]
====
`,
    `***Parse Error***
Encountered "]" at line 2, column 24 and token "|->" 

Residual stack trace follows:
ExtendableExpr starting at line 2, column 24.
Expression starting at line 2, column 24.
Field Value starting at line 2, column 18.
Some [] Form starting at line 2, column 8.
ExtendableExpr starting at line 2, column 8.
`,
  ],
  [
    "the production SANY expected",
    `---- MODULE U03 ----
Foo ==
====
`,
    `***Parse Error***
Was expecting "==== or more Module body"
Encountered "Foo" at line 2, column 1 and token "----" 

Residual stack trace follows:
Module definition starting at line 1, column 1.
`,
  ],
  [
    "several tokens from a lookahead",
    `---- MODULE U24 ----
THEOREM ASSUME NEW , x PROVE TRUE
====
`,
    `***Parse Error***
Was expecting "Identifier, Assume-Prove or Expression"
Encountered "ASSUME NEW ," at line 2, column 9 and token "THEOREM" 

Residual stack trace follows:
Theorem starting at line 2, column 1.
Module body starting at line 2, column 1.
Module definition starting at line 1, column 1.
`,
  ],
  [
    "tokens from the module body lookahead",
    `---- MODULE U25 ----
Foo == 1
----
THEOREM OBVIOUS
====
`,
    `***Parse Error***
Encountered "THEOREM OBVIOUS" at line 4, column 1 and token "----" 

Residual stack trace follows:
Module body starting at line 2, column 1.
Module definition starting at line 1, column 1.
`,
  ],
  [
    "a precedence conflict",
    `---- MODULE U04 ----
Foo == 1 \\land 2 \\lor 3
====
`,
    `***Parse Error***

  Precedence conflict between ops \\land in block line 2, col 10 to line 2, col 14 of module U04 and \\lor.

Residual stack trace follows:
ExtendableExpr starting at line 2, column 16.
ExtendableExpr starting at line 2, column 8.
Expression starting at line 2, column 8.
Definition starting at line 2, column 1.
Module body starting at line 2, column 1.
`,
  ],
  [
    "a label that is not one",
    `---- MODULE U06 ----
Foo == x + 1 :: y
====
`,
    `***Parse Error***
\`::' at line 2, col 14 to line 2, col 15 of module U06 does not follow a label.

Residual stack trace follows:
ExtendableExpr starting at line 2, column 12.
ExtendableExpr starting at line 2, column 8.
Expression starting at line 2, column 8.
Definition starting at line 2, column 1.
Module body starting at line 2, column 1.
`,
  ],
  [
    "a fairness expression without a subscript",
    `---- MODULE U07 ----
Spec == WF_x
====
`,
    `***Parse Error***
Ill-structured fairness expression at line 2, column 9

Residual stack trace follows:
ExtendableExpr starting at line 2, column 9.
Expression starting at line 2, column 9.
Definition starting at line 2, column 1.
Module body starting at line 2, column 1.
Module definition starting at line 1, column 1.
`,
  ],
  [
    "\\X as an operator argument",
    `---- MODULE U09 ----
Foo == F(\\times)
====
`,
    `***Parse Error***
line 2, col 10 to line 2, col 15 of module U09: \\X may not be used as an infix operator.

Residual stack trace follows:
Optional Arguments starting at line 2, column 9.
Primitive expression starting at line 2, column 8.
ExtendableExpr starting at line 2, column 8.
Expression starting at line 2, column 8.
Definition starting at line 2, column 1.
`,
  ],
  [
    "a set of all with a membership element",
    `---- MODULE U13 ----
Foo == {(a) \\in S : b \\in T}
====
`,
    `***Parse Error***
Form {a \\in b : c \\in d }, at line 2, is not allowed

Residual stack trace follows:
Some { } form starting at line 2, column 8.
ExtendableExpr starting at line 2, column 8.
Expression starting at line 2, column 8.
Definition starting at line 2, column 1.
Module body starting at line 2, column 1.
`,
  ],
  [
    "an item left of its conjunction",
    `---- MODULE U17 ----
Foo == /\\ [
a |->           1]
====
`,
    `***Parse Error***
Item at line 3, col 1 to line 3, col 17 of module U17 is not properly indented inside conjunction or  disjunction list item at line 2, col 8 to line 3, col 18 of module U17

Residual stack trace follows:
AND-OR Junction starting at line 2, column 8.
ExtendableExpr starting at line 2, column 8.
Expression starting at line 2, column 8.
Definition starting at line 2, column 1.
Module body starting at line 2, column 1.
`,
  ],
  [
    "a step number outside a proof",
    `---- MODULE U20 ----
Foo == <1>2
====
`,
    `***Parse Error***
line 2, col 8 to line 2, col 11 of module U20: Step number used outside proof.

Residual stack trace follows:
Primitive expression starting at line 2, column 8.
ExtendableExpr starting at line 2, column 8.
Expression starting at line 2, column 8.
Definition starting at line 2, column 1.
Module body starting at line 2, column 1.
`,
  ],
  [
    "a decimal structural term",
    `---- MODULE U22 ----
Foo == x!1.5
====
`,
    `***Parse Error***
Illegal structural term at line 2, col 10 to line 2, col 12 of module U22

Residual stack trace follows:
Bang Extension starting at line 2, column 9.
Primitive expression starting at line 2, column 8.
ExtendableExpr starting at line 2, column 8.
Expression starting at line 2, column 8.
Definition starting at line 2, column 1.
`,
  ],
  [
    "an error SANY records and continues past",
    `---- MODULE U14 ----
Foo == [x EXCEPT !.@ = 1]
====
`,
    `@ used in !.@`,
  ],
  [
    "a character no token starts with",
    `---- MODULE U11 ----
Foo == x ? y
====
`,
    `Lexical error at line 2, column 11.  Encountered: " " (32), after : "?"`,
  ],
  [
    "an unterminated string",
    `---- MODULE U16 ----
Foo == "abc
====
`,
    `Lexical error at line 2, column 12.  Encountered: "\\n" (10), after : "\\"abc"`,
  ],
  [
    "a comment open at the end of the file",
    `---- MODULE U28 ----
VARIABLE x
Init == x = 0 (* open
comment
`,
    `Lexical {error: EOF reached, possibly open comment starting around line 3`,
  ],
];

describe("getSanyParseError reports a module SANY cannot parse like SANY", () => {
  it.each(CASES)("reports %s", (_, source, message) => {
    expect(getSanyParseError(source)).toBe(message);
  });
});
