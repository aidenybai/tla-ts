(*---
description: bag_minus applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/module/Bags.java#BagDiff
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_minus_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a : {1, 2}] (-) SetToBag({1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of (-) should be a bag, but instead it is:
    {[a |-> 1], [a |-> 2]}
    2169:0 The first argument of (-) should be a bag, but instead it is:
    {[a |-> 1], [a |-> 2]}
---*)
