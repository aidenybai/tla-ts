(*---
description: Evaluates a random set expression, seed 262, number 2812.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02812 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {(({1} \ SUBSET {1}) \cap ({} \ SUBSET {1})), ((CHOOSE b4463 \in Nat : FALSE) .. ([a |-> 1]).a)} \ UNION {(({2, 1, 3} \cap {}) \cap ({1, 2} \cap 1..3)), [b4464 \in (2..1 .. 7) |-> LET b4465 == 0 IN 7]}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops .. in block line 14, col 189 to line 14, col 190 of module random_02812 and ...
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 191.
    | ExtendableExpr starting at line 14, column 188.
    | Expression starting at line 14, column 188.
    | ExtendableExpr starting at line 14, column 187.
    | Expression starting at line 14, column 187.
    | Fatal errors while parsing TLA+ spec in file random_02812
    | In module random_02812
    | Could not parse module random_02812 from file random_02812.tla
    | *** Errors: 1
    | In module random_02812
    | Could not parse module random_02812 from file random_02812.tla
    3002:1 Parsing or semantic analysis failed.
---*)
