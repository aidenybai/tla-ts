(*---
description: function_set of set_empty, a SetEnumValue, and tuple_empty, a TupleValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_empty__tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({}) -> (<<>>)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
