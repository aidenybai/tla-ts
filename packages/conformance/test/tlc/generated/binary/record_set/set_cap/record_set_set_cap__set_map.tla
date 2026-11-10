(*---
description: record_set of set_cap, a SetCapValue, and set_map, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_cap__set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({1, 2} \cap {2, 3}), g : ({x + 1 : x \in 1..2})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[f |-> 2, g |-> 2], [f |-> 2, g |-> 3]}"
---*)
