(*---
description: bag_to_set applied to tuple, a TupleValue.
ref: tlc2/module/Bags.java#BagToSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_to_set_tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagToSet(<<1, 2>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1..2"
---*)
