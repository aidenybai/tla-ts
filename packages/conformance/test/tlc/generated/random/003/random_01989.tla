(*---
description: Evaluates a random seq expression, seed 262, number 1989.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01989 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([<<(CHOOSE b3153 \in {1} : FALSE), (-2147483647)>> EXCEPT ![1] = ((CHOOSE b3154 \in {1, 2} : FALSE) % (FALSE => TRUE))], LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01989 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 28 to line 14, col 55 of module random_01989
---*)
