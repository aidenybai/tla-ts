(*---
description: Evaluates a random seq expression, seed 262, number 1806.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01806 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([a |-> ((0 % 7) * ([x \in Nat |-> x + 1])[7]), b |-> (<<7, 2147483647>> = (CHOOSE f \in [{2, 1, 3} -> {}] : TRUE))], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01806 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 101 to line 14, col 137 of module random_01806
---*)
