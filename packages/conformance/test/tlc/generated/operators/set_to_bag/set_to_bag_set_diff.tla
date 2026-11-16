(*---
description: set_to_bag applied to set_diff, a SetDiffValue.
ref: tlc2/module/Bags.java#SetToBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE set_to_bag_set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SetToBag({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)
