(*---
description: cross of set_filter, a SetPredValue, and set_ints, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_filter__set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x \in 1..3 : x > 1}) \X ({2, 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<2, 1>>, <<2, 2>>, <<3, 1>>, <<3, 2>>}"
---*)
