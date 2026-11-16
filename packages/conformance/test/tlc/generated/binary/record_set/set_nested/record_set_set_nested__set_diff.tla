(*---
description: record_set of set_nested, a SetEnumValue, and set_diff, a SetDiffValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_nested__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({{1}, {}}), g : ({1, 2} \ {2})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[f |-> {}, g |-> 1], [f |-> {1}, g |-> 1]}"
---*)
