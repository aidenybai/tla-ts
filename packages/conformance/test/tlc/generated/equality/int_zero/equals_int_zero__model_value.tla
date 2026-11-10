(*---
description: Compares int_zero, a IntValue, with model_value, a ModelValue.
ref: tlc2/value/impl/IntValue.java#equals
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
---- MODULE equals_int_zero__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((0) = (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
