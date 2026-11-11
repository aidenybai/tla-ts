(*---
description: record_set of boolean_set, a SetEnumValue, and set_cap, a SetCapValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_boolean_set__set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : (BOOLEAN), g : ({1, 2} \cap {2, 3})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[f |-> FALSE, g |-> 2], [f |-> TRUE, g |-> 2]}"
---*)
