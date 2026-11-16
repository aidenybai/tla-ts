(*---
description: bag_to_set applied to bag, a FcnRcdValue.
ref: tlc2/module/Bags.java#BagToSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_to_set_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagToSet(SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1}"
---*)
