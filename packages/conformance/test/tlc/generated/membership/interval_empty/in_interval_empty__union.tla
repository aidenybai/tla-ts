(*---
description: Asks whether union is in interval_empty, a IntervalValue.
ref: tlc2/value/impl/IntervalValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_interval_empty__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}}) \in (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
