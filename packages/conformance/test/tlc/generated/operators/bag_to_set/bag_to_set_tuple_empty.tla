(*---
description: bag_to_set applied to tuple_empty, a TupleValue.
ref: tlc2/module/Bags.java#BagToSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_to_set_tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagToSet(<<>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
