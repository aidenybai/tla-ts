(*---
description: cap of interval_empty, a IntervalValue, and subset, a SubsetValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_interval_empty__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \cap (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
