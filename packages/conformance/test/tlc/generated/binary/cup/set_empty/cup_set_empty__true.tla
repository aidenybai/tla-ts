(*---
description: cup of set_empty, a SetEnumValue, and true, a BoolValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_empty__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cup (TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
