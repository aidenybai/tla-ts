(*---
description: function_set of set_cup, a SetCupValue, and set_filter, a SetPredValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_cup__set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({1} \cup {2}) -> ({x \in 1..3 : x > 1})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<2, 2>>, <<2, 3>>, <<3, 2>>, <<3, 3>>}"
---*)
