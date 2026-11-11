(*---
description: function_set of set_empty, a SetEnumValue, and string_empty, a StringValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_empty__string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({}) -> ("")])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
