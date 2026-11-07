(*---
description: cap of int, a UserValue, and interval, a IntervalValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_int__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Int) \cap (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2, 3}"
---*)
