(*---
description: bag_plus applied to function_empty, a FcnRcdValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_plus_function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([x \in {} |-> x] (+) SetToBag({1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)
