(*---
description: subseq applied to int_minimum, a IntValue.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseq_int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((-2147483647 - 1), 1, 1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    -2147483648
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    -2147483648
---*)
