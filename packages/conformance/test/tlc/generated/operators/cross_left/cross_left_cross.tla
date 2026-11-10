(*---
description: cross_left applied to cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_left_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1, 2} \X {3} \X {9})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1, 3, 9>>, <<2, 3, 9>>}"
---*)
