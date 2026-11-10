(*---
description: record_set of set_diff, a SetDiffValue, and set_nested, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_diff__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({1, 2} \ {2}), g : ({{1}, {}})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[f |-> 1, g |-> {}], [f |-> 1, g |-> {1}]}"
---*)
