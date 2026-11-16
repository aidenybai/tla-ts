(*---
description: set_to_bag applied to subset, a SubsetValue.
ref: tlc2/module/Bags.java#SetToBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE set_to_bag_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SetToBag(SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({} :> 1 @@ {1} :> 1 @@ {2} :> 1 @@ {1, 2} :> 1)"
---*)
