(*---
description: record_set of set_cap, a SetCapValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_cap__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({1, 2} \cap {2, 3}), g : (BOOLEAN)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[f |-> 2, g |-> FALSE], [f |-> 2, g |-> TRUE]}"
---*)
