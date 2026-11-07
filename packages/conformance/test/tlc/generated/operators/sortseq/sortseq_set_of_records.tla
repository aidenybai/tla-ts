(*---
description: sortseq applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/module/TLC.java#SortSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE sortseq_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([a : {1, 2}], LAMBDA a, b : a < b))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {[a |-> 1], [a |-> 2]}
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {[a |-> 1], [a |-> 2]}
---*)
