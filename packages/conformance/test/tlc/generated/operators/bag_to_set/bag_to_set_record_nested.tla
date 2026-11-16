(*---
description: bag_to_set applied to record_nested, a RecordValue.
ref: tlc2/module/Bags.java#BagToSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_to_set_record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagToSet([a |-> [b |-> <<1>>]]))
====

(*--- recorded
all:
  exit: 0
  transcript: '| {"a"}'
---*)
