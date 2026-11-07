(*---
description: cup of set_nested, a SetEnumValue, and subset, a SubsetValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_nested__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({{1}, {}}) \cup (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {{}, {1}, {2}, {1, 2}}"
---*)
