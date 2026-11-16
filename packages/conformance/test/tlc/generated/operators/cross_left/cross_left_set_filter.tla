(*---
description: cross_left applied to set_filter, a SetPredValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_left_set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({x \in 1..3 : x > 1} \X {9})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<2, 9>>, <<3, 9>>}"
---*)
