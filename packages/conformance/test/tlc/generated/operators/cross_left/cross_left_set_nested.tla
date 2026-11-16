(*---
description: cross_left applied to set_nested, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_left_set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({{1}, {}} \X {9})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<{}, 9>>, <<{1}, 9>>}"
---*)
