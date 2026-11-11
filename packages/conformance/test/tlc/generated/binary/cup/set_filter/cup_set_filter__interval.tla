(*---
description: cup of set_filter, a SetPredValue, and interval, a IntervalValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_filter__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x \in 1..3 : x > 1}) \cup (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2, 3}"
---*)
