(*---
description: greater_equal_right applied to set_cap, a SetCapValue.
ref: tlc2/module/Naturals.java#GEQ
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE greater_equal_right_set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(2 >= {1, 2} \cap {2, 3})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of >= should be an integer, but instead it is:
    {2}
    2266:0 The second argument of >= should be an integer, but instead it is:
    {2}
---*)
