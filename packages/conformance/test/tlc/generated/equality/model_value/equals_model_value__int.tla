(*---
description: Compares model_value, a ModelValue, with int, a UserValue.
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
---- MODULE equals_model_value__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) = (Int))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
