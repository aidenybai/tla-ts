(*---
description: subseq applied to true, a BoolValue.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseq_true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(TRUE, 1, 1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    TRUE
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    TRUE
---*)
