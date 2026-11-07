(*---
description: is_a_bag applied to record, a RecordValue.
ref: tlc2/module/Bags.java#IsABag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_a_bag_record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsABag([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
