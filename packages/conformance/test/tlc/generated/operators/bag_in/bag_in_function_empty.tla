(*---
description: bag_in applied to function_empty, a FcnRcdValue.
ref: tlc2/module/Bags.java#BagIn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_in_function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagIn(1, [x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
