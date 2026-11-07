(*---
description: cross of set_empty, a SetEnumValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_empty__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \X ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
