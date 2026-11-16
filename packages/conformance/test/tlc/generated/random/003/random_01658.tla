(*---
description: Evaluates a random function expression, seed 262, number 1658.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01658 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b2645 == Len((CHOOSE r \in [a : {1, 2}] : TRUE)) IN Cardinality((2..1 \ {1, 2})) :> (((-1 + 2147483647) * (CHOOSE b2646 \in 2..1 : FALSE)) % ([[x \in Nat |-> x + 1] EXCEPT ![-1] = 2..1] @@ ([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01658 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 128 to line 14, col 156 of module random_01658
---*)
