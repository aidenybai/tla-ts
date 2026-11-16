(*---
description: cross of set_empty, a SetEnumValue, and int, a UserValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_empty__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \X (Int))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
