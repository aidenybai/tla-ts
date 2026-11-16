(*---
description: cross of boolean_set, a SetEnumValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_boolean_set__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) \X (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<FALSE, FALSE>>, <<FALSE, TRUE>>, <<TRUE, FALSE>>, <<TRUE, TRUE>>}"
---*)
