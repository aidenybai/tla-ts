(*---
description: Evaluates a random seq expression, seed 262, number 948.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00948 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq(Tail(Tail(<<3, 1, 2>>)), LAMBDA p, q : p < q) \o [Append(Tail(<<>>), (1 * -1)) EXCEPT ![1] = ((0 % 1) \div (CHOOSE b1524 \in 1..3 : TRUE))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 97 to line 14, col 97 of module random_00948 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 95.
    | Expression starting at line 14, column 95.
    | ExtendableExpr starting at line 14, column 94.
    | Expression starting at line 14, column 94.
    | Optional Arguments starting at line 14, column 81.
    | Fatal errors while parsing TLA+ spec in file random_00948
    | In module random_00948
    | Could not parse module random_00948 from file random_00948.tla
    | *** Errors: 1
    | In module random_00948
    | Could not parse module random_00948 from file random_00948.tla
    3002:1 Parsing or semantic analysis failed.
---*)
