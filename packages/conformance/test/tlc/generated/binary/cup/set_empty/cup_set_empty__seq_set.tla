(*---
description: cup of set_empty, a SetEnumValue, and seq_set, a UserValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_empty__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cup (Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| Seq({1})"
---*)
