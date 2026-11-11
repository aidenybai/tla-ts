(*---
description: function_set of interval_empty, a IntervalValue, and function, a FcnRcdValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_interval_empty__function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(3..1) -> ([x \in {1, 2} |-> x * 2])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
