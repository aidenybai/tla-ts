(*---
description: record_set of set_empty, a SetEnumValue, and true, a BoolValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_empty__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({}), g : (TRUE)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
