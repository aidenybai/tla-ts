(*---
description: diff of interval_empty, a IntervalValue, and true, a BoolValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_interval_empty__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \ (TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
