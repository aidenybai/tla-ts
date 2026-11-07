(*---
description: bag_union applied to set_map, a SetEnumValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_union_set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagUnion({x + 1 : x \in 1..2}))
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
