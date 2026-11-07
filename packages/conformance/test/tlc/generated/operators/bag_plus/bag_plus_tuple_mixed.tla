(*---
description: bag_plus applied to tuple_mixed, a TupleValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_plus_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<1, "a", {TRUE}>> (+) SetToBag({1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of (+) should be a bag, but instead it is:
    <<1, "a", {TRUE}>>
    2169:0 The first argument of (+) should be a bag, but instead it is:
    <<1, "a", {TRUE}>>
---*)
