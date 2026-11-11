(*---
description: function_set of interval_empty, a IntervalValue, and string_a, a StringValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_interval_empty__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(3..1) -> ("a")])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
