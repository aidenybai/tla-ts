(*---
description: tail applied to set_diff, a SetDiffValue.
ref: tlc2/module/Sequences.java#Tail
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tail_set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    {1}
    2283:0 The argument of Tail should be a sequence, but instead it is:
    {1}
---*)
