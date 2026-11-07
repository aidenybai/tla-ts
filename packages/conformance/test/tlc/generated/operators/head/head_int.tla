(*---
description: head applied to int, a UserValue.
ref: tlc2/module/Sequences.java#Head
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE head_int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Int))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    Int
    2283:0 The argument of Head should be a sequence, but instead it is:
    Int
---*)
