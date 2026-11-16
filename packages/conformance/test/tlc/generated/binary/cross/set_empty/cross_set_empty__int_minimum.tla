(*---
description: cross of set_empty, a SetEnumValue, and int_minimum, a IntValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_empty__int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \X ((-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
