(*---
description: Compares model_value, a ModelValue, with interval_empty, a IntervalValue.
ref: tlc2/value/impl/ModelValue.java#equals
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
---- MODULE equals_model_value__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) = (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
