(*---
description: function_set of set_empty, a SetEnumValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_empty__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({}) -> ([x \in Nat |-> x])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
