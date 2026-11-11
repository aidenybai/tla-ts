(*---
description: diff_right applied to interval, a IntervalValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_right_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1, 2} \ 1..3)
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
