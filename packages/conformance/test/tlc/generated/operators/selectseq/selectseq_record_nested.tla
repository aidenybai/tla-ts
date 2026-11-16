(*---
description: selectseq applied to record_nested, a RecordValue.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE selectseq_record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([a |-> [b |-> <<1>>]], LAMBDA e : TRUE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module selectseq_record_nested failed.
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    [a |-> [b |-> <<1>>]]
---*)
