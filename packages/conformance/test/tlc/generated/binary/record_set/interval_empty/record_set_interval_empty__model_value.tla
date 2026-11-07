(*---
description: record_set of interval_empty, a IntervalValue, and model_value, a ModelValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
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
---- MODULE record_set_interval_empty__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT([f : (3..1), g : (mv)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
