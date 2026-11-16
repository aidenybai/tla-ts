(*---
description: diff of interval, a IntervalValue, and int, a UserValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_interval__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) \ (Int))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
