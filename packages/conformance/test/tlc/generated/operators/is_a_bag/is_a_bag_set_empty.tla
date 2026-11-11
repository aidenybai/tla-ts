(*---
description: is_a_bag applied to set_empty, a SetEnumValue.
ref: tlc2/module/Bags.java#IsABag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_a_bag_set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsABag({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
