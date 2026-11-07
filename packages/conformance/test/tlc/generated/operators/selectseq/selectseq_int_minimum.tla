(*---
description: selectseq applied to int_minimum, a IntValue.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE selectseq_int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq((-2147483647 - 1), LAMBDA e : TRUE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    -2147483648
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    -2147483648
---*)
