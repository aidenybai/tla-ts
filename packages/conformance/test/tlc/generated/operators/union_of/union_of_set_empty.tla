(*---
description: union_of applied to set_empty, a SetEnumValue.
ref: tlc2/value/impl/UnionValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE union_of_set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
