(*---
description: cross_left applied to boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_left_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BOOLEAN \X {9})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<FALSE, 9>>, <<TRUE, 9>>}"
---*)
