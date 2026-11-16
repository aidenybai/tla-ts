(*---
description: recordset_field applied to set_nested, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE recordset_field_set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : {{1}, {}}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[f |-> {}], [f |-> {1}]}"
---*)
