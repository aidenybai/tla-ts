(*---
description: Compares model_value, a ModelValue, with cross, a SetOfTuplesValue.
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
---- MODULE equals_model_value__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) = ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
