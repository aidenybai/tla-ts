(*---
description: sortseq applied to set_of_functions, a SetOfFcnsValue.
ref: tlc2/module/TLC.java#SortSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE sortseq_set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([{1} -> {2, 3}], LAMBDA a, b : a < b))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {<<2>>, <<3>>}
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {<<2>>, <<3>>}
---*)
