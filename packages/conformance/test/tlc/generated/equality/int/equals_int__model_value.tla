(*---
description: Compares int, a UserValue, with model_value, a ModelValue.
ref: tlc2/value/impl/UserValue.java#equals
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
---- MODULE equals_int__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((Int) = (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
