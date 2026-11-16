(*---
description: diff of interval_empty, a IntervalValue, and set_mixed, a SetEnumValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_interval_empty__set_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \ ({1, "a"}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
