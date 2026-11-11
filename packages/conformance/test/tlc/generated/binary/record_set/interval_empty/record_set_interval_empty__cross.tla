(*---
description: record_set of interval_empty, a IntervalValue, and cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_interval_empty__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : (3..1), g : ({1, 2} \X {3})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
