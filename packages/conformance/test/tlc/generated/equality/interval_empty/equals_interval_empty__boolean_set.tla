(*---
description: Compares interval_empty, a IntervalValue, with boolean_set, a SetEnumValue.
ref: tlc2/value/impl/IntervalValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_interval_empty__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) = (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
