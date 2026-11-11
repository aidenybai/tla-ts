(*---
description: set_to_bag applied to set_filter, a SetPredValue.
ref: tlc2/module/Bags.java#SetToBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE set_to_bag_set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SetToBag({x \in 1..3 : x > 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (2 :> 1 @@ 3 :> 1)"
---*)
