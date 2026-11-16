(*---
description: Evaluates a random record expression, seed 262, number 8515.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08515 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> LET b13195 == (2 \div -1) IN (b13195 * -1), b |-> ((--1) < (1 < 7))] EXCEPT !.a = ((CASE TRUE -> 2 [] OTHER -> 1 - Len(<<1, 2>>)) * (({1, 2} \cap {2, 1, 3}) \cap {b13196 \in 1..3 : TRUE}))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 41 to line 14, col 44 of module random_08515 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 39.
    | Expression starting at line 14, column 39.
    | ExtendableExpr starting at line 14, column 38.
    | Expression starting at line 14, column 38.
    | Definition starting at line 14, column 28.
    | Fatal errors while parsing TLA+ spec in file random_08515
    | In module random_08515
    | Could not parse module random_08515 from file random_08515.tla
    | *** Errors: 1
    | In module random_08515
    | Could not parse module random_08515 from file random_08515.tla
    3002:1 Parsing or semantic analysis failed.
---*)
