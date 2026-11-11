(*---
description: Compares union, a UnionValue, with subset, a SubsetValue.
ref: tlc2/value/impl/UnionValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_union__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}}) = (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
