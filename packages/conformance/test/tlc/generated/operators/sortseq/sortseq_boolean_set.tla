(*---
description: sortseq applied to boolean_set, a SetEnumValue.
ref: tlc2/module/TLC.java#SortSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE sortseq_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(BOOLEAN, LAMBDA a, b : a < b))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {FALSE, TRUE}
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {FALSE, TRUE}
---*)
