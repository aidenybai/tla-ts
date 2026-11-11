(*---
description: Evaluates a random int expression, seed 262, number 8222.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08222 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality((Len({b12721 : b12721 \in {2, 1, 3}}) .. ((CHOOSE b12722 \in 1..3 : FALSE) * (1 * 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08222 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    {1, 2, 3}
---*)
