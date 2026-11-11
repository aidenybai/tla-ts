(*---
description: Compares subset, a SubsetValue, with interval_empty, a IntervalValue.
ref: tlc2/value/impl/SubsetValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_subset__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) = (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
