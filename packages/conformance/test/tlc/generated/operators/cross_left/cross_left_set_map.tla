(*---
description: cross_left applied to set_map, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_left_set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({x + 1 : x \in 1..2} \X {9})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<2, 9>>, <<3, 9>>}"
---*)
