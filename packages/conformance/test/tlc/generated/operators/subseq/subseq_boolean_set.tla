(*---
description: subseq applied to boolean_set, a SetEnumValue.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseq_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(BOOLEAN, 1, 1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    {FALSE, TRUE}
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    {FALSE, TRUE}
---*)
