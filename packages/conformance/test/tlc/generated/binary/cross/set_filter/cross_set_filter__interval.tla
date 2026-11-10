(*---
description: cross of set_filter, a SetPredValue, and interval, a IntervalValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_filter__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x \in 1..3 : x > 1}) \X (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<2, 1>>, <<2, 2>>, <<2, 3>>, <<3, 1>>, <<3, 2>>, <<3, 3>>}"
---*)
