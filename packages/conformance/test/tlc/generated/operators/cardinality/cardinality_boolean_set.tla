(*---
description: cardinality applied to boolean_set, a SetEnumValue.
ref: tlc2/module/FiniteSets.java#Cardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cardinality_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
