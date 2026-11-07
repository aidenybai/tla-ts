(*---
description: greater_equal_right applied to union, a UnionValue.
ref: tlc2/module/Naturals.java#GEQ
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE greater_equal_right_union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(2 >= UNION {{1}, {2}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of >= should be an integer, but instead it is:
    {1, 2}
    2266:0 The second argument of >= should be an integer, but instead it is:
    {1, 2}
---*)
