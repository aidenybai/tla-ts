(*---
description: cup of set_empty, a SetEnumValue, and false, a BoolValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_empty__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cup (FALSE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
