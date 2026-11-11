(*---
description: Asks whether set_cap is in interval_empty, a IntervalValue.
ref: tlc2/value/impl/IntervalValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_interval_empty__set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \cap {2, 3}) \in (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
