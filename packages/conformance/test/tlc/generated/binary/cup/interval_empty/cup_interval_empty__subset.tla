(*---
description: cup of interval_empty, a IntervalValue, and subset, a SubsetValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_interval_empty__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \cup (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {{}, {1}, {2}, {1, 2}}"
---*)
