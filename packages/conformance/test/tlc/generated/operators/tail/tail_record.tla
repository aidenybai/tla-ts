(*---
description: tail applied to record, a RecordValue.
ref: tlc2/module/Sequences.java#Tail
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tail_record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    [a |-> 1, b |-> 2]
    2283:0 The argument of Tail should be a sequence, but instead it is:
    [a |-> 1, b |-> 2]
---*)
