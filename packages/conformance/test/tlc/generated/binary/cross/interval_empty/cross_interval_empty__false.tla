(*---
description: cross of interval_empty, a IntervalValue, and false, a BoolValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_interval_empty__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \X (FALSE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
