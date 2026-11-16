(*---
description: Compares subset, a SubsetValue, with model_value, a ModelValue.
ref: tlc2/value/impl/SubsetValue.java#equals
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
---- MODULE equals_subset__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((SUBSET {1, 2}) = (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
