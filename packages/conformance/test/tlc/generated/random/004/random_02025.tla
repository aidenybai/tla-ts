(*---
description: Evaluates a random record expression, seed 262, number 2025.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02025 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + (CASE (FALSE <=> TRUE) -> LET b3215 == 2 IN 0 [] OTHER -> (1 * 7) * (-(2 * -1)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 145 to line 14, col 145 of module random_02025 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 143.
    | Expression starting at line 14, column 143.
    | ExtendableExpr starting at line 14, column 142.
    | Expression starting at line 14, column 141.
    | ExtendableExpr starting at line 14, column 140.
    | Fatal errors while parsing TLA+ spec in file random_02025
    | In module random_02025
    | Could not parse module random_02025 from file random_02025.tla
    | *** Errors: 1
    | In module random_02025
    | Could not parse module random_02025 from file random_02025.tla
    3002:1 Parsing or semantic analysis failed.
---*)
