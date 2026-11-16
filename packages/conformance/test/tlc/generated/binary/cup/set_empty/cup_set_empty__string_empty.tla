(*---
description: cup of set_empty, a SetEnumValue, and string_empty, a StringValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_empty__string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cup (""))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ""'
---*)
