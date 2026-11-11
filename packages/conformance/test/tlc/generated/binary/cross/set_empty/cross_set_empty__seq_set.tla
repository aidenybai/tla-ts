(*---
description: cross of set_empty, a SetEnumValue, and seq_set, a UserValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_empty__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \X (Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
