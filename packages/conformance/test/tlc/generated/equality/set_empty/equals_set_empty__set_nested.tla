(*---
description: Compares set_empty, a SetEnumValue, with set_nested, a SetEnumValue.
ref: tlc2/value/impl/SetEnumValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_empty__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) = ({{1}, {}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
