(*---
description: diff of subset, a SubsetValue, and subset, a SubsetValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_subset__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) \ (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
