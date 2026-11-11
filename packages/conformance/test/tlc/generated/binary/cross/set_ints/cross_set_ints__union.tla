(*---
description: cross of set_ints, a SetEnumValue, and union, a UnionValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_ints__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({2, 1}) \X (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1, 1>>, <<1, 2>>, <<2, 1>>, <<2, 2>>}"
---*)
