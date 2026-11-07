(*---
description: bag_union applied to cross, a SetOfTuplesValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_union_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagUnion({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<3, 6>>"
---*)
