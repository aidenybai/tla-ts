(*---
description: bag_union applied to set_diff, a SetDiffValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_union_set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagUnion({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
