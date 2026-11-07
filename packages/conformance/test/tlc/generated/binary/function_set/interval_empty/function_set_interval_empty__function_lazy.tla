(*---
description: function_set of interval_empty, a IntervalValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_interval_empty__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(3..1) -> ([x \in Nat |-> x])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
