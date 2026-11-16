(*---
description: is_a_bag applied to tuple, a TupleValue.
ref: tlc2/module/Bags.java#IsABag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_a_bag_tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsABag(<<1, 2>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
