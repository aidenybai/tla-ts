(*---
description: funcset_range applied to set_ints, a SetEnumValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE funcset_range_set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([{9} -> {2, 1}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {(9 :> 1), (9 :> 2)}"
---*)
