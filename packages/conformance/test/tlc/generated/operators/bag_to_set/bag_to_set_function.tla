(*---
description: bag_to_set applied to function, a FcnRcdValue.
ref: tlc2/module/Bags.java#BagToSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_to_set_function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagToSet([x \in {1, 2} |-> x * 2]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
