(*---
description: Evaluates a random seq expression, seed 262, number 2022.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02022 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SortSeq(((0 \div -1) \subseteq {2, 7}), LAMBDA p, q : p < q), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 36 to line 14, col 39 of module random_02022 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 34.
    | Expression starting at line 14, column 34.
    | ExtendableExpr starting at line 14, column 33.
    | Expression starting at line 14, column 33.
    | ExtendableExpr starting at line 14, column 32.
    | Fatal errors while parsing TLA+ spec in file random_02022
    | In module random_02022
    | Could not parse module random_02022 from file random_02022.tla
    | *** Errors: 1
    | In module random_02022
    | Could not parse module random_02022 from file random_02022.tla
    3002:1 Parsing or semantic analysis failed.
---*)
