(*---
description: cardinality applied to union, a UnionValue.
ref: tlc2/module/FiniteSets.java#Cardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cardinality_union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
