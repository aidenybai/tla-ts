(*---
description: bag_plus applied to tuple_empty, a TupleValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_plus_tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<>> (+) SetToBag({1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)
