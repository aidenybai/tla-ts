(*---
description: diff of union, a UnionValue, and set_cup, a SetCupValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_union__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}}) \ ({1} \cup {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
