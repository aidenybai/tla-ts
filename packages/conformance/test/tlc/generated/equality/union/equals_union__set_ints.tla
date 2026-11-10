(*---
description: Compares union, a UnionValue, with set_ints, a SetEnumValue.
ref: tlc2/value/impl/UnionValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_union__set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}}) = ({2, 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
