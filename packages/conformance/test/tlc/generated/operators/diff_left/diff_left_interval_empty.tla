(*---
description: diff_left applied to interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_left_interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(3..1 \ {1})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
