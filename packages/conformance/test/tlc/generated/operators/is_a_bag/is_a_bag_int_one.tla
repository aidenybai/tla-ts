(*---
description: is_a_bag applied to int_one, a IntValue.
ref: tlc2/module/Bags.java#IsABag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_a_bag_int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsABag(1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
