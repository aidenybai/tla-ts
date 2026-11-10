(*---
description: cup of string_empty, a StringValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_string_empty__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("") \cup ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ""'
---*)
