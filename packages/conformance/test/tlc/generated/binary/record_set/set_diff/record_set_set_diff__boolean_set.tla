(*---
description: record_set of set_diff, a SetDiffValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_diff__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({1, 2} \ {2}), g : (BOOLEAN)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[f |-> 1, g |-> FALSE], [f |-> 1, g |-> TRUE]}"
---*)
