(*---
description: Compares interval_empty, a IntervalValue, with interval, a IntervalValue.
ref: tlc2/value/impl/IntervalValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_interval_empty__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) = (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
