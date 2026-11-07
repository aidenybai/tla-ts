(*---
description: len applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/module/Sequences.java#Len
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE len_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    {[a |-> 1], [a |-> 2]}
    2283:0 The argument of Len should be a sequence, but instead it is:
    {[a |-> 1], [a |-> 2]}
---*)
