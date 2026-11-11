(*---
description: cup of set_empty, a SetEnumValue, and int, a UserValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_empty__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cup (Int))
====

(*--- recorded
all:
  exit: 0
  transcript: "| Int"
---*)
