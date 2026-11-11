(*---
description: cross of union, a UnionValue, and set_cup, a SetCupValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_union__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}}) \X ({1} \cup {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1, 1>>, <<1, 2>>, <<2, 1>>, <<2, 2>>}"
---*)
