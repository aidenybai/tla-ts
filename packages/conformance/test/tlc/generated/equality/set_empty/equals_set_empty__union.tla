(*---
description: Compares set_empty, a SetEnumValue, with union, a UnionValue.
ref: tlc2/value/impl/SetEnumValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_empty__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) = (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
