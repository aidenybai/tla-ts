(*---
description: cross of set_cap, a SetCapValue, and union, a UnionValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_cap__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \cap {2, 3}) \X (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<2, 1>>, <<2, 2>>}"
---*)
