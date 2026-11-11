(*---
description: set_to_bag applied to interval_empty, a IntervalValue.
ref: tlc2/module/Bags.java#SetToBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE set_to_bag_interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SetToBag(3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
