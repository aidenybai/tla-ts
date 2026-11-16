(*---
description: function_set of set_empty, a SetEnumValue, and int_minimum, a IntValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_empty__int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({}) -> ((-2147483647 - 1))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
