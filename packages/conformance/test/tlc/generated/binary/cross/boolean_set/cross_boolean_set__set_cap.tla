(*---
description: cross of boolean_set, a SetEnumValue, and set_cap, a SetCapValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_boolean_set__set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) \X ({1, 2} \cap {2, 3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<FALSE, 2>>, <<TRUE, 2>>}"
---*)
