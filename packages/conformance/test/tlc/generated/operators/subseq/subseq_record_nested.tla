(*---
description: subseq applied to record_nested, a RecordValue.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseq_record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([a |-> [b |-> <<1>>]], 1, 1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    [a |-> [b |-> <<1>>]]
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    [a |-> [b |-> <<1>>]]
---*)
