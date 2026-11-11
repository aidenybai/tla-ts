(*---
description: recordset_field applied to set_map, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE recordset_field_set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : {x + 1 : x \in 1..2}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[f |-> 2], [f |-> 3]}"
---*)
