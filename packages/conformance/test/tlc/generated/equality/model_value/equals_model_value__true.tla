(*---
description: Compares model_value, a ModelValue, with true, a BoolValue.
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
---- MODULE equals_model_value__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) = (TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
