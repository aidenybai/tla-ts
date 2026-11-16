(*---
description: Evaluates a random bool expression, seed 262, number 2127.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02127 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) EXCEPT ![1] = (-3)] \o (CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE)) = (((0 \in Nat) \/ (\A b3372 \in 1..3 : TRUE)) => ({3, 3} = DOMAIN (1 :> 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02127 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 85 to line 14, col 123 of module random_02127
---*)
