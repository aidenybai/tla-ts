(*---
description: bag_minus applied to set_nested, a SetEnumValue.
ref: tlc2/module/Bags.java#BagDiff
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_minus_set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({{1}, {}} (-) SetToBag({1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of (-) should be a bag, but instead it is:
    {{}, {1}}
    2169:0 The first argument of (-) should be a bag, but instead it is:
    {{}, {1}}
---*)
