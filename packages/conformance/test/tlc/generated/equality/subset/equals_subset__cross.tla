(*---
description: Compares subset, a SubsetValue, with cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SubsetValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_subset__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) = ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
