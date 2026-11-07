(*---
description: len applied to false, a BoolValue.
ref: tlc2/module/Sequences.java#Len
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE len_false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(FALSE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    FALSE
    2283:0 The argument of Len should be a sequence, but instead it is:
    FALSE
---*)
