(*---
description: cross of boolean_set, a SetEnumValue, and set_ints, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_boolean_set__set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) \X ({2, 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<FALSE, 1>>, <<FALSE, 2>>, <<TRUE, 1>>, <<TRUE, 2>>}"
---*)
