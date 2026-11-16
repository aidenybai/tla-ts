(*---
description: recordset_field applied to set_cup, a SetCupValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE recordset_field_set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : {1} \cup {2}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[f |-> 1], [f |-> 2]}"
---*)
