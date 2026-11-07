(*---
description: record_set of set_ints, a SetEnumValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_ints__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({2, 1}), g : ({})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
