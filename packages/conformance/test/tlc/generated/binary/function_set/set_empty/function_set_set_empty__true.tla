(*---
description: function_set of set_empty, a SetEnumValue, and true, a BoolValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_empty__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({}) -> (TRUE)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
