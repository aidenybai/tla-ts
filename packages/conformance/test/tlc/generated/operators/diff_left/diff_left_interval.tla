(*---
description: diff_left applied to interval, a IntervalValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_left_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(1..3 \ {1})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2, 3}"
---*)
