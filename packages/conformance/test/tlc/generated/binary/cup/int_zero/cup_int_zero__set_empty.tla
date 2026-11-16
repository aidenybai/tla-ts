(*---
description: cup of int_zero, a IntValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_int_zero__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0) \cup ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
