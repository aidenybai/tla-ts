(*---
description: Compares true, a BoolValue, with model_value, a ModelValue.
ref: tlc2/value/impl/BoolValue.java#equals
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
---- MODULE equals_true__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((TRUE) = (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
