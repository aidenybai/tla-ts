(*---
description: cup_left applied to interval, a IntervalValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_left_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(1..3 \cup {9})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2, 3, 9}"
---*)
