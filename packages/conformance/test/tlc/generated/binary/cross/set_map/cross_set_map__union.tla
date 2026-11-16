(*---
description: cross of set_map, a SetEnumValue, and union, a UnionValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_map__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x + 1 : x \in 1..2}) \X (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<2, 1>>, <<2, 2>>, <<3, 1>>, <<3, 2>>}"
---*)
