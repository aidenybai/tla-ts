(*---
description: cup_left applied to interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_left_interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(3..1 \cup {9})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {9}"
---*)
