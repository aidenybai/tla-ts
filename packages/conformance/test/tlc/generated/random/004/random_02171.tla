(*---
description: Evaluates a random int expression, seed 262, number 2171.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02171 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b3426 == (((7 \div 2147483647) + (1 + 3)) + ((0 \div -1) - (--1))) IN ([({1, 2} = {1, 2}) EXCEPT !.a = (1 * b3426)]).a)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 68 to line 14, col 71 of module random_02171 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 66.
    | Expression starting at line 14, column 66.
    | ExtendableExpr starting at line 14, column 65.
    | Expression starting at line 14, column 65.
    | ExtendableExpr starting at line 14, column 64.
    | Fatal errors while parsing TLA+ spec in file random_02171
    | In module random_02171
    | Could not parse module random_02171 from file random_02171.tla
    | *** Errors: 1
    | In module random_02171
    | Could not parse module random_02171 from file random_02171.tla
    3002:1 Parsing or semantic analysis failed.
---*)
