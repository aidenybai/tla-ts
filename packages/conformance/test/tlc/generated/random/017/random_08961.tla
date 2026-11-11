(*---
description: Evaluates a random int expression, seed 262, number 8961.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08961 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(-({b13895 : b13895 \in 2..1} + (CHOOSE b13896 \in {} : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08961 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 51 to line 14, col 77 of module random_08961
---*)
