(*---
description: Evaluates a random function expression, seed 262, number 9522.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09522 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[CASE TRUE -> 0 [] OTHER -> 3 EXCEPT !.a = Cardinality({1})] EXCEPT !.a = ((3 + 3) \div ({1} \div 2))] EXCEPT !.a = @ + LET b14790 == ([a |-> 0, b |-> FALSE]).a IN ((1 * -1) - (0 - 2147483647))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 186 to line 14, col 186 of module random_09522 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 184.
    | Expression starting at line 14, column 184.
    | ExtendableExpr starting at line 14, column 183.
    | Expression starting at line 14, column 183.
    | ExtendableExpr starting at line 14, column 182.
    | Fatal errors while parsing TLA+ spec in file random_09522
    | In module random_09522
    | Could not parse module random_09522 from file random_09522.tla
    | *** Errors: 1
    | In module random_09522
    | Could not parse module random_09522 from file random_09522.tla
    3002:1 Parsing or semantic analysis failed.
---*)
