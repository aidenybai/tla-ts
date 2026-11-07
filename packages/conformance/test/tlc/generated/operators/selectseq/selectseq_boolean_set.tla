(*---
description: selectseq applied to boolean_set, a SetEnumValue.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE selectseq_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(BOOLEAN, LAMBDA e : TRUE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    {FALSE, TRUE}
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    {FALSE, TRUE}
---*)
