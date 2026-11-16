(*---
description: function_set of interval_empty, a IntervalValue, and string_set, a UserValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_interval_empty__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(3..1) -> (STRING)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
