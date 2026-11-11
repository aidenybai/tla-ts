(*---
description: set_to_bag applied to union, a UnionValue.
ref: tlc2/module/Bags.java#SetToBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE set_to_bag_union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SetToBag(UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 1>>"
---*)
