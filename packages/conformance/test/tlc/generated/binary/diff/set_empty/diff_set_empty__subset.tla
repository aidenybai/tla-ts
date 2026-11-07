(*---
description: diff of set_empty, a SetEnumValue, and subset, a SubsetValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_empty__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \ (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
