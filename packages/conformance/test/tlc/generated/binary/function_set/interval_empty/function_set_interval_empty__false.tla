(*---
description: function_set of interval_empty, a IntervalValue, and false, a BoolValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_interval_empty__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(3..1) -> (FALSE)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
