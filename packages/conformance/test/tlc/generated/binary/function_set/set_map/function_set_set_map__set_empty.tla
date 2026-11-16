(*---
description: function_set of set_map, a SetEnumValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_map__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({x + 1 : x \in 1..2}) -> ({})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
