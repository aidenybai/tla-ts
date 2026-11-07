(*---
description: cup of set_empty, a SetEnumValue, and set_of_functions, a SetOfFcnsValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_empty__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cup ([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<2>>, <<3>>}"
---*)
