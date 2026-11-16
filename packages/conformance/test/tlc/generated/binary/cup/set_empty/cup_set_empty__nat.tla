(*---
description: cup of set_empty, a SetEnumValue, and nat, a UserValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_empty__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cup (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| Nat"
---*)
