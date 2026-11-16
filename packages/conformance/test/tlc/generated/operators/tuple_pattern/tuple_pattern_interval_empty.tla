(*---
description: tuple_pattern applied to interval_empty, a IntervalValue.
ref: tlc2/util/Context.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tuple_pattern_interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({a : <<a, b>> \in 3..1})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
