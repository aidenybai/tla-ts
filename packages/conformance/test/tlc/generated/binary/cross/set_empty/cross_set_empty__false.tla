(*---
description: cross of set_empty, a SetEnumValue, and false, a BoolValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_empty__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \X (FALSE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
