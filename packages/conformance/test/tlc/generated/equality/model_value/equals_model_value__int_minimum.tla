(*---
description: Compares model_value, a ModelValue, with int_minimum, a IntValue.
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
---- MODULE equals_model_value__int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) = ((-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
