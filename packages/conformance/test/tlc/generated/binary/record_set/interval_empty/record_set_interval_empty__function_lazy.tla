(*---
description: record_set of interval_empty, a IntervalValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_interval_empty__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : (3..1), g : ([x \in Nat |-> x])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
