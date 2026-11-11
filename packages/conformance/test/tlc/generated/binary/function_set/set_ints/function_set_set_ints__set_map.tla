(*---
description: function_set of set_ints, a SetEnumValue, and set_map, a SetEnumValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_ints__set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({2, 1}) -> ({x + 1 : x \in 1..2})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<2, 2>>, <<2, 3>>, <<3, 2>>, <<3, 3>>}"
---*)
