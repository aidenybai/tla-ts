(*---
description: function_set of set_empty, a SetEnumValue, and model_value, a ModelValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE function_set_set_empty__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT([({}) -> (mv)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
