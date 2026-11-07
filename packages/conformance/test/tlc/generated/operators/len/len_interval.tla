(*---
description: len applied to interval, a IntervalValue.
ref: tlc2/module/Sequences.java#Len
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE len_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(1..3))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    1..3
    2283:0 The argument of Len should be a sequence, but instead it is:
    1..3
---*)
