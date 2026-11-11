(*---
description: diff of set_nested, a SetEnumValue, and subset, a SubsetValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_nested__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({{1}, {}}) \ (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
