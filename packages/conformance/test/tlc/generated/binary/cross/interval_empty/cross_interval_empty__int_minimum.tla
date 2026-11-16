(*---
description: cross of interval_empty, a IntervalValue, and int_minimum, a IntValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_interval_empty__int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \X ((-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
