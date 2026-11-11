(*---
description: Compares interval_empty, a IntervalValue, with model_value, a ModelValue.
ref: tlc2/value/impl/IntervalValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE equals_interval_empty__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((3..1) = (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
