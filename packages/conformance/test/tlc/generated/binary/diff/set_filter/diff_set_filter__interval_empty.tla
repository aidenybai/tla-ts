(*---
description: diff of set_filter, a SetPredValue, and interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_filter__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x \in 1..3 : x > 1}) \ (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2, 3}"
---*)
