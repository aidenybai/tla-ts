(*---
description: bag_union applied to set_filter, a SetPredValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_union_set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagUnion({x \in 1..3 : x > 1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2177:0 Attempted to apply BagUnion to the following set, whose
    element is not a bag:
    {2, 3}
    2177:0 Attempted to apply BagUnion to the following set, whose
    element is not a bag:
    {2, 3}
---*)
