(*---
description: cross of interval, a IntervalValue, and set_filter, a SetPredValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_interval__set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) \X ({x \in 1..3 : x > 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1, 2>>, <<1, 3>>, <<2, 2>>, <<2, 3>>, <<3, 2>>, <<3, 3>>}"
---*)
