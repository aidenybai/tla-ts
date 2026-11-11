(*---
description: cap of set_empty, a SetEnumValue, and string_set, a UserValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_empty__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cap (STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
