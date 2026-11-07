(*---
description: tail applied to int_zero, a IntValue.
ref: tlc2/module/Sequences.java#Tail
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tail_int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    0
    2283:0 The argument of Tail should be a sequence, but instead it is:
    0
---*)
