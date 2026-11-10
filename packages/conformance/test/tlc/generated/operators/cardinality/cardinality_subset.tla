(*---
description: cardinality applied to subset, a SubsetValue.
ref: tlc2/module/FiniteSets.java#Cardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cardinality_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 4"
---*)
