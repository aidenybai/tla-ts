(*---
description: head applied to set_of_functions, a SetOfFcnsValue.
ref: tlc2/module/Sequences.java#Head
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE head_set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    {<<2>>, <<3>>}
    2283:0 The argument of Head should be a sequence, but instead it is:
    {<<2>>, <<3>>}
---*)
