(*---
description: cross of set_filter, a SetPredValue, and set_of_functions, a SetOfFcnsValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_filter__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x \in 1..3 : x > 1}) \X ([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<2, <<2>>>>, <<2, <<3>>>>, <<3, <<2>>>>, <<3, <<3>>>>}"
---*)
