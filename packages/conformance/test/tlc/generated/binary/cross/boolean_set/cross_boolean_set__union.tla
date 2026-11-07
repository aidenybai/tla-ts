(*---
description: cross of boolean_set, a SetEnumValue, and union, a UnionValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_boolean_set__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) \X (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<FALSE, 1>>, <<FALSE, 2>>, <<TRUE, 1>>, <<TRUE, 2>>}"
---*)
