(*---
description: subset_of applied to set_nested, a SetEnumValue.
ref: tlc2/value/impl/SubsetValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subset_of_set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SUBSET {{1}, {}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {{}, {{}}, {{1}}, {{}, {1}}}"
---*)
