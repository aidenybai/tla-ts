(*---
description: cap of union, a UnionValue, and set_map, a SetEnumValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_union__set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}}) \cap ({x + 1 : x \in 1..2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2}"
---*)
