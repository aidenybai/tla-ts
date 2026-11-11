(*---
description: Compares int_one, a IntValue, with model_value, a ModelValue.
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
---- MODULE equals_int_one__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((1) = (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
