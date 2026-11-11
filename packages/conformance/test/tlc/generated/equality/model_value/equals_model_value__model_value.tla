(*---
description: Compares model_value, a ModelValue, with model_value, a ModelValue.
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
---- MODULE equals_model_value__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) = (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
