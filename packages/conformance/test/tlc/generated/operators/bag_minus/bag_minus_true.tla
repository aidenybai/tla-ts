(*---
description: bag_minus applied to true, a BoolValue.
ref: tlc2/module/Bags.java#BagDiff
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_minus_true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(TRUE (-) SetToBag({1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of (-) should be a bag, but instead it is:
    TRUE
    2169:0 The first argument of (-) should be a bag, but instead it is:
    TRUE
---*)
