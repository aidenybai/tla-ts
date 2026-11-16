(*---
description: cross of boolean_set, a SetEnumValue, and set_cup, a SetCupValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_boolean_set__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) \X ({1} \cup {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<FALSE, 1>>, <<FALSE, 2>>, <<TRUE, 1>>, <<TRUE, 2>>}"
---*)
