(*---
description: diff of set_diff, a SetDiffValue, and union, a UnionValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_diff__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \ {2}) \ (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
