(*---
description: cross of boolean_set, a SetEnumValue, and set_nested, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_boolean_set__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) \X ({{1}, {}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<FALSE, {}>>, <<FALSE, {1}>>, <<TRUE, {}>>, <<TRUE, {1}>>}"
---*)
