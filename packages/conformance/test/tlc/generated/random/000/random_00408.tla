(*---
description: Evaluates a random int expression, seed 262, number 408.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00408 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b665 == (Head(<<3, 1, 2>>) * (0 * 2147483647)) IN ((2147483647 * -1) * Cardinality({2, 1, 3})) * (Head(SelectSeq(<<1>>, LAMBDA e : e > 0)) - Cardinality({1, 1}))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 84 to line 14, col 84 of module random_00408 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 73.
    | Expression starting at line 14, column 73.
    | ExtendableExpr starting at line 14, column 72.
    | Expression starting at line 14, column 72.
    | ExtendableExpr starting at line 14, column 71.
    | Fatal errors while parsing TLA+ spec in file random_00408
    | In module random_00408
    | Could not parse module random_00408 from file random_00408.tla
    | *** Errors: 1
    | In module random_00408
    | Could not parse module random_00408 from file random_00408.tla
    3002:1 Parsing or semantic analysis failed.
---*)
