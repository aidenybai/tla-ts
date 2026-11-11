(*---
description: recordset_field applied to set_ints, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE recordset_field_set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : {2, 1}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[f |-> 1], [f |-> 2]}"
---*)
