(*---
description: bag_minus applied to int, a UserValue.
ref: tlc2/module/Bags.java#BagDiff
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_minus_int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Int (-) SetToBag({1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module bag_minus_int failed.
    2169:0 The first argument of (-) should be a bag, but instead it is:
    Int
---*)
