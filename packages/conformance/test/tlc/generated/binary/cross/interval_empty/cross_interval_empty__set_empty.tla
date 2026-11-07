(*---
description: cross of interval_empty, a IntervalValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_interval_empty__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \X ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
