(*---
description: bag_cardinality applied to bag, a FcnRcdValue.
ref: tlc2/module/Bags.java#BagCardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_cardinality_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagCardinality(SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
