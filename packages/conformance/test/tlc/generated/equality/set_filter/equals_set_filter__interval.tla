(*---
description: Compares set_filter, a SetPredValue, with interval, a IntervalValue.
ref: tlc2/value/impl/SetPredValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_filter__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x \in 1..3 : x > 1}) = (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
