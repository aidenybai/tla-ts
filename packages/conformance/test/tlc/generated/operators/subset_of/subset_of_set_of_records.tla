(*---
description: subset_of applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SubsetValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subset_of_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SUBSET [a : {1, 2}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {{}, {[a |-> 1]}, {[a |-> 2]}, {[a |-> 1], [a |-> 2]}}"
---*)
