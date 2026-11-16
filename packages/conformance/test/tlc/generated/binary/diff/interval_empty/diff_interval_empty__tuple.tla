(*---
description: diff of interval_empty, a IntervalValue, and tuple, a TupleValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_interval_empty__tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \ (<<1, 2>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
