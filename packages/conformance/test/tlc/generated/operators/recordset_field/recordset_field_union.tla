(*---
description: recordset_field applied to union, a UnionValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE recordset_field_union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : UNION {{1}, {2}}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[f |-> 1], [f |-> 2]}"
---*)
