(*---
description: cup of set_diff, a SetDiffValue, and union, a UnionValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_diff__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \ {2}) \cup (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
