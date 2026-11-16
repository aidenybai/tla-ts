(*---
description: is_a_bag applied to interval_empty, a IntervalValue.
ref: tlc2/module/Bags.java#IsABag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_a_bag_interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsABag(3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
