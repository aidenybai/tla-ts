(*---
description: Compares interval_empty, a IntervalValue, with set_cup, a SetCupValue.
ref: tlc2/value/impl/IntervalValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_interval_empty__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) = ({1} \cup {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
