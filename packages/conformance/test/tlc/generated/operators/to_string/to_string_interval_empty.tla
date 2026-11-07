(*---
description: to_string applied to interval_empty, a IntervalValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString(3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "{}"'
---*)
