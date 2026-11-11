(*---
description: is_a_bag applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/module/Bags.java#IsABag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_a_bag_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsABag([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
