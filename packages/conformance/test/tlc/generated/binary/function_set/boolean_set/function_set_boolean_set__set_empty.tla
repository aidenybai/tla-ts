(*---
description: function_set of boolean_set, a SetEnumValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_boolean_set__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(BOOLEAN) -> ({})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
