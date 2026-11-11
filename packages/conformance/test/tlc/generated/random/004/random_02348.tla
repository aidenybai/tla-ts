(*---
description: Evaluates a random bool expression, seed 262, number 2348.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02348 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) < Head([Tail(<<1>>) EXCEPT ![1] = Len(<<>>)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 66 to line 14, col 76 of module random_02348
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02348 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
