(*---
description: cap of interval_empty, a IntervalValue, and int_maximum, a IntValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_interval_empty__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \cap (2147483647))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
