(*---
description: greater_equal_right applied to seq_set, a UserValue.
ref: tlc2/module/Naturals.java#GEQ
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE greater_equal_right_seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(2 >= Seq({1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of >= should be an integer, but instead it is:
    Seq({1})
    2266:0 The second argument of >= should be an integer, but instead it is:
    Seq({1})
---*)
