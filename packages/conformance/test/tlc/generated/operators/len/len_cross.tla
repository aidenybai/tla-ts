(*---
description: len applied to cross, a SetOfTuplesValue.
ref: tlc2/module/Sequences.java#Len
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE len_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module len_cross failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    {<<1, 3>>, <<2, 3>>}
---*)
