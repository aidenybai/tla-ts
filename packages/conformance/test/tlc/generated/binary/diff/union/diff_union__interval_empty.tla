(*---
description: diff of union, a UnionValue, and interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_union__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}}) \ (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
