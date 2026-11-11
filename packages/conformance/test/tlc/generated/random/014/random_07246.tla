(*---
description: Evaluates a random bool expression, seed 262, number 7246.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07246 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-(Cardinality({1}) * (0 * -1))) < ([[[a |-> 1] EXCEPT !.a = @ + 3] EXCEPT !.a = @ + (2147483647 \div 7)]).a))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 42 to line 14, col 42 of module random_07246 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 40.
    | Expression starting at line 14, column 40.
    | ExtendableExpr starting at line 14, column 39.
    | ExtendableExpr starting at line 14, column 20.
    | Expression starting at line 14, column 20.
    | Fatal errors while parsing TLA+ spec in file random_07246
    | In module random_07246
    | Could not parse module random_07246 from file random_07246.tla
    | *** Errors: 1
    | In module random_07246
    | Could not parse module random_07246 from file random_07246.tla
    3002:1 Parsing or semantic analysis failed.
---*)
