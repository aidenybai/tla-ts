(*---
description: cup of int_negative, a IntValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_int_negative__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) \cup ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -3"
---*)
