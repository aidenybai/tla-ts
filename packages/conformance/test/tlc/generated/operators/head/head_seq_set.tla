(*---
description: head applied to seq_set, a UserValue.
ref: tlc2/module/Sequences.java#Head
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE head_seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Seq({1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    Seq({1})
    2283:0 The argument of Head should be a sequence, but instead it is:
    Seq({1})
---*)
