(*---
description: Evaluates a random seq expression, seed 262, number 3516.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03516 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([[(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = @ + ([a |-> 1]).a] EXCEPT !.a = @ + ((2147483647 \div -1) + (2147483647 * 1))], LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 132 to line 14, col 135 of module random_03516 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 121.
    | Expression starting at line 14, column 121.
    | ExtendableExpr starting at line 14, column 120.
    | Expression starting at line 14, column 120.
    | ExtendableExpr starting at line 14, column 119.
    | Fatal errors while parsing TLA+ spec in file random_03516
    | In module random_03516
    | Could not parse module random_03516 from file random_03516.tla
    | *** Errors: 1
    | In module random_03516
    | Could not parse module random_03516 from file random_03516.tla
    3002:1 Parsing or semantic analysis failed.
---*)
