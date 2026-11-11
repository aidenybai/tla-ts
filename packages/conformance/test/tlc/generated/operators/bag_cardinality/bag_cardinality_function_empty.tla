(*---
description: bag_cardinality applied to function_empty, a FcnRcdValue.
ref: tlc2/module/Bags.java#BagCardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_cardinality_function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagCardinality([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
