(*---
description: cup of set_empty, a SetEnumValue, and int_negative, a IntValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_empty__int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cup (-3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -3"
---*)
