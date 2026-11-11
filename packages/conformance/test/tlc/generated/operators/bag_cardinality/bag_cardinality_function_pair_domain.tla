(*---
description: bag_cardinality applied to function_pair_domain, a FcnRcdValue.
ref: tlc2/module/Bags.java#BagCardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_cardinality_function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagCardinality([x \in {1}, y \in {2} |-> x + y]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
