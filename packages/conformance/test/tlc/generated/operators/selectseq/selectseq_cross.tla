(*---
description: selectseq applied to cross, a SetOfTuplesValue.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE selectseq_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq({1, 2} \X {3}, LAMBDA e : TRUE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    {<<1, 3>>, <<2, 3>>}
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    {<<1, 3>>, <<2, 3>>}
---*)
