(*---
description: filter_over applied to union, a UnionValue.
ref: tlc2/value/impl/SetPredValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE filter_over_union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({e \in UNION {{1}, {2}} : TRUE})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
