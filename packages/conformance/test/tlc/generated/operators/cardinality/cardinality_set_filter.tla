(*---
description: cardinality applied to set_filter, a SetPredValue.
ref: tlc2/module/FiniteSets.java#Cardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cardinality_set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({x \in 1..3 : x > 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
