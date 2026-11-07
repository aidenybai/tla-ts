(*---
description: cross of boolean_set, a SetEnumValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_boolean_set__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) \X ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
