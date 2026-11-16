(*---
description: bag_minus applied to function_empty, a FcnRcdValue.
ref: tlc2/module/Bags.java#BagDiff
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_minus_function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([x \in {} |-> x] (-) SetToBag({1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
