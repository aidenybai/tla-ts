(*---
description: cross of set_nested, a SetEnumValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_nested__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({{1}, {}}) \X (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<{}, FALSE>>, <<{}, TRUE>>, <<{1}, FALSE>>, <<{1}, TRUE>>}"
---*)
