(*---
description: cap of interval, a IntervalValue, and interval, a IntervalValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_interval__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) \cap (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2, 3}"
---*)
