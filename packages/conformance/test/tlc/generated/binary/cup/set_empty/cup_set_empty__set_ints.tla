(*---
description: cup of set_empty, a SetEnumValue, and set_ints, a SetEnumValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_empty__set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cup ({2, 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
