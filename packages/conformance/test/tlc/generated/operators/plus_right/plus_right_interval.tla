(*---
description: plus_right applied to interval, a IntervalValue.
ref: tlc2/module/Naturals.java#Plus
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE plus_right_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(1 + 1..3)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2..3"
---*)
