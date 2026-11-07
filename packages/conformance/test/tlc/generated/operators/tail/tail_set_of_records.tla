(*---
description: tail applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/module/Sequences.java#Tail
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tail_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    {[a |-> 1], [a |-> 2]}
    2283:0 The argument of Tail should be a sequence, but instead it is:
    {[a |-> 1], [a |-> 2]}
---*)
