(*---
description: bag_to_set applied to double_at, a FcnRcdValue.
ref: tlc2/module/Bags.java#BagToSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_to_set_double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagToSet((1 :> 2) @@ (2 :> 3)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
