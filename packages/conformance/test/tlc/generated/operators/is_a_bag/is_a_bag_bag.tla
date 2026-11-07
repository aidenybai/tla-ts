(*---
description: is_a_bag applied to bag, a FcnRcdValue.
ref: tlc2/module/Bags.java#IsABag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_a_bag_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsABag(SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
