(*---
description: funcset_range applied to subset, a SubsetValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE funcset_range_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([{9} -> SUBSET {1, 2}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {(9 :> {}), (9 :> {1}), (9 :> {2}), (9 :> {1, 2})}"
---*)
