(*---
description: funcset_range applied to set_filter, a SetPredValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE funcset_range_set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([{9} -> {x \in 1..3 : x > 1}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {(9 :> 2), (9 :> 3)}"
---*)
