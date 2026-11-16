(*---
description: function_set of interval_empty, a IntervalValue, and interval, a IntervalValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_interval_empty__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(3..1) -> (1..3)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
