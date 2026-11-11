(*---
description: Evaluates a random bool expression, seed 262, number 5486.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05486 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b8485 \in (LET b8486 == (2 * -1) IN (b8486 + b8486) .. (CHOOSE b8487 \in (1..3 \cap Nat) : (FALSE /\ TRUE))) : (((-b8485) % (b8485 % b8485)) \subseteq ((CHOOSE b8488 \in {} : FALSE) .. ([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x])))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 47 to line 14, col 47 of module random_05486 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 45.
    | Expression starting at line 14, column 45.
    | ExtendableExpr starting at line 14, column 44.
    | Expression starting at line 14, column 44.
    | Definition starting at line 14, column 35.
    | Fatal errors while parsing TLA+ spec in file random_05486
    | In module random_05486
    | Could not parse module random_05486 from file random_05486.tla
    | *** Errors: 1
    | In module random_05486
    | Could not parse module random_05486 from file random_05486.tla
    3002:1 Parsing or semantic analysis failed.
---*)
