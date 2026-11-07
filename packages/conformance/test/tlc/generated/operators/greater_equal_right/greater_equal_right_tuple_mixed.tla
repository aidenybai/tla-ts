(*---
description: greater_equal_right applied to tuple_mixed, a TupleValue.
ref: tlc2/module/Naturals.java#GEQ
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE greater_equal_right_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(2 >= <<1, "a", {TRUE}>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of >= should be an integer, but instead it is:
    <<1, "a", {TRUE}>>
    2266:0 The second argument of >= should be an integer, but instead it is:
    <<1, "a", {TRUE}>>
---*)
