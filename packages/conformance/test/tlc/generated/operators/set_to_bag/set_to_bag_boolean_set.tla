(*---
description: set_to_bag applied to boolean_set, a SetEnumValue.
ref: tlc2/module/Bags.java#SetToBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE set_to_bag_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SetToBag(BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (FALSE :> 1 @@ TRUE :> 1)"
---*)
