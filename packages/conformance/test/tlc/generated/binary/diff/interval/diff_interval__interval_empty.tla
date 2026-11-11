(*---
description: diff of interval, a IntervalValue, and interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_interval__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) \ (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2, 3}"
---*)
