(*---
description: filter_over applied to set_filter, a SetPredValue.
ref: tlc2/value/impl/SetPredValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE filter_over_set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({e \in {x \in 1..3 : x > 1} : TRUE})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2, 3}"
---*)
