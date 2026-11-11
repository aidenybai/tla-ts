(*---
description: cap of set_empty, a SetEnumValue, and set_mixed, a SetEnumValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_empty__set_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cap ({1, "a"}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
