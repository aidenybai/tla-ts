(*---
description: bag_plus applied to function, a FcnRcdValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_plus_function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([x \in {1, 2} |-> x * 2] (+) SetToBag({1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<3, 4>>"
---*)
