(*---
description: recordset_field applied to set_diff, a SetDiffValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE recordset_field_set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : {1, 2} \ {2}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[f |-> 1]}"
---*)
