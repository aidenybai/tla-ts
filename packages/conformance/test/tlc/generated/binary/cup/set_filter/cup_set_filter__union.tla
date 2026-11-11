(*---
description: cup of set_filter, a SetPredValue, and union, a UnionValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_filter__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x \in 1..3 : x > 1}) \cup (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2, 3}"
---*)
