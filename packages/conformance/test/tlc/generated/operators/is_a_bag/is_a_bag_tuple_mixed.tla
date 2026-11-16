(*---
description: is_a_bag applied to tuple_mixed, a TupleValue.
ref: tlc2/module/Bags.java#IsABag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_a_bag_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsABag(<<1, "a", {TRUE}>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
