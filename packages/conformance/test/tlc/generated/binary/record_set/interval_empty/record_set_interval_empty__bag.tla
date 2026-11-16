(*---
description: record_set of interval_empty, a IntervalValue, and bag, a FcnRcdValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_interval_empty__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : (3..1), g : (SetToBag({1}))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
