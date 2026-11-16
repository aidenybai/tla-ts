(*---
description: cup_left applied to union, a UnionValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_left_union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{1}, {2}} \cup {9})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2, 9}"
---*)
