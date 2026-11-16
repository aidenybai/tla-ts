(*---
description: bag_union applied to set_empty, a SetEnumValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_union_set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagUnion({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
