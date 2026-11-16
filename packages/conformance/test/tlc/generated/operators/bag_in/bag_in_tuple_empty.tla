(*---
description: bag_in applied to tuple_empty, a TupleValue.
ref: tlc2/module/Bags.java#BagIn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_in_tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagIn(1, <<>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
