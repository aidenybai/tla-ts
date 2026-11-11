(*---
description: function_set of set_empty, a SetEnumValue, and false, a BoolValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_empty__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({}) -> (FALSE)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
