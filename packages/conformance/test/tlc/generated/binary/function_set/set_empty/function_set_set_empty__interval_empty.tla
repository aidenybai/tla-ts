(*---
description: function_set of set_empty, a SetEnumValue, and interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_empty__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({}) -> (3..1)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
