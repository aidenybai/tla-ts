(*---
description: cap_right applied to interval, a IntervalValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_right_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1, 2} \cap 1..3)
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
