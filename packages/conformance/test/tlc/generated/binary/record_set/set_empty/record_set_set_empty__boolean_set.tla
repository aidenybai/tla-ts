(*---
description: record_set of set_empty, a SetEnumValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_empty__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({}), g : (BOOLEAN)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
