(*---
description: record_set of union, a UnionValue, and set_map, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_union__set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : (UNION {{1}, {2}}), g : ({x + 1 : x \in 1..2})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[f |-> 1, g |-> 2], [f |-> 1, g |-> 3], [f |-> 2, g |-> 2], [f |-> 2, g |-> 3]}"
---*)
