(*---
description: bag_minus applied to bag, a FcnRcdValue.
ref: tlc2/module/Bags.java#BagDiff
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_minus_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SetToBag({1}) (-) SetToBag({1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
