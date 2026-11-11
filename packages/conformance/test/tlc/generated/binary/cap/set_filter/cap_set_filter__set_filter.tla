(*---
description: cap of set_filter, a SetPredValue, and set_filter, a SetPredValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_filter__set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x \in 1..3 : x > 1}) \cap ({x \in 1..3 : x > 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2, 3}"
---*)
