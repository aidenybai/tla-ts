(*---
description: recordset_field applied to set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE recordset_field_set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : {}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
