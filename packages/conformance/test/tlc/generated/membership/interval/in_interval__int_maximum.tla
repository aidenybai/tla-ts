(*---
description: Asks whether int_maximum is in interval, a IntervalValue.
ref: tlc2/value/impl/IntervalValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_interval__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((2147483647) \in (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
