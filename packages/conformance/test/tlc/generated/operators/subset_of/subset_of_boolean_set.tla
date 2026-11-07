(*---
description: subset_of applied to boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SubsetValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subset_of_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SUBSET BOOLEAN)
====

(*--- recorded
all:
  exit: 0
  transcript: "| {{}, {FALSE}, {TRUE}, {FALSE, TRUE}}"
---*)
