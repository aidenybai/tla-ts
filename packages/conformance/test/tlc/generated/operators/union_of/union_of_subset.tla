(*---
description: union_of applied to subset, a SubsetValue.
ref: tlc2/value/impl/UnionValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE union_of_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION SUBSET {1, 2})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
