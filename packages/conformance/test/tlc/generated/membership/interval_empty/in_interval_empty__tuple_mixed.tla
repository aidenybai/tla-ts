(*---
description: Asks whether tuple_mixed is in interval_empty, a IntervalValue.
ref: tlc2/value/impl/IntervalValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_interval_empty__tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, "a", {TRUE}>>) \in (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
