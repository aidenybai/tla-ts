(*---
description: function_set of subset, a SubsetValue, and interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_subset__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(SUBSET {1, 2}) -> (3..1)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
