(*---
description: Evaluates a random int expression, seed 262, number 6864.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06864 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-7) % Head(<<>>)) \div Len(<<-1, 1>>)) - (((CHOOSE b10528 \in Nat : TRUE) - (0 + 3)) * ((3 \div -1) + (7 * 3)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 111 to line 14, col 114 of module random_06864 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 109.
    | Expression starting at line 14, column 109.
    | ExtendableExpr starting at line 14, column 108.
    | Expression starting at line 14, column 108.
    | ExtendableExpr starting at line 14, column 107.
    | Fatal errors while parsing TLA+ spec in file random_06864
    | In module random_06864
    | Could not parse module random_06864 from file random_06864.tla
    | *** Errors: 1
    | In module random_06864
    | Could not parse module random_06864 from file random_06864.tla
    3002:1 Parsing or semantic analysis failed.
---*)
