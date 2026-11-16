(*---
description: diff of interval_empty, a IntervalValue, and seq_set, a UserValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_interval_empty__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \ (Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
