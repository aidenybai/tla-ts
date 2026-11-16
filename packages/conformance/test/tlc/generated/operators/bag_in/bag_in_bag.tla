(*---
description: bag_in applied to bag, a FcnRcdValue.
ref: tlc2/module/Bags.java#BagIn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_in_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagIn(1, SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
