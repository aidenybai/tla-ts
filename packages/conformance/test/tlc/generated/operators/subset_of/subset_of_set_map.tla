(*---
description: subset_of applied to set_map, a SetEnumValue.
ref: tlc2/value/impl/SubsetValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subset_of_set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SUBSET {x + 1 : x \in 1..2})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {{}, {2}, {3}, {2, 3}}"
---*)
