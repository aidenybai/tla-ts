(*---
description: cap of set_empty, a SetEnumValue, and seq_set, a UserValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_empty__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cap (Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
