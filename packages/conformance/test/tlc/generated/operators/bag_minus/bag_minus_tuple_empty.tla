(*---
description: bag_minus applied to tuple_empty, a TupleValue.
ref: tlc2/module/Bags.java#BagDiff
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_minus_tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<>> (-) SetToBag({1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
