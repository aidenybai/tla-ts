(*---
description: subseq applied to record, a RecordValue.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseq_record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([a |-> 1, b |-> 2], 1, 1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    [a |-> 1, b |-> 2]
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    [a |-> 1, b |-> 2]
---*)
