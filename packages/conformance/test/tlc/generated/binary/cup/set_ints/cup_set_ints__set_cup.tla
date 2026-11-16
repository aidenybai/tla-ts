(*---
description: cup of set_ints, a SetEnumValue, and set_cup, a SetCupValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_ints__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({2, 1}) \cup ({1} \cup {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
