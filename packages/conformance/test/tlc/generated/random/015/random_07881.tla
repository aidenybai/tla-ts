(*---
description: Evaluates a random set expression, seed 262, number 7881.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07881 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SubSeq([[<<3, 1, 2>> EXCEPT ![1] = 2] EXCEPT ![1] = (-2147483647)], ((CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE) * Cardinality({1})), ([[x \in 1..2 |-> x] EXCEPT ![1] = 2147483647] < (2 % 7))), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07881 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 96 to line 14, col 134 of module random_07881
---*)
