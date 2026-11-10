(*---
description: cup of interval_empty, a IntervalValue, and model_value, a ModelValue.
ref: tlc2/value/impl/SetCupValue.java
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
---- MODULE cup_interval_empty__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((3..1) \cup (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| mv"
---*)
