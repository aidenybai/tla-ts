(*---
description: set_to_bag applied to set_cup, a SetCupValue.
ref: tlc2/module/Bags.java#SetToBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE set_to_bag_set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SetToBag({1} \cup {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 1>>"
---*)
