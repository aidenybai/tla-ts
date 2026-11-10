(*---
description: cross of union, a UnionValue, and cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_union__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}}) \X ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1, <<1, 3>>>>, <<1, <<2, 3>>>>, <<2, <<1, 3>>>>, <<2, <<2, 3>>>>}"
---*)
