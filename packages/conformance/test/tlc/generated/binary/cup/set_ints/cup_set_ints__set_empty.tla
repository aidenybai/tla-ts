(*---
description: cup of set_ints, a SetEnumValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_ints__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({2, 1}) \cup ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
