(*---
description: bag_in applied to colon_greater, a FcnRcdValue.
ref: tlc2/module/Bags.java#BagIn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_in_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagIn(1, 1 :> 2))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
