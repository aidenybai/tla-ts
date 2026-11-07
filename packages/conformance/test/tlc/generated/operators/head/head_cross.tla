(*---
description: head applied to cross, a SetOfTuplesValue.
ref: tlc2/module/Sequences.java#Head
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE head_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    {<<1, 3>>, <<2, 3>>}
    2283:0 The argument of Head should be a sequence, but instead it is:
    {<<1, 3>>, <<2, 3>>}
---*)
