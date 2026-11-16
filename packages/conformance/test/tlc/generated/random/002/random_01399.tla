(*---
description: Evaluates a random function expression, seed 262, number 1399.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01399 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SortSeq(SubSeq((<<3, 1, 2>> \o <<1>>), (0 * 1), (7 \div -1)), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 71 to line 14, col 74 of module random_01399 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 69.
    | Expression starting at line 14, column 69.
    | ExtendableExpr starting at line 14, column 68.
    | Expression starting at line 14, column 68.
    | Optional Arguments starting at line 14, column 34.
    | Fatal errors while parsing TLA+ spec in file random_01399
    | In module random_01399
    | Could not parse module random_01399 from file random_01399.tla
    | *** Errors: 1
    | In module random_01399
    | Could not parse module random_01399 from file random_01399.tla
    3002:1 Parsing or semantic analysis failed.
---*)
