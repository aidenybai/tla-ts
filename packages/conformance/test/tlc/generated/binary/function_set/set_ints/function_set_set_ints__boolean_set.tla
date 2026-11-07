(*---
description: function_set of set_ints, a SetEnumValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_ints__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({2, 1}) -> (BOOLEAN)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<FALSE, FALSE>>, <<FALSE, TRUE>>, <<TRUE, FALSE>>, <<TRUE, TRUE>>}"
---*)
