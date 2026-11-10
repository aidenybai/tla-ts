(*---
description: bag_to_set applied to record, a RecordValue.
ref: tlc2/module/Bags.java#BagToSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_to_set_record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagToSet([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 0
  transcript: '| {"a", "b"}'
---*)
