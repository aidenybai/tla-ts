(*---
description: len applied to boolean_set, a SetEnumValue.
ref: tlc2/module/Sequences.java#Len
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE len_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(BOOLEAN))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    {FALSE, TRUE}
    2283:0 The argument of Len should be a sequence, but instead it is:
    {FALSE, TRUE}
---*)
