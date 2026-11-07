(*---
description: is_a_bag applied to set_nested, a SetEnumValue.
ref: tlc2/module/Bags.java#IsABag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_a_bag_set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsABag({{1}, {}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
