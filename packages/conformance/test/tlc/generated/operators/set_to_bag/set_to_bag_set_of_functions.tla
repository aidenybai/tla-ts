(*---
description: set_to_bag applied to set_of_functions, a SetOfFcnsValue.
ref: tlc2/module/Bags.java#SetToBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE set_to_bag_set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SetToBag([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<2>> :> 1 @@ <<3>> :> 1)"
---*)
