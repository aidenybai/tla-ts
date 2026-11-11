(*---
description: greater_equal_right applied to cross, a SetOfTuplesValue.
ref: tlc2/module/Naturals.java#GEQ
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE greater_equal_right_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(2 >= {1, 2} \X {3})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module greater_equal_right_cross failed.
    2266:0 The second argument of >= should be an integer, but instead it is:
    {<<1, 3>>, <<2, 3>>}
---*)
