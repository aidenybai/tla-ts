(*---
description: bag_union applied to union, a UnionValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_union_union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagUnion(UNION {{1}, {2}}))
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
