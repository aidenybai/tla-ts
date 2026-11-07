(*---
description: sortseq applied to record_nested, a RecordValue.
ref: tlc2/module/TLC.java#SortSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE sortseq_record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([a |-> [b |-> <<1>>]], LAMBDA a, b : a < b))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    [a |-> [b |-> <<1>>]]
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    [a |-> [b |-> <<1>>]]
---*)
