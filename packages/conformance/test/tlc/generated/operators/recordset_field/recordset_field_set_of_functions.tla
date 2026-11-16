(*---
description: recordset_field applied to set_of_functions, a SetOfFcnsValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE recordset_field_set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : [{1} -> {2, 3}]])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[f |-> <<2>>], [f |-> <<3>>]}"
---*)
