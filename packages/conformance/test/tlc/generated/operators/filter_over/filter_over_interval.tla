(*---
description: filter_over applied to interval, a IntervalValue.
ref: tlc2/value/impl/SetPredValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE filter_over_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({e \in 1..3 : TRUE})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2, 3}"
---*)
