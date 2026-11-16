(*---
description: function_set of set_diff, a SetDiffValue, and set_of_functions, a SetOfFcnsValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_diff__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({1, 2} \ {2}) -> ([{1} -> {2, 3}])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<<<2>>>>, <<<<3>>>>}"
---*)
