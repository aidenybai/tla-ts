(*---
description: function_set of set_empty, a SetEnumValue, and string_set, a UserValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_empty__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({}) -> (STRING)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
