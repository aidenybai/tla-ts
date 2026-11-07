(*---
description: selectseq applied to record, a RecordValue.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE selectseq_record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([a |-> 1, b |-> 2], LAMBDA e : TRUE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    [a |-> 1, b |-> 2]
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    [a |-> 1, b |-> 2]
---*)
