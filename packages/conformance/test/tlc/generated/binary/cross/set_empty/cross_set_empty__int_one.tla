(*---
description: cross of set_empty, a SetEnumValue, and int_one, a IntValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_empty__int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \X (1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
