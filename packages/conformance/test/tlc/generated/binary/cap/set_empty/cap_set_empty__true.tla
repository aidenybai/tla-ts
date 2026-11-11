(*---
description: cap of set_empty, a SetEnumValue, and true, a BoolValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_empty__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cap (TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
