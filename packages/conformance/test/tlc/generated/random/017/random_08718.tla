(*---
description: Evaluates a random bool expression, seed 262, number 8718.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08718 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((2147483647 \div -1) = (-2147483647)) THEN (IF TRUE THEN 0 ELSE 2 - [<<1, 2>> EXCEPT ![1] = 1]) ELSE (Cardinality({1}) * LET b13498 == 3 IN -1) \in ((({2, 1, 3} \cap {1}) \ DOMAIN <<5, 6>>) \ {b13499 \in {-1 : b13500 \in {1}} : (\A b13501 \in {1} : TRUE)})))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 33 to line 14, col 36 of module random_08718 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 22.
    | Expression starting at line 14, column 22.
    | ExtendableExpr starting at line 14, column 21.
    | Expression starting at line 14, column 21.
    | ExtendableExpr starting at line 14, column 20.
    | Fatal errors while parsing TLA+ spec in file random_08718
    | In module random_08718
    | Could not parse module random_08718 from file random_08718.tla
    | *** Errors: 1
    | In module random_08718
    | Could not parse module random_08718 from file random_08718.tla
    3002:1 Parsing or semantic analysis failed.
---*)
