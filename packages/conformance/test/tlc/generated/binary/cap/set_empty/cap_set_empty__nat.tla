(*---
description: cap of set_empty, a SetEnumValue, and nat, a UserValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_empty__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cap (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
