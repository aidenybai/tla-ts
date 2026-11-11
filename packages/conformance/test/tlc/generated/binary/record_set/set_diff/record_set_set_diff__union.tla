(*---
description: record_set of set_diff, a SetDiffValue, and union, a UnionValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_diff__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({1, 2} \ {2}), g : (UNION {{1}, {2}})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[f |-> 1, g |-> 1], [f |-> 1, g |-> 2]}"
---*)
