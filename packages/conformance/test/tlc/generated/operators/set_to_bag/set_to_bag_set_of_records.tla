(*---
description: set_to_bag applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/module/Bags.java#SetToBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE set_to_bag_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SetToBag([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ([a |-> 1] :> 1 @@ [a |-> 2] :> 1)"
---*)
