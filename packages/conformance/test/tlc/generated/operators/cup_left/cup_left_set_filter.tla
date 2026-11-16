(*---
description: cup_left applied to set_filter, a SetPredValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_left_set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({x \in 1..3 : x > 1} \cup {9})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2, 3, 9}"
---*)
