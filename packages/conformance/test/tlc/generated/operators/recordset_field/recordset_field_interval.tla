(*---
description: recordset_field applied to interval, a IntervalValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE recordset_field_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : 1..3])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[f |-> 1], [f |-> 2], [f |-> 3]}"
---*)
