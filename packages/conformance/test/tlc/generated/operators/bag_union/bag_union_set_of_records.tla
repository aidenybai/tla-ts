(*---
description: bag_union applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_union_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagUnion([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 3]"
---*)
