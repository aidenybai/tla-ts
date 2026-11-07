(*---
description: cross of set_empty, a SetEnumValue, and true, a BoolValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_empty__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \X (TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
