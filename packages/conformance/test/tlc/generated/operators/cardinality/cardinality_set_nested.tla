(*---
description: cardinality applied to set_nested, a SetEnumValue.
ref: tlc2/module/FiniteSets.java#Cardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cardinality_set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({{1}, {}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
