(*---
description: cap of interval, a IntervalValue, and int, a UserValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_interval__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) \cap (Int))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2, 3}"
---*)
