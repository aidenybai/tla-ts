(*---
description: record_set of interval_empty, a IntervalValue, and seq_set, a UserValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_interval_empty__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : (3..1), g : (Seq({1}))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
