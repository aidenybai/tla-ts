(*---
description: Compares set_empty, a SetEnumValue, with set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetEnumValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_empty__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) = ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
