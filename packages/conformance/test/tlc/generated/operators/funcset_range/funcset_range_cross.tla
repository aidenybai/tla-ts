(*---
description: funcset_range applied to cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE funcset_range_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([{9} -> {1, 2} \X {3}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {(9 :> <<1, 3>>), (9 :> <<2, 3>>)}"
---*)
