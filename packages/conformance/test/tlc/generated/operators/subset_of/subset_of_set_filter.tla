(*---
description: subset_of applied to set_filter, a SetPredValue.
ref: tlc2/value/impl/SubsetValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subset_of_set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SUBSET {x \in 1..3 : x > 1})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {{}, {2}, {3}, {2, 3}}"
---*)
