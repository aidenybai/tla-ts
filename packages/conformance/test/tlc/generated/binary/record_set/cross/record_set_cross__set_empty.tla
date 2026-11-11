(*---
description: record_set of cross, a SetOfTuplesValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_cross__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({1, 2} \X {3}), g : ({})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
