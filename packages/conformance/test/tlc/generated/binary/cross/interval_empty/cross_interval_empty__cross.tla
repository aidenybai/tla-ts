(*---
description: cross of interval_empty, a IntervalValue, and cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_interval_empty__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \X ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
