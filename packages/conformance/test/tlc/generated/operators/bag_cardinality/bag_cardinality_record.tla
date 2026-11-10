(*---
description: bag_cardinality applied to record, a RecordValue.
ref: tlc2/module/Bags.java#BagCardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_cardinality_record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagCardinality([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
