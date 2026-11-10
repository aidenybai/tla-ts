(*---
description: bag_union applied to set_cap, a SetCapValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_union_set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagUnion({1, 2} \cap {2, 3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
