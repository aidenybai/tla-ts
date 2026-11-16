(*---
description: cardinality applied to set_map, a SetEnumValue.
ref: tlc2/module/FiniteSets.java#Cardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cardinality_set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({x + 1 : x \in 1..2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
