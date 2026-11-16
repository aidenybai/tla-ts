(*---
description: bag_cardinality applied to tuple, a TupleValue.
ref: tlc2/module/Bags.java#BagCardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_cardinality_tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagCardinality(<<1, 2>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
