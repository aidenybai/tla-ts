(*---
description: record_set of subset, a SubsetValue, and interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_subset__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : (SUBSET {1, 2}), g : (3..1)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
