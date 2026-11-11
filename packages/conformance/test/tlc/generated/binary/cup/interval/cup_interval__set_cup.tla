(*---
description: cup of interval, a IntervalValue, and set_cup, a SetCupValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_interval__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) \cup ({1} \cup {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2, 3}"
---*)
