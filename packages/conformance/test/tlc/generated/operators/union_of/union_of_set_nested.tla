(*---
description: union_of applied to set_nested, a SetEnumValue.
ref: tlc2/value/impl/UnionValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE union_of_set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{1}, {}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1}"
---*)
