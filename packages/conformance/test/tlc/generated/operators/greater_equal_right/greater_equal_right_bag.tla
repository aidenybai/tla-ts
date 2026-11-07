(*---
description: greater_equal_right applied to bag, a FcnRcdValue.
ref: tlc2/module/Naturals.java#GEQ
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE greater_equal_right_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(2 >= SetToBag({1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of >= should be an integer, but instead it is:
    <<1>>
    2266:0 The second argument of >= should be an integer, but instead it is:
    <<1>>
---*)
