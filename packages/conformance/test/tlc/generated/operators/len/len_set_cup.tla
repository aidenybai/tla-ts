(*---
description: len applied to set_cup, a SetCupValue.
ref: tlc2/module/Sequences.java#Len
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE len_set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len({1} \cup {2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    {1, 2}
    2283:0 The argument of Len should be a sequence, but instead it is:
    {1, 2}
---*)
