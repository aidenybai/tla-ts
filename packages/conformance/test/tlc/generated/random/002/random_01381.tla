(*---
description: Evaluates a random bool expression, seed 262, number 1381.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01381 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq([<<[a |-> 1], 2>> EXCEPT ![1] = (CHOOSE b2205 \in {x \in 1..3 : x > 1} : FALSE)], LAMBDA p, q : p < q) = [a |-> ((0 :> -1))[[[x \in Nat |-> x + 1] EXCEPT ![0] = -1]], b |-> (([a |-> 1] = [a |-> 1]) => (~FALSE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01381 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 58 to line 14, col 102 of module random_01381
---*)
