(*---
description: bag_cardinality applied to tuple_empty, a TupleValue.
ref: tlc2/module/Bags.java#BagCardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_cardinality_tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagCardinality(<<>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
