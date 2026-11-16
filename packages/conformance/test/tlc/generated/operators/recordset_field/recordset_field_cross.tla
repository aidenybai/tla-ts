(*---
description: recordset_field applied to cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE recordset_field_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : {1, 2} \X {3}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[f |-> <<1, 3>>], [f |-> <<2, 3>>]}"
---*)
