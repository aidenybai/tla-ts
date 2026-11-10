(*---
description: greater_equal_right applied to interval_empty, a IntervalValue.
ref: tlc2/module/Naturals.java#GEQ
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE greater_equal_right_interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(2 >= 3..1)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module greater_equal_right_interval_empty failed.
    2266:0 The second argument of >= should be an integer, but instead it is:
    {}
---*)
