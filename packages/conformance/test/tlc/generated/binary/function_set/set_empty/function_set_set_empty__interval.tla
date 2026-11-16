(*---
description: function_set of set_empty, a SetEnumValue, and interval, a IntervalValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_empty__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({}) -> (1..3)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
