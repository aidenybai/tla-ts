(*---
description: cup of interval_empty, a IntervalValue, and int_zero, a IntValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_interval_empty__int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \cup (0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
