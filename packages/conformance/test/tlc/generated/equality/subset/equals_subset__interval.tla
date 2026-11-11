(*---
description: Compares subset, a SubsetValue, with interval, a IntervalValue.
ref: tlc2/value/impl/SubsetValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_subset__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) = (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
