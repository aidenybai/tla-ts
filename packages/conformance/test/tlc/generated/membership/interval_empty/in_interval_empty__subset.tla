(*---
description: Asks whether subset is in interval_empty, a IntervalValue.
ref: tlc2/value/impl/IntervalValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_interval_empty__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) \in (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
