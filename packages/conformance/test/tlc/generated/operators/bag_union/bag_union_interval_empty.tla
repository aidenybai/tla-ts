(*---
description: bag_union applied to interval_empty, a IntervalValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_union_interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagUnion(3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
