(*---
description: cross of set_ints, a SetEnumValue, and set_nested, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_ints__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({2, 1}) \X ({{1}, {}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1, {}>>, <<1, {1}>>, <<2, {}>>, <<2, {1}>>}"
---*)
