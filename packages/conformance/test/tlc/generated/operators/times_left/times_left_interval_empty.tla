(*---
description: times_left applied to interval_empty, a IntervalValue.
ref: tlc2/module/Naturals.java#Times
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE times_left_interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(3..1 * 2)
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
