(*---
description: is_a_bag applied to set_mixed, a SetEnumValue.
ref: tlc2/module/Bags.java#IsABag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_a_bag_set_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsABag({1, "a"}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
