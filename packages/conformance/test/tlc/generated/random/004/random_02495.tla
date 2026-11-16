(*---
description: Evaluates a random bool expression, seed 262, number 2495.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02495 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SortSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q) \o SortSeq((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE), LAMBDA p, q : p < q)) = ((-([x \in 1..2 |-> x])[7]) :> Cardinality((1..3 \cap 1..3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02495 failed.
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    [a |-> 2]
---*)
