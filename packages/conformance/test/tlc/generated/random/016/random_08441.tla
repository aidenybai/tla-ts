(*---
description: Evaluates a random seq expression, seed 262, number 8441.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08441 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SelectSeq(([<<>> EXCEPT ![1] = 7] \o SubSeq([a |-> 1], 1, -1)), LAMBDA e : e > 0), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 36 to line 14, col 39 of module random_08441
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08441 failed.
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    [a |-> 1]
---*)
