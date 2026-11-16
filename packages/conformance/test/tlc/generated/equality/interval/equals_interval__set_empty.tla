(*---
description: Compares interval, a IntervalValue, with set_empty, a SetEnumValue.
ref: tlc2/value/impl/IntervalValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_interval__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) = ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
