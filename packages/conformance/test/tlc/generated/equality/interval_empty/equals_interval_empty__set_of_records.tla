(*---
description: Compares interval_empty, a IntervalValue, with set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/IntervalValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_interval_empty__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) = ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
