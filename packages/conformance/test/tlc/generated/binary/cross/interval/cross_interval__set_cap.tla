(*---
description: cross of interval, a IntervalValue, and set_cap, a SetCapValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_interval__set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) \X ({1, 2} \cap {2, 3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1, 2>>, <<2, 2>>, <<3, 2>>}"
---*)
