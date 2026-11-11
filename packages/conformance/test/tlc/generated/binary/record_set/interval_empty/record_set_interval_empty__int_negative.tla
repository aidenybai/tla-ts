(*---
description: record_set of interval_empty, a IntervalValue, and int_negative, a IntValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_interval_empty__int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : (3..1), g : (-3)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
