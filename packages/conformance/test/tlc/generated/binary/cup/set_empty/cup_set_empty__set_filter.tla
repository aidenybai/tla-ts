(*---
description: cup of set_empty, a SetEnumValue, and set_filter, a SetPredValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_empty__set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cup ({x \in 1..3 : x > 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2, 3}"
---*)
