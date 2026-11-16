(*---
description: Evaluates a random bool expression, seed 262, number 3160.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03160 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({b5036 \in {b5037 \in {1} : TRUE} : (~FALSE)}) < Len([Tail(<<1>>) EXCEPT ![1] = (-1 * 0)])))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 83 to line 14, col 93 of module random_03160
    | FALSE
---*)
