(*---
description: subseq applied to set_filter, a SetPredValue.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseq_set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq({x \in 1..3 : x > 1}, 1, 1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    {2, 3}
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    {2, 3}
---*)
