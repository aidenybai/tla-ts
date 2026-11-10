(*---
description: record_set of set_diff, a SetDiffValue, and interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_diff__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({1, 2} \ {2}), g : (3..1)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
