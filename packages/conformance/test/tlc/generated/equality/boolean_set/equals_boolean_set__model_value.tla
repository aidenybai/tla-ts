(*---
description: Compares boolean_set, a SetEnumValue, with model_value, a ModelValue.
ref: tlc2/value/impl/SetEnumValue.java#equals
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
---- MODULE equals_boolean_set__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((BOOLEAN) = (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
