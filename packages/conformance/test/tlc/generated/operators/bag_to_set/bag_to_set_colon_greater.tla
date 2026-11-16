(*---
description: bag_to_set applied to colon_greater, a FcnRcdValue.
ref: tlc2/module/Bags.java#BagToSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_to_set_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagToSet(1 :> 2))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1}"
---*)
