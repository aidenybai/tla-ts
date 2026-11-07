(*---
description: cross of set_diff, a SetDiffValue, and set_nested, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_diff__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \ {2}) \X ({{1}, {}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1, {}>>, <<1, {1}>>}"
---*)
