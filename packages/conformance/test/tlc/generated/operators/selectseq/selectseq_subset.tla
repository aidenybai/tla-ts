(*---
description: selectseq applied to subset, a SubsetValue.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE selectseq_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SUBSET {1, 2}, LAMBDA e : TRUE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    {{}, {1}, {2}, {1, 2}}
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    {{}, {1}, {2}, {1, 2}}
---*)
