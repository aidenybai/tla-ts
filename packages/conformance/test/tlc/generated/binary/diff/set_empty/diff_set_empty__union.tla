(*---
description: diff of set_empty, a SetEnumValue, and union, a UnionValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_empty__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \ (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
