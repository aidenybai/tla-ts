(*---
description: bag_plus applied to double_at, a FcnRcdValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_plus_double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) @@ (2 :> 3) (+) SetToBag({1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 3>>"
---*)
