(*---
description: sortseq applied to subset, a SubsetValue.
ref: tlc2/module/TLC.java#SortSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE sortseq_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SUBSET {1, 2}, LAMBDA a, b : a < b))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {{}, {1}, {2}, {1, 2}}
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {{}, {1}, {2}, {1, 2}}
---*)
