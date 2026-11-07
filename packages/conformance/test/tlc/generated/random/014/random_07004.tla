(*---
description: Evaluates a random set expression, seed 262, number 7004.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07004 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b10735 \in {(CHOOSE b10736 \in 1..3 : FALSE), (0 % 7)} : {[<<1, 2>> EXCEPT ![1] = b10735] : b10737 \in UNION {{2, 1, 3}, {}}}} \cap (((0 * -1) .. Len(<<1>>)) \cup ((2 + 2) .. ([x \in 1..2 |-> x])[2]))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 155 to line 14, col 155 of module random_07004 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 153.
    | Expression starting at line 14, column 153.
    | ExtendableExpr starting at line 14, column 152.
    | Expression starting at line 14, column 152.
    | ExtendableExpr starting at line 14, column 151.
    | Fatal errors while parsing TLA+ spec in file random_07004
    | In module random_07004
    | Could not parse module random_07004 from file random_07004.tla
    | *** Errors: 1
    | In module random_07004
    | Could not parse module random_07004 from file random_07004.tla
    3002:1 Parsing or semantic analysis failed.
---*)
