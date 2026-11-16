(*---
description: cross of set_empty, a SetEnumValue, and int_zero, a IntValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_empty__int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \X (0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
