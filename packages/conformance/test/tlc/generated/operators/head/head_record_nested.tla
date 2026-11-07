(*---
description: head applied to record_nested, a RecordValue.
ref: tlc2/module/Sequences.java#Head
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE head_record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head([a |-> [b |-> <<1>>]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> [b |-> <<1>>]]
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> [b |-> <<1>>]]
---*)
