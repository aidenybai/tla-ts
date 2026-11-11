(*---
description: record_set of set_empty, a SetEnumValue, and union, a UnionValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_empty__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({}), g : (UNION {{1}, {2}})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
