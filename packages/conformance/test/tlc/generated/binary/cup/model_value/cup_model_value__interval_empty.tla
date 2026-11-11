(*---
description: cup of model_value, a ModelValue, and interval_empty, a IntervalValue.
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
---- MODULE cup_model_value__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) \cup (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| mv"
---*)
