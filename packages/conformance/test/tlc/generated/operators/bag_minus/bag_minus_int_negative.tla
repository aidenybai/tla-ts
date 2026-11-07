(*---
description: bag_minus applied to int_negative, a IntValue.
ref: tlc2/module/Bags.java#BagDiff
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_minus_int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(-3 (-) SetToBag({1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of (-) should be a bag, but instead it is:
    -3
    2169:0 The first argument of (-) should be a bag, but instead it is:
    -3
---*)
