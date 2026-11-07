(*---
description: set_to_bag applied to set_ints, a SetEnumValue.
ref: tlc2/module/Bags.java#SetToBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE set_to_bag_set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SetToBag({2, 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 1>>"
---*)
