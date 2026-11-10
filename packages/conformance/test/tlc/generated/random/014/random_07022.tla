(*---
description: Evaluates a random int expression, seed 262, number 7022.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07022 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{} -> {1, 2}] : TRUE))[(((3 * -1) * (2147483647 \div 7)) - Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 60 to line 14, col 60 of module random_07022 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 58.
    | Expression starting at line 14, column 58.
    | ExtendableExpr starting at line 14, column 57.
    | Expression starting at line 14, column 57.
    | ExtendableExpr starting at line 14, column 56.
    | Fatal errors while parsing TLA+ spec in file random_07022
    | In module random_07022
    | Could not parse module random_07022 from file random_07022.tla
    | *** Errors: 1
    | In module random_07022
    | Could not parse module random_07022 from file random_07022.tla
    3002:1 Parsing or semantic analysis failed.
---*)
