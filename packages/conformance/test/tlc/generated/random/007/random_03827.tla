(*---
description: Evaluates a random seq expression, seed 262, number 3827.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03827 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([<<(CHOOSE b6031 \in {2, 1, 3} : TRUE), (-7)>> EXCEPT ![1] = (CHOOSE b6032 \in {b6033 \in 1..3 : TRUE} : (b6032 < b6032))], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03827 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 88 to line 14, col 145 of module random_03827
---*)
