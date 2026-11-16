(*---
description: Evaluates a random int expression, seed 262, number 9796.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09796 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(SortSeq(Tail([<<>> EXCEPT ![1] = 7]), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 35 to line 14, col 38 of module random_09796
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09796 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
