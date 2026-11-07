(*---
description: subseq applied to cross, a SetOfTuplesValue.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseq_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq({1, 2} \X {3}, 1, 1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    {<<1, 3>>, <<2, 3>>}
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    {<<1, 3>>, <<2, 3>>}
---*)
