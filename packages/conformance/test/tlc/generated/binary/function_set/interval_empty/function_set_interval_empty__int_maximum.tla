(*---
description: function_set of interval_empty, a IntervalValue, and int_maximum, a IntValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_interval_empty__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(3..1) -> (2147483647)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
