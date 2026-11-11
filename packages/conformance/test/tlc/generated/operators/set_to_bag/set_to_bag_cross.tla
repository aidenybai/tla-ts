(*---
description: set_to_bag applied to cross, a SetOfTuplesValue.
ref: tlc2/module/Bags.java#SetToBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE set_to_bag_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SetToBag({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<1, 3>> :> 1 @@ <<2, 3>> :> 1)"
---*)
