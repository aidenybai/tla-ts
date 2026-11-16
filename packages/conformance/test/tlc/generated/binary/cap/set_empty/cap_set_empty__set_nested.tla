(*---
description: cap of set_empty, a SetEnumValue, and set_nested, a SetEnumValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_empty__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cap ({{1}, {}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
