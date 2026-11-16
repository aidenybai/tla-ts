(*---
description: bag_cardinality applied to colon_greater, a FcnRcdValue.
ref: tlc2/module/Bags.java#BagCardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_cardinality_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagCardinality(1 :> 2))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
