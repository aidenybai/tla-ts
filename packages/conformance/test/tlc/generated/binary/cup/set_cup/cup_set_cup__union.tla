(*---
description: cup of set_cup, a SetCupValue, and union, a UnionValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_cup__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1} \cup {2}) \cup (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
