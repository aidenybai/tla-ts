(*---
description: cardinality applied to set_diff, a SetDiffValue.
ref: tlc2/module/FiniteSets.java#Cardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cardinality_set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
