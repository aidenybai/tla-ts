(*---
description: len applied to record_nested, a RecordValue.
ref: tlc2/module/Sequences.java#Len
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE len_record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len([a |-> [b |-> <<1>>]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> [b |-> <<1>>]]
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> [b |-> <<1>>]]
---*)
