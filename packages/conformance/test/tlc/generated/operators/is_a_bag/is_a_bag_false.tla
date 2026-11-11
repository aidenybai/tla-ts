(*---
description: is_a_bag applied to false, a BoolValue.
ref: tlc2/module/Bags.java#IsABag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_a_bag_false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsABag(FALSE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
