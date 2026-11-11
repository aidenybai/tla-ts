(*---
description: Compares union, a UnionValue, with union, a UnionValue.
ref: tlc2/value/impl/UnionValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_union__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}}) = (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
