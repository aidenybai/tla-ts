(*---
description: recordset_field applied to subset, a SubsetValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE recordset_field_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : SUBSET {1, 2}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[f |-> {}], [f |-> {1}], [f |-> {2}], [f |-> {1, 2}]}"
---*)
