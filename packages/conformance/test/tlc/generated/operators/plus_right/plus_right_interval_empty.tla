(*---
description: plus_right applied to interval_empty, a IntervalValue.
ref: tlc2/module/Naturals.java#Plus
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE plus_right_interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(1 + 3..1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
