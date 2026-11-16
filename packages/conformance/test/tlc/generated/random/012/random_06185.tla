(*---
description: Evaluates a random bool expression, seed 262, number 6185.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06185 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 + 7) % ([a |-> 1]).a) < (SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) - (CHOOSE b9519 \in 2..1 : FALSE))) => ([SubSeq(<<3, 1, 2>>, -1, 1) EXCEPT ![1] = (CHOOSE b9520 \in [x \in Nat |-> x + 1] : TRUE)] = ([<<5, 6>> EXCEPT ![7] = 0] @@ [b9521 \in {2, 1, 3} |-> b9521]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06185 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 92 to line 14, col 120 of module random_06185
---*)
