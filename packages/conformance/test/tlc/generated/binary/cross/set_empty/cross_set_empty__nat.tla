(*---
description: cross of set_empty, a SetEnumValue, and nat, a UserValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_empty__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \X (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
