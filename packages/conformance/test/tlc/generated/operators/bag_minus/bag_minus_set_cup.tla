(*---
description: bag_minus applied to set_cup, a SetCupValue.
ref: tlc2/module/Bags.java#BagDiff
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_minus_set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1} \cup {2} (-) SetToBag({1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module bag_minus_set_cup failed.
    2169:0 The first argument of (-) should be a bag, but instead it is:
    {2}
---*)
