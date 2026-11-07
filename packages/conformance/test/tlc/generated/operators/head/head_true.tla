(*---
description: head applied to true, a BoolValue.
ref: tlc2/module/Sequences.java#Head
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE head_true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(TRUE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    TRUE
    2283:0 The argument of Head should be a sequence, but instead it is:
    TRUE
---*)
