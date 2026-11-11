(*---
description: Compares subset, a SubsetValue, with boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SubsetValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_subset__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) = (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
