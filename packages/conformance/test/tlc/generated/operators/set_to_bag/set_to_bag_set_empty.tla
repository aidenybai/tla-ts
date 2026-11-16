(*---
description: set_to_bag applied to set_empty, a SetEnumValue.
ref: tlc2/module/Bags.java#SetToBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE set_to_bag_set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SetToBag({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
