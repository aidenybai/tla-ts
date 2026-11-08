(*---
description: sortseq applied to set_filter, a SetPredValue.
ref: tlc2/module/TLC.java#SortSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE sortseq_set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq({x \in 1..3 : x > 1}, LAMBDA a, b : a < b))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module sortseq_set_filter failed.
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {2, 3}
---*)
