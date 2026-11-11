(*---
description: cross_left applied to set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_left_set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({} \X {9})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
