(*---
description: Compares set_filter, a SetPredValue, with model_value, a ModelValue.
ref: tlc2/value/impl/SetPredValue.java#equals
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
---- MODULE equals_set_filter__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(({x \in 1..3 : x > 1}) = (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
