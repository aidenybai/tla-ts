(*---
description: filter_over applied to interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetPredValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE filter_over_interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({e \in 3..1 : TRUE})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
