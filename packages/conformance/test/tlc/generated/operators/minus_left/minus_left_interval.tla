(*---
description: minus_left applied to interval, a IntervalValue.
ref: tlc2/module/Naturals.java#Minus
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE minus_left_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(1..3 - 1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1..2"
---*)
