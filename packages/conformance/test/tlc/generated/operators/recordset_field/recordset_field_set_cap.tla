(*---
description: recordset_field applied to set_cap, a SetCapValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE recordset_field_set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : {1, 2} \cap {2, 3}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[f |-> 2]}"
---*)
