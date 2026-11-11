(*---
description: cap of set_map, a SetEnumValue, and union, a UnionValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_map__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x + 1 : x \in 1..2}) \cap (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2}"
---*)
