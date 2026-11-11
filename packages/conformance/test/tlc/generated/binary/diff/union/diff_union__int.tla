(*---
description: diff of union, a UnionValue, and int, a UserValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_union__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}}) \ (Int))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
