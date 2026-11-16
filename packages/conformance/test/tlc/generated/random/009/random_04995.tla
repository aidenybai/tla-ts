(*---
description: Evaluates a random int expression, seed 262, number 4995.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04995 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SortSeq(Tail(SortSeq({1}, LAMBDA p, q : p < q)), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04995 failed.
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {1}
---*)
