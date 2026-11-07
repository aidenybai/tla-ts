(*---
description: record_set of set_ints, a SetEnumValue, and set_diff, a SetDiffValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_ints__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({2, 1}), g : ({1, 2} \ {2})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[f |-> 1, g |-> 1], [f |-> 2, g |-> 1]}"
---*)
