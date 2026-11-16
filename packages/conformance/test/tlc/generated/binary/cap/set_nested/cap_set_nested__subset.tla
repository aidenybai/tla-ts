(*---
description: cap of set_nested, a SetEnumValue, and subset, a SubsetValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_nested__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({{1}, {}}) \cap (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {{}, {1}}"
---*)
