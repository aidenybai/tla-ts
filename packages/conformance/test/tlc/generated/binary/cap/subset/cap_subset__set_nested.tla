(*---
description: cap of subset, a SubsetValue, and set_nested, a SetEnumValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_subset__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) \cap ({{1}, {}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {{}, {1}}"
---*)
