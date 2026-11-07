(*---
description: bag_minus applied to string_a, a StringValue.
ref: tlc2/module/Bags.java#BagDiff
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_minus_string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT("a" (-) SetToBag({1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of (-) should be a bag, but instead it is:
    "a"
    2169:0 The first argument of (-) should be a bag, but instead it is:
    "a"
---*)
