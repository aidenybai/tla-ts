(*---
description: bag_in applied to double_at, a FcnRcdValue.
ref: tlc2/module/Bags.java#BagIn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_in_double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagIn(1, (1 :> 2) @@ (2 :> 3)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
