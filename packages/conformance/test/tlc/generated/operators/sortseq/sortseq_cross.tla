(*---
description: sortseq applied to cross, a SetOfTuplesValue.
ref: tlc2/module/TLC.java#SortSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE sortseq_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq({1, 2} \X {3}, LAMBDA a, b : a < b))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {<<1, 3>>, <<2, 3>>}
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {<<1, 3>>, <<2, 3>>}
---*)
