(*---
description: bag_to_set applied to tuple_mixed, a TupleValue.
ref: tlc2/module/Bags.java#BagToSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_to_set_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagToSet(<<1, "a", {TRUE}>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1..3"
---*)
