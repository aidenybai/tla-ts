(*---
description: Evaluates a random set expression, seed 262, number 2241.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02241 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : 2..1] : TRUE) .. (CHOOSE b3524 \in {([a |-> 1]).a : b3525 \in {b3526 : b3526 \in {1, 2}}} : ([a |-> 2, b |-> FALSE] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02241 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 47 of module random_02241
---*)
