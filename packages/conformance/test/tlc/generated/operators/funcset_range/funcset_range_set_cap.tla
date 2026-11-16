(*---
description: funcset_range applied to set_cap, a SetCapValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE funcset_range_set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([{9} -> {1, 2} \cap {2, 3}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {(9 :> 2)}"
---*)
