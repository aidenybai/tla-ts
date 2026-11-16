(*---
description: cup of set_empty, a SetEnumValue, and string_set, a UserValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_empty__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cup (STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: "| STRING"
---*)
