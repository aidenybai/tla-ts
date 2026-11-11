(*---
description: Compares model_value, a ModelValue, with string_set, a UserValue.
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
---- MODULE equals_model_value__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) = (STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
