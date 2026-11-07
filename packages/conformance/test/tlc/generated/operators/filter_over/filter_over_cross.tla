(*---
description: filter_over applied to cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetPredValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE filter_over_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({e \in {1, 2} \X {3} : TRUE})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1, 3>>, <<2, 3>>}"
---*)
