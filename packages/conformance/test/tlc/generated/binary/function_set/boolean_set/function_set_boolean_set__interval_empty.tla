(*---
description: function_set of boolean_set, a SetEnumValue, and interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_boolean_set__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(BOOLEAN) -> (3..1)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
