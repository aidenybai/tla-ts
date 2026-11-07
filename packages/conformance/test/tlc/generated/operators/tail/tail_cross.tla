(*---
description: tail applied to cross, a SetOfTuplesValue.
ref: tlc2/module/Sequences.java#Tail
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tail_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    {<<1, 3>>, <<2, 3>>}
    2283:0 The argument of Tail should be a sequence, but instead it is:
    {<<1, 3>>, <<2, 3>>}
---*)
