(*---
description: filter_over applied to subset, a SubsetValue.
ref: tlc2/value/impl/SetPredValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE filter_over_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({e \in SUBSET {1, 2} : TRUE})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {{}, {1}, {2}, {1, 2}}"
---*)
