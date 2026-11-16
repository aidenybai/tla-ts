(*---
description: Compares model_value, a ModelValue, with set_mixed, a SetEnumValue.
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
---- MODULE equals_model_value__set_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) = ({1, "a"}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
