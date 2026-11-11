(*---
description: funcset_range applied to set_cup, a SetCupValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE funcset_range_set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([{9} -> {1} \cup {2}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {(9 :> 1), (9 :> 2)}"
---*)
