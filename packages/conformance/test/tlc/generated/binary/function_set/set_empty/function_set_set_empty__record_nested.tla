(*---
description: function_set of set_empty, a SetEnumValue, and record_nested, a RecordValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_empty__record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({}) -> ([a |-> [b |-> <<1>>]])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
