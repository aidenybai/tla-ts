(*---
description: cap of set_empty, a SetEnumValue, and int_negative, a IntValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_empty__int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cap (-3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
