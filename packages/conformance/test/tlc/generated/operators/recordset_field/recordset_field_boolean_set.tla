(*---
description: recordset_field applied to boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE recordset_field_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : BOOLEAN])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[f |-> FALSE], [f |-> TRUE]}"
---*)
