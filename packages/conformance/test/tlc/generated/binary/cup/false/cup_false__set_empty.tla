(*---
description: cup of false, a BoolValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_false__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((FALSE) \cup ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
