(*---
description: Evaluates a random seq expression, seed 262, number 6021.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06021 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([((7 :> 2147483647) @@ (CHOOSE f \in [2..1 -> {1}] : TRUE)) EXCEPT ![1] = Cardinality({b9277 : b9277 \in {1}})], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 28 to line 14, col 83 of module random_06021
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06021 failed.
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    (7 :> 2147483647)
---*)
