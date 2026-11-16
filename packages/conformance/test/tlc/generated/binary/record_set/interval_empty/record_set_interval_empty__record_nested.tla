(*---
description: record_set of interval_empty, a IntervalValue, and record_nested, a RecordValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_interval_empty__record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : (3..1), g : ([a |-> [b |-> <<1>>]])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
