(*---
description: to_string applied to interval, a IntervalValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString(1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "1..3"'
---*)
