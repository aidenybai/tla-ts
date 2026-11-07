(*---
description: bag_union applied to set_ints, a SetEnumValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_union_set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagUnion({2, 1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2177:0 Attempted to apply BagUnion to the following set, whose
    element is not a bag:
    {1, 2}
    2177:0 Attempted to apply BagUnion to the following set, whose
    element is not a bag:
    {1, 2}
---*)
